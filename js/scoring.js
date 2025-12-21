/**
 * 评分计算和设置功能
 * ========================================
 */

// ========================================
// 评分计算逻辑
// ========================================

/**
 * 归一化函数：将值映射到 0-100 分
 */
function normalize(value, min, max) {
    if (max === min) return 50;  // 避免除以零
    return ((value - min) / (max - min)) * 100;
}

/**
 * 反向归一化（用于潜力分值，值越小得分越高）
 */
function normalizeReverse(value, min, max) {
    if (max === min) return 50;
    return ((max - value) / (max - min)) * 100;
}

/**
 * 计算评分
 * @param {Array} records - 排名数据记录
 * @param {Object} config - 权重配置
 */
function calculateScores(records, config) {
    if (records.length === 0) return [];

    // 1. 数据平滑处理
    const smoothedData = records.map(r => ({
        ...r,
        lecture_smooth: (r.lecture_count || 0) + 0.5,
        sales_smooth: (r.sales_amount || 0) + 0.5
    }));

    // 2. 计算讲解效率
    smoothedData.forEach(r => {
        r.efficiency = r.sales_smooth / r.lecture_smooth;
    });

    // 3. 获取各指标的最小值和最大值
    const stats = {
        exposure: { min: Infinity, max: -Infinity },
        conversion: { min: Infinity, max: -Infinity },
        lecture: { min: Infinity, max: -Infinity },
        efficiency: { min: Infinity, max: -Infinity },
        lectureSmooth: { min: Infinity, max: -Infinity }
    };

    smoothedData.forEach(r => {
        const exposure = r.exposure_rate || 0;
        const conversion = r.conversion_rate || 0;
        const lecture = r.lecture_count || 0;

        stats.exposure.min = Math.min(stats.exposure.min, exposure);
        stats.exposure.max = Math.max(stats.exposure.max, exposure);
        stats.conversion.min = Math.min(stats.conversion.min, conversion);
        stats.conversion.max = Math.max(stats.conversion.max, conversion);
        stats.lecture.min = Math.min(stats.lecture.min, lecture);
        stats.lecture.max = Math.max(stats.lecture.max, lecture);
        stats.efficiency.min = Math.min(stats.efficiency.min, r.efficiency);
        stats.efficiency.max = Math.max(stats.efficiency.max, r.efficiency);
        stats.lectureSmooth.min = Math.min(stats.lectureSmooth.min, r.lecture_smooth);
        stats.lectureSmooth.max = Math.max(stats.lectureSmooth.max, r.lecture_smooth);
    });

    // 4. 计算各项分值并得出最终得分
    return smoothedData.map(r => {
        const exposure = r.exposure_rate || 0;
        const conversion = r.conversion_rate || 0;
        const lecture = r.lecture_count || 0;

        // 归一化各项分值 (0-100)
        const exposureScore = normalize(exposure, stats.exposure.min, stats.exposure.max);
        const conversionScore = normalize(conversion, stats.conversion.min, stats.conversion.max);
        const lectureScore = normalize(lecture, stats.lecture.min, stats.lecture.max);
        const efficiencyScore = normalize(r.efficiency, stats.efficiency.min, stats.efficiency.max);
        const salesScore = efficiencyScore;  // 成交金额分值 = 讲解效率分值
        const potentialBaseScore = normalizeReverse(r.lecture_smooth, stats.lectureSmooth.min, stats.lectureSmooth.max);

        // 计算潜力因子
        const potentialFactor = (1 - lectureScore / 100) *
            ((conversionScore / 100) + (efficiencyScore / 100)) / 2 * 100;

        // 计算表现得分
        const perfPart1 = (conversionScore * config.performance_conversion_weight +
            salesScore * config.performance_sales_weight) * config.performance_first_part;
        const perfPart2 = (efficiencyScore * config.performance_efficiency_weight +
            exposureScore * config.performance_exposure_weight) * config.performance_second_part;
        const performanceScore = perfPart1 + perfPart2;

        // 计算潜力得分
        const potentialScore = conversionScore * config.potential_conversion_weight +
            efficiencyScore * config.potential_efficiency_weight +
            potentialFactor * config.potential_factor_weight;

        // 计算产品总分
        const totalScore = performanceScore * config.total_performance_weight +
            potentialScore * config.total_potential_weight;

        return {
            product_name: r.product_name,
            total_score: Math.round(totalScore * 100) / 100,
            potential_factor: Math.round(potentialFactor * 100) / 100,
            potential_score: Math.round(potentialScore * 100) / 100,
            performance_score: Math.round(performanceScore * 100) / 100
        };
    });
}

// ========================================
// 从 Supabase 加载配置
// ========================================
async function loadScoringConfig() {
    const { data, error } = await window.supabaseClient
        .from('scoring_config')
        .select('*');

    if (error) {
        console.error('加载评分配置失败:', error);
        return getDefaultConfig();
    }

    const config = {};
    data.forEach(row => {
        config[row.config_key] = parseFloat(row.config_value);
    });
    return { ...getDefaultConfig(), ...config };
}

/**
 * 默认配置
 */
function getDefaultConfig() {
    return {
        performance_conversion_weight: 0.5,
        performance_sales_weight: 0.5,
        performance_efficiency_weight: 0.6,
        performance_exposure_weight: 0.4,
        performance_first_part: 0.6,
        performance_second_part: 0.4,
        potential_conversion_weight: 0.42,
        potential_efficiency_weight: 0.42,
        potential_factor_weight: 0.16,
        total_performance_weight: 0.8,
        total_potential_weight: 0.2
    };
}

// ========================================
// 保存配置到 Supabase
// ========================================
async function saveScoringConfig(config) {
    const updates = Object.entries(config).map(([key, value]) => ({
        config_key: key,
        config_value: value,
        updated_at: new Date().toISOString()
    }));

    for (const update of updates) {
        const { error } = await window.supabaseClient
            .from('scoring_config')
            .upsert(update, { onConflict: 'config_key' });

        if (error) {
            console.error('保存配置失败:', error);
            throw error;
        }
    }
    console.log('✅ 评分配置已保存');
}

// ========================================
// 更新数据库中的评分
// ========================================
async function updateRankingScores(scores) {
    for (const score of scores) {
        const { error } = await window.supabaseClient
            .from('ranking_data')
            .update({
                total_score: score.total_score,
                potential_factor: score.potential_factor,
                potential_score: score.potential_score,
                performance_score: score.performance_score
            })
            .eq('product_name', score.product_name);

        if (error) {
            console.error('更新评分失败:', error);
        }
    }
    console.log(`✅ 已更新 ${scores.length} 条评分数据`);
}

// ========================================
// 评分设置页面
// ========================================
function generateScoringSettingsPage() {
    return `
        <div class="scoring-settings-page">
            <div class="card">
                <div class="card-header">
                    <h3>⚙️ 评分权重设置</h3>
                    <p class="card-desc">调整评分公式中的各项权重参数</p>
                </div>
                
                <div class="config-loading" id="configLoading">
                    <p>加载配置中...</p>
                </div>
                
                <div class="config-form" id="configForm" style="display:none">
                    <div class="config-section">
                        <h4>📊 表现得分权重</h4>
                        <div class="config-grid">
                            <div class="config-item">
                                <label>点击成交率权重</label>
                                <input type="number" id="cfg_performance_conversion_weight" step="0.01" min="0" max="1">
                            </div>
                            <div class="config-item">
                                <label>成交金额权重</label>
                                <input type="number" id="cfg_performance_sales_weight" step="0.01" min="0" max="1">
                            </div>
                            <div class="config-item">
                                <label>讲解效率权重</label>
                                <input type="number" id="cfg_performance_efficiency_weight" step="0.01" min="0" max="1">
                            </div>
                            <div class="config-item">
                                <label>曝光点击率权重</label>
                                <input type="number" id="cfg_performance_exposure_weight" step="0.01" min="0" max="1">
                            </div>
                            <div class="config-item">
                                <label>第一部分权重</label>
                                <input type="number" id="cfg_performance_first_part" step="0.01" min="0" max="1">
                            </div>
                            <div class="config-item">
                                <label>第二部分权重</label>
                                <input type="number" id="cfg_performance_second_part" step="0.01" min="0" max="1">
                            </div>
                        </div>
                    </div>
                    
                    <div class="config-section">
                        <h4>🚀 潜力得分权重</h4>
                        <div class="config-grid">
                            <div class="config-item">
                                <label>点击成交率权重</label>
                                <input type="number" id="cfg_potential_conversion_weight" step="0.01" min="0" max="1">
                            </div>
                            <div class="config-item">
                                <label>讲解效率权重</label>
                                <input type="number" id="cfg_potential_efficiency_weight" step="0.01" min="0" max="1">
                            </div>
                            <div class="config-item">
                                <label>潜力因子权重</label>
                                <input type="number" id="cfg_potential_factor_weight" step="0.01" min="0" max="1">
                            </div>
                        </div>
                    </div>
                    
                    <div class="config-section">
                        <h4>🏆 总分权重</h4>
                        <div class="config-grid">
                            <div class="config-item">
                                <label>表现得分权重</label>
                                <input type="number" id="cfg_total_performance_weight" step="0.01" min="0" max="1">
                            </div>
                            <div class="config-item">
                                <label>潜力得分权重</label>
                                <input type="number" id="cfg_total_potential_weight" step="0.01" min="0" max="1">
                            </div>
                        </div>
                    </div>
                    
                    <div class="config-actions">
                        <button class="btn btn-primary" id="saveConfigBtn">💾 保存配置</button>
                        <button class="btn btn-secondary" id="resetConfigBtn">↩️ 恢复默认</button>
                    </div>
                    
                    <div class="config-status" id="configStatus" style="display:none"></div>
                </div>
            </div>
        </div>
    `;
}

function initScoringSettingsPage() {
    const configLoading = document.getElementById('configLoading');
    const configForm = document.getElementById('configForm');
    const saveBtn = document.getElementById('saveConfigBtn');
    const resetBtn = document.getElementById('resetConfigBtn');
    const statusDiv = document.getElementById('configStatus');

    // 加载配置
    loadScoringConfig().then(config => {
        fillConfigForm(config);
        configLoading.style.display = 'none';
        configForm.style.display = 'block';
    });

    // 保存按钮
    saveBtn.addEventListener('click', async () => {
        try {
            saveBtn.disabled = true;
            saveBtn.textContent = '保存中...';
            const config = getConfigFromForm();
            await saveScoringConfig(config);
            showStatus('✅ 配置已保存！', 'success');
        } catch (err) {
            showStatus('❌ 保存失败: ' + err.message, 'error');
        } finally {
            saveBtn.disabled = false;
            saveBtn.textContent = '💾 保存配置';
        }
    });

    // 恢复默认
    resetBtn.addEventListener('click', () => {
        fillConfigForm(getDefaultConfig());
        showStatus('已恢复默认配置，点击保存生效', 'info');
    });

    function fillConfigForm(config) {
        Object.entries(config).forEach(([key, value]) => {
            const input = document.getElementById(`cfg_${key}`);
            if (input) input.value = value;
        });
    }

    function getConfigFromForm() {
        const config = {};
        const keys = Object.keys(getDefaultConfig());
        keys.forEach(key => {
            const input = document.getElementById(`cfg_${key}`);
            if (input) config[key] = parseFloat(input.value) || 0;
        });
        return config;
    }

    function showStatus(msg, type) {
        statusDiv.textContent = msg;
        statusDiv.className = `config-status ${type}`;
        statusDiv.style.display = 'block';
        setTimeout(() => statusDiv.style.display = 'none', 3000);
    }
}

// ========================================
// 导出
// ========================================
window.ScoringModule = {
    calculateScores,
    loadScoringConfig,
    saveScoringConfig,
    updateRankingScores,
    getDefaultConfig
};

window.loadScoringSettingsPage = function () {
    return {
        html: generateScoringSettingsPage(),
        init: initScoringSettingsPage
    };
};
