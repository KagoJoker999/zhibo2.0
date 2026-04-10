/**
 * 商品数据一致性检查模块
 * ========================================
 * 上传 Excel/CSV 表格与 listing_data_export 数据对比校验
 * 两项检查：标题完整性、多SKU编码存在性
 */

// ========================================
// 打开商品检查弹窗
// ========================================
function openProductCheckerModal() {
    const existing = document.getElementById('productCheckerModal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'productCheckerModal';
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content product-checker-modal">
            <div class="modal-header">
                <h3><i data-lucide="search-check"></i> 商品数据校验 <span class="db-table-tag">← listing_data_export</span> <span style="color:var(--error-color); font-size:0.85rem; font-weight:normal; margin-left:10px;">（需【同步上链接表】后才可对比）</span></h3>
                <button class="modal-close" id="checkerModalClose">&times;</button>
            </div>
            <div class="modal-body">
                <div class="checker-dropzone" id="checkerDropzone">
                    <div class="checker-dropzone-icon">📂</div>
                    <p>拖拽上传表格文件到此处</p>
                    <p class="upload-hint">.xlsx, .xls, .csv</p>
                    <input type="file" id="checkerFileInput" accept=".xlsx,.xls,.csv" style="display:none">
                </div>
                <div class="checker-status" id="checkerStatus" style="display:none">
                    <div class="checker-status-text" id="checkerStatusText">解析中...</div>
                    <div class="progress-bar"><div class="progress-fill" id="checkerProgress"></div></div>
                </div>
                <div class="checker-results" id="checkerResults" style="display:none"></div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    // 关闭事件
    document.getElementById('checkerModalClose').addEventListener('click', () => modal.remove());
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });

    // 拖拽上传
    const dropzone = document.getElementById('checkerDropzone');
    const fileInput = document.getElementById('checkerFileInput');

    dropzone.addEventListener('click', () => fileInput.click());
    dropzone.addEventListener('dragover', (e) => { e.preventDefault(); dropzone.classList.add('dragover'); });
    dropzone.addEventListener('dragleave', () => dropzone.classList.remove('dragover'));
    dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropzone.classList.remove('dragover');
        if (e.dataTransfer.files.length > 0) startCheck(e.dataTransfer.files[0]);
    });
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) startCheck(e.target.files[0]);
    });

    if (window.lucide) window.lucide.createIcons();
}

// ========================================
// 执行校验
// ========================================
async function startCheck(file) {
    const dropzone = document.getElementById('checkerDropzone');
    const statusDiv = document.getElementById('checkerStatus');
    const statusText = document.getElementById('checkerStatusText');
    const progressBar = document.getElementById('checkerProgress');
    const resultsDiv = document.getElementById('checkerResults');

    // 显示已选文件
    dropzone.innerHTML = `<div class="checker-dropzone-icon"><i data-lucide="check-circle"></i></div><p><strong>${file.name}</strong></p>`;
    if (window.lucide) window.lucide.createIcons();

    statusDiv.style.display = 'block';
    resultsDiv.style.display = 'none';

    function updateProgress(text, pct) {
        statusText.textContent = text;
        progressBar.style.width = pct + '%';
    }

    try {
        // 1. 读取上传文件
        updateProgress('读取上传文件...', 10);
        const rows = await readCheckerFile(file);
        if (!rows || rows.length < 2) throw new Error('表格为空或无有效数据');

        // 找到表头中的列索引
        const header = rows[0].map(h => String(h ?? '').trim());
        const nameColIdx = header.indexOf('商品名称');
        const codeColIdx = header.indexOf('商家SKU编码');
        // 查找商品 ID 列（A 列）
        const productIdColIdx = header.findIndex(h => h.includes('商品 ID') || h.includes('商品ID') || h === '商品id');
        if (nameColIdx === -1) throw new Error('上传表格中未找到"商品名称"列');
        if (codeColIdx === -1) throw new Error('上传表格中未找到"商家SKU编码"列');

        // 构建上传数据的映射
        const uploadNames = new Set();
        const uploadCodes = new Set();
        // 商品名称 -> 商品ID 的映射（用于生成编辑链接）
        const nameToProductId = new Map();

        for (let i = 1; i < rows.length; i++) {
            const row = rows[i];
            let name = String(row[nameColIdx] ?? '').trim();
            name = cleanProductName(name); // 清洗名称：删除「之前的符号

            const code = String(row[codeColIdx] ?? '').trim();
            if (!name) continue;
            uploadNames.add(name);
            if (code) uploadCodes.add(code);
            // 保存第一个遇到的商品ID
            if (productIdColIdx !== -1 && !nameToProductId.has(name)) {
                const pid = String(row[productIdColIdx] ?? '').trim();
                if (pid) nameToProductId.set(name, pid);
            }
        }

        // 2. 加载新品表格（源数据）
        updateProgress('加载数据库数据...', 30);
        const { data: sourceData, error } = await window.supabaseClient
            .from('listing_data_export')
            .select('*');

        if (error) throw new Error('读取数据库失败: ' + error.message);
        if (!sourceData || sourceData.length === 0) throw new Error('数据库 listing_data_export 中无数据，请先同步上链接表');

        updateProgress('执行校验...', 50);

        const issues = [];

        // ========== 检查 A：标题完整性校验 ==========
        for (const item of sourceData) {
            let productName = (item.product_name || '').trim();
            productName = cleanProductName(productName); // 清洗名称

            if (!productName) continue;
            if (!uploadNames.has(productName)) {
                issues.push({
                    type: 'missing',
                    label: '缺失商品',
                    name: productName,
                    productId: nameToProductId.get(productName) || ''
                });
            }
        }

        updateProgress('检查多SKU编码...', 65);

        // ========== 检查 C：多 SKU 编码存在性校验 ==========
        for (const item of sourceData) {
            const skuCount = parseInt(item.sku_count) || 0;
            if (skuCount <= 1) continue;

            let productName = (item.product_name || '').trim();
            productName = cleanProductName(productName); // 清洗名称

            const isPresale = (item.virtual_category || '').trim() === '可预售';

            // 提取所有 product_code 开头的列值
            const subCodes = [];
            const mainCode = (item.product_code || '').trim();
            if (mainCode) subCodes.push(mainCode);

            for (let i = 2; i <= 10; i++) {
                const col = `product_code_${i}`;
                const val = (item[col] || '').trim();
                if (val) subCodes.push(val);
            }

            if (subCodes.length === 0) continue;

            // 检查每个子编码（预售/非预售统一检查原编码是否存在）
            for (const code of subCodes) {
                // 预售商品的编码可能带 ==，统一取原编码进行匹配
                const baseCode = code.replace(/==$/g, '');
                if (!uploadCodes.has(baseCode) && !uploadCodes.has(code)) {
                    issues.push({
                        type: 'sku',
                        label: 'SKU缺失',
                        name: productName,
                        productId: nameToProductId.get(productName) || '',
                        detail: `子编码 "${baseCode}" 在上传表格中不存在`
                    });
                }
            }
        }

        updateProgress('校验完成', 100);

        // 3. 显示结果
        renderCheckerResults(issues, sourceData.length);

    } catch (err) {
        console.error('商品检查失败:', err);
        statusText.textContent = '校验失败';
        statusText.style.color = 'var(--error-color)';
        resultsDiv.style.display = 'block';
        resultsDiv.innerHTML = `<div class="checker-error"><i data-lucide="x-circle"></i> ${err.message}</div>`;
        if (window.lucide) window.lucide.createIcons();
    }
}

// ========================================
// 渲染校验结果
// ========================================
function renderCheckerResults(issues, totalCount) {
    const resultsDiv = document.getElementById('checkerResults');
    resultsDiv.style.display = 'block';

    if (issues.length === 0) {
        resultsDiv.innerHTML = `
            <div class="checker-success">
                <div class="checker-success-icon">✅</div>
                <h4>全部通过</h4>
                <p>共校验 ${totalCount} 条商品，未发现异常</p>
            </div>
        `;
        return;
    }

    // 按类型分组
    const missingItems = issues.filter(i => i.type === 'missing');
    const skuItems = issues.filter(i => i.type === 'sku');

    const typeColors = {
        missing: { bg: 'rgba(239, 68, 68, 0.1)', border: 'rgba(239, 68, 68, 0.3)', color: '#ef4444', icon: '🚫' },
        sku: { bg: 'rgba(139, 92, 246, 0.1)', border: 'rgba(139, 92, 246, 0.3)', color: '#8b5cf6', icon: '🔗' }
    };

    let html = `
        <div class="checker-summary">
            <span>共校验 <strong>${totalCount}</strong> 条商品，发现 <strong style="color:var(--error-color)">${issues.length}</strong> 项异常</span>
        </div>
    `;

    function renderGroup(items, title, type) {
        if (items.length === 0) return '';
        const c = typeColors[type];
        return `
            <div class="checker-group checker-group-${type}" style="border-radius:8px; padding:1rem; margin-bottom:0.75rem;">
                <h4 class="checker-group-title">${c.icon} ${title}（${items.length}）</h4>
                <div class="checker-items">
                    ${items.map(item => {
                        const nameHtml = item.productId
                            ? `<a href="https://fxg.jinritemai.com/ffa/g/create?product_id=${item.productId}&cid=33607&entrance=edit" target="_blank" class="checker-link">↗ ${item.name}</a>`
                            : `<span style="color:var(--text-primary)">${item.name}</span>`;
                        return `
                        <div class="checker-item">
                            ${nameHtml}
                            ${item.detail ? `<span class="checker-item-detail">${item.detail}</span>` : ''}
                        </div>`;
                    }).join('')}
                </div>
            </div>
        `;
    }

    html += renderGroup(missingItems, '缺失商品', 'missing');
    html += renderGroup(skuItems, 'SKU缺失', 'sku');

    resultsDiv.innerHTML = html;
}

// ========================================
// 文件读取
// ========================================
async function readCheckerFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const sheet = workbook.Sheets[workbook.SheetNames[0]];
                resolve(XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' }));
            } catch (err) { reject(new Error('文件解析失败: ' + err.message)); }
        };
        reader.onerror = () => reject(new Error('文件读取失败'));
        reader.readAsArrayBuffer(file);
    });
}

// ========================================
// 名称清洗：删除第一个「之前的符号
// ========================================
function cleanProductName(name) {
    if (!name) return '';
    const idx = name.indexOf('「');
    if (idx !== -1) {
        return name.substring(idx);
    }
    return name;
}

// 暴露到全局
window.openProductCheckerModal = openProductCheckerModal;
