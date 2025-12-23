/**
 * 排品对照功能模块
 * ========================================
 * 包含三个子功能：排品对照主页、历史记录、对照设置
 */

// ========================================
// 配置加载与保存
// ========================================
async function loadMappingConfig() {
    const client = window.supabaseClient;
    if (!client) return null;

    const { data, error } = await client
        .from('mapping_config')
        .select('*')
        .eq('config_key', 'warehouse_rules')
        .single();

    if (error) {
        console.error('加载对照配置失败:', error);
        return { rules: [] };
    }

    return data?.config_value || { rules: [] };
}

async function saveMappingConfig(config) {
    const client = window.supabaseClient;
    if (!client) throw new Error('Supabase 未初始化');

    const { error } = await client
        .from('mapping_config')
        .upsert({
            config_key: 'warehouse_rules',
            config_value: config,
            updated_at: new Date().toISOString()
        }, { onConflict: 'config_key' });

    if (error) throw new Error('保存配置失败: ' + error.message);
}

// ========================================
// 仓位转换逻辑
// ========================================
function calculateSampleWarehouse(warehouse, rules) {
    if (!warehouse || !rules || rules.length === 0) return warehouse;

    // 处理多个仓位（用逗号分隔）
    const warehouses = warehouse.split(',').map(w => w.trim());
    const converted = warehouses.map(w => convertSingleWarehouse(w, rules));
    return converted.join(',');
}

function convertSingleWarehouse(warehouse, rules) {
    // 解析仓位格式：X-Y-Z
    const parts = warehouse.split('-');
    if (parts.length !== 3) return warehouse;

    const [first, second, third] = parts;
    const secondNum = parseInt(second);
    if (isNaN(secondNum)) return warehouse;

    // 查找匹配的规则
    for (const rule of rules) {
        if (secondNum >= rule.range_start && secondNum <= rule.range_end) {
            // 不显示第一位，只返回 sample_value-第三位
            return `${rule.sample_value}-${third}`;
        }
    }

    return warehouse;
}

// ========================================
// 数据加载与合并
// ========================================
async function loadMappingData() {
    const client = window.supabaseClient;
    if (!client) throw new Error('Supabase 未初始化');

    // 并行加载两个表的数据
    const [rankingRes, newProductRes] = await Promise.all([
        client.from('ranking_results').select('*'),
        client.from('new_product_data').select('*')
    ]);

    if (rankingRes.error) throw new Error('加载排品结果失败: ' + rankingRes.error.message);
    if (newProductRes.error) throw new Error('加载新品数据失败: ' + newProductRes.error.message);

    // 合并数据
    return mergeAndDeduplicate(rankingRes.data || [], newProductRes.data || []);
}

function mergeAndDeduplicate(rankingData, newProductData) {
    const productMap = new Map();

    // 辅助函数：合并文本字段
    const mergeField = (existing, newValue) => {
        if (!newValue) return existing || '';
        if (!existing) return newValue;
        const existingSet = new Set(existing.split(',').map(s => s.trim()).filter(Boolean));
        newValue.split(',').map(s => s.trim()).filter(Boolean).forEach(v => existingSet.add(v));
        return Array.from(existingSet).join(',');
    };

    // 处理排品结果数据
    rankingData.forEach(item => {
        const name = item.product_name;
        if (!name) return;

        if (productMap.has(name)) {
            const existing = productMap.get(name);
            existing.warehouse = mergeField(existing.warehouse, item.warehouse);
            existing.available_qty = (existing.available_qty || 0) + (item.available_qty || 0);
            existing.actual_stock = (existing.actual_stock || 0) + (item.actual_stock || 0);
            if (!existing.image_url && item.image_url) existing.image_url = item.image_url;
        } else {
            productMap.set(name, {
                product_name: name,
                product_id: item.product_id || '',
                ranking_result: item.ranking_result || '',
                sample_number: item.sample_number || '',
                image_url: item.image_url || '',
                warehouse: item.warehouse || '',
                available_qty: item.available_qty || 0,
                actual_stock: item.actual_stock || 0
            });
        }
    });

    // 处理新品数据
    newProductData.forEach(item => {
        const name = item.product_name;
        if (!name) return;

        if (productMap.has(name)) {
            const existing = productMap.get(name);
            existing.warehouse = mergeField(existing.warehouse, item.warehouse);
            existing.available_qty = (existing.available_qty || 0) + (item.available_qty || 0);
            existing.actual_stock = (existing.actual_stock || 0) + (item.actual_stock || 0);
            if (!existing.image_url && item.image_url) existing.image_url = item.image_url;
            if (!existing.ranking_result && item.ranking_result) existing.ranking_result = item.ranking_result;
            if (!existing.sample_number && item.sample_number) existing.sample_number = item.sample_number;
            // 如果仍然没有分类，设置为"新品"
            if (!existing.ranking_result) existing.ranking_result = '新品';
        } else {
            productMap.set(name, {
                product_name: name,
                product_id: item.product_id || '',
                ranking_result: item.ranking_result || '新品',  // 默认分类为"新品"
                sample_number: item.sample_number || '',
                image_url: item.image_url || '',
                warehouse: item.warehouse || '',
                available_qty: item.available_qty || 0,
                actual_stock: item.actual_stock || 0
            });
        }
    });

    // 转换为数组并按序号排序（先按字母前缀，再按数字）
    const result = Array.from(productMap.values());
    result.sort((a, b) => {
        const aSeq = a.sample_number || '';
        const bSeq = b.sample_number || '';

        // 提取字母前缀（如 "A02" → "A"）
        const aPrefix = aSeq.replace(/[0-9]/g, '') || 'Z';
        const bPrefix = bSeq.replace(/[0-9]/g, '') || 'Z';

        // 先按字母排序
        if (aPrefix !== bPrefix) return aPrefix.localeCompare(bPrefix);

        // 再按数字排序
        const aNum = parseInt(aSeq.replace(/\D/g, '')) || 999;
        const bNum = parseInt(bSeq.replace(/\D/g, '')) || 999;
        return aNum - bNum;
    });

    return result;
}

// ========================================
// 历史记录
// ========================================
async function saveToHistory(data) {
    const client = window.supabaseClient;
    if (!client) throw new Error('Supabase 未初始化');

    // 清空旧记录
    await client.from('mapping_history').delete().gte('id', 0);

    // 插入新记录
    const now = new Date().toISOString();
    const records = data.map(item => ({
        ...item,
        generated_at: now
    }));

    const batchSize = 100;
    for (let i = 0; i < records.length; i += batchSize) {
        const batch = records.slice(i, i + batchSize);
        const { error } = await client.from('mapping_history').insert(batch);
        if (error) throw new Error('保存历史记录失败: ' + error.message);
    }

    return records.length;
}

async function loadHistoryData() {
    const client = window.supabaseClient;
    if (!client) return [];

    const { data, error } = await client
        .from('mapping_history')
        .select('*')
        .order('ranking_result', { ascending: true });

    if (error) {
        console.error('加载历史记录失败:', error);
        return [];
    }

    return data || [];
}

// ========================================
// 页面生成 - 排品对照主页
// ========================================
function generateMappingPage() {
    return `
        <div class="mapping-page">
            <div class="page-intro" style="padding: 1.5rem 1.5rem 0;">
                <h2>🔗 排品对照表</h2>
                <p>合并显示排品结果和新品数据，自动计算样品仓位</p>
            </div>
            
            <div class="mapping-actions" style="padding: 1rem 1.5rem; display: flex; gap: 1rem; align-items: center; flex-wrap: wrap;">
                <button class="btn btn-primary" id="btnRefreshMapping">🔄 刷新数据</button>
                <span class="db-table-tag" style="font-size: 0.75rem; color: var(--text-muted); background: var(--bg-secondary); padding: 0.25rem 0.5rem; border-radius: 4px;">← ranking_results + new_product_data</span>
                <button class="btn btn-secondary" id="btnSaveHistory">💾 保存到历史</button>
                <span class="db-table-tag" style="font-size: 0.75rem; color: var(--text-muted); background: var(--bg-secondary); padding: 0.25rem 0.5rem; border-radius: 4px;">→ mapping_history</span>
                <span id="mappingStatus" style="color: var(--text-muted); font-size: 0.875rem; margin-left: auto;"></span>
            </div>
            
            <div class="mapping-content" style="padding: 0 1.5rem 1.5rem;">
                <div id="mappingTableContainer" class="data-table-container">
                    <div class="placeholder-content">
                        <p>正在加载数据...</p>
                    </div>
                </div>
            </div>
        </div>
    `;
}

async function initMappingPage() {
    const container = document.getElementById('mappingTableContainer');
    const statusSpan = document.getElementById('mappingStatus');

    const updateStatus = (text) => {
        if (statusSpan) statusSpan.textContent = text;
    };

    // 加载配置
    const config = await loadMappingConfig();
    const rules = config?.rules || [];

    // 刷新数据
    const refreshData = async () => {
        updateStatus('加载中...');
        try {
            const data = await loadMappingData();
            // 计算样品仓位
            data.forEach(item => {
                item.sample_warehouse = calculateSampleWarehouse(item.warehouse, rules);
            });
            renderMappingTable(container, data);
            updateStatus(`共 ${data.length} 个商品`);
            window._currentMappingData = data; // 缓存用于保存
        } catch (error) {
            console.error(error);
            container.innerHTML = `<div class="placeholder-content"><p style="color: var(--error-color);">加载失败: ${error.message}</p></div>`;
            updateStatus('加载失败');
        }
    };

    // 绑定事件
    document.getElementById('btnRefreshMapping')?.addEventListener('click', refreshData);
    document.getElementById('btnSaveHistory')?.addEventListener('click', async () => {
        if (!window._currentMappingData) {
            window.AppUtils?.showToast?.('请先刷新数据', 'warning');
            return;
        }
        try {
            const count = await saveToHistory(window._currentMappingData);
            window.AppUtils?.showToast?.(`已保存 ${count} 条到历史记录`, 'success');
        } catch (error) {
            window.AppUtils?.showToast?.('保存失败: ' + error.message, 'error');
        }
    });

    // 初始加载
    await refreshData();
}

function renderMappingTable(container, data) {
    if (!data || data.length === 0) {
        container.innerHTML = '<div class="placeholder-content"><p>暂无数据</p></div>';
        return;
    }

    // 中国复古色系 - 根据分类分配不同背景色
    const categoryColors = {
        '1.评分品A': 'rgba(139, 69, 19, 0.15)',    // 朱砂棕
        '2.佩戴品': 'rgba(0, 128, 128, 0.15)',     // 青碧
        '3.周边品': 'rgba(128, 0, 128, 0.15)',    // 紫檀
        '4.评分品B': 'rgba(184, 134, 11, 0.15)',  // 金琥珀
        '5.库存品': 'rgba(85, 107, 47, 0.15)',    // 墨绿
        '新品': 'rgba(70, 130, 180, 0.15)'         // 靛蓝
    };

    const html = `
        <table class="data-table" style="width: 100%; border-collapse: collapse; font-size: 0.875rem;">
            <thead>
                <tr style="background: var(--bg-secondary);">
                    <th style="padding: 0.75rem; text-align: center; width: 60px;">图片</th>
                    <th style="padding: 0.75rem; text-align: left;">商品名称</th>
                    <th style="padding: 0.75rem; text-align: center; width: 100px;">分类</th>
                    <th style="padding: 0.75rem; text-align: center; width: 80px;">序号</th>
                    <th style="padding: 0.75rem; text-align: center; width: 100px;">仓位</th>
                    <th style="padding: 0.75rem; text-align: center; width: 100px;">样品仓位</th>
                    <th style="padding: 0.75rem; text-align: center; width: 70px;">可用数</th>
                    <th style="padding: 0.75rem; text-align: center; width: 80px;">实际库存</th>
                </tr>
            </thead>
            <tbody>
                ${data.map(item => {
        const imageUrl = item.image_url ? item.image_url.split(',')[0].trim() : '';
        const imageHtml = imageUrl
            ? `<img src="${imageUrl}" style="width: 40px; height: 40px; object-fit: cover; border-radius: 4px;" referrerpolicy="no-referrer" onerror="this.src=''">`
            : '<span style="color: var(--text-muted);">无</span>';
        const bgColor = categoryColors[item.ranking_result] || 'transparent';
        return `
                        <tr style="border-bottom: 1px solid var(--border-color); background: ${bgColor};">
                            <td style="padding: 0.5rem; text-align: center;">${imageHtml}</td>
                            <td style="padding: 0.5rem;">${item.product_name || '--'}</td>
                            <td style="padding: 0.5rem; text-align: center;">${item.ranking_result || '--'}</td>
                            <td style="padding: 0.5rem; text-align: center;">${item.sample_number || '--'}</td>
                            <td style="padding: 0.5rem; text-align: center;">${item.warehouse || '--'}</td>
                            <td style="padding: 0.5rem; text-align: center; color: var(--primary-color);">${item.sample_warehouse || '--'}</td>
                            <td style="padding: 0.5rem; text-align: center;">${item.available_qty || 0}</td>
                            <td style="padding: 0.5rem; text-align: center;">${item.actual_stock || 0}</td>
                        </tr>
                    `;
    }).join('')}
            </tbody>
        </table>
    `;
    container.innerHTML = html;
}

// ========================================
// 页面生成 - 历史记录
// ========================================
function generateMappingHistoryPage() {
    return `
        <div class="mapping-history-page">
            <div class="page-intro" style="padding: 1.5rem 1.5rem 0;">
                <h2>📜 历史记录 <span class="db-table-tag" style="font-size: 0.75rem; color: var(--text-muted); background: var(--bg-secondary); padding: 0.25rem 0.5rem; border-radius: 4px; vertical-align: middle;">mapping_history</span></h2>
                <p>显示上一次保存的对照结果</p>
            </div>
            
            <div class="history-info" style="padding: 1rem 1.5rem;">
                <span id="historyGeneratedTime" style="color: var(--text-muted); font-size: 0.875rem;"></span>
            </div>
            
            <div class="history-content" style="padding: 0 1.5rem 1.5rem;">
                <div id="historyTableContainer" class="data-table-container">
                    <div class="placeholder-content">
                        <p>正在加载历史记录...</p>
                    </div>
                </div>
            </div>
        </div>
    `;
}

async function initMappingHistoryPage() {
    const container = document.getElementById('historyTableContainer');
    const timeSpan = document.getElementById('historyGeneratedTime');

    try {
        const data = await loadHistoryData();

        // 按与主页面相同的逻辑排序（先按字母前缀，再按数字）
        data.sort((a, b) => {
            const aSeq = a.sample_number || '';
            const bSeq = b.sample_number || '';
            const aPrefix = aSeq.replace(/[0-9]/g, '') || 'Z';
            const bPrefix = bSeq.replace(/[0-9]/g, '') || 'Z';
            if (aPrefix !== bPrefix) return aPrefix.localeCompare(bPrefix);
            const aNum = parseInt(aSeq.replace(/\D/g, '')) || 999;
            const bNum = parseInt(bSeq.replace(/\D/g, '')) || 999;
            return aNum - bNum;
        });

        if (data.length > 0 && data[0].generated_at) {
            const time = new Date(data[0].generated_at).toLocaleString('zh-CN');
            timeSpan.textContent = `生成时间: ${time}`;
        } else {
            timeSpan.textContent = '';
        }
        renderMappingTable(container, data);
    } catch (error) {
        console.error(error);
        container.innerHTML = `<div class="placeholder-content"><p style="color: var(--error-color);">加载失败</p></div>`;
    }
}

// ========================================
// 页面生成 - 对照设置
// ========================================
function generateMappingSettingsPage() {
    return `
        <div class="mapping-settings-page">
            <div class="page-intro" style="padding: 1.5rem 1.5rem 0;">
                <h2>⚙️ 对照设置</h2>
                <p>配置仓位到样品仓位的映射规则</p>
            </div>
            
            <div class="settings-content" style="padding: 1.5rem; display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem;">
                <!-- 左侧：仓位映射规则 -->
                <div class="settings-card" style="background: var(--bg-card); border: 1px solid var(--border-color); border-radius: var(--border-radius); padding: 1.5rem;">
                    <h3 style="margin: 0 0 1rem;">📦 仓位映射规则</h3>
                    <p style="color: var(--text-muted); font-size: 0.875rem; margin-bottom: 1rem;">
                        仓位格式为 X-Y-Z，第二位 Y 在区间内时替换为对应样品仓位
                    </p>
                    
                    <div class="rule-editor" style="display: grid; grid-template-columns: 1fr 1fr 1fr auto; gap: 0.75rem; align-items: end; margin-bottom: 1rem;">
                        <div>
                            <label style="display: block; margin-bottom: 0.5rem; font-size: 0.875rem; color: var(--text-secondary);">区间起始</label>
                            <input type="number" id="ruleRangeStart" value="1" min="1" style="width: 100%;">
                        </div>
                        <div>
                            <label style="display: block; margin-bottom: 0.5rem; font-size: 0.875rem; color: var(--text-secondary);">区间结束</label>
                            <input type="number" id="ruleRangeEnd" value="10" min="1" style="width: 100%;">
                        </div>
                        <div>
                            <label style="display: block; margin-bottom: 0.5rem; font-size: 0.875rem; color: var(--text-secondary);">样品仓位</label>
                            <select id="ruleSampleValue" style="width: 100%; height: 38px;">
                                <option value="">请选择</option>
                            </select>
                        </div>
                        <button class="btn btn-primary" id="btnAddRule" style="height: 38px;">➕ 添加</button>
                    </div>
                    
                    <div id="rulesListContainer" style="margin-top: 1rem;">
                        <h4 style="margin: 0 0 0.5rem; color: var(--text-secondary); font-size: 0.875rem;">已添加规则：</h4>
                        <div id="rulesList"></div>
                    </div>
                    
                    <div style="margin-top: 1.5rem; padding-top: 1rem; border-top: 1px solid var(--border-color);">
                        <button class="btn btn-primary" id="btnSaveConfig">💾 保存规则</button>
                    </div>
                </div>
                
                <!-- 右侧：样品仓位选项设置 -->
                <div class="settings-card" style="background: var(--bg-card); border: 1px solid var(--border-color); border-radius: var(--border-radius); padding: 1.5rem;">
                    <h3 style="margin: 0 0 1rem;">📋 样品仓位选项</h3>
                    <p style="color: var(--text-muted); font-size: 0.875rem; margin-bottom: 1rem;">
                        每行一个选项，保存后可在左侧下拉栏选择
                    </p>
                    
                    <textarea id="sampleOptions" rows="10" style="width: 100%; font-family: monospace; resize: vertical;" placeholder="例如：
1-10-1
1-10-2
1-10-3
1-10-4
1-10-5"></textarea>
                    
                    <div style="margin-top: 1rem;">
                        <button class="btn btn-primary" id="btnSaveOptions">💾 保存选项</button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

async function initMappingSettingsPage() {
    const rulesList = document.getElementById('rulesList');
    const sampleSelect = document.getElementById('ruleSampleValue');
    const optionsTextarea = document.getElementById('sampleOptions');
    let currentRules = [];
    let sampleOptions = [];

    // 加载现有配置
    const config = await loadMappingConfig();
    currentRules = config?.rules || [];
    sampleOptions = config?.sample_options || [];

    // 初始化选项列表
    optionsTextarea.value = sampleOptions.join('\n');
    updateSelectOptions();
    renderRulesList();

    function updateSelectOptions() {
        const options = optionsTextarea.value.split('\n').map(s => s.trim()).filter(Boolean);
        sampleSelect.innerHTML = '<option value="">请选择</option>' +
            options.map(opt => `<option value="${opt}">${opt}</option>`).join('');
    }

    function renderRulesList() {
        if (currentRules.length === 0) {
            rulesList.innerHTML = '<p style="color: var(--text-muted); font-size: 0.875rem;">暂无规则</p>';
            return;
        }

        rulesList.innerHTML = currentRules.map((rule, idx) => `
            <div style="display: flex; align-items: center; gap: 1rem; padding: 0.75rem; background: var(--bg-secondary); border-radius: var(--border-radius-sm); margin-bottom: 0.5rem;">
                <span style="flex: 1;">第二位 <strong>${rule.range_start}</strong> ~ <strong>${rule.range_end}</strong> → <strong style="color: var(--primary-color);">${rule.sample_value}</strong></span>
                <button class="btn btn-sm" onclick="window._removeRule(${idx})" style="padding: 0.25rem 0.5rem; background: var(--error-color); color: white; border: none; border-radius: 4px; cursor: pointer;">删除</button>
            </div>
        `).join('');
    }

    // 添加规则
    document.getElementById('btnAddRule')?.addEventListener('click', () => {
        const start = parseInt(document.getElementById('ruleRangeStart').value);
        const end = parseInt(document.getElementById('ruleRangeEnd').value);
        const value = sampleSelect.value;

        if (isNaN(start) || isNaN(end)) {
            window.AppUtils?.showToast?.('请填写有效数值', 'warning');
            return;
        }

        if (!value) {
            window.AppUtils?.showToast?.('请选择样品仓位', 'warning');
            return;
        }

        if (start > end) {
            window.AppUtils?.showToast?.('区间起始不能大于结束', 'warning');
            return;
        }

        currentRules.push({ range_start: start, range_end: end, sample_value: value });
        renderRulesList();
    });

    // 删除规则
    window._removeRule = (idx) => {
        currentRules.splice(idx, 1);
        renderRulesList();
    };

    // 保存规则
    document.getElementById('btnSaveConfig')?.addEventListener('click', async () => {
        try {
            const options = optionsTextarea.value.split('\n').map(s => s.trim()).filter(Boolean);
            await saveMappingConfig({ rules: currentRules, sample_options: options });
            window.AppUtils?.showToast?.('规则已保存', 'success');
        } catch (error) {
            window.AppUtils?.showToast?.('保存失败: ' + error.message, 'error');
        }
    });

    // 保存选项
    document.getElementById('btnSaveOptions')?.addEventListener('click', async () => {
        try {
            const options = optionsTextarea.value.split('\n').map(s => s.trim()).filter(Boolean);
            await saveMappingConfig({ rules: currentRules, sample_options: options });
            updateSelectOptions();
            window.AppUtils?.showToast?.('选项已保存', 'success');
        } catch (error) {
            window.AppUtils?.showToast?.('保存失败: ' + error.message, 'error');
        }
    });
}

// ========================================
// 导出加载函数
// ========================================
window.loadMappingPage = function (pageId) {
    switch (pageId) {
        case 'mapping':
            return { html: generateMappingPage(), init: initMappingPage };
        case 'mapping-history':
            return { html: generateMappingHistoryPage(), init: initMappingHistoryPage };
        case 'mapping-settings':
            return { html: generateMappingSettingsPage(), init: initMappingSettingsPage };
        default:
            return null;
    }
};
