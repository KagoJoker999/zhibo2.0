-- 1. 为新品数据表增加序号列
ALTER TABLE new_product_data ADD COLUMN IF NOT EXISTS sample_number TEXT;

-- 2. 在配置表中初始化新品序号规则（如果不存在）
-- 规则说明：
-- 区间1: 1-40, 前缀A, 起始1, 步长2 (A01, A03...)
-- 区间2: 41+, 前缀A, 起始41, 步长1 (A41, A42...)
INSERT INTO ranking_config (key, value)
VALUES ('new_product_number_rules', 
  '[
    {"range_start": 1, "range_end": 40, "prefix": "A", "start_num": 1, "step": 2},
    {"range_start": 41, "range_end": 999999, "prefix": "A", "start_num": 41, "step": 1}
   ]'::jsonb)
ON CONFLICT (key) DO NOTHING;
