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
    pageTitle: document.getElementById('pageTitle'),
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
    'arrangement-mapping': { title: '对照表生成', icon: '📋' },
    'new-product': { title: '新品处理', icon: '🆕' },
    'new-product-upload': { title: '新品数据上传', icon: '🆕' },
    'new-product-process': { title: '新品数据处理', icon: '🆕' },
    'new-product-download': { title: '新品数据下载', icon: '🆕' },
    'new-product-settings': { title: '新品处理设置', icon: '🆕' },
    'coupon': { title: '发券品处理', icon: '🎟️' },
    'coupon-upload': { title: '发券品数据上传', icon: '🎟️' },
    'coupon-process': { title: '发券品数据处理', icon: '🎟️' },
    'coupon-download': { title: '发券品数据下载', icon: '🎟️' },
    'coupon-settings': { title: '发券品处理设置', icon: '🎟️' },
    'mapping': { title: '排品对照功能', icon: '🔗' }
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

    // 监听 hash 变化
    window.addEventListener('hashchange', handleHashChange);

    console.log('📡 直播辅助工具已启动');
});

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
    // 更新 URL hash
    window.location.hash = page;

    // 更新导航状态
    updateNavState(page);

    // 加载页面内容
    loadPage(page);

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

    // 更新页面标题
    DOM.pageTitle.textContent = config.title;
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
                // 延迟初始化，确保 DOM 已渲染
                setTimeout(() => uploadPage.init(), 50);
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
    showLoading,
    hideLoading,
    updateStatus,
    formatFileSize,
    debounce,
    formatDate
};
