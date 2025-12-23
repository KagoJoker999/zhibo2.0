
document.addEventListener('DOMContentLoaded', () => {
    // 状态管理
    const state = {
        currentTab: 'ranking', // 'ranking' or 'sub_ranking'
        data: {
            ranking: [],
            sub_ranking: []
        },
        isLoading: false
    };

    // DOM 元素
    const elements = {
        tabs: document.querySelectorAll('.tab-item'),
        refreshBtn: document.getElementById('refreshBtn'),
        rankingList: document.getElementById('rankingList'),
        subRankingList: document.getElementById('subRankingList'),
        rankingCount: document.getElementById('rankingCount'),
        subRankingCount: document.getElementById('subRankingCount'),
        imageViewer: document.getElementById('imageViewer'),
        viewerImage: document.getElementById('viewerImage'),
        toastContainer: document.getElementById('toastContainer')
    };

    // 初始化
    async function init() {
        setupEventListeners();
        // 初始加载
        await loadAllData();
    }

    // 事件监听
    function setupEventListeners() {
        // 标签切换
        elements.tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const targetTab = tab.dataset.tab;
                switchTab(targetTab);
            });
        });

        // 刷新
        elements.refreshBtn.addEventListener('click', async () => {
            if (state.isLoading) return;
            await loadData(state.currentTab);
        });

        // 图片查看器关闭
        elements.imageViewer.addEventListener('click', () => {
            elements.imageViewer.classList.remove('active');
            elements.viewerImage.src = '';
        });
    }

    // 切换标签
    function switchTab(tabName) {
        state.currentTab = tabName;

        // 更新 Tab 样式
        elements.tabs.forEach(tab => {
            if (tab.dataset.tab === tabName) {
                tab.classList.add('active');
            } else {
                tab.classList.remove('active');
            }
        });

        // 更新列表显示
        if (tabName === 'ranking') {
            elements.rankingList.style.display = 'block';
            elements.subRankingList.style.display = 'none';
        } else {
            elements.rankingList.style.display = 'none';
            elements.subRankingList.style.display = 'block';
        }

        // 如果该标签页没有数据，则加载
        if (state.data[tabName].length === 0) {
            loadData(tabName);
        }
    }

    // 加载所有数据
    async function loadAllData() {
        await Promise.all([
            loadData('ranking'),
            loadData('sub_ranking')
        ]);
    }

    // 加载数据
    async function loadData(type) {
        if (!window.supabaseClient) {
            showToast('Supabase Client 未初始化', 'error');
            return;
        }

        state.isLoading = true;
        updateLoadingState(type, true);

        try {
            const table = type === 'ranking' ? 'ranking_results' : 'sub_ranking_results';
            let query = window.supabaseClient.from(table).select('*');

            // 排序逻辑
            if (type === 'ranking') {
                // 大号排品通常按 rating_rank 或 ranking_result
                query = query.order('rating_rank', { ascending: true });
            } else {
                // 小号排品按 sample_number
                query = query.order('sample_number', { ascending: true });
            }

            const { data, error } = await query;

            if (error) throw error;

            state.data[type] = data || [];
            renderList(type, state.data[type]);
            updateCount(type, state.data[type].length);

            showToast('数据已更新', 'success');
        } catch (error) {
            console.error('加载失败:', error);
            showToast('加载失败: ' + error.message, 'error');
            renderError(type, error.message);
        } finally {
            state.isLoading = false;
            updateLoadingState(type, false);
        }
    }

    // 更新加载状态 UI
    function updateLoadingState(type, isLoading) {
        const list = type === 'ranking' ? elements.rankingList : elements.subRankingList;
        if (isLoading) {
            list.innerHTML = `
                <div class="loading-state">
                    <div class="spinner"></div>
                    <p>加载中...</p>
                </div>
            `;
        }
    }

    // 更新数量
    function updateCount(type, count) {
        const el = type === 'ranking' ? elements.rankingCount : elements.subRankingCount;
        if (el) el.textContent = count;
    }

    // 渲染列表
    function renderList(type, data) {
        const list = type === 'ranking' ? elements.rankingList : elements.subRankingList;
        list.innerHTML = '';

        if (!data || data.length === 0) {
            list.innerHTML = `
                <div class="loading-state">
                    <p>暂无数据</p>
                </div>
            `;
            return;
        }

        data.forEach(item => {
            const card = createCard(type, item);
            list.appendChild(card);
        });
    }

    // 创建卡片
    function createCard(type, item) {
        const card = document.createElement('div');
        card.className = 'product-card';

        // 序号显示逻辑
        let seq = '';
        if (type === 'ranking') {
            // 大号排品：优先显示 ranking_result
            seq = item.ranking_result || item.sample_number || '-';
        } else {
            // 小号排品：优先显示 sample_number
            seq = item.sample_number || item.ranking_result || '-';
        }

        // 图片逻辑
        const placeholderImg = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiB2aWV3Qm94PSIwIDAgMTAwIDEwMCI+PHJlY3Qgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMDAiIGZpbGw9IiMzMzMiLz48dGV4dCB4PSI1MCIgeT0iNTAiIGRvbS1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjNjY2Ij5ObzwvdGV4dD48dGV4dCB4PSI1MCIgeT0iNzAiIGRvbS1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjNjY2Ij5JbWFnZTwvdGV4dD48L3N2Zz4=';
        // 处理多个图片，取第一个
        const images = (item.image_url || '').split(',').map(s => s.trim()).filter(Boolean);
        const mainImage = images[0] || placeholderImg;

        card.innerHTML = `
            <div class="card-image-wrapper">
                <img src="${mainImage}" class="card-image" loading="lazy" alt="${item.product_name}">
            </div>
            <div class="card-content">
                <div class="card-header">
                    <div class="card-seq">${seq}</div>
                </div>
                <div class="card-title copyable" data-copy="${item.product_name}">${item.product_name || '未命名商品'}</div>
                <div class="card-info-grid">
                    <div class="info-item">
                        <span class="info-label">仓位</span>
                        <span class="info-value">${item.warehouse || '-'}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">样品仓位</span>
                        <span class="info-value">${item.sample_warehouse || '-'}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">实际库存数</span>
                        <span class="info-value">${item.actual_stock || '0'}</span>
                    </div>
                    <div class="info-item" style="grid-column: span 3;">
                         <span class="info-label">商品编码</span>
                         <span class="info-value copyable" data-copy="${item.product_code || ''}">${item.product_code || '-'}</span>
                    </div>
                </div>
            </div>
        `;

        // 绑定事件
        // 图片点击放大
        const img = card.querySelector('.card-image');
        img.addEventListener('click', (e) => {
            if (mainImage !== placeholderImg) {
                showImageViewer(mainImage);
            }
        });

        // 复制功能
        card.querySelectorAll('.copyable').forEach(el => {
            el.addEventListener('click', (e) => {
                const text = el.dataset.copy;
                if (text) {
                    copyToClipboard(text);
                    e.stopPropagation(); // 防止冒泡
                }
            });
        });

        return card;
    }

    // 渲染错误
    function renderError(type, message) {
        const list = type === 'ranking' ? elements.rankingList : elements.subRankingList;
        list.innerHTML = `
            <div class="loading-state">
                <p style="color: #ef4444;">${message}</p>
                <button class="refresh-btn" style="margin-top: 10px;">重试</button>
            </div>
        `;
        list.querySelector('button').addEventListener('click', () => loadData(type));
    }

    // 显示图片查看器
    function showImageViewer(src) {
        elements.viewerImage.src = src;
        elements.imageViewer.classList.add('active');
    }

    // 复制到剪贴板
    function copyToClipboard(text) {
        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(text)
                .then(() => showToast(`已复制: ${text}`, 'success'))
                .catch(() => showToast('复制失败', 'error'));
        } else {
            // 回退方案
            const textArea = document.createElement("textarea");
            textArea.value = text;
            textArea.style.position = "fixed";
            textArea.style.left = "-9999px";
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            try {
                document.execCommand('copy');
                showToast(`已复制: ${text}`, 'success');
            } catch (err) {
                showToast('复制失败', 'error');
            }
            document.body.removeChild(textArea);
        }
    }

    // 显示 Toast
    function showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        if (type === 'error') {
            toast.style.borderLeft = '4px solid #ef4444';
        } else if (type === 'success') {
            toast.style.borderLeft = '4px solid #10b981';
        }

        elements.toastContainer.appendChild(toast);

        // 自动移除
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
        }, 2000);
    }

    // 启动
    init();
});
