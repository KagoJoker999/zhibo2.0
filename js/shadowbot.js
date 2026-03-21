/**
 * 影刀转换模块
 * ========================================
 */

function generateShadowbotPage() {
    return `
        <div class="shadowbot-page page-centered">
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">🤖 影刀链接转换器</h3>
                </div>
                
                <div class="card-body">
                    <div class="form-group">
                        <label class="form-label">基础 URL (Base URL)</label>
                        <input type="text" id="shadowbot-baseUrl" class="form-input" value="https://ugadhdhwixrejzfcwugj.supabase.co/rest/v1/new_product_data">
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">查询字段 (Select Field)</label>
                        <input type="text" id="shadowbot-selectField" class="form-input" value="product_code">
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">过滤字段 (Filter Field)</label>
                        <input type="text" id="shadowbot-filterField" class="form-input" value="category">
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">排除关键词 (Exclude Keyword)</label>
                        <input type="text" id="shadowbot-keyword" class="form-input" value="服装">
                    </div>
                    
                    <div class="form-group" style="margin-top: 1.5rem;">
                        <label class="form-label">生成的 URL</label>
                        <textarea id="shadowbot-resultUrl" class="form-input" rows="4" readonly style="font-family: monospace; resize: none; word-break: break-all; background: var(--bg-hover); border-color: var(--border-color);"></textarea>
                    </div>
                    
                    <div style="display: flex; gap: 1rem; margin-top: 1.5rem;">
                        <button id="shadowbot-generateBtn" class="btn btn-primary" style="flex: 1;">生成 URL</button>
                        <button id="shadowbot-copyBtn" class="btn btn-secondary" style="flex: 1;"><i data-lucide="clipboard-list"></i> 复制链接</button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function initShadowbot() {
    const generateBtn = document.getElementById('shadowbot-generateBtn');
    const copyBtn = document.getElementById('shadowbot-copyBtn');
    const resultUrl = document.getElementById('shadowbot-resultUrl');

    function generateUrl() {
        const baseUrl = document.getElementById('shadowbot-baseUrl').value?.trim() || '';
        const selectField = document.getElementById('shadowbot-selectField').value?.trim() || '';
        const filterField = document.getElementById('shadowbot-filterField').value?.trim() || '';
        const keyword = document.getElementById('shadowbot-keyword').value?.trim() || '';

        // 1. 将中文关键词转换为 URL 编码
        const encodedKeyword = encodeURIComponent(keyword);

        // 2. 拼接过滤条件参数
        const queryString = `?select=${selectField}&${filterField}=not.like.*${encodedKeyword}*`;

        // 3. 组合并显示最终 URL
        const finalUrl = baseUrl + queryString;
        resultUrl.value = finalUrl;
    }

    function copyUrl() {
        if (!resultUrl.value) {
            generateUrl();
        }
        resultUrl.select();
        document.execCommand('copy');
        window.AppUtils?.showToast?.('已成功复制到剪贴板！', 'success');
    }

    generateBtn.addEventListener('click', generateUrl);
    copyBtn.addEventListener('click', copyUrl);

    // 监听输入变化自动生成
    ['shadowbot-baseUrl', 'shadowbot-selectField', 'shadowbot-filterField', 'shadowbot-keyword'].forEach(id => {
        document.getElementById(id).addEventListener('input', generateUrl);
    });

    // 页面加载完成后自动生成一次默认结果
    generateUrl();
}

window.loadShadowbotPage = function (pageId) {
    if (pageId === 'shadowbot') {
        return {
            html: generateShadowbotPage(),
            init: initShadowbot
        };
    }
    return null;
};
