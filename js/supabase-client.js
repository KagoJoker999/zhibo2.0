/**
 * Supabase 客户端配置
 * ========================================
 * 
 * 使用说明：
 * 1. 在 Supabase 控制台创建项目
 * 2. 获取项目 URL 和 anon key
 * 3. 替换下方的配置值
 * 4. 启用 RLS (Row Level Security) 保护数据
 */

// ========================================
// Supabase 配置（请替换为你的实际值）
// ========================================
const SUPABASE_CONFIG = {
    url: 'YOUR_SUPABASE_URL',           // 例如: https://xxxxx.supabase.co
    anonKey: 'YOUR_SUPABASE_ANON_KEY'   // 在 Settings > API 中获取
};

// ========================================
// Supabase 客户端初始化
// ========================================
let supabase = null;

/**
 * 初始化 Supabase 客户端
 * 需要先在 index.html 中引入 Supabase JS SDK:
 * <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
 */
function initSupabase() {
    if (SUPABASE_CONFIG.url === 'YOUR_SUPABASE_URL') {
        console.warn('⚠️ Supabase 尚未配置，请在 supabase-client.js 中设置 URL 和 Key');
        return null;
    }

    if (typeof window.supabase !== 'undefined') {
        // 使用 CDN 引入的 supabase
        supabase = window.supabase.createClient(
            SUPABASE_CONFIG.url,
            SUPABASE_CONFIG.anonKey
        );
        console.log('✅ Supabase 客户端已初始化');
        return supabase;
    }

    console.error('❌ Supabase SDK 未加载，请在 HTML 中引入');
    return null;
}

// ========================================
// 数据库操作封装
// ========================================

/**
 * 通用查询函数
 * @param {string} table - 表名
 * @param {Object} options - 查询选项
 */
async function queryData(table, options = {}) {
    if (!supabase) {
        throw new Error('Supabase 未初始化');
    }

    let query = supabase.from(table).select(options.select || '*');

    // 添加过滤条件
    if (options.filters) {
        for (const [column, value] of Object.entries(options.filters)) {
            query = query.eq(column, value);
        }
    }

    // 排序
    if (options.orderBy) {
        query = query.order(options.orderBy.column, {
            ascending: options.orderBy.ascending ?? true
        });
    }

    // 分页
    if (options.limit) {
        query = query.limit(options.limit);
    }
    if (options.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
    }

    const { data, error } = await query;

    if (error) {
        console.error(`查询 ${table} 失败:`, error);
        throw error;
    }

    return data;
}

/**
 * 插入数据
 * @param {string} table - 表名
 * @param {Object|Array} data - 要插入的数据
 */
async function insertData(table, data) {
    if (!supabase) {
        throw new Error('Supabase 未初始化');
    }

    const { data: result, error } = await supabase
        .from(table)
        .insert(data)
        .select();

    if (error) {
        console.error(`插入 ${table} 失败:`, error);
        throw error;
    }

    return result;
}

/**
 * 更新数据
 * @param {string} table - 表名
 * @param {Object} data - 要更新的数据
 * @param {Object} filters - 过滤条件
 */
async function updateData(table, data, filters) {
    if (!supabase) {
        throw new Error('Supabase 未初始化');
    }

    let query = supabase.from(table).update(data);

    for (const [column, value] of Object.entries(filters)) {
        query = query.eq(column, value);
    }

    const { data: result, error } = await query.select();

    if (error) {
        console.error(`更新 ${table} 失败:`, error);
        throw error;
    }

    return result;
}

/**
 * 删除数据
 * @param {string} table - 表名
 * @param {Object} filters - 过滤条件
 */
async function deleteData(table, filters) {
    if (!supabase) {
        throw new Error('Supabase 未初始化');
    }

    let query = supabase.from(table).delete();

    for (const [column, value] of Object.entries(filters)) {
        query = query.eq(column, value);
    }

    const { error } = await query;

    if (error) {
        console.error(`删除 ${table} 失败:`, error);
        throw error;
    }

    return true;
}

/**
 * 清空表数据
 * @param {string} table - 表名
 */
async function truncateTable(table) {
    if (!supabase) {
        throw new Error('Supabase 未初始化');
    }

    // Supabase 不支持直接 TRUNCATE，使用 delete 配合 neq
    const { error } = await supabase
        .from(table)
        .delete()
        .neq('id', 0); // 匹配所有记录

    if (error) {
        console.error(`清空 ${table} 失败:`, error);
        throw error;
    }

    return true;
}

/**
 * 批量插入数据（用于上传功能）
 * @param {string} table - 表名
 * @param {Array} dataArray - 数据数组
 * @param {boolean} fullReplace - 是否全量替换
 */
async function batchInsert(table, dataArray, fullReplace = false) {
    if (!supabase) {
        throw new Error('Supabase 未初始化');
    }

    // 全量替换时先清空
    if (fullReplace) {
        await truncateTable(table);
    }

    // 批量插入（Supabase 支持单次插入多条）
    const { data, error } = await supabase
        .from(table)
        .insert(dataArray)
        .select();

    if (error) {
        console.error(`批量插入 ${table} 失败:`, error);
        throw error;
    }

    return data;
}

// ========================================
// 导出供其他模块使用
// ========================================
window.SupabaseClient = {
    init: initSupabase,
    query: queryData,
    insert: insertData,
    update: updateData,
    delete: deleteData,
    truncate: truncateTable,
    batchInsert: batchInsert,

    // 直接访问 supabase 实例（高级用法）
    get client() {
        return supabase;
    }
};
