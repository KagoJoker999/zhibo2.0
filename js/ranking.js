/**
 * 排品功能模块
 * ========================================
 * 数据：从 ranking_data + inventory_data 汇总（前端计算评分）
 * 新品：从 new_product_data 读取
 * 配置：从 ranking_config 表读取
 * 公式：从 ranking_config (scoring_formulas) 读取，AES-GCM 加密存储
 * 输出：写入 ranking_results 表
 */

// ========================================
// AES-GCM 加密/解密引擎
// ========================================
const ScoringCrypto = {
    // 从密码派生 AES 密钥
    async deriveKey(password, salt) {
        const enc = new TextEncoder();
        const keyMaterial = await crypto.subtle.importKey(
            'raw', enc.encode(password), 'PBKDF2', false, ['deriveKey']
        );
        return crypto.subtle.deriveKey(
            { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
            keyMaterial,
            { name: 'AES-GCM', length: 256 },
            false,
            ['encrypt', 'decrypt']
        );
    },

    // 加密 JSON 对象
    async encrypt(data, password) {
        const enc = new TextEncoder();
        const salt = crypto.getRandomValues(new Uint8Array(16));
        const iv = crypto.getRandomValues(new Uint8Array(12));
        const key = await this.deriveKey(password, salt);
        const ciphertext = await crypto.subtle.encrypt(
            { name: 'AES-GCM', iv },
            key,
            enc.encode(JSON.stringify(data))
        );
        return {
            salt: btoa(String.fromCharCode(...salt)),
            iv: btoa(String.fromCharCode(...iv)),
            ciphertext: btoa(String.fromCharCode(...new Uint8Array(ciphertext)))
        };
    },

    // 解密得到 JSON 对象
    async decrypt(encryptedData, password) {
        const salt = Uint8Array.from(atob(encryptedData.salt), c => c.charCodeAt(0));
        const iv = Uint8Array.from(atob(encryptedData.iv), c => c.charCodeAt(0));
        const ciphertext = Uint8Array.from(atob(encryptedData.ciphertext), c => c.charCodeAt(0));
        const key = await this.deriveKey(password, salt);
        const decrypted = await crypto.subtle.decrypt(
            { name: 'AES-GCM', iv },
            key,
            ciphertext
        );
        return JSON.parse(new TextDecoder().decode(decrypted));
    }
};

// ========================================
// 评分公式管理
// ========================================
function getDefaultScoringFormulas() {
    return {
        "当前公式": "默认公式",
        "公式列表": {
            "默认公式": {
                "数据平滑": { "讲解次数": 0.5, "成交金额": 0.5 },
                "表现得分权重": {
                    "转化能力": { "权重": 0.6, "点击成交率分值": 0.5, "成交金额分值": 0.5 },
                    "讲解效率": { "权重": 0.4, "讲解效率分值": 0.6, "曝光点击率分值": 0.4 }
                },
                "潜力得分权重": { "点击成交率分值": 0.42, "讲解效率分值": 0.42, "潜力因子": 0.16 },
                "总分权重": { "表现得分": 0.8, "潜力得分": 0.2 }
            }
        }
    };
}

// 从数据库加载公式（需要密码解密）
async function loadScoringFormulas(password) {
    const client = window.supabaseClient;
    if (!client) throw new Error('Supabase 未初始化');

    const { data, error } = await client
        .from('ranking_config')
        .select('config_value')
        .eq('config_key', 'scoring_formulas')
        .single();

    if (error || !data) {
        console.warn('<i data-lucide="alert-triangle"></i> 未找到评分公式配置，使用默认');
        return getDefaultScoringFormulas();
    }

    const config = data.config_value;

    // 未加密（首次使用或未设置密码）
    if (!config.encrypted) {
        return config;
    }

    // 需要密码解密
    if (!password) throw new Error('NEED_PASSWORD');
    try {
        return await ScoringCrypto.decrypt(config, password);
    } catch (e) {
        throw new Error('PASSWORD_WRONG');
    }
}

// 保存公式到数据库（加密后保存）
async function saveScoringFormulas(formulas, password) {
    const client = window.supabaseClient;
    if (!client) throw new Error('Supabase 未初始化');

    let configValue;
    if (password) {
        const encrypted = await ScoringCrypto.encrypt(formulas, password);
        configValue = { encrypted: true, ...encrypted, "当前公式": formulas["当前公式"] };
    } else {
        configValue = { encrypted: false, ...formulas };
    }

    const { error } = await client
        .from('ranking_config')
        .upsert({
            config_key: 'scoring_formulas',
            config_value: configValue,
            updated_at: new Date().toISOString()
        }, { onConflict: 'config_key' });

    if (error) throw new Error('保存公式失败: ' + error.message);
}

// ========================================
// 前端评分计算引擎
// ========================================
function calculateProductScores(rawProducts, formula) {
    if (!rawProducts || rawProducts.length === 0) return [];

    const smooth = formula["数据平滑"] || { "讲解次数": 0.5, "成交金额": 0.5 };

    // 步骤1: 数据平滑 + 讲解效率
    const processed = rawProducts.map(p => {
        const lectureSmooth = (p.lecture_count || 0) + smooth["讲解次数"];
        const salesSmooth = (p.sales_amount || 0) + smooth["成交金额"];
        return {
            ...p,
            lecture_smooth: lectureSmooth,
            sales_smooth: salesSmooth,
            lecture_efficiency: salesSmooth / lectureSmooth,
            exposure_rate_val: p.exposure_rate || 0,
            conversion_rate_val: p.conversion_rate || 0
        };
    });

    // 步骤2: 归一化辅助函数
    const minMax = (arr, getter) => {
        let min = Infinity, max = -Infinity;
        arr.forEach(item => {
            const v = getter(item);
            if (v < min) min = v;
            if (v > max) max = v;
        });
        return { min, max, range: max - min || 1 };
    };

    const mmExposure = minMax(processed, p => p.exposure_rate_val);
    const mmConversion = minMax(processed, p => p.conversion_rate_val);
    const mmLecture = minMax(processed, p => p.lecture_count || 0);
    const mmEfficiency = minMax(processed, p => p.lecture_efficiency);
    const mmLectureSmooth = minMax(processed, p => p.lecture_smooth);

    // 步骤3: 计算各项分值（0-100）
    const scored = processed.map(p => {
        const exposureScore = ((p.exposure_rate_val - mmExposure.min) / mmExposure.range) * 100;
        const conversionScore = ((p.conversion_rate_val - mmConversion.min) / mmConversion.range) * 100;
        const lectureScore = (((p.lecture_count || 0) - mmLecture.min) / mmLecture.range) * 100;
        const efficiencyScore = ((p.lecture_efficiency - mmEfficiency.min) / mmEfficiency.range) * 100;
        const salesScore = efficiencyScore; // 成交金额分值 = 讲解效率分值
        // 讲解潜力分值（反向归一化）
        const lecturePotentialScore = ((mmLectureSmooth.max - p.lecture_smooth) / mmLectureSmooth.range) * 100;

        return { ...p, exposureScore, conversionScore, lectureScore, efficiencyScore, salesScore, lecturePotentialScore };
    });

    // 步骤4: 加权计算
    const perfW = formula["表现得分权重"] || {};
    const convertAbility = perfW["转化能力"] || { "权重": 0.6, "点击成交率分值": 0.5, "成交金额分值": 0.5 };
    const lectureAbility = perfW["讲解效率"] || { "权重": 0.4, "讲解效率分值": 0.6, "曝光点击率分值": 0.4 };

    const potW = formula["潜力得分权重"] || { "点击成交率分值": 0.42, "讲解效率分值": 0.42, "潜力因子": 0.16 };
    const totalW = formula["总分权重"] || { "表现得分": 0.8, "潜力得分": 0.2 };

    return scored.map(p => {
        // 潜力因子
        const potentialFactor = (1 - p.lectureScore / 100) * ((p.conversionScore / 100 + p.efficiencyScore / 100) / 2) * 100;

        // 表现得分
        const performanceScore =
            (p.conversionScore * convertAbility["点击成交率分值"] + p.salesScore * convertAbility["成交金额分值"]) * convertAbility["权重"] +
            (p.efficiencyScore * lectureAbility["讲解效率分值"] + p.exposureScore * lectureAbility["曝光点击率分值"]) * lectureAbility["权重"];

        // 潜力得分
        const potentialScore =
            p.conversionScore * potW["点击成交率分值"] +
            p.efficiencyScore * potW["讲解效率分值"] +
            potentialFactor * potW["潜力因子"];

        // 产品总分
        const totalScore =
            performanceScore * totalW["表现得分"] +
            potentialScore * totalW["潜力得分"];

        return {
            ...p,
            potential_factor: Math.round(potentialFactor * 100) / 100,
            performance_score: Math.round(performanceScore * 100) / 100,
            potential_score: Math.round(potentialScore * 100) / 100,
            total_score: Math.round(totalScore * 100) / 100
        };
    });
}

// ========================================
// 密码弹窗
// ========================================
function showPasswordDialog(title = '请输入评分密码', isSetup = false) {
    return new Promise((resolve) => {
        const overlay = document.createElement('div');
        overlay.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.6); z-index:9999; display:flex; align-items:center; justify-content:center;';
        overlay.innerHTML = `
            <div style="background:var(--bg-secondary, #1e1e2e); border:1px solid var(--border-color, #333); border-radius:12px; padding:2rem; width:340px; box-shadow:0 20px 40px rgba(0,0,0,0.4);">
                <div style="text-align:center; margin-bottom:1.5rem;">
                    <div style="font-size:2rem; margin-bottom:0.5rem;"><i data-lucide="lock" style="width: 48px; height: 48px;"></i></div>
                    <h3 style="color:var(--text-primary, #fff); margin:0; font-size:1.1rem;">${title}</h3>
                </div>
                <input type="password" id="scoringPwdInput" placeholder="输入密码" autocomplete="off"
                    style="width:100%; padding:0.75rem; border:1px solid var(--border-color, #444); border-radius:8px;
                    background:var(--bg-tertiary, #2a2a3e); color:var(--text-primary, #fff); font-size:1rem;
                    outline:none; box-sizing:border-box; margin-bottom:${isSetup ? '0.75rem' : '1rem'};">
                ${isSetup ? `<input type="password" id="scoringPwdConfirm" placeholder="确认密码" autocomplete="off"
                    style="width:100%; padding:0.75rem; border:1px solid var(--border-color, #444); border-radius:8px;
                    background:var(--bg-tertiary, #2a2a3e); color:var(--text-primary, #fff); font-size:1rem;
                    outline:none; box-sizing:border-box; margin-bottom:1rem;">` : ''}
                <div id="scoringPwdError" style="color:#ff4d4f; font-size:0.85rem; margin-bottom:0.75rem; min-height:1.2em;"></div>
                <div style="display:flex; gap:0.75rem;">
                    <button id="scoringPwdCancel" style="flex:1; padding:0.6rem; border:1px solid var(--border-color, #444);
                        border-radius:8px; background:transparent; color:var(--text-secondary, #999); cursor:pointer; font-size:0.9rem;">取消</button>
                    <button id="scoringPwdConfirmBtn" style="flex:1; padding:0.6rem; border:none; border-radius:8px;
                        background:var(--primary-color, #6366f1); color:#fff; cursor:pointer; font-size:0.9rem; font-weight:500;">确认</button>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);

        const input = overlay.querySelector('#scoringPwdInput');
        const errorDiv = overlay.querySelector('#scoringPwdError');
        const confirmInput = overlay.querySelector('#scoringPwdConfirm');
        input.focus();

        const doConfirm = () => {
            const pwd = input.value.trim();
            if (!pwd) { errorDiv.textContent = '请输入密码'; return; }
            if (isSetup) {
                const pwd2 = confirmInput?.value.trim();
                if (pwd !== pwd2) { errorDiv.textContent = '两次密码不一致'; return; }
            }
            document.body.removeChild(overlay);
            resolve(pwd);
        };

        overlay.querySelector('#scoringPwdConfirmBtn').addEventListener('click', doConfirm);
        overlay.querySelector('#scoringPwdCancel').addEventListener('click', () => {
            document.body.removeChild(overlay);
            resolve(null);
        });

        // Enter 确认
        const handleEnter = (e) => { if (e.key === 'Enter') doConfirm(); };
        input.addEventListener('keydown', handleEnter);
        if (confirmInput) confirmInput.addEventListener('keydown', handleEnter);
    });
}

// 获取会话密码
function getScoringPassword() {
    return sessionStorage.getItem('scoring_pwd');
}
function setScoringPassword(pwd) {
    sessionStorage.setItem('scoring_pwd', pwd);
}

// 带密码交互的公式加载
async function loadScoringFormulasWithAuth() {
    // 先尝试用会话密码
    let password = getScoringPassword();

    try {
        const formulas = await loadScoringFormulas(password);
        return formulas;
    } catch (e) {
        if (e.message === 'NEED_PASSWORD' || e.message === 'PASSWORD_WRONG') {
            // 弹出密码框
            const msg = e.message === 'PASSWORD_WRONG' ? '密码错误，请重新输入' : '请输入评分密码';
            password = await showPasswordDialog(msg);
            if (!password) return null;
            try {
                const formulas = await loadScoringFormulas(password);
                setScoringPassword(password);
                return formulas;
            } catch (e2) {
                if (e2.message === 'PASSWORD_WRONG') {
                    window.AppUtils?.showToast?.('密码错误', 'error');
                    return null;
                }
                throw e2;
            }
        }
        throw e;
    }
}

// ========================================
// 评分设置页面
// ========================================
function generateScoringSettingsPage() {
    return `
        <div class="ranking-page">
            <div class="page-intro">
                <h2><span style="color: white;"><i data-lucide="settings-2"></i> 评分设置</span> <span style="color: #999;">（评分公式加密存储在 ranking_config 表中）</span></h2>
                <p>
                    <span style="color: #ff9800;">🔒 公式数据已加密保护，需要密码才能查看和编辑。</span>
                </p>
            </div>

            <div id="scoringAuthGate" style="display:flex; align-items:center; justify-content:center; padding:4rem 0;">
                <div style="text-align:center;">
                    <div style="font-size:3rem; margin-bottom:1rem;"><i data-lucide="lock" style="width: 64px; height: 64px;"></i></div>
                    <p style="color:var(--text-secondary); margin-bottom:1.5rem;">请输入密码以访问评分设置</p>
                    <button class="btn btn-primary" id="btnScoringUnlock">输入密码</button>
                </div>
            </div>

            <div id="scoringContent" style="display:none;">
                <div style="display:flex; gap:1rem; align-items:center; flex-wrap:wrap; padding:1rem 0; border-bottom:1px solid var(--border-color);">
                    <label style="color:var(--text-secondary); font-weight:500;">当前公式：</label>
                    <select id="scoringFormulaSelect" style="padding:0.5rem 1rem; border:1px solid var(--border-color); border-radius:8px; background:var(--bg-tertiary); color:var(--text-primary); font-size:0.9rem; min-width:160px;"></select>
                    <button class="btn btn-secondary" id="btnNewFormula" style="font-size:0.8rem; padding:0.4rem 0.8rem;">➕ 新建</button>
                    <button class="btn btn-secondary" id="btnCopyFormula" style="font-size:0.8rem; padding:0.4rem 0.8rem;"><i data-lucide="clipboard-list"></i> 复制</button>
                    <button class="btn btn-secondary" id="btnDeleteFormula" style="font-size:0.8rem; padding:0.4rem 0.8rem; color:var(--error-color);">🗑️ 删除</button>
                    <div style="margin-left:auto; display:flex; gap:0.5rem;">
                        <button class="btn btn-primary" id="btnSaveFormula" style="font-size:0.85rem;"><i data-lucide="save"></i> 保存公式</button>
                        <button class="btn btn-secondary" id="btnChangeScoringPwd" style="font-size:0.8rem; padding:0.4rem 0.8rem;">🔑 修改密码</button>
                    </div>
                </div>

                <div id="scoringFormulaEditor" style="padding:1.5rem 0;">
                    <!-- 动态生成 -->
                </div>

                <div style="padding:1rem; background:var(--bg-tertiary); border-radius:8px; border:1px solid var(--border-color);">
                    <h4 style="color:var(--text-secondary); margin:0 0 0.75rem 0;">📝 公式预览</h4>
                    <pre id="scoringFormulaPreview" style="color:var(--text-muted); font-size:0.85rem; line-height:1.6; margin:0; white-space:pre-wrap;"></pre>
                </div>
            </div>
        </div>
    `;
}

function renderFormulaEditor(formula, container) {
    const smooth = formula["数据平滑"] || {};
    const perfW = formula["表现得分权重"] || {};
    const convertA = perfW["转化能力"] || {};
    const lectureA = perfW["讲解效率"] || {};
    const potW = formula["潜力得分权重"] || {};
    const totalW = formula["总分权重"] || {};

    const makeInput = (id, value, label, unit = '') => `
        <div style="display:flex; align-items:center; gap:0.75rem; margin-bottom:0.5rem;">
            <label style="color:var(--text-secondary); min-width:140px; font-size:0.9rem;">${label}</label>
            <input type="number" id="${id}" value="${value}" step="0.01" min="0" max="1"
                style="width:80px; padding:0.4rem 0.5rem; border:1px solid var(--border-color); border-radius:6px;
                background:var(--bg-tertiary); color:var(--text-primary); font-size:0.9rem; text-align:center;">
            <span style="color:var(--text-muted); font-size:0.85rem;">${unit}</span>
        </div>
    `;

    container.innerHTML = `
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:1.5rem;">
            <div style="padding:1rem; background:var(--bg-tertiary); border-radius:8px; border:1px solid var(--border-color);">
                <h4 style="color:var(--primary-color); margin:0 0 1rem 0;">📐 数据平滑参数</h4>
                ${makeInput('sf_smooth_lecture', smooth["讲解次数"] ?? 0.5, '讲解次数平滑值')}
                ${makeInput('sf_smooth_sales', smooth["成交金额"] ?? 0.5, '成交金额平滑值')}
            </div>

            <div style="padding:1rem; background:var(--bg-tertiary); border-radius:8px; border:1px solid var(--border-color);">
                <h4 style="color:var(--primary-color); margin:0 0 1rem 0;">📊 总分权重</h4>
                ${makeInput('sf_total_perf', totalW["表现得分"] ?? 0.8, '表现得分权重')}
                ${makeInput('sf_total_pot', totalW["潜力得分"] ?? 0.2, '潜力得分权重')}
            </div>

            <div style="padding:1rem; background:var(--bg-tertiary); border-radius:8px; border:1px solid var(--border-color);">
                <h4 style="color:#22c55e; margin:0 0 1rem 0;">📈 表现得分 - 转化能力</h4>
                ${makeInput('sf_convert_weight', convertA["权重"] ?? 0.6, '模块权重')}
                ${makeInput('sf_convert_click', convertA["点击成交率分值"] ?? 0.5, '点击成交率分值')}
                ${makeInput('sf_convert_sales', convertA["成交金额分值"] ?? 0.5, '成交金额分值')}
                <hr style="border-color:var(--border-color); margin:0.75rem 0;">
                <h4 style="color:#22c55e; margin:0 0 1rem 0;">📈 表现得分 - 讲解效率</h4>
                ${makeInput('sf_lecture_weight', lectureA["权重"] ?? 0.4, '模块权重')}
                ${makeInput('sf_lecture_eff', lectureA["讲解效率分值"] ?? 0.6, '讲解效率分值')}
                ${makeInput('sf_lecture_exp', lectureA["曝光点击率分值"] ?? 0.4, '曝光点击率分值')}
            </div>

            <div style="padding:1rem; background:var(--bg-tertiary); border-radius:8px; border:1px solid var(--border-color);">
                <h4 style="color:#a855f7; margin:0 0 1rem 0;">🔮 潜力得分权重</h4>
                ${makeInput('sf_pot_click', potW["点击成交率分值"] ?? 0.42, '点击成交率分值')}
                ${makeInput('sf_pot_eff', potW["讲解效率分值"] ?? 0.42, '讲解效率分值')}
                ${makeInput('sf_pot_factor', potW["潜力因子"] ?? 0.16, '潜力因子')}
            </div>
        </div>
    `;
}

function readFormulaFromEditor() {
    const val = (id) => parseFloat(document.getElementById(id)?.value) || 0;
    return {
        "数据平滑": {
            "讲解次数": val('sf_smooth_lecture'),
            "成交金额": val('sf_smooth_sales')
        },
        "表现得分权重": {
            "转化能力": {
                "权重": val('sf_convert_weight'),
                "点击成交率分值": val('sf_convert_click'),
                "成交金额分值": val('sf_convert_sales')
            },
            "讲解效率": {
                "权重": val('sf_lecture_weight'),
                "讲解效率分值": val('sf_lecture_eff'),
                "曝光点击率分值": val('sf_lecture_exp')
            }
        },
        "潜力得分权重": {
            "点击成交率分值": val('sf_pot_click'),
            "讲解效率分值": val('sf_pot_eff'),
            "潜力因子": val('sf_pot_factor')
        },
        "总分权重": {
            "表现得分": val('sf_total_perf'),
            "潜力得分": val('sf_total_pot')
        }
    };
}

function updateFormulaPreview() {
    const preview = document.getElementById('scoringFormulaPreview');
    if (!preview) return;
    const f = readFormulaFromEditor();
    const tw = f["总分权重"];
    const ca = f["表现得分权重"]["转化能力"];
    const la = f["表现得分权重"]["讲解效率"];
    const pw = f["潜力得分权重"];
    const sm = f["数据平滑"];

    preview.textContent =
        `数据平滑：讲解次数 + ${sm["讲解次数"]}，成交金额 + ${sm["成交金额"]}
讲解效率 = 成交金额平滑 / 讲解次数平滑

分值归一化（Min-Max → 0~100）：
  曝光点击率分值、点击成交率分值、讲解次数分值、讲解效率分值
  成交金额分值 = 讲解效率分值

潜力因子 = (1 - 讲解次数分值/100) × (点击成交率分值/100 + 讲解效率分值/100) / 2 × 100

表现得分 = (点击成交率×${ca["点击成交率分值"]} + 成交金额×${ca["成交金额分值"]})×${ca["权重"]} + (讲解效率×${la["讲解效率分值"]} + 曝光点击率×${la["曝光点击率分值"]})×${la["权重"]}

潜力得分 = 点击成交率×${pw["点击成交率分值"]} + 讲解效率×${pw["讲解效率分值"]} + 潜力因子×${pw["潜力因子"]}

产品总分 = 表现得分×${tw["表现得分"]} + 潜力得分×${tw["潜力得分"]}`;
}

async function initScoringSettings() {
    let cachedFormulas = null;
    let currentPassword = getScoringPassword();

    const authGate = document.getElementById('scoringAuthGate');
    const content = document.getElementById('scoringContent');
    const select = document.getElementById('scoringFormulaSelect');
    const editor = document.getElementById('scoringFormulaEditor');

    // 解锁按钮
    document.getElementById('btnScoringUnlock')?.addEventListener('click', async () => {
        await unlockScoring();
    });

    async function unlockScoring() {
        // 先尝试会话密码
        currentPassword = getScoringPassword();
        try {
            cachedFormulas = await loadScoringFormulas(currentPassword);
            if (!cachedFormulas.encrypted && cachedFormulas.encrypted !== false) {
                // 正常解密成功
            }
            showScoringContent();
            return;
        } catch (e) {
            if (e.message === 'NEED_PASSWORD' || e.message === 'PASSWORD_WRONG') {
                currentPassword = await showPasswordDialog(e.message === 'PASSWORD_WRONG' ? '密码错误，请重试' : '请输入评分密码');
                if (!currentPassword) return;
                try {
                    cachedFormulas = await loadScoringFormulas(currentPassword);
                    setScoringPassword(currentPassword);
                    showScoringContent();
                } catch (e2) {
                    window.AppUtils?.showToast?.(e2.message === 'PASSWORD_WRONG' ? '密码错误' : e2.message, 'error');
                }
            } else {
                // 未加密的，检查是否需要首次设置密码
                cachedFormulas = await loadScoringFormulas(null);
                // 引导设置密码
                currentPassword = await showPasswordDialog('首次使用，请设置评分密码', true);
                if (currentPassword) {
                    setScoringPassword(currentPassword);
                    await saveScoringFormulas(cachedFormulas, currentPassword);
                    window.AppUtils?.showToast?.('密码已设置，公式已加密保存', 'success');
                }
                showScoringContent();
            }
        }
    }

    function showScoringContent() {
        authGate.style.display = 'none';
        content.style.display = 'block';
        populateFormulaSelect();
        loadCurrentFormula();
    }

    function populateFormulaSelect() {
        select.innerHTML = '';
        const formulas = cachedFormulas["公式列表"] || {};
        Object.keys(formulas).forEach(name => {
            const opt = document.createElement('option');
            opt.value = name;
            opt.textContent = name;
            if (name === cachedFormulas["当前公式"]) opt.selected = true;
            select.appendChild(opt);
        });
    }

    function loadCurrentFormula() {
        const name = select.value;
        const formula = cachedFormulas["公式列表"]?.[name];
        if (formula) {
            renderFormulaEditor(formula, editor);
            updateFormulaPreview();
            // 监听所有输入框变化实时更新预览
            editor.querySelectorAll('input[type="number"]').forEach(inp => {
                inp.addEventListener('input', updateFormulaPreview);
            });
        }
    }

    select.addEventListener('change', () => {
        cachedFormulas["当前公式"] = select.value;
        loadCurrentFormula();
    });

    // 新建公式
    document.getElementById('btnNewFormula')?.addEventListener('click', () => {
        const name = prompt('请输入新公式名称：');
        if (!name || !name.trim()) return;
        if (cachedFormulas["公式列表"][name]) {
            window.AppUtils?.showToast?.('该名称已存在', 'warning');
            return;
        }
        cachedFormulas["公式列表"][name] = getDefaultScoringFormulas()["公式列表"]["默认公式"];
        cachedFormulas["当前公式"] = name;
        populateFormulaSelect();
        loadCurrentFormula();
        window.AppUtils?.showToast?.(`已新建公式：${name}`, 'success');
    });

    // 复制公式
    document.getElementById('btnCopyFormula')?.addEventListener('click', () => {
        const currentName = select.value;
        const name = prompt('请输入复制后的公式名称：', currentName + ' (副本)');
        if (!name || !name.trim()) return;
        if (cachedFormulas["公式列表"][name]) {
            window.AppUtils?.showToast?.('该名称已存在', 'warning');
            return;
        }
        cachedFormulas["公式列表"][name] = JSON.parse(JSON.stringify(cachedFormulas["公式列表"][currentName]));
        cachedFormulas["当前公式"] = name;
        populateFormulaSelect();
        loadCurrentFormula();
        window.AppUtils?.showToast?.(`已复制为：${name}`, 'success');
    });

    // 删除公式
    document.getElementById('btnDeleteFormula')?.addEventListener('click', () => {
        const name = select.value;
        const keys = Object.keys(cachedFormulas["公式列表"]);
        if (keys.length <= 1) {
            window.AppUtils?.showToast?.('至少保留一个公式', 'warning');
            return;
        }
        if (!confirm(`确认删除公式「${name}」？`)) return;
        delete cachedFormulas["公式列表"][name];
        cachedFormulas["当前公式"] = Object.keys(cachedFormulas["公式列表"])[0];
        populateFormulaSelect();
        loadCurrentFormula();
        window.AppUtils?.showToast?.(`已删除公式：${name}`, 'success');
    });

    // 保存公式
    document.getElementById('btnSaveFormula')?.addEventListener('click', async () => {
        try {
            // 将编辑器中的值读回
            const currentName = select.value;
            cachedFormulas["公式列表"][currentName] = readFormulaFromEditor();
            cachedFormulas["当前公式"] = currentName;

            await saveScoringFormulas(cachedFormulas, currentPassword);
            window.AppUtils?.showToast?.('公式已加密保存', 'success');
        } catch (error) {
            window.AppUtils?.showToast?.('保存失败: ' + error.message, 'error');
        }
    });

    // 修改密码
    document.getElementById('btnChangeScoringPwd')?.addEventListener('click', async () => {
        const newPwd = await showPasswordDialog('请设置新密码', true);
        if (!newPwd) return;
        try {
            currentPassword = newPwd;
            setScoringPassword(newPwd);
            // 用编辑器中的最新值
            const currentName = select.value;
            cachedFormulas["公式列表"][currentName] = readFormulaFromEditor();
            await saveScoringFormulas(cachedFormulas, newPwd);
            window.AppUtils?.showToast?.('密码已修改，公式已重新加密', 'success');
        } catch (error) {
            window.AppUtils?.showToast?.('修改失败: ' + error.message, 'error');
        }
    });

    // 自动尝试解锁
    if (currentPassword) {
        await unlockScoring();
    }
}


// ========================================
// 字段映射 (配置中文 -> 数据字段英文)
// ========================================
const FIELD_MAPPING = {
    "虚拟分类": "virtual_category",
    "实际库存数": "actual_stock",
    "评分排名": "rating_rank",
    "产品总分": "total_score",
    "是否可佩戴": "is_wearable",
    "商品分类": "product_category",
    "可用数": "available_qty",
    "仓位": "warehouse",
    "商品编码": "product_code",
    "商品名称": "product_name",
    "图片网址": "image_url",
    "颜色规格": "color_spec",
    "商品标签": "product_tag",
    "价格": "price"
};

// 可用于筛选的字段（排除：价格、颜色规格、图片网址、商品名称、商品编码、仓位）
const FILTERABLE_FIELDS = [
    "虚拟分类",      // 文本
    "实际库存数",    // 数值
    "评分排名",      // 数值
    "产品总分",      // 数值
    "是否可佩戴",    // 布尔
    "商品分类",      // 文本
    "可用数",        // 数值
    "商品标签"       // 文本
];

// ========================================
// 数据汇总 - 从 ranking_data + inventory_data 读取并前端计算评分
// ========================================
async function loadCombinedProductData() {
    console.log('📥 [数据加载] 开始加载库存+评分数据...');
    const client = window.supabaseClient;
    if (!client) throw new Error('Supabase 未初始化');

    // 并行读取排名原始数据、库存表和不可佩戴品列表
    const [rankingRes, inventoryRes, nonWearableRes] = await Promise.all([
        client.from('ranking_data').select('*'),
        client.from('inventory_data').select('*'),
        client.from('excluded_non_wearables').select('product_name')
    ]);

    if (rankingRes.error) throw new Error('读取 ranking_data 失败: ' + rankingRes.error.message);
    if (inventoryRes.error) throw new Error('读取 inventory_data 失败: ' + inventoryRes.error.message);

    // 步骤1：加载评分公式并在前端计算评分
    const formulas = await loadScoringFormulasWithAuth();
    const currentFormulaName = formulas?.["当前公式"] || "默认公式";
    const currentFormula = formulas?.["公式列表"]?.[currentFormulaName] || getDefaultScoringFormulas()["公式列表"]["默认公式"];

    // 用前端引擎计算评分
    const rawRanking = rankingRes.data || [];
    const scoredProducts = calculateProductScores(rawRanking, currentFormula);
    console.log(`📊 [前端评分] 使用公式「${currentFormulaName}」计算了 ${scoredProducts.length} 个商品的评分`);

    // 构建排名数据 Map
    const rankingMap = new Map();
    scoredProducts.forEach(item => {
        if (!item.product_name) return;
        rankingMap.set(item.product_name, {
            total_score: item.total_score || 0,
            sales_amount: item.sales_amount || 0,
            lecture_count: item.lecture_count || 0,
            performance_score: item.performance_score || 0,
            potential_score: item.potential_score || 0
        });
    });

    // 步骤2：构建不可佩戴品 Set
    const nonWearableSet = new Set((nonWearableRes.data || []).map(i => i.product_name));

    // 步骤3：构建库存数据 Map（支持同名商品合并）
    const inventoryMap = new Map();

    // 辅助函数：合并文本字段（去重后用逗号分隔）
    const mergeTextField = (existing, newValue) => {
        if (!newValue) return existing;
        if (!existing) return newValue;
        const existingSet = new Set(existing.split(',').map(s => s.trim()).filter(Boolean));
        const newValues = newValue.split(',').map(s => s.trim()).filter(Boolean);
        newValues.forEach(v => existingSet.add(v));
        return Array.from(existingSet).join(',');
    };

    (inventoryRes.data || []).forEach(item => {
        if (!item.product_name) return;

        // 判断是否可佩戴
        const isWearable = !nonWearableSet.has(item.product_name);

        if (inventoryMap.has(item.product_name)) {
            const existing = inventoryMap.get(item.product_name);
            existing.available_qty += item.available_qty || 0;
            existing.actual_stock += item.actual_stock || 0;
            existing.virtual_category = mergeTextField(existing.virtual_category, item.virtual_category);
            existing.product_category = mergeTextField(existing.product_category, item.product_category);
            existing.product_code = mergeTextField(existing.product_code, item.product_code);
            existing.warehouse = mergeTextField(existing.warehouse, item.warehouse);
            if (!existing.image_url && item.image_url) {
                existing.image_url = item.image_url;
            }
        } else {
            inventoryMap.set(item.product_name, {
                product_name: item.product_name,
                available_qty: item.available_qty || 0,
                actual_stock: item.actual_stock || 0,
                virtual_category: item.virtual_category || '',
                product_category: item.product_category || '',
                product_code: item.product_code || '',
                image_url: item.image_url || '',
                warehouse: item.warehouse || '',
                is_wearable: isWearable,
                total_score: 0,
                rating_rank: 999999,
                sales_amount: 0,
                lecture_count: 0,
                exposure_rate: 0,
                conversion_rate: 0
            });
        }
    });

    // 步骤4：融合评分数据到库存数据
    rankingMap.forEach((rankData, productName) => {
        const existing = inventoryMap.get(productName);
        if (existing) {
            Object.assign(existing, rankData);
        }
    });

    // 步骤5：生成排名（按总分降序）
    const products = Array.from(inventoryMap.values());
    products
        .filter(p => p.total_score > 0)
        .sort((a, b) => b.total_score - a.total_score)
        .forEach((p, idx) => {
            p.rating_rank = idx + 1;
        });

    console.log(`<i data-lucide="check-circle"></i> [数据加载] 完成: 评分数据 ${rawRanking.length} 条, 库存数据 ${inventoryRes.data?.length || 0} 条, 汇总商品 ${products.length} 个`);
    return products;
}


// 读取新品数据（含本地去重）
async function loadNewProductData() {
    console.log('🌟 [新品加载] 开始从 new_product_data 加载...');
    const client = window.supabaseClient;
    if (!client) throw new Error('Supabase 未初始化');

    const { data, error } = await client.from('new_product_data').select('*');
    if (error) throw new Error('读取 new_product_data 失败: ' + error.message);

    const rawData = data || [];
    const rawCount = rawData.length;

    // ========================================
    // 新品数据本地去重（以产品名称为主键）
    // ========================================
    const productMap = new Map();

    rawData.forEach(item => {
        const name = item.product_name;
        if (!name) return;

        const existing = productMap.get(name);
        if (existing) {
            // 图片网址：用逗号分隔
            if (item.image_url && !existing.image_url.includes(item.image_url)) {
                existing.image_url = existing.image_url
                    ? `${existing.image_url}, ${item.image_url}`
                    : item.image_url;
            }

            // 颜色规格：用逗号分隔
            if (item.color_spec && !existing.color_spec.includes(item.color_spec)) {
                existing.color_spec = existing.color_spec
                    ? `${existing.color_spec}, ${item.color_spec}`
                    : item.color_spec;
            }

            // 商品编码：用逗号分隔
            if (item.product_code && !existing.product_code.includes(item.product_code)) {
                existing.product_code = existing.product_code
                    ? `${existing.product_code}, ${item.product_code}`
                    : item.product_code;
            }

            // 仓位：用逗号分隔
            if (item.warehouse && !existing.warehouse.includes(item.warehouse)) {
                existing.warehouse = existing.warehouse
                    ? `${existing.warehouse}, ${item.warehouse}`
                    : item.warehouse;
            }

            // 类别：去重（保留第一个）
            if (!existing.category && item.category) {
                existing.category = item.category;
            }

            // 商品标签：去重（保留第一个）
            if (!existing.product_tag && item.product_tag) {
                existing.product_tag = item.product_tag;
            }

            // 价格：去重（保留第一个）
            if (!existing.price && item.price) {
                existing.price = item.price;
            }
        } else {
            productMap.set(name, {
                product_name: name,
                image_url: item.image_url || '',
                category: item.category || '',
                color_spec: item.color_spec || '',
                product_code: item.product_code || '',
                warehouse: item.warehouse || '',
                product_tag: item.product_tag || '',
                price: item.price || '',
                virtual_category: item.virtual_category || ''
            });
        }
    });

    const deduplicatedCount = productMap.size;

    // 转为数组
    const products = Array.from(productMap.values());

    // 返回去重统计（用于UI显示）
    products._deduplicateStats = {
        before: rawCount,
        after: deduplicatedCount
    };

    console.log(`<i data-lucide="check-circle"></i> [新品加载] 完成: 原始 ${rawCount} 条, 去重后 ${deduplicatedCount} 个商品`);
    return products;
}

// ========================================
// 排除商品管理
// ========================================
async function loadExcludedProducts() {
    const client = window.supabaseClient;
    if (!client) return [];

    const { data, error } = await client.from('excluded_products').select('*');
    if (error) {
        console.warn('读取排除商品失败:', error.message);
        return [];
    }
    return data || [];
}

async function addExcludedProduct(productName, reason = '') {
    const client = window.supabaseClient;
    if (!client) throw new Error('Supabase 未初始化');

    const { error } = await client.from('excluded_products').insert({
        product_name: productName.trim(),
        reason: reason,
        created_at: new Date().toISOString()
    });
    if (error) throw new Error('添加排除商品失败: ' + error.message);
    return true;
}

async function removeExcludedProduct(productName) {
    const client = window.supabaseClient;
    if (!client) throw new Error('Supabase 未初始化');

    const { error } = await client.from('excluded_products')
        .delete()
        .eq('product_name', productName);
    if (error) throw new Error('删除排除商品失败: ' + error.message);
    return true;
}

// ========================================
// 排除不可佩戴品管理 (New)
// ========================================
async function loadExcludedNonWearables() {
    const client = window.supabaseClient;
    if (!client) return [];

    const { data, error } = await client.from('excluded_non_wearables').select('*').order('created_at', { ascending: false });
    if (error) {
        console.warn('读取排除不可佩戴品失败:', error.message);
        return [];
    }
    return data || [];
}

async function addExcludedNonWearable(productName) {
    const client = window.supabaseClient;
    if (!client) throw new Error('Supabase 未初始化');

    const { error } = await client.from('excluded_non_wearables').insert({
        product_name: productName.trim()
    });
    if (error) throw new Error('添加失败: ' + error.message);
    return true;
}

async function removeExcludedNonWearable(productName) {
    const client = window.supabaseClient;
    if (!client) throw new Error('Supabase 未初始化');

    const { error } = await client.from('excluded_non_wearables')
        .delete()
        .eq('product_name', productName);
    if (error) throw new Error('删除失败: ' + error.message);
    return true;
}

// 过滤排除商品
function filterExcludedProducts(products, excludedList) {
    const excludedNames = new Set(excludedList.map(e => e.product_name));
    return products.filter(p => !excludedNames.has(p.product_name));
}

// ========================================
// 配置读取/保存
// ========================================
async function loadRankingConfig(configKey = 'filter_config') {
    console.log(`⚙️ [配置加载] 正在加载配置: ${configKey}`);
    const client = window.supabaseClient;
    if (!client) return null;

    const { data, error } = await client
        .from('ranking_config')
        .select('config_value')
        .eq('config_key', configKey)
        .single();

    if (error) {
        console.warn(`<i data-lucide="alert-triangle"></i> [配置加载] 失败, 使用默认配置:`, error.message);
        return getDefaultRankingConfig();
    }
    console.log(`<i data-lucide="check-circle"></i> [配置加载] 成功加载配置: ${configKey}`);
    return data?.config_value || getDefaultRankingConfig();
}

async function saveRankingConfig(configKey, configValue) {
    console.log(`<i data-lucide="save"></i> [配置保存] 正在保存配置: ${configKey}`);
    const client = window.supabaseClient;
    if (!client) throw new Error('Supabase 未初始化');

    const { error } = await client
        .from('ranking_config')
        .upsert({
            config_key: configKey,
            config_value: configValue,
            updated_at: new Date().toISOString()
        }, { onConflict: 'config_key' });

    if (error) {
        console.error(`<i data-lucide="x-circle"></i> [配置保存] 失败:`, error.message);
        throw new Error('保存配置失败: ' + error.message);
    }
    console.log(`<i data-lucide="check-circle"></i> [配置保存] 成功: ${configKey}`);
    return true;
}

// ========================================
// 排品方案管理
// ========================================
let cachedSchemes = null; // 缓存方案数据

function getDefaultSchemes() {
    return {
        当前方案: '默认方案',
        方案列表: {
            '默认方案': getDefaultRankingConfig()
        }
    };
}

async function loadRankingSchemes() {
    console.log('⚙️ [方案加载] 正在加载排品方案...');
    const client = window.supabaseClient;
    if (!client) return getDefaultSchemes();

    const { data, error } = await client
        .from('ranking_config')
        .select('config_value')
        .eq('config_key', 'ranking_schemes')
        .single();

    if (error || !data?.config_value) {
        console.log('⚙️ [方案加载] 无方案数据，尝试迁移旧配置...');
        const schemes = await migrateOldConfig();
        return schemes;
    }
    console.log('<i data-lucide="check-circle"></i> [方案加载] 成功');
    cachedSchemes = data.config_value;
    return data.config_value;
}

async function saveRankingSchemes(schemes) {
    console.log('<i data-lucide="save"></i> [方案保存] 正在保存排品方案...');
    cachedSchemes = schemes;
    await saveRankingConfig('ranking_schemes', schemes);
    // 同步更新 filter_config 为当前方案的配置（兼容其他读取 filter_config 的地方）
    const currentConfig = schemes.方案列表[schemes.当前方案];
    if (currentConfig) {
        await saveRankingConfig('filter_config', currentConfig);
    }
    console.log('<i data-lucide="check-circle"></i> [方案保存] 成功');
}

function getSchemeConfig(schemes, schemeName) {
    return schemes.方案列表[schemeName] || getDefaultRankingConfig();
}

async function migrateOldConfig() {
    console.log('<i data-lucide="refresh-cw"></i> [迁移] 将旧 filter_config 迁移为默认方案...');
    const oldConfig = await loadRankingConfig('filter_config');
    const schemes = {
        当前方案: '默认方案',
        方案列表: {
            '默认方案': oldConfig || getDefaultRankingConfig()
        }
    };
    await saveRankingConfig('ranking_schemes', schemes);
    cachedSchemes = schemes;
    console.log('<i data-lucide="check-circle"></i> [迁移] 完成');
    return schemes;
}

// 默认配置
function getDefaultRankingConfig() {
    return {
        分类排序: [
            "评分品A筛选条件",
            "佩戴品筛选条件",
            "周边品筛选条件",
            "评分品B筛选条件",
            "库存品筛选条件"
        ],
        结果映射: {
            "评分品A筛选条件": "1.评分品A",
            "佩戴品筛选条件": "2.佩戴品",
            "周边品筛选条件": "3.周边品",
            "评分品B筛选条件": "4.评分品B",
            "库存品筛选条件": "5.库存品"
        },
        样品序号规则: {
            "1.评分品A": { prefix: "A", start: 2, step: 2 },
            "2.佩戴品": { prefix: "P", start: 1, step: 1 },
            "3.周边品": { prefix: "Z", start: 1, step: 1 },
            "4.评分品B": { prefix: "B", start: 1, step: 1 },
            "5.库存品": { prefix: "A", start: 22, step: 2 }
        },
        新品序号规则: {
            prefix: "N", start: 1, step: 1
        },
        筛选条件: {
            "评分品A筛选条件": {
                "虚拟分类": { "等于": ["可预售"], "启用": true },
                "实际库存数": { "大于等于": 1, "启用": true },
                "评分排名": { "前几名": 10, "启用": true }
            },
            "佩戴品筛选条件": {
                "是否可佩戴": { "排除": ["不可佩戴"], "启用": true },
                "商品分类": {
                    "包含": ["发圈", "发夹 - 鸭嘴夹", "周边 - 项链", "周边 - 戒指", "周边 - 手链", "周边 - 耳钉", "周边 - 胸针"],
                    "启用": true
                },
                "可用数": { "大于等于": 2, "启用": true },
                "按子分类分别筛选": true,
                "子分类字段": "商品分类"
            },
            "周边品筛选条件": {
                "商品分类": { "包含": ["周边"], "启用": true },
                "可用数": { "前几名": 4, "启用": true }
            },
            "评分品B筛选条件": {
                "可用数": { "大于等于": 3, "启用": true },
                "评分排名": { "前几名": 15, "启用": true }
            },
            "库存品筛选条件": {
                "可用数": { "前几名": 10, "启用": true }
            }
        }
    };
}

// ========================================
// 排品计算引擎
// ========================================
function calculateRanking(products, config, categoryExcludedMap = {}) {
    const usedProducts = new Set();
    const results = {};

    console.log('[排品调试] 开始计算，商品总数:', products.length);
    console.log('[排品调试] 分类排序:', config.分类排序);

    for (const category of config.分类排序) {
        const conditions = config.筛选条件[category];
        if (!conditions) {
            console.log(`[排品调试] ${category}: 无筛选条件，跳过`);
            continue;
        }

        // 获取未使用的商品
        let available = products.filter(p => !usedProducts.has(p.product_name));

        // 获取该分类映射后的结果标签，用于查找排除列表
        const resultLabel = config.结果映射[category] || category;

        // 排除该分类下被删除的商品（结果标签匹配）
        const excludedInCategory = categoryExcludedMap[resultLabel] || [];
        if (excludedInCategory.length > 0) {
            available = available.filter(p => !excludedInCategory.includes(p.product_name));
            console.log(`[排品调试] ${category}: 排除已删除商品 ${excludedInCategory.length} 个`);
        }

        console.log(`[排品调试] ${category}: 可用商品数=${available.length}, 按子分类筛选=${conditions.按子分类分别筛选}, 选中子分类=${JSON.stringify(conditions.选中子分类)}`);

        // 应用筛选条件
        if (category.includes('库存品')) {
            // 库存品:使用标准筛选逻辑
            available = applyFilters(available, conditions);
        } else if (conditions.按子分类分别筛选) {
            // 按子分类分别筛选
            console.log(`[排品调试] ${category}: 调用 filterBySubcategory`);
            available = filterBySubcategory(available, conditions);
            console.log(`[排品调试] ${category}: filterBySubcategory 返回 ${available.length} 个商品`);
        } else {
            // 普通筛选
            available = applyFilters(available, conditions);
        }

        console.log(`[排品调试] ${category}: 筛选后商品数=${available.length}`);

        // 标记为已使用
        available.forEach(p => usedProducts.add(p.product_name));

        // 存储结果（resultLabel已在前面定义）
        results[resultLabel] = available;
    }

    return results;
}

function applyFilters(products, conditions) {
    let filtered = [...products];

    for (const [key, condition] of Object.entries(conditions)) {
        if (key === '按子分类分别筛选' || key === '子分类字段') continue;
        if (!condition.启用) continue;

        // ========== 新格式：使用 conditions 数组 ==========
        if (condition.conditions && Array.isArray(condition.conditions)) {
            // 新格式：每个规则包含多个条件，条件之间是 AND 关系
            // 先应用普通过滤条件
            filtered = filtered.filter(product => {
                return condition.conditions.every(cond => {
                    const field = FIELD_MAPPING[cond.field] || cond.field;
                    const operator = cond.operator;
                    const value = cond.value;

                    // 前几名/后几名需要单独处理
                    if (operator === '前几名' || operator === '后几名') return true;

                    return applyCondition(product, field, operator, value, cond.field);
                });
            });

            // 处理前几名/后几名
            for (const cond of condition.conditions) {
                if (cond.operator === '前几名' && cond.value) {
                    const field = FIELD_MAPPING[cond.field] || cond.field;
                    const ascending = cond.field === '评分排名'; // 评分排名越小越好
                    if (ascending) {
                        filtered = filtered.sort((a, b) => (a[field] ?? 999999) - (b[field] ?? 999999));
                    } else {
                        filtered = filtered.sort((a, b) => (b[field] || 0) - (a[field] || 0));
                    }
                    filtered = filtered.slice(0, parseInt(cond.value));
                }
                if (cond.operator === '后几名' && cond.value) {
                    const field = FIELD_MAPPING[cond.field] || cond.field;
                    const ascending = cond.field === '评分排名';
                    if (ascending) {
                        filtered = filtered.sort((a, b) => (a[field] ?? 999999) - (b[field] ?? 999999));
                    } else {
                        filtered = filtered.sort((a, b) => (b[field] || 0) - (a[field] || 0));
                    }
                    filtered = filtered.slice(-parseInt(cond.value));
                }
            }
            continue;
        }

        // ========== 旧格式：直接使用字段名作为 key ==========
        const field = FIELD_MAPPING[key] || key;

        // 特殊处理：Boolean 类型字段（如 is_wearable）
        if (key === '是否可佩戴') {
            if (condition.排除 && condition.排除.includes('不可佩戴')) {
                filtered = filtered.filter(p => p[field] === true);
            }
            continue;
        }

        if (condition.大于等于 !== undefined) {
            filtered = filtered.filter(p => (p[field] || 0) >= condition.大于等于);
        }
        if (condition.小于等于 !== undefined) {
            filtered = filtered.filter(p => (p[field] || 0) <= condition.小于等于);
        }
        if (condition.等于) {
            const values = Array.isArray(condition.等于) ? condition.等于 : [condition.等于];
            filtered = filtered.filter(p => values.includes(p[field]));
        }
        if (condition.包含) {
            const values = Array.isArray(condition.包含) ? condition.包含 : [condition.包含];
            filtered = filtered.filter(p => {
                const fieldValue = p[field] || '';
                return values.some(v => fieldValue.includes(v));
            });
        }
        if (condition.排除) {
            const values = Array.isArray(condition.排除) ? condition.排除 : [condition.排除];
            filtered = filtered.filter(p => {
                const fieldValue = p[field] || '';
                return !values.some(v => fieldValue.includes(v));
            });
        }
        if (condition.前几名) {
            const ascending = condition.排序方式 === '升序' || key === '评分排名';
            if (ascending) {
                filtered = filtered.sort((a, b) => (a[field] ?? 999999) - (b[field] ?? 999999));
            } else {
                filtered = filtered.sort((a, b) => (b[field] || 0) - (a[field] || 0));
            }
            filtered = filtered.slice(0, condition.前几名);
        }
        if (condition.后几名) {
            const ascending = condition.排序方式 === '升序' || key === '评分排名';
            if (ascending) {
                filtered = filtered.sort((a, b) => (a[field] ?? 999999) - (b[field] ?? 999999));
            } else {
                filtered = filtered.sort((a, b) => (b[field] || 0) - (a[field] || 0));
            }
            filtered = filtered.slice(-condition.后几名);
        }
    }

    return filtered;
}

// 辅助函数：应用单个条件
function applyCondition(product, field, operator, value, fieldName) {
    const fieldValue = product[field];
    // 转换为字符串用于包含/排除判断
    const fieldValueStr = String(fieldValue ?? '');

    switch (operator) {
        case '大于等于':
            return (fieldValue || 0) >= value;
        case '小于等于':
            return (fieldValue || 0) <= value;
        case '等于':
            if (Array.isArray(value)) {
                return value.includes(fieldValue);
            }
            return fieldValue == value;
        case '包含':
            const containValues = Array.isArray(value) ? value : [value];
            return containValues.some(v => fieldValueStr.includes(String(v)));
        case '排除':
            const excludeValues = Array.isArray(value) ? value : [value];
            if (fieldName === '是否可佩戴') {
                if (excludeValues.includes('不可佩戴')) {
                    return fieldValue === true;
                }
            }
            return !excludeValues.some(v => fieldValueStr.includes(String(v)));
        case '前几名':
        case '后几名':
            // 这些需要在过滤后整体处理，这里返回 true
            return true;
        default:
            return true;
    }
}

function filterBySubcategory(products, conditions) {
    const subFieldKey = conditions.子分类字段 || '商品分类';
    const subField = FIELD_MAPPING[subFieldKey] || subFieldKey;
    const selectedSubcategories = conditions.选中子分类 || [];

    console.log(`[filterBySubcategory] 输入商品数: ${products.length}`);
    console.log(`[filterBySubcategory] 子分类字段: ${subFieldKey} -> ${subField}`);
    console.log(`[filterBySubcategory] 选中子分类: ${JSON.stringify(selectedSubcategories)}`);

    const subCategories = new Map();

    // 先应用基础筛选条件
    let filtered = applyFilters(products, conditions);
    console.log(`[filterBySubcategory] applyFilters后商品数: ${filtered.length}`);

    // 如果指定了选中子分类，只保留这些分类的商品
    if (selectedSubcategories.length > 0) {
        // 先看看商品的分类都有哪些
        const sampleCategories = filtered.slice(0, 10).map(p => p[subField]);
        console.log(`[filterBySubcategory] 商品分类样本: ${JSON.stringify(sampleCategories)}`);

        filtered = filtered.filter(p => {
            const subCat = p[subField] || '';
            return selectedSubcategories.includes(subCat);
        });
        console.log(`[filterBySubcategory] 按选中子分类过滤后: ${filtered.length}`);
    }

    // 按子分类分组
    filtered.forEach(p => {
        const subCat = p[subField] || '其他';
        if (!subCategories.has(subCat)) {
            subCategories.set(subCat, []);
        }
        subCategories.get(subCat).push(p);
    });

    console.log(`[filterBySubcategory] 分组数量: ${subCategories.size}`);

    // 每个子分类取可用数 (available_qty) 最大的一个
    const result = [];
    subCategories.forEach(items => {
        items.sort((a, b) => (b.available_qty || 0) - (a.available_qty || 0));
        if (items.length > 0) {
            result.push(items[0]);
        }
    });

    console.log(`[filterBySubcategory] 最终结果: ${result.length}`);
    return result;
}

// ========================================
// 样品序号分配
// ========================================
function assignSampleNumbers(rankingResults, config) {
    const finalResults = [];

    for (const [category, products] of Object.entries(rankingResults)) {
        const rule = config.样品序号规则[category] || { prefix: 'X', start: 1, step: 1 };
        let num = rule.start;

        products.forEach(product => {
            const sampleNumber = `${rule.prefix}${String(num).padStart(2, '0')}`;
            finalResults.push({
                ...product,
                ranking_result: category,
                sample_number: sampleNumber
            });
            num += rule.step;
        });
    }

    return finalResults;
}

// ========================================
// 结果保存到数据库
// ========================================
async function saveRankingResults(results) {
    console.log(`<i data-lucide="save"></i> [结果保存] 开始保存排品结果到 ranking_results, 共 ${results.length} 条`);
    const client = window.supabaseClient;
    if (!client) throw new Error('Supabase 未初始化');

    // 先清空现有结果
    console.log('🧹 [结果保存] 清空现有结果...');
    await client.from('ranking_results').delete().gte('id', 0);

    // 准备插入数据
    const records = results.map(r => ({
        product_name: r.product_name,
        product_id: cachedProductIds[r.product_name] || r.product_id || '',
        ranking_result: r.ranking_result,
        sample_number: r.sample_number,
        image_url: r.image_url || null,
        product_code: r.product_code || null,
        warehouse: r.warehouse || null,
        total_score: r.total_score || 0,
        rating_rank: r.rating_rank || null,
        is_wearable: r.is_wearable !== undefined ? r.is_wearable : null,
        available_qty: r.available_qty || 0,
        actual_stock: r.actual_stock || 0
    }));

    // 批量插入
    const batchSize = 100;
    for (let i = 0; i < records.length; i += batchSize) {
        const batch = records.slice(i, i + batchSize);
        console.log(`<i data-lucide="upload"></i> [结果保存] 插入批次 ${Math.floor(i / batchSize) + 1}/${Math.ceil(records.length / batchSize)}`);
        const { error } = await client.from('ranking_results').insert(batch);
        if (error) throw new Error('保存结果失败: ' + error.message);
    }

    console.log(`<i data-lucide="check-circle"></i> [结果保存] 完成, 共保存 ${records.length} 条记录`);
    return records.length;
}

// ========================================
// 页面生成
// ========================================
function generateRankingPage() {
    return `
        <div class="ranking-page">
            <div class="page-intro">
                <h2><span style="color: white;"><i data-lucide="clipboard-list"></i> 排品计算</span><span style="color: #999;">（从评分和库存表汇总数据，按配置规则进行排品计算）</span></h2>
                <div style="display: flex; gap: 1rem; margin-top: 1rem; flex-wrap: wrap;">
                    <div style="flex: 1; min-width: 200px; padding: 0.75rem; background: rgba(234, 179, 8, 0.1); border: 1px solid rgba(234, 179, 8, 0.2); border-left: 3px solid #eab308; border-radius: 6px;">
                        <div style="display: flex; align-items: center; gap: 0.5rem; color: #eab308; font-weight: bold; margin-bottom: 0.25rem;">
                            <span style="font-size: 1.1rem;"><i data-lucide="alert-triangle"></i></span> <span style="letter-spacing: 1px;">步骤 1: 核对状态</span>
                        </div>
                        <div style="font-size: 0.85rem; color: var(--text-secondary); opacity: 0.9; line-height: 1.4; white-space: nowrap;">需与主播核对评分品<span style="color: #eab308; font-weight: bold;">【预售状态】</span></div>
                    </div>
                    <div style="flex: 1; min-width: 200px; padding: 0.75rem; background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.2); border-left: 3px solid #10b981; border-radius: 6px;">
                        <div style="display: flex; align-items: center; gap: 0.5rem; color: #10b981; font-weight: bold; margin-bottom: 0.25rem;">
                            <span style="font-size: 1.1rem;"><i data-lucide="save"></i></span> <span style="letter-spacing: 1px;">步骤 2: 保存结果</span>
                        </div>
                        <div style="font-size: 0.85rem; color: var(--text-secondary); opacity: 0.9; line-height: 1.4; white-space: nowrap;">计算后需保存，才可执行影刀<span style="color: #10b981; font-weight: bold;">【控库存】</span>操作。</div>
                    </div>
                    <div style="flex: 1; min-width: 200px; padding: 0.75rem; background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.2); border-left: 3px solid #ef4444; border-radius: 6px;">
                        <div style="display: flex; align-items: center; gap: 0.5rem; color: #ef4444; font-weight: bold; margin-bottom: 0.25rem;">
                            <span style="font-size: 1.1rem;"><i data-lucide="rocket"></i></span> <span style="letter-spacing: 1px;">步骤 3: 推送排品</span>
                        </div>
                        <div style="font-size: 0.85rem; color: var(--text-secondary); opacity: 0.9; line-height: 1.4; white-space: nowrap;">更新排品后，需要执行<a href="#mapping" style="color: #ef4444; text-decoration: underline; cursor: pointer; font-weight: bold;">【排品推送】</a>才可生成对照表。</div>
                    </div>
                </div>
            </div>
            
            <!-- 上部分：数据统计 + 选项 + 按钮（横向排列） -->
            <style>
                .hover-zoom-container {
                    position: relative;
                    width: 48px;
                    height: 48px;
                    margin: 0 auto;
                    cursor: zoom-in;
                }
                .hover-zoom-thumb {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                    border-radius: 6px;
                    border: 1px solid var(--border-color);
                    display: block;
                }
                .hover-zoom-large {
                    display: none;
                    position: absolute;
                    left: 54px;
                    top: -72px; /* 垂直居中: -(192/2 - 48/2) */
                    width: 192px; /* 4倍大小 */
                    height: 192px;
                    object-fit: cover;
                    border-radius: 4px;
                    box-shadow: 0 10px 25px rgba(0,0,0,0.5);
                    z-index: 1000;
                    border: 1px solid var(--border-color);
                    background: var(--bg-primary);
                }
                .hover-zoom-container:hover .hover-zoom-large {
                    display: block;
                }
            </style>
            <div class="ranking-top-bar" style="display: flex; align-items: center; gap: 1.5rem; padding: 1rem 1.5rem; background: var(--bg-secondary); margin: 1rem 0; border-radius: var(--border-radius); white-space: nowrap; overflow-x: auto;">
                <!-- 统计数据（横向排列） -->
                <div class="ranking-stats-inline" style="display: flex; gap: 1.5rem; flex: 1;">
                    <div class="stat-item-inline">
                        <span class="stat-label-sm">排名数据</span>
                        <span class="stat-value-sm" id="statRanking">--</span>
                    </div>
                    <div class="stat-item-inline">
                        <span class="stat-label-sm">库存数据</span>
                        <span class="stat-value-sm" id="statInventory">--</span>
                    </div>
                    <div class="stat-item-inline">
                        <span class="stat-label-sm">新品数据</span>
                        <span class="stat-value-sm" id="statNewProduct">--</span>
                    </div>
                    <div class="stat-item-inline">
                        <span class="stat-label-sm">排除商品</span>
                        <span class="stat-value-sm" id="statExcluded">--</span>
                    </div>
                    <div class="stat-item-inline">
                        <span class="stat-label-sm">参与排品</span>
                        <span class="stat-value-sm" id="statCombined">--</span>
                    </div>
                </div>
                
                <!-- 方案选择 -->
                <div class="stat-item-inline" style="border-left: 1px solid var(--border-color); padding-left: 1rem;">
                    <span class="stat-label-sm">排品方案</span>
                    <select id="rankingSchemeSelect" class="input" style="padding: 0.3rem 0.5rem; font-size: 0.8rem; min-width: 120px;">
                        <option>加载中...</option>
                    </select>
                </div>

                <!-- 切换选项 -->
                <div class="toggle-btn-group" style="display: flex; border-radius: 6px; overflow: hidden; border: 1px solid var(--border-color);">
                    <button type="button" class="toggle-btn active" id="btnExcludeNew" onclick="setNewProductMode(false)" style="padding: 0.5rem 0.75rem; font-size: 0.75rem; border: none; background: var(--primary-color); color: white; cursor: pointer; transition: all 0.2s;">
                        排除新品<span style="font-size: 0.625rem; opacity: 0.8; display: block;">开播前</span>
                    </button>
                    <button type="button" class="toggle-btn" id="btnIncludeNew" onclick="setNewProductMode(true)" style="padding: 0.5rem 0.75rem; font-size: 0.75rem; border: none; background: var(--bg-secondary); color: var(--text-secondary); cursor: pointer; transition: all 0.2s;">
                        包含新品<span style="font-size: 0.625rem; opacity: 0.8; display: block;">下播调拨</span>
                    </button>
                </div>
                <input type="hidden" id="includeNewProducts" value="false">
                
                <!-- 按钮 -->
                <button class="btn btn-primary" id="btnLoadAndCalculate">加载数据并计算</button>
            </div>
            
            <!-- 下部分：排品结果（全宽） -->
            <div class="upload-block" id="block-ranking-result" style="margin: 0 0 1.5rem;">

                
                <div class="scrollable-content" id="rankingResultContent">
                    <div class="placeholder-content" style="padding: 2rem 0; color: var(--text-muted);">
                        <p>请点击"加载数据并计算"按钮</p>
                    </div>
                </div>
                
                <div class="upload-actions" style="display: flex; align-items: center; gap: 0.5rem;">
                    <button class="btn btn-primary" id="btnSaveResults" disabled style="display: inline-flex; align-items: center; gap: 0.5rem; height: 40px; line-height: 1;">
                        保存结果到数据库 <span style="background: rgba(255,255,255,0.2); font-size: 0.75rem; padding: 2px 6px; border-radius: 4px; font-weight: normal; font-family: monospace;">ranking_results</span>
                    </button>
                    <span style="display: inline-flex; align-items: center; font-size: 0.875rem; background: rgba(220, 38, 38, 0.8); padding: 0 0.75rem; border-radius: 6px; color: #fff; font-weight: 500; height: 40px;">影刀读取</span>
                    <button class="btn btn-secondary" onclick="window.location.hash='#arrangement-check'; window.dispatchEvent(new HashChangeEvent('hashchange'));" style="margin-left: 1rem; height: 40px; line-height: 1;"><i data-lucide="package"></i> 历史排品</button>
                </div>
            </div>
        </div>
    `;
}

function generateRankingSettingsPage() {
    return `
        <div class="ranking-settings-page rankings-split-layout">
            <div class="page-intro">
                <h2>⚙️ 排品设置</h2>
                <p>配置筛选分类及其对应的筛选条件</p>
            </div>
            
            <!-- 方案管理栏 -->
            <div class="scheme-manager-bar" style="display:flex; align-items:center; gap:0.75rem; padding:0.75rem 1rem; background:var(--bg-secondary); border-radius:var(--border-radius); margin-bottom:1rem; flex-wrap:wrap;">
                <span style="font-size:0.85rem; color:var(--text-secondary); white-space:nowrap;">📑 排品方案</span>
                <select id="schemeSelector" class="input" style="min-width:160px; padding:0.4rem 0.6rem; font-size:0.85rem;">
                    <option>加载中...</option>
                </select>
                <div style="display:flex; gap:0.4rem;">
                    <button class="btn btn-sm btn-primary" id="btnNewScheme" title="新建方案">+ 新建</button>
                    <button class="btn btn-sm btn-secondary" id="btnRenameScheme" title="重命名方案">✏️ 重命名</button>
                    <button class="btn btn-sm btn-secondary" id="btnDeleteScheme" title="删除方案" style="color:#ef4444;">🗑️ 删除</button>
                </div>
            </div>
            
            <div class="settings-split-container">
                <!-- 左侧：分类列表 -->
                <div class="settings-split-left">
                    <div class="panel-header" style="margin-bottom:1rem; display:flex; justify-content:space-between; align-items:center;">
                        <h3 style="font-size:1rem; margin:0;">分类列表</h3>
                        <button class="btn btn-sm btn-primary" id="btnAddCategory" title="添加分类">+</button>
                    </div>
                    <ul class="sortable-list" id="categoryOrderList" style="flex:1;">
                        <li class="placeholder">加载中...</li>
                    </ul>
                    <div class="category-add-area" style="margin-top:1rem; display:none; padding-top:1rem; border-top:1px solid var(--border-color);" id="addCategoryContainer">
                         <input type="text" id="newCategoryInput" class="input" placeholder="输入名称..." style="width:100%; margin-bottom:0.5rem;">
                         <div style="display:flex; gap:0.5rem;">
                             <button class="btn btn-sm btn-primary" id="btnConfirmAddCategory" style="flex:1;">确认</button>
                             <button class="btn btn-sm btn-secondary" id="btnCancelAddCategory" style="flex:1;">取消</button>
                         </div>
                    </div>
                </div>
                
                <!-- 右侧：筛选条件 -->
                <div class="settings-split-right">
                    <div class="panel-header" style="margin-bottom:1rem; display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid var(--border-color); padding-bottom:1rem;">
                        <div>
                            <h3 style="font-size:1rem; margin:0;" id="filterSettingsTitle">筛选条件设置</h3>
                            <p class="text-muted" style="font-size:0.8rem; margin:0.25rem 0;" id="filterSettingsSubtitle">请从左侧选择一个分类进行配置</p>
                        </div>
                        <div class="settings-actions">
                             <button class="btn btn-primary" id="btnSaveSettings">保存设置</button>
                        </div>
                    </div>
                    <div id="filterConditionsContainer">
                        <div class="placeholder-content" style="padding:2rem 0;">
                            <p>请点击左侧分类以编辑筛选条件</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 排品序号分配区域 -->
            <div style="margin-top: 1.5rem; padding-top: 1.5rem; border-top: 1px solid var(--border-color);">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 1rem;">
                    <div>
                        <h3 style="font-size:1rem; margin:0;">🔢 排品序号分配</h3>
                        <p class="text-muted" style="font-size:0.8rem; margin:0.25rem 0 0;">配置各分类的生成样品序号规则</p>
                    </div>
                    <button class="btn btn-primary" id="btnSaveAssignment">保存规则</button>
                </div>
                <div id="sampleRulesContainer" style="display:grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap:1rem;">
                    <p>加载中...</p>
                </div>
            </div>
        </div>
    `;
}

function generateRankingAssignmentPage() {
    return `
        <div class="ranking-assignment-page">
            <div class="page-intro">
                <h2>🔢 排品序号分配</h2>
                <p>配置各分类及新品的生成样品序号规则</p>
            </div>
            
             <div class="ranking-options" style="margin-bottom: 2rem; padding: 1rem; background: var(--bg-secondary); border-radius: var(--border-radius-sm); display:flex; justify-content:space-between; align-items:center;">
                <span class="text-muted">此处配置的规则将用于生成最终排品结果中的样品序号</span>
                <button class="btn btn-primary" id="btnSaveAssignment">保存规则</button>
            </div>

            <div class="settings-split-container">
                <!-- 左侧：分类序号规则 -->
                <div class="card settings-split-left" style="height:auto; width: 100%;">
                    <div class="card-header">
                        <h3>分类序号规则</h3>
                    </div>
                     <div class="card-body">
                         <div id="sampleRulesContainer" style="display:grid; grid-template-columns: 1fr; gap:1rem;">
                            <p>加载中...</p>
                         </div>
                     </div>
                </div>
            </div>
        </div>
    `;
}

function generateRankingExclusionPage() {
    return `
        <div class="ranking-exclusion-page">
             <div class="page-intro">
                <h2>🚫 排除商品设置</h2>
                <p>管理不参与排品的商品名单以及不可佩戴品名单</p>
            </div>
            
            <div class="settings-split-container" style="display:grid; grid-template-columns: 1fr 1fr; gap:1.5rem;">
                <!-- 左侧：排除商品 -->
                <div class="card settings-split-left" style="height:auto;">
                    <div class="card-header" style="display:flex; justify-content:space-between; align-items:center;">
                        <h3>排除列表 <span class="db-table-tag">→ excluded_products</span></h3>
                    </div>
                    <div class="card-body">
                         <div class="input-group" style="display:flex; gap:0.5rem; margin-bottom:1rem;">
                            <input type="text" id="excludeInput" class="input" placeholder="输入商品名称..." style="flex:1;">
                            <button class="btn btn-primary" id="btnAddExclude">添加</button>
                        </div>
                        <div class="excluded-list-container" style="max-height:500px; overflow-y:auto; border:1px solid var(--border-color); border-radius:var(--border-radius-sm);">
                            <table class="data-table" style="width:100%;">
                                <thead>
                                    <tr>
                                        <th style="text-align:left; padding:0.75rem;">商品名称</th>
                                        <th style="width:60px; text-align:center; padding:0.75rem;">操作</th>
                                    </tr>
                                </thead>
                                <tbody id="excludedListBody">
                                    <tr><td colspan="2" class="text-center" style="padding:2rem;">加载中...</td></tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <!-- 右侧：不可佩戴品 -->
                <div class="card settings-split-right" style="height:auto;">
                    <div class="card-header" style="display:flex; justify-content:space-between; align-items:center;">
                        <h3>不可佩戴品 <span class="db-table-tag">→ excluded_non_wearables</span></h3>
                    </div>
                    <div class="card-body">
                         <div class="input-group" style="display:flex; gap:0.5rem; margin-bottom:1rem;">
                            <input type="text" id="excludeNonWearableInput" class="input" placeholder="输入商品名称..." style="flex:1;">
                            <button class="btn btn-primary" id="btnAddNonWearable">添加</button>
                        </div>
                        <div class="excluded-list-container" style="max-height:500px; overflow-y:auto; border:1px solid var(--border-color); border-radius:var(--border-radius-sm);">
                            <table class="data-table" style="width:100%;">
                                <thead>
                                    <tr>
                                        <th style="text-align:left; padding:0.75rem;">商品名称</th>
                                        <th style="width:60px; text-align:center; padding:0.75rem;">操作</th>
                                    </tr>
                                </thead>
                                <tbody id="excludedNonWearableListBody">
                                    <tr><td colspan="2" class="text-center" style="padding:2rem;">加载中...</td></tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// ========================================
// 排品检查页面
// ========================================
function generateRankingCheckPage() {
    return `
        <div class="ranking-check-page">
            <div class="page-intro">
                <h2>🔍 排品检查</h2>
                <p>查看数据库中已保存的排品结果</p>
            </div>
            
            <!-- 悬浮放大图片样式 -->
            <style>
                .hover-zoom-container {
                    position: relative;
                    width: 48px;
                    height: 48px;
                    margin: 0 auto;
                    cursor: zoom-in;
                }
                .hover-zoom-thumb {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                    border-radius: 6px;
                    border: 1px solid var(--border-color);
                    display: block;
                }
                .hover-zoom-large {
                    display: none;
                    position: absolute;
                    left: 54px;
                    top: -72px; /* 垂直居中: -(192/2 - 48/2) */
                    width: 192px; /* 4倍大小 */
                    height: 192px;
                    object-fit: cover;
                    border-radius: 4px;
                    box-shadow: 0 10px 25px rgba(0,0,0,0.5);
                    z-index: 1000;
                    border: 1px solid var(--border-color);
                    background: var(--bg-primary);
                }
                .hover-zoom-container:hover .hover-zoom-large {
                    display: block;
                }
            </style>
            
            <!-- 已保存排品结果（从数据库读取） -->
            <div class="upload-block" id="block-saved-ranking-result" style="margin: 1rem 0 1.5rem; min-height: 400px;">
                <div class="block-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; padding-bottom: 0.5rem; border-bottom: 1px solid var(--border-color);">
                    <h3 style="margin: 0; font-size: 1rem; display: flex; align-items: center; gap: 0.5rem;"><i data-lucide="package"></i> 已保存排品结果 <span style="font-size: 0.75rem; background: rgba(255,255,255,0.1); padding: 2px 6px; border-radius: 4px; color: var(--text-secondary); font-weight: normal; font-family: monospace;">← ranking_results</span> <span style="font-size: 0.75rem; background: rgba(220, 38, 38, 0.8); padding: 2px 8px; border-radius: 4px; color: #fff; font-weight: normal;">影刀读取</span></h3>
                    <button class="btn btn-sm" id="btnRefreshSavedResults" style="font-size: 0.75rem; height: 32px; padding: 0 12px; display: inline-flex; align-items: center; justify-content: center; gap: 4px;"><i data-lucide="refresh-cw" style="width: 14px; height: 14px;"></i> 刷新</button>
                </div>
                <div class="scrollable-content" id="savedRankingResultContent" style="max-height: 600px; overflow-y: auto;">
                    <div class="placeholder-content">
                        <p>加载中...</p>
                    </div>
                </div>
            </div>
        </div>
    `;
}

async function initRankingCheckPage() {
    const btnRefreshSavedResults = document.getElementById('btnRefreshSavedResults');

    // 自动读取数据库中已保存的排品结果
    await loadAndRenderSavedResults();

    // 绑定刷新按钮事件
    if (btnRefreshSavedResults) {
        btnRefreshSavedResults.addEventListener('click', async () => {
            btnRefreshSavedResults.disabled = true;
            btnRefreshSavedResults.textContent = '刷新中...';
            await loadAndRenderSavedResults();
            btnRefreshSavedResults.disabled = false;
            btnRefreshSavedResults.innerHTML = '<i data-lucide="refresh-cw" style="width: 14px; height: 14px;"></i> 刷新';
            window.AppUtils?.showToast?.('已刷新', 'success');
        });
    }
}

// ========================================
// 初始化
// ========================================
let cachedProducts = [];      // 库存+评分汇总数据
let cachedNewProducts = [];   // 新品数据
let cachedExcluded = [];      // 排除商品列表
let cachedResults = [];       // 排品结果
let cachedProductIds = {};    // 商品ID映射 { product_name: product_id }
let deletedItems = [];        // 已删除的项（用于撤回）
let categoryExcluded = {};    // 每个分类的排除商品列表 { category: [productName1, productName2] }
let cachedConfig = null;      // 缓存的配置

// 加载商品ID映射
async function loadProductIdMapping() {
    const client = window.supabaseClient;
    if (!client) return {};

    let allData = [];
    let page = 0;
    const pageSize = 1000;
    let hasMore = true;

    while (hasMore) {
        const { data, error } = await client
            .from('product_id_data')
            .select('product_name, product_id')
            .range(page * pageSize, (page + 1) * pageSize - 1);

        if (error) {
            console.warn('加载商品ID失败:', error.message);
            return {};
        }

        if (data && data.length > 0) {
            allData = allData.concat(data);
            if (data.length < pageSize) hasMore = false;
            else page++;
        } else {
            hasMore = false;
        }
    }

    const mapping = {};
    allData.forEach(item => {
        if (item.product_name) {
            mapping[item.product_name] = item.product_id || '';
        }
    });
    return mapping;
}

// 切换新品模式
function setNewProductMode(include) {
    const hiddenInput = document.getElementById('includeNewProducts');
    const btnExclude = document.getElementById('btnExcludeNew');
    const btnInclude = document.getElementById('btnIncludeNew');

    if (hiddenInput) hiddenInput.value = include ? 'true' : 'false';

    if (include) {
        // 包含新品
        btnInclude.style.background = 'var(--primary-color)';
        btnInclude.style.color = 'white';
        btnExclude.style.background = 'var(--bg-secondary)';
        btnExclude.style.color = 'var(--text-secondary)';
    } else {
        // 排除新品
        btnExclude.style.background = 'var(--primary-color)';
        btnExclude.style.color = 'white';
        btnInclude.style.background = 'var(--bg-secondary)';
        btnInclude.style.color = 'var(--text-secondary)';
    }
}

async function initRankingPage() {
    const btnLoadAndCalculate = document.getElementById('btnLoadAndCalculate');
    const btnSaveResults = document.getElementById('btnSaveResults');
    const rankingSchemeSelect = document.getElementById('rankingSchemeSelect');

    // 加载方案列表并填充下拉框
    const schemes = await loadRankingSchemes();
    if (rankingSchemeSelect) {
        const names = Object.keys(schemes.方案列表);
        rankingSchemeSelect.innerHTML = names.map(name =>
            `<option value="${name}" ${name === schemes.当前方案 ? 'selected' : ''}>${name}</option>`
        ).join('');
    }

    // 不再自动加载缓存结果，等待用户手动点击按钮

    if (btnLoadAndCalculate) {
        btnLoadAndCalculate.addEventListener('click', async () => {
            try {
                btnLoadAndCalculate.disabled = true;
                btnLoadAndCalculate.textContent = '加载中...';
                deletedItems = []; // 重置删除记录

                // 获取是否包含新品的设置（从hidden input读取value）
                const includeNewProducts = document.getElementById('includeNewProducts')?.value === 'true';

                // 获取各表统计
                const client = window.supabaseClient;
                const [r1, r2, r3] = await Promise.all([
                    client.from('ranking_data').select('*', { count: 'exact', head: true }),
                    client.from('inventory_data').select('*', { count: 'exact', head: true }),
                    client.from('new_product_data').select('*', { count: 'exact', head: true })
                ]);

                document.getElementById('statRanking').textContent = r1.count || 0;
                document.getElementById('statInventory').textContent = r2.count || 0;
                document.getElementById('statNewProduct').textContent = includeNewProducts ? (r3.count || 0) : `${r3.count || 0}（未参与）`;

                // 加载排除商品列表和商品ID映射
                const [excluded, productIdMapping] = await Promise.all([
                    loadExcludedProducts(),
                    loadProductIdMapping()
                ]);
                cachedExcluded = excluded;
                cachedProductIds = productIdMapping;
                document.getElementById('statExcluded').textContent = cachedExcluded.length;

                // 汇总商品数据（库存 + 评分）
                let allProducts = await loadCombinedProductData();
                let baseInventoryCount = allProducts.length;
                let addedNewCount = 0;
                let removedNewFromInventory = 0;

                // 加载新品数据（无论是否勾选都需要加载，用于排除判断）
                cachedNewProducts = await loadNewProductData();
                const newProductStats = cachedNewProducts._deduplicateStats || { before: r3.count, after: cachedNewProducts.length };

                if (includeNewProducts) {
                    // 勾选：正常加载库存数据，并将新品添加到排品列表
                    document.getElementById('statNewProduct').textContent = `${newProductStats.after}/${newProductStats.before}`;

                    // 将新品添加到商品列表（赋予默认评分排名）
                    cachedNewProducts.forEach(np => {
                        if (!allProducts.find(p => p.product_name === np.product_name)) {
                            allProducts.push({
                                ...np,
                                rating_rank: 999999,  // 新品默认排名最后
                                total_score: 0,
                                is_new_product: true
                            });
                            addedNewCount++;
                        }
                    });
                } else {
                    // 不勾选：从库存数据中排除与新品名称相同的产品
                    const newProductNames = new Set(cachedNewProducts.map(np => np.product_name));
                    const originalCount = allProducts.length;
                    allProducts = allProducts.filter(p => !newProductNames.has(p.product_name));
                    removedNewFromInventory = originalCount - allProducts.length;
                    baseInventoryCount = allProducts.length;

                    document.getElementById('statNewProduct').innerHTML = `${newProductStats.after}/${newProductStats.before}<span title="排除的为多SKU部分商品（重复商品名称的新品）" style="cursor: help; border-bottom: 1px dashed currentColor;">（已排除${removedNewFromInventory}个）</span>`;
                    cachedNewProducts = [];  // 不参与排品
                }

                // 过滤排除商品
                const countBeforeExclude = allProducts.length;
                cachedProducts = filterExcludedProducts(allProducts, cachedExcluded);
                const countAfterExclude = cachedProducts.length;
                const excludedCount = countBeforeExclude - countAfterExclude;

                // 参与排品的商品总数及计算逻辑显示
                const totalCount = cachedProducts.length;
                document.getElementById('statCombined').textContent = totalCount;

                // === 自动执行计算 ===
                btnLoadAndCalculate.textContent = '计算中...';

                // 加载当前选中方案的配置
                const selectedScheme = rankingSchemeSelect?.value || schemes.当前方案;
                const config = getSchemeConfig(schemes, selectedScheme);
                cachedConfig = config;  // 缓存配置用于删除后重新计算
                categoryExcluded = {};  // 重置分类排除列表
                deletedItems = [];      // 重置删除记录

                // 执行排品计算
                const rankingResults = calculateRanking(cachedProducts, config, categoryExcluded);

                // 分配样品序号
                cachedResults = assignSampleNumbers(rankingResults, config);

                // 显示结果
                renderRankingResults(cachedResults);

                btnSaveResults.disabled = false;
                window.AppUtils?.showToast?.(`排品完成，共 ${cachedResults.length} 个商品`, 'success');
            } catch (error) {
                console.error('加载/计算失败:', error);
                window.AppUtils?.showToast?.('加载/计算失败: ' + error.message, 'error');
            } finally {
                btnLoadAndCalculate.disabled = false;
                btnLoadAndCalculate.textContent = '加载数据并计算';
            }
        });
    }

    if (btnSaveResults) {
        btnSaveResults.addEventListener('click', async () => {
            try {
                btnSaveResults.disabled = true;
                btnSaveResults.textContent = '保存中...';

                const count = await saveRankingResults(cachedResults);
                window.AppUtils?.showToast?.(`已保存 ${count} 条结果到数据库`, 'success');

                // 显示红色悬浮提示，提醒用户需要执行排品对照
                window.AppUtils?.showCenterAlert?.('更新排品后，需要执行排品对照，方可生成对照表。');
            } catch (error) {
                console.error('保存失败:', error);
                window.AppUtils?.showToast?.('保存失败: ' + error.message, 'error');
            } finally {
                btnSaveResults.disabled = false;
                btnSaveResults.textContent = '保存结果到数据库';
            }
        });
    }
}

// 删除排品项（从当前分类移除，重新计算补充新商品）
async function removeRankingItem(category, productName) {
    // 获取被删除商品的信息（用于弹窗显示）
    const removedItem = cachedResults.find(r => r.product_name === productName && r.ranking_result === category);
    const removedInfo = {
        name: productName,
        image: removedItem?.image_url || ''
    };

    // 获取该分类当前的商品列表
    const oldCategoryItems = cachedResults
        .filter(r => r.ranking_result === category)
        .map(r => r.product_name);

    // 将商品加入该分类的排除列表
    if (!categoryExcluded[category]) {
        categoryExcluded[category] = [];
    }
    categoryExcluded[category].push(productName);

    // 记录删除（用于撤回）
    deletedItems.push({
        category: category,
        productName: productName,
        removedInfo: removedInfo
    });

    // 重新计算排品（使用缓存的数据和配置）
    if (cachedProducts.length > 0 && cachedConfig) {
        const rankingResults = calculateRanking(cachedProducts, cachedConfig, categoryExcluded);
        cachedResults = assignSampleNumbers(rankingResults, cachedConfig);

        // 找出该分类新增的商品（补充进来的）
        const newCategoryItems = cachedResults
            .filter(r => r.ranking_result === category)
            .map(r => r.product_name);

        const addedProductName = newCategoryItems.find(name => !oldCategoryItems.includes(name) || name === productName ? false : true);
        // 更精确的查找：排除被删除的，找新增的
        const addedProduct = cachedResults.find(r =>
            r.ranking_result === category &&
            r.product_name !== productName &&
            !oldCategoryItems.includes(r.product_name)
        );

        const addedInfo = addedProduct
            ? { name: addedProduct.product_name, image: addedProduct.image_url || '' }
            : { name: '（无可补充商品）', image: '' };

        renderRankingResults(cachedResults);

        // 显示替换弹窗
        window.AppUtils?.showReplaceModal?.(removedInfo, addedInfo, 'replace');
    } else {
        window.AppUtils?.showToast?.('删除成功，但无法重新计算（请重新加载数据）', 'warning');
    }
}

// 撤回删除
async function undoDeleteRankingItem() {
    if (deletedItems.length === 0) {
        window.AppUtils?.showToast?.('没有可撤回的操作', 'warning');
        return;
    }

    const last = deletedItems.pop();

    // 获取撤回前该分类的商品列表（用于找出被移除的补充商品）
    const oldCategoryItems = cachedResults
        .filter(r => r.ranking_result === last.category)
        .map(r => r.product_name);

    // 从分类排除列表中移除
    if (categoryExcluded[last.category]) {
        const idx = categoryExcluded[last.category].indexOf(last.productName);
        if (idx !== -1) {
            categoryExcluded[last.category].splice(idx, 1);
        }
    }

    // 重新计算排品
    if (cachedProducts.length > 0 && cachedConfig) {
        const rankingResults = calculateRanking(cachedProducts, cachedConfig, categoryExcluded);
        cachedResults = assignSampleNumbers(rankingResults, cachedConfig);

        // 找出该分类被移除的商品（之前补充的，现在被挤出去的）
        const newCategoryItems = cachedResults
            .filter(r => r.ranking_result === last.category)
            .map(r => r.product_name);

        // 被挤出去的商品 = 老列表有但新列表没有的
        const removedProductName = oldCategoryItems.find(name => !newCategoryItems.includes(name));
        const removedProduct = cachedProducts.find(p => p.product_name === removedProductName);

        // 恢复的商品信息
        const restoredInfo = last.removedInfo || { name: last.productName, image: '' };
        // 被挤出去的商品信息
        const kickedInfo = removedProduct
            ? { name: removedProduct.product_name, image: removedProduct.image_url || '' }
            : { name: removedProductName || '（无）', image: '' };

        renderRankingResults(cachedResults);

        // 显示撤回弹窗（恢复的商品 ← 被挤出去的商品）
        window.AppUtils?.showReplaceModal?.(kickedInfo, restoredInfo, 'undo');
    }
}

function renderRankingResults(results) {
    const container = document.getElementById('rankingResultContent');
    if (!container) return;

    // 按分类分组
    const grouped = {};
    results.forEach(r => {
        if (!grouped[r.ranking_result]) grouped[r.ranking_result] = [];
        grouped[r.ranking_result].push(r);
    });

    // 计算未匹配ID的商品及其编码
    const unmatchedItems = results.filter(r => !cachedProductIds[r.product_name]);
    const unmatchedCount = unmatchedItems.length;
    const unmatchedCodes = unmatchedItems
        .map(r => r.product_code)
        .filter(code => code && code !== '--')
        .join(',');

    // 缓存结果到localStorage（48小时有效）
    const cacheData = {
        results: results,
        productIds: cachedProductIds,
        timestamp: Date.now()
    };
    localStorage.setItem('rankingResultsCache', JSON.stringify(cacheData));

    // 未匹配商品警告提示
    const unmatchedWarning = unmatchedCount > 0
        ? `<div style="background: rgba(239, 68, 68, 0.15); border: 1px solid var(--warning-color); border-radius: var(--border-radius-sm); padding: 0.75rem 1rem; margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem;">
               <span style="font-size: 1.25rem;"><i data-lucide="alert-triangle"></i></span>
               <span style="color: var(--warning-color); font-weight: 500;">有 ${unmatchedCount} 个商品疑似未上架</span>
               <span style="color: var(--text-muted); font-size: 0.85rem; margin-left: 0.5rem;">可手动填写商品ID后点击保存</span>
               <button onclick="copyToClipboard('${unmatchedCodes}')" style="margin-left: auto; padding: 0.25rem 0.75rem; font-size: 0.75rem; background: var(--warning-color); color: #fff; border: none; border-radius: 4px; cursor: pointer; white-space: nowrap;">批量复制未匹配商品ID编码</button>
           </div>`
        : '';

    let html = `
        ${unmatchedWarning}
        <div class="ranking-result-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; padding-bottom: 0.5rem; border-bottom: 1px solid var(--border-color);">
            <div style="display: flex; align-items: center; gap: 1rem;">
                <h3 style="margin: 0; font-size: 1rem; display: flex; align-items: center; gap: 0.5rem;">📊 排品结果 <span style="font-size: 0.75rem; background: rgba(255,255,255,0.1); padding: 2px 6px; border-radius: 4px; color: var(--text-secondary); font-weight: normal; font-family: monospace;">→ ranking_results</span></h3>
                <span style="font-size: 0.875rem; color: var(--text-secondary);">共 ${results.length} 个商品</span>
            </div>
            <button class="btn btn-sm" onclick="undoDeleteRankingItem()" style="font-size: 0.75rem; padding: 0.25rem 0.75rem;" ${deletedItems.length === 0 ? 'disabled' : ''}>
                ↩ 撤回 (${deletedItems.length})
            </button>
        </div>
    `;

    for (const [category, items] of Object.entries(grouped)) {
        // 收集该分类的编码和ID用于批量复制
        const codes = items.map(i => i.product_code).filter(c => c && c !== '--').join(',');
        const ids = items.map(i => cachedProductIds[i.product_name]).filter(id => id).join(',');

        html += `
            <div class="result-category">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                    <h4 style="margin: 0;">${category} <span class="count">(${items.length})</span></h4>
                    <div style="display: flex; gap: 0.5rem;">
                        <button class="btn btn-sm" onclick="copyToClipboard('${codes}')" style="font-size: 0.7rem; padding: 0.25rem 0.5rem;"><i data-lucide="clipboard-list"></i> 复制编码</button>
                        <button class="btn btn-sm" onclick="copyToClipboard('${ids}')" style="font-size: 0.7rem; padding: 0.25rem 0.5rem;"><i data-lucide="clipboard-list"></i> 复制ID</button>
                    </div>
                </div>
                <div class="result-items-table">
                    <table class="ranking-table" style="width: 100%; border-collapse: collapse; font-size: 0.875rem;">
                        <thead>
                            <tr style="background: var(--bg-secondary); color: var(--text-secondary);">
                                <th style="padding: 0.75rem 0.5rem; text-align: center; width: 80px;">图片</th>
                                <th style="padding: 0.75rem 0.5rem; text-align: center; width: 60px;">序号</th>
                                <th style="padding: 0.75rem 0.5rem; text-align: left; width: 300px;">商品名称</th>
                                <th style="padding: 0.75rem 0.5rem; text-align: left; width: 160px;">商品ID</th>
                                <th style="padding: 0.75rem 0.5rem; text-align: left; width: 180px;">商品编码</th>
                                <th style="padding: 0.75rem 0.5rem; text-align: center; width: 50px;">操作</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${items.map(item => {
            const productId = cachedProductIds[item.product_name];
            const hasNoId = !productId;
            // 为无ID商品显示输入框和保存按钮，否则显示ID和复制按钮
            const escapedProductName = item.product_name.replace(/'/g, "\\'").replace(/"/g, '\\"');
            const idDisplay = productId
                ? `${productId} <button onclick="copyToClipboard('${productId}')" style="background: none; border: none; cursor: pointer; font-size: 0.75rem; color: var(--text-muted);" title="复制"><i data-lucide="clipboard-list"></i></button>`
                : `<div style="display: flex; align-items: center; gap: 0.5rem;">
                       <input type="text" class="manual-product-id-input" data-product-name="${escapedProductName}" 
                              placeholder="输入商品ID" 
                              style="width: 120px; padding: 0.25rem 0.5rem; font-size: 0.8rem; border: 1px solid var(--warning-color); border-radius: 4px; background: var(--bg-tertiary); color: var(--text-primary);">
                       <button onclick="saveManualProductId('${escapedProductName}', this)" 
                               style="padding: 0.25rem 0.5rem; font-size: 0.7rem; background: var(--primary-color); color: white; border: none; border-radius: 4px; cursor: pointer; white-space: nowrap;">
                           <i data-lucide="save"></i> 保存
                       </button>
                       <span style="color: var(--warning-color); font-size: 0.75rem;">疑似未上架</span>
                   </div>`;
            const imageUrl = item.image_url || '';
            // 处理图片URL，可能包含多个逗号分隔的URL
            const firstImageUrl = imageUrl ? imageUrl.split(',')[0].trim() : '';
            // 使用 .hover-zoom-container 和双图结构实现悬浮放大（避免闪烁）
            const imageHtml = firstImageUrl
                ? `<div class="hover-zoom-container">
                       <img src="${firstImageUrl}" class="hover-zoom-thumb" referrerpolicy="no-referrer" onerror="this.parentElement.innerHTML='<span style=\\'color: var(--text-muted); font-size: 0.625rem;\\'>加载失败</span>'">
                       <img src="${firstImageUrl}" class="hover-zoom-large" referrerpolicy="no-referrer">
                   </div>`
                : `<div style="width: 48px; height: 48px; background: var(--bg-hover); border-radius: 6px; display: flex; align-items: center; justify-content: center; color: var(--text-muted); font-size: 0.625rem; border: 1px solid var(--border-color);">无图</div>`;
            const productCode = item.product_code || '--';
            // 处理多编码显示：最多显示2个，其余悬浮显示
            let codeDisplay = '--';
            if (productCode !== '--') {
                const codes = productCode.split(',').map(c => c.trim()).filter(c => c);
                const allCodes = codes.join(',');
                if (codes.length <= 2) {
                    codeDisplay = `${allCodes} <button onclick="copyToClipboard('${allCodes}')" style="background: none; border: none; cursor: pointer; font-size: 0.75rem; color: var(--text-muted);" title="复制"><i data-lucide="clipboard-list"></i></button>`;
                } else {
                    const displayCodes = codes.slice(0, 2).join(',');
                    const moreCount = codes.length - 2;
                    codeDisplay = `${displayCodes}<span title="${allCodes}" style="cursor: help; color: var(--primary-color); margin-left: 4px;">+${moreCount}个</span> <button onclick="copyToClipboard('${allCodes}')" style="background: none; border: none; cursor: pointer; font-size: 0.75rem; color: var(--text-muted);" title="复制全部编码"><i data-lucide="clipboard-list"></i></button>`;
                }
            }
            // 无ID商品红底
            const rowStyle = hasNoId
                ? 'border-bottom: 1px solid var(--border-color); background: rgba(239, 68, 68, 0.15);'
                : 'border-bottom: 1px solid var(--border-color);';

            return `
                                    <tr style="${rowStyle}">
                                        <td style="padding: 0.75rem 0.5rem; text-align: center;">${imageHtml}</td>
                                        <td style="padding: 0.75rem 0.5rem; text-align: center; font-weight: 600; color: var(--primary-color); font-size: 1rem;">${item.sample_number}</td>
                                        <td style="padding: 0.75rem 0.5rem; max-width: 300px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${item.product_name}">${item.product_name} <button onclick="copyToClipboard('${escapedProductName}')" style="background: none; border: none; cursor: pointer; font-size: 0.75rem; color: var(--text-muted);" title="复制商品名称"><i data-lucide="clipboard-list"></i></button></td>
                                        <td style="padding: 0.75rem 0.5rem; text-align: left;">${idDisplay}</td>
                                        <td style="padding: 0.75rem 0.5rem; color: var(--text-secondary); text-align: left;">${codeDisplay}</td>
                                        <td style="padding: 0.75rem 0.5rem; text-align: center;">
                                            <button class="btn-delete-item" onclick="removeRankingItem('${category}', '${item.product_name.replace(/'/g, "\\'")}')" title="从此分类删除" style="background: none; border: none; cursor: pointer; color: var(--error-color); font-size: 1rem; padding: 0.25rem;">✕</button>
                                        </td>
                                    </tr>
                                `;
        }).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }

    container.innerHTML = html || '<p class="placeholder">无排品结果</p>';
}

// 保存手动填写的商品ID到 product_id_data 表
async function saveManualProductId(productName, buttonElement) {
    // 从按钮的前一个兄弟元素（输入框）获取值
    const input = buttonElement.previousElementSibling;
    const productId = input?.value?.trim();

    if (!productId) {
        window.AppUtils?.showToast?.('请输入商品ID', 'warning');
        return;
    }

    const client = window.supabaseClient;
    if (!client) {
        window.AppUtils?.showToast?.('数据库连接失败', 'error');
        return;
    }

    try {
        buttonElement.disabled = true;
        buttonElement.textContent = '保存中...';

        // 先查询是否已存在该商品名称
        const { data: existing, error: queryError } = await client
            .from('product_id_data')
            .select('id')
            .eq('product_name', productName)
            .limit(1);

        if (queryError) throw queryError;

        if (existing && existing.length > 0) {
            // 已存在，更新
            const { error: updateError } = await client
                .from('product_id_data')
                .update({ product_id: productId })
                .eq('product_name', productName);
            if (updateError) throw updateError;
        } else {
            // 不存在，插入新记录
            const { error: insertError } = await client
                .from('product_id_data')
                .insert({ product_name: productName, product_id: productId });
            if (insertError) throw insertError;
        }

        if (false) throw new Error(); // 占位符，保持结构

        // 更新内存缓存
        cachedProductIds[productName] = productId;

        // 更新 localStorage 缓存
        const cached = localStorage.getItem('rankingResultsCache');
        if (cached) {
            try {
                const cacheData = JSON.parse(cached);
                cacheData.productIds[productName] = productId;
                localStorage.setItem('rankingResultsCache', JSON.stringify(cacheData));
            } catch (e) { }
        }

        // 更新 UI：替换输入框为已保存的ID显示
        const tdElement = buttonElement.closest('td');
        const trElement = buttonElement.closest('tr');
        if (tdElement) {
            tdElement.innerHTML = `${productId} <button onclick="copyToClipboard('${productId}')" style="background: none; border: none; cursor: pointer; font-size: 0.75rem; color: var(--text-muted);" title="复制"><i data-lucide="clipboard-list"></i></button>`;
        }
        // 移除红色背景
        if (trElement) {
            trElement.style.background = '';
        }

        // 更新未匹配数量提示
        updateUnmatchedWarning();

        window.AppUtils?.showToast?.(`已保存商品ID到 product_id_data 表`, 'success');
    } catch (error) {
        console.error('保存商品ID失败:', error);
        window.AppUtils?.showToast?.('保存失败: ' + error.message, 'error');
        buttonElement.disabled = false;
        buttonElement.innerHTML = '<i data-lucide="save"></i> 保存';
    }
}

// 更新未匹配商品数量警告
function updateUnmatchedWarning() {
    const container = document.getElementById('rankingResultContent');
    if (!container) return;

    // 计算剩余未匹配数量
    const remainingInputs = container.querySelectorAll('.manual-product-id-input').length;

    // 找到警告提示元素并更新
    const warningDiv = container.querySelector('div[style*="rgba(239, 68, 68, 0.15)"]');
    if (warningDiv) {
        if (remainingInputs === 0) {
            warningDiv.remove();
        } else {
            const countSpan = warningDiv.querySelector('span[style*="font-weight: 500"]');
            if (countSpan) {
                countSpan.textContent = `有 ${remainingInputs} 个商品疑似未上架`;
            }
        }
    }
}

// 复制到剪贴板
function copyToClipboard(text) {
    if (!text) {
        window.AppUtils?.showToast?.('没有可复制的内容', 'warning');
        return;
    }
    navigator.clipboard.writeText(text).then(() => {
        window.AppUtils?.showToast?.('已复制到剪贴板', 'success');
    }).catch(err => {
        console.error('复制失败:', err);
        window.AppUtils?.showToast?.('复制失败', 'error');
    });
}

// 从数据库读取并渲染已保存的排品结果
async function loadAndRenderSavedResults() {
    const container = document.getElementById('savedRankingResultContent');
    if (!container) return;

    const client = window.supabaseClient;
    if (!client) {
        container.innerHTML = '<p class="placeholder">数据库连接失败</p>';
        return;
    }

    try {
        // 从 ranking_results 表读取数据
        const { data, error } = await client
            .from('ranking_results')
            .select('*')
            .order('ranking_result', { ascending: true })
            .order('sample_number', { ascending: true });

        if (error) throw error;

        if (!data || data.length === 0) {
            container.innerHTML = '<div class="placeholder-content"><p>暂无已保存的数据</p></div>';
            return;
        }

        // 加载商品ID映射
        const savedProductIds = await loadProductIdMapping();

        // 按分类分组
        const grouped = {};
        data.forEach(r => {
            if (!grouped[r.ranking_result]) grouped[r.ranking_result] = [];
            grouped[r.ranking_result].push(r);
        });

        let html = `
            <div style="font-size: 0.875rem; color: var(--text-secondary); margin-bottom: 1rem;">
                共 ${data.length} 个商品
            </div>
        `;

        for (const [category, items] of Object.entries(grouped)) {
            html += `
                <div class="result-category" style="margin-bottom: 1.5rem;">
                    <h4 style="margin: 0 0 0.5rem 0;">${category} <span class="count" style="font-size: 0.85rem; color: var(--text-muted);">(${items.length})</span></h4>
                    <div class="result-items-table">
                        <table class="ranking-table" style="width: 100%; border-collapse: collapse; font-size: 0.875rem;">
                            <thead>
                                <tr style="background: var(--bg-secondary); color: var(--text-secondary);">
                                    <th style="padding: 0.75rem 0.5rem; text-align: center; width: 80px;">图片</th>
                                    <th style="padding: 0.75rem 0.5rem; text-align: center; width: 60px;">序号</th>
                                    <th style="padding: 0.75rem 0.5rem; text-align: left; width: 250px;">商品名称</th>
                                    <th style="padding: 0.75rem 0.5rem; text-align: left; width: 180px;">商品编码</th>
                                    <th style="padding: 0.75rem 0.5rem; text-align: left; width: 200px;">商品ID</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${items.map(item => {
                const productId = savedProductIds[item.product_name];
                const idDisplay = productId
                    ? productId
                    : '<span style="color: var(--warning-color);">疑似未上架</span>';
                const imageUrl = item.image_url || '';
                const firstImageUrl = imageUrl ? imageUrl.split(',')[0].trim() : '';
                const imageHtml = firstImageUrl
                    ? `<div class="hover-zoom-container">
                           <img src="${firstImageUrl}" class="hover-zoom-thumb" referrerpolicy="no-referrer" onerror="this.parentElement.innerHTML='<span style=\\'color: var(--text-muted); font-size: 0.625rem;\\'>加载失败</span>'">
                           <img src="${firstImageUrl}" class="hover-zoom-large" referrerpolicy="no-referrer">
                       </div>`
                    : `<div style="width: 48px; height: 48px; background: var(--bg-hover); border-radius: 6px; display: flex; align-items: center; justify-content: center; color: var(--text-muted); font-size: 0.625rem; border: 1px solid var(--border-color);">无图</div>`;
                const productCode = item.product_code || '--';
                const hasNoId = !productId;
                const rowStyle = hasNoId
                    ? 'border-bottom: 1px solid var(--border-color); background: rgba(239, 68, 68, 0.15);'
                    : 'border-bottom: 1px solid var(--border-color);';

                return `
                                        <tr style="${rowStyle}">
                                            <td style="padding: 0.75rem 0.5rem; text-align: center;">${imageHtml}</td>
                                            <td style="padding: 0.75rem 0.5rem; text-align: center; font-weight: 600; color: var(--primary-color); font-size: 1rem;">${item.sample_number || '--'}</td>
                                            <td style="padding: 0.75rem 0.5rem; max-width: 250px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${item.product_name}">${item.product_name}</td>
                                            <td style="padding: 0.75rem 0.5rem; color: var(--text-secondary); text-align: left;">${productCode}</td>
                                            <td style="padding: 0.75rem 0.5rem; text-align: left;">${idDisplay}</td>
                                        </tr>
                                    `;
            }).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            `;
        }

        container.innerHTML = html;
    } catch (error) {
        console.error('读取已保存排品结果失败:', error);
        container.innerHTML = `<div class="placeholder-content"><p>读取失败: ${error.message}</p></div>`;
    }
}

// 加载缓存的结果（48小时内有效）
function loadCachedResults() {
    try {
        const cached = localStorage.getItem('rankingResultsCache');
        if (!cached) return null;

        const data = JSON.parse(cached);
        const CACHE_DURATION = 48 * 60 * 60 * 1000; // 48小时

        if (Date.now() - data.timestamp > CACHE_DURATION) {
            localStorage.removeItem('rankingResultsCache');
            return null;
        }

        return data;
    } catch (e) {
        console.warn('加载缓存失败:', e);
        return null;
    }
}

async function initRankingSettings() {
    // ========== 方案管理 ==========
    let schemes = await loadRankingSchemes();
    let currentSchemeName = schemes.当前方案;
    let config = getSchemeConfig(schemes, currentSchemeName);

    const schemeSelector = document.getElementById('schemeSelector');
    const btnNewScheme = document.getElementById('btnNewScheme');
    const btnRenameScheme = document.getElementById('btnRenameScheme');
    const btnDeleteScheme = document.getElementById('btnDeleteScheme');

    function populateSchemeSelector() {
        if (!schemeSelector) return;
        const names = Object.keys(schemes.方案列表);
        schemeSelector.innerHTML = names.map(name =>
            `<option value="${name}" ${name === currentSchemeName ? 'selected' : ''}>${name}</option>`
        ).join('');
    }

    function switchScheme(schemeName) {
        currentSchemeName = schemeName;
        schemes.当前方案 = schemeName;
        config = getSchemeConfig(schemes, schemeName);
        selectedCategory = null;
        renderCategories();
        renderSampleRules();
        if (filterContainer) filterContainer.innerHTML = '<div class="placeholder-content" style="padding:2rem 0;"><p>请点击左侧分类以编辑筛选条件</p></div>';
        if (filterTitle) filterTitle.textContent = '筛选条件设置';
        if (filterSubtitle) filterSubtitle.textContent = '请从左侧选择一个分类进行配置';
    }

    populateSchemeSelector();

    if (schemeSelector) {
        schemeSelector.addEventListener('change', (e) => {
            switchScheme(e.target.value);
            saveRankingSchemes(schemes);
        });
    }

    if (btnNewScheme) {
        btnNewScheme.addEventListener('click', () => {
            const name = prompt('请输入新方案名称：');
            if (!name || !name.trim()) return;
            const trimmed = name.trim();
            if (schemes.方案列表[trimmed]) {
                window.AppUtils?.showToast?.('方案名称已存在', 'error');
                return;
            }
            // 深拷贝当前方案作为新方案
            schemes.方案列表[trimmed] = JSON.parse(JSON.stringify(config));
            currentSchemeName = trimmed;
            schemes.当前方案 = trimmed;
            config = getSchemeConfig(schemes, trimmed);
            populateSchemeSelector();
            switchScheme(trimmed);
            saveRankingSchemes(schemes);
            window.AppUtils?.showToast?.(`已创建方案: ${trimmed}`, 'success');
        });
    }

    if (btnRenameScheme) {
        btnRenameScheme.addEventListener('click', () => {
            const newName = prompt('请输入新名称：', currentSchemeName);
            if (!newName || !newName.trim() || newName.trim() === currentSchemeName) return;
            const trimmed = newName.trim();
            if (schemes.方案列表[trimmed]) {
                window.AppUtils?.showToast?.('方案名称已存在', 'error');
                return;
            }
            schemes.方案列表[trimmed] = schemes.方案列表[currentSchemeName];
            delete schemes.方案列表[currentSchemeName];
            schemes.当前方案 = trimmed;
            currentSchemeName = trimmed;
            config = getSchemeConfig(schemes, trimmed);
            populateSchemeSelector();
            saveRankingSchemes(schemes);
            window.AppUtils?.showToast?.(`已重命名为: ${trimmed}`, 'success');
        });
    }

    if (btnDeleteScheme) {
        btnDeleteScheme.addEventListener('click', () => {
            const names = Object.keys(schemes.方案列表);
            if (names.length <= 1) {
                window.AppUtils?.showToast?.('至少需要保留一个方案', 'error');
                return;
            }
            if (!confirm(`确定删除方案 "${currentSchemeName}" 吗？`)) return;
            delete schemes.方案列表[currentSchemeName];
            const remaining = Object.keys(schemes.方案列表);
            currentSchemeName = remaining[0];
            schemes.当前方案 = currentSchemeName;
            config = getSchemeConfig(schemes, currentSchemeName);
            populateSchemeSelector();
            switchScheme(currentSchemeName);
            saveRankingSchemes(schemes);
            window.AppUtils?.showToast?.('方案已删除', 'success');
        });
    }

    // 预加载商品分类选项（从 listing_category_mapping 表获取）
    let productCategoryOptions = [];
    try {
        const client = window.supabaseClient;
        if (client) {
            const { data, error } = await client
                .from('listing_category_mapping')
                .select('source_category')
                .not('source_category', 'is', null);
            if (!error && data) {
                // 去重并排序
                productCategoryOptions = [...new Set(data.map(d => d.source_category).filter(Boolean))].sort();
            }
        }
    } catch (e) {
        console.warn('加载商品分类失败:', e);
    }

    const orderList = document.getElementById('categoryOrderList');
    const filterContainer = document.getElementById('filterConditionsContainer');
    const filterTitle = document.getElementById('filterSettingsTitle');
    const filterSubtitle = document.getElementById('filterSettingsSubtitle');
    const btnSave = document.getElementById('btnSaveSettings');

    let selectedCategory = null;

    // 渲染左侧分类列表
    function renderCategories() {
        if (!orderList) return;

        if (!config.分类排序 || config.分类排序.length === 0) {
            orderList.innerHTML = '<li class="placeholder">暂无分类，请添加</li>';
            return;
        }

        orderList.innerHTML = config.分类排序.map((cat, idx) => {
            const displayName = config.结果映射[cat] || cat;
            const isActive = cat === selectedCategory;
            const activeStyle = isActive
                ? 'background:var(--primary-color); color:white; border-color:var(--primary-color);'
                : 'background:var(--bg-tertiary); border-color:transparent;';
            return `
                <li class="sortable-item ${isActive ? 'active' : ''}" data-category="${cat}" data-index="${idx}" style="cursor:pointer; padding:0.75rem; border:1px solid; border-radius:var(--border-radius-sm); margin-bottom:0.5rem; display:flex; align-items:center; justify-content:space-between; transition:all 0.15s ease; ${activeStyle}">
                    <span class="category-name" style="font-weight:500;">${idx + 1}. ${displayName}</span>
                    <div class="category-actions" style="display:flex; gap:0.25rem;">
                         <button class="btn-icon btn-move-up" data-index="${idx}" title="上移" style="font-size:0.8rem; color:${isActive ? 'rgba(255,255,255,0.8)' : 'var(--text-muted)'}; opacity:0.7;">↑</button>
                         <button class="btn-icon btn-move-down" data-index="${idx}" title="下移" style="font-size:0.8rem; color:${isActive ? 'rgba(255,255,255,0.8)' : 'var(--text-muted)'}; opacity:0.7;">↓</button>
                        <button class="btn-icon btn-delete" data-category="${cat}" title="删除" style="font-size:0.8rem; color:${isActive ? 'rgba(255,255,255,0.8)' : 'var(--text-muted)'}; opacity:0.7; margin-left:0.5rem;">✕</button>
                    </div>
                </li>
            `;
        }).join('');

        // 绑定点击事件（选中）
        orderList.querySelectorAll('.sortable-item').forEach(li => {
            li.addEventListener('click', (e) => {
                // 如果点的是按钮，不处理选中
                if (e.target.closest('.category-actions')) return;

                const cat = li.dataset.category;
                selectedCategory = cat;
                renderCategories(); // 刷新高亮
                renderFilterSettings(cat);
            });
        });

        // 绑定上移/下移事件
        orderList.querySelectorAll('.btn-move-up').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const idx = parseInt(btn.dataset.index);
                if (idx > 0) {
                    const temp = config.分类排序[idx];
                    config.分类排序[idx] = config.分类排序[idx - 1];
                    config.分类排序[idx - 1] = temp;
                    renderCategories();
                    saveConfigQuietly();
                }
            });
        });

        orderList.querySelectorAll('.btn-move-down').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const idx = parseInt(btn.dataset.index);
                if (idx < config.分类排序.length - 1) {
                    const temp = config.分类排序[idx];
                    config.分类排序[idx] = config.分类排序[idx + 1];
                    config.分类排序[idx + 1] = temp;
                    renderCategories();
                    saveConfigQuietly();
                }
            });
        });

        // 绑定删除事件
        orderList.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const cat = btn.dataset.category;
                const name = config.结果映射[cat] || cat;
                if (confirm(`确定删除分类"${name}"吗？`)) {
                    config.分类排序 = config.分类排序.filter(c => c !== cat);
                    delete config.结果映射[cat];
                    delete config.筛选条件[cat];
                    // delete config.样品序号规则[name]; // name might be old
                    if (config.样品序号规则 && config.样品序号规则[name]) {
                        delete config.样品序号规则[name];
                    }

                    if (selectedCategory === cat) {
                        selectedCategory = null;
                        renderFilterSettings(null);
                    }
                    renderCategories();
                    saveConfigQuietly();
                }
            });
        });
    }

    // ========== 用于管理事件监听器的 AbortController ==========
    let filterEventsController = null;

    // 渲染右侧筛选条件
    function renderFilterSettings(category) {
        if (!filterContainer) return;

        // 取消之前的事件监听器
        if (filterEventsController) {
            filterEventsController.abort();
        }
        filterEventsController = new AbortController();
        const signal = filterEventsController.signal;

        if (!category) {
            if (filterTitle) filterTitle.textContent = '筛选条件设置';
            if (filterSubtitle) filterSubtitle.textContent = '请从左侧选择一个分类进行配置';
            filterContainer.innerHTML = '<div class="placeholder-content" style="padding:2rem 0;"><p>请点击左侧分类以编辑筛选条件</p></div>';
            return;
        }

        const displayName = config.结果映射[category] || category;
        if (filterTitle) filterTitle.textContent = `${displayName} - 筛选规则`;
        if (filterSubtitle) filterSubtitle.textContent = `配置 ${displayName} 的筛选逻辑`;

        if (!config.筛选条件) config.筛选条件 = {};
        if (!config.筛选条件[category]) config.筛选条件[category] = {};

        // 辅助函数：推断字段类型
        function getFieldType(key) {
            if (['实际库存数', '评分排名', '可用数'].includes(key)) return 'numeric';
            if (key === '是否可佩戴') return 'boolean';
            return 'string';
        }

        // 获取运算符选项
        function getOperatorOptions(fieldType) {
            if (fieldType === 'numeric') {
                return `
                    <option value="大于等于">大于等于</option>
                    <option value="小于等于">小于等于</option>
                    <option value="等于">等于</option>
                    <option value="前几名">前几名</option>
                    <option value="后几名">后几名（分越大越靠前）</option>
                `;
            } else if (fieldType === 'boolean') {
                return `<option value="排除">排除</option>`;
            } else {
                return `
                    <option value="包含">包含</option>
                    <option value="等于">等于</option>
                `;
            }
        }

        const fieldOptions = FILTERABLE_FIELDS.map(key => `<option value="${key}">${key}</option>`).join('');

        // 获取当前的按子分类筛选设置
        const isSubcategoryFilter = config.筛选条件[category].按子分类分别筛选 === true;
        const subcategoryField = config.筛选条件[category].子分类字段 || '商品分类';
        const selectedSubcategories = config.筛选条件[category].选中子分类 || [];

        // 构建分类选择器的复选框HTML
        const subcategoryCheckboxesHtml = productCategoryOptions.map(opt => `
            <label style="display:flex; align-items:center; gap:0.5rem; padding:0.25rem 0.5rem; cursor:pointer; border-radius:4px;" 
                   onmouseover="this.style.background='var(--bg-secondary)'" 
                   onmouseout="this.style.background='transparent'">
                <input type="checkbox" class="subcategory-checkbox" value="${opt}" ${selectedSubcategories.includes(opt) ? 'checked' : ''}>
                <span style="font-size:0.85rem;">${opt}</span>
            </label>
        `).join('');

        // 构建 HTML
        filterContainer.innerHTML = `
            <div class="settings-group" style="margin-bottom:1.5rem;">
                <label style="font-weight:500; margin-bottom:0.5rem; display:block;">显示名称</label>
                <input type="text" class="input settings-input" id="inputDisplayName" value="${displayName}">
            </div>
            
            <div style="border-top:1px solid var(--border-color); margin:1.5rem 0;"></div>

            <!-- 按子分类分别筛选 -->
            <div class="settings-group" style="margin-bottom:1.5rem; padding:1rem; background:var(--bg-tertiary); border-radius:var(--border-radius); border:1px solid var(--border-color);">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.75rem;">
                    <div>
                        <label style="font-weight:500; display:block;">按子分类分别筛选</label>
                        <span style="font-size:0.8rem; color:var(--text-muted);">每个子分类取可用数最大的1个</span>
                    </div>
                    <label class="switch" style="position:relative; display:inline-block; width:50px; height:26px;">
                        <input type="checkbox" id="toggleSubcategoryFilter" ${isSubcategoryFilter ? 'checked' : ''} style="opacity:0; width:0; height:0;">
                        <span style="position:absolute; cursor:pointer; top:0; left:0; right:0; bottom:0; background:${isSubcategoryFilter ? 'var(--primary-color)' : 'var(--bg-secondary)'}; border-radius:26px; transition:0.3s; border:1px solid var(--border-color);">
                            <span style="position:absolute; content:''; height:20px; width:20px; left:${isSubcategoryFilter ? '26px' : '2px'}; bottom:2px; background:white; border-radius:50%; transition:0.3s;"></span>
                        </span>
                    </label>
                </div>
                <div id="subcategoryFieldContainer" style="display:${isSubcategoryFilter ? 'flex' : 'none'}; gap:1rem; margin-top:0.75rem;">
                    <!-- 左侧：子分类字段 -->
                    <div style="flex:1;">
                        <label style="font-size:0.85rem; color:var(--text-muted); margin-bottom:0.25rem; display:block;">子分类字段</label>
                        <select id="selectSubcategoryField" class="input" style="width:100%;">
                            ${FILTERABLE_FIELDS.filter(f => getFieldType(f) === 'string').map(f => `<option value="${f}" ${f === subcategoryField ? 'selected' : ''}>${f}</option>`).join('')}
                        </select>
                    </div>
                    <!-- 右侧：选择要提取的分类 -->
                    <div style="flex:2;">
                        <label style="font-size:0.85rem; color:var(--text-muted); margin-bottom:0.25rem; display:block;">选择要提取的分类 <span style="color:var(--primary-color);">(已选 ${selectedSubcategories.length} 项)</span></label>
                        <div class="subcategory-selector" style="position:relative;">
                            <div class="subcategory-toggle" style="padding:0.5rem; background:var(--bg-secondary); border:1px solid var(--border-color); border-radius:var(--border-radius-sm); cursor:pointer; display:flex; justify-content:space-between; align-items:center;">
                                <span style="color:var(--text-muted); font-size:0.85rem;">${selectedSubcategories.length > 0 ? selectedSubcategories.slice(0, 3).join(', ') + (selectedSubcategories.length > 3 ? '...' : '') : '点击选择分类'}</span>
                                <span style="font-size:0.7rem;">▼</span>
                            </div>
                            <div class="subcategory-dropdown" style="display:none; position:absolute; top:100%; left:0; right:0; max-height:200px; overflow-y:auto; background:var(--bg-secondary); border:1px solid var(--border-color); border-radius:var(--border-radius-sm); box-shadow:0 4px 12px rgba(0,0,0,0.3); z-index:100; margin-top:4px; padding:0.5rem;">
                                ${subcategoryCheckboxesHtml || '<span style="color:var(--text-muted); font-size:0.85rem; padding:0.5rem;">暂无分类数据</span>'}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
                <h4 style="margin:0;">筛选规则列表</h4>
                <button class="btn btn-primary" id="btnAddRule" style="padding:0.4rem 1rem;">+ 添加规则</button>
            </div>

            <div id="rulesListContainer" style="display:flex; flex-direction:column; gap:1rem;">
                <!-- 规则卡片将动态插入这里 -->
            </div>
        `;

        const rulesContainer = filterContainer.querySelector('#rulesListContainer');

        // 渲染条件行 HTML
        function renderConditionRow(condition, condIndex, ruleIndex) {
            const fieldType = getFieldType(condition.field || FILTERABLE_FIELDS[0]);
            const operatorOpts = getOperatorOptions(fieldType);
            const currentField = condition.field || FILTERABLE_FIELDS[0];

            // 判断是否是商品分类字段，如果是则显示复选框列表
            let valueInputHtml;
            if (currentField === '商品分类' && productCategoryOptions.length > 0) {
                const selectedValues = Array.isArray(condition.value) ? condition.value : (condition.value ? [condition.value] : []);
                const checkboxesHtml = productCategoryOptions.map(opt => `
                    <label style="display:flex; align-items:center; gap:0.5rem; padding:0.25rem 0.5rem; cursor:pointer; border-radius:4px;" 
                           onmouseover="this.style.background='var(--bg-tertiary)'" 
                           onmouseout="this.style.background='transparent'">
                        <input type="checkbox" class="category-checkbox" value="${opt}" ${selectedValues.includes(opt) ? 'checked' : ''}>
                        <span style="font-size:0.85rem;">${opt}</span>
                    </label>
                `).join('');
                valueInputHtml = `
                    <div class="category-selector" style="flex:2; min-width:180px; position:relative;">
                        <div class="category-toggle" style="padding:0.5rem; background:var(--bg-tertiary); border:1px solid var(--border-color); border-radius:var(--border-radius-sm); cursor:pointer; display:flex; justify-content:space-between; align-items:center;">
                            <span class="selected-count" style="color:var(--text-muted); font-size:0.85rem;">已选 ${selectedValues.length} 项</span>
                            <span style="font-size:0.7rem;">▼</span>
                        </div>
                        <div class="category-dropdown" style="display:none; position:absolute; top:100%; left:0; right:0; max-height:200px; overflow-y:auto; background:var(--bg-secondary); border:1px solid var(--border-color); border-radius:var(--border-radius-sm); box-shadow:0 4px 12px rgba(0,0,0,0.3); z-index:100; margin-top:4px;">
                            ${checkboxesHtml}
                        </div>
                    </div>
                `;
            } else {
                valueInputHtml = `<input type="text" class="input condition-value" style="flex:1; min-width:80px;" value="${Array.isArray(condition.value) ? condition.value.join(',') : (condition.value || '')}" placeholder="值">`;
            }

            return `
                <div class="condition-row" data-rule-index="${ruleIndex}" data-cond-index="${condIndex}" style="display:flex; gap:0.5rem; align-items:flex-start; padding:0.75rem; background:var(--bg-tertiary); border-radius:var(--border-radius-sm); margin-bottom:0.5rem;">
                    <select class="input condition-field" style="flex:1; min-width:100px;">
                        ${FILTERABLE_FIELDS.map(f => `<option value="${f}" ${condition.field === f ? 'selected' : ''}>${f}</option>`).join('')}
                    </select>
                    <select class="input condition-operator" style="flex:1; min-width:80px;">
                        ${operatorOpts.replace(`value="${condition.operator}"`, `value="${condition.operator}" selected`)}
                    </select>
                    ${valueInputHtml}
                    <button class="btn-icon btn-delete-condition" title="删除条件" style="color:var(--error-color); font-size:1.2rem; cursor:pointer; padding:0.25rem;">×</button>
                </div>
            `;
        }

        // 渲染规则卡片
        function renderRuleCard(ruleIndex) {
            const rules = config.筛选条件[category];
            // 排除配置字段，只保留规则
            const configKeys = ['按子分类分别筛选', '子分类字段', '选中子分类'];
            const ruleKey = Object.keys(rules).filter(k => !configKeys.includes(k))[ruleIndex];

            if (!ruleKey) return '';

            const ruleData = rules[ruleKey];

            // 转换旧格式到新格式（条件数组）
            let conditions = [];
            if (ruleData.conditions && Array.isArray(ruleData.conditions)) {
                conditions = ruleData.conditions;
            } else {
                // 旧格式：直接的运算符键值
                const ops = ['大于等于', '小于等于', '等于', '前几名', '后几名', '包含', '排除'];
                ops.forEach(op => {
                    if (ruleData[op] !== undefined) {
                        conditions.push({ field: ruleKey, operator: op, value: ruleData[op] });
                    }
                });
                if (conditions.length === 0) {
                    conditions.push({ field: ruleKey, operator: getFieldType(ruleKey) === 'numeric' ? '大于等于' : '包含', value: '' });
                }
            }

            const conditionsHtml = conditions.map((c, i) => {
                const andLabel = i > 0 ? '<div style="text-align:center; color:var(--primary-color); font-weight:bold; margin:0.25rem 0;">且</div>' : '';
                return andLabel + renderConditionRow(c, i, ruleIndex);
            }).join('');

            const isEnabled = ruleData.启用 !== false;

            return `
                <div class="rule-card" data-rule-key="${ruleKey}" data-rule-index="${ruleIndex}" style="background:var(--bg-secondary); padding:1rem; border-radius:var(--border-radius); border:1px solid var(--border-color);">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.75rem;">
                        <strong style="color:var(--primary-color);">规则 ${ruleIndex + 1}</strong>
                        <div style="display:flex; align-items:center; gap:0.75rem;">
                            <label style="display:flex; align-items:center; gap:0.3rem; font-size:0.85rem; cursor:pointer;">
                                <input type="checkbox" class="rule-enable" ${isEnabled ? 'checked' : ''}>
                                <span>启用</span>
                            </label>
                            <button class="btn-icon btn-add-condition" title="添加条件(且)" style="color:var(--primary-color); font-size:0.85rem; cursor:pointer; padding:0.25rem 0.5rem; border:1px solid var(--primary-color); border-radius:4px;">+ 且</button>
                            <button class="btn-icon btn-delete-rule" title="删除规则" style="color:var(--error-color); font-size:1.2rem; cursor:pointer; padding:0.25rem;">×</button>
                        </div>
                    </div>
                    <div class="conditions-container">
                        ${conditionsHtml}
                    </div>
                </div>
            `;
        }

        // 重新加载所有规则
        function reloadRules() {
            const rules = config.筛选条件[category];
            const ruleKeys = Object.keys(rules).filter(k => k !== '按子分类分别筛选' && k !== '子分类字段');

            if (ruleKeys.length === 0) {
                rulesContainer.innerHTML = '<div style="padding:2rem; text-align:center; color:var(--text-muted);">暂无筛选规则，点击上方"添加规则"开始配置</div>';
            } else {
                rulesContainer.innerHTML = ruleKeys.map((_, i) => renderRuleCard(i)).join('');
            }
        }

        // 保存规则数据
        function saveRuleData(ruleKey, conditions, enabled) {
            // 使用新格式存储
            config.筛选条件[category][ruleKey] = {
                conditions: conditions,
                启用: enabled
            };

            // 同时保持旧格式兼容（第一个条件作为主条件）
            if (conditions.length > 0) {
                const firstCond = conditions[0];
                config.筛选条件[category][ruleKey][firstCond.operator] = firstCond.value;
            }

            saveConfigQuietly();
        }

        // 初始加载
        reloadRules();

        // ============ 事件委托 ============
        filterContainer.addEventListener('click', (e) => {
            const target = e.target;

            // 添加规则按钮
            if (target.id === 'btnAddRule' || target.closest('#btnAddRule')) {
                e.preventDefault();
                const newKey = `rule_${Date.now()}`;
                config.筛选条件[category][newKey] = {
                    conditions: [{ field: FILTERABLE_FIELDS[0], operator: '包含', value: '' }],
                    启用: true
                };
                reloadRules();
                saveConfigQuietly();
                return;
            }

            // 删除规则
            if (target.classList.contains('btn-delete-rule') || target.closest('.btn-delete-rule')) {
                const card = target.closest('.rule-card');
                if (card && confirm('确定删除此规则？')) {
                    const ruleKey = card.dataset.ruleKey;
                    delete config.筛选条件[category][ruleKey];
                    reloadRules();
                    saveConfigQuietly();
                }
                return;
            }

            // 添加条件（且）
            if (target.classList.contains('btn-add-condition') || target.closest('.btn-add-condition')) {
                const card = target.closest('.rule-card');
                if (card) {
                    const ruleKey = card.dataset.ruleKey;
                    const ruleData = config.筛选条件[category][ruleKey];
                    if (!ruleData.conditions) ruleData.conditions = [];
                    ruleData.conditions.push({ field: FILTERABLE_FIELDS[0], operator: '包含', value: '' });
                    reloadRules();
                    saveConfigQuietly();
                }
                return;
            }

            // 删除条件
            if (target.classList.contains('btn-delete-condition') || target.closest('.btn-delete-condition')) {
                const row = target.closest('.condition-row');
                const card = target.closest('.rule-card');
                if (row && card) {
                    const ruleKey = card.dataset.ruleKey;
                    const condIndex = parseInt(row.dataset.condIndex);
                    const ruleData = config.筛选条件[category][ruleKey];
                    if (ruleData.conditions && ruleData.conditions.length > 1) {
                        ruleData.conditions.splice(condIndex, 1);
                        reloadRules();
                        saveConfigQuietly();
                    } else {
                        alert('至少需要保留一个条件');
                    }
                }
                return;
            }

            // 商品分类下拉框切换
            if (target.closest('.category-toggle')) {
                const selector = target.closest('.category-selector');
                if (selector) {
                    const dropdown = selector.querySelector('.category-dropdown');
                    if (dropdown) {
                        const isVisible = dropdown.style.display !== 'none';
                        // 先关闭所有其他下拉框
                        filterContainer.querySelectorAll('.category-dropdown, .subcategory-dropdown').forEach(d => d.style.display = 'none');
                        dropdown.style.display = isVisible ? 'none' : 'block';
                    }
                }
                return;
            }

            // 子分类选择器下拉框切换
            if (target.closest('.subcategory-toggle')) {
                const selector = target.closest('.subcategory-selector');
                if (selector) {
                    const dropdown = selector.querySelector('.subcategory-dropdown');
                    if (dropdown) {
                        const isVisible = dropdown.style.display !== 'none';
                        // 先关闭所有其他下拉框
                        filterContainer.querySelectorAll('.category-dropdown, .subcategory-dropdown').forEach(d => d.style.display = 'none');
                        dropdown.style.display = isVisible ? 'none' : 'block';
                    }
                }
                return;
            }

            // 点击其他地方关闭下拉框
            if (!target.closest('.category-selector') && !target.closest('.subcategory-selector')) {
                filterContainer.querySelectorAll('.category-dropdown, .subcategory-dropdown').forEach(d => d.style.display = 'none');
            }
        }, { signal });

        // 输入变更事件委托
        filterContainer.addEventListener('change', (e) => {
            const target = e.target;

            // 显示名称变更
            if (target.id === 'inputDisplayName') {
                const newName = target.value.trim();
                if (newName) {
                    const oldName = config.结果映射[category];
                    if (oldName && oldName !== newName && config.样品序号规则 && config.样品序号规则[oldName]) {
                        config.样品序号规则[newName] = config.样品序号规则[oldName];
                        delete config.样品序号规则[oldName];
                    }
                    config.结果映射[category] = newName;
                    renderCategories();
                    saveConfigQuietly();
                }
                return;
            }

            // 按子分类筛选开关
            if (target.id === 'toggleSubcategoryFilter') {
                config.筛选条件[category].按子分类分别筛选 = target.checked;
                // 重新渲染以更新开关视觉状态和显示/隐藏字段选择
                renderFilterSettings(category);
                saveConfigQuietly();
                return;
            }

            // 子分类字段选择
            if (target.id === 'selectSubcategoryField') {
                config.筛选条件[category].子分类字段 = target.value;
                saveConfigQuietly();
                return;
            }

            // 子分类复选框变更（选择要提取的分类）
            if (target.classList.contains('subcategory-checkbox')) {
                const selector = target.closest('.subcategory-selector');
                if (selector) {
                    const checkboxes = selector.querySelectorAll('.subcategory-checkbox:checked');
                    const selectedValues = Array.from(checkboxes).map(cb => cb.value);
                    config.筛选条件[category].选中子分类 = selectedValues;

                    // 只更新显示的计数和预览，不重新渲染整个页面
                    const countLabel = filterContainer.querySelector('#subcategoryFieldContainer label span');
                    if (countLabel) countLabel.textContent = `(已选 ${selectedValues.length} 项)`;

                    const toggleText = selector.querySelector('.subcategory-toggle span:first-child');
                    if (toggleText) {
                        toggleText.textContent = selectedValues.length > 0
                            ? selectedValues.slice(0, 3).join(', ') + (selectedValues.length > 3 ? '...' : '')
                            : '点击选择分类';
                    }

                    saveConfigQuietly();
                }
                return;
            }

            // 规则启用状态变更
            if (target.classList.contains('rule-enable')) {
                const card = target.closest('.rule-card');
                if (card) {
                    const ruleKey = card.dataset.ruleKey;
                    config.筛选条件[category][ruleKey].启用 = target.checked;
                    saveConfigQuietly();
                }
                return;
            }

            // 条件字段/运算符/值变更
            const row = target.closest('.condition-row');
            if (row) {
                const card = target.closest('.rule-card');
                if (card) {
                    const ruleKey = card.dataset.ruleKey;
                    const condIndex = parseInt(row.dataset.condIndex);
                    const ruleData = config.筛选条件[category][ruleKey];

                    if (!ruleData.conditions) ruleData.conditions = [];
                    if (!ruleData.conditions[condIndex]) ruleData.conditions[condIndex] = {};

                    if (target.classList.contains('condition-field')) {
                        ruleData.conditions[condIndex].field = target.value;
                        // 字段变更时重置运算符
                        const fieldType = getFieldType(target.value);
                        let defaultOperator = '包含';
                        if (fieldType === 'numeric') defaultOperator = '大于等于';
                        else if (fieldType === 'boolean') defaultOperator = '排除';
                        ruleData.conditions[condIndex].operator = defaultOperator;
                        reloadRules(); // 重新渲染以更新运算符选项
                    } else if (target.classList.contains('condition-operator')) {
                        ruleData.conditions[condIndex].operator = target.value;
                    } else if (target.classList.contains('condition-value')) {
                        let val = target.value;
                        // 如果包含逗号，转为数组
                        if (val.includes(',') || val.includes('，')) {
                            val = val.split(/[,，]/).map(s => s.trim()).filter(s => s);
                        } else if (!isNaN(parseFloat(val)) && isFinite(val)) {
                            val = parseFloat(val);
                        }
                        ruleData.conditions[condIndex].value = val;
                    } else if (target.classList.contains('condition-value-multi')) {
                        // 多选下拉框：获取所有选中的值
                        const selectedOptions = Array.from(target.selectedOptions).map(opt => opt.value);
                        ruleData.conditions[condIndex].value = selectedOptions;
                    } else if (target.classList.contains('category-checkbox')) {
                        // 复选框列表：获取所有选中的复选框
                        const selector = target.closest('.category-selector');
                        if (selector) {
                            const checkboxes = selector.querySelectorAll('.category-checkbox:checked');
                            const selectedValues = Array.from(checkboxes).map(cb => cb.value);
                            ruleData.conditions[condIndex].value = selectedValues;
                            // 更新显示的计数
                            const countSpan = selector.querySelector('.selected-count');
                            if (countSpan) countSpan.textContent = `已选 ${selectedValues.length} 项`;
                        }
                    }

                    saveConfigQuietly();
                }
            }
        }, { signal });
    }

    async function saveConfigQuietly() {
        schemes.方案列表[currentSchemeName] = config;
        await saveRankingSchemes(schemes);
    }

    renderCategories();

    const newCategoryInput = document.getElementById('newCategoryInput');
    const btnAddCategory = document.getElementById('btnAddCategory');
    const btnConfirmAdd = document.getElementById('btnConfirmAddCategory');
    const btnCancelAdd = document.getElementById('btnCancelAddCategory');
    const addContainer = document.getElementById('addCategoryContainer');

    if (btnAddCategory) {
        btnAddCategory.addEventListener('click', () => {
            if (addContainer) addContainer.style.display = 'block';
            if (newCategoryInput) newCategoryInput.focus();
        });
    }
    if (btnCancelAdd) {
        btnCancelAdd.addEventListener('click', () => {
            if (addContainer) addContainer.style.display = 'none';
            if (newCategoryInput) newCategoryInput.value = '';
        });
    }
    if (btnConfirmAdd) {
        btnConfirmAdd.addEventListener('click', () => {
            const name = newCategoryInput.value.trim();
            if (!name) return;

            const catKey = `自定义${Date.now()}`;
            config.分类排序.push(catKey);
            config.结果映射[catKey] = name;
            config.筛选条件[catKey] = {};
            if (!config.样品序号规则) config.样品序号规则 = {};
            config.样品序号规则[name] = { prefix: 'X', start: 1, step: 1 };

            newCategoryInput.value = '';
            if (addContainer) addContainer.style.display = 'none';
            renderCategories();
            renderSampleRules();
            saveConfigQuietly();
        });
    }

    if (btnSave) {
        btnSave.addEventListener('click', async () => {
            btnSave.disabled = true;
            btnSave.textContent = '保存中...';
            try {
                await saveConfigQuietly();
                window.AppUtils?.showToast?.('设置已保存', 'success');
            } catch (e) {
                window.AppUtils?.showToast?.(e.message, 'error');
            } finally {
                btnSave.disabled = false;
                btnSave.textContent = '保存设置';
            }
        });
    }

    // ========================================
    // 排品序号分配（嵌入排品设置页面）
    // ========================================
    const sampleRulesContainer = document.getElementById('sampleRulesContainer');
    const btnSaveAssignment = document.getElementById('btnSaveAssignment');

    if (!config.样品序号规则) config.样品序号规则 = {};

    function renderSampleRules() {
        if (!sampleRulesContainer) return;
        const categories = config.分类排序 || [];
        if (categories.length === 0) {
            sampleRulesContainer.innerHTML = '<p class="text-muted">请先在上方添加分类</p>';
        } else {
            sampleRulesContainer.innerHTML = categories.map((catKey, idx) => {
                const displayName = config.结果映射[catKey] || catKey;
                let rule = config.样品序号规则[displayName] || { prefix: '', start: 1, step: 1 };
                if (!config.样品序号规则[displayName]) config.样品序号规则[displayName] = rule;

                return `
                    <div class="rules-card" style="background:var(--bg-tertiary); padding:1rem; border-radius:var(--border-radius-sm); border-left: 3px solid var(--primary-color);">
                        <div style="display:flex; gap:1rem; margin-bottom:0.5rem; align-items:center;">
                            <strong>${idx + 1}. ${displayName}</strong>
                        </div>
                        <div style="display:grid; grid-template-columns: 1fr 1fr 1fr; gap:0.5rem;">
                            <div class="input-group-vertical">
                                <label style="font-size:0.8rem; color:var(--text-muted);">前缀</label>
                                <input type="text" class="input input-sm rule-input-assignment" data-cat="${displayName}" data-field="prefix" value="${rule.prefix || ''}">
                            </div>
                            <div class="input-group-vertical">
                                <label style="font-size:0.8rem; color:var(--text-muted);">起始号</label>
                                <input type="number" class="input input-sm rule-input-assignment" data-cat="${displayName}" data-field="start" value="${rule.start || 1}">
                            </div>
                            <div class="input-group-vertical">
                                <label style="font-size:0.8rem; color:var(--text-muted);">步长</label>
                                <input type="number" class="input input-sm rule-input-assignment" data-cat="${displayName}" data-field="step" value="${rule.step || 1}">
                            </div>
                        </div>
                    </div>
                `;
            }).join('');

            sampleRulesContainer.querySelectorAll('.rule-input-assignment').forEach(input => {
                input.addEventListener('change', (e) => {
                    const catName = e.target.dataset.cat;
                    const key = e.target.dataset.field;
                    const val = e.target.value;
                    if (!config.样品序号规则[catName]) config.样品序号规则[catName] = {};
                    if (key === 'start' || key === 'step') {
                        config.样品序号规则[catName][key] = parseInt(val) || 1;
                    } else {
                        config.样品序号规则[catName][key] = val;
                    }
                });
            });
        }
    }

    renderSampleRules();

    if (btnSaveAssignment) {
        btnSaveAssignment.addEventListener('click', async () => {
            btnSaveAssignment.disabled = true;
            btnSaveAssignment.textContent = '保存中...';
            await saveConfigQuietly();
            window.AppUtils?.showToast?.('规则已保存', 'success');
            btnSaveAssignment.disabled = false;
            btnSaveAssignment.textContent = '保存规则';
        });
    }
}

async function initRankingAssignment() {
    let config = await loadRankingConfig();
    const container = document.getElementById('sampleRulesContainer');
    const newProductContainer = document.getElementById('newProductRulesContainer');
    const btnSave = document.getElementById('btnSaveAssignment');

    if (!config.样品序号规则) config.样品序号规则 = {};
    if (!config.新品序号规则) config.新品序号规则 = { prefix: 'N', start: 1, step: 1 };

    function renderRules() {
        if (!container) return;

        // 渲染分类规则 (左侧)
        const categories = config.分类排序 || [];
        if (categories.length === 0) {
            container.innerHTML = '<p class="text-muted">请先在【排品设置】中添加分类</p>';
        } else {
            container.innerHTML = categories.map((catKey, idx) => {
                const displayName = config.结果映射[catKey] || catKey;
                // 兼容旧数据：key 可能是 displayName
                let rule = config.样品序号规则[displayName] || { prefix: '', start: 1, step: 1 };
                // 确保数据结构存在
                if (!config.样品序号规则[displayName]) config.样品序号规则[displayName] = rule;

                return `
                    <div class="rules-card" style="background:var(--bg-tertiary); padding:1rem; border-radius:var(--border-radius-sm); border-left: 3px solid var(--primary-color);">
                        <div style="display:flex; gap:1rem; margin-bottom:0.5rem; align-items:center;">
                            <strong>${idx + 1}. ${displayName}</strong>
                        </div>
                        <div style="display:grid; grid-template-columns: 1fr 1fr 1fr; gap:0.5rem;">
                            <div class="input-group-vertical">
                                <label style="font-size:0.8rem; color:var(--text-muted);">前缀</label>
                                <input type="text" class="input input-sm rule-input" data-cat="${displayName}" data-field="prefix" value="${rule.prefix || ''}">
                            </div>
                            <div class="input-group-vertical">
                                <label style="font-size:0.8rem; color:var(--text-muted);">起始号</label>
                                <input type="number" class="input input-sm rule-input" data-cat="${displayName}" data-field="start" value="${rule.start || 1}">
                            </div>
                            <div class="input-group-vertical">
                                <label style="font-size:0.8rem; color:var(--text-muted);">步长</label>
                                <input type="number" class="input input-sm rule-input" data-cat="${displayName}" data-field="step" value="${rule.step || 1}">
                            </div>
                        </div>
                    </div>
                `;
            }).join('');

            // 绑定分类规则输入事件
            container.querySelectorAll('.rule-input').forEach(input => {
                input.addEventListener('change', (e) => {
                    const catName = e.target.dataset.cat;
                    const key = e.target.dataset.field;
                    const val = e.target.value;
                    if (!config.样品序号规则[catName]) config.样品序号规则[catName] = {};

                    if (key === 'start' || key === 'step') {
                        config.样品序号规则[catName][key] = parseInt(val) || 1;
                    } else {
                        config.样品序号规则[catName][key] = val;
                    }
                });
            });
        }

        // 渲染新品规则 (右侧)
        if (newProductContainer) {
            const npRule = config.新品序号规则;
            const inputs = newProductContainer.querySelectorAll('.new-rule-input');
            inputs.forEach(input => {
                const field = input.dataset.field;
                if (field === 'prefix') input.value = npRule.prefix || '';
                if (field === 'start') input.value = npRule.start || 1;
                if (field === 'step') input.value = npRule.step || 1;
            });

            // 绑定新品规则输入事件 (只需绑定一次，但为了简单放在这里重新绑定需注意防止重复? 其实 renderRules 只在 init 时调用一次，或者保存后重绘)
            // 实际上这里的 inputs 是静态 HTML (如果在 generateRankingAssignmentPage 写死的话)
            // 但如果我在 generateRankingAssignmentPage 已经写好了 HTML，这里只需要填值。
            // 修正：generateRankingAssignmentPage 中的 HTML 已经是静态的了。
            // 这里只需要在 init 时获取 inputs 并赋值，绑定事件即可。
            // 为了避免重复绑定，我应该把事件绑定移出 renderRules 或者保证 renderRules 不会重复绑定。
            // 当前逻辑 renderRules 会重绘左侧，但右侧是静态的。
            // 让我们修正一下：右侧也可以动态渲染，或者只赋值。
        }
    }

    renderRules();

    // 绑定新品规则事件 (只绑定一次)
    if (newProductContainer) {
        newProductContainer.querySelectorAll('.new-rule-input').forEach(input => {
            input.addEventListener('change', (e) => {
                const key = e.target.dataset.field;
                const val = e.target.value;
                if (key === 'start' || key === 'step') {
                    config.新品序号规则[key] = parseInt(val) || 1;
                } else {
                    config.新品序号规则[key] = val;
                }
            });
        });
    }


    if (btnSave) {
        btnSave.addEventListener('click', async () => {
            btnSave.disabled = true;
            btnSave.textContent = '保存中...';
            await saveRankingConfig('filter_config', config);
            window.AppUtils?.showToast?.('规则已保存', 'success');
            // renderRules(); // 不需要重绘，输入值且未保存时已经更新了 config
            btnSave.disabled = false;
            btnSave.textContent = '保存规则';
        });
    }
}

async function initRankingExclusion() {
    // === 左侧：排除商品 ===
    const excludedContainer = document.getElementById('excludedListBody');
    const excludeInput = document.getElementById('excludeInput');
    const btnAddExclude = document.getElementById('btnAddExclude');

    async function renderExcludedList() {
        const list = await loadExcludedProducts();
        if (!excludedContainer) return;

        if (list.length === 0) {
            excludedContainer.innerHTML = '<tr><td colspan="2" class="text-center" style="padding:2rem; color:var(--text-muted);">暂无排除商品</td></tr>';
        } else {
            excludedContainer.innerHTML = list.map(item => `
                <tr style="border-bottom:1px solid var(--border-color);">
                    <td style="padding:0.75rem 1rem;">${item.product_name}</td>
                    <td style="text-align:center;">
                        <button class="btn-icon btn-delete-exclude" data-name="${item.product_name}" title="删除" style="color:var(--error-color);">✕</button>
                    </td>
                </tr>
            `).join('');

            excludedContainer.querySelectorAll('.btn-delete-exclude').forEach(btn => {
                btn.addEventListener('click', async () => {
                    const name = btn.dataset.name;
                    if (confirm(`移除 "${name}"？`)) {
                        try {
                            await removeExcludedProduct(name);
                            renderExcludedList();
                        } catch (e) { console.error(e); }
                    }
                });
            });
        }
    }

    if (btnAddExclude) {
        btnAddExclude.addEventListener('click', async () => {
            const name = excludeInput.value.trim();
            if (name) {
                try {
                    await addExcludedProduct(name);
                    excludeInput.value = '';
                    renderExcludedList();
                    window.AppUtils?.showToast?.('已添加', 'success');
                } catch (e) {
                    window.AppUtils?.showToast?.(e.message, 'error');
                }
            }
        });
        excludeInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') btnAddExclude.click();
        });
    }

    // === 右侧：不可佩戴品 ===
    const nonWearableContainer = document.getElementById('excludedNonWearableListBody');
    const nonWearableInput = document.getElementById('excludeNonWearableInput');
    const btnAddNonWearable = document.getElementById('btnAddNonWearable');

    async function renderNonWearableList() {
        const list = await loadExcludedNonWearables();
        if (!nonWearableContainer) return;

        if (list.length === 0) {
            nonWearableContainer.innerHTML = '<tr><td colspan="2" class="text-center" style="padding:2rem; color:var(--text-muted);">暂无记录</td></tr>';
        } else {
            nonWearableContainer.innerHTML = list.map(item => `
                <tr style="border-bottom:1px solid var(--border-color);">
                    <td style="padding:0.75rem 1rem;">${item.product_name}</td>
                    <td style="text-align:center;">
                        <button class="btn-icon btn-delete-nw" data-name="${item.product_name}" title="删除" style="color:var(--error-color);">✕</button>
                    </td>
                </tr>
            `).join('');

            nonWearableContainer.querySelectorAll('.btn-delete-nw').forEach(btn => {
                btn.addEventListener('click', async () => {
                    const name = btn.dataset.name;
                    if (confirm(`移除 "${name}"？`)) {
                        try {
                            await removeExcludedNonWearable(name);
                            renderNonWearableList();
                        } catch (e) {
                            window.AppUtils?.showToast?.(e.message, 'error');
                        }
                    }
                });
            });
        }
    }

    if (btnAddNonWearable) {
        btnAddNonWearable.addEventListener('click', async () => {
            const name = nonWearableInput.value.trim();
            if (name) {
                try {
                    await addExcludedNonWearable(name);
                    nonWearableInput.value = '';
                    renderNonWearableList();
                    window.AppUtils?.showToast?.('已添加', 'success');
                } catch (e) {
                    window.AppUtils?.showToast?.(e.message, 'error');
                }
            }
        });
        nonWearableInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') btnAddNonWearable.click();
        });
    }

    // Initial render
    renderExcludedList();
    renderNonWearableList();
}

window.loadRankingPage = function (pageId) {
    if (pageId === 'ranking' || pageId === 'ranking-calculate') {
        return {
            html: generateRankingPage(),
            init: initRankingPage
        };
    }
    if (pageId === 'ranking-settings') {
        return {
            html: generateRankingSettingsPage(),
            init: initRankingSettings
        };
    }
    if (pageId === 'ranking-assignment') {
        return {
            html: generateRankingAssignmentPage(),
            init: initRankingAssignment
        };
    }
    if (pageId === 'ranking-exclusion') {
        return {
            html: generateRankingExclusionPage(),
            init: initRankingExclusion
        };
    }
    if (pageId === 'ranking-check') {
        return {
            html: generateRankingCheckPage(),
            init: initRankingCheckPage
        };
    }
    if (pageId === 'ranking-scoring') {
        return {
            html: generateScoringSettingsPage(),
            init: initScoringSettings
        };
    }
    return null;
};
