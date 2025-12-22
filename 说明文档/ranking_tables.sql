-- ========================================
-- 排品功能数据库表 SQL 脚本
-- ========================================

-- 1. 排品结果表
-- 存储排品计算后的结果
CREATE TABLE IF NOT EXISTS ranking_results (
    id SERIAL PRIMARY KEY,
    product_name TEXT NOT NULL,           -- 商品名称（主键）
    product_id TEXT,                       -- 商品ID（从 product_id_data 关联）
    ranking_result TEXT,                   -- 排品结果（如 "1.评分品A"）
    sample_number TEXT,                    -- 样品序号（如 "A02"）
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 为商品名称创建索引
CREATE INDEX IF NOT EXISTS idx_ranking_results_product_name ON ranking_results(product_name);

-- 2. 排品设置表
-- 存储筛选配置（JSONB格式）
CREATE TABLE IF NOT EXISTS ranking_config (
    id SERIAL PRIMARY KEY,
    config_key TEXT UNIQUE NOT NULL,       -- 配置键（如 "filter_config"、"sample_rules"）
    config_value JSONB NOT NULL,           -- 配置值（JSON格式）
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 插入默认配置
INSERT INTO ranking_config (config_key, config_value) VALUES (
    'filter_config',
    '{
        "分类排序": [
            "评分品A筛选条件",
            "佩戴品筛选条件",
            "周边品筛选条件",
            "评分品B筛选条件",
            "库存品筛选条件"
        ],
        "结果映射": {
            "评分品A筛选条件": "1.评分品A",
            "佩戴品筛选条件": "2.佩戴品",
            "周边品筛选条件": "3.周边品",
            "评分品B筛选条件": "4.评分品B",
            "库存品筛选条件": "5.库存品"
        },
        "样品序号规则": {
            "1.评分品A": { "prefix": "A", "start": 2, "step": 2 },
            "2.佩戴品": { "prefix": "P", "start": 1, "step": 1 },
            "3.周边品": { "prefix": "Z", "start": 1, "step": 1 },
            "4.评分品B": { "prefix": "B", "start": 1, "step": 1 },
            "5.库存品": { "prefix": "A", "start": 22, "step": 2 }
        },
        "筛选条件": {
            "评分品A筛选条件": {
                "virtual_category": { "等于": ["可预售"], "启用": true },
                "actual_stock": { "大于等于": 1, "启用": true },
                "total_score": { "前几名": 10, "启用": true }
            },
            "佩戴品筛选条件": {
                "product_category": {
                    "包含": ["发圈", "发夹", "项链", "戒指", "手链", "耳钉", "胸针"],
                    "启用": true
                },
                "available_qty": { "大于等于": 3, "启用": true },
                "按子分类分别筛选": true,
                "子分类字段": "product_category"
            },
            "周边品筛选条件": {
                "product_category": { "包含": ["周边"], "启用": true },
                "available_qty": { "前几名": 4, "启用": true }
            },
            "评分品B筛选条件": {
                "available_qty": { "大于等于": 1, "启用": true },
                "total_score": { "前几名": 15, "启用": true }
            },
            "库存品筛选条件": {
                "available_qty": { "前几名": 10, "启用": true }
            }
        }
    }'::jsonb
) ON CONFLICT (config_key) DO NOTHING;
