const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ugadhdhwixrejzfcwugj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVnYWRoZGh3aXhyZWp6ZmN3dWdqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYyMzU3NTgsImV4cCI6MjA4MTgxMTc1OH0.XQp5pvoM-nSGfLZB9ZGfxJCkU3GbeiWrBohA_XchS54';

const supabase = createClient(supabaseUrl, supabaseKey);

async function findProduct() {
    const productName = '「人鱼女神」韩国26新年百搭大抓夹鲨鱼夹后盘发夹';
    
    console.log('=== 查询ranking_results表 ===\n');
    
    // 先查询所有数据看看结构
    const { data: allData, error: allError } = await supabase
        .from('ranking_results')
        .select('*')
        .limit(5);
    
    if (allError) {
        console.error('查询失败:', allError);
        process.exit(1);
    }
    
    console.log('表中前5条记录的结构:');
    if (allData && allData.length > 0) {
        console.log(JSON.stringify(allData[0], null, 2));
    }
    
    // 现在搜索产品
    console.log('\n=== 搜索产品 ===');
    const { data: searchData, error: searchError } = await supabase
        .from('ranking_results')
        .select('*')
        .or(`product_name.ilike.%${productName}%,product_name.ilike.%人鱼女神%,product_name.ilike.%鲨鱼夹%`);
    
    if (searchError) {
        console.error('搜索失败:', searchError);
    } else {
        console.log(`找到 ${searchData?.length || 0} 条匹配记录\n`);
        if (searchData && searchData.length > 0) {
            searchData.forEach((item, idx) => {
                console.log(`\n=== 记录 ${idx + 1} ===`);
                console.log(JSON.stringify(item, null, 2));
            });
        }
    }
    
    // 如果没找到，尝试查询所有包含"发夹"的产品
    if (!searchData || searchData.length === 0) {
        console.log('\n=== 尝试查询所有包含"发夹"的产品 ===');
        const { data: hairClipData, error: hairClipError } = await supabase
            .from('ranking_results')
            .select('product_name, score, rank')
            .ilike('product_name', '%发夹%')
            .order('score', { ascending: false });
        
        if (hairClipError) {
            console.error('查询失败:', hairClipError);
        } else {
            console.log(`找到 ${hairClipData?.length || 0} 条包含"发夹"的产品\n`);
            if (hairClipData && hairClipData.length > 0) {
                hairClipData.slice(0, 20).forEach((item, idx) => {
                    console.log(`${idx + 1}. ${item.product_name} - 评分: ${item.score}, 排名: ${item.rank}`);
                });
            }
        }
    }
}

findProduct().then(() => process.exit(0)).catch(err => {
    console.error('错误:', err);
    process.exit(1);
});
