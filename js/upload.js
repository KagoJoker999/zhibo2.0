/**
 * 上传功能模块
 * ========================================
 * 包含：排名上传、库存上传、ID上传
 */

// ========================================
// 数据处理器
// ========================================

/**
 * 提取商品简称 - 保留「字符及其后的内容
 */
function extractShortName(fullName) {
    if (!fullName) return '';
    const trimmed = String(fullName).trim();
    if (trimmed.includes('「')) {
        const idx = trimmed.indexOf('「');
        return trimmed.substring(idx);
    }
    return trimmed;
}

/**
 * 解析数值
 */
function parseNumber(value) {
    if (value === null || value === undefined) return 0;
    if (typeof value === 'number') {
        return isFinite(value) ? value : 0;
    }
    const str = String(value).trim();
    if (!str || str.toLowerCase() === 'nan' || str.toLowerCase() === 'none') {
        return 0;
    }
    const cleaned = str.replace(/[^\d.\-]/g, '');
    const num = parseFloat(cleaned);
    return isFinite(num) ? num : 0;
}

/**
 * 解析金额 - 去除¥符号和逗号
 */
function parseAmount(value) {
    if (value === null || value === undefined) return 0;
    const str = String(value).trim();
    const cleaned = str.replace(/[¥￥,，]/g, '');
    return parseNumber(cleaned);
}

/**
 * 解析百分比 - 去除%并转换为小数
 */
function parsePercentage(value) {
    if (value === null || value === undefined) return 0;
    const str = String(value).trim();
    if (str.includes('%')) {
        const cleaned = str.replace('%', '');
        const num = parseNumber(cleaned);
        return num / 100;
    }
    return parseNumber(value);
}

// ========================================
// 排名数据处理器
// ========================================
function processPaimingData(rows) {
    const records = [];

    // 跳过表头
    for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (!row || row.length === 0) continue;

        // 获取商品名称（列索引根据实际Excel调整）
        const rawProductName = String(row[1] ?? '').trim();
        if (!rawProductName || rawProductName === 'nan') continue;

        const productName = extractShortName(rawProductName);

        // 成交金额（用户支付金额）
        const salesAmount = parseAmount(row[6]);

        // 过滤条件：金额 < 100 不导入
        if (salesAmount < 100) continue;

        records.push({
            shangpin_mingcheng: productName,
            jiangjie_cishu: Math.round(parseNumber(row[2])),
            chengjiao_jine: salesAmount,
            dianji_lv: parsePercentage(row[9])
        });
    }

    return records;
}

// ========================================
// 库存数据处理器
// ========================================
function processKucunData(rows) {
    // 用于存储按商品名称分组的数据
    const productMap = new Map();

    // 跳过表头
    for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (!row || row.length === 0) continue;

        const productName = String(row[1] ?? '').trim();
        if (!productName || productName === 'nan') continue;

        if (!productMap.has(productName)) {
            productMap.set(productName, {
                tupian_dizhi: '',
                cangwei: new Set(),
                keyong_shu: 0,
                kucun_shu: 0,
                biaoqian: new Set(),
                fenlei: new Set()
            });
        }

        const data = productMap.get(productName);

        // 图片地址：只取第一个非空值
        if (!data.tupian_dizhi) {
            const img = String(row[0] ?? '').trim();
            if (img && img !== 'nan') data.tupian_dizhi = img;
        }

        // 文本字段去重合并
        const addToSet = (set, value) => {
            const str = String(value ?? '').trim();
            if (str && str !== 'nan') set.add(str);
        };

        addToSet(data.cangwei, row[9]);   // 主仓位
        addToSet(data.biaoqian, row[1]);  // 商品标签
        addToSet(data.fenlei, row[28]);   // 分类

        // 数值字段相加
        data.keyong_shu += Math.round(parseNumber(row[10]));
        data.kucun_shu += Math.round(parseNumber(row[10]));
    }

    // 转换为最终记录格式
    const records = [];
    productMap.forEach((data, productName) => {
        records.push({
            shangpin_mingcheng: productName,
            tupian_dizhi: data.tupian_dizhi,
            cangwei: Array.from(data.cangwei).filter(Boolean).join(','),
            keyong_shu: data.keyong_shu,
            kucun_shu: data.kucun_shu,
            biaoqian: Array.from(data.biaoqian).filter(Boolean).join(','),
            fenlei: Array.from(data.fenlei).filter(Boolean).join(',')
        });
    });

    return records;
}

// ========================================
// ID数据处理器
// ========================================
function processIdData(rows) {
    const seenProducts = new Set();
    const records = [];

    // 跳过表头
    for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (!row || row.length === 0) continue;

        const rawProductName = String(row[1] ?? '').trim();
        if (!rawProductName || rawProductName === 'nan') continue;

        const productName = extractShortName(rawProductName);

        // 去重
        if (seenProducts.has(productName)) continue;
        seenProducts.add(productName);

        // 处理商品ID：去除 'ID:' 前缀
        let productId = String(row[0] ?? '').trim();
        if (productId.startsWith('ID:')) {
            productId = productId.substring(3).trim();
        }

        records.push({
            shangpin_mingcheng: productName,
            shangpin_id: productId
        });
    }

    return records;
}

// ========================================
// 上传页面生成器
// ========================================
function generateUploadPage(type, title, icon, rules) {
    return `
        <div class="upload-page">
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">${icon} ${title}</h3>
                </div>
                
                <div class="upload-zone" id="uploadZone-${type}">
                    <div class="upload-zone-icon">📁</div>
                    <p>拖拽文件到此处，或点击选择文件</p>
                    <p class="upload-hint">支持 .xlsx, .xls, .csv 格式</p>
                    <input type="file" id="fileInput-${type}" accept=".xlsx,.xls,.csv" style="display:none">
                </div>
                
                <div class="upload-options">
                    <label class="upload-mode-label">上传模式：</label>
                    <label class="radio-label">
                        <input type="radio" name="uploadMode-${type}" value="full" checked>
                        <span>全量（清空后上传）</span>
                    </label>
                    <label class="radio-label">
                        <input type="radio" name="uploadMode-${type}" value="incremental">
                        <span>增量（追加）</span>
                    </label>
                </div>
                
                <div class="rules-box">
                    <h4>📊 处理规则</h4>
                    <ul>
                        ${rules.map(r => `<li>${r}</li>`).join('')}
                    </ul>
                </div>
                
                <div class="upload-status" id="status-${type}" style="display:none">
                    <div class="status-header">
                        <span class="status-label">处理状态：</span>
                        <span class="status-text" id="statusText-${type}">准备中...</span>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill" id="progress-${type}" style="width:0%"></div>
                    </div>
                    <div class="status-detail" id="statusDetail-${type}"></div>
                </div>
                
                <div class="upload-actions">
                    <button class="btn btn-primary" id="uploadBtn-${type}" disabled>
                        开始上传
                    </button>
                </div>
            </div>
        </div>
    `;
}

// ========================================
// 初始化上传页面
// ========================================
function initUploadPage(type, tableName, processor) {
    const uploadZone = document.getElementById(`uploadZone-${type}`);
    const fileInput = document.getElementById(`fileInput-${type}`);
    const uploadBtn = document.getElementById(`uploadBtn-${type}`);
    const statusDiv = document.getElementById(`status-${type}`);
    const statusText = document.getElementById(`statusText-${type}`);
    const progressBar = document.getElementById(`progress-${type}`);
    const statusDetail = document.getElementById(`statusDetail-${type}`);

    let selectedFile = null;

    // 点击上传区域
    uploadZone.addEventListener('click', () => fileInput.click());

    // 拖拽事件
    uploadZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadZone.classList.add('dragover');
    });

    uploadZone.addEventListener('dragleave', () => {
        uploadZone.classList.remove('dragover');
    });

    uploadZone.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadZone.classList.remove('dragover');
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFileSelect(files[0]);
        }
    });

    // 文件选择
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleFileSelect(e.target.files[0]);
        }
    });

    function handleFileSelect(file) {
        selectedFile = file;
        uploadZone.innerHTML = `
            <div class="upload-zone-icon">✅</div>
            <p><strong>${file.name}</strong></p>
            <p class="upload-hint">${formatFileSize(file.size)}</p>
        `;
        uploadBtn.disabled = false;
    }

    // 上传按钮
    uploadBtn.addEventListener('click', async () => {
        if (!selectedFile) return;

        const isFullMode = document.querySelector(`input[name="uploadMode-${type}"]:checked`).value === 'full';

        try {
            statusDiv.style.display = 'block';
            uploadBtn.disabled = true;

            // 1. 读取文件
            updateStatus('正在读取文件...', 10);
            const data = await readExcelFile(selectedFile);

            // 2. 处理数据
            updateStatus('正在处理数据...', 30);
            const records = processor(data);
            updateStatus(`已处理 ${records.length} 条记录`, 50);

            if (records.length === 0) {
                throw new Error('没有有效数据可上传');
            }

            // 3. 全量模式先清空
            if (isFullMode) {
                updateStatus('正在清空旧数据...', 60);
                await clearTable(tableName);
            }

            // 4. 上传数据
            updateStatus('正在上传数据...', 70);
            await uploadData(tableName, records);

            // 5. 完成
            updateStatus('上传完成！', 100);
            statusDetail.innerHTML = `<span class="success">✅ 成功上传 ${records.length} 条记录</span>`;

            window.AppUtils.showToast(`成功上传 ${records.length} 条记录`, 'success');

        } catch (error) {
            console.error('上传失败:', error);
            statusText.textContent = '上传失败';
            statusDetail.innerHTML = `<span class="error">❌ ${error.message}</span>`;
            window.AppUtils.showToast('上传失败: ' + error.message, 'error');
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
// 文件读取
// ========================================
async function readExcelFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const sheet = workbook.Sheets[sheetName];
                const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
                resolve(rows);
            } catch (error) {
                reject(new Error('文件解析失败: ' + error.message));
            }
        };
        reader.onerror = () => reject(new Error('文件读取失败'));
        reader.readAsArrayBuffer(file);
    });
}

// ========================================
// 数据库操作
// ========================================
async function clearTable(tableName) {
    const { error } = await window.supabaseClient
        .from(tableName)
        .delete()
        .neq('id', 0);

    if (error) throw new Error('清空数据失败: ' + error.message);
}

async function uploadData(tableName, records) {
    // 分批上传，每批 100 条
    const batchSize = 100;
    for (let i = 0; i < records.length; i += batchSize) {
        const batch = records.slice(i, i + batchSize);
        const { error } = await window.supabaseClient
            .from(tableName)
            .insert(batch);

        if (error) throw new Error('上传数据失败: ' + error.message);
    }
}

// ========================================
// 工具函数
// ========================================
function formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// ========================================
// 页面配置
// ========================================
const UploadPages = {
    'upload-ranking': {
        title: '排名数据上传',
        icon: '📊',
        tableName: 'paiming',
        processor: processPaimingData,
        rules: [
            '商品名称：保留「字符及其后内容',
            '讲解次数：转数值，无效值记0',
            '成交金额：去除¥和逗号后转数值',
            '点击率：去%后除以100转小数',
            '过滤：成交金额<100的记录不导入'
        ]
    },
    'upload-inventory': {
        title: '库存数据上传',
        icon: '📦',
        tableName: 'kucun',
        processor: processKucunData,
        rules: [
            '同名商品自动合并',
            '数值字段（可用数/库存数）：相加',
            '文本字段（标签/分类等）：去重合并',
            '字段映射：图片→图片地址，主仓位→仓位'
        ]
    },
    'upload-product-id': {
        title: '商品ID上传',
        icon: '🆔',
        tableName: 'shangpin_id',
        processor: processIdData,
        rules: [
            '支持Excel和CSV格式',
            '商品名称：保留「字符后部分',
            '商品ID：去除"ID:"前缀',
            '按商品名称去重，保留首条'
        ]
    }
};

// ========================================
// 导出加载函数
// ========================================
window.loadUploadPage = function (pageId) {
    const config = UploadPages[pageId];
    if (!config) return null;

    // 生成页面 HTML
    const html = generateUploadPage(
        pageId,
        config.title,
        config.icon,
        config.rules
    );

    // 返回 HTML 和初始化回调
    return {
        html: html,
        init: () => initUploadPage(pageId, config.tableName, config.processor)
    };
};
