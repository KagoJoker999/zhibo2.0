/**
 * 小号排品功能模块
 * ========================================
 * 与主排品功能相似，但使用独立的数据库表
 * 数据来源：inventory_data
 * 设置表：sub_ranking_config
 * 结果表：sub_ranking_results
 */

// ========================================
// 字段映射（与主排品相同）
// ========================================
const SUB_FIELD_MAPPING = {
    "虚拟分类": "virtual_category",
    "实际库存数": "actual_stock",
    "商品分类": "product_category",
    "可用数": "available_qty",
    "仓位": "warehouse",
    "商品编码": "product_code",
    "商品名称": "product_name",
    "图片网址": "image_url"
};

const SUB_FILTERABLE_FIELDS = [
    "虚拟分类",
    "实际库存数",
    "商品分类",
    "可用数"
];

// ========================================
// 配置加载与保存
// ========================================
async function loadSubRankingConfig() {
    const client = window.supabaseClient;
    if (!client) return null;

    const { data, error } = await client
        .from('sub_ranking_config')
        .select('*')
        .eq('config_key', 'filter_config')
        .single();

    if (error) {
        console.error('加载小号排品配置失败:', error);
        return getDefaultSubConfig();
    }

    return data?.config_value || getDefaultSubConfig();
}

async function saveSubRankingConfig(config) {
    const client = window.supabaseClient;
    if (!client) throw new Error('Supabase 未初始化');

    const { error } = await client
        .from('sub_ranking_config')
        .upsert({
            config_key: 'filter_config',
            config_value: config,
            updated_at: new Date().toISOString()
        }, { onConflict: 'config_key' });

    if (error) throw new Error('保存配置失败: ' + error.message);
}

// ========================================
// 对照配置和仓位转换（用于生成样品仓位）
// ========================================
async function loadMappingConfigForSubRanking() {
    const client = window.supabaseClient;
    if (!client) return { rules: [] };

    const { data, error } = await client
        .from('mapping_config')
        .select('*')
        .eq('config_key', 'warehouse_rules')
        .single();

    if (error) return { rules: [] };
    return data?.config_value || { rules: [] };
}

function calculateSampleWarehouseForSubRanking(warehouse, rules) {
    if (!warehouse || !rules || rules.length === 0) return warehouse || '';

    // 处理多个仓位（用逗号分隔）
    const warehouses = warehouse.split(',').map(w => w.trim());
    const converted = warehouses.map(w => convertSingleWarehouseForSubRanking(w, rules));
    return converted.join(',');
}

function convertSingleWarehouseForSubRanking(warehouse, rules) {
    // 解析仓位格式：X-Y-Z
    const parts = warehouse.split('-');
    if (parts.length !== 3) return warehouse;

    const [first, second, third] = parts;
    const firstNum = parseInt(first);
    if (isNaN(firstNum)) return warehouse;

    // 查找匹配的规则
    for (const rule of rules) {
        if (firstNum >= rule.start && firstNum <= rule.end) {
            // 应用转换规则，格式：前缀-第二段-第三段
            return `${rule.prefix}-${second}-${third}`;
        }
    }

    return warehouse;
}

// 序号分配配置（含排序设置）
function getDefaultNumberConfig() {
    return {
        sortField: 'product_code',  // 排序字段
        sortOrder: 'desc',          // 排序方式
        prefixes: ['A', 'B'],       // 字母前缀序列
        countPerPrefix: 42          // 每个前缀分配的数量
    };
}

async function loadNumberConfig() {
    const client = window.supabaseClient;
    if (!client) return getDefaultNumberConfig();

    const { data, error } = await client
        .from('sub_ranking_config')
        .select('*')
        .eq('config_key', 'number_config')
        .single();

    if (error) return getDefaultNumberConfig();
    return data?.config_value || getDefaultNumberConfig();
}

async function saveNumberConfig(config) {
    const client = window.supabaseClient;
    if (!client) throw new Error('Supabase 未初始化');

    const { error } = await client
        .from('sub_ranking_config')
        .upsert({
            config_key: 'number_config',
            config_value: config,
            updated_at: new Date().toISOString()
        }, { onConflict: 'config_key' });

    if (error) throw new Error('保存序号配置失败: ' + error.message);
}

function getDefaultSubConfig() {
    return {
        "分类排序": ["区间内最多", "区间内最少"],
        "结果映射": {
            "区间内最多": "1.库存多",
            "区间内最少": "2.库存少"
        },
        "样品序号规则": {
            "1.库存多": { "prefix": "H", "start": 1, "step": 1 },
            "2.库存少": { "prefix": "L", "start": 1, "step": 1 }
        },
        "筛选条件": {
            "区间内最多": {
                "filterBy": "available_qty",
                "min": 5,
                "max": 15,
                "sortBy": "available_qty",
                "sortOrder": "desc",
                "limit": 40
            },
            "区间内最少": {
                "filterBy": "available_qty",
                "min": 5,
                "max": 15,
                "sortBy": "available_qty",
                "sortOrder": "asc",
                "limit": 40
            }
        }
    };
}

// ========================================
// 数据加载（加载库存数据并匹配商品ID）
// ========================================
async function loadSubRankingData() {
    const client = window.supabaseClient;
    if (!client) throw new Error('Supabase 未初始化');

    // 并行加载库存数据和商品ID数据
    const [inventoryRes, productIdRes] = await Promise.all([
        client.from('inventory_data').select('*'),
        client.from('product_id_data').select('product_name, product_id')
    ]);

    if (inventoryRes.error) throw new Error('读取库存数据失败: ' + inventoryRes.error.message);

    // 构建商品ID映射表
    const productIdMap = new Map();
    (productIdRes.data || []).forEach(item => {
        if (item.product_name && item.product_id) {
            productIdMap.set(item.product_name, item.product_id);
        }
    });

    // 合并同名商品
    const productMap = new Map();
    const mergeTextField = (existing, newValue) => {
        if (!newValue) return existing;
        if (!existing) return newValue;
        const existingSet = new Set(existing.split(',').map(s => s.trim()).filter(Boolean));
        newValue.split(',').map(s => s.trim()).filter(Boolean).forEach(v => existingSet.add(v));
        return Array.from(existingSet).join(',');
    };

    (inventoryRes.data || []).forEach(item => {
        if (!item.product_name) return;
        const name = item.product_name;

        if (productMap.has(name)) {
            const existing = productMap.get(name);
            existing.available_qty = (existing.available_qty || 0) + (item.available_qty || 0);
            existing.actual_stock = (existing.actual_stock || 0) + (item.actual_stock || 0);
            existing.warehouse = mergeTextField(existing.warehouse, item.warehouse);
            existing.virtual_category = mergeTextField(existing.virtual_category, item.virtual_category);
            existing.product_category = mergeTextField(existing.product_category, item.product_category);
            if (!existing.image_url && item.image_url) existing.image_url = item.image_url;
        } else {
            // 匹配商品ID
            const matchedId = productIdMap.get(name) || '';
            productMap.set(name, {
                ...item,
                product_id: matchedId,
                id_matched: !!matchedId  // 标记是否匹配成功
            });
        }
    });

    return Array.from(productMap.values());
}

// ========================================
// 筛选计算（支持 topN/bottomN 排序）
// ========================================
function calculateSubRanking(products, config, numberConfig = null) {
    const results = [];
    const usedProducts = new Set();
    const categoryOrder = config['分类排序'] || [];
    const resultMapping = config['结果映射'] || {};
    const filterConditions = config['筛选条件'] || {};

    // 使用序号配置或默认值
    const numConfig = numberConfig || getDefaultNumberConfig();
    const prefixes = numConfig.prefixes || ['A', 'B'];
    const countPerPrefix = numConfig.countPerPrefix || 42;
    const sortField = numConfig.sortField || 'product_code';
    const sortOrder = numConfig.sortOrder || 'desc';

    categoryOrder.forEach(categoryKey => {
        const rankingResult = resultMapping[categoryKey];
        if (!rankingResult) return;

        const conditions = filterConditions[categoryKey];
        if (!conditions) return;

        // 筛选未使用的商品
        let candidates = products.filter(p => !usedProducts.has(p.product_name));

        // 筛选逻辑（支持 min/max 范围过滤 + sortBy + limit）
        if (conditions.filterBy && (conditions.min !== undefined || conditions.max !== undefined)) {
            const field = conditions.filterBy;
            candidates = candidates.filter(p => {
                const val = parseFloat(p[field]) || 0;
                if (conditions.min !== undefined && val < conditions.min) return false;
                if (conditions.max !== undefined && val > conditions.max) return false;
                return true;
            });
        }

        if (conditions.sortBy && conditions.limit) {
            const field = conditions.sortBy;
            const order = conditions.sortOrder === 'asc' ? 1 : -1;
            candidates.sort((a, b) => ((a[field] || 0) - (b[field] || 0)) * order);
            candidates = candidates.slice(0, conditions.limit);
        } else if (!conditions.filterBy) {
            // 旧版条件筛选逻辑
            candidates = candidates.filter(p => checkConditions(p, conditions));
        }

        // 添加分类结果（暂不分配序号）
        candidates.forEach(p => {
            results.push({
                ...p,
                ranking_result: rankingResult,
                sample_number: '' // 后续统一分配
            });
            usedProducts.add(p.product_name);
        });
    });

    // 根据配置排序
    const orderMultiplier = sortOrder === 'asc' ? 1 : -1;
    results.sort((a, b) => {
        const valA = a[sortField] || '';
        const valB = b[sortField] || '';
        if (typeof valA === 'number' && typeof valB === 'number') {
            return (valA - valB) * orderMultiplier;
        }
        return String(valA).localeCompare(String(valB)) * orderMultiplier;
    });

    // 分配序号（A01-A42, B01-B42...）
    results.forEach((item, idx) => {
        const prefixIdx = Math.floor(idx / countPerPrefix);
        const seqInPrefix = (idx % countPerPrefix) + 1;
        const prefix = prefixes[prefixIdx] || prefixes[prefixes.length - 1] || 'X';
        item.sample_number = `${prefix}${String(seqInPrefix).padStart(2, '0')}`;
    });

    return results;
}

function checkConditions(product, conditions) {
    for (const [fieldCn, rules] of Object.entries(conditions)) {
        if (typeof rules !== 'object' || !rules['启用']) continue;

        const fieldEn = SUB_FIELD_MAPPING[fieldCn] || fieldCn;
        const value = product[fieldEn];

        if ('大于等于' in rules && (parseFloat(value) || 0) < rules['大于等于']) return false;
        if ('等于' in rules) {
            const allowed = Array.isArray(rules['等于']) ? rules['等于'] : [rules['等于']];
            if (!allowed.some(v => String(value).includes(v))) return false;
        }
        if ('包含' in rules) {
            const keywords = Array.isArray(rules['包含']) ? rules['包含'] : [rules['包含']];
            if (!keywords.some(k => String(value).includes(k))) return false;
        }
    }
    return true;
}

// ========================================
// 保存结果
// ========================================
async function saveSubRankingResults(results) {
    const client = window.supabaseClient;
    if (!client) throw new Error('Supabase 未初始化');

    // 清空旧数据
    await client.from('sub_ranking_results').delete().gte('id', 0);

    if (results.length === 0) return 0;

    const records = results.map(r => ({
        product_name: r.product_name,
        product_id: r.product_id || '',
        ranking_result: r.ranking_result,
        sample_number: r.sample_number,
        image_url: r.image_url || '',
        product_code: r.product_code || '',
        warehouse: r.warehouse || '',
        sample_warehouse: r.sample_warehouse || '',
        available_qty: r.available_qty || 0,
        actual_stock: r.actual_stock || 0,
        total_score: r.total_score || 0
    }));

    const batchSize = 100;
    for (let i = 0; i < records.length; i += batchSize) {
        const batch = records.slice(i, i + batchSize);
        const { error } = await client.from('sub_ranking_results').insert(batch);
        if (error) throw new Error('保存结果失败: ' + error.message);
    }

    return records.length;
}

// ========================================
// 页面生成 - 主页面
// ========================================
function generateSubRankingPage() {
    return `
        <div class="sub-ranking-page">
            <div class="page-intro" style="padding: 1.5rem 1.5rem 0;">
                <h2>📦 小号排品 <span style="color: #ff4d4f; font-weight: bold; font-size: inherit; margin-left: 8px;">需先更新库存</span></h2>
                <p>← sub_ranking_results | 根据库存数据筛选，使用独立配置。小号的样品仓位映射设置在排品设置中进行。</p>
            </div>
            
            <!-- 分页标签 -->
            <div class="tab-container" style="padding: 1rem 1.5rem 0; border-bottom: 1px solid var(--border-color);">
                <button class="tab-btn active" id="tabCalculate" style="padding: 0.5rem 1rem; background: transparent; border: none; border-bottom: 2px solid var(--primary-color); color: var(--text-primary); cursor: pointer; font-weight: 500;">
                    🔄 加载计算
                </button>
                <button class="tab-btn" id="tabHistory" style="padding: 0.5rem 1rem; background: transparent; border: none; border-bottom: 2px solid transparent; color: var(--text-muted); cursor: pointer;">
                    📜 历史记录 <span class="db-table-tag" style="font-size: 0.65rem; background: var(--bg-secondary); padding: 0.1rem 0.3rem; border-radius: 3px;">sub_ranking_results</span>
                </button>
            </div>
            
            <!-- 加载计算面板 -->
            <div id="panelCalculate" class="tab-panel" style="display: block;">
                <div class="ranking-actions" style="padding: 1rem 1.5rem; display: flex; gap: 1rem; align-items: center; flex-wrap: wrap;">
                    <button class="btn btn-primary" id="btnSubCalculate">🔄 加载并计算</button>
                    <button class="btn btn-secondary" id="btnSubSave">💾 保存结果</button>
                    <button class="btn btn-secondary" id="btnCopyUnmatched">📋 复制未匹配</button>
                    <span class="db-table-tag" style="font-size: 0.75rem; color: var(--text-muted); background: var(--bg-secondary); padding: 0.25rem 0.5rem; border-radius: 4px;">→ sub_ranking_results</span>
                    <span id="subRankingStatus" style="color: var(--text-muted); font-size: 0.875rem;"></span>
                </div>
                
                <div class="ranking-content" style="padding: 0 1.5rem 1.5rem;">
                    <div id="subRankingResultContainer" class="data-table-container">
                        <div class="placeholder-content">
                            <p>点击"加载并计算"开始</p>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- 历史记录面板 -->
            <div id="panelHistory" class="tab-panel" style="display: none;">
                <div class="history-actions" style="padding: 1rem 1.5rem; display: flex; gap: 1rem; align-items: center;">
                    <button class="btn btn-secondary" id="btnHistoryCopy1">📋 1-20</button>
                    <button class="btn btn-secondary" id="btnHistoryCopy2">📋 21-40</button>
                    <button class="btn btn-secondary" id="btnHistoryCopy3">📋 41-60</button>
                    <button class="btn btn-secondary" id="btnHistoryCopy4">📋 61-80</button>
                    <button class="btn btn-secondary" id="btnHistoryRefresh" style="margin-left: auto; font-size: 0.75rem; padding: 0.25rem 0.75rem;">🔄 刷新</button>
                </div>
                <div class="history-content" style="padding: 0 1.5rem 1.5rem;">
                    <div id="mappingHistoryContainer" class="data-table-container">
                        <div class="placeholder-content">
                            <p>正在加载历史记录...</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

async function initSubRankingPage() {
    const container = document.getElementById('subRankingResultContainer');
    const statusSpan = document.getElementById('subRankingStatus');
    let currentResults = [];

    const updateStatus = (text) => {
        if (statusSpan) statusSpan.textContent = text;
    };

    // 存储 numberConfig 供重排序使用
    let cachedNumberConfig = null;

    // 重排序并重新分配序号的函数
    const resortAndReassign = () => {
        if (!cachedNumberConfig || currentResults.length === 0) return;

        const sortField = cachedNumberConfig.sortField || 'product_code';
        const sortOrder = cachedNumberConfig.sortOrder || 'desc';
        const prefixes = cachedNumberConfig.prefixes || ['A', 'B'];
        const countPerPrefix = cachedNumberConfig.countPerPrefix || 42;

        // 根据配置排序
        const orderMultiplier = sortOrder === 'asc' ? 1 : -1;
        currentResults.sort((a, b) => {
            const valA = a[sortField] || '';
            const valB = b[sortField] || '';
            if (typeof valA === 'number' && typeof valB === 'number') {
                return (valA - valB) * orderMultiplier;
            }
            return String(valA).localeCompare(String(valB)) * orderMultiplier;
        });

        // 重新分配序号
        currentResults.forEach((item, idx) => {
            const prefixIdx = Math.floor(idx / countPerPrefix);
            const seqInPrefix = (idx % countPerPrefix) + 1;
            const prefix = prefixes[prefixIdx] || prefixes[prefixes.length - 1] || 'X';
            item.sample_number = `${prefix}${String(seqInPrefix).padStart(2, '0')}`;
        });

        // 重新渲染
        renderSubRankingResults(container, currentResults);
        bindIdInputListeners();
        updateStatus(`共 ${currentResults.length} 个商品`);
    };

    // 绑定ID输入监听器
    const bindIdInputListeners = () => {
        container.querySelectorAll('.sub-ranking-id-input').forEach(input => {
            input.addEventListener('input', (e) => {
                const idx = parseInt(e.target.dataset.idx);
                if (!isNaN(idx) && currentResults[idx]) {
                    currentResults[idx].product_id = e.target.value;

                    // 如果填写了ID，立即重排序
                    if (e.target.value) {
                        // 使用 debounce，避免频繁重排
                        clearTimeout(input._debounceTimer);
                        input._debounceTimer = setTimeout(() => {
                            resortAndReassign();
                        }, 500);
                    } else {
                        // 只更新行背景色
                        const row = e.target.closest('tr');
                        if (row) {
                            row.style.background = 'rgba(255, 0, 0, 0.15)';
                            row.classList.add('sub-ranking-unmatched');
                        }
                    }
                }
            });
        });
    };

    // 加载并计算
    document.getElementById('btnSubCalculate')?.addEventListener('click', async () => {
        // 显示红色悬浮提示，提醒用户需要先更新库存
        window.AppUtils?.showCenterAlert?.('请务必先更新库存，才可有效');

        updateStatus('加载中...');
        try {
            const config = await loadSubRankingConfig();
            cachedNumberConfig = await loadNumberConfig();
            const products = await loadSubRankingData();
            currentResults = calculateSubRanking(products, config, cachedNumberConfig);

            // 加载对照配置并生成样品仓位
            const mappingConfig = await loadMappingConfigForSubRanking();
            const warehouseRules = mappingConfig?.rules || [];
            currentResults.forEach(item => {
                item.sample_warehouse = calculateSampleWarehouseForSubRanking(item.warehouse, warehouseRules);
            });

            renderSubRankingResults(container, currentResults);
            updateStatus(`共 ${currentResults.length} 个商品`);
            bindIdInputListeners();
        } catch (error) {
            console.error(error);
            container.innerHTML = `<div class="placeholder-content"><p style="color: var(--error-color);">加载失败: ${error.message}</p></div>`;
            updateStatus('加载失败');
        }
    });

    // 复制未匹配商品名称
    document.getElementById('btnCopyUnmatched')?.addEventListener('click', () => {
        const unmatched = currentResults.filter(r => !r.product_id).map(r => r.product_name);
        if (unmatched.length === 0) {
            window.AppUtils?.showToast?.('所有商品都已匹配ID', 'info');
            return;
        }
        const text = unmatched.join(',');
        navigator.clipboard.writeText(text).then(() => {
            window.AppUtils?.showToast?.(`已复制 ${unmatched.length} 个未匹配商品名称`, 'success');
        }).catch(() => {
            window.AppUtils?.showToast?.('复制失败', 'error');
        });
    });

    // 保存结果
    document.getElementById('btnSubSave')?.addEventListener('click', async () => {
        if (currentResults.length === 0) {
            window.AppUtils?.showToast?.('请先计算结果', 'warning');
            return;
        }
        try {
            const count = await saveSubRankingResults(currentResults);
            window.AppUtils?.showToast?.(`已保存 ${count} 条结果`, 'success');
        } catch (error) {
            window.AppUtils?.showToast?.('保存失败: ' + error.message, 'error');
        }
    });

    // 标签页切换
    const tabCalculate = document.getElementById('tabCalculate');
    const tabHistory = document.getElementById('tabHistory');
    const panelCalculate = document.getElementById('panelCalculate');
    const panelHistory = document.getElementById('panelHistory');

    const switchTab = (activeTab) => {
        if (activeTab === 'calculate') {
            tabCalculate.style.borderBottomColor = 'var(--primary-color)';
            tabCalculate.style.color = 'var(--text-primary)';
            tabHistory.style.borderBottomColor = 'transparent';
            tabHistory.style.color = 'var(--text-muted)';
            panelCalculate.style.display = 'block';
            panelHistory.style.display = 'none';
        } else {
            tabHistory.style.borderBottomColor = 'var(--primary-color)';
            tabHistory.style.color = 'var(--text-primary)';
            tabCalculate.style.borderBottomColor = 'transparent';
            tabCalculate.style.color = 'var(--text-muted)';
            panelHistory.style.display = 'block';
            panelCalculate.style.display = 'none';
        }
    };

    tabCalculate?.addEventListener('click', () => switchTab('calculate'));
    tabHistory?.addEventListener('click', () => switchTab('history'));

    // 历史页复制按钮
    const copyHistoryLinks = (start, end) => {
        const historyContainer = document.getElementById('mappingHistoryContainer');
        const rows = historyContainer?.querySelectorAll('tr[data-product-id]');
        const ids = [];
        if (rows) {
            for (let i = start; i < Math.min(end, rows.length); i++) {
                const id = rows[i]?.dataset?.productId?.trim();
                if (id) {
                    ids.push(`https://haohuo.jinritemai.com/ecommerce/trade/detail/index.html?id=${id}&origin_type=604`);
                }
            }
        }
        if (ids.length === 0) {
            window.AppUtils?.showToast?.('该范围内没有商品ID', 'warning');
            return;
        }
        navigator.clipboard.writeText(ids.join('\n')).then(() => {
            window.AppUtils?.showToast?.(`已复制 ${ids.length} 条链接`, 'success');
        }).catch(() => {
            window.AppUtils?.showToast?.('复制失败', 'error');
        });
    };

    document.getElementById('btnHistoryCopy1')?.addEventListener('click', () => copyHistoryLinks(0, 20));
    document.getElementById('btnHistoryCopy2')?.addEventListener('click', () => copyHistoryLinks(20, 40));
    document.getElementById('btnHistoryCopy3')?.addEventListener('click', () => copyHistoryLinks(40, 60));
    document.getElementById('btnHistoryCopy4')?.addEventListener('click', () => copyHistoryLinks(60, 80));

    // 刷新按钮
    document.getElementById('btnHistoryRefresh')?.addEventListener('click', () => {
        loadMappingHistoryForSubRanking();
        window.AppUtils?.showToast?.('已刷新历史记录', 'success');
    });

    // 自动加载历史记录
    loadMappingHistoryForSubRanking();
}

// 加载并显示 sub_ranking_results 数据
async function loadMappingHistoryForSubRanking() {
    const historyContainer = document.getElementById('mappingHistoryContainer');
    if (!historyContainer) return;

    try {
        const client = window.supabaseClient;
        if (!client) throw new Error('Supabase 未初始化');

        const { data, error } = await client
            .from('sub_ranking_results')
            .select('*')
            .order('sample_number', { ascending: true })
            .limit(100);

        if (error) throw error;

        if (!data || data.length === 0) {
            historyContainer.innerHTML = '<div class="placeholder-content"><p>暂无历史记录</p></div>';
            return;
        }

        // 渲染历史表格（与计算结果表字段一致）
        const html = `
            <table class="data-table" style="width: 100%; border-collapse: collapse; font-size: 0.875rem;">
                <thead>
                    <tr style="background: var(--bg-secondary);">
                        <th style="padding: 0.75rem; text-align: center; width: 50px;">图片</th>
                        <th style="padding: 0.75rem; text-align: left;">商品名称</th>
                        <th style="padding: 0.75rem; text-align: center; width: 100px;">商品编码</th>
                        <th style="padding: 0.75rem; text-align: center; width: 150px;">商品ID</th>
                        <th style="padding: 0.75rem; text-align: center; width: 70px;">分类</th>
                        <th style="padding: 0.75rem; text-align: center; width: 60px;">序号</th>
                        <th style="padding: 0.75rem; text-align: center; width: 80px;">仓位</th>
                        <th style="padding: 0.75rem; text-align: center; width: 80px;">样品仓</th>
                        <th style="padding: 0.75rem; text-align: center; width: 55px;">可用数</th>
                        <th style="padding: 0.75rem; text-align: center; width: 75px;">实际库存数</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.map(item => {
            const imageUrl = item.image_url ? item.image_url.split(',')[0].trim() : '';
            const imageHtml = imageUrl
                ? `<img src="${imageUrl}" style="width: 36px; height: 36px; object-fit: cover; border-radius: 4px;" referrerpolicy="no-referrer" onerror="this.src=''">`
                : '<span style="color: var(--text-muted);">无</span>';
            const productId = item.product_id || '';
            return `
                        <tr style="border-bottom: 1px solid var(--border-color);" data-product-id="${productId}">
                            <td style="padding: 0.4rem; text-align: center;">${imageHtml}</td>
                            <td style="padding: 0.4rem; font-size: 0.8rem;">${item.product_name || '--'}</td>
                            <td style="padding: 0.4rem; text-align: center; font-family: monospace;">${item.product_code || '--'}</td>
                            <td style="padding: 0.4rem; text-align: center; font-family: monospace; font-size: 0.8rem;">${productId || '--'}</td>
                            <td style="padding: 0.4rem; text-align: center; font-size: 0.8rem;">${item.ranking_result || '--'}</td>
                            <td style="padding: 0.4rem; text-align: center;">${item.sample_number || '--'}</td>
                            <td style="padding: 0.4rem; text-align: center; font-size: 0.8rem;">${item.warehouse || '--'}</td>
                            <td style="padding: 0.4rem; text-align: center; font-size: 0.8rem;">${item.sample_warehouse || '--'}</td>
                            <td style="padding: 0.4rem; text-align: center;">${item.available_qty || 0}</td>
                            <td style="padding: 0.4rem; text-align: center;">${item.actual_stock || 0}</td>
                        </tr>
                    `;
        }).join('')}
                </tbody>
            </table>
        `;
        historyContainer.innerHTML = html;
    } catch (error) {
        console.error('加载历史记录失败:', error);
        historyContainer.innerHTML = `<div class="placeholder-content"><p style="color: var(--error-color);">加载失败</p></div>`;
    }
}

function renderSubRankingResults(container, results) {
    if (!results || results.length === 0) {
        container.innerHTML = '<div class="placeholder-content"><p>暂无结果</p></div>';
        return;
    }

    // 按商品ID排序，空ID放最上方
    results.sort((a, b) => {
        const idA = a.product_id || '';
        const idB = b.product_id || '';
        // 空ID放在最上面
        if (!idA && idB) return -1;
        if (idA && !idB) return 1;
        if (!idA && !idB) return 0;
        // 有ID的按ID从小到大排序
        return idA.localeCompare(idB);
    });

    // 中国复古色系
    const categoryColors = {
        '1.库存多': 'rgba(34, 139, 34, 0.15)',   // 翠绿
        '2.库存少': 'rgba(255, 140, 0, 0.15)'   // 琥珀橙
    };

    const html = `
        <table class="data-table" style="width: 100%; border-collapse: collapse; font-size: 0.875rem;">
            <thead>
                <tr style="background: var(--bg-secondary);">
                    <th style="padding: 0.75rem; text-align: center; width: 50px;">图片</th>
                    <th style="padding: 0.75rem; text-align: left;">商品名称</th>
                    <th style="padding: 0.75rem; text-align: center; width: 100px;">商品编码</th>
                    <th style="padding: 0.75rem; text-align: center; width: 180px;">商品ID <span style="font-size: 0.7rem; color: var(--text-muted);">(可编辑)</span></th>
                    <th style="padding: 0.75rem; text-align: center; width: 70px;">分类</th>
                    <th style="padding: 0.75rem; text-align: center; width: 60px;">序号</th>
                    <th style="padding: 0.75rem; text-align: center; width: 80px;">仓位</th>
                    <th style="padding: 0.75rem; text-align: center; width: 80px;">样品仓</th>
                    <th style="padding: 0.75rem; text-align: center; width: 55px;">可用数</th>
                    <th style="padding: 0.75rem; text-align: center; width: 75px;">实际库存数</th>
                </tr>
            </thead>
            <tbody>
                ${results.map((item, idx) => {
        const imageUrl = item.image_url ? item.image_url.split(',')[0].trim() : '';
        const imageHtml = imageUrl
            ? `<img src="${imageUrl}" style="width: 36px; height: 36px; object-fit: cover; border-radius: 4px;" referrerpolicy="no-referrer" onerror="this.src=''">`
            : '<span style="color: var(--text-muted);">无</span>';

        // 判断ID是否匹配（有值就算匹配）
        const hasId = !!item.product_id;
        const bgColor = hasId ? (categoryColors[item.ranking_result] || 'transparent') : 'rgba(255, 0, 0, 0.15)';
        const rowClass = hasId ? '' : 'sub-ranking-unmatched';

        return `
                        <tr style="border-bottom: 1px solid var(--border-color); background: ${bgColor};" data-idx="${idx}" class="${rowClass}">
                            <td style="padding: 0.4rem; text-align: center;">${imageHtml}</td>
                            <td style="padding: 0.4rem; font-size: 0.8rem;">${item.product_name || '--'}</td>
                            <td style="padding: 0.4rem; text-align: center; font-family: monospace;">${item.product_code || '--'}</td>
                            <td style="padding: 0.4rem; text-align: center;">
                                <input type="text" 
                                    class="sub-ranking-id-input" 
                                    data-idx="${idx}" 
                                    value="${item.product_id || ''}" 
                                    placeholder="${hasId ? '' : '未匹配'}"
                                    style="width: 100%; text-align: center; padding: 0.25rem; font-family: monospace; font-size: 0.85rem;">
                            </td>
                            <td style="padding: 0.4rem; text-align: center; font-size: 0.8rem;">${item.ranking_result || '--'}</td>
                            <td style="padding: 0.4rem; text-align: center;">${item.sample_number || '--'}</td>
                            <td style="padding: 0.4rem; text-align: center; font-size: 0.8rem;">${item.warehouse || '--'}</td>
                            <td style="padding: 0.4rem; text-align: center; font-size: 0.8rem;">${item.sample_warehouse || '--'}</td>
                            <td style="padding: 0.4rem; text-align: center;">${item.available_qty || 0}</td>
                            <td style="padding: 0.4rem; text-align: center;">${item.actual_stock || 0}</td>
                        </tr>
                    `;
    }).join('')}
            </tbody>
        </table>
    `;
    container.innerHTML = html;
}

// ========================================
// 页面生成 - 设置页面
// ========================================
function generateSubRankingSettingsPage() {
    return `
        <div class="sub-ranking-settings-page">
            <div class="page-intro" style="padding: 1.5rem 1.5rem 0;">
                <h2>⚙️ 小号排品设置</h2>
                <p>← sub_ranking_config | 配置筛选规则（独立于主排品）</p>
            </div>
            
            <div class="settings-content" style="padding: 1.5rem; display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem;">
                <!-- 左侧：筛选配置 -->
                <div class="settings-card" style="background: var(--bg-card); border: 1px solid var(--border-color); border-radius: var(--border-radius); padding: 1.5rem;">
                    <h3 style="margin: 0 0 1rem;">📋 筛选配置 (JSON)</h3>
                    <p style="color: var(--text-muted); font-size: 0.875rem; margin-bottom: 1rem;">
                        直接编辑 JSON 配置，格式与主排品设置相同
                    </p>
                    
                    <textarea id="subConfigJson" rows="18" style="width: 100%; font-family: monospace; font-size: 0.875rem; resize: vertical;"></textarea>
                    
                    <div style="margin-top: 1rem; display: flex; gap: 1rem;">
                        <button class="btn btn-primary" id="btnSaveSubConfig">💾 保存配置</button>
                        <button class="btn btn-secondary" id="btnResetSubConfig">🔄 重置为默认</button>
                    </div>
                </div>
                
                <!-- 右侧：序号分配设置 -->
                <div class="settings-card" style="background: var(--bg-card); border: 1px solid var(--border-color); border-radius: var(--border-radius); padding: 1.5rem;">
                    <h3 style="margin: 0 0 1rem;">🔢 序号分配设置</h3>
                    <p style="color: var(--text-muted); font-size: 0.875rem; margin-bottom: 1rem;">
                        配置加载计算后的排序规则和序号分配
                    </p>
                    
                    <div style="display: flex; flex-direction: column; gap: 1rem;">
                        <!-- 排序设置 -->
                        <div style="background: var(--bg-secondary); padding: 1rem; border-radius: var(--border-radius);">
                            <p style="margin: 0 0 0.75rem; font-weight: 500;">📊 排序设置</p>
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;">
                                <div>
                                    <label style="display: block; margin-bottom: 0.25rem; font-size: 0.8rem;">排序字段</label>
                                    <select id="sortField" style="width: 100%; padding: 0.4rem; font-size: 0.875rem;">
                                        <option value="product_id">商品ID</option>
                                        <option value="product_code">商品编码</option>
                                        <option value="available_qty">可用数</option>
                                        <option value="actual_stock">库存</option>
                                        <option value="product_name">商品名称</option>
                                    </select>
                                </div>
                                <div>
                                    <label style="display: block; margin-bottom: 0.25rem; font-size: 0.8rem;">排序方式</label>
                                    <select id="sortOrder" style="width: 100%; padding: 0.4rem; font-size: 0.875rem;">
                                        <option value="desc">从大到小</option>
                                        <option value="asc">从小到大</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                        
                        <!-- 序号前缀设置 -->
                        <div>
                            <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">字母前缀序列</label>
                            <input type="text" id="numberPrefixes" placeholder="A,B,C" style="width: 100%; padding: 0.5rem; font-size: 0.875rem;" />
                            <p style="color: var(--text-muted); font-size: 0.75rem; margin-top: 0.25rem;">用逗号分隔，如：A,B,C</p>
                        </div>
                        
                        <div>
                            <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">每个前缀分配数量</label>
                            <input type="number" id="numberCount" min="1" max="99" value="42" style="width: 100%; padding: 0.5rem; font-size: 0.875rem;" />
                            <p style="color: var(--text-muted); font-size: 0.75rem; margin-top: 0.25rem;">如设置42，则分配 A01-A42</p>
                        </div>
                        
                        <div style="background: var(--bg-secondary); padding: 1rem; border-radius: var(--border-radius);">
                            <p style="margin: 0; font-size: 0.875rem;"><strong>预览：</strong></p>
                            <p id="numberPreview" style="margin: 0.5rem 0 0; color: var(--text-muted); font-size: 0.875rem;">A01-A42, B01-B42</p>
                        </div>
                    </div>
                    
                    <div style="margin-top: 1.5rem; display: flex; gap: 1rem;">
                        <button class="btn btn-primary" id="btnSaveNumberConfig">💾 保存配置</button>
                        <button class="btn btn-secondary" id="btnResetNumberConfig">🔄 重置为默认</button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

async function initSubRankingSettingsPage() {
    const textarea = document.getElementById('subConfigJson');
    const prefixInput = document.getElementById('numberPrefixes');
    const countInput = document.getElementById('numberCount');
    const sortFieldSelect = document.getElementById('sortField');
    const sortOrderSelect = document.getElementById('sortOrder');
    const previewEl = document.getElementById('numberPreview');

    // 更新预览
    const updatePreview = () => {
        const prefixes = prefixInput.value.split(',').map(p => p.trim()).filter(p => p);
        const count = parseInt(countInput.value) || 42;
        if (prefixes.length === 0) {
            previewEl.textContent = '请输入前缀';
            return;
        }
        const preview = prefixes.map(p => `${p}01-${p}${String(count).padStart(2, '0')}`).join(', ');
        previewEl.textContent = preview;
    };

    // 加载筛选配置
    const config = await loadSubRankingConfig();
    textarea.value = JSON.stringify(config, null, 2);

    // 加载序号配置
    const numberConfig = await loadNumberConfig();
    prefixInput.value = (numberConfig.prefixes || ['A', 'B']).join(',');
    countInput.value = numberConfig.countPerPrefix || 42;
    sortFieldSelect.value = numberConfig.sortField || 'product_code';
    sortOrderSelect.value = numberConfig.sortOrder || 'desc';
    updatePreview();

    // 监听输入变化更新预览
    prefixInput.addEventListener('input', updatePreview);
    countInput.addEventListener('input', updatePreview);

    // 保存筛选配置
    document.getElementById('btnSaveSubConfig')?.addEventListener('click', async () => {
        try {
            const newConfig = JSON.parse(textarea.value);
            await saveSubRankingConfig(newConfig);
            window.AppUtils?.showToast?.('筛选配置已保存', 'success');
        } catch (error) {
            window.AppUtils?.showToast?.('配置无效: ' + error.message, 'error');
        }
    });

    // 重置筛选配置
    document.getElementById('btnResetSubConfig')?.addEventListener('click', () => {
        textarea.value = JSON.stringify(getDefaultSubConfig(), null, 2);
        window.AppUtils?.showToast?.('已重置为默认配置', 'info');
    });

    // 保存序号配置
    document.getElementById('btnSaveNumberConfig')?.addEventListener('click', async () => {
        try {
            const newNumberConfig = {
                sortField: sortFieldSelect.value,
                sortOrder: sortOrderSelect.value,
                prefixes: prefixInput.value.split(',').map(p => p.trim()).filter(p => p),
                countPerPrefix: parseInt(countInput.value) || 42
            };
            await saveNumberConfig(newNumberConfig);
            window.AppUtils?.showToast?.('序号配置已保存', 'success');
        } catch (error) {
            window.AppUtils?.showToast?.('保存失败: ' + error.message, 'error');
        }
    });

    // 重置序号配置
    document.getElementById('btnResetNumberConfig')?.addEventListener('click', () => {
        const defaultConfig = getDefaultNumberConfig();
        prefixInput.value = defaultConfig.prefixes.join(',');
        countInput.value = defaultConfig.countPerPrefix;
        sortFieldSelect.value = defaultConfig.sortField;
        sortOrderSelect.value = defaultConfig.sortOrder;
        updatePreview();
        window.AppUtils?.showToast?.('已重置为默认序号配置', 'info');
    });
}

// ========================================
// 导出加载函数
// ========================================
window.loadSubRankingPage = function (pageId) {
    switch (pageId) {
        case 'sub-ranking':
            return { html: generateSubRankingPage(), init: initSubRankingPage };
        case 'sub-ranking-settings':
            return { html: generateSubRankingSettingsPage(), init: initSubRankingSettingsPage };
        default:
            return null;
    }
};
