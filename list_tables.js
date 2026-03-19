const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ugadhdhwixrejzfcwugj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVnYWRoZGh3aXhyZWp6ZmN3dWdqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYyMzU3NTgsImV4cCI6MjA4MTgxMTc1OH0.XQp5pvoM-nSGfLZB9ZGfxJCkU3GbeiWrBohA_XchS54';

const supabase = createClient(supabaseUrl, supabaseKey);

async function listTables() {
    // 尝试查询information_schema
    const { data, error } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public');
    
    if (error) {
        console.log('无法通过information_schema查询，尝试其他方式...');
        
        // 尝试查询一些常见的表
        const tables = ['ranking_results', 'products', 'product_data', 'presale_products', 'presale_product_ids'];
        
        for (const table of tables) {
            const { data, error } = await supabase
                .from(table)
                .select('*')
                .limit(1);
            
            if (!error) {
                console.log(`✓ 表存在: ${table}`);
            } else {
                console.log(`✗ 表不存在: ${table}`);
            }
        }
    } else {
        console.log('=== 数据库中的表 ===');
        data.forEach(row => console.log(row.table_name));
    }
}

listTables().then(() => process.exit(0)).catch(err => {
    console.error('错误:', err);
    process.exit(1);
});
