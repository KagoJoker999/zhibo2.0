const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ugadhdhwixrejzfcwugj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVnYWRoZGh3aXhyZWp6ZmN3dWdqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYyMzU3NTgsImV4cCI6MjA4MTgxMTc1OH0.XQp5pvoM-nSGfLZB9ZGfxJCkU3GbeiWrBohA_XchS54';

const supabase = createClient(supabaseUrl, supabaseKey);

async function searchMermaid() {
    console.log('=== 搜索包含"人鱼"的产品 ===\n');
    
    const { data, error } = await supabase
        .from('ranking_results')
        .select('product_name, total_score, rating_rank, ranking_result')
        .ilike('product_name', '%人鱼%')
        .order('total_score', { ascending: false });
    
    if (error) {
        console.error('查询失败:', error);
    } else {
        console.log(`找到 ${data?.length || 0} 条包含"人鱼"的产品\n`);
        if (data && data.length > 0) {
            data.forEach((item, idx) => {
                console.log(`${idx + 1}. ${item.product_name}`);
                console.log(`   评分: ${item.total_score}, 排名: ${item.rating_rank}, 分类: ${item.ranking_result}\n`);
            });
        } else {
            console.log('未找到包含"人鱼"的产品');
            
            // 尝试查询所有产品，看看有哪些
            console.log('\n=== 查询所有产品总数 ===');
            const { data: allProducts, error: allError } = await supabase
                .from('ranking_results')
                .select('product_name', { count: 'exact' });
            
            if (!allError) {
                console.log(`数据库中共有 ${allProducts?.length || 0} 个产品`);
                
                // 显示前20个产品
                console.log('\n=== 前20个产品 ===');
                const { data: firstProducts } = await supabase
                    .from('ranking_results')
                    .select('product_name, total_score, rating_rank')
                    .order('total_score', { ascending: false })
                    .limit(20);
                
                firstProducts.forEach((item, idx) => {
                    console.log(`${idx + 1}. ${item.product_name} - 评分: ${item.total_score}, 排名: ${item.rating_rank}`);
                });
            }
        }
    }
}

searchMermaid().then(() => process.exit(0)).catch(err => {
    console.error('错误:', err);
    process.exit(1);
});
