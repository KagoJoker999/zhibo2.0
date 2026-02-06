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
        <div class="investment-page">
            <div class="investment-container">
                <!-- 开播前投放数据 -->
                <div class="investment-card">
                    <div class="card-header">
                        <span class="card-icon">📊</span>
                        <h3>开播前投放数据</h3>
                        <button type="button" class="btn-reset" id="resetBtn">
                            <span class="btn-icon">🔄</span>
                            重置
                        </button>
                    </div>
                    <div class="card-body">

                        <div class="input-group">
                            <label>投放金额</label>
                            <div class="input-wrapper">
                                <input type="number" id="preAmount" placeholder="0" min="0" step="1">
                                <span class="unit">元</span>
                            </div>
                        </div>
                        <div class="input-group">
                            <label>投放时长</label>
                            <div class="input-wrapper">
                                <input type="number" id="preDuration" placeholder="0" min="0" step="0.1">
                                <span class="unit">小时</span>
                            </div>
                        </div>
                        
                        <div class="result-section">
                            <div class="result-item">
                                <span class="result-label">剩余金额</span>
                                <span class="result-value" id="preRemaining">--</span>
                                <span class="result-unit">元</span>
                            </div>
                            <div class="result-item">
                                <span class="result-label">分钟平均消耗</span>
                                <span class="result-value" id="preMinuteConsume">--</span>
                                <span class="result-unit">元/分钟</span>
                            </div>
                            <div class="result-item">
                                <span class="result-label">5分钟消耗</span>
                                <span class="result-value" id="pre5MinConsume">--</span>
                                <span class="result-unit">元</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 追投计划 -->
                <div class="investment-card">
                    <div class="card-header">
                        <span class="card-icon">💰</span>
                        <h3>追投计划</h3>
                        <div class="header-input">
                            <label>已跑时长</label>
                            <input type="number" id="preRunTimeMinutes" placeholder="0" min="0" step="1">
                            <span class="unit">分钟</span>
                            <span class="separator">=</span>
                            <input type="number" id="preRunTime" placeholder="0" min="0" step="0.01">
                            <span class="unit">小时</span>
                            <div class="header-quick-btns">
                                <button type="button" class="header-quick-btn" data-hours="0.5">0.5h</button>
                                <button type="button" class="header-quick-btn" data-hours="1">1h</button>
                                <button type="button" class="header-quick-btn" data-hours="1.5">1.5h</button>
                            </div>
                        </div>
                    </div>
                    <div class="card-body">
                        <div class="input-group">
                            <label>追投金额</label>
                            <div class="input-wrapper">
                                <input type="number" id="addAmount" placeholder="0" min="0" step="1">
                                <span class="unit">元</span>
                            </div>
                        </div>
                        <div class="input-group">
                            <label>追投时长</label>
                            <div class="input-wrapper">
                                <input type="number" id="addDuration" placeholder="0" min="0" step="0.1">
                                <span class="unit">小时</span>
                            </div>
                        </div>
                        
                        <div class="quick-options">
                            <span class="quick-label">快速添加：</span>
                            <button type="button" class="quick-btn" data-amount="300" data-duration="1">300元/1小时</button>
                            <button type="button" class="quick-btn" data-amount="500" data-duration="1">500元/1小时</button>
                            <button type="button" class="quick-btn" data-amount="300" data-duration="0.5">300元/0.5小时</button>
                            <button type="button" class="quick-btn" data-amount="500" data-duration="4">500元/4小时</button>
                        </div>
                        
                        <div class="result-section">
                            <div class="result-item highlight">
                                <span class="result-label">追投后剩余金额</span>
                                <span class="result-value" id="addRemaining">--</span>
                                <span class="result-unit">元</span>
                            </div>
                            <div class="result-item highlight">
                                <span class="result-label">追投后分钟消耗</span>
                                <span class="result-value" id="addMinuteConsume">--</span>
                                <span class="result-unit">元/分钟</span>
                            </div>
                            <div class="result-item highlight">
                                <span class="result-label">追投后5分钟消耗</span>
                                <span class="result-value" id="add5MinConsume">--</span>
                                <span class="result-unit">元</span>
                            </div>
                            <div class="result-item total">
                                <span class="result-label">合计消耗</span>
                                <span class="result-value" id="totalConsume">--</span>
                                <span class="result-unit">元</span>
                            </div>
                            <div class="consume-hint" id="consumeHint"></div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
        
        <style>
            .investment-page {
                padding: 1.5rem;
                max-width: 600px;
                margin: 0 auto;
            }
            
            .investment-container {
                display: flex;
                flex-direction: column;
                gap: 1.5rem;
            }
            
            .investment-card {
                background: var(--card-bg);
                border-radius: 12px;
                box-shadow: var(--shadow-sm);
                overflow: hidden;
            }
            
            .card-header {
                display: flex;
                align-items: center;
                gap: 0.75rem;
                padding: 1rem 1.25rem;
                background: linear-gradient(135deg, var(--primary-color), var(--primary-dark));
                color: white;
            }
            
            .card-icon {
                font-size: 1.25rem;
            }
            
            .card-header h3 {
                margin: 0;
                font-size: 1rem;
                font-weight: 600;
            }
            
            .card-body {
                padding: 1.25rem;
            }
            
            .input-group {
                display: flex;
                align-items: center;
                justify-content: space-between;
                margin-bottom: 1rem;
            }
            
            .input-group label {
                font-size: 0.9rem;
                color: var(--text-secondary);
                font-weight: 500;
            }
            
            .input-wrapper {
                display: flex;
                align-items: center;
                gap: 0.5rem;
            }
            
            .input-wrapper input {
                width: 100px;
                padding: 0.5rem 0.75rem;
                border: 1px solid var(--border-color);
                border-radius: 8px;
                font-size: 1rem;
                text-align: right;
                transition: border-color 0.2s, box-shadow 0.2s;
            }
            
            .input-wrapper input:focus {
                outline: none;
                border-color: var(--primary-color);
                box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
            }
            
            .input-wrapper .unit {
                font-size: 0.85rem;
                color: var(--text-secondary);
                min-width: 50px;
            }
            
            .result-section {
                margin-top: 1.25rem;
                padding: 1rem;
                background: rgba(0, 0, 0, 0.02);
                border-radius: 8px;
                border: 1px solid var(--border-color);
            }
            
            .result-item {
                display: grid;
                grid-template-columns: 1fr 100px 70px;
                align-items: center;
                padding: 0.5rem 0;
                gap: 0.5rem;
            }
            
            .result-item + .result-item {
                border-top: 1px solid rgba(0, 0, 0, 0.05);
            }
            
            .result-label {
                font-size: 0.9rem;
                color: var(--text-secondary);
            }
            
            .result-value {
                font-size: 1.1rem;
                font-weight: 600;
                color: var(--text-primary);
                text-align: right;
                font-family: 'SF Mono', 'Monaco', 'Menlo', 'Consolas', monospace;
                font-variant-numeric: tabular-nums;
            }
            
            .result-unit {
                font-size: 0.8rem;
                color: var(--text-muted);
                text-align: left;
            }
            
            .result-item.highlight .result-value {
                color: var(--primary-color);
            }
            
            .result-item.total {
                margin-top: 0.5rem;
                padding-top: 0.75rem;
                border-top: 2px solid var(--primary-color) !important;
                background: rgba(99, 102, 241, 0.05);
                margin: 0.5rem -1rem -1rem -1rem;
                padding: 0.75rem 1rem;
                border-radius: 0 0 8px 8px;
            }
            
            .result-item.total .result-label {
                font-weight: 600;
                color: var(--text-primary);
            }
            
            .result-item.total .result-value {
                font-size: 1.25rem;
                color: var(--success-color);
            }
            
            .consume-hint {
                margin-top: 1rem;
                padding: 0.75rem 1rem;
                border-radius: 8px;
                font-size: 0.9rem;
                font-weight: 500;
                text-align: center;
            }
            
            .consume-hint.decrease {
                background: rgba(34, 197, 94, 0.15);
                color: #22c55e;
                border: 1px solid rgba(34, 197, 94, 0.3);
            }
            
            .consume-hint.increase {
                background: rgba(239, 68, 68, 0.15);
                color: #ef4444;
                border: 1px solid rgba(239, 68, 68, 0.3);
            }
            
            .btn-reset {
                margin-left: auto;
                display: flex;
                align-items: center;
                gap: 0.35rem;
                padding: 0.4rem 0.75rem;
                border: none;
                border-radius: 6px;
                font-size: 0.8rem;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.2s;
                background: rgba(255, 255, 255, 0.15);
                color: white;
            }
            
            .btn-reset:hover {
                background: rgba(255, 255, 255, 0.25);
            }
            
            .btn-reset .btn-icon {
                font-size: 0.85rem;
            }
            
            .header-input {
                margin-left: auto;
                display: flex;
                align-items: center;
                gap: 0.5rem;
            }
            
            .header-input label {
                font-size: 0.8rem;
                color: rgba(255, 255, 255, 0.8);
            }
            
            .header-input input {
                width: 60px;
                padding: 0.3rem 0.5rem;
                border: 1px solid rgba(255, 255, 255, 0.3);
                border-radius: 6px;
                font-size: 0.85rem;
                text-align: right;
                background: rgba(255, 255, 255, 0.1);
                color: white;
            }
            
            .header-input input:focus {
                outline: none;
                border-color: rgba(255, 255, 255, 0.6);
                background: rgba(255, 255, 255, 0.15);
            }
            
            .header-input input::placeholder {
                color: rgba(255, 255, 255, 0.5);
            }
            
            .header-input .unit {
                font-size: 0.8rem;
                color: rgba(255, 255, 255, 0.8);
            }
            
            .header-input .separator {
                font-size: 0.9rem;
                color: rgba(255, 255, 255, 0.6);
                margin: 0 0.25rem;
            }
            
            .header-quick-btns {
                display: flex;
                gap: 0.25rem;
                margin-left: 0.5rem;
            }
            
            .header-quick-btn {
                padding: 0.2rem 0.5rem;
                border: 1px solid rgba(255, 255, 255, 0.4);
                border-radius: 4px;
                background: rgba(255, 255, 255, 0.1);
                color: rgba(255, 255, 255, 0.9);
                font-size: 0.7rem;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.2s;
            }
            
            .header-quick-btn:hover {
                background: rgba(255, 255, 255, 0.25);
                border-color: rgba(255, 255, 255, 0.6);
            }
            
            .header-quick-btn:active {
                transform: scale(0.95);
            }

            .quick-options {
                display: flex;
                flex-wrap: wrap;
                align-items: center;
                gap: 0.5rem;
                margin-top: 0.5rem;
                padding-top: 0.75rem;
                border-top: 1px dashed var(--border-color);
            }
            
            .quick-label {
                font-size: 0.85rem;
                color: var(--text-secondary);
                margin-right: 0.25rem;
            }
            
            .quick-btn {
                padding: 0.4rem 0.75rem;
                border: 1px solid var(--primary-color);
                border-radius: 16px;
                background: rgba(99, 102, 241, 0.1);
                color: var(--primary-color);
                font-size: 0.8rem;
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
            
            /* 响应式 */
            @media (max-width: 480px) {
                .investment-page {
                    padding: 1rem;
                }
                
                .input-wrapper input {
                    width: 80px;
                }
                
                .quick-options {
                    justify-content: flex-start;
                }
                
                .quick-btn {
                    font-size: 0.75rem;
                    padding: 0.35rem 0.6rem;
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
