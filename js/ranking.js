/**
 * 排品功能模块
 * ========================================
 * 数据：从 product_ranking_view + inventory_data 汇总
 * 新品：从 new_product_data 读取
 * 配置：从 ranking_config 表读取
 * 输出：写入 ranking_results 表
 */

// ========================================
// 数据汇总 - 从评分视图 + 库存表读取并合并
// ========================================
async function loadCombinedProductData() {
    const client = window.supabaseClient;
    if (!client) throw new Error('Supabase 未初始化');

    // 并行读取评分视图和库存表
    const [rankingViewRes, inventoryRes] = await Promise.all([
        client.from('product_ranking_view').select('*'),
        client.from('inventory_data').select('*')
    ]);

    if (rankingViewRes.error) throw new Error('读取 product_ranking_view 失败: ' + rankingViewRes.error.message);
    if (inventoryRes.error) throw new Error('读取 inventory_data 失败: ' + inventoryRes.error.message);

    const rawInventory = inventoryRes.data || [];
    const rawCount = rawInventory.length;

    // ========================================
    // 库存数据本地去重（以商品名称为主键）
    // ========================================
    const inventoryMap = new Map();

    rawInventory.forEach(item => {
        const name = item.product_name;
        if (!name) return;

        const existing = inventoryMap.get(name);
        if (existing) {
            // 数值字段：相加
            existing.available_qty += (item.available_qty || 0);
            existing.actual_stock += (item.actual_stock || 0);

            // 图片网址：用逗号分隔
            if (item.image_url && !existing.image_url.includes(item.image_url)) {
                existing.image_url = existing.image_url
                    ? `${existing.image_url}, ${item.image_url}`
                    : item.image_url;
            }

            // 商品编码：用逗号分隔
            if (item.product_code && !existing.product_code.includes(item.product_code)) {
                existing.product_code = existing.product_code
                    ? `${existing.product_code}, ${item.product_code}`
                    : item.product_code;
            }

            // 仓位：用逗号分隔
            if (item.warehouse && !existing.warehouse.includes(item.warehouse)) {
                existing.warehouse = existing.warehouse
                    ? `${existing.warehouse}, ${item.warehouse}`
                    : item.warehouse;
            }

            // 虚拟类别：去重（只保留第一个）
            if (!existing.virtual_category && item.virtual_category) {
                existing.virtual_category = item.virtual_category;
            }

            // 产品类别：去重（只保留第一个）
            if (!existing.product_category && item.product_category) {
                existing.product_category = item.product_category;
            }
        } else {
            inventoryMap.set(name, {
                product_name: name,
                available_qty: item.available_qty || 0,
                actual_stock: item.actual_stock || 0,
                virtual_category: item.virtual_category || '',
                product_category: item.product_category || '',
                product_code: item.product_code || '',
                image_url: item.image_url || '',
                warehouse: item.warehouse || ''
            });
        }
    });

    const deduplicatedCount = inventoryMap.size;

    // ========================================
    // 合并评分视图数据（包含评分和排名）
    // ========================================
    (rankingViewRes.data || []).forEach(item => {
        const existing = inventoryMap.get(item.product_name);
        if (existing) {
            Object.assign(existing, {
                total_score: item.total_score || 0,
                rating_rank: item.rating_rank || 999999,
                sales_amount: item.sales_amount || 0,
                lecture_count: item.lecture_count || 0,
                exposure_rate: item.exposure_rate || 0,
                conversion_rate: item.conversion_rate || 0,
                product_id: item.product_id || ''
            });
        }
    });

    // 转为数组
    const products = Array.from(inventoryMap.values());

    // 返回去重统计（用于UI显示）
    products._deduplicateStats = {
        before: rawCount,
        after: deduplicatedCount
    };

    return products;
}

// 读取新品数据
async function loadNewProductData() {
    const client = window.supabaseClient;
    if (!client) throw new Error('Supabase 未初始化');

    const { data, error } = await client.from('new_product_data').select('*');
    if (error) throw new Error('读取 new_product_data 失败: ' + error.message);

    return data || [];
}

// ========================================
// 排除商品管理
// ========================================
async function loadExcludedProducts() {
    const client = window.supabaseClient;
    if (!client) return [];

    const { data, error } = await client.from('excluded_products').select('*');
    if (error) {
        console.warn('读取排除商品失败:', error.message);
        return [];
    }
    return data || [];
}

async function addExcludedProduct(productName, reason = '') {
    const client = window.supabaseClient;
    if (!client) throw new Error('Supabase 未初始化');

    const { error } = await client.from('excluded_products').insert({
        product_name: productName.trim(),
        reason: reason,
        created_at: new Date().toISOString()
    });
    if (error) throw new Error('添加排除商品失败: ' + error.message);
    return true;
}

async function removeExcludedProduct(productName) {
    const client = window.supabaseClient;
    if (!client) throw new Error('Supabase 未初始化');

    const { error } = await client.from('excluded_products')
        .delete()
        .eq('product_name', productName);
    if (error) throw new Error('删除排除商品失败: ' + error.message);
    return true;
}

// 过滤排除商品
function filterExcludedProducts(products, excludedList) {
    const excludedNames = new Set(excludedList.map(e => e.product_name));
    return products.filter(p => !excludedNames.has(p.product_name));
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
                <p>从评分视图和库存表汇总数据，按配置规则进行排品计算</p>
            </div>
            
            <div class="upload-blocks-grid">
                <!-- 数据加载区块 -->
                <div class="upload-block" id="block-ranking-data">
                    <div class="upload-block-header">
                        <h3>📦 数据汇总 <span class="db-table-tag">product_ranking_view + inventory_data</span></h3>
                    </div>
                    
                    <div class="ranking-stats" id="rankingStats">
                        <div class="stat-item">
                            <span class="stat-label">评分数据</span>
                            <span class="stat-value" id="statRanking">--</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">库存数据</span>
                            <span class="stat-value" id="statInventory">--</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">新品数据</span>
                            <span class="stat-value" id="statNewProduct">--</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">排除商品</span>
                            <span class="stat-value" id="statExcluded">--</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">参与排品</span>
                            <span class="stat-value" id="statCombined">--</span>
                        </div>
                    </div>
                    
                    <div class="ranking-options" style="margin-bottom: 1rem; padding: 0.75rem; background: var(--bg-secondary); border-radius: var(--border-radius-sm);">
                        <label class="checkbox-label" style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                            <input type="checkbox" id="includeNewProducts" checked>
                            <span>包含新品数据参与排品</span>
                        </label>
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
                <!-- 分类设置 -->
                <div class="card">
                    <div class="card-header">
                        <h3>📑 分类设置 <span class="db-table-tag">→ ranking_config</span></h3>
                    </div>
                    <div class="card-body">
                        <p class="setting-hint">拖拽调整筛选分类的优先顺序（排在前面的分类先选商品），点击编辑修改分类名称</p>
                        <ul class="sortable-list" id="categoryOrderList"></ul>
                        <div class="input-group" style="margin-top: 1rem;">
                            <input type="text" id="newCategoryInput" class="input" placeholder="输入新分类名称..." style="flex:1;">
                            <button class="btn btn-primary" id="btnAddCategory">添加分类</button>
                        </div>
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
                
                <!-- 排除商品设置 -->
                <div class="card">
                    <div class="card-header">
                        <h3>🚫 排除商品 <span class="db-table-tag">→ excluded_products</span></h3>
                    </div>
                    <div class="card-body">
                        <p class="setting-hint">输入商品名称添加到排除列表，这些商品将不参与排品计算</p>
                        <div class="input-group" style="margin-bottom: 1rem;">
                            <input type="text" id="excludeProductInput" class="input" placeholder="输入商品名称..." style="flex:1;">
                            <button class="btn btn-primary" id="btnAddExclude">添加</button>
                        </div>
                        <div class="excluded-list" id="excludedListContainer">
                            <p class="placeholder">加载中...</p>
                        </div>
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
let cachedProducts = [];      // 库存+评分汇总数据
let cachedNewProducts = [];   // 新品数据
let cachedExcluded = [];      // 排除商品列表
let cachedResults = [];       // 排品结果

async function initRankingPage() {
    const btnLoadData = document.getElementById('btnLoadData');
    const btnCalculate = document.getElementById('btnCalculate');
    const btnSaveResults = document.getElementById('btnSaveResults');

    if (btnLoadData) {
        btnLoadData.addEventListener('click', async () => {
            try {
                btnLoadData.disabled = true;
                btnLoadData.textContent = '加载中...';

                // 获取是否包含新品的设置
                const includeNewProducts = document.getElementById('includeNewProducts')?.checked ?? true;

                // 获取各表统计
                const client = window.supabaseClient;
                const [r1, r2, r3] = await Promise.all([
                    client.from('product_ranking_view').select('*', { count: 'exact', head: true }),
                    client.from('inventory_data').select('*', { count: 'exact', head: true }),
                    client.from('new_product_data').select('*', { count: 'exact', head: true })
                ]);

                document.getElementById('statRanking').textContent = r1.count || 0;
                document.getElementById('statNewProduct').textContent = includeNewProducts ? (r3.count || 0) : `${r3.count || 0}（未参与）`;

                // 加载排除商品列表
                cachedExcluded = await loadExcludedProducts();
                document.getElementById('statExcluded').textContent = cachedExcluded.length;

                // 汇总商品数据（库存 + 评分，包含本地去重）
                let allProducts = await loadCombinedProductData();

                // 显示库存数据去重统计（去重后/去重前）
                const dedupeStats = allProducts._deduplicateStats || { before: r2.count, after: allProducts.length };
                document.getElementById('statInventory').textContent = `${dedupeStats.after}/${dedupeStats.before}`;

                // 如果包含新品，将新品数据合并到排品数据中
                if (includeNewProducts) {
                    cachedNewProducts = await loadNewProductData();
                    // 将新品添加到商品列表（赋予默认评分排名）
                    cachedNewProducts.forEach(np => {
                        if (!allProducts.find(p => p.product_name === np.product_name)) {
                            allProducts.push({
                                ...np,
                                rating_rank: 999999,  // 新品默认排名最后
                                total_score: 0,
                                is_new_product: true
                            });
                        }
                    });
                } else {
                    cachedNewProducts = [];
                }

                // 过滤排除商品
                cachedProducts = filterExcludedProducts(allProducts, cachedExcluded);

                // 参与排品的商品总数
                const totalCount = cachedProducts.length;
                document.getElementById('statCombined').textContent = totalCount;

                btnCalculate.disabled = false;
                window.AppUtils?.showToast?.(`数据加载完成：参与排品 ${totalCount} 个（排除 ${cachedExcluded.length} 个）`, 'success');
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
    let config = await loadRankingConfig();
    const orderList = document.getElementById('categoryOrderList');

    // ========================================
    // 分类渲染函数
    // ========================================
    function renderCategories() {
        if (!orderList) return;
        orderList.innerHTML = config.分类排序.map((cat, idx) => `
            <li class="sortable-item" data-category="${cat}" data-index="${idx}">
                <span class="drag-handle" title="拖拽排序">☰</span>
                <span class="category-name" contenteditable="false">${config.结果映射[cat] || cat}</span>
                <div class="category-actions" style="display:flex;gap:0.25rem;">
                    <button class="btn-icon btn-edit" data-category="${cat}" title="编辑">✎</button>
                    <button class="btn-icon btn-delete" data-category="${cat}" title="删除">✕</button>
                </div>
            </li>
        `).join('');

        // 绑定编辑按钮事件
        orderList.querySelectorAll('.btn-edit').forEach(btn => {
            btn.addEventListener('click', () => {
                const cat = btn.dataset.category;
                const li = btn.closest('.sortable-item');
                const nameSpan = li.querySelector('.category-name');
                const currentName = config.结果映射[cat] || cat;
                const newName = prompt('修改分类名称：', currentName);
                if (newName && newName.trim() && newName !== currentName) {
                    config.结果映射[cat] = newName.trim();
                    nameSpan.textContent = newName.trim();
                    saveConfigQuietly();
                }
            });
        });

        // 绑定删除按钮事件
        orderList.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', () => {
                const cat = btn.dataset.category;
                const displayName = config.结果映射[cat] || cat;
                if (confirm(`确定删除分类"${displayName}"吗？`)) {
                    config.分类排序 = config.分类排序.filter(c => c !== cat);
                    delete config.结果映射[cat];
                    delete config.筛选条件[cat];
                    delete config.样品序号规则[config.结果映射[cat]];
                    renderCategories();
                    saveConfigQuietly();
                }
            });
        });
    }

    // 静默保存配置
    async function saveConfigQuietly() {
        try {
            await saveRankingConfig('filter_config', config);
        } catch (e) {
            console.error('自动保存失败:', e);
        }
    }

    // 初始渲染
    renderCategories();

    // ========================================
    // 添加分类
    // ========================================
    const newCategoryInput = document.getElementById('newCategoryInput');
    const btnAddCategory = document.getElementById('btnAddCategory');

    if (btnAddCategory && newCategoryInput) {
        btnAddCategory.addEventListener('click', () => {
            const name = newCategoryInput.value.trim();
            if (!name) {
                window.AppUtils?.showToast?.('请输入分类名称', 'warning');
                return;
            }
            // 生成唯一的分类 key
            const catKey = `自定义${Date.now()}`;
            config.分类排序.push(catKey);
            config.结果映射[catKey] = name;
            config.筛选条件[catKey] = {};  // 空筛选条件
            config.样品序号规则[name] = { prefix: 'X', start: 1, step: 1 };  // 默认序号规则

            newCategoryInput.value = '';
            renderCategories();
            saveConfigQuietly();
            window.AppUtils?.showToast?.(`已添加分类"${name}"`, 'success');
        });

        newCategoryInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') btnAddCategory.click();
        });
    }

    // ========================================
    // 保存按钮
    // ========================================
    const btnSave = document.getElementById('btnSaveSettings');
    if (btnSave) {
        btnSave.addEventListener('click', async () => {
            try {
                btnSave.disabled = true;
                btnSave.textContent = '保存中...';

                // 获取当前排序（从 DOM 顺序获取）
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

    // ========================================
    // 重置按钮
    // ========================================
    const btnReset = document.getElementById('btnResetSettings');
    if (btnReset) {
        btnReset.addEventListener('click', async () => {
            if (confirm('确定要重置为默认配置吗？')) {
                await saveRankingConfig('filter_config', getDefaultRankingConfig());
                location.reload();
            }
        });
    }

    // ========================================
    // 排除商品管理
    // ========================================
    const excludedContainer = document.getElementById('excludedListContainer');
    const excludeInput = document.getElementById('excludeProductInput');
    const btnAddExclude = document.getElementById('btnAddExclude');

    // 渲染排除商品列表
    async function renderExcludedList() {
        const excludedList = await loadExcludedProducts();
        if (excludedContainer) {
            if (excludedList.length === 0) {
                excludedContainer.innerHTML = '<p class="placeholder">暂无排除商品</p>';
            } else {
                excludedContainer.innerHTML = excludedList.map(item => `
                    <div class="excluded-item" style="display:flex;align-items:center;gap:0.5rem;padding:0.5rem;background:var(--bg-secondary);border-radius:var(--border-radius-sm);margin-bottom:0.375rem;">
                        <span style="flex:1;font-size:0.875rem;">${item.product_name}</span>
                        <button class="btn-icon btn-delete-exclude" data-name="${item.product_name}" title="删除">✕</button>
                    </div>
                `).join('');

                // 绑定删除事件
                excludedContainer.querySelectorAll('.btn-delete-exclude').forEach(btn => {
                    btn.addEventListener('click', async () => {
                        const name = btn.dataset.name;
                        if (confirm(`确定删除排除商品"${name}"吗？`)) {
                            try {
                                await removeExcludedProduct(name);
                                await renderExcludedList();
                                window.AppUtils?.showToast?.('已删除', 'success');
                            } catch (e) {
                                window.AppUtils?.showToast?.(e.message, 'error');
                            }
                        }
                    });
                });
            }
        }
    }

    // 初始渲染
    await renderExcludedList();

    // 添加按钮事件
    if (btnAddExclude && excludeInput) {
        btnAddExclude.addEventListener('click', async () => {
            const name = excludeInput.value.trim();
            if (!name) {
                window.AppUtils?.showToast?.('请输入商品名称', 'warning');
                return;
            }
            try {
                await addExcludedProduct(name);
                excludeInput.value = '';
                await renderExcludedList();
                window.AppUtils?.showToast?.(`已添加"${name}"到排除列表`, 'success');
            } catch (e) {
                window.AppUtils?.showToast?.(e.message, 'error');
            }
        });

        // 回车添加
        excludeInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') btnAddExclude.click();
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
