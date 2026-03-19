const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ugadhdhwixrejzfcwugj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVnYWRoZGh3aXhyZWp6ZmN3dWdqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYyMzU3NTgsImV4cCI6MjA4MTgxMTc1OH0.XQp5pvoM-nSGfLZB9ZGfxJCkU3GbeiWrBohA_XchS54';

const supabase = createClient(supabaseUrl, supabaseKey);

async function queryProduct() {
    const productName = '「人鱼女神」韩国26新年百搭大抓夹鲨鱼夹后盘发夹';
    
    console.log('=== 查询产品信息 ===');
    console.log('产品名称:', productName);
    console.log('');
    
    // 查询ranking_results表
    const { data: rankingData, error: rankingError } = await supabase
        .from('ranking_results')
        .select('*')
        .ilike('product_name', `%${productName}%`);
    
    if (rankingError) {
        console.error('查询ranking_results失败:', rankingError);
    } else {
        console.log('=== ranking_results 表中的数据 ===');
        if (rankingData && rankingData.length > 0) {
            rankingData.forEach((item, idx) => {
                console.log(`\n记录 ${idx + 1}:`);
                console.log(JSON.stringify(item, null, 2));
            });
        } else {
            console.log('未找到匹配的记录');
        }
    }
    
    // 查询raw_products表
    const { data: rawData, error: rawError } = await supabase
        .from('raw_products')
        .select('*')
        .ilike('product_name', `%${productName}%`);
    
    if (rawError) {
        console.error('查询raw_products失败:', rawError);
    } else {
        console.log('\n=== raw_products 表中的数据 ===');
        if (rawData && rawData.length > 0) {
            rawData.forEach((item, idx) => {
                console.log(`\n记录 ${idx + 1}:`);
                console.log(JSON.stringify(item, null, 2));
            });
        } else {
            console.log('未找到匹配的记录');
        }
    }
    
    // 查询评分公式配置
    const { data: configData, error: configError } = await supabase
        .from('ranking_config')
        .select('*')
        .eq('config_key', 'scoring_formulas')
        .single();
    
    if (configError) {
        console.error('查询评分公式失败:', configError);
    } else {
        console.log('\n=== 当前评分公式配置 ===');
        if (configData && configData.config_value) {
            const config = configData.config_value;
            console.log('当前公式名称:', config['当前公式']);
            if (config['公式列表'] && config['公式列表'][config['当前公式']]) {
                console.log('公式详情:', JSON.stringify(config['公式列表'][config['当前公式']], null, 2));
            }
        }
    }
}

queryProduct().then(() => process.exit(0)).catch(err => {
    console.error('错误:', err);
    process.exit(1);
});
