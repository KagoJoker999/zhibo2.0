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
    return records;
}

// ========================================
// 商品ID匹配
// 从 product_id_data 表查询，通过商品名称匹配
// ========================================
async function matchProductIds(records) {
    if (!records || records.length === 0) return records;

    try {
        // 获取所有商品名称
        const productNames = records.map(r => r.product_name);

        // 查询 product_id_data 表
        const { data, error } = await window.supabaseClient
            .from('product_id_data')
            .select('product_name, product_id')
            .in('product_name', productNames);

        if (error) {
            console.error('查询商品ID失败:', error);
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

        console.log(`✅ 商品ID匹配完成: ${records.filter(r => r.matched).length}/${records.length} 匹配成功`);
        return records;
    } catch (err) {
        console.error('匹配商品ID异常:', err);
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
                        <h3>🎟️ 发券品数据上传 <span class="db-table-tag">→ coupon_product_data</span></h3>
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
                            <strong>📋 处理规则</strong>
                            <ul>
                                <li>从 product_id_data 表自动匹配商品ID</li>
                                <li>未匹配商品以红色高亮显示</li>
                                <li>可手动填写缺失的商品ID</li>
                                <li>所有商品必须有ID才能上传</li>
                            </ul>
                        </div>
                        <div class="info-section">
                            <strong>🔗 字段映射</strong>
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
            
            <!-- 商品列表区域 -->
            <div class="coupon-product-list-section" id="couponProductListSection" style="display:none">
                <div class="section-header">
                    <h3>📦 商品列表</h3>
                    <div class="section-actions">
                        <span class="match-stats" id="matchStats"></span>
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
        </div>
    `;
}

// ========================================
// 初始化
// ========================================
function initCouponUpload() {
    const uploadZone = document.getElementById('uploadZone-coupon');
    const fileInput = document.getElementById('fileInput-coupon');
    const statusDiv = document.getElementById('status-coupon');
    const statusText = document.getElementById('statusText-coupon');
    const progressBar = document.getElementById('progress-coupon');
    const statusDetail = document.getElementById('statusDetail-coupon');
    const listSection = document.getElementById('couponProductListSection');
    const uploadBtn = document.getElementById('uploadBtn-coupon');

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

    // 处理文件选择
    async function handleFileSelect(file) {
        uploadZone.innerHTML = `<div class="upload-zone-icon">✅</div><p><strong>${file.name}</strong></p>`;

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

            statusDetail.innerHTML = `<span class="success">✅ 已加载 ${records.length} 条商品</span>`;

        } catch (error) {
            console.error('处理文件失败:', error);
            statusText.textContent = '处理失败';
            statusDetail.innerHTML = `<span class="error">❌ ${error.message}</span>`;
            window.AppUtils?.showToast?.('处理失败: ' + error.message, 'error');
        }
    }

    function updateStatus(text, progress) {
        statusText.textContent = text;
        progressBar.style.width = progress + '%';
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
        <span style="color: var(--success-color);">✅ 已匹配: ${matchedCount}</span>
        ${unmatchedCount > 0 ? `<span style="color: var(--error-color); margin-left: 1rem;">❌ 未匹配: ${unmatchedCount}</span>` : ''}
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
        <span style="color: var(--success-color);">✅ 已匹配: ${matchedCount}</span>
        ${unmatchedCount > 0 ? `<span style="color: var(--error-color); margin-left: 1rem;">❌ 未匹配: ${unmatchedCount}</span>` : ''}
    `;

    // 更新按钮状态
    uploadBtn.disabled = unmatchedCount > 0 || totalCount === 0;
}

// ========================================
// 处理上传
// ========================================
async function handleUpload() {
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
        statusDetail.innerHTML = `<span class="success">✅ 成功上传 ${uploadData.length} 条商品</span>`;

        window.AppUtils?.showToast?.(`成功上传 ${uploadData.length} 条发券品数据`, 'success');

        // 清空列表
        couponProductList = [];
        document.getElementById('couponProductListSection').style.display = 'none';

    } catch (error) {
        console.error('上传失败:', error);
        statusText.textContent = '上传失败';
        statusDetail.innerHTML = `<span class="error">❌ ${error.message}</span>`;
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
