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
            product_name: originalName,  // 初始时与原名相同，处理后更新
            image_url: String(row[0] ?? '').trim() || null,          // A列
            product_code: String(row[2] ?? '').trim() || null,       // C列
            virtual_category: String(row[3] ?? '').trim() || null,   // D列
            category: String(row[4] ?? '').trim() || null,           // E列
            product_tag: String(row[5] ?? '').trim() || null,        // F列
            base_price: parseFloat(row[6]) || 0,                      // G列
            warehouse: String(row[7] ?? '').trim() || null,          // H列
            color_spec: row.length > 14 ? String(row[14] ?? '').trim() || null : null  // O列(索引14)
        });
    }
    return records;
}

// ========================================
// 名称生成器
// 公式：初始名称 + 分类词汇 + 产地词 + 热卖词
// ========================================
async function generateProductNames(records) {
    // 读取设置
    const settings = await loadNameFormulaSettings();
    const categoryWords = await loadCategoryWords();

    return records.map(record => {
        const parts = [record.original_name];

        // 分类词汇
        if (record.category && categoryWords[record.category]) {
            parts.push(categoryWords[record.category]);
        }

        // 产地词
        if (settings.origin_word) {
            parts.push(settings.origin_word);
        }

        // 热卖词
        if (settings.hot_word) {
            parts.push(settings.hot_word);
        }

        return {
            ...record,
            product_name: parts.join('')
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
    // 先删除旧设置
    await window.supabaseClient.from('name_formula_settings').delete().gte('id', 0);

    const { error } = await window.supabaseClient
        .from('name_formula_settings')
        .insert({ origin_word: originWord, hot_word: hotWord });

    if (error) throw new Error('保存失败: ' + error.message);
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
                <h3>📝 商品名称公式设置</h3>
                <p class="settings-hint">公式：初始名称 + 分类词汇 + 产地词 + 热卖词</p>
                
                <div class="settings-group">
                    <label>产地词</label>
                    <input type="text" id="originWord" placeholder="如：韩国" class="settings-input">
                </div>
                
                <div class="settings-group">
                    <label>热卖词</label>
                    <input type="text" id="hotWord" placeholder="如：热卖" class="settings-input">
                </div>
                
                <h4>分类词汇映射</h4>
                <div id="categoryWordsContainer" class="mapping-container">
                    <!-- 动态生成 -->
                </div>
                <button class="btn btn-secondary" id="addCategoryWord">+ 添加分类</button>
            </div>
            
            <div class="settings-section">
                <h3>📋 上下架分类对照</h3>
                <div id="listingCategoryContainer" class="mapping-container">
                    <!-- 动态生成 -->
                </div>
                <button class="btn btn-secondary" id="addListingCategory">+ 添加对照</button>
            </div>
            
            <div class="settings-actions">
                <button class="btn btn-primary" id="saveSettings">💾 保存设置</button>
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

            window.AppUtils?.showToast?.(`成功处理 ${records.length} 条商品`, 'success');

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
}

// ========================================
// 初始化设置页面
// ========================================
async function initNewProductSettings() {
    const originWordInput = document.getElementById('originWord');
    const hotWordInput = document.getElementById('hotWord');
    const categoryContainer = document.getElementById('categoryWordsContainer');
    const listingContainer = document.getElementById('listingCategoryContainer');
    const addCategoryBtn = document.getElementById('addCategoryWord');
    const addListingBtn = document.getElementById('addListingCategory');
    const saveBtn = document.getElementById('saveSettings');

    // 加载设置
    const settings = await loadNameFormulaSettings();
    originWordInput.value = settings.origin_word || '';
    hotWordInput.value = settings.hot_word || '';

    // 加载分类词汇
    const categoryWords = await loadCategoryWords();
    renderCategoryWords(Object.entries(categoryWords).map(([category, word]) => ({ category, category_word: word })));

    // 加载分类对照
    const { data: listingData } = await window.supabaseClient.from('listing_category_mapping').select('*');
    renderListingCategories(listingData || []);

    function renderCategoryWords(items) {
        categoryContainer.innerHTML = items.map((item, idx) => `
            <div class="mapping-row" data-idx="${idx}">
                <input type="text" class="category-input" value="${item.category || ''}" placeholder="分类">
                <span>→</span>
                <input type="text" class="word-input" value="${item.category_word || ''}" placeholder="词汇">
                <button class="btn-remove" onclick="this.parentElement.remove()">×</button>
            </div>
        `).join('');
    }

    function renderListingCategories(items) {
        listingContainer.innerHTML = items.map((item, idx) => `
            <div class="mapping-row" data-idx="${idx}">
                <input type="text" class="source-input" value="${item.source_category || ''}" placeholder="原分类">
                <span>→</span>
                <input type="text" class="listing-input" value="${item.listing_category || ''}" placeholder="上架分类">
                <button class="btn-remove" onclick="this.parentElement.remove()">×</button>
            </div>
        `).join('');
    }

    addCategoryBtn.addEventListener('click', () => {
        const div = document.createElement('div');
        div.className = 'mapping-row';
        div.innerHTML = `
            <input type="text" class="category-input" placeholder="分类">
            <span>→</span>
            <input type="text" class="word-input" placeholder="词汇">
            <button class="btn-remove" onclick="this.parentElement.remove()">×</button>
        `;
        categoryContainer.appendChild(div);
    });

    addListingBtn.addEventListener('click', () => {
        const div = document.createElement('div');
        div.className = 'mapping-row';
        div.innerHTML = `
            <input type="text" class="source-input" placeholder="原分类">
            <span>→</span>
            <input type="text" class="listing-input" placeholder="上架分类">
            <button class="btn-remove" onclick="this.parentElement.remove()">×</button>
        `;
        listingContainer.appendChild(div);
    });

    saveBtn.addEventListener('click', async () => {
        try {
            // 保存基础设置
            await saveNameFormulaSettings(originWordInput.value, hotWordInput.value);

            // 保存分类词汇
            const categoryItems = [];
            categoryContainer.querySelectorAll('.mapping-row').forEach(row => {
                const category = row.querySelector('.category-input').value.trim();
                const word = row.querySelector('.word-input').value.trim();
                if (category) categoryItems.push({ category, category_word: word });
            });
            await saveCategoryWords(categoryItems);

            // 保存分类对照
            const listingItems = [];
            listingContainer.querySelectorAll('.mapping-row').forEach(row => {
                const source = row.querySelector('.source-input').value.trim();
                const listing = row.querySelector('.listing-input').value.trim();
                if (source) listingItems.push({ source_category: source, listing_category: listing });
            });
            await saveListingCategoryMapping(listingItems);

            window.AppUtils?.showToast?.('设置已保存', 'success');
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
