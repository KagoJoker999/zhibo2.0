const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ugadhdhwixrejzfcwugj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVnYWRoZGh3aXhyZWp6ZmN3dWdqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYyMzU3NTgsImV4cCI6MjA4MTgxMTc1OH0.XQp5pvoM-nSGfLZB9ZGfxJCkU3GbeiWrBohA_XchS54';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkConfig() {
    console.log('=== 查询评分公式配置 ===\n');
    
    const { data, error } = await supabase
        .from('ranking_config')
        .select('*');
    
    if (error) {
        console.error('查询失败:', error);
    } else {
        console.log(`找到 ${data?.length || 0} 条配置\n`);
        data.forEach((item, idx) => {
            console.log(`\n=== 配置 ${idx + 1}: ${item.config_key} ===`);
            if (typeof item.config_value === 'object') {
                console.log(JSON.stringify(item.config_value, null, 2));
            } else {
                console.log(item.config_value);
            }
        });
    }
}

checkConfig().then(() => process.exit(0)).catch(err => {
    console.error('错误:', err);
    process.exit(1);
});
