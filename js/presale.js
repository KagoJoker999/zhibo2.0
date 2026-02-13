/**
 * 关预售表管理模块
 * ========================================
 * 功能：管理 presale_product_ids 表的商品ID
 * 数据库表：presale_product_ids
 */

// ========================================
// 模块状态
// ========================================
let presaleProductIds = [];
let presalePage = 1;
const presalePageSize = 20;
let presaleTotal = 0;

// ========================================
// 页面生成
// ========================================
function generatePresalePage() {
    return `
        <div class="presale-page">
            <div class="upload-block" style="margin-bottom: 1.5rem;">
                <div class="upload-block-header" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
                    <h3 style="margin: 0; display: flex; align-items: center; gap: 0.5rem;">📋 关预售表 <span class="db-table-tag">presale_product_ids</span></h3>
                    <div style="display: flex; align-items: center; gap: 1rem;">
                        <span class="presale-stats" id="presaleStats" style="color: var(--text-muted); font-size: 0.875rem;">加载中...</span>
                        <button class="btn btn-secondary" id="clearAllBtn" style="background: rgba(245, 63, 63, 0.1); border-color: var(--error-color); color: var(--error-color);">🗑️ 一键清除</button>
                    </div>
                </div>
                
                <!-- 添加区域 -->
                <div style="margin-top: 1rem; display: flex; gap: 0.5rem; align-items: center;">
                    <input type="text" id="newProductIdInput" class="form-input" placeholder="输入商品ID（多个ID用逗号分隔）" style="flex: 1; padding: 0.5rem 0.75rem; border: 1px solid var(--border-color); border-radius: 6px; background: var(--bg-secondary); color: var(--text-primary); font-size: 0.875rem;">
                    <button class="btn btn-primary" id="addProductIdBtn">➕ 添加</button>
                </div>
                
                <!-- 数据表格 -->
                <div class="product-table-container" style="max-height: 500px; margin-top: 1rem;">
                    <table class="product-table" id="presaleTable">
                        <thead>
                            <tr>
                                <th style="width: 60px;">序号</th>
                                <th>商品ID (product_id)</th>
                                <th style="width: 180px;">添加时间</th>
                                <th style="width: 80px;">操作</th>
                            </tr>
                        </thead>
                        <tbody id="presaleTableBody">
                        </tbody>
                    </table>
                </div>
                
                <!-- 分页 -->
                <div class="pagination" id="presalePagination"></div>
            </div>
        </div>
    `;
}

// ========================================
// 初始化
// ========================================
function initPresalePage() {
    console.log('📋 [关预售表] 初始化页面');

    // 绑定添加按钮
    const addBtn = document.getElementById('addProductIdBtn');
    const input = document.getElementById('newProductIdInput');
    const clearAllBtn = document.getElementById('clearAllBtn');

    addBtn.addEventListener('click', handleAddProductIds);
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') handleAddProductIds();
    });

    clearAllBtn.addEventListener('click', handleClearAll);

    // 加载数据
    loadPresaleData();
}

// ========================================
// 加载数据
// ========================================
async function loadPresaleData() {
    console.log('📥 [关预售表] 加载数据...');
    const statsEl = document.getElementById('presaleStats');
    const tbody = document.getElementById('presaleTableBody');

    try {
        // 获取总数
        const { count, error: countError } = await window.supabaseClient
            .from('presale_product_ids')
            .select('*', { count: 'exact', head: true });

        if (countError) throw countError;

        presaleTotal = count || 0;
        console.log(`📊 [关预售表] 总记录数: ${presaleTotal}`);

        if (presaleTotal === 0) {
            statsEl.textContent = '暂无数据';
            tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: var(--text-muted); padding: 2rem;">暂无预售商品ID</td></tr>';
            document.getElementById('presalePagination').innerHTML = '';
            return;
        }

        // 获取当前页数据
        const offset = (presalePage - 1) * presalePageSize;
        const { data, error } = await window.supabaseClient
            .from('presale_product_ids')
            .select('*')
            .order('id', { ascending: false })
            .range(offset, offset + presalePageSize - 1);

        if (error) throw error;

        presaleProductIds = data || [];

        // 更新统计
        const totalPages = Math.ceil(presaleTotal / presalePageSize);
        statsEl.textContent = `共 ${presaleTotal} 条 · 第 ${presalePage}/${totalPages} 页`;

        // 渲染表格
        renderPresaleTable();

        // 渲染分页
        renderPresalePagination(totalPages);

        console.log(`✅ [关预售表] 加载完成, 当前页 ${presaleProductIds.length} 条`);

    } catch (error) {
        console.error('❌ [关预售表] 加载失败:', error.message);
        statsEl.textContent = '加载失败';
        tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: var(--error-color); padding: 2rem;">加载失败: ${error.message}</td></tr>`;
    }
}

// ========================================
// 渲染表格
// ========================================
function renderPresaleTable() {
    const tbody = document.getElementById('presaleTableBody');
    const startIndex = (presalePage - 1) * presalePageSize;

    tbody.innerHTML = presaleProductIds.map((item, index) => {
        const createdAt = item.created_at ? new Date(item.created_at).toLocaleString('zh-CN') : '-';
        return `
            <tr data-id="${item.id}">
                <td style="text-align: center;">${startIndex + index + 1}</td>
                <td><code class="product-id-code">${item.product_id}</code></td>
                <td style="color: var(--text-muted);">${createdAt}</td>
                <td style="text-align: center;">
                    <button class="btn-delete" data-id="${item.id}" title="删除">🗑️</button>
                </td>
            </tr>
        `;
    }).join('');

    // 绑定删除按钮事件
    tbody.querySelectorAll('.btn-delete').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = parseInt(e.target.dataset.id);
            if (!isNaN(id)) handleDeleteItem(id);
        });
    });
}

// ========================================
// 渲染分页
// ========================================
function renderPresalePagination(totalPages) {
    const paginationEl = document.getElementById('presalePagination');

    if (totalPages <= 1) {
        paginationEl.innerHTML = '';
        return;
    }

    let html = '<div class="pagination-controls">';

    // 上一页
    html += `<button class="pagination-btn" ${presalePage <= 1 ? 'disabled' : ''} data-page="${presalePage - 1}">上一页</button>`;

    // 页码
    const maxVisiblePages = 5;
    let startPage = Math.max(1, presalePage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    if (startPage > 1) {
        html += `<button class="pagination-btn" data-page="1">1</button>`;
        if (startPage > 2) html += '<span class="pagination-ellipsis">...</span>';
    }

    for (let i = startPage; i <= endPage; i++) {
        html += `<button class="pagination-btn ${i === presalePage ? 'active' : ''}" data-page="${i}">${i}</button>`;
    }

    if (endPage < totalPages) {
        if (endPage < totalPages - 1) html += '<span class="pagination-ellipsis">...</span>';
        html += `<button class="pagination-btn" data-page="${totalPages}">${totalPages}</button>`;
    }

    // 下一页
    html += `<button class="pagination-btn" ${presalePage >= totalPages ? 'disabled' : ''} data-page="${presalePage + 1}">下一页</button>`;

    html += '</div>';
    paginationEl.innerHTML = html;

    // 绑定分页事件
    paginationEl.querySelectorAll('.pagination-btn:not([disabled])').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const page = parseInt(e.target.dataset.page);
            if (!isNaN(page) && page !== presalePage) {
                presalePage = page;
                loadPresaleData();
            }
        });
    });
}

// ========================================
// 添加商品ID
// ========================================
async function handleAddProductIds() {
    const input = document.getElementById('newProductIdInput');
    const rawValue = input.value.trim();

    if (!rawValue) {
        window.AppUtils?.showToast?.('请输入商品ID', 'warning');
        return;
    }

    // 支持逗号、空格、换行分隔
    const ids = rawValue.split(/[,，\s\n]+/).map(id => id.trim()).filter(id => id);

    if (ids.length === 0) {
        window.AppUtils?.showToast?.('请输入有效的商品ID', 'warning');
        return;
    }

    console.log(`➕ [关预售表] 添加 ${ids.length} 个商品ID`);

    try {
        const insertData = ids.map(id => ({ product_id: id }));

        const { error } = await window.supabaseClient
            .from('presale_product_ids')
            .insert(insertData);

        if (error) throw error;

        console.log(`✅ [关预售表] 添加成功`);
        window.AppUtils?.showToast?.(`成功添加 ${ids.length} 个商品ID`, 'success');

        // 清空输入框
        input.value = '';

        // 刷新列表
        presalePage = 1;
        loadPresaleData();

    } catch (error) {
        console.error('❌ [关预售表] 添加失败:', error.message);
        window.AppUtils?.showToast?.('添加失败: ' + error.message, 'error');
    }
}

// ========================================
// 删除单条
// ========================================
async function handleDeleteItem(id) {
    console.log(`🗑️ [关预售表] 删除 ID: ${id}`);

    try {
        const { error } = await window.supabaseClient
            .from('presale_product_ids')
            .delete()
            .eq('id', id);

        if (error) throw error;

        console.log(`✅ [关预售表] 删除成功`);
        window.AppUtils?.showToast?.('已删除', 'success');

        // 刷新列表
        loadPresaleData();

    } catch (error) {
        console.error('❌ [关预售表] 删除失败:', error.message);
        window.AppUtils?.showToast?.('删除失败: ' + error.message, 'error');
    }
}

// ========================================
// 一键清除
// ========================================
async function handleClearAll() {
    if (presaleTotal === 0) {
        window.AppUtils?.showToast?.('没有数据需要清除', 'info');
        return;
    }

    if (!confirm(`确定要清除全部 ${presaleTotal} 条数据吗？此操作不可恢复！`)) {
        return;
    }

    console.log(`🧹 [关预售表] 清除全部数据`);

    try {
        const { error } = await window.supabaseClient
            .from('presale_product_ids')
            .delete()
            .gte('id', 0);

        if (error) throw error;

        console.log(`✅ [关预售表] 清除成功`);
        window.AppUtils?.showToast?.(`已清除 ${presaleTotal} 条数据`, 'success');

        // 刷新列表
        presalePage = 1;
        loadPresaleData();

    } catch (error) {
        console.error('❌ [关预售表] 清除失败:', error.message);
        window.AppUtils?.showToast?.('清除失败: ' + error.message, 'error');
    }
}

// ========================================
// 导出加载函数
// ========================================
window.loadPresalePage = function (pageId) {
    if (pageId === 'presale') {
        return {
            html: generatePresalePage(),
            init: initPresalePage
        };
    }
    return null;
};
