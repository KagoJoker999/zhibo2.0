-- 1. 为新品数据表增加序号列
ALTER TABLE new_product_data ADD COLUMN IF NOT EXISTS sample_number TEXT;

-- 2. 在配置表中初始化新品序号规则（如果不存在）
-- 规则说明：
-- 区间1: 第1-20个商品 (对应序号 A01-A39), 步长2
-- 区间2: 第21+个商品 (对应序号 A41+), 步长1
INSERT INTO ranking_config (key, value)
VALUES ('new_product_number_rules', 
  '[
    {"range_start": 1, "range_end": 20, "prefix": "A", "start_num": 1, "step": 2},
    {"range_start": 21, "range_end": 999999, "prefix": "A", "start_num": 41, "step": 1}
   ]'::jsonb)
ON CONFLICT (key) DO NOTHING;
