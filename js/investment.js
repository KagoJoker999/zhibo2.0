/**
 * 追投计算功能
 * ========================================
 * 数据库表名：无（纯前端计算功能）
 */

// ========================================
// 页面加载器
// ========================================
window.loadInvestmentPage = function (page) {
    if (page === 'livestream-additional-investment') {
        return {
            html: getInvestmentPageHTML(),
            init: initInvestmentPage
        };
    }
    return null;
};

// ========================================
// 页面 HTML
// ========================================
function getInvestmentPageHTML() {
    return `
        <div class="inv">
            <!-- 页面标题 -->
            <div class="page-intro" style="display:flex; align-items:center; justify-content:space-between;">
                <div>
                    <h2>💰 追投计算</h2>
                    <p>实时计算投放消耗速度，辅助追投决策</p>
                </div>
                <button type="button" class="btn btn-secondary" id="resetBtn">🔄 重置</button>
            </div>

            <!-- 主体：双栏布局 -->
            <div class="inv-grid">
                <!-- 左列：输入区 -->
                <div class="inv-col">
                    <!-- 开播前投放 -->
                    <div class="inv-section">
                        <div class="inv-section-title">📊 开播前投放</div>
                        <div class="inv-form-row">
                            <div class="inv-field">
                                <label>投放金额</label>
                                <div class="inv-input-box">
                                    <input type="number" id="preAmount" placeholder="0" min="0" step="1">
                                    <span class="inv-suffix">元</span>
                                </div>
                            </div>
                            <div class="inv-field">
                                <label>投放时长</label>
                                <div class="inv-input-box">
                                    <input type="number" id="preDuration" placeholder="0" min="0" step="0.1">
                                    <span class="inv-suffix">小时</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- 已跑时长 -->
                    <div class="inv-section">
                        <div class="inv-section-title">⏱️ 已跑时长</div>
                        <div class="inv-form-row">
                            <div class="inv-field">
                                <label>分钟</label>
                                <div class="inv-input-box">
                                    <input type="number" id="preRunTimeMinutes" placeholder="0" min="0" step="1">
                                    <span class="inv-suffix">min</span>
                                </div>
                            </div>
                            <div class="inv-field">
                                <label>小时</label>
                                <div class="inv-input-box">
                                    <input type="number" id="preRunTime" placeholder="0" min="0" step="0.01">
                                    <span class="inv-suffix">h</span>
                                </div>
                            </div>
                        </div>
                        <div class="inv-quick-row">
                            <button type="button" class="header-quick-btn" data-hours="0.5">0.5h</button>
                            <button type="button" class="header-quick-btn" data-hours="1">1h</button>
                            <button type="button" class="header-quick-btn" data-hours="1.5">1.5h</button>
                            <button type="button" class="header-quick-btn" data-hours="2">2h</button>
                        </div>
                    </div>

                    <!-- 追投配置 -->
                    <div class="inv-section">
                        <div class="inv-section-title">🚀 追投配置</div>
                        <div class="inv-form-row">
                            <div class="inv-field">
                                <label>追投金额</label>
                                <div class="inv-input-box">
                                    <input type="number" id="addAmount" placeholder="0" min="0" step="1">
                                    <span class="inv-suffix">元</span>
                                </div>
                            </div>
                            <div class="inv-field">
                                <label>追投时长</label>
                                <div class="inv-input-box">
                                    <input type="number" id="addDuration" placeholder="0" min="0" step="0.1">
                                    <span class="inv-suffix">小时</span>
                                </div>
                            </div>
                        </div>
                        <div class="inv-quick-row">
                            <span class="inv-quick-label">快速填入</span>
                            <button type="button" class="quick-btn" data-amount="300" data-duration="1">300/1h</button>
                            <button type="button" class="quick-btn" data-amount="500" data-duration="1">500/1h</button>
                            <button type="button" class="quick-btn" data-amount="300" data-duration="0.5">300/0.5h</button>
                            <button type="button" class="quick-btn" data-amount="100" data-duration="5">100/5h</button>
                        </div>
                    </div>
                </div>

                <!-- 右列：结果区 -->
                <div class="inv-col">
                    <!-- 开播前指标 -->
                    <div class="inv-section">
                        <div class="inv-section-title">📈 开播前消耗指标</div>
                        <div class="inv-metrics">
                            <div class="inv-metric-card">
                                <span class="inv-metric-label">剩余金额</span>
                                <div class="inv-metric-val-row">
                                    <span class="inv-metric-value" id="preRemaining">--</span>
                                    <span class="inv-metric-unit">元</span>
                                </div>
                            </div>
                            <div class="inv-metric-card">
                                <span class="inv-metric-label">分钟消耗</span>
                                <div class="inv-metric-val-row">
                                    <span class="inv-metric-value" id="preMinuteConsume">--</span>
                                    <span class="inv-metric-unit">元/min</span>
                                </div>
                            </div>
                            <div class="inv-metric-card">
                                <span class="inv-metric-label">5分钟消耗</span>
                                <div class="inv-metric-val-row">
                                    <span class="inv-metric-value" id="pre5MinConsume">--</span>
                                    <span class="inv-metric-unit">元</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- 追投后指标 -->
                    <div class="inv-section inv-section-highlight">
                        <div class="inv-section-title">⚡ 追投后消耗指标</div>
                        <div class="inv-metrics">
                            <div class="inv-metric-card inv-metric-accent">
                                <span class="inv-metric-label">剩余金额</span>
                                <div class="inv-metric-val-row">
                                    <span class="inv-metric-value" id="addRemaining">--</span>
                                    <span class="inv-metric-unit">元</span>
                                </div>
                            </div>
                            <div class="inv-metric-card inv-metric-accent">
                                <span class="inv-metric-label">分钟消耗</span>
                                <div class="inv-metric-val-row">
                                    <span class="inv-metric-value" id="addMinuteConsume">--</span>
                                    <span class="inv-metric-unit">元/min</span>
                                </div>
                            </div>
                            <div class="inv-metric-card inv-metric-accent">
                                <span class="inv-metric-label">5分钟消耗</span>
                                <div class="inv-metric-val-row">
                                    <span class="inv-metric-value" id="add5MinConsume">--</span>
                                    <span class="inv-metric-unit">元</span>
                                </div>
                            </div>
                        </div>
                        <!-- 合计 -->
                        <div class="inv-total-bar">
                            <span class="inv-total-label">合计消耗</span>
                            <span class="inv-total-value" id="totalConsume">--</span>
                            <span class="inv-total-unit">元</span>
                        </div>
                        <div class="consume-hint" id="consumeHint"></div>
                    </div>
                </div>
            </div>
        </div>

        <style>
            /* ======== 追投计算页面专用样式 ======== */
            .inv { padding: 0; }

            .inv-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 1.5rem;
                align-items: start;
            }

            .inv-col {
                display: flex;
                flex-direction: column;
                gap: 1rem;
            }

            /* 区块 */
            .inv-section {
                background: var(--bg-secondary);
                border: 1px solid var(--border-color);
                border-radius: 10px;
                padding: 1.25rem;
            }

            .inv-section-highlight {
                border-color: rgba(22, 93, 255, 0.25);
                background: linear-gradient(135deg, rgba(22, 93, 255, 0.04), rgba(22, 93, 255, 0.01));
            }

            .inv-section-title {
                font-size: 0.9rem;
                font-weight: 600;
                color: var(--text-primary);
                margin-bottom: 1rem;
                padding-bottom: 0.5rem;
                border-bottom: 1px solid var(--border-color);
            }

            /* 表单行 */
            .inv-form-row {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 1rem;
            }

            .inv-field label {
                display: block;
                font-size: 0.8rem;
                color: var(--text-muted);
                margin-bottom: 0.4rem;
                font-weight: 500;
            }

            .inv-input-box {
                display: flex;
                align-items: center;
                background: var(--bg-primary);
                border: 1px solid var(--border-color);
                border-radius: 8px;
                overflow: hidden;
                transition: border-color 0.2s, box-shadow 0.2s;
            }

            .inv-input-box:focus-within {
                border-color: var(--primary-color);
                box-shadow: 0 0 0 2px rgba(22, 93, 255, 0.15);
            }

            .inv-input-box input {
                flex: 1;
                min-width: 0;
                border: none;
                background: transparent;
                padding: 0.6rem 0.75rem;
                font-size: 1rem;
                color: var(--text-primary);
                text-align: right;
                outline: none;
                font-variant-numeric: tabular-nums;
            }

            .inv-input-box input::placeholder {
                color: var(--text-disabled);
            }

            .inv-suffix {
                padding: 0 0.75rem;
                font-size: 0.8rem;
                color: var(--text-muted);
                white-space: nowrap;
                border-left: 1px solid var(--border-color);
                background: rgba(255,255,255,0.02);
                line-height: 2.4;
            }

            /* 快捷按钮行 */
            .inv-quick-row {
                display: flex;
                flex-wrap: wrap;
                align-items: center;
                gap: 0.5rem;
                margin-top: 0.75rem;
            }

            .inv-quick-label {
                font-size: 0.8rem;
                color: var(--text-muted);
            }

            .header-quick-btn {
                padding: 0.3rem 0.75rem;
                border: 1px solid rgba(255, 125, 0, 0.4);
                border-radius: 14px;
                background: rgba(255, 125, 0, 0.08);
                color: var(--warning-color);
                font-size: 0.78rem;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.2s;
            }

            .header-quick-btn:hover {
                background: rgba(255, 125, 0, 0.2);
                border-color: var(--warning-color);
            }

            .header-quick-btn:active {
                transform: scale(0.95);
            }

            .quick-btn {
                padding: 0.3rem 0.75rem;
                border: 1px solid rgba(22, 93, 255, 0.4);
                border-radius: 14px;
                background: rgba(22, 93, 255, 0.08);
                color: var(--primary-color);
                font-size: 0.78rem;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.2s;
            }

            .quick-btn:hover {
                background: var(--primary-color);
                color: white;
            }

            .quick-btn:active {
                transform: scale(0.95);
            }

            /* 指标卡片网格 */
            .inv-metrics {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 0.75rem;
            }

            .inv-metric-card {
                background: var(--bg-primary);
                border: 1px solid var(--border-color);
                border-radius: 8px;
                padding: 0.75rem;
                text-align: center;
                transition: border-color 0.2s;
            }

            .inv-metric-card:hover {
                border-color: rgba(255,255,255,0.15);
            }

            .inv-metric-accent {
                border-color: rgba(22, 93, 255, 0.2);
            }

            .inv-metric-accent:hover {
                border-color: rgba(22, 93, 255, 0.4);
            }

            .inv-metric-label {
                display: block;
                font-size: 0.75rem;
                color: var(--text-muted);
                margin-bottom: 0.5rem;
            }

            .inv-metric-val-row {
                display: flex;
                align-items: baseline;
                justify-content: center;
                gap: 0.25rem;
            }

            .inv-metric-value {
                font-size: 1.35rem;
                font-weight: 700;
                color: var(--text-primary);
                font-family: 'SF Mono', 'Monaco', 'Menlo', 'Consolas', monospace;
                font-variant-numeric: tabular-nums;
                line-height: 1;
            }

            .inv-metric-accent .inv-metric-value {
                color: var(--primary-color);
            }

            .inv-metric-unit {
                font-size: 0.7rem;
                color: var(--text-muted);
            }

            /* 合计行 */
            .inv-total-bar {
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 0.75rem;
                margin-top: 1rem;
                padding: 0.85rem 1rem;
                background: linear-gradient(135deg, rgba(0, 180, 42, 0.1), rgba(0, 180, 42, 0.04));
                border: 1px solid rgba(0, 180, 42, 0.25);
                border-radius: 8px;
            }

            .inv-total-label {
                font-size: 0.9rem;
                font-weight: 600;
                color: var(--text-secondary);
            }

            .inv-total-value {
                font-size: 1.6rem;
                font-weight: 700;
                color: var(--success-color);
                font-family: 'SF Mono', 'Monaco', 'Menlo', 'Consolas', monospace;
                font-variant-numeric: tabular-nums;
            }

            .inv-total-unit {
                font-size: 0.8rem;
                color: var(--text-muted);
            }

            /* 消耗提示 */
            .consume-hint {
                margin-top: 0.75rem;
                padding: 0.6rem 1rem;
                border-radius: 8px;
                font-size: 0.85rem;
                font-weight: 500;
                text-align: center;
            }

            .consume-hint:empty {
                display: none;
            }

            .consume-hint.decrease {
                background: rgba(0, 180, 42, 0.1);
                color: var(--success-color);
                border: 1px solid rgba(0, 180, 42, 0.25);
            }

            .consume-hint.increase {
                background: rgba(245, 63, 63, 0.1);
                color: var(--error-color);
                border: 1px solid rgba(245, 63, 63, 0.25);
            }

            /* 响应式 */
            @media (max-width: 768px) {
                .inv-grid {
                    grid-template-columns: 1fr;
                }
            }

            @media (max-width: 480px) {
                .inv-metrics {
                    grid-template-columns: 1fr;
                }
                .inv-form-row {
                    grid-template-columns: 1fr;
                }
            }
        </style>
    `;
}

// ========================================
// 页面初始化
// ========================================
function initInvestmentPage() {
    // 获取所有输入元素
    const inputs = {
        preRunTime: document.getElementById('preRunTime'),
        preAmount: document.getElementById('preAmount'),
        preDuration: document.getElementById('preDuration'),
        addAmount: document.getElementById('addAmount'),
        addDuration: document.getElementById('addDuration')
    };

    // 获取分钟输入框
    const preRunTimeMinutes = document.getElementById('preRunTimeMinutes');

    // 获取所有结果显示元素
    const results = {
        preRemaining: document.getElementById('preRemaining'),
        preMinuteConsume: document.getElementById('preMinuteConsume'),
        pre5MinConsume: document.getElementById('pre5MinConsume'),
        addRemaining: document.getElementById('addRemaining'),
        addMinuteConsume: document.getElementById('addMinuteConsume'),
        add5MinConsume: document.getElementById('add5MinConsume'),
        totalConsume: document.getElementById('totalConsume')
    };

    // 分钟转小时函数
    function convertMinutesToHours() {
        const minutes = parseFloat(preRunTimeMinutes.value) || 0;
        const hours = minutes / 60;
        inputs.preRunTime.value = hours.toFixed(2);
        calculate();
    }

    // 小时转分钟函数
    function convertHoursToMinutes() {
        const hours = parseFloat(inputs.preRunTime.value) || 0;
        const minutes = hours * 60;
        preRunTimeMinutes.value = Math.round(minutes);
        calculate();
    }

    // 计算函数
    function calculate() {
        // 获取输入值
        const preRunTime = parseFloat(inputs.preRunTime.value) || 0;
        const preAmount = parseFloat(inputs.preAmount.value) || 0;
        const preDuration = parseFloat(inputs.preDuration.value) || 0;
        const addAmount = parseFloat(inputs.addAmount.value) || 0;
        const addDuration = parseFloat(inputs.addDuration.value) || 0;

        // 开播前投放计算
        let preRemaining = 0;
        let preMinuteConsume = 0;
        let pre5MinConsume = 0;

        if (preDuration > 0) {
            // 剩余金额 = 金额 / 投放时长 * (投放时长 - 已跑时长)
            preRemaining = preAmount / preDuration * (preDuration - preRunTime);
            // 分钟平均消耗 = 金额 / 投放时长 / 60
            preMinuteConsume = preAmount / preDuration / 60;
            // 5分钟消耗 = 分钟平均消耗 * 5
            pre5MinConsume = preMinuteConsume * 5;
        }

        // 追投后计算
        let addRemaining = 0;
        let addMinuteConsume = 0;
        let add5MinConsume = 0;
        let totalConsume = 0;

        // 追投后剩余金额 = 开播前剩余金额 + 追投金额
        addRemaining = preRemaining + addAmount;

        const totalTime = preRunTime + addDuration;
        if (totalTime > 0) {
            // 追投后分钟平均消耗 = 剩余金额 / (已跑时长 + 追投时长) / 60
            addMinuteConsume = addRemaining / totalTime / 60;
            // 追投后5分钟消耗 = 分钟平均消耗 * 5
            add5MinConsume = addMinuteConsume * 5;
            // 合计消耗 = (开播前金额 - 开播前剩余) + ((追投金额 + 开播前剩余) / (追投时长 + 已跑时长))
            totalConsume = (preAmount - preRemaining) + ((addAmount + preRemaining) / totalTime);
        }

        // 更新显示
        results.preRemaining.textContent = formatNumber(preRemaining);
        results.preMinuteConsume.textContent = formatNumber(preMinuteConsume);
        results.pre5MinConsume.textContent = formatNumber(pre5MinConsume);
        results.addRemaining.textContent = formatNumber(addRemaining);
        results.addMinuteConsume.textContent = formatNumber(addMinuteConsume);
        results.add5MinConsume.textContent = formatNumber(add5MinConsume);
        results.totalConsume.textContent = formatNumber(totalConsume);

        // 更新消耗对比提示
        const consumeHint = document.getElementById('consumeHint');
        if (consumeHint) {
            if (preMinuteConsume > 0 && addMinuteConsume > 0) {
                if (preMinuteConsume > addMinuteConsume) {
                    consumeHint.textContent = '📉 降低消耗速度及总量';
                    consumeHint.className = 'consume-hint decrease';
                } else {
                    consumeHint.textContent = '📈 加速消耗速度及付费介入量';
                    consumeHint.className = 'consume-hint increase';
                }
            } else {
                consumeHint.textContent = '';
                consumeHint.className = 'consume-hint';
            }
        }
    }

    // 格式化数字
    function formatNumber(num) {
        if (isNaN(num) || !isFinite(num)) return '--';
        return num.toFixed(2);
    }

    // 默认值配置
    const defaultValues = {
        preAmount: 200,      // 投放金额默认值（元）
        preDuration: 2       // 投放时长默认值（小时）
    };

    // 重置函数
    function reset() {
        // 清空分钟输入框
        if (preRunTimeMinutes) {
            preRunTimeMinutes.value = '';
        }
        // 清空所有输入
        Object.entries(inputs).forEach(([key, input]) => {
            // 检查是否有默认值
            if (defaultValues[key] !== undefined) {
                input.value = defaultValues[key];
            } else {
                input.value = '';
            }
        });
        // 重置后重新计算
        calculate();
    }

    // 绑定分钟输入事件 - 实时转换
    if (preRunTimeMinutes) {
        preRunTimeMinutes.addEventListener('input', convertMinutesToHours);
    }

    // 绑定小时输入事件 - 实时转换
    if (inputs.preRunTime) {
        inputs.preRunTime.addEventListener('input', convertHoursToMinutes);
    }

    // 绑定输入事件 - 实时计算
    Object.values(inputs).forEach(input => {
        if (input && input !== inputs.preRunTime) { // preRunTime有专门的转换事件
            input.addEventListener('input', calculate);
        }
    });

    // 绑定重置按钮
    const resetBtn = document.getElementById('resetBtn');
    if (resetBtn) {
        resetBtn.addEventListener('click', reset);
    }

    // 绑定快速选项按钮
    const quickBtns = document.querySelectorAll('.quick-btn');
    quickBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const amount = btn.dataset.amount;
            const duration = btn.dataset.duration;
            inputs.addAmount.value = amount;
            inputs.addDuration.value = duration;
            calculate();
        });
    });

    // 绑定已跑时长快捷按钮
    const headerQuickBtns = document.querySelectorAll('.header-quick-btn');
    headerQuickBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const hours = parseFloat(btn.dataset.hours);
            inputs.preRunTime.value = hours;
            preRunTimeMinutes.value = Math.round(hours * 60);
            calculate();
        });
    });

    // 页面加载时自动设置默认值
    reset();
}
