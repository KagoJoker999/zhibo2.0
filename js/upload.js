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
    return records;
}

// ========================================
// 库存数据处理器
// 列映射: A=图片, B=商品名称, C=商品编码, D=虚拟分类, E=分类, H=主仓位, I=可用数, J=实际库存
// ========================================
function processInventoryData(rows) {
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
                product_category: new Set()
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
            product_category: Array.from(data.product_category).filter(Boolean).join(',')
        });
    });
    return records;
}

// ========================================
// ID数据处理器
// 列映射: A=商品ID, B=商品名称, D=二级分类(备用), E=三级分类, N=商品价格
// ========================================
function processProductIdData(rows) {
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
    return records;
}

// ========================================
// 上传配置
// ========================================
const UploadConfigs = {
    ranking: {
        title: '📊 排名数据上传',
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
        title: '📦 库存数据上传',
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
            { source: 'H列 主仓位', target: 'warehouse' },
            { source: 'I列 可用数', target: 'available_qty' },
            { source: 'J列 实际库存数', target: 'actual_stock' }
        ]
    },
    productId: {
        title: '🆔 商品ID上传',
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
// 生成单个上传区块
// ========================================
function generateUploadBlock(key, config) {
    const mappingRows = config.mapping.map(m =>
        `<tr><td>${m.source}</td><td>→</td><td>${m.target}</td></tr>`
    ).join('');

    return `
        <div class="upload-block" id="block-${key}">
            <div class="upload-block-header">
                <h3>${config.title}</h3>
            </div>
            
            <div class="upload-zone" id="uploadZone-${key}">
                <div class="upload-zone-icon">📁</div>
                <p>拖拽文件到此处，或点击选择</p>
                <p class="upload-hint">.xlsx, .xls, .csv</p>
                <input type="file" id="fileInput-${key}" accept=".xlsx,.xls,.csv" style="display:none">
            </div>
            
            <div class="upload-options">
                <label class="radio-label">
                    <input type="radio" name="mode-${key}" value="full" checked>
                    <span>更新全部</span>
                </label>
                <label class="radio-label">
                    <input type="radio" name="mode-${key}" value="incremental">
                    <span>补充上传</span>
                </label>
            </div>
            
            <details class="rules-details">
                <summary>📋 处理规则</summary>
                <ul>${config.rules.map(r => `<li>${r}</li>`).join('')}</ul>
            </details>
            
            <details class="mapping-details">
                <summary>🔗 字段映射</summary>
                <table class="mapping-table">
                    <thead><tr><th>源字段</th><th></th><th>目标字段</th></tr></thead>
                    <tbody>${mappingRows}</tbody>
                </table>
            </details>
            
            <div class="upload-status" id="status-${key}" style="display:none">
                <div class="status-text" id="statusText-${key}">准备中...</div>
                <div class="progress-bar"><div class="progress-fill" id="progress-${key}"></div></div>
                <div class="status-detail" id="statusDetail-${key}"></div>
            </div>
            
            <div class="upload-buttons">
                <button class="btn btn-primary btn-upload" id="uploadBtn-${key}" disabled>开始上传</button>
                ${key === 'ranking' ? '<button class="btn btn-calculate" id="calculateBtn" style="display:none">🧮 计算评分</button>' : ''}
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
    const statusDiv = document.getElementById(`status-${key}`);
    const statusText = document.getElementById(`statusText-${key}`);
    const progressBar = document.getElementById(`progress-${key}`);
    const statusDetail = document.getElementById(`statusDetail-${key}`);

    let selectedFile = null;

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
        uploadZone.innerHTML = `<div class="upload-zone-icon">✅</div><p><strong>${file.name}</strong></p>`;
        uploadBtn.disabled = false;
    }

    uploadBtn.addEventListener('click', async () => {
        if (!selectedFile) return;
        const modeInput = document.querySelector(`input[name="mode-${key}"]:checked`);
        const isFullMode = modeInput?.value === 'full';
        console.log(`📋 上传模式: ${modeInput?.value}, isFullMode: ${isFullMode}`);
        try {
            statusDiv.style.display = 'block';
            uploadBtn.disabled = true;
            updateStatus('读取文件...', 10);
            const data = await readExcelFile(selectedFile);
            updateStatus('处理数据...', 30);
            const records = config.processor(data);
            updateStatus(`已处理 ${records.length} 条`, 50);
            if (records.length === 0) throw new Error('无有效数据');
            if (isFullMode) {
                console.log(`🗑️ 开始清空表 ${config.tableName}...`);
                updateStatus('清空旧数据...', 60);
                await clearTable(config.tableName);
                console.log(`✅ 表 ${config.tableName} 已清空`);
            }
            updateStatus('上传中...', 70);
            await uploadData(config.tableName, records);
            updateStatus('完成！', 100);
            statusDetail.innerHTML = `<span class="success">✅ 成功 ${records.length} 条</span>`;
            window.AppUtils?.showToast?.(`${config.title} 成功上传 ${records.length} 条`, 'success');

            // 排名上传成功后显示计算按钮
            if (key === 'ranking') {
                const calculateBtn = document.getElementById('calculateBtn');
                if (calculateBtn) {
                    calculateBtn.style.display = 'inline-block';
                }
            }
        } catch (error) {
            console.error('上传失败:', error);
            statusText.textContent = '上传失败';
            statusDetail.innerHTML = `<span class="error">❌ ${error.message}</span>`;
            window.AppUtils?.showToast?.('上传失败: ' + error.message, 'error');
        } finally {
            uploadBtn.disabled = false;
        }
    });

    // 排名模块的计算按钮事件
    if (key === 'ranking') {
        const calculateBtn = document.getElementById('calculateBtn');
        if (calculateBtn) {
            calculateBtn.addEventListener('click', async () => {
                try {
                    calculateBtn.disabled = true;
                    calculateBtn.textContent = '计算中...';

                    // 1. 加载配置
                    const scoringConfig = await window.ScoringModule.loadScoringConfig();

                    // 2. 从数据库加载排名数据
                    const { data: rankingData, error } = await window.supabaseClient
                        .from('ranking_data')
                        .select('*');

                    if (error) throw error;
                    if (!rankingData || rankingData.length === 0) {
                        throw new Error('没有排名数据可计算');
                    }

                    // 3. 计算评分
                    const scores = window.ScoringModule.calculateScores(rankingData, scoringConfig);

                    // 4. 更新数据库
                    await window.ScoringModule.updateRankingScores(scores);

                    window.AppUtils?.showToast?.(`成功计算 ${scores.length} 条评分`, 'success');
                    calculateBtn.textContent = '✅ 计算完成';
                } catch (error) {
                    console.error('计算失败:', error);
                    window.AppUtils?.showToast?.('计算失败: ' + error.message, 'error');
                    calculateBtn.textContent = '🧮 计算评分';
                } finally {
                    calculateBtn.disabled = false;
                }
            });
        }
    }

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
    console.log(`✅ 已清空表 ${tableName}`);
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
