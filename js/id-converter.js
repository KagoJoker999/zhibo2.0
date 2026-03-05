/**
 * ID 转换模块
 * ========================================
 * 将商品ID转换为抖音好物链接
 */

function generateIdConverterPage() {
    return `
        <div class="id-converter-page" style="max-width: 600px; margin: 0 auto;">
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">🔄 ID 转换</h3>
                </div>
                
                <div class="card-body">
                    <div class="form-group">
                        <label class="form-label">输入商品 ID</label>
                        <textarea id="idConverter-input" class="form-input" rows="4" placeholder="输入商品ID，多个ID用英文逗号(,)分隔&#10;例如：3735779373345800342,3735779373345800343" style="resize: vertical; font-family: monospace;"></textarea>
                    </div>
                    
                    <div class="form-group" style="margin-top: 1.5rem;">
                        <label class="form-label">生成的链接</label>
                        <textarea id="idConverter-output" class="form-input" rows="6" readonly style="font-family: monospace; resize: vertical; word-break: break-all; background: var(--bg-hover); border-color: var(--border-color);"></textarea>
                    </div>
                    
                    <div style="display: flex; gap: 1rem; margin-top: 1.5rem;">
                        <button id="idConverter-convertBtn" class="btn btn-primary" style="flex: 1;">生成链接</button>
                        <button id="idConverter-copyBtn" class="btn btn-secondary" style="flex: 1;">📋 一键复制</button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function initIdConverter() {
    const input = document.getElementById('idConverter-input');
    const output = document.getElementById('idConverter-output');
    const convertBtn = document.getElementById('idConverter-convertBtn');
    const copyBtn = document.getElementById('idConverter-copyBtn');

    const BASE_URL = 'https://haohuo.jinritemai.com/ecommerce/trade/detail/index.html';

    function convertIds() {
        const raw = input.value.trim();
        if (!raw) {
            output.value = '';
            return;
        }

        const ids = raw.split(',').map(id => id.trim()).filter(Boolean);
        const links = ids.map(id => `${BASE_URL}?id=${id}&origin_type=604`);
        output.value = links.join('\n');
    }

    function copyOutput() {
        if (!output.value) {
            convertIds();
        }
        if (!output.value) {
            window.AppUtils?.showToast?.('没有可复制的内容', 'warning');
            return;
        }
        navigator.clipboard.writeText(output.value).then(() => {
            window.AppUtils?.showToast?.('已复制到剪贴板！', 'success');
        }).catch(() => {
            // 降级方案
            output.select();
            document.execCommand('copy');
            window.AppUtils?.showToast?.('已复制到剪贴板！', 'success');
        });
    }

    convertBtn.addEventListener('click', convertIds);
    copyBtn.addEventListener('click', copyOutput);

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
