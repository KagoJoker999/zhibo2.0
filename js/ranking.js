/**
 * 排品功能模块
 * ========================================
 * 数据：从 product_ranking_view + inventory_data 汇总
 * 新品：从 new_product_data 读取
 * 配置：从 ranking_config 表读取
 * 输出：写入 ranking_results 表
 */

// ========================================
// 数据汇总 - 从 ranking_data + inventory_data 读取并融合
// ========================================
async function loadCombinedProductData() {
    const client = window.supabaseClient;
    if (!client) throw new Error('Supabase 未初始化');

    // 并行读取排名数据和库存表
    const [rankingRes, inventoryRes] = await Promise.all([
        client.from('ranking_data').select('*'),
        client.from('inventory_data').select('*')
    ]);

    if (rankingRes.error) throw new Error('读取 ranking_data 失败: ' + rankingRes.error.message);
    if (inventoryRes.error) throw new Error('读取 inventory_data 失败: ' + inventoryRes.error.message);

    // 步骤1：构建排名数据 Map，计算总分
    const rankingMap = new Map();
    (rankingRes.data || []).forEach(item => {
        if (!item.product_name) return;
        // 计算总分（根据业务规则调整权重）
        const totalScore =
            (item.sales_amount || 0) * 0.4 +
            (item.lecture_count || 0) * 0.2 +
            (item.exposure_rate || 0) * 100 * 0.2 +
            (item.conversion_rate || 0) * 100 * 0.2;

        rankingMap.set(item.product_name, {
            total_score: totalScore,
            sales_amount: item.sales_amount || 0,
            lecture_count: item.lecture_count || 0,
            exposure_rate: item.exposure_rate || 0,
            conversion_rate: item.conversion_rate || 0
        });
    });

    // 步骤2：构建库存数据 Map
    const inventoryMap = new Map();
    (inventoryRes.data || []).forEach(item => {
        if (!item.product_name) return;
        inventoryMap.set(item.product_name, {
            product_name: item.product_name,
            available_qty: item.available_qty || 0,
            actual_stock: item.actual_stock || 0,
            virtual_category: item.virtual_category || '',
            product_category: item.product_category || '',
            product_code: item.product_code || '',
            image_url: item.image_url || '',
            warehouse: item.warehouse || '',
            // 初始化评分相关字段
            total_score: 0,
            rating_rank: 999999,  // 默认无排名
            sales_amount: 0,
            lecture_count: 0,
            exposure_rate: 0,
            conversion_rate: 0
        });
    });

    // 步骤3：融合评分数据到库存数据
    rankingMap.forEach((rankData, productName) => {
        const existing = inventoryMap.get(productName);
        if (existing) {
            Object.assign(existing, rankData);
        }
    });

    // 步骤4：生成排名（按总分降序）
    const products = Array.from(inventoryMap.values());
    products
        .filter(p => p.total_score > 0)  // 只对有评分的商品排名
        .sort((a, b) => b.total_score - a.total_score)
        .forEach((p, idx) => {
            p.rating_rank = idx + 1;  // 排名从1开始
        });

    return products;
}

// 读取新品数据（含本地去重）
async function loadNewProductData() {
    const client = window.supabaseClient;
    if (!client) throw new Error('Supabase 未初始化');

    const { data, error } = await client.from('new_product_data').select('*');
    if (error) throw new Error('读取 new_product_data 失败: ' + error.message);

    const rawData = data || [];
    const rawCount = rawData.length;

    // ========================================
    // 新品数据本地去重（以产品名称为主键）
    // ========================================
    const productMap = new Map();

    rawData.forEach(item => {
        const name = item.product_name;
        if (!name) return;

        const existing = productMap.get(name);
        if (existing) {
            // 图片网址：用逗号分隔
            if (item.image_url && !existing.image_url.includes(item.image_url)) {
                existing.image_url = existing.image_url
                    ? `${existing.image_url}, ${item.image_url}`
                    : item.image_url;
            }

            // 颜色规格：用逗号分隔
            if (item.color_spec && !existing.color_spec.includes(item.color_spec)) {
                existing.color_spec = existing.color_spec
                    ? `${existing.color_spec}, ${item.color_spec}`
                    : item.color_spec;
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

            // 类别：去重（保留第一个）
            if (!existing.category && item.category) {
                existing.category = item.category;
            }

            // 商品标签：去重（保留第一个）
            if (!existing.product_tag && item.product_tag) {
                existing.product_tag = item.product_tag;
            }

            // 价格：去重（保留第一个）
            if (!existing.price && item.price) {
                existing.price = item.price;
            }
        } else {
            productMap.set(name, {
                product_name: name,
                image_url: item.image_url || '',
                category: item.category || '',
                color_spec: item.color_spec || '',
                product_code: item.product_code || '',
                warehouse: item.warehouse || '',
                product_tag: item.product_tag || '',
                price: item.price || '',
                virtual_category: item.virtual_category || ''
            });
        }
    });

    const deduplicatedCount = productMap.size;

    // 转为数组
    const products = Array.from(productMap.values());

    // 返回去重统计（用于UI显示）
    products._deduplicateStats = {
        before: rawCount,
        after: deduplicatedCount
    };

    return products;
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

// ========================================
// 排除不可佩戴品管理 (New)
// ========================================
async function loadExcludedNonWearables() {
    const client = window.supabaseClient;
    if (!client) return [];

    const { data, error } = await client.from('excluded_non_wearables').select('*').order('created_at', { ascending: false });
    if (error) {
        console.warn('读取排除不可佩戴品失败:', error.message);
        return [];
    }
    return data || [];
}

async function addExcludedNonWearable(productName) {
    const client = window.supabaseClient;
    if (!client) throw new Error('Supabase 未初始化');

    const { error } = await client.from('excluded_non_wearables').insert({
        product_name: productName.trim()
    });
    if (error) throw new Error('添加失败: ' + error.message);
    return true;
}

async function removeExcludedNonWearable(productName) {
    const client = window.supabaseClient;
    if (!client) throw new Error('Supabase 未初始化');

    const { error } = await client.from('excluded_non_wearables')
        .delete()
        .eq('product_name', productName);
    if (error) throw new Error('删除失败: ' + error.message);
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
                        <h3>📦 数据汇总 <span class="db-table-tag">ranking_data + inventory_data + new_product_data</span></h3>
                    </div>
                    
                    <div class="ranking-stats" id="rankingStats" style="display:flex; flex-direction:column; gap:1.5rem;">
                        <!-- 第一行 -->
                        <div class="stats-row" style="display:flex; justify-content:space-around; gap:1rem;">
                            <div class="stat-item">
                                <span class="stat-label">排名数据</span>
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
                        </div>
                        
                        <!-- 第二行 -->
                        <div class="stats-row" style="display:flex; justify-content:space-between; padding:0 10%; gap:1rem;">
                            <div class="stat-item">
                                <span class="stat-label">排除商品</span>
                                <span class="stat-value" id="statExcluded">--</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-label">参与排品</span>
                                <span class="stat-value" id="statCombined">--</span>
                            </div>
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
        <div class="ranking-settings-page rankings-split-layout">
            <div class="page-intro">
                <h2>⚙️ 排品设置</h2>
                <p>配置筛选分类及其对应的筛选条件</p>
            </div>
            
            <div class="settings-split-container">
                <!-- 左侧：分类列表 -->
                <div class="settings-split-left">
                    <div class="panel-header" style="margin-bottom:1rem; display:flex; justify-content:space-between; align-items:center;">
                        <h3 style="font-size:1rem; margin:0;">分类列表</h3>
                        <button class="btn btn-sm btn-primary" id="btnAddCategory" title="添加分类">+</button>
                    </div>
                    <ul class="sortable-list" id="categoryOrderList" style="flex:1;">
                        <li class="placeholder">加载中...</li>
                    </ul>
                    <div class="category-add-area" style="margin-top:1rem; display:none; padding-top:1rem; border-top:1px solid var(--border-color);" id="addCategoryContainer">
                         <input type="text" id="newCategoryInput" class="input" placeholder="输入名称..." style="width:100%; margin-bottom:0.5rem;">
                         <div style="display:flex; gap:0.5rem;">
                             <button class="btn btn-sm btn-primary" id="btnConfirmAddCategory" style="flex:1;">确认</button>
                             <button class="btn btn-sm btn-secondary" id="btnCancelAddCategory" style="flex:1;">取消</button>
                         </div>
                    </div>
                </div>
                
                <!-- 右侧：筛选条件 -->
                <div class="settings-split-right">
                    <div class="panel-header" style="margin-bottom:1rem; display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid var(--border-color); padding-bottom:1rem;">
                        <div>
                            <h3 style="font-size:1rem; margin:0;" id="filterSettingsTitle">筛选条件设置</h3>
                            <p class="text-muted" style="font-size:0.8rem; margin:0.25rem 0;" id="filterSettingsSubtitle">请从左侧选择一个分类进行配置</p>
                        </div>
                        <div class="settings-actions">
                             <button class="btn btn-primary" id="btnSaveSettings">保存设置</button>
                        </div>
                    </div>
                    <div id="filterConditionsContainer">
                        <div class="placeholder-content" style="padding:2rem 0;">
                            <p>请点击左侧分类以编辑筛选条件</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function generateRankingAssignmentPage() {
    return `
        <div class="ranking-assignment-page">
            <div class="page-intro">
                <h2>🔢 排品序号分配</h2>
                <p>配置各分类及新品的生成样品序号规则</p>
            </div>
            
             <div class="ranking-options" style="margin-bottom: 2rem; padding: 1rem; background: var(--bg-secondary); border-radius: var(--border-radius-sm); display:flex; justify-content:space-between; align-items:center;">
                <span class="text-muted">此处配置的规则将用于生成最终排品结果中的样品序号</span>
                <button class="btn btn-primary" id="btnSaveAssignment">保存规则</button>
            </div>

            <div class="settings-split-container" style="display:grid; grid-template-columns: 1fr 1fr; gap:1.5rem;">
                <!-- 左侧：分类序号规则 -->
                <div class="card settings-split-left" style="height:auto;">
                    <div class="card-header">
                        <h3>分类序号规则</h3>
                    </div>
                     <div class="card-body">
                         <div id="sampleRulesContainer" style="display:grid; grid-template-columns: 1fr; gap:1rem;">
                            <p>加载中...</p>
                         </div>
                     </div>
                </div>

                <!-- 右侧：新品序号规则 -->
                <div class="card settings-split-right" style="height:auto;">
                    <div class="card-header">
                         <h3>新品序号规则</h3>
                    </div>
                     <div class="card-body">
                         <div id="newProductRulesContainer">
                            <div class="rules-card" style="background:var(--bg-tertiary); padding:1rem; border-radius:var(--border-radius-sm);">
                                <div style="display:flex; gap:1rem; margin-bottom:0.5rem; align-items:center;">
                                    <strong style="width:100px;">新品</strong>
                                </div>
                                <div style="display:grid; grid-template-columns: 1fr 1fr 1fr; gap:0.5rem;">
                                    <div class="input-group-vertical">
                                        <label style="font-size:0.8rem; color:var(--text-muted);">前缀</label>
                                        <input type="text" class="input input-sm new-rule-input" data-field="prefix" placeholder="例如: N">
                                    </div>
                                    <div class="input-group-vertical">
                                        <label style="font-size:0.8rem; color:var(--text-muted);">起始号</label>
                                        <input type="number" class="input input-sm new-rule-input" data-field="start" placeholder="未配置">
                                    </div>
                                    <div class="input-group-vertical">
                                        <label style="font-size:0.8rem; color:var(--text-muted);">步长</label>
                                        <input type="number" class="input input-sm new-rule-input" data-field="step" placeholder="未配置">
                                    </div>
                                </div>
                            </div>
                         </div>
                     </div>
                </div>
            </div>
        </div>
    `;
}

function generateRankingExclusionPage() {
    return `
        <div class="ranking-exclusion-page">
             <div class="page-intro">
                <h2>🚫 排除商品设置</h2>
                <p>管理不参与排品的商品名单以及不可佩戴品名单</p>
            </div>
            
            <div class="settings-split-container" style="display:grid; grid-template-columns: 1fr 1fr; gap:1.5rem;">
                <!-- 左侧：排除商品 -->
                <div class="card settings-split-left" style="height:auto;">
                    <div class="card-header" style="display:flex; justify-content:space-between; align-items:center;">
                        <h3>排除列表 <span class="db-table-tag">→ excluded_products</span></h3>
                    </div>
                    <div class="card-body">
                         <div class="input-group" style="display:flex; gap:0.5rem; margin-bottom:1rem;">
                            <input type="text" id="excludeInput" class="input" placeholder="输入商品名称..." style="flex:1;">
                            <button class="btn btn-primary" id="btnAddExclude">添加</button>
                        </div>
                        <div class="excluded-list-container" style="max-height:500px; overflow-y:auto; border:1px solid var(--border-color); border-radius:var(--border-radius-sm);">
                            <table class="data-table" style="width:100%;">
                                <thead>
                                    <tr>
                                        <th style="text-align:left; padding:0.75rem;">商品名称</th>
                                        <th style="width:60px; text-align:center; padding:0.75rem;">操作</th>
                                    </tr>
                                </thead>
                                <tbody id="excludedListBody">
                                    <tr><td colspan="2" class="text-center" style="padding:2rem;">加载中...</td></tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <!-- 右侧：不可佩戴品 -->
                <div class="card settings-split-right" style="height:auto;">
                    <div class="card-header" style="display:flex; justify-content:space-between; align-items:center;">
                        <h3>不可佩戴品 <span class="db-table-tag">→ excluded_non_wearables</span></h3>
                    </div>
                    <div class="card-body">
                         <div class="input-group" style="display:flex; gap:0.5rem; margin-bottom:1rem;">
                            <input type="text" id="excludeNonWearableInput" class="input" placeholder="输入商品名称..." style="flex:1;">
                            <button class="btn btn-primary" id="btnAddNonWearable">添加</button>
                        </div>
                        <div class="excluded-list-container" style="max-height:500px; overflow-y:auto; border:1px solid var(--border-color); border-radius:var(--border-radius-sm);">
                            <table class="data-table" style="width:100%;">
                                <thead>
                                    <tr>
                                        <th style="text-align:left; padding:0.75rem;">商品名称</th>
                                        <th style="width:60px; text-align:center; padding:0.75rem;">操作</th>
                                    </tr>
                                </thead>
                                <tbody id="excludedNonWearableListBody">
                                    <tr><td colspan="2" class="text-center" style="padding:2rem;">加载中...</td></tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
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
                    client.from('ranking_data').select('*', { count: 'exact', head: true }),
                    client.from('inventory_data').select('*', { count: 'exact', head: true }),
                    client.from('new_product_data').select('*', { count: 'exact', head: true })
                ]);

                document.getElementById('statRanking').textContent = r1.count || 0;
                document.getElementById('statInventory').textContent = r2.count || 0;
                document.getElementById('statNewProduct').textContent = includeNewProducts ? (r3.count || 0) : `${r3.count || 0}（未参与）`;

                // 加载排除商品列表
                cachedExcluded = await loadExcludedProducts();
                document.getElementById('statExcluded').textContent = cachedExcluded.length;

                // 汇总商品数据（库存 + 评分）
                let allProducts = await loadCombinedProductData();
                const baseInventoryCount = allProducts.length;
                let addedNewCount = 0;

                // 如果包含新品，将新品数据合并到排品数据中
                if (includeNewProducts) {
                    cachedNewProducts = await loadNewProductData();

                    // 显示新品数据去重统计（去重后/去重前）
                    const newProductStats = cachedNewProducts._deduplicateStats || { before: r3.count, after: cachedNewProducts.length };
                    document.getElementById('statNewProduct').textContent = `${newProductStats.after}/${newProductStats.before}`;

                    // 将新品添加到商品列表（赋予默认评分排名）
                    cachedNewProducts.forEach(np => {
                        if (!allProducts.find(p => p.product_name === np.product_name)) {
                            allProducts.push({
                                ...np,
                                rating_rank: 999999,  // 新品默认排名最后
                                total_score: 0,
                                is_new_product: true
                            });
                            addedNewCount++;
                        }
                    });
                } else {
                    cachedNewProducts = [];
                }

                // 过滤排除商品
                const countBeforeExclude = allProducts.length;
                cachedProducts = filterExcludedProducts(allProducts, cachedExcluded);
                const countAfterExclude = cachedProducts.length;
                const excludedCount = countBeforeExclude - countAfterExclude;

                // 参与排品的商品总数及计算逻辑显示
                const totalCount = cachedProducts.length;
                const formulaHtml = `<span title="库存数 + 新增数 - 实际排除数" style="font-size:0.85em; color:var(--text-muted); margin-left:0.5rem; font-weight:normal;">(${baseInventoryCount} + ${addedNewCount} - ${excludedCount})</span>`;
                document.getElementById('statCombined').innerHTML = `${totalCount} ${formulaHtml}`;

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
    const filterContainer = document.getElementById('filterConditionsContainer');
    const filterTitle = document.getElementById('filterSettingsTitle');
    const filterSubtitle = document.getElementById('filterSettingsSubtitle');
    const btnSave = document.getElementById('btnSaveSettings');

    let selectedCategory = null;

    // 渲染左侧分类列表
    function renderCategories() {
        if (!orderList) return;

        if (!config.分类排序 || config.分类排序.length === 0) {
            orderList.innerHTML = '<li class="placeholder">暂无分类，请添加</li>';
            return;
        }

        orderList.innerHTML = config.分类排序.map((cat, idx) => {
            const displayName = config.结果映射[cat] || cat;
            const isActive = cat === selectedCategory ? 'active' : '';
            return `
                <li class="sortable-item ${isActive}" data-category="${cat}" data-index="${idx}" style="cursor:pointer; padding:0.75rem; border:1px solid transparent; border-radius:var(--border-radius-sm); margin-bottom:0.5rem; display:flex; align-items:center; justify-content:space-between;">
                    <span class="category-name" style="font-weight:500;">${idx + 1}. ${displayName}</span>
                    <div class="category-actions" style="display:flex; gap:0.25rem;">
                         <button class="btn-icon btn-move-up" data-index="${idx}" title="上移" style="font-size:0.8rem; color:var(--text-muted); opacity:0.7;">↑</button>
                         <button class="btn-icon btn-move-down" data-index="${idx}" title="下移" style="font-size:0.8rem; color:var(--text-muted); opacity:0.7;">↓</button>
                        <button class="btn-icon btn-delete" data-category="${cat}" title="删除" style="font-size:0.8rem; color:var(--text-muted); opacity:0.7; margin-left:0.5rem;">✕</button>
                    </div>
                </li>
            `;
        }).join('');

        // 绑定点击事件（选中）
        orderList.querySelectorAll('.sortable-item').forEach(li => {
            li.addEventListener('click', (e) => {
                // 如果点的是按钮，不处理选中
                if (e.target.closest('.category-actions')) return;

                const cat = li.dataset.category;
                selectedCategory = cat;
                renderCategories(); // 刷新高亮
                renderFilterSettings(cat);
            });
        });

        // 绑定上移/下移事件
        orderList.querySelectorAll('.btn-move-up').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const idx = parseInt(btn.dataset.index);
                if (idx > 0) {
                    const temp = config.分类排序[idx];
                    config.分类排序[idx] = config.分类排序[idx - 1];
                    config.分类排序[idx - 1] = temp;
                    renderCategories();
                    saveConfigQuietly();
                }
            });
        });

        orderList.querySelectorAll('.btn-move-down').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const idx = parseInt(btn.dataset.index);
                if (idx < config.分类排序.length - 1) {
                    const temp = config.分类排序[idx];
                    config.分类排序[idx] = config.分类排序[idx + 1];
                    config.分类排序[idx + 1] = temp;
                    renderCategories();
                    saveConfigQuietly();
                }
            });
        });

        // 绑定删除事件
        orderList.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const cat = btn.dataset.category;
                const name = config.结果映射[cat] || cat;
                if (confirm(`确定删除分类"${name}"吗？`)) {
                    config.分类排序 = config.分类排序.filter(c => c !== cat);
                    delete config.结果映射[cat];
                    delete config.筛选条件[cat];
                    // delete config.样品序号规则[name]; // name might be old
                    if (config.样品序号规则 && config.样品序号规则[name]) {
                        delete config.样品序号规则[name];
                    }

                    if (selectedCategory === cat) {
                        selectedCategory = null;
                        renderFilterSettings(null);
                    }
                    renderCategories();
                    saveConfigQuietly();
                }
            });
        });
    }

    // 渲染右侧筛选条件
    function renderFilterSettings(category) {
        if (!filterContainer) return;

        if (!category) {
            if (filterTitle) filterTitle.textContent = '筛选条件设置';
            if (filterSubtitle) filterSubtitle.textContent = '请从左侧选择一个分类进行配置';
            filterContainer.innerHTML = '<div class="placeholder-content" style="padding:2rem 0;"><p>请点击左侧分类以编辑筛选条件</p></div>';
            return;
        }

        const displayName = config.结果映射[category] || category;
        if (filterTitle) filterTitle.textContent = `${displayName} - 筛选规则`;
        if (filterSubtitle) filterSubtitle.textContent = `配置 ${displayName} 的筛选逻辑`;

        if (!config.筛选条件[category]) config.筛选条件[category] = {};
        const rules = config.筛选条件[category];

        filterContainer.innerHTML = `
            <div class="settings-group">
                <label>显示名称</label>
                <input type="text" class="input settings-input" id="inputDisplayName" value="${displayName}">
            </div>
            
            <div style="border-top:1px solid var(--border-color); margin:1rem 0;"></div>
            
            <h4>关键词筛选</h4>
            <div class="settings-group">
                <label>包含关键词 (逗号分隔)</label>
                <input type="text" class="input settings-input" data-field="包含" value="${(rules.包含 || []).join ? rules.包含.join(',') : (rules.包含 || '')}" placeholder="例如: 连衣裙,套装">
            </div>
             <div class="settings-group">
                <label>排除关键词 (逗号分隔)</label>
                <input type="text" class="input settings-input" data-field="排除" value="${(rules.排除 || []).join ? rules.排除.join(',') : (rules.排除 || '')}" placeholder="例如: 瑕疵,次品">
            </div>
            
            <div class="form-row" style="display:flex; gap:1rem;">
                <div class="settings-group" style="flex:1;">
                    <label>排在多少名之前 (Top N)</label>
                    <input type="number" class="input settings-input" data-field="前几名" value="${rules.前几名 || ''}" placeholder="例如: 50">
                </div>
                 <div class="settings-group" style="flex:1;">
                    <label>排序方式</label>
                    <select class="input settings-input" data-field="排序方式">
                        <option value="降序" ${rules.排序方式 !== '升序' ? 'selected' : ''}>降序 (数值越大越靠前)</option>
                        <option value="升序" ${rules.排序方式 === '升序' ? 'selected' : ''}>升序 (数值越小越靠前)</option>
                    </select>
                </div>
            </div>
            
            <div style="border-top:1px solid var(--border-color); margin:1rem 0;"></div>
            
            <h4>数值范围筛选 (可选)</h4>
            <div class="form-row" style="display:flex; gap:1rem;">
                 <div class="settings-group" style="flex:1;">
                    <label>大于等于 (>=)</label>
                    <input type="number" class="input settings-input" data-field="大于等于" value="${rules.大于等于 || ''}">
                </div>
                 <div class="settings-group" style="flex:1;">
                    <label>小于等于 (<=)</label>
                    <input type="number" class="input settings-input" data-field="小于等于" value="${rules.小于等于 || ''}">
                </div>
            </div>
            
             <div style="border-top:1px solid var(--border-color); margin:1rem 0;"></div>
             
             <h4>子分类高级设置</h4>
             <div class="settings-group">
                 <label class="checkbox-label" style="display:flex; align-items:center; gap:0.5rem; cursor:pointer;">
                    <input type="checkbox" id="checkSubFilter" ${rules.按子分类分别筛选 ? 'checked' : ''}>
                    <span>按子分类分别筛选 (每个子分类取Top1)</span>
                 </label>
             </div>
             <div class="settings-group" id="subFieldGroup" style="display:${rules.按子分类分别筛选 ? 'block' : 'none'}; margin-top:0.5rem;">
                <label>子分类字段名</label>
                <input type="text" class="input settings-input" data-field="子分类字段" value="${rules.子分类字段 || 'product_category'}" placeholder="默认为 product_category">
            </div>
        `;

        const displayNameInput = document.getElementById('inputDisplayName');
        displayNameInput.addEventListener('change', (e) => {
            const newName = e.target.value.trim();
            if (newName) {
                // 如果名称变了，也需要更新样品序号规则的 key?
                // 旧逻辑是用显示名称作为 key。
                // 如果这里改名，最好同步迁移 Key。
                const oldName = config.结果映射[category];
                if (oldName && oldName !== newName) {
                    if (config.样品序号规则 && config.样品序号规则[oldName]) {
                        config.样品序号规则[newName] = config.样品序号规则[oldName];
                        delete config.样品序号规则[oldName];
                    }
                }

                config.结果映射[category] = newName;
                renderCategories();
            }
        });

        filterContainer.querySelectorAll('input[data-field], select[data-field]').forEach(input => {
            input.addEventListener('change', (e) => {
                const field = e.target.dataset.field;
                let val = e.target.value;
                if (input.type === 'number') val = val === '' ? undefined : parseFloat(val);

                if (field === '包含' || field === '排除') {
                    if (val) {
                        config.筛选条件[category][field] = val.split(/[，,]/).map(s => s.trim()).filter(s => s);
                    } else {
                        delete config.筛选条件[category][field];
                    }
                } else {
                    if (val === '' || val === undefined) {
                        delete config.筛选条件[category][field];
                    } else {
                        config.筛选条件[category][field] = val;
                    }
                }
            });
        });

        const checkSubFilter = document.getElementById('checkSubFilter');
        const subFieldGroup = document.getElementById('subFieldGroup');
        checkSubFilter.addEventListener('change', (e) => {
            config.筛选条件[category].按子分类分别筛选 = e.target.checked;
            subFieldGroup.style.display = e.target.checked ? 'block' : 'none';
        });
    }

    async function saveConfigQuietly() {
        await saveRankingConfig('filter_config', config);
    }

    renderCategories();

    const newCategoryInput = document.getElementById('newCategoryInput');
    const btnAddCategory = document.getElementById('btnAddCategory');
    const btnConfirmAdd = document.getElementById('btnConfirmAddCategory');
    const btnCancelAdd = document.getElementById('btnCancelAddCategory');
    const addContainer = document.getElementById('addCategoryContainer');

    if (btnAddCategory) {
        btnAddCategory.addEventListener('click', () => {
            if (addContainer) addContainer.style.display = 'block';
            if (newCategoryInput) newCategoryInput.focus();
        });
    }
    if (btnCancelAdd) {
        btnCancelAdd.addEventListener('click', () => {
            if (addContainer) addContainer.style.display = 'none';
            if (newCategoryInput) newCategoryInput.value = '';
        });
    }
    if (btnConfirmAdd) {
        btnConfirmAdd.addEventListener('click', () => {
            const name = newCategoryInput.value.trim();
            if (!name) return;

            const catKey = `自定义${Date.now()}`;
            config.分类排序.push(catKey);
            config.结果映射[catKey] = name;
            config.筛选条件[catKey] = {};
            if (!config.样品序号规则) config.样品序号规则 = {};
            config.样品序号规则[name] = { prefix: 'X', start: 1, step: 1 };

            newCategoryInput.value = '';
            if (addContainer) addContainer.style.display = 'none';
            renderCategories();
            saveConfigQuietly();
        });
    }

    if (btnSave) {
        btnSave.addEventListener('click', async () => {
            btnSave.disabled = true;
            btnSave.textContent = '保存中...';
            try {
                await saveConfigQuietly();
                window.AppUtils?.showToast?.('设置已保存', 'success');
            } catch (e) {
                window.AppUtils?.showToast?.(e.message, 'error');
            } finally {
                btnSave.disabled = false;
                btnSave.textContent = '保存设置';
            }
        });
    }
}

async function initRankingAssignment() {
    let config = await loadRankingConfig();
    const container = document.getElementById('sampleRulesContainer');
    const newProductContainer = document.getElementById('newProductRulesContainer');
    const btnSave = document.getElementById('btnSaveAssignment');

    if (!config.样品序号规则) config.样品序号规则 = {};
    if (!config.新品序号规则) config.新品序号规则 = { prefix: 'N', start: 1, step: 1 };

    function renderRules() {
        if (!container) return;

        // 渲染分类规则 (左侧)
        const categories = config.分类排序 || [];
        if (categories.length === 0) {
            container.innerHTML = '<p class="text-muted">请先在【排品设置】中添加分类</p>';
        } else {
            container.innerHTML = categories.map((catKey, idx) => {
                const displayName = config.结果映射[catKey] || catKey;
                // 兼容旧数据：key 可能是 displayName
                let rule = config.样品序号规则[displayName] || { prefix: '', start: 1, step: 1 };
                // 确保数据结构存在
                if (!config.样品序号规则[displayName]) config.样品序号规则[displayName] = rule;

                return `
                    <div class="rules-card" style="background:var(--bg-tertiary); padding:1rem; border-radius:var(--border-radius-sm); border-left: 3px solid var(--primary-color);">
                        <div style="display:flex; gap:1rem; margin-bottom:0.5rem; align-items:center;">
                            <strong>${idx + 1}. ${displayName}</strong>
                        </div>
                        <div style="display:grid; grid-template-columns: 1fr 1fr 1fr; gap:0.5rem;">
                            <div class="input-group-vertical">
                                <label style="font-size:0.8rem; color:var(--text-muted);">前缀</label>
                                <input type="text" class="input input-sm rule-input" data-cat="${displayName}" data-field="prefix" value="${rule.prefix || ''}">
                            </div>
                            <div class="input-group-vertical">
                                <label style="font-size:0.8rem; color:var(--text-muted);">起始号</label>
                                <input type="number" class="input input-sm rule-input" data-cat="${displayName}" data-field="start" value="${rule.start || 1}">
                            </div>
                            <div class="input-group-vertical">
                                <label style="font-size:0.8rem; color:var(--text-muted);">步长</label>
                                <input type="number" class="input input-sm rule-input" data-cat="${displayName}" data-field="step" value="${rule.step || 1}">
                            </div>
                        </div>
                    </div>
                `;
            }).join('');

            // 绑定分类规则输入事件
            container.querySelectorAll('.rule-input').forEach(input => {
                input.addEventListener('change', (e) => {
                    const catName = e.target.dataset.cat;
                    const key = e.target.dataset.field;
                    const val = e.target.value;
                    if (!config.样品序号规则[catName]) config.样品序号规则[catName] = {};

                    if (key === 'start' || key === 'step') {
                        config.样品序号规则[catName][key] = parseInt(val) || 1;
                    } else {
                        config.样品序号规则[catName][key] = val;
                    }
                });
            });
        }

        // 渲染新品规则 (右侧)
        if (newProductContainer) {
            const npRule = config.新品序号规则;
            const inputs = newProductContainer.querySelectorAll('.new-rule-input');
            inputs.forEach(input => {
                const field = input.dataset.field;
                if (field === 'prefix') input.value = npRule.prefix || '';
                if (field === 'start') input.value = npRule.start || 1;
                if (field === 'step') input.value = npRule.step || 1;
            });

            // 绑定新品规则输入事件 (只需绑定一次，但为了简单放在这里重新绑定需注意防止重复? 其实 renderRules 只在 init 时调用一次，或者保存后重绘)
            // 实际上这里的 inputs 是静态 HTML (如果在 generateRankingAssignmentPage 写死的话)
            // 但如果我在 generateRankingAssignmentPage 已经写好了 HTML，这里只需要填值。
            // 修正：generateRankingAssignmentPage 中的 HTML 已经是静态的了。
            // 这里只需要在 init 时获取 inputs 并赋值，绑定事件即可。
            // 为了避免重复绑定，我应该把事件绑定移出 renderRules 或者保证 renderRules 不会重复绑定。
            // 当前逻辑 renderRules 会重绘左侧，但右侧是静态的。
            // 让我们修正一下：右侧也可以动态渲染，或者只赋值。
        }
    }

    renderRules();

    // 绑定新品规则事件 (只绑定一次)
    if (newProductContainer) {
        newProductContainer.querySelectorAll('.new-rule-input').forEach(input => {
            input.addEventListener('change', (e) => {
                const key = e.target.dataset.field;
                const val = e.target.value;
                if (key === 'start' || key === 'step') {
                    config.新品序号规则[key] = parseInt(val) || 1;
                } else {
                    config.新品序号规则[key] = val;
                }
            });
        });
    }


    if (btnSave) {
        btnSave.addEventListener('click', async () => {
            btnSave.disabled = true;
            btnSave.textContent = '保存中...';
            await saveRankingConfig('filter_config', config);
            window.AppUtils?.showToast?.('规则已保存', 'success');
            // renderRules(); // 不需要重绘，输入值且未保存时已经更新了 config
            btnSave.disabled = false;
            btnSave.textContent = '保存规则';
        });
    }
}

async function initRankingExclusion() {
    // === 左侧：排除商品 ===
    const excludedContainer = document.getElementById('excludedListBody');
    const excludeInput = document.getElementById('excludeInput');
    const btnAddExclude = document.getElementById('btnAddExclude');

    async function renderExcludedList() {
        const list = await loadExcludedProducts();
        if (!excludedContainer) return;

        if (list.length === 0) {
            excludedContainer.innerHTML = '<tr><td colspan="2" class="text-center" style="padding:2rem; color:var(--text-muted);">暂无排除商品</td></tr>';
        } else {
            excludedContainer.innerHTML = list.map(item => `
                <tr style="border-bottom:1px solid var(--border-color);">
                    <td style="padding:0.75rem 1rem;">${item.product_name}</td>
                    <td style="text-align:center;">
                        <button class="btn-icon btn-delete-exclude" data-name="${item.product_name}" title="删除" style="color:var(--error-color);">✕</button>
                    </td>
                </tr>
            `).join('');

            excludedContainer.querySelectorAll('.btn-delete-exclude').forEach(btn => {
                btn.addEventListener('click', async () => {
                    const name = btn.dataset.name;
                    if (confirm(`移除 "${name}"？`)) {
                        try {
                            await removeExcludedProduct(name);
                            renderExcludedList();
                        } catch (e) { console.error(e); }
                    }
                });
            });
        }
    }

    if (btnAddExclude) {
        btnAddExclude.addEventListener('click', async () => {
            const name = excludeInput.value.trim();
            if (name) {
                try {
                    await addExcludedProduct(name);
                    excludeInput.value = '';
                    renderExcludedList();
                    window.AppUtils?.showToast?.('已添加', 'success');
                } catch (e) {
                    window.AppUtils?.showToast?.(e.message, 'error');
                }
            }
        });
        excludeInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') btnAddExclude.click();
        });
    }

    // === 右侧：不可佩戴品 ===
    const nonWearableContainer = document.getElementById('excludedNonWearableListBody');
    const nonWearableInput = document.getElementById('excludeNonWearableInput');
    const btnAddNonWearable = document.getElementById('btnAddNonWearable');

    async function renderNonWearableList() {
        const list = await loadExcludedNonWearables();
        if (!nonWearableContainer) return;

        if (list.length === 0) {
            nonWearableContainer.innerHTML = '<tr><td colspan="2" class="text-center" style="padding:2rem; color:var(--text-muted);">暂无记录</td></tr>';
        } else {
            nonWearableContainer.innerHTML = list.map(item => `
                <tr style="border-bottom:1px solid var(--border-color);">
                    <td style="padding:0.75rem 1rem;">${item.product_name}</td>
                    <td style="text-align:center;">
                        <button class="btn-icon btn-delete-nw" data-name="${item.product_name}" title="删除" style="color:var(--error-color);">✕</button>
                    </td>
                </tr>
            `).join('');

            nonWearableContainer.querySelectorAll('.btn-delete-nw').forEach(btn => {
                btn.addEventListener('click', async () => {
                    const name = btn.dataset.name;
                    if (confirm(`移除 "${name}"？`)) {
                        try {
                            await removeExcludedNonWearable(name);
                            renderNonWearableList();
                        } catch (e) {
                            window.AppUtils?.showToast?.(e.message, 'error');
                        }
                    }
                });
            });
        }
    }

    if (btnAddNonWearable) {
        btnAddNonWearable.addEventListener('click', async () => {
            const name = nonWearableInput.value.trim();
            if (name) {
                try {
                    await addExcludedNonWearable(name);
                    nonWearableInput.value = '';
                    renderNonWearableList();
                    window.AppUtils?.showToast?.('已添加', 'success');
                } catch (e) {
                    window.AppUtils?.showToast?.(e.message, 'error');
                }
            }
        });
        nonWearableInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') btnAddNonWearable.click();
        });
    }

    // Initial render
    renderExcludedList();
    renderNonWearableList();
}

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
    if (pageId === 'ranking-assignment') {
        return {
            html: generateRankingAssignmentPage(),
            init: initRankingAssignment
        };
    }
    if (pageId === 'ranking-exclusion') {
        return {
            html: generateRankingExclusionPage(),
            init: initRankingExclusion
        };
    }
    return null;
};
