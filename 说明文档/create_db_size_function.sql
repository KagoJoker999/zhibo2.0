-- ================================================
-- 创建获取数据库大小的 RPC 函数
-- 表名：（通过 RPC 函数调用）
-- 请在 Supabase SQL Editor 中执行此脚本
-- ================================================

-- 删除旧函数（如果存在）
DROP FUNCTION IF EXISTS get_database_size();

-- 创建获取数据库大小的函数
CREATE OR REPLACE FUNCTION get_database_size()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    total_size bigint;
    size_mb numeric;
BEGIN
    -- 使用 pg_database_size 获取整个数据库大小（与 Supabase 控制台一致）
    SELECT pg_database_size(current_database())
    INTO total_size;
    
    -- 转换为 MB
    size_mb := ROUND(total_size / 1024.0 / 1024.0, 2);
    
    RETURN json_build_object(
        'size_bytes', total_size,
        'size_mb', size_mb
    );
END;
$$;

-- 授权匿名用户调用此函数
GRANT EXECUTE ON FUNCTION get_database_size() TO anon;
GRANT EXECUTE ON FUNCTION get_database_size() TO authenticated;
