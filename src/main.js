/**
 * Vite 入口文件
 * ========================================
 * 职责：
 * 1. 导入 npm 包替代 CDN（挂载到 window 保持向后兼容）
 * 2. 导入 CSS
 * 3. 导入所有 legacy 业务模块
 *
 * ⚠️ 导入顺序很重要：
 *    全局依赖 → CSS → supabase-client → app(main) → 各业务模块
 */

// ========================================
// 1. 全局依赖：npm 包导入并挂载到 window
// ========================================

// SheetJS (XLSX) - 替代 CDN: cdn.sheetjs.com/xlsx-0.20.1
import * as XLSX from 'xlsx';
window.XLSX = XLSX;

// Supabase JS - 替代 CDN: cdn.jsdelivr.net/npm/@supabase/supabase-js@2
import { createClient } from '@supabase/supabase-js';
window.supabase = { createClient };

// Lucide Icons - 替代 CDN: unpkg.com/lucide@0.263.0
// 包裹 createIcons 使其无需传参即可工作（兼容 legacy 调用方式）
import { createIcons, icons } from 'lucide';
window.lucide = {
  createIcons: function (opts) {
    createIcons({ icons, ...(opts || {}) });
  }
};

// Chart.js - 替代 CDN: cdn.jsdelivr.net/npm/chart.js@4.4.0
import Chart from 'chart.js/auto';
window.Chart = Chart;

// ========================================
// 2. 样式导入
// ========================================
import './styles/index.css';

// ========================================
// 3. Legacy 业务模块导入（保持原有加载顺序）
// ========================================

// 基础层：Supabase 客户端封装
import './supabase-client.js';

// 核心层：主应用逻辑（导航、路由、Toast、Loading等）
import './app.js';

// 业务模块层：各功能页面
import './modules/upload.js';
import './modules/new-product.js';
import './modules/ranking.js';
import './modules/welfare-ranking.js';
import './modules/mapping.js';
import './modules/coupon.js';
import './modules/presale.js';
import './modules/investment.js';
import './modules/shadowbot.js';
import './modules/id-converter.js';
import './modules/product-checker.js';
import './modules/quick-links.js';
import './modules/inventory-analysis.js';
