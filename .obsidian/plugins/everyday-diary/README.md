# Everyday Diary

一个最小 Obsidian 日记插件开发环境。

## 功能

- 在命令面板注册 `写入随机日记`。
- 自动创建 `日记/YYYY-MM-DD.md`。
- 如果当天文件已存在，会生成 `YYYY-MM-DD-2.md`、`YYYY-MM-DD-3.md` 等后缀文件。
- 生成带有 frontmatter、提示语和基础条目的日记模板。

## 开发

```bash
npm install
npm run dev
```

构建发布版本：

```bash
npm run build
```

Obsidian 中打开 `设置 -> 第三方插件`，关闭安全模式后启用 `Everyday Diary`。
