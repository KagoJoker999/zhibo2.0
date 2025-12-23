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

function getDefaultSubConfig() {
    return {
        "分类排序": ["可用数最多", "可用数最少"],
        "结果映射": {
            "可用数最多": "1.库存多",
            "可用数最少": "2.库存少"
        },
        "样品序号规则": {
            "1.库存多": { "prefix": "H", "start": 1, "step": 1 },
            "2.库存少": { "prefix": "L", "start": 1, "step": 1 }
        },
        "筛选条件": {
            "可用数最多": {
                "sortBy": "available_qty",
                "sortOrder": "desc",
                "limit": 40
            },
            "可用数最少": {
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
function calculateSubRanking(products, config) {
    const results = [];
    const usedProducts = new Set();
    const categoryOrder = config['分类排序'] || [];
    const resultMapping = config['结果映射'] || {};
    const filterConditions = config['筛选条件'] || {};
    const sampleRules = config['样品序号规则'] || {};

    categoryOrder.forEach(categoryKey => {
        const rankingResult = resultMapping[categoryKey];
        if (!rankingResult) return;

        const conditions = filterConditions[categoryKey];
        if (!conditions) return;

        // 筛选未使用的商品
        let candidates = products.filter(p => !usedProducts.has(p.product_name));

        // 排序逻辑（支持 sortBy + sortOrder + limit）
        if (conditions.sortBy && conditions.limit) {
            const field = conditions.sortBy;
            const order = conditions.sortOrder === 'asc' ? 1 : -1;
            candidates.sort((a, b) => ((a[field] || 0) - (b[field] || 0)) * order);
            candidates = candidates.slice(0, conditions.limit);
        } else {
            // 旧版条件筛选逻辑
            candidates = candidates.filter(p => checkConditions(p, conditions));
        }

        // 分配样品序号
        const rule = sampleRules[rankingResult] || { prefix: 'S', start: 1, step: 1 };
        let seq = rule.start;

        candidates.forEach(p => {
            results.push({
                ...p,
                ranking_result: rankingResult,
                sample_number: `${rule.prefix}${String(seq).padStart(2, '0')}`
            });
            usedProducts.add(p.product_name);
            seq += rule.step;
        });
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
                <h2>📦 小号排品</h2>
                <p>← sub_ranking_results | 根据库存数据筛选，使用独立配置</p>
            </div>
            
            <div class="ranking-actions" style="padding: 1rem 1.5rem; display: flex; gap: 1rem; align-items: center;">
                <button class="btn btn-primary" id="btnSubCalculate">🔄 加载并计算</button>
                <button class="btn btn-secondary" id="btnSubSave">💾 保存结果</button>
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
    `;
}

async function initSubRankingPage() {
    const container = document.getElementById('subRankingResultContainer');
    const statusSpan = document.getElementById('subRankingStatus');
    let currentResults = [];

    const updateStatus = (text) => {
        if (statusSpan) statusSpan.textContent = text;
    };

    // 加载并计算
    document.getElementById('btnSubCalculate')?.addEventListener('click', async () => {
        updateStatus('加载中...');
        try {
            const config = await loadSubRankingConfig();
            const products = await loadSubRankingData();
            currentResults = calculateSubRanking(products, config);
            renderSubRankingResults(container, currentResults);
            updateStatus(`共 ${currentResults.length} 个商品`);

            // 监听ID输入变化，更新数据并动态改变行背景色
            container.querySelectorAll('.sub-ranking-id-input').forEach(input => {
                input.addEventListener('input', (e) => {
                    const idx = parseInt(e.target.dataset.idx);
                    if (!isNaN(idx) && currentResults[idx]) {
                        currentResults[idx].product_id = e.target.value;

                        // 动态更新行背景色
                        const row = e.target.closest('tr');
                        if (row) {
                            const hasId = !!e.target.value;
                            const categoryColors = {
                                '1.库存多': 'rgba(34, 139, 34, 0.15)',
                                '2.库存少': 'rgba(255, 140, 0, 0.15)'
                            };
                            const rankResult = currentResults[idx].ranking_result;
                            row.style.background = hasId ? (categoryColors[rankResult] || 'transparent') : 'rgba(255, 0, 0, 0.15)';
                            row.classList.toggle('sub-ranking-unmatched', !hasId);
                        }
                    }
                });
            });
        } catch (error) {
            console.error(error);
            container.innerHTML = `<div class="placeholder-content"><p style="color: var(--error-color);">加载失败: ${error.message}</p></div>`;
            updateStatus('加载失败');
        }
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
}

function renderSubRankingResults(container, results) {
    if (!results || results.length === 0) {
        container.innerHTML = '<div class="placeholder-content"><p>暂无结果</p></div>';
        return;
    }

    // 按商品编码从大到小排序
    results.sort((a, b) => {
        const codeA = a.product_code || '';
        const codeB = b.product_code || '';
        return codeB.localeCompare(codeA);
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
                    <th style="padding: 0.75rem; text-align: center; width: 55px;">可用数</th>
                    <th style="padding: 0.75rem; text-align: center; width: 60px;">库存</th>
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
            
            <div class="settings-content" style="padding: 1.5rem;">
                <div class="settings-card" style="background: var(--bg-card); border: 1px solid var(--border-color); border-radius: var(--border-radius); padding: 1.5rem;">
                    <h3 style="margin: 0 0 1rem;">📋 筛选配置 (JSON)</h3>
                    <p style="color: var(--text-muted); font-size: 0.875rem; margin-bottom: 1rem;">
                        直接编辑 JSON 配置，格式与主排品设置相同
                    </p>
                    
                    <textarea id="subConfigJson" rows="20" style="width: 100%; font-family: monospace; font-size: 0.875rem; resize: vertical;"></textarea>
                    
                    <div style="margin-top: 1rem; display: flex; gap: 1rem;">
                        <button class="btn btn-primary" id="btnSaveSubConfig">💾 保存配置</button>
                        <button class="btn btn-secondary" id="btnResetSubConfig">🔄 重置为默认</button>
                    </div>
                </div>
            </div>
        </div >
    `;
}

async function initSubRankingSettingsPage() {
    const textarea = document.getElementById('subConfigJson');

    // 加载配置
    const config = await loadSubRankingConfig();
    textarea.value = JSON.stringify(config, null, 2);

    // 保存配置
    document.getElementById('btnSaveSubConfig')?.addEventListener('click', async () => {
        try {
            const newConfig = JSON.parse(textarea.value);
            await saveSubRankingConfig(newConfig);
            window.AppUtils?.showToast?.('配置已保存', 'success');
        } catch (error) {
            window.AppUtils?.showToast?.('配置无效: ' + error.message, 'error');
        }
    });

    // 重置配置
    document.getElementById('btnResetSubConfig')?.addEventListener('click', () => {
        textarea.value = JSON.stringify(getDefaultSubConfig(), null, 2);
        window.AppUtils?.showToast?.('已重置为默认配置', 'info');
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
