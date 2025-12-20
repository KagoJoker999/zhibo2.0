/**
 * Supabase 客户端配置
 * ========================================
 * 此文件仅提供封装的数据库操作函数
 * Supabase 客户端在 main.js 中初始化
 */

// ========================================
// 数据库操作封装
// ========================================

/**
 * 获取 Supabase 客户端
 */
function getClient() {
    if (!window.supabaseClient) {
        throw new Error('Supabase 未初始化');
    }
    return window.supabaseClient;
}

/**
 * 通用查询函数
 */
async function queryData(table, options = {}) {
    const client = getClient();
    let query = client.from(table).select(options.select || '*');

    if (options.filters) {
        for (const [column, value] of Object.entries(options.filters)) {
            query = query.eq(column, value);
        }
    }
    if (options.orderBy) {
        query = query.order(options.orderBy.column, {
            ascending: options.orderBy.ascending ?? true
        });
    }
    if (options.limit) query = query.limit(options.limit);
    if (options.offset) query = query.range(options.offset, options.offset + (options.limit || 10) - 1);

    const { data, error } = await query;
    if (error) throw error;
    return data;
}

/**
 * 插入数据
 */
async function insertData(table, data) {
    const client = getClient();
    const { data: result, error } = await client.from(table).insert(data).select();
    if (error) throw error;
    return result;
}

/**
 * 更新数据
 */
async function updateData(table, data, filters) {
    const client = getClient();
    let query = client.from(table).update(data);
    for (const [column, value] of Object.entries(filters)) {
        query = query.eq(column, value);
    }
    const { data: result, error } = await query.select();
    if (error) throw error;
    return result;
}

/**
 * 删除数据
 */
async function deleteData(table, filters) {
    const client = getClient();
    let query = client.from(table).delete();
    for (const [column, value] of Object.entries(filters)) {
        query = query.eq(column, value);
    }
    const { error } = await query;
    if (error) throw error;
    return true;
}

/**
 * 清空表
 */
async function truncateTable(table) {
    const client = getClient();
    const { error } = await client.from(table).delete().neq('id', 0);
    if (error) throw error;
    return true;
}

/**
 * 批量插入
 */
async function batchInsert(table, dataArray, fullReplace = false) {
    if (fullReplace) await truncateTable(table);
    const client = getClient();
    const { data, error } = await client.from(table).insert(dataArray).select();
    if (error) throw error;
    return data;
}

// ========================================
// 导出
// ========================================
window.SupabaseClient = {
    query: queryData,
    insert: insertData,
    update: updateData,
    delete: deleteData,
    truncate: truncateTable,
    batchInsert: batchInsert,
    get client() { return window.supabaseClient; }
};
