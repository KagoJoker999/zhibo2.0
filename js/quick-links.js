/**
 * 快捷链接管理 - quick_links 表
 * ========================================
 */

// ========================================
// 快捷链接：加载并显示到标题右侧
// ========================================
async function loadQuickLinks() {
    try {
        const data = await window.SupabaseClient.query('quick_links', {
            orderBy: { column: 'sort_order', ascending: true }
        });
        renderQuickLinks(data || []);
    } catch (e) {
        console.error('<i data-lucide="x-circle"></i> 加载快捷链接失败:', e);
    }
}

function renderQuickLinks(links) {
    // 找到或创建快捷链接容器
    let container = document.getElementById('quickLinksBar');
    if (!container) {
        const headerBrand = document.querySelector('.header-brand');
        if (!headerBrand) return;
        container = document.createElement('div');
        container.id = 'quickLinksBar';
        container.className = 'quick-links-bar';
        headerBrand.appendChild(container);
    }

    if (links.length === 0) {
        container.innerHTML = '';
        container.style.display = 'none';
        return;
    }

    container.style.display = 'flex';
    container.innerHTML = links.map(link => `
        <a href="${escapeHtml(link.url)}" target="_blank" rel="noopener noreferrer" 
           class="quick-link-chip" title="${escapeHtml(link.url)}">
            ${escapeHtml(link.name)}
        </a>
    `).join('');
}

// ========================================
// 快捷链接管理弹窗
// ========================================
async function openQuickLinksManager() {
    // 移除已有弹窗
    const existing = document.querySelector('.ql-modal-overlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.className = 'ql-modal-overlay';
    overlay.innerHTML = `
        <div class="ql-modal">
            <div class="ql-modal-header">
                <h3>导航链接管理</h3>
                <span class="ql-modal-subtitle">数据库表：quick_links</span>
                <button class="ql-modal-close" title="关闭"><i data-lucide="x"></i></button>
            </div>
            <div class="ql-modal-body">
                <!-- 添加区域 -->
                <div class="ql-add-form">
                    <div class="ql-add-row">
                        <input type="text" id="qlNewName" class="ql-input" placeholder="链接名称" maxlength="20">
                        <input type="text" id="qlNewUrl" class="ql-input ql-input-url" placeholder="网址 (https://...)" >
                        <button class="btn btn-primary ql-add-btn" id="qlAddBtn">添加</button>
                    </div>
                </div>
                <!-- 列表区域 -->
                <div class="ql-list" id="qlList">
                    <div class="ql-loading">加载中...</div>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(overlay);

    // 绑定关闭
    overlay.querySelector('.ql-modal-close').addEventListener('click', () => closeModal(overlay));
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeModal(overlay);
    });

    // 绑定添加
    overlay.querySelector('#qlAddBtn').addEventListener('click', () => handleAddLink(overlay));
    // 回车也能添加
    overlay.querySelector('#qlNewUrl').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') handleAddLink(overlay);
    });

    // 加载列表
    await refreshLinkList(overlay);
}

function closeModal(overlay) {
    overlay.style.animation = 'fadeIn 0.2s ease reverse';
    setTimeout(() => overlay.remove(), 200);
}

async function refreshLinkList(overlay) {
    const listEl = overlay.querySelector('#qlList');
    try {
        const data = await window.SupabaseClient.query('quick_links', {
            orderBy: { column: 'sort_order', ascending: true }
        });

        if (!data || data.length === 0) {
            listEl.innerHTML = '<div class="ql-empty">暂无链接，请在上方添加</div>';
            return;
        }

        listEl.innerHTML = data.map((item, idx) => `
            <div class="ql-item" data-id="${item.id}">
                <span class="ql-item-order">${idx + 1}</span>
                <span class="ql-item-name" title="${escapeHtml(item.name)}">${escapeHtml(item.name)}</span>
                <a href="${escapeHtml(item.url)}" target="_blank" rel="noopener noreferrer" class="ql-item-url" title="${escapeHtml(item.url)}">${escapeHtml(item.url)}</a>
                <div class="ql-item-actions">
                    <button class="ql-btn-sort" title="上移" onclick="moveLink(${item.id}, 'up', this)"><i data-lucide="chevron-up"></i></button>
                    <button class="ql-btn-sort" title="下移" onclick="moveLink(${item.id}, 'down', this)"><i data-lucide="chevron-down"></i></button>
                    <button class="ql-btn-del" title="删除" onclick="deleteLink(${item.id}, this)"><i data-lucide="trash-2"></i></button>
                </div>
            </div>
        `).join('');
    } catch (e) {
        listEl.innerHTML = '<div class="ql-empty" style="color:var(--error-color);">加载失败</div>';
        console.error('<i data-lucide="x-circle"></i> 加载链接列表失败:', e);
    }
}

async function handleAddLink(overlay) {
    const nameInput = overlay.querySelector('#qlNewName');
    const urlInput = overlay.querySelector('#qlNewUrl');
    const name = nameInput.value.trim();
    let url = urlInput.value.trim();

    if (!name) {
        showToast('请输入链接名称', 'warning');
        nameInput.focus();
        return;
    }
    if (!url) {
        showToast('请输入网址', 'warning');
        urlInput.focus();
        return;
    }

    // 自动补全 https://
    if (!/^https?:\/\//i.test(url)) {
        url = 'https://' + url;
    }

    try {
        // 获取当前最大 sort_order
        const existing = await window.SupabaseClient.query('quick_links', {
            orderBy: { column: 'sort_order', ascending: false },
            limit: 1
        });
        const maxOrder = existing && existing.length > 0 ? (existing[0].sort_order || 0) : 0;

        await window.SupabaseClient.insert('quick_links', {
            name: name,
            url: url,
            sort_order: maxOrder + 1
        });

        showToast('链接已添加', 'success');
        nameInput.value = '';
        urlInput.value = '';
        nameInput.focus();

        await refreshLinkList(overlay);
        await loadQuickLinks(); // 刷新标题栏
    } catch (e) {
        showToast('添加失败: ' + e.message, 'error');
        console.error('<i data-lucide="x-circle"></i> 添加链接失败:', e);
    }
}

async function deleteLink(id, btnEl) {
    if (!confirm('确定删除此链接？')) return;

    try {
        await window.SupabaseClient.delete('quick_links', { id: id });
        showToast('已删除', 'success');

        const overlay = document.querySelector('.ql-modal-overlay');
        if (overlay) await refreshLinkList(overlay);
        await loadQuickLinks();
    } catch (e) {
        showToast('删除失败', 'error');
        console.error('<i data-lucide="x-circle"></i> 删除链接失败:', e);
    }
}

async function moveLink(id, direction, btnEl) {
    try {
        const data = await window.SupabaseClient.query('quick_links', {
            orderBy: { column: 'sort_order', ascending: true }
        });
        if (!data) return;

        const idx = data.findIndex(item => item.id === id);
        if (idx === -1) return;

        const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
        if (swapIdx < 0 || swapIdx >= data.length) return;

        // 交换 sort_order
        const currentOrder = data[idx].sort_order;
        const swapOrder = data[swapIdx].sort_order;

        await window.SupabaseClient.update('quick_links', { sort_order: swapOrder }, { id: data[idx].id });
        await window.SupabaseClient.update('quick_links', { sort_order: currentOrder }, { id: data[swapIdx].id });

        const overlay = document.querySelector('.ql-modal-overlay');
        if (overlay) await refreshLinkList(overlay);
        await loadQuickLinks();
    } catch (e) {
        showToast('排序失败', 'error');
        console.error('<i data-lucide="x-circle"></i> 排序失败:', e);
    }
}

// HTML 转义
function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// 暴露到全局
window.loadQuickLinks = loadQuickLinks;
window.openQuickLinksManager = openQuickLinksManager;
window.deleteLink = deleteLink;
window.moveLink = moveLink;
