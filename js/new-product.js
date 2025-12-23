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
// 支持自定义符号和公式顺序
// 示例：「明星系列-许妍马尾」韩国25秋冬百搭香蕉夹
// ========================================
async function generateProductNames(records) {
    const settings = await loadNameFormulaSettings();
    const categoryWords = await loadCategoryWords();

    // 解析公式顺序
    let order = ['name', 'origin', 'hot', 'category'];
    try {
        order = JSON.parse(settings.formula_order || '["name", "origin", "hot", "category"]');
    } catch (e) {
        console.warn('公式顺序解析失败，使用默认顺序');
    }

    const prefix = settings.name_prefix || '「';
    const suffix = settings.name_suffix || '」';

    return records.map(record => {
        let nameParts = [];

        // 按顺序生成各部分
        order.forEach(key => {
            switch (key) {
                case 'name':
                    nameParts.push(`${prefix}${record.original_name}${suffix}`);
                    break;
                case 'origin':
                    if (settings.origin_word) nameParts.push(settings.origin_word);
                    break;
                case 'hot':
                    if (settings.hot_word) nameParts.push(settings.hot_word);
                    break;
                case 'category':
                    if (record.category && categoryWords[record.category]) {
                        nameParts.push(categoryWords[record.category]);
                    }
                    break;
            }
        });

        return {
            ...record,
            product_name: nameParts.join('')
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
    const defaultSettings = {
        origin_word: '韩国',
        hot_word: '',
        name_prefix: '「',
        name_suffix: '」',
        formula_order: '["name", "origin", "hot", "category"]'
    };

    try {
        const { data, error } = await window.supabaseClient
            .from('name_formula_settings')
            .select('*')
            .limit(1)
            .single();

        if (error || !data) {
            return defaultSettings;
        }
        // 合并默认值和数据库值
        return { ...defaultSettings, ...data };
    } catch (e) {
        return defaultSettings;
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
                <div class="upload-block upload-block-scrollable" id="block-result">
                    <div class="upload-block-header">
                        <h3>📊 处理说明 & 结果 <span class="db-table-tag">→ new_product_data</span></h3>
                    </div>
                    
                    <div class="scrollable-content">
                    <!-- 处理流程说明 -->
                    <div class="process-info">
                        <div class="process-section">
                            <h4>📋 处理流程</h4>
                            <ol class="process-steps">
                                <li><span class="step-num">1</span> 读取上传的 Excel 文件</li>
                                <li><span class="step-num">2</span> 解析商品数据（名称、编码、分类等）</li>
                                <li><span class="step-num">3</span> 应用名称公式生成新商品名</li>
                                <li><span class="step-num">4</span> 根据分类映射生成上架分类</li>
                                <li><span class="step-num">5</span> 上传数据到数据库</li>
                            </ol>
                        </div>
                        
                        <div class="process-section">
                            <h4>⚙️ 名称生成公式</h4>
                            <div class="formula-box">
                                <code>「原名称」+ 产地词 + 热卖词 + 分类词汇</code>
                            </div>
                            <p class="formula-example">示例：「明星马尾」韩国25新年百搭香蕉夹</p>
                        </div>
                        
                        <div class="process-section">
                            <h4>💡 设置提示</h4>
                            <ul class="tips-list">
                                <li>在 <strong>⚙️ 设置</strong> 页可配置产地词、热卖词</li>
                                <li>可设置分类词汇映射（分类→词汇）</li>
                                <li>可设置上架分类映射（原分类→上架分类）</li>
                            </ul>
                        </div>
                    </div>
                    
                    <!-- 处理结果 -->
                    <div class="result-divider"></div>
                    <h4 class="result-title">📈 处理结果</h4>
                    <div id="result-content" class="result-content">
                        <p class="text-muted">上传数据后显示处理结果</p>
                    </div>
                    </div><!-- end scrollable-content -->

                </div>
            </div>
            
            <!-- 数据库数据表格 -->
            <div class="data-table-section">
                <div class="data-table-header">
                    <h3>📋 数据库新品列表 <span class="db-table-tag">← new_product_data</span> <span id="lastRefreshTime" class="refresh-time"></span> <span id="recordCountInfo" class="record-count"></span></h3>
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
        </div>
    `;
}

function generateNewProductRulesPage() {
    return generateNumberingRulesUI();
}

function initNewProductRules() {
    initNumberingRulesLogic();
}

function generateNumberingRulesUI() {
    return `
        <div class="rules-settings-panel" style="max-width:800px; margin:0 auto; background:var(--bg-secondary); padding:2rem; border-radius:var(--border-radius);">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:2rem;">
                <div>
                    <h3 style="margin:0;">🔢 序号分配规则</h3>
                    <p class="text-muted" style="margin:0.5rem 0 0;">按商品编码从小到大排序后依次分配序号（同名商品共享序号）</p>
                    <p class="text-muted" style="margin:0.25rem 0 0; font-size:0.8rem;">数据库表: ranking_config (config_key='new_product_number_rules')</p>
                </div>
                <button class="btn btn-primary" id="btnSaveRules">💾 保存配置</button>
            </div>

            <div id="rulesListContainer" style="display:flex; flex-direction:column; gap:1rem;">
                <!-- Rules injected via JS -->
            </div>

            <button class="btn btn-secondary" id="btnAddRule" style="margin-top:1.5rem; width:100%; border-style:dashed;">+ 添加分配规则</button>

            <div class="rules-preview" style="margin-top:2rem; padding:1.5rem; background:var(--bg-tertiary); border-radius:var(--border-radius-sm);">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
                    <h4 style="margin:0; font-size:0.9rem;">👁️ 规则预览</h4>
                    <button class="btn btn-sm btn-secondary" id="btnPreviewRules">刷新预览</button>
                </div>
                <div id="rulesPreviewText" style="font-family:monospace; color:var(--text-secondary); font-size:0.85rem; line-height:1.6; white-space: pre-wrap;">请配置规则...</div>
            </div>
        </div>
    `;
}

// ========================================
// 设置页面生成
// ========================================
function generateNewProductSettingsPage() {
    return `
        <div class="settings-page settings-grid-3">
            <!-- 第1列：名称公式设置 -->
            <div class="settings-section">
                <div class="settings-header">
                    <h3>📝 名称公式设置</h3>
                </div>
                
                <!-- 符号设置 -->
                <div class="settings-subsection">
                    <h4>🔤 符号设置</h4>
                    <div class="symbol-settings">
                        <div class="settings-group">
                            <label>前缀符号</label>
                            <div class="inline-edit-field">
                                <input type="text" id="namePrefix" placeholder="「" class="settings-input symbol-input" maxlength="5">
                                <button class="btn-icon save-inline" id="saveNamePrefix" title="保存">✓</button>
                            </div>
                        </div>
                        <div class="settings-group">
                            <label>后缀符号</label>
                            <div class="inline-edit-field">
                                <input type="text" id="nameSuffix" placeholder="」" class="settings-input symbol-input" maxlength="5">
                                <button class="btn-icon save-inline" id="saveNameSuffix" title="保存">✓</button>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- 公式顺序设置 -->
                <div class="settings-subsection">
                    <h4>📐 公式顺序</h4>
                    <p class="settings-hint-sm">拖拽调整各元素在生成名称中的顺序</p>
                    <ul class="formula-order-list" id="formulaOrderList">
                        <li data-key="name" class="formula-item">
                            <span class="drag-handle">☰</span>
                            <span class="formula-label">原名称（含符号）</span>
                        </li>
                        <li data-key="origin" class="formula-item">
                            <span class="drag-handle">☰</span>
                            <span class="formula-label">产地词</span>
                        </li>
                        <li data-key="hot" class="formula-item">
                            <span class="drag-handle">☰</span>
                            <span class="formula-label">热卖词</span>
                        </li>
                        <li data-key="category" class="formula-item">
                            <span class="drag-handle">☰</span>
                            <span class="formula-label">分类词汇</span>
                        </li>
                    </ul>
                    <button class="btn btn-primary btn-sm" id="saveFormulaOrder" style="width:100%;margin-top:0.5rem">💾 保存公式顺序</button>
                </div>
                
                <!-- 词汇设置 -->
                <div class="settings-subsection">
                    <h4>✏️ 词汇设置</h4>
                    <div class="settings-group">
                        <label>产地词</label>
                        <div class="inline-edit-field">
                            <input type="text" id="originWord" placeholder="如：韩国" class="settings-input">
                            <button class="btn-icon save-inline" id="saveOriginWord" title="保存">✓</button>
                        </div>
                    </div>
                    
                    <div class="settings-group">
                        <label>热卖词</label>
                        <div class="inline-edit-field">
                            <input type="text" id="hotWord" placeholder="如：26新年百搭" class="settings-input">
                            <button class="btn-icon save-inline" id="saveHotWord" title="保存">✓</button>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- 第2列：分类词汇映射 -->
            <div class="settings-section">
                <div class="settings-header">
                    <h3>🏷️ 分类词汇映射</h3>
                    <div class="header-buttons">
                        <button class="btn btn-primary btn-sm save-mapping-btn" id="saveCategoryWordBtn" style="display:none">💾 保存</button>
                        <button class="btn btn-secondary btn-sm" id="addCategoryWord">+ 添加</button>
                    </div>
                </div>
                <div id="categoryWordsTable" class="mapping-table-container">
                    <!-- 表格由 JS 渲染 -->
                </div>
            </div>
            
            <!-- 第3列：上架分类映射 -->
            <div class="settings-section">
                <div class="settings-header">
                    <h3>📋 上架分类映射</h3>
                    <div class="header-buttons">
                        <button class="btn btn-primary btn-sm save-mapping-btn" id="saveListingCategoryBtn" style="display:none">💾 保存</button>
                        <button class="btn btn-secondary btn-sm" id="addListingCategory">+ 添加</button>
                    </div>
                </div>
                <div id="listingCategoryTable" class="mapping-table-container">
                    <!-- 表格由 JS 渲染 -->
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

    // Init Rules Logic (This is kept as it's part of the upload process, not UI tab logic)
    initNumberingRulesLogic();

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
            updateStatus('生成上架分类...', 50);
            records = await generateListingCategories(records);

            // 分配序号
            updateStatus('分配序号...', 55);
            try {
                const rules = await loadNumberingRules();
                console.log('加载到的规则:', rules);
                records = assignNewProductNumbers(records, rules);
                console.log('分配后的第一条记录:', records[0]);
            } catch (e) { console.warn('序号分配失败', e); }

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
                .order('product_code', { ascending: true })
                .limit(100);

            if (error) throw error;

            // 更新刷新时间和记录数
            const now = new Date();
            timeSpan.textContent = `(${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')} 刷新)`;
            const countSpan = document.getElementById('recordCountInfo');
            if (countSpan) countSpan.textContent = `共 ${data.length} 条`;

            if (!data || data.length === 0) {
                container.innerHTML = '<p class="text-muted">暂无数据</p>';
                return;
            }

            container.innerHTML = `
                <div class="table-scroll">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>序号</th>
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
                                    <td style="font-weight:bold; color:var(--primary-color);">${row.sample_number || '-'}</td>
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
                // 重命名表格：序号, 商品编码, 商品名称(新名), 商品简称(原名)
                rows = [['序号', '商品编码', '商品名称', '商品简称']];
                data.forEach(item => {
                    rows.push([
                        item.sample_number || '',
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
// 初始化设置页面 (可编辑表格版)
// ========================================
async function initNewProductSettings() {
    const originWordInput = document.getElementById('originWord');
    const hotWordInput = document.getElementById('hotWord');
    const namePrefixInput = document.getElementById('namePrefix');
    const nameSuffixInput = document.getElementById('nameSuffix');
    const formulaOrderList = document.getElementById('formulaOrderList');
    const categoryTable = document.getElementById('categoryWordsTable');
    const listingTable = document.getElementById('listingCategoryTable');
    const addCategoryBtn = document.getElementById('addCategoryWord');
    const addListingBtn = document.getElementById('addListingCategory');
    const saveOriginBtn = document.getElementById('saveOriginWord');
    const saveHotBtn = document.getElementById('saveHotWord');
    const saveNamePrefixBtn = document.getElementById('saveNamePrefix');
    const saveNameSuffixBtn = document.getElementById('saveNameSuffix');
    const saveFormulaOrderBtn = document.getElementById('saveFormulaOrder');
    const saveCategoryWordBtn = document.getElementById('saveCategoryWordBtn');
    const saveListingCategoryBtn = document.getElementById('saveListingCategoryBtn');

    // 数据存储
    let categoryWordsData = [];
    let listingCategoryData = [];
    let currentFormulaOrder = ['name', 'origin', 'hot', 'category'];

    // 加载数据
    await loadAllData();

    async function loadAllData() {
        // 加载名称公式设置
        const settings = await loadNameFormulaSettings();
        originWordInput.value = settings.origin_word || '';
        hotWordInput.value = settings.hot_word || '';
        namePrefixInput.value = settings.name_prefix || '「';
        nameSuffixInput.value = settings.name_suffix || '」';

        // 加载公式顺序
        try {
            currentFormulaOrder = JSON.parse(settings.formula_order || '["name", "origin", "hot", "category"]');
        } catch (e) {
            currentFormulaOrder = ['name', 'origin', 'hot', 'category'];
        }
        renderFormulaOrderList();

        // 加载分类词汇
        const categoryWords = await loadCategoryWords();
        categoryWordsData = Object.entries(categoryWords).map(([k, v], idx) => ({
            id: idx, category: k, category_word: v
        }));
        renderCategoryTable();

        // 加载分类对照
        const { data: listingData } = await window.supabaseClient.from('listing_category_mapping').select('*');
        listingCategoryData = (listingData || []).map((item, idx) => ({
            id: item.id || idx, source_category: item.source_category, listing_category: item.listing_category
        }));
        renderListingTable();
    }

    // 渲染公式顺序列表
    function renderFormulaOrderList() {
        const labels = {
            name: '原名称（含符号）',
            origin: '产地词',
            hot: '热卖词',
            category: '分类词汇'
        };

        formulaOrderList.innerHTML = currentFormulaOrder.map(key => `
            <li data-key="${key}" class="formula-item">
                <span class="drag-handle">☰</span>
                <span class="formula-label">${labels[key] || key}</span>
            </li>
        `).join('');

        // 启用拖拽排序
        initDragSort();
    }

    // 拖拽排序
    function initDragSort() {
        const items = formulaOrderList.querySelectorAll('.formula-item');
        let dragItem = null;

        items.forEach(item => {
            item.setAttribute('draggable', 'true');

            item.addEventListener('dragstart', (e) => {
                dragItem = item;
                setTimeout(() => item.classList.add('dragging'), 0);
            });

            item.addEventListener('dragend', () => {
                item.classList.remove('dragging');
                dragItem = null;
                // 更新顺序数据
                currentFormulaOrder = Array.from(formulaOrderList.querySelectorAll('.formula-item'))
                    .map(el => el.dataset.key);
            });

            item.addEventListener('dragover', (e) => {
                e.preventDefault();
                const afterElement = getDragAfterElement(formulaOrderList, e.clientY);
                if (afterElement == null) {
                    formulaOrderList.appendChild(dragItem);
                } else {
                    formulaOrderList.insertBefore(dragItem, afterElement);
                }
            });
        });
    }

    function getDragAfterElement(container, y) {
        const draggableElements = [...container.querySelectorAll('.formula-item:not(.dragging)')];
        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            if (offset < 0 && offset > closest.offset) {
                return { offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }

    // 保存前缀符号
    saveNamePrefixBtn?.addEventListener('click', async () => {
        try {
            await saveNameFormulaSetting('name_prefix', namePrefixInput.value || '「');
            window.AppUtils?.showToast?.('前缀符号已保存', 'success');
        } catch (e) {
            window.AppUtils?.showToast?.('保存失败: ' + e.message, 'error');
        }
    });

    // 保存后缀符号
    saveNameSuffixBtn?.addEventListener('click', async () => {
        try {
            await saveNameFormulaSetting('name_suffix', nameSuffixInput.value || '」');
            window.AppUtils?.showToast?.('后缀符号已保存', 'success');
        } catch (e) {
            window.AppUtils?.showToast?.('保存失败: ' + e.message, 'error');
        }
    });

    // 保存公式顺序
    saveFormulaOrderBtn?.addEventListener('click', async () => {
        try {
            await saveNameFormulaSetting('formula_order', JSON.stringify(currentFormulaOrder));
            window.AppUtils?.showToast?.('公式顺序已保存', 'success');
        } catch (e) {
            window.AppUtils?.showToast?.('保存失败: ' + e.message, 'error');
        }
    });

    // 保存单个设置字段
    async function saveNameFormulaSetting(field, value) {
        const { data: existing } = await window.supabaseClient
            .from('name_formula_settings')
            .select('id')
            .order('id', { ascending: true });

        if (existing && existing.length > 0) {
            const { error } = await window.supabaseClient
                .from('name_formula_settings')
                .update({ [field]: value, updated_at: new Date().toISOString() })
                .eq('id', existing[0].id);
            if (error) throw error;
        } else {
            const { error } = await window.supabaseClient
                .from('name_formula_settings')
                .insert({ [field]: value });
            if (error) throw error;
        }
    }

    // 渲染分类词汇表格
    function renderCategoryTable() {
        const saveBtn = document.getElementById('saveCategoryWordBtn');
        if (categoryWordsData.length === 0) {
            categoryTable.innerHTML = '<p class="empty-state">暂无映射，点击上方"添加"按钮添加</p>';
            if (saveBtn) saveBtn.style.display = 'none';
            return;
        }
        categoryTable.innerHTML = `
            <table class="editable-table">
                <thead><tr><th>分类</th><th>词汇</th><th>操作</th></tr></thead>
                <tbody>
                    ${categoryWordsData.map((item, idx) => `
                        <tr data-idx="${idx}">
                            <td><input type="text" class="table-input" value="${item.category || ''}" data-field="category"></td>
                            <td><input type="text" class="table-input" value="${item.category_word || ''}" data-field="category_word"></td>
                            <td class="actions-cell">
                                <button class="btn-icon btn-delete" data-idx="${idx}" title="删除">🗑️</button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
        // 绑定删除事件
        categoryTable.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', () => {
                const idx = parseInt(btn.dataset.idx);
                categoryWordsData.splice(idx, 1);
                if (saveBtn) saveBtn.style.display = 'inline-flex';
                renderCategoryTable();
            });
        });
        // 绑定输入事件，有修改时显示保存按钮
        categoryTable.querySelectorAll('.table-input').forEach(input => {
            input.addEventListener('input', () => {
                if (saveBtn) saveBtn.style.display = 'inline-flex';
            });
        });
    }

    // 渲染分类对照表格
    function renderListingTable() {
        const saveBtn = document.getElementById('saveListingCategoryBtn');
        if (listingCategoryData.length === 0) {
            listingTable.innerHTML = '<p class="empty-state">暂无映射，点击上方"添加"按钮添加</p>';
            if (saveBtn) saveBtn.style.display = 'none';
            return;
        }
        listingTable.innerHTML = `
            <table class="editable-table">
                <thead><tr><th>原分类</th><th>上架分类</th><th>操作</th></tr></thead>
                <tbody>
                    ${listingCategoryData.map((item, idx) => `
                        <tr data-idx="${idx}">
                            <td><input type="text" class="table-input" value="${item.source_category || ''}" data-field="source_category"></td>
                            <td><input type="text" class="table-input" value="${item.listing_category || ''}" data-field="listing_category"></td>
                            <td class="actions-cell">
                                <button class="btn-icon btn-delete" data-idx="${idx}" title="删除">🗑️</button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
        // 绑定删除事件
        listingTable.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', () => {
                const idx = parseInt(btn.dataset.idx);
                listingCategoryData.splice(idx, 1);
                if (saveBtn) saveBtn.style.display = 'inline-flex';
                renderListingTable();
            });
        });
        // 绑定输入事件，有修改时显示保存按钮
        listingTable.querySelectorAll('.table-input').forEach(input => {
            input.addEventListener('input', () => {
                if (saveBtn) saveBtn.style.display = 'inline-flex';
            });
        });
    }

    // 保存分类词汇表格
    async function saveCategoryTableData() {
        try {
            // 从表格中读取最新数据
            const rows = categoryTable.querySelectorAll('tbody tr');
            const items = [];
            rows.forEach(row => {
                const category = row.querySelector('[data-field="category"]').value.trim();
                const word = row.querySelector('[data-field="category_word"]').value.trim();
                if (category) items.push({ category, category_word: word });
            });
            await saveCategoryWords(items);
            categoryWordsData = items.map((item, idx) => ({ id: idx, ...item }));
            // 保存成功后隐藏保存按钮
            const saveBtn = document.getElementById('saveCategoryWordBtn');
            if (saveBtn) saveBtn.style.display = 'none';
            window.AppUtils?.showToast?.('分类词汇已保存', 'success');
        } catch (e) {
            window.AppUtils?.showToast?.('保存失败: ' + e.message, 'error');
        }
    }

    // 保存分类对照表格
    async function saveListingTableData() {
        try {
            const rows = listingTable.querySelectorAll('tbody tr');
            const items = [];
            rows.forEach(row => {
                const source = row.querySelector('[data-field="source_category"]').value.trim();
                const listing = row.querySelector('[data-field="listing_category"]').value.trim();
                if (source) items.push({ source_category: source, listing_category: listing });
            });
            await saveListingCategoryMapping(items);
            listingCategoryData = items.map((item, idx) => ({ id: idx, ...item }));
            // 保存成功后隐藏保存按钮
            const saveBtn = document.getElementById('saveListingCategoryBtn');
            if (saveBtn) saveBtn.style.display = 'none';
            window.AppUtils?.showToast?.('分类对照已保存', 'success');
        } catch (e) {
            window.AppUtils?.showToast?.('保存失败: ' + e.message, 'error');
        }
    }

    // 添加新行事件
    addCategoryBtn?.addEventListener('click', () => {
        categoryWordsData.push({ id: Date.now(), category: '', category_word: '' });
        renderCategoryTable();
        // 聚焦到新行
        const lastInput = categoryTable.querySelector('tbody tr:last-child input');
        lastInput?.focus();
    });

    addListingBtn?.addEventListener('click', () => {
        listingCategoryData.push({ id: Date.now(), source_category: '', listing_category: '' });
        renderListingTable();
        const lastInput = listingTable.querySelector('tbody tr:last-child input');
        lastInput?.focus();
    });

    // 保存产地词/热卖词
    saveOriginBtn?.addEventListener('click', async () => {
        try {
            await saveNameFormulaSettings(originWordInput.value, hotWordInput.value);
            window.AppUtils?.showToast?.('产地词已保存', 'success');
        } catch (e) {
            window.AppUtils?.showToast?.('保存失败: ' + e.message, 'error');
        }
    });

    saveHotBtn?.addEventListener('click', async () => {
        try {
            await saveNameFormulaSettings(originWordInput.value, hotWordInput.value);
            window.AppUtils?.showToast?.('热卖词已保存', 'success');
        } catch (e) {
            window.AppUtils?.showToast?.('保存失败: ' + e.message, 'error');
        }
    });

    // 绑定头部保存按钮事件
    saveCategoryWordBtn?.addEventListener('click', saveCategoryTableData);
    saveListingCategoryBtn?.addEventListener('click', saveListingTableData);
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
// 新品序号规则逻辑
// ========================================
async function loadNumberingRules() {
    const defaultRules = [
        { range_start: 1, range_end: 20, prefix: 'A', start_num: 1, step: 2 },
        { range_start: 21, range_end: 99999, prefix: 'A', start_num: 41, step: 1 }
    ];
    try {
        const { data, error } = await window.supabaseClient
            .from('ranking_config')
            .select('config_value')
            .eq('config_key', 'new_product_number_rules')
            .single();
        if (error || !data || !data.config_value || data.config_value.length === 0) {
            return defaultRules;
        }
        return data.config_value;
    } catch (e) {
        console.warn('加载序号规则失败，使用默认规则', e);
        return defaultRules;
    }
}

async function saveNumberingRules(rules) {
    const { error } = await window.supabaseClient
        .from('ranking_config')
        .upsert({
            config_key: 'new_product_number_rules',
            config_value: rules,
            updated_at: new Date().toISOString()
        }, { onConflict: 'config_key' });
    if (error) throw error;
}

function assignNewProductNumbers(records, rules) {
    if (!rules || rules.length === 0) return records;
    const sortedRules = [...rules].sort((a, b) => a.range_start - b.range_start);

    // 1. 先按商品编码从小到大排序
    const sortedRecords = [...records].sort((a, b) => {
        const codeA = a.product_code || '';
        const codeB = b.product_code || '';
        return codeA.localeCompare(codeB, 'zh-CN', { numeric: true });
    });

    // 2. 按排序后的顺序分配序号（同名商品共享序号）
    const nameToNumber = new Map();
    let currentCount = 1;

    sortedRecords.forEach(record => {
        const name = record.product_name;
        if (nameToNumber.has(name)) {
            record.sample_number = nameToNumber.get(name);
        } else {
            let targetRule = sortedRules.find(r => currentCount >= r.range_start && currentCount <= r.range_end);
            let sampleNum = '';
            if (targetRule) {
                const offset = currentCount - targetRule.range_start;
                const numVal = parseInt(targetRule.start_num) + (offset * parseInt(targetRule.step));
                sampleNum = (targetRule.prefix || '') + String(numVal).padStart(2, '0');
            }
            nameToNumber.set(name, sampleNum);
            record.sample_number = sampleNum;
            currentCount++;
        }
    });

    // 3. 返回原始顺序的records（但已经带上了sample_number）
    return records;
}

function initNumberingRulesLogic() {
    const rulesContainer = document.getElementById('rulesListContainer');
    const addBtn = document.getElementById('btnAddRule');
    const saveBtn = document.getElementById('btnSaveRules');
    const previewBtn = document.getElementById('btnPreviewRules');
    const previewText = document.getElementById('rulesPreviewText');

    let rules = [];

    loadNumberingRules().then(data => {
        rules = data && data.length ? data : [
            { range_start: 1, range_end: 20, prefix: 'A', start_num: 1, step: 2 },
            { range_start: 21, range_end: 99999, prefix: 'A', start_num: 41, step: 1 }
        ];
        renderRules();
    });

    function renderRules() {
        if (!rulesContainer) return;
        rulesContainer.innerHTML = rules.map((r, i) => `
            <div class="rule-item" data-index="${i}" style="background:var(--bg-tertiary); padding:1rem; border-radius:4px; display:flex; gap:1rem; align-items:flex-end; border:1px solid var(--border-color);">
                <div style="flex:1">
                    <label style="font-size:0.75rem; color:var(--text-muted); display:block; margin-bottom:4px;">第几个品（按编码排序后）</label>
                    <div style="display:flex; align-items:center; gap:0.5rem">
                        <input type="number" class="input input-sm rule-start" value="${r.range_start}" style="width:70px">
                        <span>-</span>
                        <input type="number" class="input input-sm rule-end" value="${r.range_end}" style="width:70px">
                    </div>
                </div>
                 <div style="width:80px">
                    <label style="font-size:0.75rem; color:var(--text-muted); display:block; margin-bottom:4px;">前缀</label>
                    <input type="text" class="input input-sm rule-prefix" value="${r.prefix || ''}" style="width:100%">
                </div>
                <div style="width:80px">
                    <label style="font-size:0.75rem; color:var(--text-muted); display:block; margin-bottom:4px;">起始号</label>
                    <input type="number" class="input input-sm rule-start-num" value="${r.start_num}" style="width:100%">
                </div>
                <div style="width:80px">
                    <label style="font-size:0.75rem; color:var(--text-muted); display:block; margin-bottom:4px;">步长</label>
                    <input type="number" class="input input-sm rule-step" value="${r.step}" style="width:100%">
                </div>
                <button class="btn btn-sm btn-icon btn-delete-rule" style="color:var(--error-color); height:32px; width:32px; display:flex; align-items:center; justify-content:center; cursor: pointer;">✕</button>
            </div>
        `).join('');

        rulesContainer.querySelectorAll('.btn-delete-rule').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const idx = parseInt(e.target.closest('.rule-item').dataset.index);
                rules.splice(idx, 1);
                renderRules();
            });
        });

        rulesContainer.querySelectorAll('input').forEach(input => {
            input.addEventListener('change', (e) => {
                const item = e.target.closest('.rule-item');
                const idx = parseInt(item.dataset.index);
                const r = rules[idx];
                if (e.target.classList.contains('rule-start')) r.range_start = parseInt(e.target.value) || 0;
                if (e.target.classList.contains('rule-end')) r.range_end = parseInt(e.target.value) || 0;
                if (e.target.classList.contains('rule-prefix')) r.prefix = e.target.value;
                if (e.target.classList.contains('rule-start-num')) r.start_num = parseInt(e.target.value) || 0;
                if (e.target.classList.contains('rule-step')) r.step = parseInt(e.target.value) || 1;
            });
        });
    }

    addBtn?.addEventListener('click', () => {
        const lastRule = rules[rules.length - 1];
        const nextStart = lastRule ? (lastRule.range_end + 1) : 1;
        rules.push({ range_start: nextStart, range_end: nextStart + 99, prefix: 'A', start_num: nextStart, step: 1 });
        renderRules();
    });

    saveBtn?.addEventListener('click', async () => {
        try {
            saveBtn.disabled = true;
            saveBtn.textContent = '保存中...';
            await saveNumberingRules(rules);
            window.AppUtils?.showToast?.('规则保存成功', 'success');
        } catch (e) {
            window.AppUtils?.showToast?.('保存失败: ' + e.message, 'error');
        } finally {
            saveBtn.disabled = false;
            saveBtn.textContent = '💾 保存配置';
        }
    });

    previewBtn?.addEventListener('click', () => {
        let output = [];
        const sortedRules = [...rules].sort((a, b) => a.range_start - b.range_start);

        const previewRange = [];
        for (let i = 1; i <= 20; i++) previewRange.push(i);
        previewRange.push('...');
        for (let i = 40; i <= 45; i++) previewRange.push(i);

        previewRange.forEach(i => {
            if (i === '...') { output.push('------'); return; }
            let num = '';
            let r = sortedRules.find(ru => i >= ru.range_start && i <= ru.range_end);
            if (r) {
                let offset = i - r.range_start;
                let val = parseInt(r.start_num) + (offset * parseInt(r.step));
                num = (r.prefix || '') + String(val).padStart(2, '0');
            } else {
                num = 'N/A';
            }
            output.push(`第 ${i} 个 -> ${num}`);
        });

        previewText.textContent = output.join('\n');
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
    if (pageId === 'new-product-rules') {
        return {
            html: generateNewProductRulesPage(),
            init: initNewProductRules
        };
    }
    return null;
};
