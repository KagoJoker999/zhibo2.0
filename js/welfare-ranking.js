/**
 * 福利排品处理模块
 * ========================================
 */

function loadWelfareRankingPage() {
    return {
        html: generateWelfareRankingPage(),
        init: initWelfareRanking
    };
}

window.loadWelfareRankingPage = loadWelfareRankingPage;

function generateWelfareRankingPage() {
    return `
        <div class="page-content" style="padding: 0;">
            <div class="data-table-header" style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 1rem;">
                <div style="text-align: left;">
                    <h3 style="margin:0;"><i data-lucide="gift"></i> 福利排品 <span class="db-table-tag">→ welfare_arranged_data</span></h3>
                    <p class="text-muted" style="margin: 2px 0 0 0; font-size: 0.85rem;">从此列表勾选要参与排品的福利商品，点击保存后将替换之前的选择。</p>
                </div>
                <div class="header-buttons" style="display:flex; gap:0.75rem; align-items:center;">
                    <button class="btn btn-danger" id="btnClearWelfareData" title="清空已保存的排品名单">🗑️ 清空</button>
                    <button class="btn btn-secondary" id="btnRefreshWelfareRanking" title="刷新表格数据"><i data-lucide="refresh-cw"></i> 刷新</button>
                    <button class="btn btn-primary" id="btnSaveWelfareRanking" disabled><i data-lucide="save"></i> 保存选中的商品</button>
                </div>
            </div>

            <div class="welfare-table-container">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th style="width: 50px; text-align: center;">
                                <input type="checkbox" id="welfareSelectAll" title="全选">
                            </th>
                            <th style="width: 80px;">图片</th>
                            <th>商品名</th>
                            <th>商品编码</th>
                            <th>数据来源</th>
                            <th style="text-align: right;">可用条数</th>
                        </tr>
                    </thead>
                    <tbody id="welfareRankingTbody">
                        <tr><td colspan="6" class="text-center text-muted" style="padding: 3rem;">加载中...</td></tr>
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

async function initWelfareRanking() {
    const tbody = document.getElementById('welfareRankingTbody');
    const saveBtn = document.getElementById('btnSaveWelfareRanking');
    const selectAllCheckbox = document.getElementById('welfareSelectAll');
    const refreshBtn = document.getElementById('btnRefreshWelfareRanking');
    const clearBtn = document.getElementById('btnClearWelfareData');

    let currentData = [];

    // 加载来源数据
    async function loadData() {
        try {
            AppUtils.showLoading('加载福利商品中...');

            // 1. 获取库存福利品 (需要按照 available_qty 倒序排)
            const { data: inventoryData, error: err1 } = await window.supabaseClient
                .from('welfare_inventory_data')
                .select('*')
                .order('available_qty', { ascending: false });

            if (err1) throw err1;

            // 标记来源
            const formattedInventory = (inventoryData || [])
                .filter(r => r.available_qty === null || r.available_qty > 0)
                .map(r => ({ ...r, __source: '福利品' }));

            // 按照需求组合
            currentData = formattedInventory;

            renderTable();
            checkSaveButtonState();
        } catch (error) {
            console.error('加载福利数据失败:', error);
            AppUtils.showToast('加载失败: ' + error.message, 'error');
            tbody.innerHTML = `<tr><td colspan="6" class="text-center text-error">加载失败</td></tr>`;
        } finally {
            AppUtils.hideLoading();
        }
    }

    function renderTable() {
        if (currentData.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted" style="padding: 3rem;">暂无福利商品数据</td></tr>`;
            return;
        }

        tbody.innerHTML = currentData.map((row, index) => {
            const qtyStr = typeof row.available_qty === 'number' ? row.available_qty : '-';
            const sourceStyle = row.__source === '福利品' ? 'background: rgba(34, 197, 94, 0.1); color: var(--success-color);' : 'background: rgba(239, 68, 68, 0.1); color: #ef4444;';
            return `
                <tr class="welfare-row">
                    <td style="text-align: center;">
                        <input type="checkbox" class="welfare-checkbox" data-idx="${index}">
                    </td>
                    <td>
                        <div class="thumb-wrapper">
                            ${row.image_url ?
                    `<img src="${row.image_url}" class="product-thumb" loading="lazy" referrerpolicy="no-referrer" alt="图">` :
                    `<span class="no-thumb">无</span>`
                }
                        </div>
                    </td>
                    <td title="${row.product_name || row.original_name}">${row.product_name || row.original_name || '-'}</td>
                    <td>${row.product_code || '-'}</td>
                    <td><span style="font-size: 0.8rem; padding: 2px 6px; border-radius: 4px; ${sourceStyle}">${row.__source}</span></td>
                    <td style="text-align: right; font-weight: bold;">${qtyStr}</td>
                </tr>
            `;
        }).join('');

        // 绑定单选框事件
        const checkboxes = document.querySelectorAll('.welfare-checkbox');
        checkboxes.forEach(cb => {
            cb.addEventListener('change', () => {
                syncSelectAllState();
                checkSaveButtonState();
            });
        });
    }

    // 全选反选
    selectAllCheckbox.addEventListener('change', (e) => {
        const checked = e.target.checked;
        const checkboxes = document.querySelectorAll('.welfare-checkbox');
        checkboxes.forEach(cb => cb.checked = checked);
        checkSaveButtonState();
    });

    function syncSelectAllState() {
        const checkboxes = document.querySelectorAll('.welfare-checkbox');
        if (checkboxes.length === 0) return;
        const allChecked = Array.from(checkboxes).every(cb => cb.checked);
        const someChecked = Array.from(checkboxes).some(cb => cb.checked);
        selectAllCheckbox.checked = allChecked;
        selectAllCheckbox.indeterminate = someChecked && !allChecked;
    }

    function checkSaveButtonState() {
        const checkboxes = document.querySelectorAll('.welfare-checkbox:checked');
        saveBtn.disabled = checkboxes.length === 0;
    }

    // 刷新数据
    refreshBtn.addEventListener('click', () => {
        loadData();
    });

    // 清空福利排品数据表
    clearBtn.addEventListener('click', async () => {
        if (!confirm('确定要清空已经保存到 welfare_arranged_data 里的所有福利排品数据吗？此操作无法恢复。')) {
            return;
        }

        try {
            AppUtils.showLoading('正在清空数据...');
            const { error } = await window.supabaseClient
                .from('welfare_arranged_data')
                .delete()
                .gte('id', 0);

            if (error) throw error;

            AppUtils.showToast('福利排品数据已清空', 'success');
            // 可以选择清空后自动刷新或者只提示
        } catch (error) {
            console.error('清空失败:', error);
            AppUtils.showToast('清空失败: ' + error.message, 'error');
        } finally {
            AppUtils.hideLoading();
        }
    });



    // 保存选中项
    saveBtn.addEventListener('click', async () => {
        const checkedBoxes = Array.from(document.querySelectorAll('.welfare-checkbox:checked'));
        if (checkedBoxes.length === 0) return;

        const selectedRecords = checkedBoxes.map(cb => currentData[cb.dataset.idx]);

        try {
            AppUtils.showLoading('正在保存选中的商品...');

            // 1. 先清空
            const { error: delError } = await window.supabaseClient
                .from('welfare_arranged_data')
                .delete()
                .gte('id', 0);

            if (delError) throw delError;

            // 2. 构造插入数据
            const insertData = selectedRecords.map(r => ({
                source: r.__source,
                product_name: r.product_name || r.original_name,
                image_url: r.image_url,
                product_code: r.product_code,
                available_qty: typeof r.available_qty === 'number' ? r.available_qty : null
            }));

            // 3. 分批插入
            const batchSize = 100;
            for (let i = 0; i < insertData.length; i += batchSize) {
                const batch = insertData.slice(i, i + batchSize);
                const { error: insError } = await window.supabaseClient
                    .from('welfare_arranged_data')
                    .insert(batch);
                if (insError) throw insError;
            }

            AppUtils.showCenterAlert(`成功保存了 ${selectedRecords.length} 款福利商品。`, '<i data-lucide="check-circle"></i>');

            // 取消当前所有勾选
            document.querySelectorAll('.welfare-checkbox').forEach(cb => cb.checked = false);
            selectAllCheckbox.checked = false;
            selectAllCheckbox.indeterminate = false;
            checkSaveButtonState();

        } catch (error) {
            console.error('保存报错:', error);
            AppUtils.showToast('保存失败: ' + error.message, 'error');
        } finally {
            AppUtils.hideLoading();
        }
    });

    // 初始加载
    loadData();
}
