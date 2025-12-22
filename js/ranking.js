/**
 * 排品功能模块
 * ========================================
 * 数据：从 ranking_data + inventory_data + product_id_data 汇总
 * 配置：从 ranking_config 表读取
 * 输出：写入 ranking_results 表
 */

// ========================================
// 数据汇总 - 从三个表读取并合并
// ========================================
async function loadCombinedProductData() {
    const client = window.supabaseClient;
    if (!client) throw new Error('Supabase 未初始化');

    // 并行读取三个表
    const [rankingRes, inventoryRes, productIdRes] = await Promise.all([
        client.from('ranking_data').select('*'),
        client.from('inventory_data').select('*'),
        client.from('product_id_data').select('*')
    ]);

    if (rankingRes.error) throw new Error('读取 ranking_data 失败: ' + rankingRes.error.message);
    if (inventoryRes.error) throw new Error('读取 inventory_data 失败: ' + inventoryRes.error.message);
    if (productIdRes.error) throw new Error('读取 product_id_data 失败: ' + productIdRes.error.message);

    // 以商品名称为主键合并
    const combinedMap = new Map();

    // 1. 先加入库存数据（基础数据）
    (inventoryRes.data || []).forEach(item => {
        combinedMap.set(item.product_name, {
            product_name: item.product_name,
            available_qty: item.available_qty || 0,
            actual_stock: item.actual_stock || 0,
            virtual_category: item.virtual_category || '',
            product_category: item.product_category || '',
            image_url: item.image_url || '',
            warehouse: item.warehouse || ''
        });
    });

    // 2. 合并排名数据
    (rankingRes.data || []).forEach(item => {
        const existing = combinedMap.get(item.product_name) || { product_name: item.product_name };
        combinedMap.set(item.product_name, {
            ...existing,
            total_score: item.total_score || 0,
            sales_amount: item.sales_amount || 0,
            lecture_count: item.lecture_count || 0,
            exposure_rate: item.exposure_rate || 0,
            conversion_rate: item.conversion_rate || 0
        });
    });

    // 3. 合并商品ID数据
    (productIdRes.data || []).forEach(item => {
        const existing = combinedMap.get(item.product_name) || { product_name: item.product_name };
        combinedMap.set(item.product_name, {
            ...existing,
            product_id: item.product_id || '',
            store_category: item.store_category || '',
            product_price: item.product_price || 0
        });
    });

    // 转为数组并计算评分排名
    const products = Array.from(combinedMap.values());

    // 按 total_score 降序排序，计算排名（分数越高排名越前）
    const sortedByScore = [...products].sort((a, b) => (b.total_score || 0) - (a.total_score || 0));
    sortedByScore.forEach((p, idx) => {
        const product = products.find(x => x.product_name === p.product_name);
        if (product) {
            product.rating_rank = idx + 1;  // 排名从1开始
        }
    });

    return products;
}

// ========================================
// 配置读取/保存
// ========================================
async function loadRankingConfig(configKey = 'filter_config') {
    const client = window.supabaseClient;
    if (!client) return null;

    const { data, error } = await client
        .from('ranking_config')
        .select('config_value')
        .eq('config_key', configKey)
        .single();

    if (error) {
        console.warn('加载配置失败:', error.message);
        return getDefaultRankingConfig();
    }
    return data?.config_value || getDefaultRankingConfig();
}

async function saveRankingConfig(configKey, configValue) {
    const client = window.supabaseClient;
    if (!client) throw new Error('Supabase 未初始化');

    const { error } = await client
        .from('ranking_config')
        .upsert({
            config_key: configKey,
            config_value: configValue,
            updated_at: new Date().toISOString()
        }, { onConflict: 'config_key' });

    if (error) throw new Error('保存配置失败: ' + error.message);
    return true;
}

// 默认配置
function getDefaultRankingConfig() {
    return {
        分类排序: [
            "评分品A筛选条件",
            "佩戴品筛选条件",
            "周边品筛选条件",
            "评分品B筛选条件",
            "库存品筛选条件"
        ],
        结果映射: {
            "评分品A筛选条件": "1.评分品A",
            "佩戴品筛选条件": "2.佩戴品",
            "周边品筛选条件": "3.周边品",
            "评分品B筛选条件": "4.评分品B",
            "库存品筛选条件": "5.库存品"
        },
        样品序号规则: {
            "1.评分品A": { prefix: "A", start: 2, step: 2 },
            "2.佩戴品": { prefix: "P", start: 1, step: 1 },
            "3.周边品": { prefix: "Z", start: 1, step: 1 },
            "4.评分品B": { prefix: "B", start: 1, step: 1 },
            "5.库存品": { prefix: "A", start: 22, step: 2 }
        },
        筛选条件: {
            "评分品A筛选条件": {
                "virtual_category": { "等于": ["可预售"], "启用": true },
                "actual_stock": { "大于等于": 1, "启用": true },
                "rating_rank": { "前几名": 10, "启用": true, "排序方式": "升序" }
            },
            "佩戴品筛选条件": {
                "is_wearable": { "排除": ["不可佩戴"], "启用": true },
                "product_category": {
                    "包含": ["发圈", "发夹 - 鸭嘴夹", "周边 - 项链", "周边 - 戒指", "周边 - 手链", "周边 - 耳钉", "周边 - 胸针"],
                    "启用": true
                },
                "available_qty": { "大于等于": 3, "启用": true },
                "按子分类分别筛选": true,
                "子分类字段": "product_category"
            },
            "周边品筛选条件": {
                "product_category": { "包含": ["周边"], "启用": true },
                "available_qty": { "前几名": 4, "启用": true }
            },
            "评分品B筛选条件": {
                "available_qty": { "大于等于": 1, "启用": true },
                "rating_rank": { "前几名": 15, "启用": true, "排序方式": "升序" }
            },
            "库存品筛选条件": {
                "available_qty": { "前几名": 10, "启用": true }
            }
        }
    };
}

// ========================================
// 排品计算引擎
// ========================================
function calculateRanking(products, config) {
    const usedProducts = new Set();
    const results = {};

    for (const category of config.分类排序) {
        const conditions = config.筛选条件[category];
        if (!conditions) continue;

        // 获取未使用的商品
        let available = products.filter(p => !usedProducts.has(p.product_name));

        // 应用筛选条件
        if (category.includes('库存品')) {
            // 库存品特殊逻辑：从剩余商品中按可用数排序
            available = available.sort((a, b) => (b.available_qty || 0) - (a.available_qty || 0));
            const limit = conditions.available_qty?.前几名 || 10;
            available = available.slice(0, limit);
        } else if (conditions.按子分类分别筛选) {
            // 按子分类分别筛选
            available = filterBySubcategory(available, conditions);
        } else {
            // 普通筛选
            available = applyFilters(available, conditions);
        }

        // 标记为已使用
        available.forEach(p => usedProducts.add(p.product_name));

        // 存储结果
        const resultLabel = config.结果映射[category] || category;
        results[resultLabel] = available;
    }

    return results;
}

function applyFilters(products, conditions) {
    let filtered = [...products];

    for (const [field, condition] of Object.entries(conditions)) {
        if (field === '按子分类分别筛选' || field === '子分类字段') continue;
        if (!condition.启用) continue;

        if (condition.大于等于 !== undefined) {
            filtered = filtered.filter(p => (p[field] || 0) >= condition.大于等于);
        }
        if (condition.小于等于 !== undefined) {
            filtered = filtered.filter(p => (p[field] || 0) <= condition.小于等于);
        }
        if (condition.等于) {
            const values = Array.isArray(condition.等于) ? condition.等于 : [condition.等于];
            filtered = filtered.filter(p => values.includes(p[field]));
        }
        if (condition.包含) {
            const values = Array.isArray(condition.包含) ? condition.包含 : [condition.包含];
            filtered = filtered.filter(p => {
                const fieldValue = p[field] || '';
                return values.some(v => fieldValue.includes(v));
            });
        }
        if (condition.排除) {
            const values = Array.isArray(condition.排除) ? condition.排除 : [condition.排除];
            filtered = filtered.filter(p => {
                const fieldValue = p[field] || '';
                return !values.some(v => fieldValue.includes(v));
            });
        }
        if (condition.前几名) {
            // 支持升序/降序排序（升序用于排名字段，越小越好）
            const ascending = condition.排序方式 === '升序';
            if (ascending) {
                filtered = filtered.sort((a, b) => (a[field] || 999999) - (b[field] || 999999));
            } else {
                filtered = filtered.sort((a, b) => (b[field] || 0) - (a[field] || 0));
            }
            filtered = filtered.slice(0, condition.前几名);
        }
    }

    return filtered;
}

function filterBySubcategory(products, conditions) {
    const subField = conditions.子分类字段 || 'product_category';
    const subCategories = new Map();

    // 先应用基础筛选条件
    let filtered = applyFilters(products, conditions);

    // 按子分类分组
    filtered.forEach(p => {
        const subCat = p[subField] || '其他';
        if (!subCategories.has(subCat)) {
            subCategories.set(subCat, []);
        }
        subCategories.get(subCat).push(p);
    });

    // 每个子分类取可用数最大的一个
    const result = [];
    subCategories.forEach(items => {
        items.sort((a, b) => (b.available_qty || 0) - (a.available_qty || 0));
        if (items.length > 0) {
            result.push(items[0]);
        }
    });

    return result;
}

// ========================================
// 样品序号分配
// ========================================
function assignSampleNumbers(rankingResults, config) {
    const finalResults = [];

    for (const [category, products] of Object.entries(rankingResults)) {
        const rule = config.样品序号规则[category] || { prefix: 'X', start: 1, step: 1 };
        let num = rule.start;

        products.forEach(product => {
            const sampleNumber = `${rule.prefix}${String(num).padStart(2, '0')}`;
            finalResults.push({
                ...product,
                ranking_result: category,
                sample_number: sampleNumber
            });
            num += rule.step;
        });
    }

    return finalResults;
}

// ========================================
// 结果保存到数据库
// ========================================
async function saveRankingResults(results) {
    const client = window.supabaseClient;
    if (!client) throw new Error('Supabase 未初始化');

    // 先清空现有结果
    await client.from('ranking_results').delete().gte('id', 0);

    // 准备插入数据
    const records = results.map(r => ({
        product_name: r.product_name,
        product_id: r.product_id || '',
        ranking_result: r.ranking_result,
        sample_number: r.sample_number
    }));

    // 批量插入
    const batchSize = 100;
    for (let i = 0; i < records.length; i += batchSize) {
        const batch = records.slice(i, i + batchSize);
        const { error } = await client.from('ranking_results').insert(batch);
        if (error) throw new Error('保存结果失败: ' + error.message);
    }

    return records.length;
}

// ========================================
// 页面生成
// ========================================
function generateRankingPage() {
    return `
        <div class="ranking-page">
            <div class="page-intro">
                <h2>📋 排品计算</h2>
                <p>从三个数据表汇总商品数据，按配置规则进行排品计算</p>
            </div>
            
            <div class="upload-blocks-grid">
                <!-- 数据加载区块 -->
                <div class="upload-block" id="block-ranking-data">
                    <div class="upload-block-header">
                        <h3>📦 数据汇总 <span class="db-table-tag">ranking_data + inventory_data + product_id_data</span></h3>
                    </div>
                    
                    <div class="ranking-stats" id="rankingStats">
                        <div class="stat-item">
                            <span class="stat-label">排名数据</span>
                            <span class="stat-value" id="statRanking">--</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">库存数据</span>
                            <span class="stat-value" id="statInventory">--</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">商品ID</span>
                            <span class="stat-value" id="statProductId">--</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">汇总商品</span>
                            <span class="stat-value" id="statCombined">--</span>
                        </div>
                    </div>
                    
                    <div class="upload-actions">
                        <button class="btn btn-primary" id="btnLoadData">加载数据</button>
                        <button class="btn btn-secondary" id="btnCalculate" disabled>计算排品</button>
                    </div>
                </div>
                
                <!-- 结果区块 -->
                <div class="upload-block upload-block-scrollable" id="block-ranking-result">
                    <div class="upload-block-header">
                        <h3>📊 排品结果 <span class="db-table-tag">→ ranking_results</span></h3>
                    </div>
                    
                    <div class="scrollable-content" id="rankingResultContent">
                        <div class="placeholder-content">
                            <p>请先加载数据并计算排品</p>
                        </div>
                    </div>
                    
                    <div class="upload-actions">
                        <button class="btn btn-primary" id="btnSaveResults" disabled>保存结果到数据库</button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function generateRankingSettingsPage() {
    return `
        <div class="ranking-settings-page">
            <div class="page-intro">
                <h2>⚙️ 排品设置</h2>
                <p>配置筛选规则和样品序号规则，设置自动保存到数据库</p>
            </div>
            
            <div class="settings-container">
                <!-- 分类排序设置 -->
                <div class="card">
                    <div class="card-header">
                        <h3>📑 分类排序</h3>
                    </div>
                    <div class="card-body">
                        <p class="setting-hint">拖拽调整筛选分类的优先顺序（排在前面的分类先选商品）</p>
                        <ul class="sortable-list" id="categoryOrderList"></ul>
                    </div>
                </div>
                
                <!-- 筛选条件设置 -->
                <div class="card">
                    <div class="card-header">
                        <h3>🔍 筛选条件</h3>
                    </div>
                    <div class="card-body" id="filterConditionsContainer">
                        <p>加载中...</p>
                    </div>
                </div>
                
                <!-- 样品序号规则 -->
                <div class="card">
                    <div class="card-header">
                        <h3>🔢 样品序号规则</h3>
                    </div>
                    <div class="card-body" id="sampleNumberRulesContainer">
                        <p>加载中...</p>
                    </div>
                </div>
                
                <div class="settings-actions">
                    <button class="btn btn-primary" id="btnSaveSettings">保存设置</button>
                    <button class="btn btn-secondary" id="btnResetSettings">重置为默认</button>
                </div>
            </div>
        </div>
    `;
}

// ========================================
// 初始化
// ========================================
let cachedProducts = [];
let cachedResults = [];

async function initRankingPage() {
    const btnLoadData = document.getElementById('btnLoadData');
    const btnCalculate = document.getElementById('btnCalculate');
    const btnSaveResults = document.getElementById('btnSaveResults');

    if (btnLoadData) {
        btnLoadData.addEventListener('click', async () => {
            try {
                btnLoadData.disabled = true;
                btnLoadData.textContent = '加载中...';

                // 获取各表统计
                const client = window.supabaseClient;
                const [r1, r2, r3] = await Promise.all([
                    client.from('ranking_data').select('*', { count: 'exact', head: true }),
                    client.from('inventory_data').select('*', { count: 'exact', head: true }),
                    client.from('product_id_data').select('*', { count: 'exact', head: true })
                ]);

                document.getElementById('statRanking').textContent = r1.count || 0;
                document.getElementById('statInventory').textContent = r2.count || 0;
                document.getElementById('statProductId').textContent = r3.count || 0;

                // 汇总数据
                cachedProducts = await loadCombinedProductData();
                document.getElementById('statCombined').textContent = cachedProducts.length;

                btnCalculate.disabled = false;
                window.AppUtils?.showToast?.('数据加载完成', 'success');
            } catch (error) {
                console.error('加载失败:', error);
                window.AppUtils?.showToast?.('加载失败: ' + error.message, 'error');
            } finally {
                btnLoadData.disabled = false;
                btnLoadData.textContent = '加载数据';
            }
        });
    }

    if (btnCalculate) {
        btnCalculate.addEventListener('click', async () => {
            try {
                btnCalculate.disabled = true;
                btnCalculate.textContent = '计算中...';

                // 加载配置
                const config = await loadRankingConfig();

                // 执行排品计算
                const rankingResults = calculateRanking(cachedProducts, config);

                // 分配样品序号
                cachedResults = assignSampleNumbers(rankingResults, config);

                // 显示结果
                renderRankingResults(cachedResults);

                btnSaveResults.disabled = false;
                window.AppUtils?.showToast?.(`排品完成，共 ${cachedResults.length} 个商品`, 'success');
            } catch (error) {
                console.error('计算失败:', error);
                window.AppUtils?.showToast?.('计算失败: ' + error.message, 'error');
            } finally {
                btnCalculate.disabled = false;
                btnCalculate.textContent = '计算排品';
            }
        });
    }

    if (btnSaveResults) {
        btnSaveResults.addEventListener('click', async () => {
            try {
                btnSaveResults.disabled = true;
                btnSaveResults.textContent = '保存中...';

                const count = await saveRankingResults(cachedResults);
                window.AppUtils?.showToast?.(`已保存 ${count} 条结果到数据库`, 'success');
            } catch (error) {
                console.error('保存失败:', error);
                window.AppUtils?.showToast?.('保存失败: ' + error.message, 'error');
            } finally {
                btnSaveResults.disabled = false;
                btnSaveResults.textContent = '保存结果到数据库';
            }
        });
    }
}

function renderRankingResults(results) {
    const container = document.getElementById('rankingResultContent');
    if (!container) return;

    // 按分类分组
    const grouped = {};
    results.forEach(r => {
        if (!grouped[r.ranking_result]) grouped[r.ranking_result] = [];
        grouped[r.ranking_result].push(r);
    });

    let html = '';
    for (const [category, items] of Object.entries(grouped)) {
        html += `
            <div class="result-category">
                <h4>${category} <span class="count">(${items.length})</span></h4>
                <div class="result-items">
                    ${items.map(item => `
                        <div class="result-item">
                            <span class="sample-number">${item.sample_number}</span>
                            <span class="product-name">${item.product_name}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    container.innerHTML = html || '<p class="placeholder">无排品结果</p>';
}

async function initRankingSettings() {
    const config = await loadRankingConfig();

    // 渲染分类排序
    const orderList = document.getElementById('categoryOrderList');
    if (orderList) {
        orderList.innerHTML = config.分类排序.map((cat, idx) => `
            <li class="sortable-item" data-category="${cat}">
                <span class="drag-handle">☰</span>
                <span class="category-name">${config.结果映射[cat] || cat}</span>
            </li>
        `).join('');
    }

    // 保存按钮
    const btnSave = document.getElementById('btnSaveSettings');
    if (btnSave) {
        btnSave.addEventListener('click', async () => {
            try {
                btnSave.disabled = true;
                btnSave.textContent = '保存中...';

                // 获取当前排序
                const newOrder = Array.from(orderList?.querySelectorAll('.sortable-item') || [])
                    .map(li => li.dataset.category);
                config.分类排序 = newOrder;

                await saveRankingConfig('filter_config', config);
                window.AppUtils?.showToast?.('设置已保存', 'success');
            } catch (error) {
                window.AppUtils?.showToast?.('保存失败: ' + error.message, 'error');
            } finally {
                btnSave.disabled = false;
                btnSave.textContent = '保存设置';
            }
        });
    }

    // 重置按钮
    const btnReset = document.getElementById('btnResetSettings');
    if (btnReset) {
        btnReset.addEventListener('click', async () => {
            if (confirm('确定要重置为默认配置吗？')) {
                await saveRankingConfig('filter_config', getDefaultRankingConfig());
                location.reload();
            }
        });
    }
}

// ========================================
// 导出加载函数
// ========================================
window.loadRankingPage = function (pageId) {
    if (pageId === 'ranking' || pageId === 'ranking-calculate') {
        return {
            html: generateRankingPage(),
            init: initRankingPage
        };
    }
    if (pageId === 'ranking-settings') {
        return {
            html: generateRankingSettingsPage(),
            init: initRankingSettings
        };
    }
    return null;
};
