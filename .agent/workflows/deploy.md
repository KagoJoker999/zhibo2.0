---
description: 部署最新代码到 GitHub
---

# 部署流程

将所有修改提交并推送到 GitHub 远程仓库（origin main）。

// turbo-all

1. 查看当前修改状态：
```bash
cd /Users/kago/Downloads/Demo/直播辅助工具2.0 && git status
```

2. 构建生产版本：
```bash
cd /Users/kago/Downloads/Demo/直播辅助工具2.0 && npm run build
```

3. 添加所有修改到暂存区：
```bash
cd /Users/kago/Downloads/Demo/直播辅助工具2.0 && git add -A
```

4. 提交修改（根据实际修改内容填写 commit message）：
```bash
cd /Users/kago/Downloads/Demo/直播辅助工具2.0 && git commit -m "<根据本次修改内容生成简洁的中文描述>"
```

5. 推送到远程仓库：
```bash
cd /Users/kago/Downloads/Demo/直播辅助工具2.0 && git push origin main
```
