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
        console.warn('<i data-lucide="alert-triangle"></i> [对照配置] 加载失败, 使用默认配置:', error.message);
        return { rules: [] };
    }

    console.log(`<i data-lucide="check-circle"></i> [对照配置] 加载成功, 规则数: ${data?.config_value?.rules?.length || 0}`);
    return data?.config_value || { rules: [] };
}

async function saveMappingConfig(config) {
    console.log('<i data-lucide="save"></i> [对照配置] 正在保存仓位映射规则...');
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
        console.error('<i data-lucide="x-circle"></i> [对照配置] 保存失败:', error.message);
        throw new Error('保存配置失败: ' + error.message);
    }
    console.log('<i data-lucide="check-circle"></i> [对照配置] 保存成功');
}

function normalizeShopValue(value) {
    const str = String(value ?? '').trim();
    return ['1', '2', '3', '4', '5'].includes(str) ? str : '';
}

function mergeShopValues(existing, value) {
    const shops = new Set(String(existing || '').split(',').map(normalizeShopValue).filter(Boolean));
    const normalized = normalizeShopValue(value);
    if (normalized) shops.add(normalized);
    return Array.from(shops).sort((a, b) => Number(a) - Number(b)).join(',');
}

function renderShopBadge(shopValue) {
    const shops = String(shopValue || '').split(',').map(normalizeShopValue).filter(Boolean);
    if (shops.length === 0) return '<span style="color: var(--text-muted);">--</span>';
    return shops.map(shop => `<span class="shop-badge" data-shop="${shop}">${shop}号</span>`).join('');
}

async function loadProductShopMapById() {
    const client = window.supabaseClient;
    if (!client) return {};

    let allData = [];
    let page = 0;
    const pageSize = 1000;
    let hasMore = true;

    while (hasMore) {
        const { data, error } = await client
            .from('product_id_data')
            .select('*')
            .range(page * pageSize, (page + 1) * pageSize - 1);

        if (error) {
            console.warn('加载商品店铺映射失败:', error.message);
            return {};
        }

        if (data && data.length > 0) {
            allData = allData.concat(data);
            if (data.length < pageSize) hasMore = false;
            else page++;
        } else {
            hasMore = false;
        }
    }

    const shopMap = {};
    allData.forEach(item => {
        const productId = String(item.product_id ?? '').trim();
        if (!productId) return;
        const shop = normalizeShopValue(item.shop ?? item['店铺']);
        if (shop) {
            shopMap[productId] = mergeShopValues(shopMap[productId], shop);
        }
    });

    return shopMap;
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
async function loadMappingData(includeNew = true) {
    console.log(`📥 [对照数据] 开始加载排品结果${includeNew ? '和新品数据' : '（不含新品）'}...`);
    const client = window.supabaseClient;
    if (!client) throw new Error('Supabase 未初始化');

    // 加载排品结果
    const rankingRes = await client.from('ranking_results').select('*');
    if (rankingRes.error) throw new Error('加载排品结果失败: ' + rankingRes.error.message);
    const rankingData = rankingRes.data || [];

    let newProductData = [];
    if (includeNew) {
        const newProductRes = await client.from('new_product_data').select('*');
        if (newProductRes.error) throw new Error('加载新品数据失败: ' + newProductRes.error.message);
        newProductData = newProductRes.data || [];
    }
    console.log(`📊 [对照数据] ranking_results: ${rankingData.length} 条${includeNew ? ', new_product_data: ' + newProductData.length + ' 条' : ''}`);

    // 合并数据并附加源统计信息
    const mergedData = mergeAndDeduplicate(rankingData, newProductData);
    mergedData._sourceStats = {
        rankingCount: rankingData.length,
        newProductCount: newProductData.length,
        includeNew: includeNew
    };
    console.log(`<i data-lucide="check-circle"></i> [对照数据] 合并完成, 共 ${mergedData.length} 个商品`);
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
            existing.shop = mergeShopValues(existing.shop, item.shop);
            existing.available_qty = (existing.available_qty || 0) + (item.available_qty || 0);
            existing.actual_stock = (existing.actual_stock || 0) + (item.actual_stock || 0);
            if (!existing.image_url && item.image_url) existing.image_url = item.image_url;
        } else {
            productMap.set(name, {
                product_name: name,
                product_id: item.product_id || '',
                shop: item.shop || '',
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
            existing.shop = mergeShopValues(existing.shop, item.shop);
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
                shop: item.shop || '',
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
    console.log(`<i data-lucide="save"></i> [历史记录] 开始保存到 mapping_history, 共 ${data.length} 条`);
    const client = window.supabaseClient;
    if (!client) throw new Error('Supabase 未初始化');

    // 清空旧记录
    console.log('🧹 [历史记录] 清空现有记录...');
    await client.from('mapping_history').delete().gte('id', 0);

    // 插入新记录
    const now = new Date().toISOString();
    const shopMapById = await loadProductShopMapById();
    const records = data.map(item => ({
        ...item,
        shop: shopMapById[String(item.product_id ?? '').trim()] || item.shop || null,
        generated_at: now
    }));

    const batchSize = 100;
    for (let i = 0; i < records.length; i += batchSize) {
        const batch = records.slice(i, i + batchSize);
        console.log(`<i data-lucide="upload"></i> [历史记录] 插入批次 ${Math.floor(i / batchSize) + 1}/${Math.ceil(records.length / batchSize)}`);
        const { error } = await client.from('mapping_history').insert(batch);
        if (error) throw new Error('保存历史记录失败: ' + error.message);
    }

    console.log(`<i data-lucide="check-circle"></i> [历史记录] 保存完成, 共 ${records.length} 条`);
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
        console.warn('<i data-lucide="alert-triangle"></i> [历史记录] 加载失败:', error.message);
        return [];
    }

    console.log(`<i data-lucide="check-circle"></i> [历史记录] 加载完成, 共 ${data?.length || 0} 条`);
    return data || [];
}

// ========================================
// 页面生成 - 排品对照主页
// ========================================
function generateMappingPage() {
    return `
        <div class="mapping-page">
            <div class="page-intro flex-between flex-wrap-gap" style="align-items: flex-start;">
                <div class="flex-1" style="min-width: 200px;">
                    <h2><i data-lucide="link"></i> 排品结果推送 <span class="tag-red">插件读取</span></h2>
                    <p>合并显示排品结果和新品数据，自动计算样品仓位</p>
                </div>
                <div id="dataSourceCards" class="flex-wrap-gap">
                    <div class="source-card source-card-blue">
                        <div class="source-card-label"><i data-lucide="upload"></i> 推送保存至</div>
                        <div class="source-card-value">mapping_history</div>
                    </div>
                    <div class="source-card source-card-green">
                        <div class="source-card-label">📥 排品数据源</div>
                        <div class="source-card-value">ranking_results <span id="rankingCountBadge" style="color: #10b981; margin-left: 4px; font-weight: bold;"></span></div>
                    </div>
                    <div id="newProductSourceCard" class="source-card source-card-amber">
                        <div class="source-card-label"><i data-lucide="package"></i> 新品数据源</div>
                        <div class="source-card-value">new_product_data <span id="newProductCountBadge" style="color: #f59e0b; margin-left: 4px; font-weight: bold;"></span></div>
                    </div>
                    <div id="welfareSourceCard" class="source-card source-card-pink">
                        <div class="source-card-label"><i data-lucide="gift"></i> 福利品数据源</div>
                        <div class="source-card-value">welfare_data <span id="welfareCountBadge" style="color: #ec4899; margin-left: 4px; font-weight: bold;"></span></div>
                    </div>
                </div>
            </div>
            
            <div class="mapping-actions mapping-actions-bar">
                <button class="btn btn-primary" id="btnSaveHistory">📱 推送到手机/插件</button>
                <div class="toggle-btn-group">
                    <button type="button" class="toggle-btn active" id="btnIncludeNewProduct">
                        （大号）包含新品
                    </button>
                    <button type="button" class="toggle-btn" id="btnExcludeNewProduct">
                        （小号）不含新品
                    </button>
                </div>
                <input type="hidden" id="mappingIncludeNew" value="true">
                <button class="btn btn-outline" id="btnRefreshMapping" style="border: 1px solid var(--border-color); background: transparent; color: var(--text-secondary); height: 36px;"><i data-lucide="refresh-cw"></i> 刷新数据</button>
                <button class="btn btn-secondary" id="btnUpdateWarehouse" style="border: 1px solid var(--border-color); height: 36px;"><i data-lucide="package"></i> 更新仓位</button>
                <span id="mappingStatus" style="color: var(--text-muted); font-size: 0.875rem; margin-left: auto;"></span>
            </div>
            
            <div class="mapping-content">
                <div class="welfare-section">
                    <h3 class="section-title-sm"><i data-lucide="gift"></i> 福利排品商品<span class="tag-pink">独立表格显示，合并推送</span></h3>
                    <div id="welfareTableContainer" class="data-table-container welfare-table-border">
                        <div class="placeholder-content" style="min-height: 150px; padding: 2rem 0;">
                            <p>正在加载福利数据...</p>
                        </div>
                    </div>
                </div>
                <div class="ranking-section">
                    <h3 class="section-title-sm"><i data-lucide="clipboard-list"></i> 常规排品商品</h3>
                    <div id="mappingTableContainer" class="data-table-container">
                        <div class="placeholder-content" style="min-height: 150px; padding: 2rem 0;">
                            <p>正在加载数据...</p>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- 更新仓位对话框 -->
            <div id="warehouseUpdateDialog" class="modal-overlay" style="display: none;">
                <div class="modal-content warehouse-dialog-content">
                    <div class="flex-between mb-md">
                        <h3 style="margin: 0;"><i data-lucide="package"></i> 更新仓位 <span style="color: #ff4444; font-size: 0.75rem; font-weight: normal;">需下载最新库存视图新品表格，注意商品名称准确</span></h3>
                        <button id="closeWarehouseDialog" class="modal-close">&times;</button>
                    </div>
                    
                    <div id="warehouseUploadZone" class="warehouse-dropzone">
                        <div style="font-size: 3rem; margin-bottom: 1rem;">📁</div>
                        <p style="margin: 0.5rem 0; color: var(--text-primary);">拖拽文件到此处,或点击选择</p>
                        <p style="margin: 0; color: var(--text-muted); font-size: 0.875rem;">.xlsx, .xls, .csv</p>
                        <input type="file" id="warehouseFileInput" accept=".xlsx,.xls,.csv" style="display:none">
                    </div>
                    
                    <div id="warehouseUpdateStatus" style="display: none; padding: 1rem; background: var(--bg-secondary); border-radius: var(--border-radius-sm); margin-bottom: 1rem;">
                        <div id="warehouseStatusText" class="mb-sm">准备中...</div>
                        <div class="progress-bar"><div id="warehouseProgressBar" class="progress-fill" style="width: 0%;"></div></div>
                        <div id="warehouseStatusDetail" class="mt-sm" style="font-size: 0.875rem; color: var(--text-secondary);"></div>
                    </div>
                    
                    <div class="mt-md" style="padding-top: 1rem; border-top: 1px solid var(--border-color);">
                        <p style="color: var(--text-muted); font-size: 0.875rem; margin: 0;">说明:读取表格的商品名称(B列)和主仓位(H列),更新 mapping_history 表中匹配商品的仓位信息</p>
                    </div>
                </div>
            </div>
        </div>
    `;
}

async function initMappingPage() {
    const container = document.getElementById('mappingTableContainer');
    const welfareContainer = document.getElementById('welfareTableContainer');
    const statusSpan = document.getElementById('mappingStatus');

    const updateStatus = (text) => {
        if (statusSpan) statusSpan.textContent = text;
    };

    // 加载配置
    const config = await loadMappingConfig();
    const rules = config?.rules || [];

    // 新品开关逻辑
    const btnIncludeNew = document.getElementById('btnIncludeNewProduct');
    const btnExcludeNew = document.getElementById('btnExcludeNewProduct');
    const hiddenIncludeNew = document.getElementById('mappingIncludeNew');

    // 来源信息卡片节点
    const newProductSourceCard = document.getElementById('newProductSourceCard');
    const rankingCountBadge = document.getElementById('rankingCountBadge');
    const newProductCountBadge = document.getElementById('newProductCountBadge');
    const welfareCountBadge = document.getElementById('welfareCountBadge');

    function updateDataSourceBlock(includeNew, stats) {
        if (newProductSourceCard) {
            newProductSourceCard.style.display = includeNew ? 'block' : 'none';
        }
        if (stats) {
            if (rankingCountBadge) rankingCountBadge.textContent = `(${stats.rankingCount}个)`;
            if (newProductCountBadge && includeNew) newProductCountBadge.textContent = `(${stats.newProductCount}个)`;
            if (welfareCountBadge) welfareCountBadge.textContent = `(${stats.welfareCount || 0}个)`;
        } else {
            if (rankingCountBadge) rankingCountBadge.textContent = '';
            if (newProductCountBadge) newProductCountBadge.textContent = '';
            if (welfareCountBadge) welfareCountBadge.textContent = '';
        }
    }

    function setNewProductToggle(include) {
        hiddenIncludeNew.value = include ? 'true' : 'false';
        if (include) {
            btnIncludeNew.style.background = 'var(--primary-color)';
            btnIncludeNew.style.color = 'white';
            btnExcludeNew.style.background = 'var(--bg-secondary)';
            btnExcludeNew.style.color = 'var(--text-secondary)';
        } else {
            btnExcludeNew.style.background = 'var(--primary-color)';
            btnExcludeNew.style.color = 'white';
            btnIncludeNew.style.background = 'var(--bg-secondary)';
            btnIncludeNew.style.color = 'var(--text-secondary)';
        }
        updateDataSourceBlock(include, null);
        refreshData();
    }

    btnIncludeNew?.addEventListener('click', () => setNewProductToggle(true));
    btnExcludeNew?.addEventListener('click', () => setNewProductToggle(false));

    // 刷新数据
    const refreshData = async () => {
        const includeNew = hiddenIncludeNew.value === 'true';
        updateStatus('加载中...');
        try {
            // 并发加载常规排品数据和福利品数据
            const mappingDataPromise = loadMappingData(includeNew);
            const welfareDataPromise = window.supabaseClient.from('welfare_arranged_data').select('*');

            const [data, welfareRes] = await Promise.all([mappingDataPromise, welfareDataPromise]);

            // 处理福利品数据
            const rawWelfareData = welfareRes.data || [];
            const processedWelfareData = rawWelfareData.map(item => ({
                product_name: item.product_name,
                product_id: '',
                ranking_result: '福利品',
                sample_number: '',
                image_url: item.image_url || '',
                warehouse: '',
                available_qty: item.available_qty || 0,
                actual_stock: 0,
                sample_warehouse: ''
            }));

            // 更新数据来源信息块
            if (data._sourceStats) {
                data._sourceStats.welfareCount = rawWelfareData.length;
                updateDataSourceBlock(includeNew, data._sourceStats);
            }
            // 计算常规商品的样品仓位
            data.forEach(item => {
                item.sample_warehouse = calculateSampleWarehouse(item.warehouse, rules);
            });

            // 渲染两个表格
            renderMappingTable(container, data);
            if (welfareContainer) renderMappingTable(welfareContainer, processedWelfareData);

            updateStatus(`常规 ${data.length} 个 / 福利 ${processedWelfareData.length} 个`);
            window._currentMappingData = data; // 缓存用于保存
            window._currentWelfareData = processedWelfareData;
        } catch (error) {
            console.error(error);
            container.innerHTML = `<div class="placeholder-content" style="min-height: 150px; padding: 2rem 0;"><p style="color: var(--error-color);">加载失败: ${error.message}</p></div>`;
            if (welfareContainer) welfareContainer.innerHTML = `<div class="placeholder-content" style="min-height: 150px; padding: 2rem 0;"><p style="color: var(--error-color);">加载失败</p></div>`;
            updateStatus('加载失败');
        }
    };

    // 绑定事件
    document.getElementById('btnRefreshMapping')?.addEventListener('click', refreshData);
    document.getElementById('btnSaveHistory')?.addEventListener('click', async () => {
        if (!window._currentMappingData || !window._currentWelfareData) {
            window.AppUtils?.showToast?.('请先刷新数据', 'warning');
            return;
        }
        try {
            // 合并常规商品和福利品后一起推送到历史记录
            const allData = [...window._currentWelfareData, ...window._currentMappingData];
            const count = await saveToHistory(allData);
            // 同步推送当前方案名称
            try {
                const client = window.supabaseClient;
                if (client) {
                    const { data } = await client
                        .from('ranking_config')
                        .select('config_value')
                        .eq('config_key', 'ranking_schemes')
                        .single();
                    const schemeName = data?.config_value?.当前方案 || '默认方案';
                    await client.from('ranking_config').upsert({
                        config_key: 'pushed_scheme_name',
                        config_value: { name: schemeName },
                        updated_at: new Date().toISOString()
                    }, { onConflict: 'config_key' });
                    console.log(`<i data-lucide="check-circle"></i> [推送] 方案名称已同步: ${schemeName}`);
                }
            } catch (e) {
                console.warn('推送方案名称失败:', e);
            }
            window.AppUtils?.showToast?.(`已成功推送 ${count} 条 (常规 ${window._currentMappingData.length} + 福利 ${window._currentWelfareData.length})`, 'success');
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
        container.innerHTML = '<div class="placeholder-content" style="min-height: 150px; padding: 2rem 0;"><p>暂无数据</p></div>';
        return;
    }

    // 中国复古色系 - 根据分类分配不同背景色
    const categoryColors = {
        '1.评分品A': 'rgba(139, 69, 19, 0.15)',    // 朱砂棕
        '2.佩戴品': 'rgba(0, 128, 128, 0.15)',     // 青碧
        '3.周边品': 'rgba(128, 0, 128, 0.15)',    // 紫檀
        '4.评分品B': 'rgba(184, 134, 11, 0.15)',  // 金琥珀
        '5.库存品': 'rgba(85, 107, 47, 0.15)',    // 墨绿
        '新品': 'rgba(70, 130, 180, 0.15)',        // 靛蓝
        '福利品': 'rgba(236,72,153, 0.15)'         // 绒花粉
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
            ? `<div class="hover-zoom-container">
                   <img src="${imageUrl}" class="hover-zoom-thumb" referrerpolicy="no-referrer" onerror="this.parentElement.innerHTML='<span style=\\'color: var(--text-muted); font-size: 0.625rem;\\'>无图</span>'">
               </div>`
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
                <h2>📜 历史记录 <span class="db-table-tag">mapping_history</span></h2>
                <p>显示上一次保存的对照结果</p>
            </div>
            
            <div id="historyCopyButtonsContainer" style="padding: 0 1.5rem;"></div>
            
            <div class="history-info p-section">
                <span id="historyGeneratedTime" class="uploaded-stats"></span>
            </div>
            
            <div class="history-content p-content">
                <div id="historyTableContainer" class="data-table-container">
                    <div class="placeholder-content">
                        <p>正在加载历史记录...</p>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function renderHistoryTable(container, data) {
    if (!data || data.length === 0) {
        container.innerHTML = '<div class="placeholder-content" style="min-height: 150px; padding: 2rem 0;"><p>暂无数据</p></div>';
        return;
    }

    const categoryColors = {
        '1.评分品A': 'rgba(139, 69, 19, 0.15)',
        '2.佩戴品': 'rgba(0, 128, 128, 0.15)',
        '3.周边品': 'rgba(128, 0, 128, 0.15)',
        '4.评分品B': 'rgba(184, 134, 11, 0.15)',
        '5.库存品': 'rgba(85, 107, 47, 0.15)',
        '新品': 'rgba(70, 130, 180, 0.15)',
        '福利品': 'rgba(236,72,153, 0.15)'
    };

    const html = `
        <table class="data-table" style="width: 100%; border-collapse: collapse; font-size: 0.875rem;">
            <thead>
                <tr style="background: var(--bg-secondary);">
                    <th style="padding: 0.75rem; text-align: center; width: 60px;">图片</th>
                    <th style="padding: 0.75rem; text-align: left;">商品名称</th>
                    <th style="padding: 0.75rem; text-align: center; width: 120px;">商品 ID</th>
                    <th style="padding: 0.75rem; text-align: center; width: 80px;">店铺</th>
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
            ? `<div class="hover-zoom-container">
                   <img src="${imageUrl}" class="hover-zoom-thumb" referrerpolicy="no-referrer" onerror="this.parentElement.innerHTML='<span style=\\'color: var(--text-muted); font-size: 0.625rem;\\'>无图</span>'">
               </div>`
            : '<span style="color: var(--text-muted);">无</span>';
        const bgColor = categoryColors[item.ranking_result] || 'transparent';
        return `
                        <tr style="border-bottom: 1px solid var(--border-color); background: ${bgColor};">
                            <td style="padding: 0.5rem; text-align: center;">${imageHtml}</td>
                            <td style="padding: 0.5rem;">${item.product_name || '--'}</td>
                            <td style="padding: 0.5rem; text-align: center; font-family: monospace; font-size: 0.8rem; color: var(--text-secondary);">${item.product_id || '--'}</td>
                            <td style="padding: 0.5rem; text-align: center;">${renderShopBadge(item.shop)}</td>
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

function renderHistoryCopyButtons(data) {
    const btnContainer = document.getElementById('historyCopyButtonsContainer');
    if (!btnContainer) return;

    // 分离非福利品和福利品
    const normalItems = data.filter(item => !(item.ranking_result || '').includes('福利'));
    const welfareItems = data.filter(item => (item.ranking_result || '').includes('福利'));

    const BATCH_SIZE = 30;
    const totalBatches = Math.ceil(normalItems.length / BATCH_SIZE);

    let buttonsHtml = '<div style="display: flex; flex-wrap: wrap; gap: 0.5rem; align-items: center; margin-bottom: 0.75rem;">';
    buttonsHtml += '<span style="font-size: 0.85rem; color: var(--text-muted); margin-right: 0.25rem;">📋 批量复制链接:</span>';

    // 生成常规商品批次复制按钮
    for (let i = 0; i < totalBatches; i++) {
        const start = i * BATCH_SIZE;
        const end = Math.min(start + BATCH_SIZE, normalItems.length);
        buttonsHtml += `<button class="btn btn-outline history-copy-batch-btn" data-batch-start="${start}" data-batch-end="${end}" 
            style="padding: 0.35rem 0.75rem; font-size: 0.8rem; border: 1px solid var(--primary-color); color: var(--primary-color); border-radius: 6px; cursor: pointer; background: transparent; transition: all 0.2s;"
            onmouseover="this.style.background='var(--primary-color)'; this.style.color='white';"
            onmouseout="this.style.background='transparent'; this.style.color='var(--primary-color)';">
            第${i + 1}组 (${start + 1}-${end})
        </button>`;
    }

    // 福利品复制按钮
    if (welfareItems.length > 0) {
        buttonsHtml += `<button class="btn history-copy-welfare-btn" 
            style="padding: 0.35rem 0.75rem; font-size: 0.8rem; border: 1px solid #ec4899; color: #ec4899; border-radius: 6px; cursor: pointer; background: transparent; transition: all 0.2s; margin-left: 0.5rem;"
            onmouseover="this.style.background='#ec4899'; this.style.color='white';"
            onmouseout="this.style.background='transparent'; this.style.color='#ec4899';">
            🎁 福利品名称 (${welfareItems.length}个)
        </button>`;
    }

    buttonsHtml += '</div>';
    btnContainer.innerHTML = buttonsHtml;

    // 商品链接模板
    const buildProductLink = (productId) => {
        return `https://haohuo.jinritemai.com/ecommerce/trade/detail/index.html?id=${productId}&origin_type=604`;
    };

    // 绑定批次复制按钮事件
    btnContainer.querySelectorAll('.history-copy-batch-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            const start = parseInt(btn.dataset.batchStart);
            const end = parseInt(btn.dataset.batchEnd);
            const batchItems = normalItems.slice(start, end);
            const links = batchItems
                .filter(item => item.product_id)
                .map(item => buildProductLink(item.product_id))
                .join('\n');
            if (!links) {
                window.AppUtils?.showToast?.('该组商品无有效商品 ID', 'warning');
                return;
            }
            try {
                await navigator.clipboard.writeText(links);
                btn.textContent = '✅ 已复制';
                btn.style.background = 'var(--success-color)';
                btn.style.color = 'white';
                btn.style.borderColor = 'var(--success-color)';
                window.AppUtils?.showToast?.(`已复制 ${batchItems.filter(i => i.product_id).length} 个商品链接`, 'success');
                setTimeout(() => {
                    const idx = Math.floor(start / BATCH_SIZE);
                    btn.textContent = `第${idx + 1}组 (${start + 1}-${end})`;
                    btn.style.background = 'transparent';
                    btn.style.color = 'var(--primary-color)';
                    btn.style.borderColor = 'var(--primary-color)';
                }, 2000);
            } catch (e) {
                window.AppUtils?.showToast?.('复制失败: ' + e.message, 'error');
            }
        });
    });

    // 绑定福利品复制按钮事件
    const welfareBtn = btnContainer.querySelector('.history-copy-welfare-btn');
    if (welfareBtn) {
        welfareBtn.addEventListener('click', async () => {
            const names = welfareItems
                .filter(item => item.product_name)
                .map(item => item.product_name)
                .join('，');
            if (!names) {
                window.AppUtils?.showToast?.('福利品无有效商品名称', 'warning');
                return;
            }
            try {
                await navigator.clipboard.writeText(names);
                welfareBtn.textContent = '✅ 已复制';
                welfareBtn.style.background = '#ec4899';
                welfareBtn.style.color = 'white';
                window.AppUtils?.showToast?.(`已复制 ${welfareItems.filter(i => i.product_name).length} 个福利品名称`, 'success');
                setTimeout(() => {
                    welfareBtn.textContent = `🎁 福利品名称 (${welfareItems.length}个)`;
                    welfareBtn.style.background = 'transparent';
                    welfareBtn.style.color = '#ec4899';
                }, 2000);
            } catch (e) {
                window.AppUtils?.showToast?.('复制失败: ' + e.message, 'error');
            }
        });
    }
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

        // 生成复制按钮
        renderHistoryCopyButtons(data);

        // 渲染带商品ID列的表格
        renderHistoryTable(container, data);
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
            
            <div class="settings-content settings-grid-2">
                <!-- 左侧：仓位映射规则 -->
                <div class="settings-card">
                    <h3 style="margin: 0 0 1rem;"><i data-lucide="package"></i> 样品仓仓位映射规则</h3>
                    <p class="uploaded-stats mb-md">
                        仓位格式为 X-Y-Z，第二位 Y 在区间内时替换为对应样品仓位
                    </p>
                    
                    <div class="rule-editor rule-editor-grid">
                        <div>
                            <label class="form-label-row">区间起始</label>
                            <input type="number" id="ruleRangeStart" class="form-input" value="1" min="1">
                        </div>
                        <div>
                            <label class="form-label-row">区间结束</label>
                            <input type="number" id="ruleRangeEnd" class="form-input" value="10" min="1">
                        </div>
                        <div>
                            <label class="form-label-row">样品仓位</label>
                            <select id="ruleSampleValue" class="form-input" style="height: 38px;">
                                <option value="">请选择</option>
                            </select>
                        </div>
                        <button class="btn btn-primary" id="btnAddRule" style="height: 38px;">➕ 添加</button>
                    </div>
                    
                    <div id="rulesListContainer" class="mt-md">
                        <h4 class="mb-sm" style="margin-top: 0; color: var(--text-secondary); font-size: 0.875rem;">已添加规则：</h4>
                        <div id="rulesList"></div>
                    </div>
                    
                    <div class="mt-lg" style="padding-top: 1rem; border-top: 1px solid var(--border-color);">
                        <button class="btn btn-primary" id="btnSaveConfig"><i data-lucide="save"></i> 保存规则</button>
                    </div>
                </div>
                
                <!-- 右侧：样品仓位选项设置 -->
                <div class="settings-card">
                    <h3 style="margin: 0 0 1rem;"><i data-lucide="clipboard-list"></i> 样品仓位选项</h3>
                    <p class="uploaded-stats mb-md">
                        每行一个选项，保存后可在左侧下拉栏选择
                    </p>
                    
                    <textarea id="sampleOptions" class="form-input" rows="10" style="font-family: monospace; resize: vertical;" placeholder="例如：
1-10-1
1-10-2
1-10-3
1-10-4
1-10-5"></textarea>
                    
                    <div class="mt-md">
                        <button class="btn btn-primary" id="btnSaveOptions"><i data-lucide="save"></i> 保存选项</button>
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
        console.log('<i data-lucide="package"></i> [仓位更新] 开始处理文件:', file.name);

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
            statusDetail.innerHTML = `<span style="color: var(--success-color);"><i data-lucide="check-circle"></i> 成功匹配 ${matchCount} 个商品, 更新 ${updateCount} 条记录</span>`;

            window.AppUtils?.showToast?.(`成功更新 ${updateCount} 条仓位记录`, 'success');

            // 3秒后关闭对话框
            setTimeout(() => {
                closeDialog();
                // 刷新主页面数据(如果在mapping页面)
                const refreshBtn = document.getElementById('btnRefreshMapping');
                if (refreshBtn) refreshBtn.click();
            }, 3000);

        } catch (error) {
            console.error('<i data-lucide="x-circle"></i> [仓位更新] 处理失败:', error);
            statusText.textContent = '处理失败';
            statusDetail.innerHTML = `<span style="color: var(--error-color);"><i data-lucide="x-circle"></i> ${error.message}</span>`;
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
