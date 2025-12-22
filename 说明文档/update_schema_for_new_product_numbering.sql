-- 1. 为新品数据表增加序号列
ALTER TABLE new_product_data ADD COLUMN IF NOT EXISTS sample_number TEXT;

-- 2. 在配置表中初始化新品序号规则（对应 Item Index 1-20 -> A01-A39）
-- 注意：字段名为 config_key 和 config_value
INSERT INTO ranking_config (config_key, config_value)
VALUES ('new_product_number_rules', 
  '[
    {"range_start": 1, "range_end": 20, "prefix": "A", "start_num": 1, "step": 2},
    {"range_start": 21, "range_end": 999999, "prefix": "A", "start_num": 41, "step": 1}
   ]'::jsonb)
ON CONFLICT (config_key) DO NOTHING;
