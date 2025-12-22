-- ========================================
-- 排品数据融合视图 SQL 脚本
-- ========================================
-- 功能：将 inventory_data 和 ranking_data 融合
-- 逻辑：
--   1. 以 inventory_data 为基础，按商品名称去重
--   2. 关联 ranking_data 获取评分数据

-- 删除旧视图（如果存在）
DROP VIEW IF EXISTS ranking_combined_view;

-- 创建融合视图
CREATE OR REPLACE VIEW ranking_combined_view AS
WITH 
-- 步骤1：库存数据去重汇总
inventory_aggregated AS (
    SELECT
        product_name,
        -- 数值字段：做加法
        SUM(COALESCE(available_qty, 0)) AS available_qty,
        SUM(COALESCE(actual_stock, 0)) AS actual_stock,
        -- 文本字段：去重后用逗号分隔
        STRING_AGG(DISTINCT NULLIF(virtual_category, ''), ', ') AS virtual_category,
        STRING_AGG(DISTINCT NULLIF(product_category, ''), ', ') AS product_category,
        STRING_AGG(DISTINCT NULLIF(product_code, ''), ', ') AS product_code,
        STRING_AGG(DISTINCT NULLIF(warehouse, ''), ', ') AS warehouse,
        -- 取第一个非空的图片URL
        MAX(image_url) AS image_url
    FROM inventory_data
    WHERE product_name IS NOT NULL AND product_name != ''
    GROUP BY product_name
),

-- 步骤2：从 ranking_data 获取评分数据并计算排名
ranking_with_rank AS (
    SELECT
        product_name,
        -- 计算总分（根据业务规则调整权重）
        COALESCE(sales_amount, 0) * 0.4 +
        COALESCE(lecture_count, 0) * 0.2 +
        COALESCE(exposure_rate, 0) * 100 * 0.2 +
        COALESCE(conversion_rate, 0) * 100 * 0.2 AS total_score,
        sales_amount,
        lecture_count,
        exposure_rate,
        conversion_rate
    FROM ranking_data
    WHERE product_name IS NOT NULL AND product_name != ''
),

ranking_data_scored AS (
    SELECT
        product_name,
        total_score,
        ROW_NUMBER() OVER (ORDER BY total_score DESC) AS rating_rank,
        sales_amount,
        lecture_count,
        exposure_rate,
        conversion_rate
    FROM ranking_with_rank
)

-- 步骤3：融合评分数据
SELECT
    inv.product_name,
    inv.available_qty,
    inv.actual_stock,
    inv.virtual_category,
    inv.product_category,
    inv.product_code,
    inv.warehouse,
    inv.image_url,
    -- 评分数据（从排名表关联）
    COALESCE(rk.total_score, 0) AS total_score,
    COALESCE(rk.rating_rank, 999999) AS rating_rank,
    COALESCE(rk.sales_amount, 0) AS sales_amount,
    COALESCE(rk.lecture_count, 0) AS lecture_count,
    COALESCE(rk.exposure_rate, 0) AS exposure_rate,
    COALESCE(rk.conversion_rate, 0) AS conversion_rate
FROM inventory_aggregated inv
LEFT JOIN ranking_data_scored rk ON inv.product_name = rk.product_name;

-- 添加视图说明
COMMENT ON VIEW ranking_combined_view IS '排品数据融合视图：库存数据（去重汇总）+ 评分数据';
