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
 *   current_stock NUMERIC,        -- 当前库存总金额（取代原月初/月末双输入）
 *   turnover_rate NUMERIC,
 *   turnover_days INTEGER,         -- 周转天数 = round(当前库存 / 销售成本 * 30)
 *   active_sku_count INTEGER,
 *   total_sku_count INTEGER,
 *   active_rate NUMERIC,
 *   inactive_rate NUMERIC,
 *   saleable_sku_count INTEGER,
 *   inactive_sku_count INTEGER,
 *   inactive_saleable_rate NUMERIC,
 *   saleable_qty INTEGER,
 *   inactive_qty INTEGER,
 *   inactive_qty_rate NUMERIC,
 *   created_at TIMESTAMPTZ DEFAULT now()
 * );
 *
 * -- 若表已存在，执行以下语句新增字段：
 * ALTER TABLE inventory_analysis ADD COLUMN IF NOT EXISTS current_stock NUMERIC;
 * ALTER TABLE inventory_analysis ADD COLUMN IF NOT EXISTS turnover_days INTEGER;
 * ALTER TABLE inventory_analysis ADD COLUMN IF NOT EXISTS saleable_sku_count INTEGER;
 * ALTER TABLE inventory_analysis ADD COLUMN IF NOT EXISTS inactive_sku_count INTEGER;
 * ALTER TABLE inventory_analysis ADD COLUMN IF NOT EXISTS inactive_saleable_rate NUMERIC;
 * ALTER TABLE inventory_analysis ADD COLUMN IF NOT EXISTS saleable_qty INTEGER;
 * ALTER TABLE inventory_analysis ADD COLUMN IF NOT EXISTS inactive_qty INTEGER;
 * ALTER TABLE inventory_analysis ADD COLUMN IF NOT EXISTS inactive_qty_rate NUMERIC;
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
                    <span class="ia-card-badge">随时可算（建议每周一次）</span>
                    <span class="ia-card-badge ia-badge-orange">反映整体资金的流动性与营运效率</span>
                </div>

                <div class="ia-two-col">
                    <!-- 左：输入 -->
                    <div class="ia-input-panel">
                        <div class="ia-threshold-bar">
                            <span class="ia-card-badge ia-badge-green">“＜15天”正常值</span>
                            <span class="ia-card-badge ia-badge-orange">“15天-30天”预警值</span>
                            <span class="ia-card-badge ia-badge-red">“＞30天”危险值</span>
                            <button type="button" class="ia-formula-toggle-btn" onclick="const box = this.parentElement.nextElementSibling; if(box.style.display==='none'){box.style.display='block'; this.innerHTML='隐藏公式';} else {box.style.display='none'; this.innerHTML='查看公式';}">查看公式</button>
                        </div>
                        <div class="ia-formula-box" style="display: none;">
                            <div class="ia-formula-title">计算公式</div>
                            <div class="ia-formula-content">
                                月度库存周转率 = <span class="ia-fraction"><span class="ia-numerator">当月商品销售总成本</span><span class="ia-denominator">当前库存总金额</span></span>
                                <br style="margin:0.4rem 0;">
                                <span style="font-size:0.85em;">周转天数 = <span class="ia-fraction" style="font-size:1em;"><span class="ia-numerator">当前库存总金额</span><span class="ia-denominator">当月商品销售总成本</span></span> × 30 （四舍五入）</span>
                            </div>
                        </div>

                        <div class="ia-field">
                            <div class="ia-field-label-row">
                                <label for="iaSalesCost">当月商品销售总成本</label>
                                <div class="ia-source-tags-group">
                                    <div class="ia-source-tag">ERP 报表-销售主体分析</div>
                                    <div class="ia-source-tag">查询池：近一个月销售成本</div>
                                    <div class="ia-source-tag">数值为「净销售成本」</div>
                                </div>
                            </div>
                            <div class="ia-input-box">
                                <input type="number" id="iaSalesCost" placeholder="0.00" min="0" step="0.01">
                                <span class="ia-suffix">元</span>
                            </div>
                        </div>

                        <div class="ia-field">
                            <div class="ia-field-label-row">
                                <label for="iaCurrentStock">当前库存总金额</label>
                                <div class="ia-source-tags-group">
                                    <div class="ia-source-tag">ERP 报表-商品库存结构分析</div>
                                    <div class="ia-source-tag">查询池：库存总金额（成本）</div>
                                    <div class="ia-source-tag">数值为「主仓实际库存金额」</div>
                                </div>
                            </div>
                            <div class="ia-input-box">
                                <input type="number" id="iaCurrentStock" placeholder="0.00" min="0" step="0.01">
                                <span class="ia-suffix">元</span>
                            </div>
                        </div>

                        <button type="button" class="btn btn-primary ia-submit-btn" id="iaTurnoverSave">
                            <i data-lucide="save"></i> 计算并保存
                        </button>
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
                                    <span class="ia-tip">（数据库：inventory_analysis）</span>
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
                    <span class="ia-card-badge">随时可算（建议小号开播前后均计算一次）</span>
                    <span class="ia-card-badge ia-badge-orange">反映选品精准度与直播间带货能力</span>
                </div>

                <div class="ia-two-col">
                    <!-- 左：输入 -->
                    <div class="ia-input-panel">
                        <div class="ia-threshold-bar">
                            <span class="ia-card-badge ia-badge-green">“滞销SKU＜20%”正常值</span>
                            <span class="ia-card-badge ia-badge-orange">“滞销SKU20%-30%”预警值</span>
                            <span class="ia-card-badge ia-badge-red">“滞销SKU＞30%”危险值</span>
                            <button type="button" class="ia-formula-toggle-btn" onclick="const box = this.parentElement.nextElementSibling; if(box.style.display==='none'){box.style.display='block'; this.innerHTML='隐藏公式';} else {box.style.display='none'; this.innerHTML='查看公式';}">查看公式</button>
                        </div>
                        <div class="ia-formula-box" style="display: none;">
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
                                <div class="ia-source-tags-group">
                                    <div class="ia-source-tag">ERP 商品及库存管理</div>
                                    <div class="ia-source-tag">筛选池：有销量SKU数 &gt; 5</div>
                                    <div class="ia-source-tag">数值为「条目数」</div>
                                </div>
                            </div>
                            <div class="ia-input-box">
                                <input type="number" id="iaActiveSku" placeholder="0" min="0" step="1">
                                <span class="ia-suffix">个</span>
                            </div>
                        </div>

                        <div class="ia-field">
                            <div class="ia-field-label-row">
                                <label for="iaTotalSku">当前店铺总 SKU 数</label>
                                <div class="ia-source-tags-group">
                                    <div class="ia-source-tag">ERP 商品及库存管理</div>
                                    <div class="ia-source-tag">筛选池：有效SKU数 &gt; 5</div>
                                    <div class="ia-source-tag">数值为「条目数」</div>
                                </div>
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

            <!-- ===== 模块三：滞销/可售 SKU 统计 ===== -->
            <div class="ia-card">
                <div class="ia-card-header">
                    <span class="ia-card-title"><i data-lucide="bar-chart-3"></i> 滞销/可售 SKU 统计</span>
                    <span class="ia-card-badge">随时可算（建议每周一次）</span>
                    <span class="ia-card-badge ia-badge-orange">反映新品上货库存深度、备货深度、选品精准度及定价准确度。数值越高越不好。</span>
                </div>

                <div class="ia-two-col">
                    <!-- 左：输入 -->
                    <div class="ia-input-panel">
                        <div class="ia-threshold-bar">
                            <span class="ia-card-badge ia-badge-green">“＜15%”正常值</span>
                            <span class="ia-card-badge ia-badge-orange">“15%-30%”预警值</span>
                            <span class="ia-card-badge ia-badge-red">“＞30%”危险值</span>
                            <button type="button" class="ia-formula-toggle-btn" onclick="const box = this.parentElement.nextElementSibling; if(box.style.display==='none'){box.style.display='block'; this.innerHTML='隐藏公式';} else {box.style.display='none'; this.innerHTML='查看公式';}">查看公式</button>
                        </div>
                        <div class="ia-formula-box" style="display: none;">
                            <div class="ia-formula-title">计算公式</div>
                            <div class="ia-formula-content">
                                滞销 SKU 占比 = <span class="ia-fraction"><span class="ia-numerator">滞销 SKU 数量</span><span class="ia-denominator">可售 SKU 数量</span></span> × 100%
                            </div>
                        </div>

                        <div class="ia-field">
                            <div class="ia-field-label-row">
                                <label for="iaSaleableSku">可售 SKU 数量</label>
                                <div class="ia-source-tags-group">
                                    <div class="ia-source-tag">ERP 商品及库存管理</div>
                                    <div class="ia-source-tag">筛选池：可售 SKU 数量</div>
                                    <div class="ia-source-tag">数值为「条目数」</div>
                                </div>
                            </div>
                            <div class="ia-input-box">
                                <input type="number" id="iaSaleableSku" placeholder="0" min="1" step="1">
                                <span class="ia-suffix">个</span>
                            </div>
                        </div>

                        <div class="ia-field">
                            <div class="ia-field-label-row">
                                <label for="iaInactiveSku">滞销 SKU 数量</label>
                                <div class="ia-source-tags-group">
                                    <div class="ia-source-tag">ERP 商品及库存管理</div>
                                    <div class="ia-source-tag">筛选池：滞销 SKU 数量</div>
                                    <div class="ia-source-tag">数值为「条目数」</div>
                                </div>
                            </div>
                            <div class="ia-input-box">
                                <input type="number" id="iaInactiveSku" placeholder="0" min="0" step="1">
                                <span class="ia-suffix">个</span>
                            </div>
                        </div>

                        <button type="button" class="btn btn-primary ia-submit-btn" id="iaSkuStockSave">
                            <i data-lucide="save"></i> 计算并保存
                        </button>
                    </div>

                    <!-- 右：结果 -->
                    <div class="ia-result-panel">
                        <div class="ia-result-card" id="iaSkuStockResult">
                            <div class="ia-result-empty">
                                <i data-lucide="bar-chart-2"></i>
                                <p>请填写左侧数据后计算</p>
                            </div>
                        </div>

                        <div class="ia-history-list" id="iaSkuStockHistory">
                            <div class="ia-history-header" style="justify-content:space-between;display:flex;">
                                <div>
                                    <i data-lucide="clock"></i> 历史记录
                                    <span class="ia-tip">（数据库：inventory_analysis）</span>
                                </div>
                                <button type="button" class="ia-bulk-del-btn" id="iaSkuStockBulkDel" title="清空所有滞销/可售SKU记录">
                                    <i data-lucide="trash-2"></i> 批量删除
                                </button>
                            </div>
                            <div class="ia-history-body" id="iaSkuStockHistoryBody">
                                <div class="ia-loading"><i data-lucide="loader-2"></i> 加载中...</div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 滞销占比曲线图 -->
                <div class="ia-chart-wrap">
                    <div class="ia-chart-title">
                        <span><i data-lucide="trending-down"></i> 滞销 SKU 占比历史趋势</span>
                        <div class="ia-chart-controls">
                            <select id="iaSkuStockChartLimit" class="ia-chart-select">
                                <option value="10" selected>最近 10 条</option>
                                <option value="30">最近 30 条</option>
                            </select>
                            <button type="button" class="ia-chart-refresh-btn" id="iaSkuStockChartRefresh">
                                <i data-lucide="refresh-cw"></i> 刷新图表
                            </button>
                        </div>
                    </div>
                    <div class="ia-chart-container">
                        <canvas id="iaSkuStockChart"></canvas>
                    </div>
                </div>
            </div>

            <!-- ===== 模块四：滞销/可用数 统计 ===== -->
            <div class="ia-card">
                <div class="ia-card-header">
                    <span class="ia-card-title"><i data-lucide="pie-chart"></i> 滞销/可售 可用数 统计</span>
                    <span class="ia-card-badge">随时可算（建议每周一次）</span>
                    <span class="ia-card-badge ia-badge-orange">反映新品上货库存深度、备货深度、选品精准度及定价准确度。数值越高越不好。</span>
                </div>

                <div class="ia-two-col">
                    <!-- 左：输入 -->
                    <div class="ia-input-panel">
                        <div class="ia-threshold-bar">
                            <span class="ia-card-badge ia-badge-green">“＜10%”正常值</span>
                            <span class="ia-card-badge ia-badge-orange">“10%-15%”预警值</span>
                            <span class="ia-card-badge ia-badge-red">“＞15%”危险值</span>
                            <button type="button" class="ia-formula-toggle-btn" onclick="const box = this.parentElement.nextElementSibling; if(box.style.display==='none'){box.style.display='block'; this.innerHTML='隐藏公式';} else {box.style.display='none'; this.innerHTML='查看公式';}">查看公式</button>
                        </div>
                        <div class="ia-formula-box" style="display: none;">
                            <div class="ia-formula-title">计算公式</div>
                            <div class="ia-formula-content">
                                滞销可用数占比 = <span class="ia-fraction"><span class="ia-numerator">滞销可用数</span><span class="ia-denominator">可用数（总）</span></span> × 100%
                            </div>
                        </div>

                        <div class="ia-field">
                            <div class="ia-field-label-row">
                                <label for="iaSaleableQty">可用数（总）</label>
                                <div class="ia-source-tags-group">
                                    <div class="ia-source-tag">ERP 商品及库存管理</div>
                                    <div class="ia-source-tag">筛选池：可售 SKU 数量</div>
                                    <div class="ia-source-tag">数值为「可用数合计」</div>
                                </div>
                            </div>
                            <div class="ia-input-box">
                                <input type="number" id="iaSaleableQty" placeholder="0" min="1" step="1">
                                <span class="ia-suffix">件</span>
                            </div>
                        </div>

                        <div class="ia-field">
                            <div class="ia-field-label-row">
                                <label for="iaInactiveQty">滞销可用数</label>
                                <div class="ia-source-tags-group">
                                    <div class="ia-source-tag">ERP 商品及库存管理</div>
                                    <div class="ia-source-tag">筛选池：滞销 SKU 数量</div>
                                    <div class="ia-source-tag">数值为「可用数合计」</div>
                                </div>
                            </div>
                            <div class="ia-input-box">
                                <input type="number" id="iaInactiveQty" placeholder="0" min="0" step="1">
                                <span class="ia-suffix">件</span>
                            </div>
                        </div>

                        <button type="button" class="btn btn-primary ia-submit-btn" id="iaQtyStockSave">
                            <i data-lucide="save"></i> 计算并保存
                        </button>
                    </div>

                    <!-- 右：结果 -->
                    <div class="ia-result-panel">
                        <div class="ia-result-card" id="iaQtyStockResult">
                            <div class="ia-result-empty">
                                <i data-lucide="bar-chart-2"></i>
                                <p>请填写左侧数据后计算</p>
                            </div>
                        </div>

                        <div class="ia-history-list" id="iaQtyStockHistory">
                            <div class="ia-history-header" style="justify-content:space-between;display:flex;">
                                <div>
                                    <i data-lucide="clock"></i> 历史记录
                                    <span class="ia-tip">（数据库：inventory_analysis）</span>
                                </div>
                                <button type="button" class="ia-bulk-del-btn" id="iaQtyStockBulkDel" title="清空所有滞销/可用数记录">
                                    <i data-lucide="trash-2"></i> 批量删除
                                </button>
                            </div>
                            <div class="ia-history-body" id="iaQtyStockHistoryBody">
                                <div class="ia-loading"><i data-lucide="loader-2"></i> 加载中...</div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 滞销可用数占比曲线图 -->
                <div class="ia-chart-wrap">
                    <div class="ia-chart-title">
                        <span><i data-lucide="trending-down"></i> 滞销可用数占比历史趋势</span>
                        <div class="ia-chart-controls">
                            <select id="iaQtyStockChartLimit" class="ia-chart-select">
                                <option value="10" selected>最近 10 条</option>
                                <option value="30">最近 30 条</option>
                            </select>
                            <button type="button" class="ia-chart-refresh-btn" id="iaQtyStockChartRefresh">
                                <i data-lucide="refresh-cw"></i> 刷新图表
                            </button>
                        </div>
                    </div>
                    <div class="ia-chart-container">
                        <canvas id="iaQtyStockChart"></canvas>
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

            .ia-badge-red {
                background: rgba(245, 63, 63, 0.1);
                color: var(--error-color);
                border-color: rgba(245, 63, 63, 0.3);
            }

            .ia-badge-green {
                background: rgba(0, 180, 42, 0.1);
                color: #00b42a;
                border-color: rgba(0, 180, 42, 0.3);
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

            /* 阈值栏 */
            .ia-threshold-bar {
                display: grid;
                grid-template-columns: 1fr 1fr 1fr auto;
                gap: 0.5rem;
                margin-bottom: 1rem;
                align-items: center;
            }

            .ia-threshold-bar .ia-card-badge {
                justify-content: center;
                display: flex;
            }

            .ia-formula-toggle-btn {
                background: var(--bg-secondary);
                border: 1px solid var(--border-color);
                color: var(--text-secondary);
                padding: 0.35rem 0.75rem;
                border-radius: 4px;
                cursor: pointer;
                font-size: 0.75rem;
                font-weight: 500;
                transition: all 0.2s;
                text-align: center;
                margin-left: auto;
            }

            .ia-formula-toggle-btn:hover {
                background: rgba(22, 93, 255, 0.05);
                color: var(--primary-color);
                border-color: rgba(22, 93, 255, 0.2);
            }

            /* 公式展示框 */
            .ia-formula-box {
                background: rgba(255, 255, 255, 0.03);
                border: 1px solid var(--border-color);
                border-radius: 8px;
                padding: 1rem;
                margin-bottom: 1rem;
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
                max-height: 110px; /* 控制最多显示约 3 条记录，超出的滚动 */
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
            .ia-source-tags-group {
                display: flex;
                gap: 0.3rem;
                flex-wrap: wrap;
                justify-content: flex-end;
            }

            /* 数据来源高亮标签 */
            .ia-source-tag {
                font-size: 0.68rem;
                font-weight: 500;
                color: #ffffff;
                background: #165DFF;
                border: 1px solid #165DFF;
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
    let skuStockChart = null;
    let qtyStockChart = null;

    // 记录目前编辑的周转率项
    let currentEditingTurnoverId = null;
    let turnoverHistoryData = [];

    // ── 模块表单重置器 ──────────────────────────
    function resetTurnoverForm() {
        currentEditingTurnoverId = null;
        const sc = document.getElementById('iaSalesCost');
        const cs = document.getElementById('iaCurrentStock');
        if (sc) sc.value = '';
        if (cs) cs.value = '';
        const btn = document.getElementById('iaTurnoverSave');
        if (btn) {
            btn.innerHTML = '<i data-lucide="save"></i> 计算并保存';
            btn.style.background = '';
            btn.style.borderColor = '';
        }
        if (window.lucide) window.lucide.createIcons();
    }

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
                    const days = r.turnover_days !== null ? r.turnover_days : '--';
                    const rateColor = r.turnover_rate !== null && r.turnover_rate >= 2 ? 'ia-success' : 'ia-warn';
                    return `<div class="ia-history-item" data-id="${r.id}">
                        <span class="ia-history-date">${r.record_date || r.record_month || '--'}</span>
                        <span style="display:flex;align-items:center;gap:0.5rem;">
                            <span class="ia-history-rate ${rateColor}">${rate}%</span>
                            <span style="font-size:0.78rem;color:var(--text-muted);">${days !== '--' ? days + '天' : ''}</span>
                            <button type="button" class="ia-del-btn" data-id="${r.id}" data-type="turnover" title="删除此记录">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                            </button>
                        </span>
                    </div>`;
                }).join('');

                turnoverHistoryData = data;

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

        const valid = data
            .filter(r => r.turnover_rate !== null)
            .sort((a, b) => (a.record_date || '').localeCompare(b.record_date || ''))
            .slice(-(limit || 12));

        const labels = valid.map(r => r.record_date || r.record_month || '--');
        const rates = valid.map(r => Number(r.turnover_rate));
        const days = valid.map(r => r.turnover_days !== null ? Number(r.turnover_days) : null);

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
                datasets: [
                    {
                        label: '库存周转率（%）',
                        data: rates,
                        borderColor: 'rgba(22, 93, 255, 0.9)',
                        backgroundColor: 'rgba(22, 93, 255, 0.1)',
                        borderWidth: 2,
                        pointBackgroundColor: 'rgba(22, 93, 255, 1)',
                        pointRadius: 4,
                        pointHoverRadius: 6,
                        fill: true,
                        tension: 0.3,
                        yAxisID: 'yRate'
                    },
                    {
                        label: '周转天数（天）',
                        data: days,
                        borderColor: 'rgba(255, 125, 0, 0.9)',
                        backgroundColor: 'rgba(255, 125, 0, 0.0)',
                        borderWidth: 2,
                        borderDash: [4, 4],
                        pointBackgroundColor: 'rgba(255, 125, 0, 1)',
                        pointRadius: 4,
                        pointHoverRadius: 6,
                        fill: false,
                        tension: 0.3,
                        yAxisID: 'yDays'
                    }
                ]
            },
            options: {
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
                            label: ctx => {
                                const v = ctx.parsed.y;
                                if (ctx.datasetIndex === 0) return ` 周转率: ${v !== null ? v.toFixed(2) + '%' : '--'}`;
                                return ` 周转天数: ${v !== null ? v + ' 天' : '--'}`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: { color: 'rgba(255,255,255,0.05)' },
                        ticks: { color: 'rgba(255,255,255,0.5)', font: { size: 11 } }
                    },
                    yRate: {
                        type: 'linear',
                        position: 'left',
                        grid: { color: 'rgba(255,255,255,0.05)' },
                        ticks: {
                            color: 'rgba(22, 93, 255, 0.8)',
                            font: { size: 11 },
                            callback: v => v + '%'
                        },
                        title: { display: true, text: '周转率 (%)', color: 'rgba(22,93,255,0.7)', font: { size: 11 } }
                    },
                    yDays: {
                        type: 'linear',
                        position: 'right',
                        grid: { drawOnChartArea: false },
                        ticks: {
                            color: 'rgba(255, 125, 0, 0.8)',
                            font: { size: 11 },
                            callback: v => v + '天'
                        },
                        title: { display: true, text: '周转天数 (天)', color: 'rgba(255,125,0,0.7)', font: { size: 11 } }
                    }
                }
            }
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
        const currentStock = parseFloat(document.getElementById('iaCurrentStock')?.value);

        if (isNaN(salesCost) || salesCost <= 0 || isNaN(currentStock) || currentStock < 0) {
            if (window.showToast) window.showToast('请正确填写当月销售总成本和当前库存总金额', 'warning');
            return;
        }

        // 计算周转率：当月销售成本 / 当前库存总金额 * 100
        const turnoverRate = (salesCost / currentStock) * 100;
        // 计算周转天数：当前库存总金额 / 当月销售成本 * 30，四舍五入
        const turnoverDays = Math.round((currentStock / salesCost) * 30);

        // 显示结果
        const resultEl = document.getElementById('iaTurnoverResult');
        if (resultEl) {
            const today = new Date();
            const rateColor = turnoverRate >= 200 ? 'ia-success' : turnoverRate >= 100 ? 'ia-warn' : 'ia-error';
            const daysColor = turnoverDays <= 15 ? 'ia-success' : turnoverDays <= 30 ? 'ia-warn' : 'ia-error';
            resultEl.innerHTML = `<div class="ia-result-content">
                <div class="ia-result-row">
                    <span class="ia-result-label">当月销售总成本</span>
                    <span class="ia-result-value">¥ ${salesCost.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}</span>
                </div>
                <div class="ia-result-row">
                    <span class="ia-result-label">当前库存总金额</span>
                    <span class="ia-result-value">¥ ${currentStock.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}</span>
                </div>
                <div class="ia-result-row">
                    <span class="ia-result-label">月度库存周转率</span>
                    <span class="ia-result-value ia-highlight ${rateColor}">${turnoverRate.toFixed(2)}%</span>
                </div>
                <div class="ia-result-row">
                    <span class="ia-result-label">库存周转天数</span>
                    <span class="ia-result-value ia-highlight ${daysColor}">${turnoverDays} 天</span>
                </div>
                <div class="ia-result-row">
                    <span class="ia-result-label">计算日期</span>
                    <span class="ia-result-value" style="font-size:0.85rem;">${today.toLocaleDateString('zh-CN')}</span>
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
            const recordMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
            const recordDate = today.toISOString().split('T')[0];

            const payload = {
                record_type: 'turnover',
                record_date: recordDate,
                record_month: recordMonth,
                sales_cost: salesCost,
                current_stock: currentStock,
                turnover_rate: turnoverRate,
                turnover_days: turnoverDays
            };

            const { error } = await window.supabaseClient
                .from('inventory_analysis')
                .insert(payload);

            if (error) throw error;
            if (window.showToast) window.showToast('周转率数据已保存', 'success');
            resetTurnoverForm();
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
        } catch (e) {
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
        } catch (e) {
            console.error('清空失败:', e);
            if (window.showToast) window.showToast('清空失败', 'error');
        }
    });

    // ── 模块三：滞销/可售 SKU 统计 ─────────────────
    let skuStockChartLimit = 10;

    async function loadSkuStockHistory() {
        const body = document.getElementById('iaSkuStockHistoryBody');
        if (!body) return;
        if (!window.supabaseClient) {
            body.innerHTML = '<div class="ia-empty-tip">未连接数据库</div>';
            return;
        }
        try {
            const { data, error } = await window.supabaseClient
                .from('inventory_analysis')
                .select('*')
                .eq('record_type', 'sku_stock')
                .order('record_date', { ascending: false })
                .limit(30);

            if (error) throw error;

            if (!data || data.length === 0) {
                body.innerHTML = '<div class="ia-empty-tip">暂无历史数据</div>';
            } else {
                body.innerHTML = data.map(r => {
                    const rate = r.inactive_saleable_rate !== null ? Number(r.inactive_saleable_rate).toFixed(1) : '--';
                    const rateNum = r.inactive_saleable_rate !== null ? Number(r.inactive_saleable_rate) : null;
                    const colorClass = rateNum === null ? '' : rateNum <= 20 ? 'ia-success' : rateNum <= 40 ? 'ia-warn' : 'ia-error';
                    return `<div class="ia-history-item" data-id="${r.id}">
                        <span class="ia-history-date">${r.record_date || '--'}</span>
                        <span style="display:flex;align-items:center;gap:0.5rem;">
                            <span>
                                <span style="color:var(--text-muted);font-size:0.78rem;">${r.inactive_sku_count ?? '--'}/${r.saleable_sku_count ?? '--'} 个</span>
                                <span style="margin:0 4px;color:var(--text-muted);">·</span>
                                <span class="ia-history-rate ${colorClass}">${rate}%</span>
                            </span>
                            <button type="button" class="ia-del-btn" data-id="${r.id}" data-type="sku_stock" title="删除此记录">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                            </button>
                        </span>
                    </div>`;
                }).join('');

                // 绑定删除按钮事件
                body.querySelectorAll('.ia-del-btn[data-type="sku_stock"]').forEach(btn => {
                    btn.addEventListener('click', () => deleteRecord(btn.dataset.id, loadSkuStockHistory));
                });
            }

            renderSkuStockChart(data || [], skuStockChartLimit);
        } catch (e) {
            console.error('加载滞销SKU统计历史失败:', e);
            body.innerHTML = '<div class="ia-empty-tip">加载失败</div>';
        }
    }

    // ── 模块三：渲染趋势图 ──────────────────────────
    function renderSkuStockChart(data, limit) {
        const canvas = document.getElementById('iaSkuStockChart');
        if (!canvas) return;

        const sorted = [...data]
            .sort((a, b) => (a.record_date || '').localeCompare(b.record_date || ''))
            .slice(-(limit || 10));

        const labels = sorted.map(r => r.record_date || '--');
        const rates = sorted.map(r => r.inactive_saleable_rate !== null ? Number(r.inactive_saleable_rate) : null);

        if (skuStockChart) {
            skuStockChart.destroy();
            skuStockChart = null;
        }

        if (sorted.length === 0) {
            canvas.parentElement.innerHTML = '<div class="ia-empty-tip" style="padding:2rem;">暂无图表数据</div>';
            return;
        }

        skuStockChart = new Chart(canvas, {
            type: 'line',
            data: {
                labels,
                datasets: [{
                    label: '滞销 SKU 占比（%）',
                    data: rates,
                    borderColor: 'rgba(245, 63, 63, 0.9)',
                    backgroundColor: 'rgba(245, 63, 63, 0.1)',
                    borderWidth: 2,
                    pointBackgroundColor: 'rgba(245, 63, 63, 1)',
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    fill: true,
                    tension: 0.3
                }]
            },
            options: getChartOptions('%')
        });
    }

    // ── 模块三：计算并保存 ──────────────────────────
    document.getElementById('iaSkuStockSave')?.addEventListener('click', async () => {
        const saleableSku = parseInt(document.getElementById('iaSaleableSku')?.value);
        const inactiveSku = parseInt(document.getElementById('iaInactiveSku')?.value);

        if (isNaN(saleableSku) || saleableSku <= 0) {
            if (window.showToast) window.showToast('请填写可售 SKU 数量（需大于 0）', 'warning');
            return;
        }
        if (isNaN(inactiveSku) || inactiveSku < 0) {
            if (window.showToast) window.showToast('请填写滞销 SKU 数量', 'warning');
            return;
        }
        if (inactiveSku > saleableSku) {
            if (window.showToast) window.showToast('滞销 SKU 数不能大于可售 SKU 数', 'warning');
            return;
        }

        const inactiveSaleableRate = (inactiveSku / saleableSku) * 100;

        // 显示结果
        const resultEl = document.getElementById('iaSkuStockResult');
        if (resultEl) {
            const today = new Date();
            const rateColor = inactiveSaleableRate <= 20 ? 'ia-success' : inactiveSaleableRate <= 40 ? 'ia-warn' : 'ia-error';

            resultEl.innerHTML = `<div class="ia-result-content">
                <div class="ia-result-row">
                    <span class="ia-result-label">可售 SKU 数量</span>
                    <span class="ia-result-value">${saleableSku} 个</span>
                </div>
                <div class="ia-result-row">
                    <span class="ia-result-label">滞销 SKU 数量</span>
                    <span class="ia-result-value">${inactiveSku} 个</span>
                </div>
                <div class="ia-result-row">
                    <span class="ia-result-label">滞销 SKU 占比</span>
                    <span class="ia-result-value ia-highlight ${rateColor}">${inactiveSaleableRate.toFixed(1)}%</span>
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
                    record_type: 'sku_stock',
                    record_date: recordDate,
                    saleable_sku_count: saleableSku,
                    inactive_sku_count: inactiveSku,
                    inactive_saleable_rate: inactiveSaleableRate
                });

            if (error) throw error;

            if (window.showToast) window.showToast('滞销/可售 SKU 数据已保存', 'success');
            loadSkuStockHistory();
        } catch (e) {
            console.error('保存滞销SKU数据失败:', e);
            if (window.showToast) window.showToast('保存失败：' + (e.message || e), 'error');
        }
    });

    // ── 模块三：图表刷新 & 条数切换 ─────────────────
    document.getElementById('iaSkuStockChartLimit')?.addEventListener('change', (e) => {
        skuStockChartLimit = parseInt(e.target.value) || 10;
        loadSkuStockHistory();
    });

    document.getElementById('iaSkuStockChartRefresh')?.addEventListener('click', () => {
        loadSkuStockHistory();
    });

    // ── 模块三：批量删除 ────────────────────────────
    document.getElementById('iaSkuStockBulkDel')?.addEventListener('click', async () => {
        if (!confirm('提示：此操作将清空"滞销/可售SKU统计"的所有历史记录，确认继续吗？')) return;
        if (!window.supabaseClient) return;
        try {
            const { error } = await window.supabaseClient.from('inventory_analysis').delete().eq('record_type', 'sku_stock');
            if (error) throw error;
            if (window.showToast) window.showToast('滞销/可售SKU记录已清空', 'success');
            loadSkuStockHistory();
            if (skuStockChart) { skuStockChart.destroy(); skuStockChart = null; }
        } catch (e) {
            console.error('清空失败:', e);
            if (window.showToast) window.showToast('清空失败', 'error');
        }
    });

    // ── 模块四：滞销/可用数 统计 ─────────────────────
    let qtyStockChartLimit = 10;

    async function loadQtyStockHistory() {
        const body = document.getElementById('iaQtyStockHistoryBody');
        if (!body) return;
        if (!window.supabaseClient) {
            body.innerHTML = '<div class="ia-empty-tip">未连接数据库</div>';
            return;
        }
        try {
            const { data, error } = await window.supabaseClient
                .from('inventory_analysis')
                .select('*')
                .eq('record_type', 'qty_stock')
                .order('record_date', { ascending: false })
                .limit(30);

            if (error) throw error;

            if (!data || data.length === 0) {
                body.innerHTML = '<div class="ia-empty-tip">暂无历史数据</div>';
            } else {
                body.innerHTML = data.map(r => {
                    const rate = r.inactive_qty_rate !== null ? Number(r.inactive_qty_rate).toFixed(1) : '--';
                    const rateNum = r.inactive_qty_rate !== null ? Number(r.inactive_qty_rate) : null;
                    const colorClass = rateNum === null ? '' : rateNum <= 20 ? 'ia-success' : rateNum <= 40 ? 'ia-warn' : 'ia-error';
                    return `<div class="ia-history-item" data-id="${r.id}">
                        <span class="ia-history-date">${r.record_date || '--'}</span>
                        <span style="display:flex;align-items:center;gap:0.5rem;">
                            <span>
                                <span style="color:var(--text-muted);font-size:0.78rem;">${r.inactive_qty ?? '--'}/${r.saleable_qty ?? '--'} 件</span>
                                <span style="margin:0 4px;color:var(--text-muted);">·</span>
                                <span class="ia-history-rate ${colorClass}">${rate}%</span>
                            </span>
                            <button type="button" class="ia-del-btn" data-id="${r.id}" data-type="qty_stock" title="删除此记录">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                            </button>
                        </span>
                    </div>`;
                }).join('');

                body.querySelectorAll('.ia-del-btn[data-type="qty_stock"]').forEach(btn => {
                    btn.addEventListener('click', () => deleteRecord(btn.dataset.id, loadQtyStockHistory));
                });
            }

            renderQtyStockChart(data || [], qtyStockChartLimit);
        } catch (e) {
            console.error('加载可用数统计历史失败:', e);
            body.innerHTML = '<div class="ia-empty-tip">加载失败</div>';
        }
    }

    function renderQtyStockChart(data, limit) {
        const canvas = document.getElementById('iaQtyStockChart');
        if (!canvas) return;

        const sorted = [...data]
            .sort((a, b) => (a.record_date || '').localeCompare(b.record_date || ''))
            .slice(-(limit || 10));

        const labels = sorted.map(r => r.record_date || '--');
        const rates = sorted.map(r => r.inactive_qty_rate !== null ? Number(r.inactive_qty_rate) : null);

        if (qtyStockChart) {
            qtyStockChart.destroy();
            qtyStockChart = null;
        }

        if (sorted.length === 0) {
            canvas.parentElement.innerHTML = '<div class="ia-empty-tip" style="padding:2rem;">暂无图表数据</div>';
            return;
        }

        qtyStockChart = new Chart(canvas, {
            type: 'line',
            data: {
                labels,
                datasets: [{
                    label: '滞销可用数占比（%）',
                    data: rates,
                    borderColor: 'rgba(245, 63, 63, 0.9)',
                    backgroundColor: 'rgba(245, 63, 63, 0.1)',
                    borderWidth: 2,
                    pointBackgroundColor: 'rgba(245, 63, 63, 1)',
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    fill: true,
                    tension: 0.3
                }]
            },
            options: getChartOptions('%')
        });
    }

    document.getElementById('iaQtyStockSave')?.addEventListener('click', async () => {
        const saleableQty = parseInt(document.getElementById('iaSaleableQty')?.value);
        const inactiveQty = parseInt(document.getElementById('iaInactiveQty')?.value);

        if (isNaN(saleableQty) || saleableQty <= 0) {
            if (window.showToast) window.showToast('请填写可用数（需大于 0）', 'warning');
            return;
        }
        if (isNaN(inactiveQty) || inactiveQty < 0) {
            if (window.showToast) window.showToast('请填写滞销可用数', 'warning');
            return;
        }
        if (inactiveQty > saleableQty) {
            if (window.showToast) window.showToast('滞销可用数不能大于可用数总量', 'warning');
            return;
        }

        const inactiveQtyRate = (inactiveQty / saleableQty) * 100;

        const resultEl = document.getElementById('iaQtyStockResult');
        if (resultEl) {
            const today = new Date();
            const rateColor = inactiveQtyRate <= 20 ? 'ia-success' : inactiveQtyRate <= 40 ? 'ia-warn' : 'ia-error';
            resultEl.innerHTML = `<div class="ia-result-content">
                <div class="ia-result-row">
                    <span class="ia-result-label">可用数（总）</span>
                    <span class="ia-result-value">${saleableQty} 件</span>
                </div>
                <div class="ia-result-row">
                    <span class="ia-result-label">滞销可用数</span>
                    <span class="ia-result-value">${inactiveQty} 件</span>
                </div>
                <div class="ia-result-row">
                    <span class="ia-result-label">滞销可用数占比</span>
                    <span class="ia-result-value ia-highlight ${rateColor}">${inactiveQtyRate.toFixed(1)}%</span>
                </div>
                <div class="ia-result-row">
                    <span class="ia-result-label">计算时间</span>
                    <span class="ia-result-value" style="font-size:0.82rem;">${today.toLocaleString('zh-CN')}</span>
                </div>
            </div>`;
        }

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
                    record_type: 'qty_stock',
                    record_date: recordDate,
                    saleable_qty: saleableQty,
                    inactive_qty: inactiveQty,
                    inactive_qty_rate: inactiveQtyRate
                });
            if (error) throw error;
            if (window.showToast) window.showToast('滞销/可用数数据已保存', 'success');
            loadQtyStockHistory();
        } catch (e) {
            console.error('保存可用数数据失败:', e);
            if (window.showToast) window.showToast('保存失败：' + (e.message || e), 'error');
        }
    });

    document.getElementById('iaQtyStockChartLimit')?.addEventListener('change', (e) => {
        qtyStockChartLimit = parseInt(e.target.value) || 10;
        loadQtyStockHistory();
    });

    document.getElementById('iaQtyStockChartRefresh')?.addEventListener('click', () => {
        loadQtyStockHistory();
    });

    document.getElementById('iaQtyStockBulkDel')?.addEventListener('click', async () => {
        if (!confirm('提示：此操作将清空「滞销/可用数统计」的所有历史记录，确认继续吗？')) return;
        if (!window.supabaseClient) return;
        try {
            const { error } = await window.supabaseClient.from('inventory_analysis').delete().eq('record_type', 'qty_stock');
            if (error) throw error;
            if (window.showToast) window.showToast('滞销/可用数记录已清空', 'success');
            loadQtyStockHistory();
            if (qtyStockChart) { qtyStockChart.destroy(); qtyStockChart = null; }
        } catch (e) {
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
        loadSkuStockHistory();
        loadQtyStockHistory();
    });
}
