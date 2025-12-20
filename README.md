# 直播辅助工具

直播数据管理与排品辅助工具，支持数据上传、排品管理、新品处理等功能。

## 技术栈

- **前端**: HTML5 + CSS3 + JavaScript (原生)
- **后端**: Cloudflare Pages Functions
- **数据库**: Supabase

## 功能模块

- 📤 **上传功能**: 排名数据、商品ID、库存数据上传
- 📋 **排品功能**: 数据上传、排品设置、对照表生成
- 🆕 **新品处理**: 新品数据上传、处理、下载
- 🎟️ **发券品处理**: 发券品数据管理
- 🔗 **排品对照功能**: 对照关系管理

## 本地开发

### 方法一：直接打开

直接在浏览器中打开 `index.html` 文件即可预览。

### 方法二：使用本地服务器

```bash
# 使用 Python
python -m http.server 8080

# 或使用 npx
npx serve .
```

然后访问 http://localhost:8080

## 部署

### Cloudflare Pages 部署

1. 将代码推送到 GitHub
2. 在 Cloudflare Pages 中连接 GitHub 仓库
3. 配置构建设置：
   - 构建命令: (留空)
   - 输出目录: (留空或 `/`)

### Supabase 配置

1. 在 [Supabase](https://supabase.com) 创建项目
2. 复制项目 URL 和 anon key
3. 编辑 `js/supabase-client.js` 中的配置

## 目录结构

```
直播辅助工具/
├── index.html          # 主页面
├── css/
│   └── style.css       # 样式文件
├── js/
│   ├── main.js         # 主脚本
│   └── supabase-client.js  # 数据库客户端
├── .gitignore
└── README.md
```

## License

MIT
