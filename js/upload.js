/**
 * 上传功能模块
 * ========================================
 * 三个上传功能合并在一个页面：排名上传、库存上传、ID上传
 * 字段映射参考：数据对照表
 */

// ========================================
// 数据处理器 - 通用函数
// ========================================

function extractShortName(fullName) {
    if (!fullName) return '';
    const trimmed = String(fullName).trim();
    if (trimmed.includes('「')) {
        const idx = trimmed.indexOf('「');
        return trimmed.substring(idx);
    }
    return trimmed;
}

function parseNumber(value) {
    if (value === null || value === undefined) return 0;
    if (typeof value === 'number') return isFinite(value) ? value : 0;
    const str = String(value).trim();
    if (!str || str.toLowerCase() === 'nan' || str.toLowerCase() === 'none') return 0;
    const cleaned = str.replace(/[^\d.\-]/g, '');
    const num = parseFloat(cleaned);
    return isFinite(num) ? num : 0;
}

function parseAmount(value) {
    if (value === null || value === undefined) return 0;
    const str = String(value).trim();
    const cleaned = str.replace(/[¥￥,，]/g, '');
    return parseNumber(cleaned);
}

function parsePercentage(value) {
    if (value === null || value === undefined) return 0;
    const str = String(value).trim();
    if (str.includes('%')) {
        const cleaned = str.replace('%', '');
        return parseNumber(cleaned) / 100;
    }
    return parseNumber(value);
}

// ========================================
// 排名数据处理器
// 列映射: B=商品名称, C=讲解次数, F=用户支付金额, J=曝光点击率, K=点击成交率
// ========================================
function processRankingData(rows) {
    console.log(`<i data-lucide="bar-chart-2"></i> [排名数据处理] 开始, 原始行数: ${rows?.length || 0}`);
    const records = [];
    for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (!row || row.length === 0) continue;
        // B列(索引1): 商品名称
        const rawProductName = String(row[1] ?? '').trim();
        if (!rawProductName || rawProductName === 'nan') continue;
        const productName = extractShortName(rawProductName);
        // F列(索引5): 用户支付金额
        const salesAmount = parseAmount(row[5]);
        if (salesAmount < 100) continue;
        records.push({
            product_name: productName,
            lecture_count: Math.round(parseNumber(row[2])),    // C列(索引2): 讲解次数
            sales_amount: salesAmount,                          // F列(索引5): 用户支付金额
            exposure_rate: parsePercentage(row[9]),             // J列(索引9): 商品曝光-点击率
            conversion_rate: parsePercentage(row[10])           // K列(索引10): 商品点击-成交转化率
        });
    }
    console.log(`<i data-lucide="check-circle"></i> [排名数据处理] 完成, 有效记录: ${records.length} 条`);
    return records;
}

// ========================================
// 库存数据处理器
// 列映射: A=图片, B=商品名称, C=商品编码, D=虚拟分类, E=分类, H=主仓位, I=可用数, J=实际库存
// ========================================
function processInventoryData(rows) {
    console.log(`<i data-lucide="package"></i> [库存数据处理] 开始, 原始行数: ${rows?.length || 0}`);
    const productMap = new Map();
    for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (!row || row.length === 0) continue;
        // B列(索引1): 商品名称
        const productName = String(row[1] ?? '').trim();
        if (!productName || productName === 'nan') continue;

        if (!productMap.has(productName)) {
            productMap.set(productName, {
                image_url: '',
                virtual_category: new Set(),
                product_code: new Set(),
                warehouse: new Set(),
                available_qty: 0,
                actual_stock: 0,
                product_category: new Set(),
                product_tag: new Set()
            });
        }
        const data = productMap.get(productName);

        // A列(索引0): 图片 - 取第一个非空值
        if (!data.image_url) {
            const img = String(row[0] ?? '').trim();
            if (img && img !== 'nan') data.image_url = img;
        }

        const addToSet = (set, value) => {
            const str = String(value ?? '').trim();
            if (str && str !== 'nan') set.add(str);
        };

        addToSet(data.virtual_category, row[3]);  // D列(索引3): 虚拟分类
        addToSet(data.product_code, row[2]);       // C列(索引2): 商品编码
        addToSet(data.warehouse, row[7]);          // H列(索引7): 主仓位
        addToSet(data.product_category, row[4]);   // E列(索引4): 分类
        addToSet(data.product_tag, row[5]);        // F列(索引5): 商品标签

        data.available_qty += Math.round(parseNumber(row[8]));  // I列(索引8): 可用数
        data.actual_stock += Math.round(parseNumber(row[9]));   // J列(索引9): 实际库存
    }

    const records = [];
    productMap.forEach((data, productName) => {
        records.push({
            product_name: productName,
            image_url: data.image_url,
            virtual_category: Array.from(data.virtual_category).filter(Boolean).join(','),
            product_code: Array.from(data.product_code).filter(Boolean).join(','),
            warehouse: Array.from(data.warehouse).filter(Boolean).join(','),
            available_qty: data.available_qty,
            actual_stock: data.actual_stock,
            product_category: Array.from(data.product_category).filter(Boolean).join(','),
            _product_tag: Array.from(data.product_tag).filter(Boolean).join(',') // 临时存放，不存入数据库，用来在后面分类
        });
    });
    console.log(`<i data-lucide="check-circle"></i> [库存数据处理] 完成, 商品数: ${records.length}, 已合并同名商品`);
    return records;
}

// ========================================
// ID数据处理器
// 列映射: A=商品ID, B=商品名称, D=二级分类(备用), E=三级分类, N=商品价格
// ========================================
function processProductIdData(rows) {
    console.log(`<i data-lucide="tag"></i> [ID数据处理] 开始, 原始行数: ${rows?.length || 0}`);
    const seenProducts = new Set();
    const records = [];
    for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (!row || row.length === 0) continue;
        // B列(索引1): 商品名称
        const rawProductName = String(row[1] ?? '').trim();
        if (!rawProductName || rawProductName === 'nan') continue;
        const productName = extractShortName(rawProductName);
        if (seenProducts.has(productName)) continue;
        seenProducts.add(productName);

        // A列(索引0): 商品ID
        let productId = String(row[0] ?? '').trim();
        if (productId.startsWith('ID:')) productId = productId.substring(3).trim();

        const record = { product_name: productName, product_id: productId };

        // N列(索引13): 商品价格
        if (row.length > 13) record.product_price = parseNumber(row[13]);

        // E列(索引4): 三级分类，如果为空则使用 D列(索引3): 二级分类
        let category = String(row[4] ?? '').trim();
        if (!category || category === 'nan') {
            category = String(row[3] ?? '').trim();  // 回退到D列二级分类
        }
        if (category && category !== 'nan') {
            record.store_category = category;
        }

        records.push(record);
    }
    console.log(`<i data-lucide="check-circle"></i> [ID数据处理] 完成, 有效记录: ${records.length} 条, 已去重`);
    return records;
}

// ========================================
// 上传配置
// ========================================
const UploadConfigs = {
    ranking: {
        title: '<i data-lucide="bar-chart-2"></i> 排名上传 <span style=\"font-size: 0.75rem; background: rgba(220, 38, 38, 0.8); padding: 2px 8px; border-radius: 4px; color: #fff; font-weight: normal;\">只需下播更新</span>',
        tableName: 'ranking_data',
        processor: processRankingData,
        rules: [
            '商品名称：保留「字符及其后内容',
            '讲解次数：转整数，无效值记0',
            '成交金额：去除¥和逗号转数值',
            '曝光/点击成交率：去%后÷100转小数',
            '过滤：支付金额<100不导入'
        ],
        mapping: [
            { source: 'B列 商品名称', target: 'product_name' },
            { source: 'C列 讲解次数', target: 'lecture_count' },
            { source: 'F列 用户支付金额', target: 'sales_amount' },
            { source: 'J列 商品曝光-点击率', target: 'exposure_rate' },
            { source: 'K列 商品点击-成交转化率', target: 'conversion_rate' }
        ]
    },
    inventory: {
        title: '<i data-lucide="package"></i> 库存上传 <span style=\"font-size: 0.75rem; background: rgba(220, 38, 38, 0.8); padding: 2px 8px; border-radius: 4px; color: #fff; font-weight: normal;\">需先清空样品仓</span>',
        tableName: 'inventory_data',
        processor: processInventoryData,
        rules: [
            '同名商品自动合并',
            '数值字段：相加',
            '文本字段：去重合并'
        ],
        mapping: [
            { source: 'A列 图片', target: 'image_url' },
            { source: 'B列 商品名称', target: 'product_name' },
            { source: 'C列 商品编码', target: 'product_code' },
            { source: 'D列 虚拟分类', target: 'virtual_category' },
            { source: 'E列 分类', target: 'product_category' },
            { source: 'F列 商品标签', target: 'product_tag (分类福利品)' },
            { source: 'H列 主仓位', target: 'warehouse' },
            { source: 'I列 可用数', target: 'available_qty' },
            { source: 'J列 实际库存数', target: 'actual_stock' }
        ]
    },
    productId: {
        title: '<i data-lucide="tag"></i> ID上传',
        tableName: 'product_id_data',
        processor: processProductIdData,
        rules: [
            '商品名称：保留「字符后部分',
            '商品ID：去除"ID:"前缀',
            '按商品名称去重，保留首条'
        ],
        mapping: [
            { source: 'A列 商品ID', target: 'product_id' },
            { source: 'B列 商品名称', target: 'product_name' },
            { source: 'E列 三级分类', target: 'store_category' },
            { source: 'N列 商品价格', target: 'product_price' }
        ]
    }
};

// ========================================
// 上传历史记录功能
// ========================================
async function saveUploadHistory(uploadType, fileName, recordCount, uploadMode) {
    try {
        const { error } = await window.supabaseClient
            .from('upload_history')
            .insert({
                upload_type: uploadType,
                file_name: fileName,
                record_count: recordCount,
                upload_mode: uploadMode
            });
        if (error) console.error('保存上传历史失败:', error);
    } catch (e) {
        console.error('保存上传历史异常:', e);
    }
}

async function showUploadHistoryModal(uploadType, title) {
    const existingModal = document.getElementById('uploadHistoryModal');
    if (existingModal) existingModal.remove();

    const modal = document.createElement('div');
    modal.id = 'uploadHistoryModal';
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content upload-history-modal">
            <div class="modal-header">
                <h3><i data-lucide="history"></i> ${title} - 最近上传记录</h3>
                <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">&times;</button>
            </div>
            <div class="modal-body" id="uploadHistoryContent">
                <p class="text-muted">加载中...</p>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
    });

    const content = document.getElementById('uploadHistoryContent');
    try {
        const { data, error } = await window.supabaseClient
            .from('upload_history')
            .select('*')
            .eq('upload_type', uploadType)
            .order('created_at', { ascending: false })
            .limit(10);

        if (error) throw error;

        if (!data || data.length === 0) {
            content.innerHTML = '<p class="text-muted">暂无上传记录</p>';
            return;
        }

        content.innerHTML = `
            <table class="history-table">
                <thead>
                    <tr>
                        <th>文件名</th>
                        <th>上传时间</th>
                        <th>商品数量</th>
                        <th>上传模式</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.map(row => `
                        <tr>
                            <td class="file-name">${row.file_name}</td>
                            <td>${formatHistoryTime(row.created_at)}</td>
                            <td><span class="record-count">${row.record_count}</span></td>
                            <td>${row.upload_mode === 'full' ? '更新全部' : '补充上传'}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
        if (window.lucide) window.lucide.createIcons();
    } catch (e) {
        content.innerHTML = `<p class="text-error">加载失败: ${e.message}</p>`;
    }
}

function formatHistoryTime(isoString) {
    const date = new Date(isoString);
    return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// ========================================
// 生成单个上传区块
// ========================================
function generateUploadBlock(key, config) {
    const mappingRows = config.mapping.map(m =>
        `<tr><td>${m.source}</td><td>→</td><td>${m.target}</td></tr>`
    ).join('');

    return `
        <div class="upload-block" id="block-${key}">
            <div class="upload-block-header">
                <h3>${config.title} <span class="db-table-tag">→ ${config.tableName}</span></h3>
            </div>
            
            <div class="upload-zone" id="uploadZone-${key}">
                <div class="upload-zone-icon">📁</div>
                <p>拖拽文件到此处，或点击选择</p>
                <p class="upload-hint">.xlsx, .xls, .csv</p>
                <input type="file" id="fileInput-${key}" accept=".xlsx,.xls,.csv" style="display:none">
            </div>
            
            <div class="toggle-group" id="modeToggle-${key}">
                <button type="button" class="toggle-btn active" data-value="full">更新全部</button>
                <button type="button" class="toggle-btn" data-value="incremental">补充上传</button>
                <input type="hidden" name="mode-${key}" value="full">
            </div>
            
            <div class="upload-status" id="status-${key}" style="display:none">
                <div class="status-text" id="statusText-${key}">准备中...</div>
                <div class="progress-bar"><div class="progress-fill" id="progress-${key}"></div></div>
                <div class="status-detail" id="statusDetail-${key}"></div>
            </div>
            
            <div class="upload-actions-row">
                <button class="btn btn-primary btn-upload" id="uploadBtn-${key}" disabled>开始上传</button>
                <button class="btn btn-secondary btn-history" id="historyBtn-${key}"><i data-lucide="history"></i> 查看历史</button>
            </div>
            
            <div class="last-upload-time" id="lastUploadTime-${key}"></div>
            
            <div class="upload-info-section" style="margin-top: 1rem;">
                <h4 style="margin: 0 0 0.5rem 0; font-size: 0.9rem; color: var(--text-secondary);">📖 上传说明</h4>
                <div class="upload-info-content" style="padding: 0.75rem; background: var(--bg-tertiary); border-radius: var(--border-radius-sm);">
                    <div style="margin-bottom: 0.75rem;">
                        <strong style="color: var(--text-secondary);"><i data-lucide="clipboard-list"></i> 处理规则</strong>
                        <ul style="margin: 0.5rem 0 0 1rem; padding: 0; font-size: 0.85rem; color: var(--text-muted);">
                            ${config.rules.map(r => `<li>${r}</li>`).join('')}
                        </ul>
                    </div>
                    <div>
                        <strong style="color: var(--text-secondary);"><i data-lucide="link"></i> 字段映射</strong>
                        <table class="mapping-table" style="margin-top: 0.5rem; font-size: 0.8rem;">
                            <thead><tr><th>源字段</th><th></th><th>目标字段</th></tr></thead>
                            <tbody>${mappingRows}</tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// ========================================
// 生成完整上传页面（三合一）
// ========================================
function generateCombinedUploadPage() {
    const blocks = Object.entries(UploadConfigs)
        .map(([key, config]) => generateUploadBlock(key, config))
        .join('');

    return `<div class="upload-page-combined"><div class="upload-blocks-grid">${blocks}</div></div>`;
}

// ========================================
// 初始化上传区块
// ========================================
function initUploadBlock(key, config) {
    const uploadZone = document.getElementById(`uploadZone-${key}`);
    const fileInput = document.getElementById(`fileInput-${key}`);
    const uploadBtn = document.getElementById(`uploadBtn-${key}`);
    const historyBtn = document.getElementById(`historyBtn-${key}`);
    const statusDiv = document.getElementById(`status-${key}`);
    const statusText = document.getElementById(`statusText-${key}`);
    const progressBar = document.getElementById(`progress-${key}`);
    const statusDetail = document.getElementById(`statusDetail-${key}`);
    const toggleGroup = document.getElementById(`modeToggle-${key}`);
    const modeInput = toggleGroup.querySelector('input[type="hidden"]');

    let selectedFile = null;
    const lastUploadTimeDiv = document.getElementById(`lastUploadTime-${key}`);

    function updateLastUploadTime(timeStr) {
        if (lastUploadTimeDiv) {
            lastUploadTimeDiv.textContent = timeStr ? `最后上传：${timeStr}` : '';
        }
    }

    const savedTime = localStorage.getItem(`lastUpload_${key}`);
    if (savedTime) {
        updateLastUploadTime(savedTime);
    }

    toggleGroup.querySelectorAll('.toggle-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            toggleGroup.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            modeInput.value = btn.dataset.value;
        });
    });

    historyBtn?.addEventListener('click', () => {
        const plainTitle = config.title.replace(/<[^>]*>/g, '').trim();
        showUploadHistoryModal(key, plainTitle);
    });

    uploadZone.addEventListener('click', () => fileInput.click());
    uploadZone.addEventListener('dragover', (e) => { e.preventDefault(); uploadZone.classList.add('dragover'); });
    uploadZone.addEventListener('dragleave', () => uploadZone.classList.remove('dragover'));
    uploadZone.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadZone.classList.remove('dragover');
        if (e.dataTransfer.files.length > 0) handleFileSelect(e.dataTransfer.files[0]);
    });
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) handleFileSelect(e.target.files[0]);
    });

    function handleFileSelect(file) {
        selectedFile = file;
        uploadZone.innerHTML = `<div class="upload-zone-icon"><i data-lucide="check-circle"></i></div><p><strong>${file.name}</strong></p>`;
        uploadBtn.disabled = false;
    }

    uploadBtn.addEventListener('click', async () => {
        if (!selectedFile) return;

        // 库存上传前需要确认
        if (key === 'inventory') {
            const confirmed = confirm('请确认已是清空样品仓后数据。');
            if (!confirmed) return;
        }

        const modeValue = document.querySelector(`input[name="mode-${key}"]`).value;
        const isFullMode = modeValue === 'full';
        console.log(`<i data-lucide="clipboard-list"></i> 上传模式: ${modeValue}, isFullMode: ${isFullMode}`);
        try {
            statusDiv.style.display = 'block';
            uploadBtn.disabled = true;
            updateStatus('读取文件...', 10);
            const data = await readExcelFile(selectedFile);
            updateStatus('处理数据...', 30);
            const records = config.processor(data);
            updateStatus(`已处理 ${records.length} 条`, 50);
            if (records.length === 0) throw new Error('无有效数据');

            // 特殊处理库存上传逻辑，基于福利二字拆分
            let tableToRecords = [];
            if (key === 'inventory') {
                const normalRecords = [];
                const welfareRecords = [];
                records.forEach(r => {
                    // 读取并将临时字段从最终插入的数据中剔除
                    const tag = String(r._product_tag || '');
                    delete r._product_tag;
                    if (tag.includes('福利')) {
                        welfareRecords.push(r);
                    } else {
                        normalRecords.push(r);
                    }
                });

                tableToRecords.push({ tableName: config.tableName, records: normalRecords });
                tableToRecords.push({ tableName: 'welfare_inventory_data', records: welfareRecords });
            } else {
                tableToRecords.push({ tableName: config.tableName, records: records });
            }

            if (isFullMode) {
                console.log(`🗑️ 开始清空表...`);
                updateStatus('清空旧数据...', 60);
                for (const item of tableToRecords) {
                    await clearTable(item.tableName);
                    console.log(`<i data-lucide="check-circle"></i> 表 ${item.tableName} 已清空`);
                }
            }
            updateStatus('上传中...', 70);

            for (const item of tableToRecords) {
                if (item.records.length > 0) {
                    await uploadData(item.tableName, item.records);
                }
            }

            updateStatus('完成！', 100);
            if (key === 'inventory') {
                const normalLen = tableToRecords[0].records.length;
                const welfareLen = tableToRecords[1].records.length;
                statusDetail.innerHTML = `<span class="success"><i data-lucide="check-circle"></i> 成功 ${records.length} 条 (普通库存：${normalLen}，福利库存：${welfareLen})</span>`;
            } else {
                statusDetail.innerHTML = `<span class="success"><i data-lucide="check-circle"></i> 成功 ${records.length} 条</span>`;
            }
            // 保存最后上传时间
            const now = new Date();
            const timeStr = now.toLocaleString('zh-CN', {
                year: 'numeric', month: '2-digit', day: '2-digit',
                hour: '2-digit', minute: '2-digit', second: '2-digit'
            });
            localStorage.setItem(`lastUpload_${key}`, timeStr);
            updateLastUploadTime(timeStr);
            await saveUploadHistory(key, selectedFile.name, records.length, modeValue);
            const plainTitle = config.title.replace(/<[^>]*>/g, '').trim();
            window.AppUtils?.showToast?.(`${plainTitle} 成功处理并上传 ${records.length} 条`, 'success');
        } catch (error) {
            console.error('上传失败:', error);
            statusText.textContent = '上传失败';
            statusDetail.innerHTML = `<span class="error"><i data-lucide="x-circle"></i> ${error.message}</span>`;
            window.AppUtils?.showToast?.('上传失败: ' + error.message, 'error');
        } finally {
            uploadBtn.disabled = false;
        }
    });

    function updateStatus(text, progress) {
        statusText.textContent = text;
        progressBar.style.width = progress + '%';
    }
}

// ========================================
// 文件读取与数据库操作
// ========================================
async function readExcelFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const sheet = workbook.Sheets[workbook.SheetNames[0]];
                resolve(XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' }));
            } catch (err) { reject(new Error('解析失败: ' + err.message)); }
        };
        reader.onerror = () => reject(new Error('读取失败'));
        reader.readAsArrayBuffer(file);
    });
}

async function clearTable(tableName) {
    // 使用 gte('id', 0) 确保删除所有记录
    const { error } = await window.supabaseClient
        .from(tableName)
        .delete()
        .gte('id', 0);
    if (error) {
        console.error('清空表失败:', error);
        throw new Error('清空失败: ' + error.message);
    }
    console.log(`<i data-lucide="check-circle"></i> 已清空表 ${tableName}`);
}

async function uploadData(tableName, records) {
    const batchSize = 100;
    for (let i = 0; i < records.length; i += batchSize) {
        const { error } = await window.supabaseClient.from(tableName).insert(records.slice(i, i + batchSize));
        if (error) throw new Error('上传失败: ' + error.message);
    }
}

// ========================================
// 导出加载函数
// ========================================
window.loadUploadPage = function (pageId) {
    // 对于 "upload" 主页面或任何 upload-* 子页面，都返回合并页面
    if (pageId === 'upload' || pageId.startsWith('upload-')) {
        return {
            html: generateCombinedUploadPage(),
            init: () => {
                Object.entries(UploadConfigs).forEach(([key, config]) => {
                    initUploadBlock(key, config);
                });
            }
        };
    }
    return null;
};
