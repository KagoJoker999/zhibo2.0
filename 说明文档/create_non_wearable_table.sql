-- 创建排除不可佩戴品表
create table if not exists excluded_non_wearables (
  id uuid default gen_random_uuid() primary key,
  product_name text not null,
  created_at timestamptz default now()
);

-- 开启 RLS
alter table excluded_non_wearables enable row level security;

-- 创建策略允许所有操作 (根据项目惯例，或者仅允许 authenticated)
-- 假设这是一个单用户工具或允许任何访问
create policy "Enable all access for all users" on excluded_non_wearables
for all using (true) with check (true);
