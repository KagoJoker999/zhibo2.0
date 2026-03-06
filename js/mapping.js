/**
 * 排品对照功能模块
 * ========================================
 * 包含三个子功能：排品对照主页、历史记录、对照设置
 */

// ========================================
// 配置加载与保存
// ========================================
async function loadMappingConfig() {
    console.log('⚙️ [对照配置] 正在加载仓位映射规则...');
    const client = window.supabaseClient;
    if (!client) return null;

    const { data, error } = await client
        .from('mapping_config')
        .select('*')
        .eq('config_key', 'warehouse_rules')
        .single();

    if (error) {
        console.warn('⚠️ [对照配置] 加载失败, 使用默认配置:', error.message);
        return { rules: [] };
    }

    console.log(`✅ [对照配置] 加载成功, 规则数: ${data?.config_value?.rules?.length || 0}`);
    return data?.config_value || { rules: [] };
}

async function saveMappingConfig(config) {
    console.log('💾 [对照配置] 正在保存仓位映射规则...');
    const client = window.supabaseClient;
    if (!client) throw new Error('Supabase 未初始化');

    const { error } = await client
        .from('mapping_config')
        .upsert({
            config_key: 'warehouse_rules',
            config_value: config,
            updated_at: new Date().toISOString()
        }, { onConflict: 'config_key' });

    if (error) {
        console.error('❌ [对照配置] 保存失败:', error.message);
        throw new Error('保存配置失败: ' + error.message);
    }
    console.log('✅ [对照配置] 保存成功');
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
    console.log('📥 [对照数据] 开始加载排品结果和新品数据...');
    const client = window.supabaseClient;
    if (!client) throw new Error('Supabase 未初始化');

    // 并行加载两个表的数据
    const [rankingRes, newProductRes] = await Promise.all([
        client.from('ranking_results').select('*'),
        client.from('new_product_data').select('*')
    ]);

    if (rankingRes.error) throw new Error('加载排品结果失败: ' + rankingRes.error.message);
    if (newProductRes.error) throw new Error('加载新品数据失败: ' + newProductRes.error.message);

    const rankingData = rankingRes.data || [];
    const newProductData = newProductRes.data || [];
    console.log(`📊 [对照数据] ranking_results: ${rankingData.length} 条, new_product_data: ${newProductData.length} 条`);

    // 合并数据并附加源统计信息
    const mergedData = mergeAndDeduplicate(rankingData, newProductData);
    mergedData._sourceStats = {
        rankingCount: rankingData.length,
        newProductCount: newProductData.length
    };
    console.log(`✅ [对照数据] 合并完成, 共 ${mergedData.length} 个商品`);
    return mergedData;
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
    console.log(`💾 [历史记录] 开始保存到 mapping_history, 共 ${data.length} 条`);
    const client = window.supabaseClient;
    if (!client) throw new Error('Supabase 未初始化');

    // 清空旧记录
    console.log('🧹 [历史记录] 清空现有记录...');
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
        console.log(`📤 [历史记录] 插入批次 ${Math.floor(i / batchSize) + 1}/${Math.ceil(records.length / batchSize)}`);
        const { error } = await client.from('mapping_history').insert(batch);
        if (error) throw new Error('保存历史记录失败: ' + error.message);
    }

    console.log(`✅ [历史记录] 保存完成, 共 ${records.length} 条`);
    return records.length;
}

async function loadHistoryData() {
    console.log('📜 [历史记录] 正在加载历史数据...');
    const client = window.supabaseClient;
    if (!client) return [];

    const { data, error } = await client
        .from('mapping_history')
        .select('*')
        .order('ranking_result', { ascending: true });

    if (error) {
        console.warn('⚠️ [历史记录] 加载失败:', error.message);
        return [];
    }

    console.log(`✅ [历史记录] 加载完成, 共 ${data?.length || 0} 条`);
    return data || [];
}

// ========================================
// 页面生成 - 排品对照主页
// ========================================
function generateMappingPage() {
    return `
        <div class="mapping-page">
            <div class="page-intro">
                <h2>🔗 排品结果推送 <span style="font-size: 0.75rem; background: rgba(220, 38, 38, 0.8); padding: 2px 8px; border-radius: 4px; color: #fff; font-weight: normal; vertical-align: middle;">插件读取</span></h2>
                <p>合并显示排品结果和新品数据，自动计算样品仓位</p>
            </div>
            
            <div class="mapping-actions" style="padding: 1rem 1.5rem; display: flex; gap: 1rem; align-items: center; flex-wrap: wrap;">
                <button class="btn btn-primary" id="btnSaveHistory">📱 推送到手机/插件</button>
                <span class="db-table-tag" style="font-size: 0.75rem; color: var(--text-muted); background: var(--bg-secondary); padding: 0.25rem 0.5rem; border-radius: 4px;">→ mapping_history</span>
                <button class="btn btn-outline" id="btnRefreshMapping" style="border: 1px solid var(--border-color); background: transparent; color: var(--text-secondary);">🔄 刷新数据</button>
                <span class="db-table-tag" style="font-size: 0.75rem; color: var(--text-muted); background: var(--bg-secondary); padding: 0.25rem 0.5rem; border-radius: 4px;">← ranking_results + new_product_data</span>
                <span id="sourceStats" style="color: var(--text-muted); font-size: 0.8rem;"></span>
                <button class="btn btn-secondary" id="btnUpdateWarehouse" style="border: 1px solid var(--border-color);">📦 更新仓位</button>
                <span id="mappingStatus" style="color: var(--text-muted); font-size: 0.875rem; margin-left: auto;"></span>
            </div>
            
            <div class="mapping-content" style="padding: 0 1.5rem 1.5rem;">
                <div id="mappingTableContainer" class="data-table-container">
                    <div class="placeholder-content">
                        <p>正在加载数据...</p>
                    </div>
                </div>
            </div>
            
            <!-- 更新仓位对话框 -->
            <div id="warehouseUpdateDialog" class="modal-overlay" style="display: none; position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 1000; align-items: center; justify-content: center;">
                <div class="modal-content" style="background: var(--bg-card); border-radius: var(--border-radius); padding: 2rem; max-width: 600px; width: 90%;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                        <h3 style="margin: 0;">📦 更新仓位 <span style="color: #ff4444; font-size: 0.75rem; font-weight: normal;">需下载最新库存视图新品表格，注意商品名称准确</span></h3>
                        <button id="closeWarehouseDialog" style="background: none; border: none; font-size: 1.5rem; cursor: pointer; color: var(--text-secondary);">&times;</button>
                    </div>
                    
                    <div id="warehouseUploadZone" style="border: 2px dashed var(--border-color); border-radius: var(--border-radius); padding: 3rem 2rem; text-align: center; cursor: pointer; transition: all 0.3s; margin-bottom: 1rem;">
                        <div style="font-size: 3rem; margin-bottom: 1rem;">📁</div>
                        <p style="margin: 0.5rem 0; color: var(--text-primary);">拖拽文件到此处,或点击选择</p>
                        <p style="margin: 0; color: var(--text-muted); font-size: 0.875rem;">.xlsx, .xls, .csv</p>
                        <input type="file" id="warehouseFileInput" accept=".xlsx,.xls,.csv" style="display:none">
                    </div>
                    
                    <div id="warehouseUpdateStatus" style="display: none; padding: 1rem; background: var(--bg-secondary); border-radius: var(--border-radius-sm); margin-bottom: 1rem;">
                        <div id="warehouseStatusText" style="margin-bottom: 0.5rem;">准备中...</div>
                        <div style="background: var(--bg-tertiary); height: 8px; border-radius: 4px; overflow: hidden;">
                            <div id="warehouseProgressBar" style="background: var(--primary-color); height: 100%; width: 0%; transition: width 0.3s;"></div>
                        </div>
                        <div id="warehouseStatusDetail" style="margin-top: 0.5rem; font-size: 0.875rem; color: var(--text-secondary);"></div>
                    </div>
                    
                    <div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid var(--border-color);">
                        <p style="color: var(--text-muted); font-size: 0.875rem; margin: 0;">说明:读取表格的商品名称(B列)和主仓位(H列),更新 mapping_history 表中匹配商品的仓位信息</p>
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
            // 显示数据来源统计
            const sourceStatsSpan = document.getElementById('sourceStats');
            if (sourceStatsSpan && data._sourceStats) {
                sourceStatsSpan.textContent = `排品获取 ranking_results: ${data._sourceStats.rankingCount}个 | 新品获取 new_product_data: ${data._sourceStats.newProductCount}个`;
            }
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
            window.AppUtils?.showToast?.(`已成功推送 ${count} 条`, 'success');
        } catch (error) {
            window.AppUtils?.showToast?.('保存失败: ' + error.message, 'error');
        }
    });

    // 绑定更新仓位按钮
    document.getElementById('btnUpdateWarehouse')?.addEventListener('click', () => {
        document.getElementById('warehouseUpdateDialog').style.display = 'flex';
    });

    // 初始化更新仓位对话框
    initWarehouseUpdateDialog();

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
            <div class="page-intro">
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
            <div class="page-intro">
                <h2>⚙️ 对照设置</h2>
                <p>配置仓位到样品仓位的映射规则</p>
            </div>
            
            <div class="settings-content" style="padding: 1.5rem 0; display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem;">
                <!-- 左侧：仓位映射规则 -->
                <div class="settings-card" style="background: var(--bg-card); border: 1px solid var(--border-color); border-radius: var(--border-radius); padding: 1.5rem;">
                    <h3 style="margin: 0 0 1rem;">📦 样品仓仓位映射规则</h3>
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
// 更新仓位对话框
// ========================================
function initWarehouseUpdateDialog() {
    const dialog = document.getElementById('warehouseUpdateDialog');
    const uploadZone = document.getElementById('warehouseUploadZone');
    const fileInput = document.getElementById('warehouseFileInput');
    const closeBtn = document.getElementById('closeWarehouseDialog');
    const statusDiv = document.getElementById('warehouseUpdateStatus');
    const statusText = document.getElementById('warehouseStatusText');
    const progressBar = document.getElementById('warehouseProgressBar');
    const statusDetail = document.getElementById('warehouseStatusDetail');

    // 关闭对话框
    const closeDialog = () => {
        dialog.style.display = 'none';
        statusDiv.style.display = 'none';
        uploadZone.innerHTML = `
            <div style="font-size: 3rem; margin-bottom: 1rem;">📁</div>
            <p style="margin: 0.5rem 0; color: var(--text-primary);">拖拽文件到此处,或点击选择</p>
            <p style="margin: 0; color: var(--text-muted); font-size: 0.875rem;">.xlsx, .xls, .csv</p>
        `;
    };

    closeBtn?.addEventListener('click', closeDialog);
    dialog?.addEventListener('click', (e) => {
        if (e.target === dialog) closeDialog();
    });

    // 点击上传区域
    uploadZone?.addEventListener('click', () => fileInput.click());

    // 拖拽事件
    uploadZone?.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadZone.style.borderColor = 'var(--primary-color)';
        uploadZone.style.background = 'var(--bg-secondary)';
    });

    uploadZone?.addEventListener('dragleave', () => {
        uploadZone.style.borderColor = 'var(--border-color)';
        uploadZone.style.background = 'transparent';
    });

    uploadZone?.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadZone.style.borderColor = 'var(--border-color)';
        uploadZone.style.background = 'transparent';
        if (e.dataTransfer.files.length > 0) {
            handleWarehouseFile(e.dataTransfer.files[0]);
        }
    });

    // 文件选择
    fileInput?.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleWarehouseFile(e.target.files[0]);
        }
    });

    // 处理文件
    async function handleWarehouseFile(file) {
        console.log('📦 [仓位更新] 开始处理文件:', file.name);

        try {
            statusDiv.style.display = 'block';
            updateProgress('读取文件...', 10);

            // 读取Excel文件
            const data = await readExcelFile(file);
            if (!data || data.length < 2) {
                throw new Error('文件内容为空或格式不正确');
            }

            updateProgress('解析数据...', 30);

            // 提取商品名称(B列,索引1)和主仓位(H列,索引7)
            const updates = [];
            for (let i = 1; i < data.length; i++) {
                const row = data[i];
                if (!row || row.length === 0) continue;

                const productName = String(row[1] ?? '').trim();
                const warehouse = String(row[7] ?? '').trim();

                if (productName && warehouse) {
                    updates.push({ productName, warehouse });
                }
            }

            console.log(`📊 [仓位更新] 解析到 ${updates.length} 条更新记录`);
            if (updates.length === 0) {
                throw new Error('未找到有效的商品名称和仓位数据');
            }

            updateProgress('匹配商品...', 50);

            const client = window.supabaseClient;
            if (!client) throw new Error('Supabase 未初始化');

            // 同时加载三个表的数据
            const [historyRes, rankingRes, newProductRes] = await Promise.all([
                client.from('mapping_history').select('*'),
                client.from('ranking_results').select('*'),
                client.from('new_product_data').select('*')
            ]);

            if (historyRes.error) throw new Error('加载历史数据失败: ' + historyRes.error.message);

            const historyData = historyRes.data || [];
            const rankingData = rankingRes.data || [];
            const newProductData = newProductRes.data || [];

            console.log(`📜 [仓位更新] mapping_history: ${historyData.length} 条, ranking_results: ${rankingData.length} 条, new_product_data: ${newProductData.length} 条`);

            // 匹配并更新所有表
            updateProgress('更新仓位...', 70);
            let matchCount = 0;
            let updateCount = 0;

            for (const update of updates) {
                let matched = false;

                // 1. 更新 mapping_history 表
                const historyMatched = historyData.filter(item => item.product_name === update.productName);
                if (historyMatched.length > 0) {
                    matched = true;
                    for (const item of historyMatched) {
                        const { error } = await client.from('mapping_history').update({ warehouse: update.warehouse }).eq('id', item.id);
                        if (!error) updateCount++;
                    }
                }

                // 2. 更新 ranking_results 表
                const rankingMatched = rankingData.filter(item => item.product_name === update.productName);
                if (rankingMatched.length > 0) {
                    matched = true;
                    for (const item of rankingMatched) {
                        const { error } = await client.from('ranking_results').update({ warehouse: update.warehouse }).eq('id', item.id);
                        if (!error) updateCount++;
                    }
                }

                // 3. 更新 new_product_data 表
                const newProductMatched = newProductData.filter(item => item.product_name === update.productName);
                if (newProductMatched.length > 0) {
                    matched = true;
                    for (const item of newProductMatched) {
                        const { error } = await client.from('new_product_data').update({ warehouse: update.warehouse }).eq('id', item.id);
                        if (!error) updateCount++;
                    }
                }

                if (matched) {
                    matchCount++;
                    console.log(`✓ [仓位更新] 匹配到商品: ${update.productName}, 更新仓位: ${update.warehouse}`);
                }
            }

            updateProgress('完成!', 100);
            statusDetail.innerHTML = `<span style="color: var(--success-color);">✅ 成功匹配 ${matchCount} 个商品, 更新 ${updateCount} 条记录</span>`;

            window.AppUtils?.showToast?.(`成功更新 ${updateCount} 条仓位记录`, 'success');

            // 3秒后关闭对话框
            setTimeout(() => {
                closeDialog();
                // 刷新主页面数据(如果在mapping页面)
                const refreshBtn = document.getElementById('btnRefreshMapping');
                if (refreshBtn) refreshBtn.click();
            }, 3000);

        } catch (error) {
            console.error('❌ [仓位更新] 处理失败:', error);
            statusText.textContent = '处理失败';
            statusDetail.innerHTML = `<span style="color: var(--error-color);">❌ ${error.message}</span>`;
            window.AppUtils?.showToast?.('更新失败: ' + error.message, 'error');
        }
    }

    function updateProgress(text, percent) {
        statusText.textContent = text;
        progressBar.style.width = percent + '%';
    }
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
