const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ugadhdhwixrejzfcwugj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVnYWRoZGh3aXhyZWp6ZmN3dWdqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYyMzU3NTgsImV4cCI6MjA4MTgxMTc1OH0.XQp5pvoM-nSGfLZB9ZGfxJCkU3GbeiWrBohA_XchS54';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkFormulas() {
    const { data, error } = await supabase
        .from('ranking_config')
        .select('*')
        .eq('config_key', 'scoring_formulas')
        .single();
    
    if (error) {
        console.error('查询失败:', error);
        return;
    }
    
    console.log('=== 数据库中的评分公式配置 ===');
    console.log(JSON.stringify(data, null, 2));
    
    if (data && data.config_value) {
        const config = data.config_value;
        console.log('\n=== 当前公式 ===');
        console.log('当前公式名称:', config['当前公式']);
        console.log('是否加密:', config.encrypted);
        
        if (!config.encrypted && config['公式列表']) {
            console.log('\n=== 公式列表 ===');
            console.log('可用公式:', Object.keys(config['公式列表']));
            
            const currentFormula = config['公式列表'][config['当前公式']];
            if (currentFormula) {
                console.log('\n=== 当前使用的公式详情 ===');
                console.log(JSON.stringify(currentFormula, null, 2));
            }
        }
    }
}

checkFormulas().then(() => process.exit(0)).catch(err => {
    console.error(err);
    process.exit(1);
});
