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
    console.log(`📖 [DB查询] 表: ${table}`, options.filters ? `筛选: ${JSON.stringify(options.filters)}` : '');
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
    if (error) {
        console.error(`❌ [DB查询失败] 表: ${table}`, error.message);
        throw error;
    }
    console.log(`✅ [DB查询完成] 表: ${table}, 返回 ${data?.length || 0} 条记录`);
    return data;
}

/**
 * 插入数据
 */
async function insertData(table, data) {
    const count = Array.isArray(data) ? data.length : 1;
    console.log(`✏️ [DB插入] 表: ${table}, 数据量: ${count} 条`);
    const client = getClient();
    const { data: result, error } = await client.from(table).insert(data).select();
    if (error) {
        console.error(`❌ [DB插入失败] 表: ${table}`, error.message);
        throw error;
    }
    console.log(`✅ [DB插入完成] 表: ${table}, 成功 ${result?.length || 0} 条`);
    return result;
}

/**
 * 更新数据
 */
async function updateData(table, data, filters) {
    console.log(`📝 [DB更新] 表: ${table}, 筛选: ${JSON.stringify(filters)}`);
    const client = getClient();
    let query = client.from(table).update(data);
    for (const [column, value] of Object.entries(filters)) {
        query = query.eq(column, value);
    }
    const { data: result, error } = await query.select();
    if (error) {
        console.error(`❌ [DB更新失败] 表: ${table}`, error.message);
        throw error;
    }
    console.log(`✅ [DB更新完成] 表: ${table}, 影响 ${result?.length || 0} 条`);
    return result;
}

/**
 * 删除数据
 */
async function deleteData(table, filters) {
    console.log(`🗑️ [DB删除] 表: ${table}, 筛选: ${JSON.stringify(filters)}`);
    const client = getClient();
    let query = client.from(table).delete();
    for (const [column, value] of Object.entries(filters)) {
        query = query.eq(column, value);
    }
    const { error } = await query;
    if (error) {
        console.error(`❌ [DB删除失败] 表: ${table}`, error.message);
        throw error;
    }
    console.log(`✅ [DB删除完成] 表: ${table}`);
    return true;
}

/**
 * 清空表
 */
async function truncateTable(table) {
    console.log(`🧹 [DB清空] 表: ${table}`);
    const client = getClient();
    const { error } = await client.from(table).delete().neq('id', 0);
    if (error) {
        console.error(`❌ [DB清空失败] 表: ${table}`, error.message);
        throw error;
    }
    console.log(`✅ [DB清空完成] 表: ${table}`);
    return true;
}

/**
 * 批量插入
 */
async function batchInsert(table, dataArray, fullReplace = false) {
    console.log(`📦 [DB批量插入] 表: ${table}, 数据量: ${dataArray?.length || 0} 条, 全量替换: ${fullReplace}`);
    if (fullReplace) await truncateTable(table);
    const client = getClient();
    const { data, error } = await client.from(table).insert(dataArray).select();
    if (error) {
        console.error(`❌ [DB批量插入失败] 表: ${table}`, error.message);
        throw error;
    }
    console.log(`✅ [DB批量插入完成] 表: ${table}, 成功 ${data?.length || 0} 条`);
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
