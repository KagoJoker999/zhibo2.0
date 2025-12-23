-- ========================================
-- 小号排品功能数据库表 SQL 脚本
-- 在 Supabase SQL Editor 中执行
-- ========================================

-- 1. 小号排品设置表（独立于主排品）
CREATE TABLE IF NOT EXISTS sub_ranking_config (
    id SERIAL PRIMARY KEY,
    config_key TEXT UNIQUE NOT NULL,
    config_value JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 插入默认配置
INSERT INTO sub_ranking_config (config_key, config_value) VALUES (
    'filter_config',
    '{
        "分类排序": ["小号品A", "小号品B"],
        "结果映射": {
            "小号品A筛选条件": "1.小号品A",
            "小号品B筛选条件": "2.小号品B"
        },
        "样品序号规则": {
            "1.小号品A": { "prefix": "S", "start": 1, "step": 1 },
            "2.小号品B": { "prefix": "S", "start": 20, "step": 1 }
        },
        "筛选条件": {
            "小号品A筛选条件": {
                "available_qty": { "大于等于": 1, "启用": true }
            },
            "小号品B筛选条件": {
                "available_qty": { "大于等于": 5, "启用": true }
            }
        }
    }'::jsonb
) ON CONFLICT (config_key) DO NOTHING;

-- 2. 小号排品结果表（独立于主排品）
CREATE TABLE IF NOT EXISTS sub_ranking_results (
    id SERIAL PRIMARY KEY,
    product_name TEXT NOT NULL,
    product_id TEXT,
    ranking_result TEXT,
    sample_number TEXT,
    image_url TEXT,
    product_code TEXT,
    warehouse TEXT,
    available_qty INTEGER DEFAULT 0,
    actual_stock INTEGER DEFAULT 0,
    total_score NUMERIC DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_sub_ranking_results_name ON sub_ranking_results(product_name);
CREATE INDEX IF NOT EXISTS idx_sub_ranking_results_result ON sub_ranking_results(ranking_result);
