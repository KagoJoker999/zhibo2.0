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

-- 添加 warehouse 字段（仓位）
ALTER TABLE ranking_results 
ADD COLUMN IF NOT EXISTS warehouse TEXT;

-- 添加 total_score 字段（产品总分）
ALTER TABLE ranking_results 
ADD COLUMN IF NOT EXISTS total_score NUMERIC DEFAULT 0;

-- 添加 rating_rank 字段（评分排名）
ALTER TABLE ranking_results 
ADD COLUMN IF NOT EXISTS rating_rank INTEGER;

-- 添加 is_wearable 字段（是否可佩戴）
ALTER TABLE ranking_results 
ADD COLUMN IF NOT EXISTS is_wearable BOOLEAN;

-- 验证字段是否添加成功
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'ranking_results' 
ORDER BY ordinal_position;
