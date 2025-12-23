-- ========================================
-- 为 ranking_results 表添加图片和编码字段
-- 在 Supabase SQL Editor 中执行
-- ========================================

-- 添加 image_url 字段（商品图片URL）
ALTER TABLE ranking_results 
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- 添加 product_code 字段（商品编码）
ALTER TABLE ranking_results 
ADD COLUMN IF NOT EXISTS product_code TEXT;

-- 验证字段是否添加成功
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'ranking_results' 
ORDER BY ordinal_position;
