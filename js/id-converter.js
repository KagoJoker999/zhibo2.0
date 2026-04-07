/**
 * ID 转换模块
 * ========================================
 * 将商品ID转换为抖音好物链接
 */

const BATCH_SIZE = 30;

function generateIdConverterPage() {
    return `
        <div class="id-converter-page page-centered">
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title"><i data-lucide="refresh-cw"></i> ID 转换器（从 ID 批量转换成可上架的商品链接）</h3>
                </div>
                
                <div class="card-body">
                    <div class="form-group">
                        <label class="form-label">输入商品 ID</label>
                        <textarea id="idConverter-input" class="form-input" rows="4" placeholder="输入商品ID，每行一个，或用英文逗号(,)分隔&#10;例如：&#10;3773267724856328467&#10;3769392377878413340" style="resize: vertical; font-family: monospace;"></textarea>
                    </div>
                    
                    <div class="form-group" style="margin-top: 1.5rem;">
                        <label class="form-label">生成的链接</label>
                        <textarea id="idConverter-output" class="form-input" rows="6" readonly style="font-family: monospace; resize: vertical; word-break: break-all; background: var(--bg-hover); border-color: var(--border-color);"></textarea>
                    </div>
                    
                    <div style="display: flex; gap: 1rem; margin-top: 1.5rem;">
                        <button id="idConverter-convertBtn" class="btn btn-primary" style="flex: 1;">生成链接</button>
                    </div>

                    <div id="idConverter-copyArea" style="margin-top: 1rem; display: flex; flex-wrap: wrap; gap: 0.75rem;"></div>
                </div>
            </div>
        </div>
    `;
}

function initIdConverter() {
    const input = document.getElementById('idConverter-input');
    const output = document.getElementById('idConverter-output');
    const convertBtn = document.getElementById('idConverter-convertBtn');
    const copyArea = document.getElementById('idConverter-copyArea');

    const BASE_URL = 'https://haohuo.jinritemai.com/ecommerce/trade/detail/index.html';

    // 当前所有链接
    let allLinks = [];

    function convertIds() {
        const raw = input.value.trim();
        if (!raw) {
            output.value = '';
            allLinks = [];
            renderCopyButtons();
            return;
        }

        const ids = raw.split(/[\n,]/).map(id => id.trim()).filter(Boolean);
        allLinks = ids.map(id => `${BASE_URL}?id=${id}&origin_type=604`);
        output.value = allLinks.join('\n');
        renderCopyButtons();
    }

    function renderCopyButtons() {
        copyArea.innerHTML = '';

        if (allLinks.length === 0) return;

        // 按 BATCH_SIZE 分组
        const batches = [];
        for (let i = 0; i < allLinks.length; i += BATCH_SIZE) {
            batches.push(allLinks.slice(i, i + BATCH_SIZE));
        }

        batches.forEach((batch, idx) => {
            const start = idx * BATCH_SIZE + 1;
            const end = start + batch.length - 1;

            const btn = document.createElement('button');
            btn.className = 'btn btn-secondary';
            btn.style.cssText = 'display: flex; align-items: center; gap: 0.4rem;';

            // 单批直接叫"一键复制"，多批显示范围
            const label = batches.length === 1
                ? `<i data-lucide="clipboard-list"></i> 一键复制（${batch.length} 个）`
                : `<i data-lucide="clipboard-list"></i> 复制第 ${start}–${end} 条`;

            btn.innerHTML = label;

            btn.addEventListener('click', () => {
                const text = batch.join('\n');
                navigator.clipboard.writeText(text).then(() => {
                    window.AppUtils?.showToast?.(`已复制第 ${start}–${end} 条链接！`, 'success');
                }).catch(() => {
                    const ta = document.createElement('textarea');
                    ta.value = text;
                    document.body.appendChild(ta);
                    ta.select();
                    document.execCommand('copy');
                    document.body.removeChild(ta);
                    window.AppUtils?.showToast?.(`已复制第 ${start}–${end} 条链接！`, 'success');
                });
            });

            copyArea.appendChild(btn);
        });

        // 渲染完按钮后重新初始化 Lucide 图标
        if (window.lucide) {
            window.lucide.createIcons();
        }
    }

    convertBtn.addEventListener('click', convertIds);

    // 输入时自动生成
    input.addEventListener('input', convertIds);
}

window.loadIdConverterPage = function (pageId) {
    if (pageId === 'id-converter') {
        return {
            html: generateIdConverterPage(),
            init: initIdConverter
        };
    }
    return null;
};
