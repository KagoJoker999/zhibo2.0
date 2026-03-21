/**
 * 发券品处理模块
 * ========================================
 * 功能：上传发券品数据、匹配商品ID、手动编辑、批量上传
 * 目标数据库表：coupon_product_data
 * ID匹配来源表：product_id_data
 */

// ========================================
// 模块状态
// ========================================
let couponProductList = [];  // 当前待上传的商品列表

// ========================================
// 数据处理器
// 列映射: A=图片, B=商品名称, C=商品编码
// ========================================
function processCouponProductData(rows) {
    console.log(`<i data-lucide="ticket"></i> [发券品处理] 开始解析数据, 原始行数: ${rows?.length || 0}`);
    const records = [];
    for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (!row || row.length === 0) continue;

        // B列(索引1): 商品名称
        const productName = String(row[1] ?? '').trim();
        if (!productName || productName === 'nan') continue;

        // A列(索引0): 图片
        const imageUrl = String(row[0] ?? '').trim();

        // C列(索引2): 商品编码
        const productCode = String(row[2] ?? '').trim();

        records.push({
            image_url: imageUrl !== 'nan' ? imageUrl : '',
            product_name: productName,
            product_code: productCode !== 'nan' ? productCode : '',
            product_id: '',  // 待匹配
            matched: false   // 匹配状态
        });
    }
    console.log(`<i data-lucide="check-circle"></i> [发券品处理] 解析完成, 有效记录: ${records.length} 条`);
    return records;
}

// ========================================
// 商品ID匹配
// 从 product_id_data 表查询，通过商品名称匹配
// ========================================
async function matchProductIds(records) {
    if (!records || records.length === 0) return records;

    console.log(`🔍 [发券品ID匹配] 开始匹配, 商品数: ${records.length}`);
    try {
        // 获取所有商品名称
        const productNames = records.map(r => r.product_name);

        // 查询 product_id_data 表
        const { data, error } = await window.supabaseClient
            .from('product_id_data')
            .select('product_name, product_id')
            .in('product_name', productNames);

        if (error) {
            console.error('<i data-lucide="x-circle"></i> [发券品ID匹配] 查询失败:', error.message);
            return records;
        }

        // 构建名称到ID的映射
        const idMap = new Map();
        if (data) {
            data.forEach(item => {
                if (item.product_name && item.product_id) {
                    idMap.set(item.product_name, item.product_id);
                }
            });
        }

        // 匹配商品ID
        records.forEach(record => {
            const id = idMap.get(record.product_name);
            if (id) {
                record.product_id = id;
                record.matched = true;
            }
        });

        const matchedCount = records.filter(r => r.matched).length;
        console.log(`<i data-lucide="check-circle"></i> [发券品ID匹配] 完成: ${matchedCount}/${records.length} 匹配成功`);
        return records;
    } catch (err) {
        console.error('<i data-lucide="x-circle"></i> [发券品ID匹配] 异常:', err.message);
        return records;
    }
}

// ========================================
// 页面生成
// ========================================
function generateCouponPage() {
    return `
        <div class="coupon-page">
            <div class="coupon-upload-row">
                <!-- 左侧：上传功能 -->
                <div class="upload-block" id="block-coupon">
                    <div class="upload-block-header">
                        <h3><i data-lucide="ticket"></i> 发券品数据上传 <span class="db-table-tag">→ coupon_product_data</span></h3>
                    </div>
                    
                    <div class="upload-zone" id="uploadZone-coupon">
                        <div class="upload-zone-icon">📁</div>
                        <p>拖拽文件到此处，或点击选择</p>
                        <p class="upload-hint">.xlsx, .xls, .csv</p>
                        <input type="file" id="fileInput-coupon" accept=".xlsx,.xls,.csv" style="display:none">
                    </div>
                    
                    <div class="upload-options">
                        <label class="radio-label">
                            <input type="radio" name="mode-coupon" value="full" checked>
                            <span>更新全部</span>
                        </label>
                        <label class="radio-label">
                            <input type="radio" name="mode-coupon" value="incremental">
                            <span>补充上传</span>
                        </label>
                    </div>
                    
                    <div class="upload-status" id="status-coupon" style="display:none">
                        <div class="status-text" id="statusText-coupon">准备中...</div>
                        <div class="progress-bar"><div class="progress-fill" id="progress-coupon"></div></div>
                        <div class="status-detail" id="statusDetail-coupon"></div>
                    </div>
                </div>
                
                <!-- 右侧：上传说明 -->
                <div class="upload-block coupon-info-block">
                    <div class="upload-block-header">
                        <h3>📖 上传说明</h3>
                    </div>
                    <div class="coupon-info-content">
                        <div class="info-section">
                            <strong><i data-lucide="clipboard-list"></i> 处理规则</strong>
                            <ul>
                                <li>从 product_id_data 表自动匹配商品ID</li>
                                <li>未匹配商品以红色高亮显示</li>
                                <li>可手动填写缺失的商品ID</li>
                                <li>所有商品必须有ID才能上传</li>
                            </ul>
                        </div>
                        <div class="info-section">
                            <strong><i data-lucide="link"></i> 字段映射</strong>
                            <table class="mapping-table">
                                <thead><tr><th>源字段</th><th></th><th>目标字段</th></tr></thead>
                                <tbody>
                                    <tr><td>A列 图片</td><td>→</td><td>image_url</td></tr>
                                    <tr><td>B列 商品名称</td><td>→</td><td>product_name</td></tr>
                                    <tr><td>C列 商品编码</td><td>→</td><td>product_code</td></tr>
                                    <tr><td>自动匹配</td><td>→</td><td>product_id</td></tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- 待上传商品列表区域 -->
            <div class="coupon-product-list-section" id="couponProductListSection" style="display:none">
                <div class="section-header">
                    <h3><i data-lucide="package"></i> 待上传商品列表</h3>
                    <div class="section-actions">
                        <span class="match-stats" id="matchStats"></span>
                        <button class="btn btn-secondary btn-outline-blue" id="copyUnmatchedNamesBtn"><i data-lucide="clipboard-list"></i> 批量复制无ID商品名称</button>
                        <button class="btn btn-secondary btn-outline-red" id="clearUnmatchedBtn">🗑️ 清空无ID商品</button>
                        <button class="btn btn-primary" id="uploadBtn-coupon" disabled>上传到数据库</button>
                    </div>
                </div>
                <div class="product-table-container">
                    <table class="product-table" id="couponProductTable">
                        <thead>
                            <tr>
                                <th style="width: 80px;">图片</th>
                                <th style="width: 150px;">商品ID</th>
                                <th>商品名称</th>
                                <th style="width: 150px;">商品编码</th>
                                <th style="width: 80px;">操作</th>
                            </tr>
                        </thead>
                        <tbody id="couponProductTableBody">
                        </tbody>
                    </table>
                </div>
            </div>
            
            <!-- 已上传数据列表区域 -->
            <div class="coupon-product-list-section" id="uploadedDataSection">
                <div class="section-header">
                    <h3><i data-lucide="clipboard-list"></i> 已上传数据 <span class="db-table-tag">coupon_product_data</span></h3>
                    <div class="section-actions">
                        <span class="uploaded-stats" id="uploadedStats">加载中...</span>
                        <button class="btn btn-secondary" id="downloadDataBtn">📥 下载数据</button>
                    </div>
                </div>
                <div class="product-table-container" style="max-height: 400px;">
                    <table class="product-table" id="uploadedDataTable">
                        <thead>
                            <tr>
                                <th style="width: 80px;">图片</th>
                                <th style="width: 150px;">商品ID</th>
                                <th>商品名称</th>
                                <th style="width: 150px;">商品编码</th>
                            </tr>
                        </thead>
                        <tbody id="uploadedDataTableBody">
                        </tbody>
                    </table>
                </div>
                <div class="pagination" id="uploadedDataPagination">
                </div>
            </div>
        </div>
    `;
}

// ========================================
// 初始化
// ========================================
// 分页状态
let uploadedDataPage = 1;
const uploadedDataPageSize = 20;
let uploadedDataTotal = 0;
let uploadedDataCache = [];

function initCouponUpload() {
    const uploadZone = document.getElementById('uploadZone-coupon');
    const fileInput = document.getElementById('fileInput-coupon');
    const statusDiv = document.getElementById('status-coupon');
    const statusText = document.getElementById('statusText-coupon');
    const progressBar = document.getElementById('progress-coupon');
    const statusDetail = document.getElementById('statusDetail-coupon');
    const listSection = document.getElementById('couponProductListSection');
    const uploadBtn = document.getElementById('uploadBtn-coupon');
    const downloadBtn = document.getElementById('downloadDataBtn');

    // 拖拽上传事件
    uploadZone.addEventListener('click', () => fileInput.click());
    uploadZone.addEventListener('dragover', (e) => { e.preventDefault(); uploadZone.classList.add('dragover'); });
    uploadZone.addEventListener('dragleave', () => uploadZone.classList.remove('dragover'));
    uploadZone.addEventListener('drop', async (e) => {
        e.preventDefault();
        uploadZone.classList.remove('dragover');
        if (e.dataTransfer.files.length > 0) await handleFileSelect(e.dataTransfer.files[0]);
    });
    fileInput.addEventListener('change', async (e) => {
        if (e.target.files.length > 0) await handleFileSelect(e.target.files[0]);
    });

    // 上传按钮事件
    uploadBtn.addEventListener('click', handleUpload);

    // 清空无ID商品按钮事件
    const clearUnmatchedBtn = document.getElementById('clearUnmatchedBtn');
    clearUnmatchedBtn.addEventListener('click', () => {
        const unmatchedCount = couponProductList.filter(r => !r.product_id).length;
        if (unmatchedCount === 0) {
            window.AppUtils?.showToast?.('没有无ID商品需要清空', 'info');
            return;
        }
        // 过滤掉无ID的商品
        couponProductList = couponProductList.filter(r => r.product_id);
        renderProductList();
        window.AppUtils?.showToast?.(`已清空 ${unmatchedCount} 条无ID商品`, 'success');
    });

    // 批量复制无ID商品名称按钮事件
    const copyUnmatchedNamesBtn = document.getElementById('copyUnmatchedNamesBtn');
    copyUnmatchedNamesBtn.addEventListener('click', async () => {
        const unmatchedProducts = couponProductList.filter(r => !r.product_id);
        if (unmatchedProducts.length === 0) {
            window.AppUtils?.showToast?.('没有无ID商品可复制', 'info');
            return;
        }
        // 获取所有无ID商品的名称，用逗号分割
        const names = unmatchedProducts.map(r => r.product_name).join(',');
        try {
            await navigator.clipboard.writeText(names);
            window.AppUtils?.showToast?.(`已复制 ${unmatchedProducts.length} 个无ID商品名称到剪贴板`, 'success');
        } catch (err) {
            console.error('复制失败:', err);
            window.AppUtils?.showToast?.('复制失败，请手动复制', 'error');
        }
    });

    // 下载按钮事件
    downloadBtn.addEventListener('click', downloadUploadedData);

    // 加载已上传数据
    loadUploadedData();

    // 处理文件选择
    async function handleFileSelect(file) {
        uploadZone.innerHTML = `<div class="upload-zone-icon"><i data-lucide="check-circle"></i></div><p><strong>${file.name}</strong></p>`;

        try {
            statusDiv.style.display = 'block';
            updateStatus('读取文件...', 10);

            const data = await readExcelFile(file);
            updateStatus('解析数据...', 30);

            const records = processCouponProductData(data);
            if (records.length === 0) {
                throw new Error('无有效数据');
            }
            updateStatus(`已解析 ${records.length} 条，正在匹配商品ID...`, 50);

            // 匹配商品ID
            await matchProductIds(records);
            updateStatus('匹配完成，请检查列表', 100);

            // 保存到模块状态
            couponProductList = records;

            // 显示商品列表
            renderProductList();
            listSection.style.display = 'block';

            statusDetail.innerHTML = `<span class="success"><i data-lucide="check-circle"></i> 已加载 ${records.length} 条商品</span>`;

        } catch (error) {
            console.error('处理文件失败:', error);
            statusText.textContent = '处理失败';
            statusDetail.innerHTML = `<span class="error"><i data-lucide="x-circle"></i> ${error.message}</span>`;
            window.AppUtils?.showToast?.('处理失败: ' + error.message, 'error');
        }
    }

    function updateStatus(text, progress) {
        statusText.textContent = text;
        progressBar.style.width = progress + '%';
    }
}

// ========================================
// 加载已上传数据
// ========================================
async function loadUploadedData() {
    console.log('📥 [发券品数据] 正在加载已上传数据...');
    const statsEl = document.getElementById('uploadedStats');
    const tbody = document.getElementById('uploadedDataTableBody');
    const paginationEl = document.getElementById('uploadedDataPagination');

    try {
        // 获取总数
        const { count, error: countError } = await window.supabaseClient
            .from('coupon_product_data')
            .select('*', { count: 'exact', head: true });

        if (countError) throw countError;

        uploadedDataTotal = count || 0;
        console.log(`📊 [发券品数据] 总记录数: ${uploadedDataTotal}`);

        if (uploadedDataTotal === 0) {
            statsEl.textContent = '暂无数据';
            tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: var(--text-muted); padding: 2rem;">暂无已上传数据</td></tr>';
            paginationEl.innerHTML = '';
            return;
        }

        // 获取当前页数据
        const offset = (uploadedDataPage - 1) * uploadedDataPageSize;
        const { data, error } = await window.supabaseClient
            .from('coupon_product_data')
            .select('*')
            .order('id', { ascending: false })
            .range(offset, offset + uploadedDataPageSize - 1);

        if (error) throw error;

        uploadedDataCache = data || [];

        // 更新统计
        const totalPages = Math.ceil(uploadedDataTotal / uploadedDataPageSize);
        statsEl.textContent = `共 ${uploadedDataTotal} 条 · 第 ${uploadedDataPage}/${totalPages} 页`;

        // 渲染表格
        renderUploadedDataTable();

        // 渲染分页
        renderUploadedDataPagination(totalPages);
        console.log(`<i data-lucide="check-circle"></i> [发券品数据] 加载完成, 当前页 ${uploadedDataCache.length} 条`);

    } catch (error) {
        console.error('<i data-lucide="x-circle"></i> [发券品数据] 加载失败:', error.message);
        statsEl.textContent = '加载失败';
        tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: var(--error-color); padding: 2rem;">加载失败: ${error.message}</td></tr>`;
    }
}

// ========================================
// 渲染已上传数据表格
// ========================================
function renderUploadedDataTable() {
    const tbody = document.getElementById('uploadedDataTableBody');

    tbody.innerHTML = uploadedDataCache.map(item => {
        // 图片处理
        let imageHtml = '<span class="no-image">无图片</span>';
        if (item.image_url) {
            imageHtml = `<img src="${item.image_url}" alt="商品图片" class="product-thumb" referrerpolicy="no-referrer" onerror="this.outerHTML='<span class=\\'no-image\\'>加载失败</span>'" />`;
        }

        return `
            <tr>
                <td class="image-cell">${imageHtml}</td>
                <td class="id-cell"><span class="matched-id">${item.product_id || '-'}</span></td>
                <td class="name-cell" title="${item.product_name}">${truncate(item.product_name, 40)}</td>
                <td class="code-cell">${item.product_code || '-'}</td>
            </tr>
        `;
    }).join('');
}

// ========================================
// 渲染分页
// ========================================
function renderUploadedDataPagination(totalPages) {
    const paginationEl = document.getElementById('uploadedDataPagination');

    if (totalPages <= 1) {
        paginationEl.innerHTML = '';
        return;
    }

    let html = '<div class="pagination-controls">';

    // 上一页
    html += `<button class="pagination-btn" ${uploadedDataPage <= 1 ? 'disabled' : ''} data-page="${uploadedDataPage - 1}">上一页</button>`;

    // 页码
    const maxVisiblePages = 5;
    let startPage = Math.max(1, uploadedDataPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    if (startPage > 1) {
        html += `<button class="pagination-btn" data-page="1">1</button>`;
        if (startPage > 2) html += '<span class="pagination-ellipsis">...</span>';
    }

    for (let i = startPage; i <= endPage; i++) {
        html += `<button class="pagination-btn ${i === uploadedDataPage ? 'active' : ''}" data-page="${i}">${i}</button>`;
    }

    if (endPage < totalPages) {
        if (endPage < totalPages - 1) html += '<span class="pagination-ellipsis">...</span>';
        html += `<button class="pagination-btn" data-page="${totalPages}">${totalPages}</button>`;
    }

    // 下一页
    html += `<button class="pagination-btn" ${uploadedDataPage >= totalPages ? 'disabled' : ''} data-page="${uploadedDataPage + 1}">下一页</button>`;

    html += '</div>';
    paginationEl.innerHTML = html;

    // 绑定分页事件
    paginationEl.querySelectorAll('.pagination-btn:not([disabled])').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const page = parseInt(e.target.dataset.page);
            if (!isNaN(page) && page !== uploadedDataPage) {
                uploadedDataPage = page;
                loadUploadedData();
            }
        });
    });
}

// ========================================
// 下载已上传数据
// ========================================
async function downloadUploadedData() {
    const downloadBtn = document.getElementById('downloadDataBtn');

    try {
        downloadBtn.disabled = true;
        downloadBtn.textContent = '⏳ 下载中...';

        // 获取所有数据（只需要 product_id）
        const { data, error } = await window.supabaseClient
            .from('coupon_product_data')
            .select('product_id')
            .order('id', { ascending: false });

        if (error) throw error;

        if (!data || data.length === 0) {
            window.AppUtils?.showToast?.('没有数据可下载', 'warning');
            return;
        }

        // 构建导出数据
        const exportData = [['商品ID']];  // 标题行
        data.forEach(item => {
            exportData.push([item.product_id || '']);
        });

        // 创建工作簿
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_array ? XLSX.utils.aoa_to_sheet(exportData) : XLSX.utils.aoa_to_sheet(exportData);
        XLSX.utils.book_append_sheet(wb, ws, '发券品ID');

        // 下载文件
        const fileName = `发券品ID_${new Date().toISOString().slice(0, 10)}.xlsx`;
        XLSX.writeFile(wb, fileName);

        window.AppUtils?.showToast?.(`已下载 ${data.length} 条数据`, 'success');

    } catch (error) {
        console.error('下载失败:', error);
        window.AppUtils?.showToast?.('下载失败: ' + error.message, 'error');
    } finally {
        downloadBtn.disabled = false;
        downloadBtn.textContent = '📥 下载数据';
    }
}

// ========================================
// 渲染商品列表
// ========================================
function renderProductList() {
    const tbody = document.getElementById('couponProductTableBody');
    const statsEl = document.getElementById('matchStats');
    const uploadBtn = document.getElementById('uploadBtn-coupon');

    if (!tbody) return;

    const matchedCount = couponProductList.filter(r => r.product_id).length;
    const totalCount = couponProductList.length;
    const unmatchedCount = totalCount - matchedCount;

    // 更新统计
    statsEl.innerHTML = `
        <span style="color: var(--success-color);"><i data-lucide="check-circle"></i> 已匹配: ${matchedCount}</span>
        ${unmatchedCount > 0 ? `<span style="color: var(--error-color); margin-left: 1rem;"><i data-lucide="x-circle"></i> 未匹配: ${unmatchedCount}</span>` : ''}
    `;

    // 更新上传按钮状态
    uploadBtn.disabled = unmatchedCount > 0;
    if (unmatchedCount > 0) {
        uploadBtn.title = '请先填写所有未匹配商品的ID';
    } else {
        uploadBtn.title = '';
    }

    // 渲染表格
    tbody.innerHTML = couponProductList.map((item, index) => {
        const isUnmatched = !item.product_id;
        const rowClass = isUnmatched ? 'unmatched-row' : '';

        // 图片处理
        let imageHtml = '<span class="no-image">无图片</span>';
        if (item.image_url) {
            imageHtml = `<img src="${item.image_url}" alt="商品图片" class="product-thumb" referrerpolicy="no-referrer" onerror="this.outerHTML='<span class=\\'no-image\\'>加载失败</span>'" />`;
        }

        // 商品ID处理
        let idHtml = '';
        if (isUnmatched) {
            idHtml = `<input type="text" class="id-input" data-index="${index}" placeholder="请输入商品ID" value="${item.product_id || ''}">`;
        } else {
            idHtml = `<span class="matched-id">${item.product_id}</span>`;
        }

        return `
            <tr class="${rowClass}" data-index="${index}">
                <td class="image-cell">${imageHtml}</td>
                <td class="id-cell">${idHtml}</td>
                <td class="name-cell" title="${item.product_name}">${truncate(item.product_name, 40)}</td>
                <td class="code-cell">${item.product_code || '-'}</td>
                <td class="action-cell">
                    ${isUnmatched ? `<button class="btn-delete" data-index="${index}" title="删除此商品">🗑️</button>` : ''}
                </td>
            </tr>
        `;
    }).join('');

    // 绑定事件
    bindProductListEvents();
}

// ========================================
// 绑定商品列表事件
// ========================================
function bindProductListEvents() {
    const tbody = document.getElementById('couponProductTableBody');
    if (!tbody) return;

    // ID输入事件
    tbody.querySelectorAll('.id-input').forEach(input => {
        input.addEventListener('input', (e) => {
            const index = parseInt(e.target.dataset.index);
            if (!isNaN(index) && couponProductList[index]) {
                couponProductList[index].product_id = e.target.value.trim();
                updateUploadButtonState();
            }
        });

        input.addEventListener('blur', (e) => {
            const index = parseInt(e.target.dataset.index);
            if (!isNaN(index) && couponProductList[index]) {
                const row = e.target.closest('tr');
                if (couponProductList[index].product_id) {
                    row.classList.remove('unmatched-row');
                } else {
                    row.classList.add('unmatched-row');
                }
            }
        });
    });

    // 删除按钮事件
    tbody.querySelectorAll('.btn-delete').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const index = parseInt(e.target.dataset.index);
            if (!isNaN(index)) {
                couponProductList.splice(index, 1);
                renderProductList();
                window.AppUtils?.showToast?.('已删除商品', 'info');
            }
        });
    });
}

// ========================================
// 更新上传按钮状态
// ========================================
function updateUploadButtonState() {
    const uploadBtn = document.getElementById('uploadBtn-coupon');
    const statsEl = document.getElementById('matchStats');

    const matchedCount = couponProductList.filter(r => r.product_id).length;
    const totalCount = couponProductList.length;
    const unmatchedCount = totalCount - matchedCount;

    // 更新统计
    statsEl.innerHTML = `
        <span style="color: var(--success-color);"><i data-lucide="check-circle"></i> 已匹配: ${matchedCount}</span>
        ${unmatchedCount > 0 ? `<span style="color: var(--error-color); margin-left: 1rem;"><i data-lucide="x-circle"></i> 未匹配: ${unmatchedCount}</span>` : ''}
    `;

    // 更新按钮状态
    uploadBtn.disabled = unmatchedCount > 0 || totalCount === 0;
}

// ========================================
// 处理上传
// ========================================
async function handleUpload() {
    console.log('<i data-lucide="upload"></i> [发券品上传] 开始上传到 coupon_product_data...');
    const uploadBtn = document.getElementById('uploadBtn-coupon');
    const statusDiv = document.getElementById('status-coupon');
    const statusText = document.getElementById('statusText-coupon');
    const progressBar = document.getElementById('progress-coupon');
    const statusDetail = document.getElementById('statusDetail-coupon');

    // 检查是否所有商品都有ID
    const unmatchedCount = couponProductList.filter(r => !r.product_id).length;
    if (unmatchedCount > 0) {
        window.AppUtils?.showToast?.(`还有 ${unmatchedCount} 个商品缺少ID，无法上传`, 'error');
        return;
    }

    if (couponProductList.length === 0) {
        window.AppUtils?.showToast?.('没有商品可上传', 'error');
        return;
    }

    const modeInput = document.querySelector('input[name="mode-coupon"]:checked');
    const isFullMode = modeInput?.value === 'full';
    console.log(`📝 [发券品上传] 模式: ${isFullMode ? '全量替换' : '补充上传'}, 商品数: ${couponProductList.length}`);

    try {
        uploadBtn.disabled = true;
        statusDiv.style.display = 'block';

        statusText.textContent = '准备上传...';
        progressBar.style.width = '10%';

        // 准备上传数据（移除 matched 字段）
        const uploadData = couponProductList.map(item => ({
            image_url: item.image_url || null,
            product_name: item.product_name,
            product_code: item.product_code || null,
            product_id: item.product_id
        }));

        // 如果是全量更新，先清空表
        if (isFullMode) {
            statusText.textContent = '清空旧数据...';
            progressBar.style.width = '30%';
            console.log('🧹 [发券品上传] 清空现有数据...');

            const { error: deleteError } = await window.supabaseClient
                .from('coupon_product_data')
                .delete()
                .gte('id', 0);

            if (deleteError) {
                throw new Error('清空表失败: ' + deleteError.message);
            }
        }

        // 批量上传
        statusText.textContent = '上传数据...';
        progressBar.style.width = '60%';

        const batchSize = 100;
        for (let i = 0; i < uploadData.length; i += batchSize) {
            const batch = uploadData.slice(i, i + batchSize);
            console.log(`<i data-lucide="upload"></i> [发券品上传] 插入批次 ${Math.floor(i / batchSize) + 1}/${Math.ceil(uploadData.length / batchSize)}`);
            const { error } = await window.supabaseClient
                .from('coupon_product_data')
                .insert(batch);

            if (error) {
                throw new Error('上传失败: ' + error.message);
            }

            const progress = 60 + Math.round((i / uploadData.length) * 40);
            progressBar.style.width = progress + '%';
        }

        statusText.textContent = '上传完成！';
        progressBar.style.width = '100%';
        statusDetail.innerHTML = `<span class="success"><i data-lucide="check-circle"></i> 成功上传 ${uploadData.length} 条商品</span>`;

        console.log(`<i data-lucide="check-circle"></i> [发券品上传] 完成, 共 ${uploadData.length} 条`);
        window.AppUtils?.showToast?.(`成功上传 ${uploadData.length} 条发券品数据`, 'success');

        // 清空列表
        couponProductList = [];
        document.getElementById('couponProductListSection').style.display = 'none';

        // 刷新已上传数据列表
        uploadedDataPage = 1;
        loadUploadedData();

    } catch (error) {
        console.error('<i data-lucide="x-circle"></i> [发券品上传] 失败:', error.message);
        statusText.textContent = '上传失败';
        statusDetail.innerHTML = `<span class="error"><i data-lucide="x-circle"></i> ${error.message}</span>`;
        window.AppUtils?.showToast?.('上传失败: ' + error.message, 'error');
    } finally {
        uploadBtn.disabled = false;
    }
}

// ========================================
// 工具函数
// ========================================
function truncate(str, len) {
    if (!str) return '';
    return str.length > len ? str.substring(0, len) + '...' : str;
}

// 文件读取（复用）
async function readExcelFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const sheet = workbook.Sheets[workbook.SheetNames[0]];
                resolve(XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' }));
            } catch (err) {
                reject(new Error('解析失败: ' + err.message));
            }
        };
        reader.onerror = () => reject(new Error('读取失败'));
        reader.readAsArrayBuffer(file);
    });
}

// ========================================
// 设置页面生成（预留）
// ========================================
function generateCouponSettingsPage() {
    return `
        <div class="settings-page">
            <div class="placeholder-content">
                <div class="placeholder-icon">⚙️</div>
                <h3>发券品处理设置</h3>
                <p>此功能正在开发中...</p>
            </div>
        </div>
    `;
}

function initCouponSettings() {
    // 预留
}

// ========================================
// 导出加载函数
// ========================================
window.loadCouponPage = function (pageId) {
    if (pageId === 'coupon') {
        return {
            html: generateCouponPage(),
            init: initCouponUpload
        };
    }
    if (pageId === 'coupon-settings') {
        return {
            html: generateCouponSettingsPage(),
            init: initCouponSettings
        };
    }
    return null;
};
