/**
 * 库存判断功能
 * ========================================
 * 数据库表名：inventory_analysis
 * 
 * SQL 建表命令（请在 Supabase 中执行）：
 * 
 * CREATE TABLE inventory_analysis (
 *   id BIGSERIAL PRIMARY KEY,
 *   record_type TEXT NOT NULL,
 *   record_date DATE NOT NULL,
 *   record_month TEXT,
 *   sales_cost NUMERIC,
 *   opening_stock NUMERIC,
 *   closing_stock NUMERIC,
 *   turnover_rate NUMERIC,
 *   active_sku_count INTEGER,
 *   total_sku_count INTEGER,
 *   active_rate NUMERIC,
 *   inactive_rate NUMERIC,
 *   created_at TIMESTAMPTZ DEFAULT now()
 * );
 */

// ========================================
// 页面加载器
// ========================================
window.loadInventoryAnalysisPage = function (page) {
    if (page === 'inventory-analysis') {
        return {
            html: getInventoryAnalysisHTML(),
            init: initInventoryAnalysisPage
        };
    }
    return null;
};

// ========================================
// 页面 HTML
// ========================================
function getInventoryAnalysisHTML() {
    return `
        <div class="ia-wrap">

            <!-- 页面标题栏 -->
            <div class="ia-page-header">
                <div>
                    <h2><i data-lucide="package-search"></i> 库存判断</h2>
                    <p>库存周转率 &amp; SKU 动销/滞销率计算与追踪</p>
                </div>
            </div>

            <!-- ===== 模块一：库存周转率 ===== -->
            <div class="ia-card">
                <div class="ia-card-header">
                    <span class="ia-card-title"><i data-lucide="refresh-ccw"></i> 库存周转率计算</span>
                    <span class="ia-card-badge">每月一次</span>
                </div>

                <div class="ia-two-col">
                    <!-- 左：输入 -->
                    <div class="ia-input-panel">
                        <div class="ia-formula-box">
                            <div class="ia-formula-title">计算公式</div>
                            <div class="ia-formula-content">
                                月度库存周转率 = <span class="ia-fraction"><span class="ia-numerator">当月商品销售总成本</span><span class="ia-denominator">(月初库存总金额 + 月末库存总金额) ÷ 2</span></span>
                            </div>
                        </div>

                        <div class="ia-field">
                            <div class="ia-field-label-row">
                                <label for="iaSalesCost">当月商品销售总成本</label>
                                <div class="ia-source-tag">ERP 报表-销售主体分析-查询池：近一个月销售成本&nbsp;&nbsp;数值为「销售成本」</div>
                            </div>
                            <div class="ia-input-box">
                                <input type="number" id="iaSalesCost" placeholder="0.00" min="0" step="0.01">
                                <span class="ia-suffix">元</span>
                            </div>
                        </div>

                        <div class="ia-field">
                            <div class="ia-field-label-row">
                                <label for="iaOpeningStock">月初库存总金额</label>
                                <div class="ia-source-tag">ERP 报表-商品库存结构分析-查询池：库存总金额（成本）&nbsp;&nbsp;数值为「主仓实际库存金额」</div>
                            </div>
                            <div class="ia-input-box">
                                <input type="number" id="iaOpeningStock" placeholder="0.00" min="0" step="0.01">
                                <span class="ia-suffix">元</span>
                            </div>
                            <div class="ia-field-hint" id="iaClosingHint"></div>
                        </div>

                        <div class="ia-field">
                            <div class="ia-field-label-row">
                                <label for="iaClosingStock">
                                    月末库存总金额
                                </label>
                                <div class="ia-source-tag">ERP 报表-商品库存结构分析-查询池：库存总金额（成本）&nbsp;&nbsp;数值为「主仓实际库存金额」</div>
                            </div>
                            <div class="ia-input-box">
                                <input type="number" id="iaClosingStock" placeholder="月末再填写" min="0" step="0.01">
                                <span class="ia-suffix">元</span>
                            </div>
                        </div>

                        <div style="display:flex;gap:10px;">
                            <button type="button" class="btn btn-primary ia-submit-btn" id="iaTurnoverSave" style="flex:1;">
                                <i data-lucide="save"></i> 计算并保存
                            </button>
                            <button type="button" class="btn btn-secondary ia-submit-btn" id="iaTurnoverCancelEdit" style="display:none;flex:1;background:#f2f3f5;color:#4e5969;border:1px solid #e5e6eb;">
                                <i data-lucide="x-circle"></i> 取消续填
                            </button>
                        </div>
                    </div>

                    <!-- 右：结果 -->
                    <div class="ia-result-panel">
                        <div class="ia-result-card" id="iaTurnoverResult">
                            <div class="ia-result-empty">
                                <i data-lucide="bar-chart-2"></i>
                                <p>请填写左侧数据后计算</p>
                            </div>
                        </div>

                        <div class="ia-history-list" id="iaTurnoverHistory">
                            <div class="ia-history-header" style="justify-content:space-between;display:flex;">
                                <div>
                                    <i data-lucide="clock"></i> 历史记录
                                    <span class="ia-tip">（数据库：inventory_analysis，可点击续填）</span>
                                </div>
                                <button type="button" class="ia-bulk-del-btn" id="iaTurnoverBulkDel" title="清空所有周转率记录">
                                    <i data-lucide="trash-2"></i> 批量删除
                                </button>
                            </div>
                            <div class="ia-history-body" id="iaTurnoverHistoryBody">
                                <div class="ia-loading"><i data-lucide="loader-2"></i> 加载中...</div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 周转率曲线图 -->
                <div class="ia-chart-wrap">
                    <div class="ia-chart-title">
                        <span><i data-lucide="trending-up"></i> 周转率历史趋势</span>
                        <div class="ia-chart-controls">
                            <select id="iaTurnoverChartLimit" class="ia-chart-select">
                                <option value="12" selected>最近 12 条</option>
                                <option value="30">最近 30 条</option>
                            </select>
                            <button type="button" class="ia-chart-refresh-btn" id="iaTurnoverChartRefresh">
                                <i data-lucide="refresh-cw"></i> 刷新图表
                            </button>
                        </div>
                    </div>
                    <div class="ia-chart-container">
                        <canvas id="iaTurnoverChart"></canvas>
                    </div>
                </div>
            </div>

            <!-- ===== 模块二：SKU 滞销率 ===== -->
            <div class="ia-card">
                <div class="ia-card-header">
                    <span class="ia-card-title"><i data-lucide="tag"></i> SKU 动销率 / 滞销率计算</span>
                    <span class="ia-card-badge ia-badge-orange">随时可算 建议小号开播前后均计算一次</span>
                </div>

                <div class="ia-two-col">
                    <!-- 左：输入 -->
                    <div class="ia-input-panel">
                        <div class="ia-formula-box">
                            <div class="ia-formula-title">计算公式</div>
                            <div class="ia-formula-content">
                                动销率 = <span class="ia-fraction"><span class="ia-numerator">当月有销量的 SKU 总数</span><span class="ia-denominator">当月店铺总 SKU 数</span></span> × 100%
                                <br>
                                <span style="margin-top:0.5rem;display:block;">滞销率 = 100% − 动销率</span>
                            </div>
                        </div>

                        <div class="ia-field">
                            <div class="ia-field-label-row">
                                <label for="iaActiveSku">当前有销售量的 SKU 总数</label>
                                <div class="ia-source-tag">ERP 商品及库存管理&nbsp;&nbsp;筛选池：有销量SKU数 &gt; 5&nbsp;&nbsp;数值为「条目数」</div>
                            </div>
                            <div class="ia-input-box">
                                <input type="number" id="iaActiveSku" placeholder="0" min="0" step="1">
                                <span class="ia-suffix">个</span>
                            </div>
                        </div>

                        <div class="ia-field">
                            <div class="ia-field-label-row">
                                <label for="iaTotalSku">当前店铺总 SKU 数</label>
                                <div class="ia-source-tag">ERP 商品及库存管理&nbsp;&nbsp;筛选池：有效SKU数 &gt; 5&nbsp;&nbsp;数值为「条目数」</div>
                            </div>
                            <div class="ia-input-box">
                                <input type="number" id="iaTotalSku" placeholder="0" min="1" step="1">
                                <span class="ia-suffix">个</span>
                            </div>
                        </div>

                        <button type="button" class="btn btn-primary ia-submit-btn" id="iaSkuSave">
                            <i data-lucide="save"></i> 计算并保存
                        </button>
                    </div>

                    <!-- 右：结果 -->
                    <div class="ia-result-panel">
                        <div class="ia-result-card" id="iaSkuResult">
                            <div class="ia-result-empty">
                                <i data-lucide="bar-chart-2"></i>
                                <p>请填写左侧数据后计算</p>
                            </div>
                        </div>

                        <div class="ia-history-list" id="iaSkuHistory">
                            <div class="ia-history-header" style="justify-content:space-between;display:flex;">
                                <div>
                                    <i data-lucide="clock"></i> 历史记录
                                    <span class="ia-tip">（数据库：inventory_analysis）</span>
                                </div>
                                <button type="button" class="ia-bulk-del-btn" id="iaSkuBulkDel" title="清空所有SKU记录">
                                    <i data-lucide="trash-2"></i> 批量删除
                                </button>
                            </div>
                            <div class="ia-history-body" id="iaSkuHistoryBody">
                                <div class="ia-loading"><i data-lucide="loader-2"></i> 加载中...</div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 滞销率曲线图 -->
                <div class="ia-chart-wrap">
                    <div class="ia-chart-title">
                        <span><i data-lucide="trending-down"></i> 动销率 / 滞销率历史趋势</span>
                        <div class="ia-chart-controls">
                            <select id="iaSkuChartLimit" class="ia-chart-select">
                                <option value="10" selected>最近 10 条</option>
                                <option value="30">最近 30 条</option>
                            </select>
                            <button type="button" class="ia-chart-refresh-btn" id="iaSkuChartRefresh">
                                <i data-lucide="refresh-cw"></i> 刷新图表
                            </button>
                        </div>
                    </div>
                    <div class="ia-chart-container">
                        <canvas id="iaSkuChart"></canvas>
                    </div>
                </div>
            </div>

        </div>

        <!-- ===== 清空确认弹窗 ===== -->
        <div class="ia-modal-overlay" id="iaClearModal" style="display:none;">
            <div class="ia-modal">
                <div class="ia-modal-icon"><i data-lucide="alert-triangle"></i></div>
                <div class="ia-modal-title">确认清空数据？</div>
                <div class="ia-modal-desc">此操作将清空 <code>inventory_analysis</code> 表中的<strong>全部</strong>记录，且<strong>无法恢复</strong>。</div>
                <div class="ia-modal-actions">
                    <button type="button" class="btn btn-secondary" id="iaCancelClear">取消</button>
                    <button type="button" class="btn btn-danger" id="iaConfirmClear">确认清空</button>
                </div>
            </div>
        </div>

        <style>
            /* ======== 库存判断页面专用样式 ======== */
            .ia-wrap {
                display: flex;
                flex-direction: column;
                gap: 1.5rem;
                padding: 0;
            }

            /* 页面标题栏 */
            .ia-page-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
            }

            .ia-page-header h2 {
                font-size: 1.25rem;
                font-weight: 600;
                display: flex;
                align-items: center;
                gap: 0.5rem;
                margin-bottom: 0.25rem;
            }

            .ia-page-header p {
                font-size: 0.875rem;
                color: var(--text-muted);
            }

            .ia-clear-btn {
                flex-shrink: 0;
            }

            /* 主卡片 */
            .ia-card {
                background: var(--bg-secondary);
                border: 1px solid var(--border-color);
                border-radius: 10px;
                padding: 1.5rem;
            }

            .ia-card-header {
                display: flex;
                align-items: center;
                gap: 0.75rem;
                margin-bottom: 1.25rem;
                padding-bottom: 0.875rem;
                border-bottom: 1px solid var(--border-color);
            }

            .ia-card-title {
                font-size: 1rem;
                font-weight: 600;
                display: flex;
                align-items: center;
                gap: 0.4rem;
            }

            .ia-card-badge {
                font-size: 0.72rem;
                font-weight: 500;
                padding: 0.2rem 0.6rem;
                border-radius: 999px;
                background: rgba(22, 93, 255, 0.12);
                color: var(--primary-color);
                border: 1px solid rgba(22, 93, 255, 0.25);
            }

            .ia-badge-orange {
                background: rgba(255, 125, 0, 0.1);
                color: var(--warning-color);
                border-color: rgba(255, 125, 0, 0.3);
            }

            /* 双栏布局 */
            .ia-two-col {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 1.5rem;
                align-items: start;
            }

            /* 输入面板 */
            .ia-input-panel {
                display: flex;
                flex-direction: column;
                gap: 1rem;
            }

            /* 公式展示框 */
            .ia-formula-box {
                background: rgba(255, 255, 255, 0.03);
                border: 1px solid var(--border-color);
                border-radius: 8px;
                padding: 1rem;
            }

            .ia-formula-title {
                font-size: 0.75rem;
                color: var(--text-muted);
                font-weight: 500;
                margin-bottom: 0.5rem;
                text-transform: uppercase;
                letter-spacing: 0.05em;
            }

            .ia-formula-content {
                font-size: 0.875rem;
                color: var(--text-secondary);
                line-height: 1.6;
                display: flex;
                align-items: center;
                gap: 0.5rem;
                flex-wrap: wrap;
            }

            .ia-fraction {
                display: inline-flex;
                flex-direction: column;
                align-items: center;
                text-align: center;
                vertical-align: middle;
                margin: 0 0.25rem;
            }

            .ia-numerator {
                border-bottom: 1px solid var(--text-secondary);
                padding-bottom: 0.15rem;
                margin-bottom: 0.15rem;
                font-size: 0.85rem;
            }

            .ia-denominator {
                font-size: 0.78rem;
                color: var(--text-muted);
            }

            /* 字段 */
            .ia-field {
                display: flex;
                flex-direction: column;
                gap: 0.35rem;
            }

            .ia-field label {
                font-size: 0.8rem;
                color: var(--text-muted);
                font-weight: 500;
            }

            .ia-optional {
                font-size: 0.72rem;
                color: var(--text-disabled);
                font-weight: 400;
                margin-left: 0.25rem;
            }

            .ia-input-box {
                display: flex;
                align-items: center;
                background: var(--bg-primary);
                border: 1px solid var(--border-color);
                border-radius: 8px;
                overflow: hidden;
                transition: border-color 0.2s, box-shadow 0.2s;
            }

            .ia-input-box:focus-within {
                border-color: var(--primary-color);
                box-shadow: 0 0 0 2px rgba(22, 93, 255, 0.15);
            }

            .ia-input-box input {
                flex: 1;
                min-width: 0;
                border: none;
                background: transparent;
                padding: 0.6rem 0.75rem;
                font-size: 0.95rem;
                color: var(--text-primary);
                text-align: right;
                outline: none;
                font-variant-numeric: tabular-nums;
            }

            .ia-input-box input::placeholder {
                color: var(--text-disabled);
            }

            .ia-suffix {
                padding: 0 0.75rem;
                font-size: 0.8rem;
                color: var(--text-muted);
                white-space: nowrap;
                border-left: 1px solid var(--border-color);
                background: rgba(255, 255, 255, 0.02);
                line-height: 2.4;
            }

            .ia-field-hint {
                font-size: 0.78rem;
                color: var(--warning-color);
            }
            .ia-field-hint:empty {
                display: none;
            }

            .ia-submit-btn {
                width: 100%;
                margin-top: 0.25rem;
            }

            /* 结果面板 */
            .ia-result-panel {
                display: flex;
                flex-direction: column;
                gap: 1rem;
            }

            .ia-result-card {
                background: var(--bg-primary);
                border: 1px solid var(--border-color);
                border-radius: 8px;
                padding: 1.25rem;
                min-height: 130px;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .ia-result-empty {
                text-align: center;
                color: var(--text-disabled);
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 0.5rem;
                font-size: 0.85rem;
            }

            .ia-result-content {
                width: 100%;
            }

            .ia-result-row {
                display: flex;
                justify-content: space-between;
                align-items: baseline;
                padding: 0.4rem 0;
                border-bottom: 1px solid var(--border-color);
            }

            .ia-result-row:last-child {
                border-bottom: none;
            }

            .ia-result-label {
                font-size: 0.82rem;
                color: var(--text-muted);
            }

            .ia-result-value {
                font-size: 1rem;
                font-weight: 600;
                font-variant-numeric: tabular-nums;
                font-family: 'SF Mono', 'Monaco', 'Menlo', 'Consolas', monospace;
            }

            .ia-result-value.ia-highlight {
                font-size: 1.35rem;
                color: var(--primary-color);
            }

            .ia-result-value.ia-warn {
                color: var(--warning-color);
            }

            .ia-result-value.ia-success {
                color: var(--success-color);
            }

            .ia-result-value.ia-error {
                color: var(--error-color);
            }

            /* 历史记录 */
            .ia-history-list {
                background: var(--bg-primary);
                border: 1px solid var(--border-color);
                border-radius: 8px;
                overflow: hidden;
            }

            .ia-history-header {
                display: flex;
                align-items: center;
                gap: 0.4rem;
                font-size: 0.82rem;
                font-weight: 600;
                color: var(--text-secondary);
                padding: 0.625rem 1rem;
                background: rgba(255, 255, 255, 0.03);
                border-bottom: 1px solid var(--border-color);
            }

            .ia-tip {
                font-size: 0.7rem;
                color: var(--text-disabled);
                font-weight: 400;
            }

            .ia-history-body {
                max-height: 180px;
                overflow-y: auto;
                scrollbar-width: thin;
                scrollbar-color: rgba(255,255,255,0.1) transparent;
            }

            .ia-history-item {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 0.5rem 1rem;
                border-bottom: 1px solid var(--border-color);
                font-size: 0.82rem;
            }

            .ia-history-item:last-child {
                border-bottom: none;
            }

            .ia-history-date {
                color: var(--text-muted);
                flex-shrink: 0;
            }

            .ia-history-rate {
                font-weight: 600;
                font-variant-numeric: tabular-nums;
            }

            .ia-loading {
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 0.5rem;
                padding: 1.5rem;
                color: var(--text-muted);
                font-size: 0.85rem;
            }

            .ia-empty-tip {
                text-align: center;
                padding: 1.5rem;
                color: var(--text-disabled);
                font-size: 0.82rem;
            }

            /* 填写说明内容区--空白占位 */
            .ia-note-content {
                min-height: 1rem;
                color: var(--text-muted);
                font-size: 0.85rem;
                line-height: 1.6;
            }

            /* 字段标题水平排列容器 */
            .ia-field-label-row {
                display: flex;
                justify-content: space-between;
                align-items: flex-end;
                margin-bottom: 0.4rem;
                gap: 0.5rem;
            }
            .ia-field-label-row label {
                margin-bottom: 0 !important;
                white-space: nowrap;
            }
            .ia-field-label-row .ia-source-tag { margin-bottom: 0 !important; }

            /* 数据来源高亮标签 */
            .ia-source-tag {
                font-size: 0.68rem;
                font-weight: 500;
                color: rgba(22, 93, 255, 0.9);
                background: rgba(22, 93, 255, 0.08);
                border: 1px solid rgba(22, 93, 255, 0.2);
                border-radius: 5px;
                padding: 0.2rem 0.5rem;
                line-height: 1.4;
                text-align: right;
                margin-bottom: 0.1rem;
            }

            /* 历史记录删除按钮 */
            .ia-bulk-del-btn {
                display: inline-flex;
                align-items: center;
                gap: 0.3rem;
                padding: 0.2rem 0.5rem;
                font-size: 0.75rem;
                border: 1px solid rgba(245, 63, 63, 0.3);
                background: rgba(245, 63, 63, 0.05);
                color: var(--error-color);
                border-radius: 4px;
                cursor: pointer;
                transition: all 0.2s;
            }
            .ia-bulk-del-btn:hover {
                background: var(--error-color);
                color: white;
            }
            
            .ia-bulk-del-btn svg {
                width: 13px !important;
                height: 13px !important;
            }

            .ia-del-btn {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                width: 20px;
                height: 20px;
                border: none;
                background: transparent;
                color: var(--text-disabled);
                cursor: pointer;
                border-radius: 4px;
                transition: all 0.15s;
                padding: 0;
                flex-shrink: 0;
            }

            .ia-del-btn:hover {
                background: rgba(245, 63, 63, 0.15);
                color: var(--error-color);
            }

            .ia-del-btn svg {
                width: 13px;
                height: 13px;
            }

            /* 曲线图 */
            .ia-chart-wrap {
                margin-top: 1.5rem;
                padding-top: 1.25rem;
                border-top: 1px solid var(--border-color);
            }

            .ia-chart-title {
                font-size: 0.85rem;
                font-weight: 600;
                color: var(--text-secondary);
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 0.4rem;
                margin-bottom: 1rem;
            }

            .ia-chart-title > span {
                display: flex;
                align-items: center;
                gap: 0.4rem;
            }

            .ia-chart-controls {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                white-space: nowrap;
                flex-wrap: nowrap;
            }

            .ia-chart-select {
                font-size: 0.78rem;
                padding: 0.25rem 0.5rem;
                border: 1px solid var(--border-color);
                border-radius: 6px;
                background: var(--bg-primary);
                color: var(--text-secondary);
                outline: none;
                cursor: pointer;
            }

            .ia-chart-select:focus {
                border-color: var(--primary-color);
            }

            .ia-chart-refresh-btn {
                display: inline-flex;
                align-items: center;
                gap: 0.3rem;
                font-size: 0.78rem;
                font-weight: 500;
                padding: 0.25rem 0.65rem;
                border: 1px solid rgba(22, 93, 255, 0.4);
                border-radius: 6px;
                background: rgba(22, 93, 255, 0.08);
                color: var(--primary-color);
                cursor: pointer;
                transition: all 0.2s;
            }

            .ia-chart-refresh-btn:hover {
                background: var(--primary-color);
                color: white;
                border-color: var(--primary-color);
            }

            .ia-chart-refresh-btn svg {
                width: 13px;
                height: 13px;
            }

            .ia-chart-container {
                position: relative;
                height: 220px;
            }

            /* 清空弹窗 */
            .ia-modal-overlay {
                position: fixed;
                inset: 0;
                background: rgba(0, 0, 0, 0.65);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 5000;
                animation: fadeIn 0.2s ease;
            }

            .ia-modal {
                background: var(--bg-secondary);
                border: 1px solid var(--border-color);
                border-radius: 14px;
                padding: 2rem 2.5rem;
                max-width: 400px;
                width: 90%;
                text-align: center;
                box-shadow: 0 20px 60px rgba(0,0,0,0.5);
            }

            .ia-modal-icon {
                font-size: 2.5rem;
                color: var(--warning-color);
                margin-bottom: 0.75rem;
            }

            .ia-modal-title {
                font-size: 1.1rem;
                font-weight: 700;
                margin-bottom: 0.5rem;
            }

            .ia-modal-desc {
                font-size: 0.875rem;
                color: var(--text-muted);
                margin-bottom: 1.5rem;
                line-height: 1.6;
            }

            .ia-modal-desc code {
                font-family: 'SF Mono', 'Monaco', 'Menlo', 'Consolas', monospace;
                background: rgba(255,255,255,0.08);
                padding: 0.1em 0.4em;
                border-radius: 4px;
                color: var(--text-primary);
            }

            .ia-modal-actions {
                display: flex;
                gap: 0.75rem;
                justify-content: center;
            }

            /* 响应式 */
            @media (max-width: 768px) {
                .ia-two-col {
                    grid-template-columns: 1fr;
                }
                .ia-page-header {
                    flex-direction: column;
                    align-items: flex-start;
                    gap: 0.75rem;
                }
            }
        </style>
    `;
}

// ========================================
// 页面初始化
// ========================================
function initInventoryAnalysisPage() {
    // Chart.js 实例缓存
    let turnoverChart = null;
    let skuChart = null;

    // 记录目前编辑的周转率项
    let currentEditingTurnoverId = null;
    let turnoverHistoryData = [];

    // ── 模块表单重置器 ──────────────────────────
    function resetTurnoverForm() {
        currentEditingTurnoverId = null;
        document.getElementById('iaSalesCost').value = '';
        document.getElementById('iaOpeningStock').value = '';
        document.getElementById('iaClosingStock').value = '';
        const btn = document.getElementById('iaTurnoverSave');
        if(btn) {
            btn.innerHTML = '<i data-lucide="save"></i> 计算并保存';
            btn.style.background = '';
            btn.style.borderColor = '';
        }
        const cancelBtn = document.getElementById('iaTurnoverCancelEdit');
        if(cancelBtn) cancelBtn.style.display = 'none';
        if (window.lucide) window.lucide.createIcons();
    }

    // 取消接续编辑
    document.getElementById('iaTurnoverCancelEdit')?.addEventListener('click', resetTurnoverForm);

    // ── 删除单条记录 ──────────────────────────────
    async function deleteRecord(id, reloadFn) {
        if (!window.supabaseClient) return;
        try {
            const { error } = await window.supabaseClient
                .from('inventory_analysis')
                .delete()
                .eq('id', id);
            if (error) throw error;
            if (window.showToast) window.showToast('记录已删除', 'success');
            reloadFn();
        } catch (e) {
            console.error('删除记录失败:', e);
            if (window.showToast) window.showToast('删除失败：' + (e.message || e), 'error');
        }
    }

    // ── 加载历史数据 ─────────────────────────────
    async function loadTurnoverHistory() {
        const body = document.getElementById('iaTurnoverHistoryBody');
        if (!body) return;
        if (!window.supabaseClient) {
            body.innerHTML = '<div class="ia-empty-tip">未连接数据库</div>';
            return;
        }
        try {
            const { data, error } = await window.supabaseClient
                .from('inventory_analysis')
                .select('*')
                .eq('record_type', 'turnover')
                .order('record_date', { ascending: false })
                .limit(20);

            if (error) throw error;

            if (!data || data.length === 0) {
                body.innerHTML = '<div class="ia-empty-tip">暂无历史数据</div>';
            } else {
                body.innerHTML = data.map(r => {
                    const rate = r.turnover_rate !== null ? Number(r.turnover_rate).toFixed(2) : '--';
                    const hasClosing = r.closing_stock !== null;
                    const colorClass = hasClosing ? 'ia-success' : 'ia-warn';
                    const tag = hasClosing ? '' : '<span style="font-size:0.7rem;color:var(--warning-color);margin-left:4px;">(可续填)</span>';
                    const activeClass = (r.id === currentEditingTurnoverId) ? 'border: 1px solid rgba(0,180,42,0.4); background: rgba(0,180,42,0.03);' : '';
                    return `<div class="ia-history-item ia-turnover-entry" data-id="${r.id}" style="cursor:pointer; transition:all 0.2s; ${activeClass}" title="点击接续填写该条目数据">
                        <span class="ia-history-date">${r.record_date || r.record_month || '--'}</span>
                        <span style="display:flex;align-items:center;gap:0.5rem;">
                            <span class="ia-history-rate ${colorClass}">${rate}%${tag}</span>
                            <button type="button" class="ia-del-btn" data-id="${r.id}" data-type="turnover" title="删除此记录">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                            </button>
                        </span>
                    </div>`;
                }).join('');

                turnoverHistoryData = data; // 保存下来用于查找

                // 点击进入编辑模式
                body.querySelectorAll('.ia-turnover-entry').forEach(item => {
                    item.addEventListener('click', (e) => {
                        if (e.target.closest('.ia-del-btn')) return;
                        const id = parseInt(item.dataset.id);
                        const record = turnoverHistoryData.find(x => x.id === id);
                        if (record) {
                            currentEditingTurnoverId = id;
                            document.getElementById('iaSalesCost').value = record.sales_cost !== null ? record.sales_cost : '';
                            document.getElementById('iaOpeningStock').value = record.opening_stock !== null ? record.opening_stock : '';
                            document.getElementById('iaClosingStock').value = record.closing_stock !== null ? record.closing_stock : '';
                            const btn = document.getElementById('iaTurnoverSave');
                            btn.innerHTML = '<i data-lucide="edit-3"></i> 更新该记录';
                            btn.style.background = '#00b42a';
                            btn.style.borderColor = '#00b42a';
                            document.getElementById('iaTurnoverCancelEdit').style.display = 'inline-flex';
                            if (window.lucide) window.lucide.createIcons();
                            
                            // 高亮显示当前选中的记录
                            body.querySelectorAll('.ia-turnover-entry').forEach(el => el.style.border = 'none');
                            item.style.border = '1px solid rgba(0,180,42,0.4)';
                            item.style.background = 'rgba(0,180,42,0.03)';
                        }
                    });
                });

                // 绑定删除按钮事件
                body.querySelectorAll('.ia-del-btn[data-type="turnover"]').forEach(btn => {
                    btn.addEventListener('click', () => deleteRecord(btn.dataset.id, loadTurnoverHistory));
                });
            }

            renderTurnoverChart(data || [], turnoverChartLimit);
            if (window.updateInventoryReminder) window.updateInventoryReminder();
        } catch (e) {
            console.error('加载周转率历史失败:', e);
            body.innerHTML = '<div class="ia-empty-tip">加载失败</div>';
        }
    }

    // 周转率图表当前显示条数（默认12）
    let turnoverChartLimit = 12;
    // SKU 图表当前显示条数（默认10）
    let skuChartLimit = 10;

    async function loadSkuHistory() {
        const body = document.getElementById('iaSkuHistoryBody');
        if (!body) return;
        if (!window.supabaseClient) {
            body.innerHTML = '<div class="ia-empty-tip">未连接数据库</div>';
            return;
        }
        try {
            const { data, error } = await window.supabaseClient
                .from('inventory_analysis')
                .select('*')
                .eq('record_type', 'sku_rate')
                .order('record_date', { ascending: false })
                .limit(30);

            if (error) throw error;

            if (!data || data.length === 0) {
                body.innerHTML = '<div class="ia-empty-tip">暂无历史数据</div>';
            } else {
                body.innerHTML = data.map(r => {
                    const active = r.active_rate !== null ? Number(r.active_rate).toFixed(1) : '--';
                    const inactive = r.inactive_rate !== null ? Number(r.inactive_rate).toFixed(1) : '--';
                    return `<div class="ia-history-item" data-id="${r.id}">
                        <span class="ia-history-date">${r.record_date || '--'}</span>
                        <span style="display:flex;align-items:center;gap:0.5rem;">
                            <span>
                                <span class="ia-history-rate ia-success">${active}%</span>
                                <span style="color:var(--text-muted);margin:0 4px;">/</span>
                                <span class="ia-history-rate ia-error">${inactive}%</span>
                            </span>
                            <button type="button" class="ia-del-btn" data-id="${r.id}" data-type="sku" title="删除此记录">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                            </button>
                        </span>
                    </div>`;
                }).join('');

                // 绑定删除按钮事件
                body.querySelectorAll('.ia-del-btn[data-type="sku"]').forEach(btn => {
                    btn.addEventListener('click', () => deleteRecord(btn.dataset.id, loadSkuHistory));
                });
            }

            renderSkuChart(data || [], skuChartLimit);
        } catch (e) {
            console.error('加载滞销率历史失败:', e);
            body.innerHTML = '<div class="ia-empty-tip">加载失败</div>';
        }
    }

    // ── 图表渲染 ─────────────────────────────────
    function renderTurnoverChart(data, limit) {
        const canvas = document.getElementById('iaTurnoverChart');
        if (!canvas) return;

        // 过滤出有完整数据（有周转率）的记录，升序后取最近 limit 条
        const valid = data
            .filter(r => r.turnover_rate !== null)
            .sort((a, b) => (a.record_date || '').localeCompare(b.record_date || ''))
            .slice(-(limit || 12));

        const labels = valid.map(r => r.record_date || r.record_month || '--');
        const rates = valid.map(r => Number(r.turnover_rate));

        if (turnoverChart) {
            turnoverChart.destroy();
            turnoverChart = null;
        }

        if (valid.length === 0) {
            canvas.parentElement.innerHTML = '<div class="ia-empty-tip" style="padding:2rem;">暂无图表数据</div>';
            return;
        }

        turnoverChart = new Chart(canvas, {
            type: 'line',
            data: {
                labels,
                datasets: [{
                    label: '月度库存周转率（%）',
                    data: rates,
                    borderColor: 'rgba(22, 93, 255, 0.9)',
                    backgroundColor: 'rgba(22, 93, 255, 0.1)',
                    borderWidth: 2,
                    pointBackgroundColor: 'rgba(22, 93, 255, 1)',
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    fill: true,
                    tension: 0.3
                }]
            },
            options: getChartOptions('%')
        });
    }

    function renderSkuChart(data, limit) {
        const canvas = document.getElementById('iaSkuChart');
        if (!canvas) return;

        // 按日期升序，取最近 limit 条
        const sorted = [...data]
            .sort((a, b) => (a.record_date || '').localeCompare(b.record_date || ''))
            .slice(-(limit || 10));

        const labels = sorted.map(r => r.record_date || '--');
        const activeRates = sorted.map(r => r.active_rate !== null ? Number(r.active_rate) : null);
        const inactiveRates = sorted.map(r => r.inactive_rate !== null ? Number(r.inactive_rate) : null);

        if (skuChart) {
            skuChart.destroy();
            skuChart = null;
        }

        if (sorted.length === 0) {
            canvas.parentElement.innerHTML = '<div class="ia-empty-tip" style="padding:2rem;">暂无图表数据</div>';
            return;
        }

        skuChart = new Chart(canvas, {
            type: 'line',
            data: {
                labels,
                datasets: [
                    {
                        label: '动销率（%）',
                        data: activeRates,
                        borderColor: 'rgba(0, 180, 42, 0.9)',
                        backgroundColor: 'rgba(0, 180, 42, 0.08)',
                        borderWidth: 2,
                        pointBackgroundColor: 'rgba(0, 180, 42, 1)',
                        pointRadius: 4,
                        pointHoverRadius: 6,
                        fill: false,
                        tension: 0.3
                    },
                    {
                        label: '滞销率（%）',
                        data: inactiveRates,
                        borderColor: 'rgba(245, 63, 63, 0.9)',
                        backgroundColor: 'rgba(245, 63, 63, 0.08)',
                        borderWidth: 2,
                        pointBackgroundColor: 'rgba(245, 63, 63, 1)',
                        pointRadius: 4,
                        pointHoverRadius: 6,
                        fill: false,
                        tension: 0.3
                    }
                ]
            },
            options: getChartOptions('%')
        });
    }

    function getChartOptions(unit) {
        return {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            plugins: {
                legend: {
                    labels: {
                        color: 'rgba(255,255,255,0.65)',
                        font: { size: 12 },
                        boxWidth: 14
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(23, 23, 26, 0.95)',
                    borderColor: 'rgba(255,255,255,0.1)',
                    borderWidth: 1,
                    titleColor: 'rgba(255,255,255,0.85)',
                    bodyColor: 'rgba(255,255,255,0.7)',
                    callbacks: {
                        label: ctx => ` ${ctx.dataset.label}: ${ctx.parsed.y !== null ? ctx.parsed.y.toFixed(2) + unit : '--'}`
                    }
                }
            },
            scales: {
                x: {
                    grid: { color: 'rgba(255,255,255,0.05)' },
                    ticks: { color: 'rgba(255,255,255,0.5)', font: { size: 11 } }
                },
                y: {
                    grid: { color: 'rgba(255,255,255,0.05)' },
                    ticks: {
                        color: 'rgba(255,255,255,0.5)',
                        font: { size: 11 },
                        callback: v => v + unit
                    }
                }
            }
        };
    }

    // ── 周转率保存 ────────────────────────────────
    document.getElementById('iaTurnoverSave')?.addEventListener('click', async () => {
        const salesCost = parseFloat(document.getElementById('iaSalesCost')?.value);
        const openingStock = parseFloat(document.getElementById('iaOpeningStock')?.value);
        const closingStockRaw = document.getElementById('iaClosingStock')?.value;
        const closingStock = closingStockRaw !== '' ? parseFloat(closingStockRaw) : null;

        if (isNaN(salesCost) || isNaN(openingStock)) {
            if (window.showToast) window.showToast('请填写当月销售总成本和月初库存金额', 'warning');
            return;
        }

        // 计算周转率（需要月末数据）
        let turnoverRate = null;
        if (closingStock !== null && !isNaN(closingStock)) {
            const avgStock = (openingStock + closingStock) / 2;
            if (avgStock > 0) {
                turnoverRate = (salesCost / avgStock) * 100;
            }
        }

        // 显示结果
        const resultEl = document.getElementById('iaTurnoverResult');
        if (resultEl) {
            const today = new Date();
            // 月末回填时间 = 下个月的同一天
            const nextMonthSameDay = new Date(today.getFullYear(), today.getMonth() + 1, today.getDate());
            const nextMonthStr = `${nextMonthSameDay.getFullYear()}-${String(nextMonthSameDay.getMonth() + 1).padStart(2, '0')}-${String(nextMonthSameDay.getDate()).padStart(2, '0')}`;

            resultEl.innerHTML = `<div class="ia-result-content">
                <div class="ia-result-row">
                    <span class="ia-result-label">当月销售总成本</span>
                    <span class="ia-result-value">¥ ${salesCost.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}</span>
                </div>
                <div class="ia-result-row">
                    <span class="ia-result-label">月初库存金额</span>
                    <span class="ia-result-value">¥ ${openingStock.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}</span>
                </div>
                ${closingStock !== null ? `
                <div class="ia-result-row">
                    <span class="ia-result-label">月末库存金额</span>
                    <span class="ia-result-value">¥ ${closingStock.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}</span>
                </div>
                <div class="ia-result-row">
                    <span class="ia-result-label">月度库存周转率</span>
                    <span class="ia-result-value ia-highlight">${turnoverRate !== null ? turnoverRate.toFixed(2) + '%' : '--'}</span>
                </div>` : `
                <div class="ia-result-row">
                    <span class="ia-result-label">月末库存金额</span>
                    <span class="ia-result-value ia-warn">待月末填写</span>
                </div>
                <div class="ia-result-row">
                    <span class="ia-result-label">月末回填提醒</span>
                    <span class="ia-result-value ia-warn" style="font-size:0.85rem;">请于 ${nextMonthStr} 前回来填写月末数据</span>
                </div>`}
                <div class="ia-result-row">
                    <span class="ia-result-label">填写日期</span>
                    <span class="ia-result-value" style="font-size:0.85rem;">${today.toLocaleDateString('zh-CN')}</span>
                </div>
            </div>`;
        }

        // 月末提醒提示
        if (closingStock === null) {
            const hint = document.getElementById('iaClosingHint');
            if (hint) {
                const t = new Date();
                const nextSameDay = new Date(t.getFullYear(), t.getMonth() + 1, t.getDate());
                const nextStr = `${nextSameDay.getFullYear()}-${String(nextSameDay.getMonth() + 1).padStart(2, '0')}-${String(nextSameDay.getDate()).padStart(2, '0')}`;
                hint.textContent = `⚠ 请于 ${nextStr} 前回来填写月末库存金额`;
            }
        }

        // 保存到 Supabase
        if (!window.supabaseClient) {
            if (window.showToast) window.showToast('未连接数据库，仅显示计算结果', 'warning');
            return;
        }

        try {
            const today = new Date();
            const recordMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
            const recordDate = today.toISOString().split('T')[0];

            const payload = {
                record_type: 'turnover',
                record_date: recordDate,
                record_month: recordMonth,
                sales_cost: salesCost,
                opening_stock: openingStock,
                closing_stock: closingStock,
                turnover_rate: turnoverRate
            };

            if (currentEditingTurnoverId) {
                const { error } = await window.supabaseClient
                    .from('inventory_analysis')
                    .update(payload)
                    .eq('id', currentEditingTurnoverId);

                if (error) throw error;
                if (window.showToast) window.showToast('记录已更新', 'success');
                resetTurnoverForm();
            } else {
                const { error } = await window.supabaseClient
                    .from('inventory_analysis')
                    .insert(payload);

                if (error) throw error;
                if (window.showToast) window.showToast('周转率数据已保存', 'success');
            }

            loadTurnoverHistory();
        } catch (e) {
            console.error('保存周转率数据失败:', e);
            if (window.showToast) window.showToast('保存失败：' + (e.message || e), 'error');
        }
    });

    // ── SKU 滞销率保存 ────────────────────────────
    document.getElementById('iaSkuSave')?.addEventListener('click', async () => {
        const activeSku = parseInt(document.getElementById('iaActiveSku')?.value);
        const totalSku = parseInt(document.getElementById('iaTotalSku')?.value);

        if (isNaN(activeSku) || isNaN(totalSku) || totalSku <= 0) {
            if (window.showToast) window.showToast('请正确填写 SKU 数据，店铺总SKU数不能为0', 'warning');
            return;
        }

        if (activeSku > totalSku) {
            if (window.showToast) window.showToast('有销售量的SKU数不能大于总SKU数', 'warning');
            return;
        }

        const activeRate = (activeSku / totalSku) * 100;
        const inactiveRate = 100 - activeRate;

        // 显示结果
        const resultEl = document.getElementById('iaSkuResult');
        if (resultEl) {
            const today = new Date();
            const activeColor = activeRate >= 70 ? 'ia-success' : activeRate >= 40 ? 'ia-warn' : 'ia-error';
            const inactiveColor = inactiveRate <= 30 ? 'ia-success' : inactiveRate <= 60 ? 'ia-warn' : 'ia-error';

            resultEl.innerHTML = `<div class="ia-result-content">
                <div class="ia-result-row">
                    <span class="ia-result-label">有销售量 SKU 数</span>
                    <span class="ia-result-value">${activeSku} 个</span>
                </div>
                <div class="ia-result-row">
                    <span class="ia-result-label">店铺总 SKU 数</span>
                    <span class="ia-result-value">${totalSku} 个</span>
                </div>
                <div class="ia-result-row">
                    <span class="ia-result-label">动销率</span>
                    <span class="ia-result-value ia-highlight ${activeColor}">${activeRate.toFixed(1)}%</span>
                </div>
                <div class="ia-result-row">
                    <span class="ia-result-label">滞销率</span>
                    <span class="ia-result-value ia-highlight ${inactiveColor}">${inactiveRate.toFixed(1)}%</span>
                </div>
                <div class="ia-result-row">
                    <span class="ia-result-label">计算时间</span>
                    <span class="ia-result-value" style="font-size:0.82rem;">${today.toLocaleString('zh-CN')}</span>
                </div>
            </div>`;
        }

        // 保存到 Supabase
        if (!window.supabaseClient) {
            if (window.showToast) window.showToast('未连接数据库，仅显示计算结果', 'warning');
            return;
        }

        try {
            const today = new Date();
            const recordDate = today.toISOString().split('T')[0];

            const { error } = await window.supabaseClient
                .from('inventory_analysis')
                .insert({
                    record_type: 'sku_rate',
                    record_date: recordDate,
                    active_sku_count: activeSku,
                    total_sku_count: totalSku,
                    active_rate: activeRate,
                    inactive_rate: inactiveRate
                });

            if (error) throw error;

            if (window.showToast) window.showToast('SKU 数据已保存', 'success');
            loadSkuHistory();
        } catch (e) {
            console.error('保存SKU数据失败:', e);
            if (window.showToast) window.showToast('保存失败：' + (e.message || e), 'error');
        }
    });

    // ── 一键清空 ──────────────────────────────────
    const clearModal = document.getElementById('iaClearModal');

    document.getElementById('iaClearBtn')?.addEventListener('click', () => {
        if (clearModal) clearModal.style.display = 'flex';
    });

    document.getElementById('iaCancelClear')?.addEventListener('click', () => {
        if (clearModal) clearModal.style.display = 'none';
    });

    clearModal?.addEventListener('click', (e) => {
        if (e.target === clearModal) clearModal.style.display = 'none';
    });

    document.getElementById('iaConfirmClear')?.addEventListener('click', async () => {
        if (!window.supabaseClient) {
            if (window.showToast) window.showToast('未连接数据库', 'error');
            if (clearModal) clearModal.style.display = 'none';
            return;
        }

        try {
            const { error } = await window.supabaseClient
                .from('inventory_analysis')
                .delete()
                .neq('id', 0); // 清空所有行

            if (error) throw error;

            if (window.showToast) window.showToast('数据已全部清空', 'success');
            if (clearModal) clearModal.style.display = 'none';

            // 刷新历史列表
            loadTurnoverHistory();
            loadSkuHistory();

            // 清空结果区
            const tResult = document.getElementById('iaTurnoverResult');
            if (tResult) tResult.innerHTML = '<div class="ia-result-empty"><i data-lucide="bar-chart-2"></i><p>请填写左侧数据后计算</p></div>';
            const sResult = document.getElementById('iaSkuResult');
            if (sResult) sResult.innerHTML = '<div class="ia-result-empty"><i data-lucide="bar-chart-2"></i><p>请填写左侧数据后计算</p></div>';

            // 重建图标（清空内容后需刷新 lucide）
            if (window.lucide) window.lucide.createIcons();
        } catch (e) {
            console.error('清空失败:', e);
            if (window.showToast) window.showToast('清空失败：' + (e.message || e), 'error');
            if (clearModal) clearModal.style.display = 'none';
        }
    });

    // ── SKU 图表刷新 & 条数切换 ──────────────────
    document.getElementById('iaSkuChartLimit')?.addEventListener('change', (e) => {
        skuChartLimit = parseInt(e.target.value) || 10;
        loadSkuHistory();
    });

    document.getElementById('iaSkuChartRefresh')?.addEventListener('click', () => {
        loadSkuHistory();
    });

    // ── 周转率图表刷新 & 条数切换 ────────────────
    document.getElementById('iaTurnoverChartLimit')?.addEventListener('change', (e) => {
        turnoverChartLimit = parseInt(e.target.value) || 12;
        loadTurnoverHistory();
    });

    document.getElementById('iaTurnoverChartRefresh')?.addEventListener('click', () => {
        loadTurnoverHistory();
    });

    // ── 批量删除按钮绑定 ───────────────────────────
    document.getElementById('iaTurnoverBulkDel')?.addEventListener('click', async () => {
        if (!confirm('提示：此操作将清空“库存周转率”的所有历史记录，确认继续吗？')) return;
        if (!window.supabaseClient) return;
        try {
            const { error } = await window.supabaseClient.from('inventory_analysis').delete().eq('record_type', 'turnover');
            if (error) throw error;
            if (window.showToast) window.showToast('周转率记录已清空', 'success');
            loadTurnoverHistory();
            if (turnoverChart) { turnoverChart.destroy(); turnoverChart = null; }
        } catch(e) {
            console.error('清空失败:', e);
            if (window.showToast) window.showToast('清空失败', 'error');
        }
    });

    document.getElementById('iaSkuBulkDel')?.addEventListener('click', async () => {
        if (!confirm('提示：此操作将清空“SKU动销/滞销率”的所有历史记录，确认继续吗？')) return;
        if (!window.supabaseClient) return;
        try {
            const { error } = await window.supabaseClient.from('inventory_analysis').delete().eq('record_type', 'sku_rate');
            if (error) throw error;
            if (window.showToast) window.showToast('SKU记录已清空', 'success');
            loadSkuHistory();
            if (skuChart) { skuChart.destroy(); skuChart = null; }
        } catch(e) {
            console.error('清空失败:', e);
            if (window.showToast) window.showToast('清空失败', 'error');
        }
    });
    
    // ── 初始化加载 ────────────────────────────────
    // 等待 Chart.js 就绪后再渲染
    function waitForChartJs(cb, maxTry = 30) {
        if (window.Chart) { cb(); return; }
        if (maxTry <= 0) { console.warn('Chart.js 未加载'); cb(); return; }
        setTimeout(() => waitForChartJs(cb, maxTry - 1), 100);
    }

    waitForChartJs(() => {
        loadTurnoverHistory();
        loadSkuHistory();
    });
}
