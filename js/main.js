/**
 * 直播辅助工具 - 主脚本
 * ========================================
 */

// ========================================
// 应用状态管理
// ========================================
const AppState = {
    currentPage: 'welcome',
    isLoading: false,
    sidebarOpen: false
};

// ========================================
// DOM 元素引用
// ========================================
const DOM = {
    sidebar: document.getElementById('sidebar'),
    menuToggle: document.getElementById('menuToggle'),
    contentBody: document.getElementById('contentBody'),
    welcomeSection: document.getElementById('welcomeSection'),
    pageContainer: document.getElementById('pageContainer'),
    toastContainer: document.getElementById('toastContainer'),
    loadingOverlay: document.getElementById('loadingOverlay'),
    statusIndicator: document.getElementById('statusIndicator')
};

// ========================================
// 页面配置
// ========================================
const PageConfig = {
    'welcome': { title: '欢迎使用', icon: '🚀' },
    'upload': { title: '上传功能', icon: '📤' },
    'upload-ranking': { title: '排名数据上传', icon: '📤' },
    'upload-product-id': { title: '商品 ID 上传', icon: '📤' },
    'upload-inventory': { title: '库存数据上传', icon: '📤' },
    'arrangement': { title: '排品功能', icon: '📋' },
    'arrangement-upload': { title: '基础数据上传', icon: '📋' },
    'arrangement-main': { title: '排品功能', icon: '📋' },
    'arrangement-settings': { title: '排品设置', icon: '📋' },
    'arrangement-assignment': { title: '排品序号分配', icon: '🔢' },
    'arrangement-exclusion': { title: '排除商品设置', icon: '🚫' },
    'arrangement-check': { title: '排品检查', icon: '🔍' },
    'arrangement-scoring': { title: '评分设置', icon: '⚙️' },
    'arrangement-mapping': { title: '对照表生成', icon: '📋' },
    'new-product': { title: '新品处理', icon: '🆕' },
    'new-product-upload': { title: '新品数据上传', icon: '🆕' },
    'new-product-process': { title: '新品数据处理', icon: '🆕' },
    'new-product-download': { title: '新品数据下载', icon: '🆕' },
    'new-product-settings': { title: '新品处理设置', icon: '🆕' },
    'new-product-rules': { title: '新品序号分配', icon: '🔢' },
    'welfare-ranking': { title: '福利排品', icon: '🎁' },
    'coupon': { title: '发券品处理', icon: '🎟️' },
    'coupon-upload': { title: '发券品数据上传', icon: '🎟️' },
    'coupon-process': { title: '发券品数据处理', icon: '🎟️' },
    'coupon-download': { title: '发券品数据下载', icon: '🎟️' },
    'coupon-settings': { title: '发券品处理设置', icon: '🎟️' },
    'mapping': { title: '排品结果推送', icon: '🔗' },
    'mapping-history': { title: '历史记录', icon: '📜' },
    'mapping-settings': { title: '对照设置', icon: '⚙️' },
    'sub-ranking': { title: '小号排品', icon: '📦' },
    'sub-ranking-settings': { title: '小号排品设置', icon: '⚙️' },
    'other-tools': { title: '其他功能', icon: '🧰' },
    'livestream-additional-investment': { title: '追投计算', icon: '💰' },
    'presale': { title: '关闭预售', icon: '📋' },
    'shadowbot': { title: '影刀转换', icon: '🤖' },
    'id-converter': { title: 'ID 转换', icon: '🔄' }
};

// ========================================
// 初始化
// ========================================
document.addEventListener('DOMContentLoaded', () => {
    // 初始化 Supabase 客户端
    initSupabaseClient();

    initNavigation();
    initMobileMenu();
    handleHashChange();

    // 更新数据库空间显示
    updateDbUsage();

    // 加载快捷链接
    setTimeout(() => {
        if (window.loadQuickLinks) window.loadQuickLinks();
    }, 100);

    // 监听 hash 变化
    window.addEventListener('hashchange', handleHashChange);

    console.log('📡 直播辅助工具已启动');
});

// 查询数据库空间使用情况（每24小时刷新一次）
async function updateDbUsage() {
    const dbUsageText = document.getElementById('dbUsageText');
    if (!dbUsageText || !window.supabaseClient) return;

    const CACHE_KEY = 'db_usage_cache';
    const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24小时（毫秒）
    const totalMB = 500;

    // 检查缓存
    try {
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
            const { usedMB, timestamp } = JSON.parse(cached);
            const now = Date.now();
            if (now - timestamp < CACHE_DURATION) {
                // 缓存未过期，使用缓存值
                const remainMB = (totalMB - parseFloat(usedMB)).toFixed(0);
                dbUsageText.textContent = `${usedMB}MB / ${totalMB}MB（剩余 ${remainMB}MB）`;
                return;
            }
        }
    } catch (e) {
        // 缓存读取失败，继续查询
    }

    let usedMB = '0.0';

    try {
        // 优先调用 RPC 函数获取真实数据库大小
        const { data, error } = await window.supabaseClient.rpc('get_database_size');

        if (!error && data && data.size_mb !== undefined) {
            usedMB = parseFloat(data.size_mb).toFixed(2);
            console.log('📊 数据库大小（RPC）:', usedMB, 'MB');
        } else {
            // RPC 失败，回退到估算方式
            console.warn('⚠️ RPC 获取数据库大小失败，使用估算方式:', error?.message);
            const tables = ['inventory_data', 'product_id', 'new_product_data', 'ranking_config'];
            let totalRecords = 0;

            for (const table of tables) {
                const { count } = await window.supabaseClient
                    .from(table)
                    .select('*', { count: 'exact', head: true });
                totalRecords += count || 0;
            }

            // 估算：每条记录约 0.5KB
            const usedKB = totalRecords * 0.5;
            usedMB = (usedKB / 1024).toFixed(2);
        }

        const remainMB = (totalMB - parseFloat(usedMB)).toFixed(0);

        // 保存到缓存
        try {
            localStorage.setItem(CACHE_KEY, JSON.stringify({
                usedMB: usedMB,
                timestamp: Date.now()
            }));
        } catch (e) {
            // 缓存写入失败，忽略
        }

        dbUsageText.textContent = `${usedMB}MB / ${totalMB}MB（剩余 ${remainMB}MB）`;
    } catch (e) {
        console.error('❌ 获取数据库大小失败:', e);
        dbUsageText.textContent = '-- / 500MB';
    }
}

// 暴露给全局，方便其他模块调用刷新
window.updateDbUsage = updateDbUsage;

// 初始化 Supabase
function initSupabaseClient() {
    if (typeof supabase !== 'undefined' && supabase.createClient) {
        window.supabaseClient = supabase.createClient(
            'https://ugadhdhwixrejzfcwugj.supabase.co',
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVnYWRoZGh3aXhyZWp6ZmN3dWdqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYyMzU3NTgsImV4cCI6MjA4MTgxMTc1OH0.XQp5pvoM-nSGfLZB9ZGfxJCkU3GbeiWrBohA_XchS54'
        );
        console.log('✅ Supabase 客户端已初始化');
    } else {
        console.warn('⚠️ Supabase SDK 尚未加载');
    }
}

// ========================================
// 导航功能
// ========================================
function initNavigation() {
    const navLinks = document.querySelectorAll('.nav-link, .nav-submenu a');

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            const page = link.dataset.page || link.dataset.section;

            // 如果是有子菜单的主菜单项，切换展开状态
            const navItem = link.closest('.nav-item');
            const submenu = navItem?.querySelector('.nav-submenu');
            if (submenu && link.classList.contains('nav-link')) {
                e.preventDefault();
                // 关闭其他展开的菜单
                document.querySelectorAll('.nav-item.expanded').forEach(item => {
                    if (item !== navItem) item.classList.remove('expanded');
                });
                navItem.classList.toggle('expanded');

                // 【核心修改】主菜单如果有子菜单（并且不是像 mapping/arrangement 这种自身也是一个页面的情况），
                // 且明确不想要展示未开发页面（如 other-tools），在这里做拦截。
                // 我们直接将只展开菜单的父节点，不进行页面导航，除非它指定需要导航。
                // 为了兼容旧的，目前 other-tools 会在 loadPage 触发兜底的“开发中”页面。
                // 解决办法：如果点击的是 other-tools，只展开，不导航。
                if (page === 'other-tools') {
                    // 如果本身停留在 welcome ，或者不想改变 hash，直接 return
                    return;
                }

                // 如果有 data-page，同时也加载页面
                if (page) {
                    navigateTo(page);
                }
                return;
            }

            if (page) {
                e.preventDefault();
                navigateTo(page);
            }
        });
    });
}

function navigateTo(page) {
    // 只更新 URL hash，让 hashchange 事件来处理页面加载
    // 避免重复调用 loadPage
    if (window.location.hash.slice(1) === page) {
        // 如果 hash 没变，手动加载一次
        updateNavState(page);
        loadPage(page);
    } else {
        // hash 变化会触发 hashchange 事件，由 handleHashChange 处理
        window.location.hash = page;
    }

    // 移动端关闭侧边栏
    if (window.innerWidth <= 768) {
        toggleSidebar(false);
    }
}

function handleHashChange() {
    const hash = window.location.hash.slice(1) || 'upload';  // 默认显示上传功能
    updateNavState(hash);
    loadPage(hash);
}

function updateNavState(page) {
    // 移除所有 active 状态
    document.querySelectorAll('.nav-link, .nav-submenu a').forEach(link => {
        link.classList.remove('active');
    });

    // 添加当前页面的 active 状态
    const activeLink = document.querySelector(`[data-page="${page}"]`) ||
        document.querySelector(`[data-section="${page}"]`);
    if (activeLink) {
        activeLink.classList.add('active');

        // 如果是子菜单项，也激活父级
        const parentNavItem = activeLink.closest('.nav-item');
        if (parentNavItem) {
            const parentLink = parentNavItem.querySelector('.nav-link');
            if (parentLink) {
                parentLink.classList.add('active');
            }
        }
    }
}

function loadPage(page) {
    const config = PageConfig[page] || PageConfig['welcome'];

    // 更新浏览器标签标题
    document.title = `${config.title} - 直播辅助工具`;

    // 显示对应内容
    if (page === 'welcome') {
        DOM.welcomeSection.style.display = 'flex';
        DOM.pageContainer.style.display = 'none';
    } else {
        DOM.welcomeSection.style.display = 'none';
        DOM.pageContainer.style.display = 'block';

        // 检查是否有上传页面加载器
        if (window.loadUploadPage && (page === 'upload' || page.startsWith('upload-'))) {
            const uploadPage = window.loadUploadPage(page);
            if (uploadPage) {
                DOM.pageContainer.innerHTML = uploadPage.html;
                setTimeout(() => uploadPage.init(), 50);
                AppState.currentPage = page;
                return;
            }
        }

        // 检查是否有新品处理页面加载器
        if (window.loadNewProductPage && (page === 'new-product' || page.startsWith('new-product-'))) {
            const newProductPage = window.loadNewProductPage(page);
            if (newProductPage) {
                DOM.pageContainer.innerHTML = newProductPage.html;
                setTimeout(() => newProductPage.init(), 50);
                AppState.currentPage = page;
                return;
            }
        }

        // 检查是否有排品功能页面加载器
        if (window.loadRankingPage) {
            let rankingPageId = null;
            if (page === 'arrangement' || page === 'arrangement-main') {
                rankingPageId = 'ranking';
            } else if (page === 'arrangement-settings' || page === 'arrangement-assignment') {
                rankingPageId = 'ranking-settings';
            } else if (page === 'arrangement-exclusion') {
                rankingPageId = 'ranking-exclusion';
            } else if (page === 'arrangement-check') {
                rankingPageId = 'ranking-check';
            } else if (page === 'arrangement-scoring') {
                rankingPageId = 'ranking-scoring';
            }
            if (rankingPageId) {
                const rankingPage = window.loadRankingPage(rankingPageId);
                if (rankingPage) {
                    DOM.pageContainer.innerHTML = rankingPage.html;
                    setTimeout(() => rankingPage.init(), 50);
                    AppState.currentPage = page;
                    return;
                }
            }
        }

        // 检查是否有排品推送页面加载器
        if (window.loadMappingPage && (page === 'mapping' || page.startsWith('mapping-'))) {
            const mappingPage = window.loadMappingPage(page);
            if (mappingPage) {
                DOM.pageContainer.innerHTML = mappingPage.html;
                setTimeout(() => mappingPage.init(), 50);
                AppState.currentPage = page;
                return;
            }
        }

        // 检查是否有福利排品页面加载器
        if (window.loadWelfareRankingPage && page === 'welfare-ranking') {
            const welfarePage = window.loadWelfareRankingPage();
            if (welfarePage) {
                DOM.pageContainer.innerHTML = welfarePage.html;
                setTimeout(() => welfarePage.init(), 50);
                AppState.currentPage = page;
                return;
            }
        }

        // 检查是否有小号排品页面加载器
        if (window.loadSubRankingPage && (page === 'sub-ranking' || page.startsWith('sub-ranking-'))) {
            const subRankingPage = window.loadSubRankingPage(page);
            if (subRankingPage) {
                DOM.pageContainer.innerHTML = subRankingPage.html;
                setTimeout(() => subRankingPage.init(), 50);
                AppState.currentPage = page;
                return;
            }
        }

        // 检查是否有发券品处理页面加载器
        if (window.loadCouponPage && (page === 'coupon' || page.startsWith('coupon-'))) {
            const couponPage = window.loadCouponPage(page);
            if (couponPage) {
                DOM.pageContainer.innerHTML = couponPage.html;
                setTimeout(() => couponPage.init(), 50);
                AppState.currentPage = page;
                return;
            }
        }

        // 检查是否有追投计算页面加载器
        if (window.loadInvestmentPage && page === 'livestream-additional-investment') {
            const investmentPage = window.loadInvestmentPage(page);
            if (investmentPage) {
                DOM.pageContainer.innerHTML = investmentPage.html;
                setTimeout(() => investmentPage.init(), 50);
                AppState.currentPage = page;
                return;
            }
        }

        // 检查是否有关预售表页面加载器
        if (window.loadPresalePage && page === 'presale') {
            const presalePage = window.loadPresalePage(page);
            if (presalePage) {
                DOM.pageContainer.innerHTML = presalePage.html;
                setTimeout(() => presalePage.init(), 50);
                AppState.currentPage = page;
                return;
            }
        }

        // 检查是否有影刀转换页面加载器
        if (window.loadShadowbotPage && page === 'shadowbot') {
            const shadowbotPage = window.loadShadowbotPage(page);
            if (shadowbotPage) {
                DOM.pageContainer.innerHTML = shadowbotPage.html;
                setTimeout(() => shadowbotPage.init(), 50);
                AppState.currentPage = page;
                return;
            }
        }

        // 检查是否有ID转换页面加载器
        if (window.loadIdConverterPage && page === 'id-converter') {
            const idConverterPage = window.loadIdConverterPage(page);
            if (idConverterPage) {
                DOM.pageContainer.innerHTML = idConverterPage.html;
                setTimeout(() => idConverterPage.init(), 50);
                AppState.currentPage = page;
                return;
            }
        }

        // 其他页面显示占位内容
        DOM.pageContainer.innerHTML = `
            <div class="placeholder-content">
                <div class="placeholder-icon">${config.icon}</div>
                <h3>${config.title}</h3>
                <p>此功能正在开发中，敬请期待...</p>
            </div>
        `;
    }

    AppState.currentPage = page;
}

// ========================================
// 移动端菜单
// ========================================
function initMobileMenu() {
    DOM.menuToggle?.addEventListener('click', () => {
        toggleSidebar();
    });

    // 点击遮罩关闭
    document.addEventListener('click', (e) => {
        if (AppState.sidebarOpen &&
            !DOM.sidebar.contains(e.target) &&
            !DOM.menuToggle.contains(e.target)) {
            toggleSidebar(false);
        }
    });
}

function toggleSidebar(forceState) {
    AppState.sidebarOpen = forceState ?? !AppState.sidebarOpen;
    DOM.sidebar.classList.toggle('open', AppState.sidebarOpen);
}

// ========================================
// Toast 提示
// ========================================
function showToast(message, type = 'info', duration = 3000) {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;

    DOM.toastContainer.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'slideIn 0.3s ease reverse';
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

/**
 * 显示页面中央红色警告提示
 * @param {string} message - 提示消息
 * @param {string} icon - 图标（可选，默认⚠️）
 */
function showCenterAlert(message, icon = '⚠️') {
    // 移除已有的提示
    const existing = document.querySelector('.center-alert-overlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.className = 'center-alert-overlay';
    overlay.innerHTML = `
        <div class="center-alert">
            <div class="center-alert-icon">${icon}</div>
            <div class="center-alert-message">${message}</div>
            <button class="center-alert-close">知道了</button>
        </div>
    `;

    document.body.appendChild(overlay);

    // 绑定关闭事件
    const closeBtn = overlay.querySelector('.center-alert-close');
    closeBtn.addEventListener('click', () => {
        overlay.style.animation = 'fadeIn 0.2s ease reverse';
        setTimeout(() => overlay.remove(), 200);
    });

    // 点击遮罩关闭
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            overlay.style.animation = 'fadeIn 0.2s ease reverse';
            setTimeout(() => overlay.remove(), 200);
        }
    });
}

/**
 * 显示商品替换弹窗
 * @param {Object} removedItem - 被删除的商品 { name, image }
 * @param {Object} addedItem - 补充的商品 { name, image }
 * @param {string} action - 操作类型 'replace' 或 'undo'
 */
function showReplaceModal(removedItem, addedItem, action = 'replace') {
    // 移除已有的提示
    const existing = document.querySelector('.replace-modal-overlay');
    if (existing) existing.remove();

    // 截取简短名称（保留「后面的内容，最多20个字符）
    const shortenName = (name) => {
        if (!name) return '未知商品';
        let shortName = name;
        if (name.includes('「')) {
            shortName = name.substring(name.indexOf('「'));
        }
        return shortName.length > 20 ? shortName.substring(0, 20) + '...' : shortName;
    };

    const removedName = shortenName(removedItem?.name);
    const addedName = shortenName(addedItem?.name);
    const removedImage = removedItem?.image || '';
    const addedImage = addedItem?.image || '';

    // 根据操作类型设置标题和图标
    const isUndo = action === 'undo';
    const title = isUndo ? '已撤回替换' : '商品已替换';
    const arrowIcon = isUndo ? '↩️' : '➡️';
    const bgColor = isUndo ? 'rgba(34, 197, 94, 0.95)' : 'rgba(59, 130, 246, 0.95)';

    const overlay = document.createElement('div');
    overlay.className = 'replace-modal-overlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.6);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        animation: fadeIn 0.2s ease;
    `;

    overlay.innerHTML = `
        <div class="replace-modal" style="
            background: ${bgColor};
            border-radius: 16px;
            padding: 1.5rem;
            max-width: 400px;
            width: 90%;
            text-align: center;
            color: white;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
        ">
            <div style="font-size: 1.1rem; font-weight: 600; margin-bottom: 1rem;">${title}</div>
            
            <div style="display: flex; align-items: center; justify-content: center; gap: 1rem;">
                <!-- 被删除/原商品 -->
                <div style="flex: 1; text-align: center;">
                    <div style="
                        width: 80px;
                        height: 80px;
                        margin: 0 auto 0.5rem;
                        border-radius: 8px;
                        overflow: hidden;
                        background: rgba(255,255,255,0.2);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    ">
                        ${removedImage
            ? `<img src="${removedImage.split(',')[0].trim()}" style="width: 100%; height: 100%; object-fit: cover;" referrerpolicy="no-referrer" onerror="this.parentElement.innerHTML='<span style=\\'font-size:2rem;\\'>📦</span>'">`
            : '<span style="font-size: 2rem;">📦</span>'
        }
                    </div>
                    <div style="font-size: 0.85rem; opacity: 0.9; max-width: 120px; margin: 0 auto; word-break: break-all;">${removedName}</div>
                </div>
                
                <!-- 箭头 -->
                <div style="font-size: 2rem;">${arrowIcon}</div>
                
                <!-- 补充的商品 -->
                <div style="flex: 1; text-align: center;">
                    <div style="
                        width: 80px;
                        height: 80px;
                        margin: 0 auto 0.5rem;
                        border-radius: 8px;
                        overflow: hidden;
                        background: rgba(255,255,255,0.2);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    ">
                        ${addedImage
            ? `<img src="${addedImage.split(',')[0].trim()}" style="width: 100%; height: 100%; object-fit: cover;" referrerpolicy="no-referrer" onerror="this.parentElement.innerHTML='<span style=\\'font-size:2rem;\\'>📦</span>'">`
            : '<span style="font-size: 2rem;">📦</span>'
        }
                    </div>
                    <div style="font-size: 0.85rem; opacity: 0.9; max-width: 120px; margin: 0 auto; word-break: break-all;">${addedName}</div>
                </div>
            </div>
            
            <button class="replace-modal-close" style="
                margin-top: 1.25rem;
                padding: 0.5rem 2rem;
                background: rgba(255,255,255,0.2);
                border: none;
                border-radius: 8px;
                color: white;
                font-size: 0.9rem;
                cursor: pointer;
                transition: background 0.2s;
            " onmouseover="this.style.background='rgba(255,255,255,0.3)'" onmouseout="this.style.background='rgba(255,255,255,0.2)'">知道了</button>
        </div>
    `;

    document.body.appendChild(overlay);

    // 绑定关闭事件
    const closeBtn = overlay.querySelector('.replace-modal-close');
    closeBtn.addEventListener('click', () => {
        overlay.style.animation = 'fadeIn 0.2s ease reverse';
        setTimeout(() => overlay.remove(), 200);
    });

    // 点击遮罩关闭
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            overlay.style.animation = 'fadeIn 0.2s ease reverse';
            setTimeout(() => overlay.remove(), 200);
        }
    });

    // 3秒后自动关闭
    setTimeout(() => {
        if (document.body.contains(overlay)) {
            overlay.style.animation = 'fadeIn 0.2s ease reverse';
            setTimeout(() => overlay.remove(), 200);
        }
    }, 3000);
}

// ========================================
// 加载状态
// ========================================
function showLoading(text = '处理中...') {
    AppState.isLoading = true;
    DOM.loadingOverlay.querySelector('.loading-text').textContent = text;
    DOM.loadingOverlay.classList.add('active');
}

function hideLoading() {
    AppState.isLoading = false;
    DOM.loadingOverlay.classList.remove('active');
}

// ========================================
// 状态指示器
// ========================================
function updateStatus(text, type = 'ready') {
    const statusDot = DOM.statusIndicator.querySelector('.status-dot');
    const statusText = DOM.statusIndicator.querySelector('.status-text');

    statusText.textContent = text;

    const colors = {
        ready: 'var(--success-color)',
        processing: 'var(--warning-color)',
        error: 'var(--error-color)',
        info: 'var(--info-color)'
    };

    statusDot.style.background = colors[type] || colors.ready;
}

// ========================================
// 工具函数（供后续功能使用）
// ========================================

/**
 * 格式化文件大小
 */
function formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * 防抖函数
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * 日期格式化
 */
function formatDate(date, format = 'YYYY-MM-DD HH:mm:ss') {
    const d = new Date(date);
    const replacements = {
        'YYYY': d.getFullYear(),
        'MM': String(d.getMonth() + 1).padStart(2, '0'),
        'DD': String(d.getDate()).padStart(2, '0'),
        'HH': String(d.getHours()).padStart(2, '0'),
        'mm': String(d.getMinutes()).padStart(2, '0'),
        'ss': String(d.getSeconds()).padStart(2, '0')
    };

    return format.replace(/YYYY|MM|DD|HH|mm|ss/g, match => replacements[match]);
}

// 导出工具函数供其他模块使用
window.AppUtils = {
    showToast,
    showCenterAlert,
    showReplaceModal,
    showLoading,
    hideLoading,
    updateStatus,
    formatFileSize,
    debounce,
    formatDate
};
