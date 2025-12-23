-- ========================================
-- 排品对照功能数据库表 SQL 脚本
-- 在 Supabase SQL Editor 中执行
-- ========================================

-- 1. 对照历史记录表
-- 存储上一次生成的对照结果
CREATE TABLE IF NOT EXISTS mapping_history (
    id SERIAL PRIMARY KEY,
    product_name TEXT NOT NULL,
    product_id TEXT,
    ranking_result TEXT,
    sample_number TEXT,
    image_url TEXT,
    warehouse TEXT,
    sample_warehouse TEXT,
    available_qty INTEGER DEFAULT 0,
    actual_stock INTEGER DEFAULT 0,
    generated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_mapping_history_name ON mapping_history(product_name);
CREATE INDEX IF NOT EXISTS idx_mapping_history_time ON mapping_history(generated_at);

-- 2. 对照配置表
-- 存储仓位映射规则配置
CREATE TABLE IF NOT EXISTS mapping_config (
    id SERIAL PRIMARY KEY,
    config_key TEXT UNIQUE NOT NULL,
    config_value JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 插入默认配置
INSERT INTO mapping_config (config_key, config_value) VALUES (
    'warehouse_rules',
    '{
        "rules": [
            {
                "name": "默认规则",
                "range_start": 1,
                "range_end": 10,
                "sample_value": 10
            }
        ]
    }'::jsonb
) ON CONFLICT (config_key) DO NOTHING;
