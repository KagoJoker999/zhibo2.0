/**
 * 新品处理模块
 * ========================================
 * 功能：上传商品数据、生成商品名称、分类映射
 */

// ========================================
// 数据处理器
// 列映射: A=图片, B=名称, C=编码, D=虚拟分类, E=分类, F=标签, G=售价, H=仓位, O=规格
// ========================================
function processNewProductData(rows) {
    const records = [];

    for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (!row || row.length === 0) continue;

        // B列(索引1): 商品名称
        const originalName = String(row[1] ?? '').trim();
        if (!originalName || originalName === 'nan') continue;

        records.push({
            original_name: originalName,
            product_name: originalName,
            image_url: String(row[0] ?? '').trim() || null,          // A列
            product_code: String(row[2] ?? '').trim() || null,       // C列
            virtual_category: String(row[3] ?? '').trim() || null,   // D列
            category: String(row[4] ?? '').trim() || null,           // E列
            product_tag: String(row[5] ?? '').trim() || null,        // F列
            base_price: parseFloat(row[6]) || 0,                      // G列
            warehouse: String(row[7] ?? '').trim() || null,          // H列
            color_spec: row.length > 14 ? String(row[14] ?? '').trim() || null : null
        });
    }
    return records;
}

// ========================================
// 名称生成器
// 公式：「初始名称」+ 产地词 + 热卖词 + 分类词汇
// 示例：「明星系列-许妍马尾」韩国25秋冬百搭香蕉夹
// ========================================
async function generateProductNames(records) {
    const settings = await loadNameFormulaSettings();
    const categoryWords = await loadCategoryWords();

    return records.map(record => {
        // 「初始名称」+ 产地词 + 热卖词 + 分类词汇
        let newName = `「${record.original_name}」`;

        // 产地词
        if (settings.origin_word) {
            newName += settings.origin_word;
        }

        // 热卖词
        if (settings.hot_word) {
            newName += settings.hot_word;
        }

        // 分类词汇
        if (record.category && categoryWords[record.category]) {
            newName += categoryWords[record.category];
        }

        return {
            ...record,
            product_name: newName
        };
    });
}

// ========================================
// 上架分类生成
// ========================================
async function generateListingCategories(records) {
    const mapping = await loadListingCategoryMapping();

    return records.map(record => {
        const listingCategory = record.category ? mapping[record.category] || null : null;
        return {
            ...record,
            listing_category: listingCategory
        };
    });
}

// ========================================
// 设置读取函数
// ========================================
async function loadNameFormulaSettings() {
    try {
        const { data, error } = await window.supabaseClient
            .from('name_formula_settings')
            .select('*')
            .limit(1)
            .single();

        if (error || !data) {
            return { origin_word: '韩国', hot_word: '' };
        }
        return data;
    } catch (e) {
        return { origin_word: '韩国', hot_word: '' };
    }
}

async function loadCategoryWords() {
    try {
        const { data, error } = await window.supabaseClient
            .from('category_words')
            .select('*');

        if (error || !data) return {};

        const mapping = {};
        data.forEach(item => {
            mapping[item.category] = item.category_word;
        });
        return mapping;
    } catch (e) {
        return {};
    }
}

async function loadListingCategoryMapping() {
    try {
        const { data, error } = await window.supabaseClient
            .from('listing_category_mapping')
            .select('*');

        if (error || !data) return {};

        const mapping = {};
        data.forEach(item => {
            mapping[item.source_category] = item.listing_category;
        });
        return mapping;
    } catch (e) {
        return {};
    }
}

// ========================================
// 设置保存函数
// ========================================
async function saveNameFormulaSettings(originWord, hotWord) {
    try {
        // 1. 查询现有记录
        const { data: existing, error: fetchError } = await window.supabaseClient
            .from('name_formula_settings')
            .select('id')
            .order('id', { ascending: true });

        if (fetchError) throw fetchError;

        if (existing && existing.length > 0) {
            // 2. 如果存在，更新第一条记录
            const targetId = existing[0].id;
            const { error: updateError } = await window.supabaseClient
                .from('name_formula_settings')
                .update({
                    origin_word: originWord,
                    hot_word: hotWord,
                    updated_at: new Date().toISOString()
                })
                .eq('id', targetId);

            if (updateError) throw updateError;

            // 3. 清理多余的重复记录（如果有）
            if (existing.length > 1) {
                const idsToDelete = existing.slice(1).map(r => r.id);
                try {
                    await window.supabaseClient
                        .from('name_formula_settings')
                        .delete()
                        .in('id', idsToDelete);
                    console.log('已清理重复设置记录:', idsToDelete);
                } catch (e) {
                    console.warn('清理重复记录失败 (非致命错误):', e);
                }
            }
        } else {
            // 4. 如果不存在，插入新记录
            const { error: insertError } = await window.supabaseClient
                .from('name_formula_settings')
                .insert({
                    origin_word: originWord,
                    hot_word: hotWord
                });

            if (insertError) throw insertError;
        }
    } catch (error) {
        console.error('保存设置失败:', error);
        throw new Error('保存失败: ' + error.message);
    }
}

async function saveCategoryWords(items) {
    // 清空并重新写入
    await window.supabaseClient.from('category_words').delete().gte('id', 0);

    if (items.length > 0) {
        const { error } = await window.supabaseClient
            .from('category_words')
            .insert(items);
        if (error) throw new Error('保存失败: ' + error.message);
    }
}

async function saveListingCategoryMapping(items) {
    await window.supabaseClient.from('listing_category_mapping').delete().gte('id', 0);

    if (items.length > 0) {
        const { error } = await window.supabaseClient
            .from('listing_category_mapping')
            .insert(items);
        if (error) throw new Error('保存失败: ' + error.message);
    }
}
// ========================================
// 页面生成
// ========================================
function generateNewProductPage() {
    return `
        <div class="new-product-page">
            <div class="upload-blocks-grid">
                <!-- 上传区块 -->
                <div class="upload-block" id="block-new-product">
                    <div class="upload-block-header">
                        <h3>📦 新品数据上传</h3>
                    </div>
                    
                    <div class="upload-zone" id="uploadZone-new-product">
                        <div class="upload-zone-icon">📁</div>
                        <p>拖拽文件到此处，或点击选择</p>
                        <p class="upload-hint">.xlsx, .xls, .csv</p>
                        <input type="file" id="fileInput-new-product" accept=".xlsx,.xls,.csv" style="display:none">
                    </div>
                    
                    <div class="upload-options">
                        <label class="radio-label">
                            <input type="radio" name="mode-new-product" value="full" checked>
                            <span>更新全部</span>
                        </label>
                        <label class="radio-label">
                            <input type="radio" name="mode-new-product" value="incremental">
                            <span>补充上传</span>
                        </label>
                    </div>
                    
                    <details class="mapping-details">
                        <summary>🔗 字段映射</summary>
                        <table class="mapping-table">
                            <thead><tr><th>源字段</th><th></th><th>目标字段</th></tr></thead>
                            <tbody>
                                <tr><td>A列 图片</td><td>→</td><td>image_url</td></tr>
                                <tr><td>B列 商品名称</td><td>→</td><td>original_name</td></tr>
                                <tr><td>C列 商品编码</td><td>→</td><td>product_code</td></tr>
                                <tr><td>D列 虚拟分类</td><td>→</td><td>virtual_category</td></tr>
                                <tr><td>E列 分类</td><td>→</td><td>category</td></tr>
                                <tr><td>F列 商品标签</td><td>→</td><td>product_tag</td></tr>
                                <tr><td>G列 基本售价</td><td>→</td><td>base_price</td></tr>
                                <tr><td>H列 主仓位</td><td>→</td><td>warehouse</td></tr>
                                <tr><td>O列 颜色规格</td><td>→</td><td>color_spec</td></tr>
                            </tbody>
                        </table>
                    </details>
                    
                    <div class="upload-status" id="status-new-product" style="display:none">
                        <div class="status-text" id="statusText-new-product">准备中...</div>
                        <div class="progress-bar"><div class="progress-fill" id="progress-new-product"></div></div>
                        <div class="status-detail" id="statusDetail-new-product"></div>
                    </div>
                    
                    <div class="upload-actions">
                        <button class="btn btn-primary btn-upload" id="uploadBtn-new-product" disabled>
                            上传并处理
                        </button>
                    </div>
                </div>
                
                <!-- 处理结果区块 -->
                <div class="upload-block" id="block-result">
                    <div class="upload-block-header">
                        <h3>📊 处理结果</h3>
                    </div>
                    <div id="result-content" class="result-content">
                        <p class="text-muted">上传数据后显示处理结果</p>
                    </div>
                    

                </div>
            </div>
            
            <!-- 数据库数据表格 -->
            <div class="data-table-section">
                <div class="data-table-header">
                    <h3>📋 数据库新品列表 <span id="lastRefreshTime" class="refresh-time"></span></h3>
                    <div class="header-buttons">
                        <button class="btn btn-primary btn-sm" id="downloadRenameBtn" style="display:none">📥 重命名表格下载</button>
                        <button class="btn btn-primary btn-sm" id="downloadListingBtn" style="display:none">📥 上链接表格下载</button>
                        <button class="btn btn-primary btn-sm" id="refreshDataBtn">🔄 刷新</button>
                    </div>
                </div>
                <div id="dataTableContainer" class="data-table-container">
                    <p class="text-muted">点击刷新加载数据</p>
                </div>
            </div>
        </div>
    `;
}

// ========================================
// 设置页面生成
// ========================================
function generateNewProductSettingsPage() {
    return `
        <div class="settings-page">
            <div class="settings-section">
                <div class="settings-header">
                    <h3>📝 商品名称公式设置</h3>
                    <button class="btn btn-secondary btn-sm" id="editNameSettings">✏️ 修改</button>
                </div>
                <p class="settings-hint">公式：初始名称 + 分类词汇 + 产地词 + 热卖词</p>
                
                <div class="settings-group">
                    <label>产地词</label>
                    <input type="text" id="originWord" placeholder="如：韩国" class="settings-input" readonly>
                </div>
                
                <div class="settings-group">
                    <label>热卖词</label>
                    <input type="text" id="hotWord" placeholder="如：热卖" class="settings-input" readonly>
                </div>
                
                <h4>分类词汇映射</h4>
                <div id="categoryWordsDisplay" class="mapping-display"></div>
                <textarea id="categoryWordsTextarea" class="mapping-textarea" style="display:none" placeholder="每行一条，用逗号分隔&#10;分类,词汇&#10;&#10;例如:&#10;护肤,水乳精华&#10;彩妆,口红眼影"></textarea>
                
                <div class="settings-actions" id="nameSettingsActions" style="display:none">
                    <button class="btn btn-primary" id="saveNameSettings">💾 保存</button>
                    <button class="btn btn-secondary" id="cancelNameSettings">取消</button>
                </div>
            </div>
            
            <div class="settings-section">
                <div class="settings-header">
                    <h3>📋 上下架分类对照</h3>
                    <button class="btn btn-secondary btn-sm" id="editListingSettings">✏️ 修改</button>
                </div>
                <div id="listingCategoryDisplay" class="mapping-display"></div>
                <textarea id="listingCategoryTextarea" class="mapping-textarea" style="display:none" placeholder="每行一条，用逗号分隔&#10;原分类,上架分类&#10;&#10;例如:&#10;护肤品,护肤商品&#10;彩妆品,彩妆商品"></textarea>
                
                <div class="settings-actions" id="listingSettingsActions" style="display:none">
                    <button class="btn btn-primary" id="saveListingSettings">💾 保存</button>
                    <button class="btn btn-secondary" id="cancelListingSettings">取消</button>
                </div>
            </div>
        </div>
    `;
}

// ========================================
// 初始化上传页面
// ========================================
function initNewProductUpload() {
    const uploadZone = document.getElementById('uploadZone-new-product');
    const fileInput = document.getElementById('fileInput-new-product');
    const uploadBtn = document.getElementById('uploadBtn-new-product');
    const statusDiv = document.getElementById('status-new-product');
    const statusText = document.getElementById('statusText-new-product');
    const progressBar = document.getElementById('progress-new-product');
    const statusDetail = document.getElementById('statusDetail-new-product');
    const resultContent = document.getElementById('result-content');

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
        const isFullMode = document.querySelector('input[name="mode-new-product"]:checked').value === 'full';

        try {
            statusDiv.style.display = 'block';
            uploadBtn.disabled = true;

            updateStatus('读取文件...', 10);
            const data = await readExcelFile(selectedFile);

            updateStatus('解析数据...', 20);
            let records = processNewProductData(data);
            updateStatus(`解析 ${records.length} 条数据`, 30);

            if (records.length === 0) throw new Error('无有效数据');

            updateStatus('生成商品名称...', 40);
            records = await generateProductNames(records);

            updateStatus('生成上架分类...', 50);
            records = await generateListingCategories(records);

            if (isFullMode) {
                updateStatus('清空旧数据...', 60);
                await window.supabaseClient.from('new_product_data').delete().gte('id', 0);
            }

            updateStatus('上传数据...', 70);
            // 分批上传
            const batchSize = 100;
            for (let i = 0; i < records.length; i += batchSize) {
                const batch = records.slice(i, i + batchSize);
                const { error } = await window.supabaseClient.from('new_product_data').insert(batch);
                if (error) throw new Error('上传失败: ' + error.message);
            }

            updateStatus('完成！', 100);
            statusDetail.innerHTML = `<span class="success">✅ 成功处理 ${records.length} 条商品</span>`;

            // 显示结果摘要
            resultContent.innerHTML = `
                <div class="result-summary">
                    <p>✅ 处理完成</p>
                    <p>商品数量：${records.length}</p>
                    <p>已应用名称公式</p>
                    <p>已生成上架分类</p>
                </div>
            `;

            // 显示下载按钮
            // 显示下载按钮
            document.getElementById('downloadRenameBtn').style.display = 'inline-block';
            document.getElementById('downloadListingBtn').style.display = 'inline-block';

            window.AppUtils?.showToast?.(`成功处理 ${records.length} 条商品`, 'success');

            // 自动刷新表格
            loadDataTable();

        } catch (error) {
            console.error('处理失败:', error);
            statusText.textContent = '处理失败';
            statusDetail.innerHTML = `<span class="error">❌ ${error.message}</span>`;
            window.AppUtils?.showToast?.('处理失败: ' + error.message, 'error');
        } finally {
            uploadBtn.disabled = false;
        }
    });

    function updateStatus(text, progress) {
        statusText.textContent = text;
        progressBar.style.width = progress + '%';
    }

    // 刷新按钮
    const refreshBtn = document.getElementById('refreshDataBtn');
    refreshBtn.addEventListener('click', loadDataTable);

    // 下载按钮
    const downloadRenameBtn = document.getElementById('downloadRenameBtn');
    const downloadListingBtn = document.getElementById('downloadListingBtn');

    downloadRenameBtn.addEventListener('click', () => downloadExcel('rename'));
    downloadListingBtn.addEventListener('click', () => downloadExcel('listing'));

    // 加载数据表格
    async function loadDataTable() {
        const container = document.getElementById('dataTableContainer');
        const timeSpan = document.getElementById('lastRefreshTime');
        container.innerHTML = '<p class="text-muted">加载中...</p>';

        try {
            const { data, error } = await window.supabaseClient
                .from('new_product_data')
                .select('*')
                .order('id', { ascending: false })
                .limit(100);

            if (error) throw error;

            // 更新刷新时间
            const now = new Date();
            timeSpan.textContent = `(${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')} 刷新)`;

            if (!data || data.length === 0) {
                container.innerHTML = '<p class="text-muted">暂无数据</p>';
                return;
            }

            container.innerHTML = `
                <div class="table-scroll">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>图片</th>
                                <th>原名称</th>
                                <th>生成名称</th>
                                <th>分类</th>
                                <th>上架分类</th>
                                <th>编码</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${data.map(row => `
                                <tr>
                                    <td>
                                        <div class="thumb-wrapper">
                                            ${row.image_url ?
                    `<img src="${row.image_url}" class="product-thumb" loading="lazy" referrerpolicy="no-referrer" alt="商品图片">` :
                    `<span class="no-thumb">无图</span>`
                }
                                        </div>
                                    </td>
                                    <td title="${row.original_name || ''}">${truncate(row.original_name, 20)}</td>
                                    <td title="${row.product_name || ''}">${truncate(row.product_name, 30)}</td>
                                    <td>${row.category || '-'}</td>
                                    <td>${row.listing_category || '-'}</td>
                                    <td>${row.product_code || '-'}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
                <p class="table-info">显示最近 ${data.length} 条记录</p>
            `;

            // 有数据时显示下载按钮
            // 有数据时显示下载按钮
            document.getElementById('downloadRenameBtn').style.display = 'inline-block';
            document.getElementById('downloadListingBtn').style.display = 'inline-block';
        } catch (error) {
            container.innerHTML = `<p class="error">加载失败: ${error.message}</p>`;
        }
    }

    function truncate(str, len) {
        if (!str) return '-';
        return str.length > len ? str.substring(0, len) + '...' : str;
    }

    // 下载 Excel
    async function downloadExcel(type) {
        try {
            const { data, error } = await window.supabaseClient
                .from('new_product_data')
                .select('*');

            if (error) throw error;
            if (!data || data.length === 0) {
                window.AppUtils?.showToast?.('暂无数据可下载', 'warning');
                return;
            }

            let rows, filename;
            if (type === 'rename') {
                // 重命名表格：商品编码, 商品名称(新名), 商品简称(原名)
                rows = [['商品编码', '商品名称', '商品简称']];
                data.forEach(item => {
                    rows.push([
                        item.product_code || '',
                        item.product_name || '',
                        item.original_name || ''
                    ]);
                });
                // 文件名带时间戳
                const now = new Date();
                const ts = `${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}_${now.getHours().toString().padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}${now.getSeconds().toString().padStart(2, '0')}`;
                filename = `重命名表格_${ts}.xlsx`;
            } else {
                // 上链接表格：多SKU合并处理
                // 1. 按商品编码排序
                data.sort((a, b) => (a.product_code || '').localeCompare(b.product_code || ''));

                // 2. 按商品名称分组
                const groups = new Map();
                data.forEach(item => {
                    const name = item.product_name || '';
                    if (!groups.has(name)) {
                        groups.set(name, []);
                    }
                    groups.get(name).push(item);
                });

                // 3. 确定最大SKU数量
                let maxSkuCount = 1;
                groups.forEach(items => {
                    if (items.length > maxSkuCount) maxSkuCount = items.length;
                });

                // 4. 构建表头
                const headers = ['商品名称', '商品编码', '上架分类', '虚拟分类', '基本售价', '颜色及规格', 'SKU数量'];
                for (let i = 2; i <= maxSkuCount; i++) {
                    headers.push(`商品编码${i}`, `颜色及规格${i}`);
                }
                rows = [headers];

                // 5. 构建数据行
                groups.forEach((items, name) => {
                    const first = items[0];
                    const row = [
                        name,
                        first.product_code || '',
                        first.listing_category || '',
                        first.virtual_category || '',
                        first.base_price || 0,
                        first.color_spec || '',
                        items.length
                    ];

                    // 添加额外SKU
                    for (let i = 1; i < maxSkuCount; i++) {
                        if (i < items.length) {
                            row.push(items[i].product_code || '', items[i].color_spec || '');
                        } else {
                            row.push('', '');
                        }
                    }
                    rows.push(row);
                });

                const now2 = new Date();
                const ts2 = `${now2.getFullYear()}${(now2.getMonth() + 1).toString().padStart(2, '0')}${now2.getDate().toString().padStart(2, '0')}_${now2.getHours().toString().padStart(2, '0')}${now2.getMinutes().toString().padStart(2, '0')}${now2.getSeconds().toString().padStart(2, '0')}`;
                filename = `上链接表_${ts2}.xlsx`;
            }

            const ws = XLSX.utils.aoa_to_sheet(rows);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
            XLSX.writeFile(wb, filename);

            window.AppUtils?.showToast?.('下载成功', 'success');
        } catch (error) {
            window.AppUtils?.showToast?.('下载失败: ' + error.message, 'error');
        }
    }

    // 初始加载
    loadDataTable();
}

// ========================================
// 初始化设置页面
// ========================================
async function initNewProductSettings() {
    const originWordInput = document.getElementById('originWord');
    const hotWordInput = document.getElementById('hotWord');
    const categoryDisplay = document.getElementById('categoryWordsDisplay');
    const categoryTextarea = document.getElementById('categoryWordsTextarea');
    const listingDisplay = document.getElementById('listingCategoryDisplay');
    const listingTextarea = document.getElementById('listingCategoryTextarea');

    // 名称设置区域
    const editNameBtn = document.getElementById('editNameSettings');
    const nameActionsDiv = document.getElementById('nameSettingsActions');
    const saveNameBtn = document.getElementById('saveNameSettings');
    const cancelNameBtn = document.getElementById('cancelNameSettings');

    // 分类对照区域
    const editListingBtn = document.getElementById('editListingSettings');
    const listingActionsDiv = document.getElementById('listingSettingsActions');
    const saveListingBtn = document.getElementById('saveListingSettings');
    const cancelListingBtn = document.getElementById('cancelListingSettings');

    // 存储原始数据
    let originalNameSettings = {};
    let originalCategoryText = '';
    let originalListingText = '';

    // 加载数据
    await loadAllData();

    async function loadAllData() {
        // 加载名称公式设置
        const settings = await loadNameFormulaSettings();
        originalNameSettings = { ...settings };
        originWordInput.value = settings.origin_word || '';
        hotWordInput.value = settings.hot_word || '';

        // 加载分类词汇 -> 转为文本（逗号分隔）
        const categoryWords = await loadCategoryWords();
        originalCategoryText = Object.entries(categoryWords)
            .map(([k, v]) => `${k},${v}`)
            .join('\n');
        renderCategoryDisplay(originalCategoryText);

        // 加载分类对照 -> 转为文本（逗号分隔）
        const { data: listingData } = await window.supabaseClient.from('listing_category_mapping').select('*');
        originalListingText = (listingData || [])
            .map(item => `${item.source_category},${item.listing_category}`)
            .join('\n');
        renderListingDisplay(originalListingText);
    }

    function renderCategoryDisplay(text) {
        if (!text.trim()) {
            categoryDisplay.innerHTML = '<p class="text-muted">暂无数据，点击修改添加</p>';
        } else {
            categoryDisplay.innerHTML = text.split('\n').filter(l => l.trim()).map(line => {
                const [k, v] = parseLine(line);
                return k ? `<div class="mapping-line"><span class="key">${k}</span><span class="arrow">→</span><span class="value">${v || ''}</span></div>` : '';
            }).join('');
        }
    }

    function renderListingDisplay(text) {
        if (!text.trim()) {
            listingDisplay.innerHTML = '<p class="text-muted">暂无数据，点击修改添加</p>';
        } else {
            listingDisplay.innerHTML = text.split('\n').filter(l => l.trim()).map(line => {
                const [k, v] = parseLine(line);
                return k ? `<div class="mapping-line"><span class="key">${k}</span><span class="arrow">→</span><span class="value">${v || ''}</span></div>` : '';
            }).join('');
        }
    }

    // 解析单行，支持逗号、箭头、空格分隔
    function parseLine(line) {
        line = line.trim();
        if (line.includes(',')) return line.split(',').map(s => s.trim());
        if (line.includes('→')) return line.split('→').map(s => s.trim());
        if (line.includes('->')) return line.split('->').map(s => s.trim());
        return line.split(/\s+/, 2);  // 空格分隔
    }

    function parseTextToItems(text, keyName, valueName) {
        return text.split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0)
            .map(line => {
                const [k, v] = parseLine(line);
                return { [keyName]: k, [valueName]: v || '' };
            })
            .filter(item => item[keyName]);
    }

    // 名称设置 - 修改按钮
    editNameBtn.addEventListener('click', () => {
        originWordInput.removeAttribute('readonly');
        hotWordInput.removeAttribute('readonly');
        categoryDisplay.style.display = 'none';
        categoryTextarea.style.display = 'block';
        categoryTextarea.value = originalCategoryText;
        nameActionsDiv.style.display = 'flex';
        editNameBtn.style.display = 'none';
    });

    // 名称设置 - 取消按钮
    cancelNameBtn.addEventListener('click', () => {
        originWordInput.value = originalNameSettings.origin_word || '';
        hotWordInput.value = originalNameSettings.hot_word || '';
        originWordInput.setAttribute('readonly', true);
        hotWordInput.setAttribute('readonly', true);
        categoryTextarea.style.display = 'none';
        categoryDisplay.style.display = 'block';
        nameActionsDiv.style.display = 'none';
        editNameBtn.style.display = 'block';
    });

    // 名称设置 - 保存按钮
    saveNameBtn.addEventListener('click', async () => {
        try {
            await saveNameFormulaSettings(originWordInput.value, hotWordInput.value);

            const categoryItems = parseTextToItems(categoryTextarea.value, 'category', 'category_word');
            await saveCategoryWords(categoryItems);

            // 更新原始数据
            originalNameSettings = { origin_word: originWordInput.value, hot_word: hotWordInput.value };
            originalCategoryText = categoryTextarea.value;

            // 恢复只读状态
            originWordInput.setAttribute('readonly', true);
            hotWordInput.setAttribute('readonly', true);
            categoryTextarea.style.display = 'none';
            categoryDisplay.style.display = 'block';
            renderCategoryDisplay(originalCategoryText);
            nameActionsDiv.style.display = 'none';
            editNameBtn.style.display = 'block';

            window.AppUtils?.showToast?.('名称公式设置已保存', 'success');
        } catch (error) {
            window.AppUtils?.showToast?.('保存失败: ' + error.message, 'error');
        }
    });

    // 分类对照 - 修改按钮
    editListingBtn.addEventListener('click', () => {
        listingDisplay.style.display = 'none';
        listingTextarea.style.display = 'block';
        listingTextarea.value = originalListingText;
        listingActionsDiv.style.display = 'flex';
        editListingBtn.style.display = 'none';
    });

    // 分类对照 - 取消按钮
    cancelListingBtn.addEventListener('click', () => {
        listingTextarea.style.display = 'none';
        listingDisplay.style.display = 'block';
        listingActionsDiv.style.display = 'none';
        editListingBtn.style.display = 'block';
    });

    // 分类对照 - 保存按钮
    saveListingBtn.addEventListener('click', async () => {
        try {
            const listingItems = parseTextToItems(listingTextarea.value, 'source_category', 'listing_category');
            await saveListingCategoryMapping(listingItems);

            originalListingText = listingTextarea.value;
            listingTextarea.style.display = 'none';
            listingDisplay.style.display = 'block';
            renderListingDisplay(originalListingText);
            listingActionsDiv.style.display = 'none';
            editListingBtn.style.display = 'block';

            window.AppUtils?.showToast?.('分类对照设置已保存', 'success');
        } catch (error) {
            window.AppUtils?.showToast?.('保存失败: ' + error.message, 'error');
        }
    });
}

// ========================================
// 文件读取（复用上传模块的函数）
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

// ========================================
// 导出加载函数
// ========================================
window.loadNewProductPage = function (pageId) {
    if (pageId === 'new-product') {
        return {
            html: generateNewProductPage(),
            init: initNewProductUpload
        };
    }
    if (pageId === 'new-product-settings') {
        return {
            html: generateNewProductSettingsPage(),
            init: initNewProductSettings
        };
    }
    return null;
};
