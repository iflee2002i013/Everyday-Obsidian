# Everyday v0.1.0

Everyday 是一个 Obsidian 一句话日记插件，用快速弹窗记录每天的一句话和心情，并通过月度看板回顾每一天。

## 适合谁

- 想降低日记记录成本，只保留每天一句话的人。
- 想把情绪和日记一起保存到普通 Markdown 文件中的 Obsidian 用户。
- 想按月快速回顾某段时间状态、关键词和空白日期的人。

## 核心功能

- 快速记录：通过命令面板或月度看板打开弹窗，填写日期、一句话和心情。
- 昨天补记：提供 `Capture yesterday's diary` 命令，减少漏记后的操作成本。
- 月度记忆看板：按月查看已记录和未记录日期，支持列表模式与日历模式。
- 普通 Markdown 存储：日记保存为 vault 中的 `.md` 文件，核心信息写入 YAML frontmatter。
- 非破坏式更新：已有日记不会被整篇覆盖，只更新 Everyday 相关 frontmatter 字段。
- 路径和命名设置：支持自定义日记目录、年份子目录、Moment.js 日期格式，也可沿用 Obsidian 核心日记插件格式。
- 模板支持：可指定 vault 内 Markdown 模板，新建日记时复用模板正文。
- 心情设置：内置开心、平静、普通、低落、崩溃、思考等心情选项。

## 安装方式

1. 下载本 release 中的 `Everyday-v0.1.0.zip`。
2. 解压后将 `manifest.json`、`main.js`、`styles.css` 放入 vault 的 `.obsidian/plugins/Everyday/` 目录。
3. 在 Obsidian 设置中关闭安全模式或启用社区插件，然后启用 `Everyday`。

## 上传到 GitHub Release 的文件

- `manifest.json`
- `main.js`
- `styles.css`
- `Everyday-v0.1.0.zip`

## 兼容性

- Obsidian 最低版本：1.5.0
- 插件版本：0.1.0
- 桌面端和移动端均可用。

## 注意

本 release 包不包含 `data.json`，避免把本地设置或个人 vault 配置打包给其他用户。
