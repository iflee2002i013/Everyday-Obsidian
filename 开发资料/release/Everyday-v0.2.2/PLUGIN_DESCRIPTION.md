# 插件功能描述

## 一句话简介

Everyday 帮你在 Obsidian 里用一句话和一个心情记录每天，并用月度列表和 Memory Board 回顾这些轻量日记。

## 短描述

一个面向低负担日记习惯的 Obsidian 插件。它提供快速记录弹窗、心情选择、月度列表看板、连续多月 Memory Board，并把所有内容保存为普通 Markdown 文件。

## 完整描述

Everyday 是一个 Obsidian 一句话日记插件，核心目标是降低每天记录的阻力。你可以通过命令面板或侧边栏图标快速打开记录弹窗，为某一天写下一句话并选择一个心情。插件会把记录保存到 vault 中的 Markdown 日记文件，使用 YAML frontmatter 存储心情和摘要，方便后续搜索、同步、备份和手动编辑。

插件提供侧边栏月度记忆看板，以列表方式展示当月每天的记录状态。已记录的日期会展示心情 emoji 和一句话摘要，未记录的日期可以直接补记；点击已有日期可以打开对应日记。侧边栏顶部的 `Memory Board` 按钮可以直接打开连续 3 或 6 个月的每日一句和心情回顾视图，更适合查看一段时间的生活轨迹。

Everyday 支持自定义日记目录、年份子目录、文件名日期格式、Memory Board 排版模式、默认心情和日记模板。设置页支持路径候选：日记目录可以从 vault 内文件夹点选，模板文件可以从 Markdown 文件中点选。

v0.2.2 将侧边栏月视图中原来的“日历”按钮改为 `Memory Board` 入口，并移除了旧日历模式相关设置与样式。月视图保持列表展示，Memory Board 负责多月回顾。

## 推荐标签

- obsidian
- diary
- daily-notes
- journal
- mood-tracker
- markdown

## GitHub Release 标题

Everyday v0.2.2 - Memory Board shortcut

## GitHub Release 正文

Everyday v0.2.2 是一个小修版本，主要调整侧边栏月视图的入口设计。

本版本将侧边栏顶部原来的“日历”按钮替换为 `Memory Board` 按钮。点击后会直接打开连续多月回顾视图。旧日历模式、月视图默认模式设置、每周开始日设置以及相关样式已经移除，月视图固定保留列表展示。

上传文件请使用：

- `manifest.json`
- `main.js`
- `styles.css`
- `Everyday-v0.2.2.zip`

安装时将前三个文件放入 vault 的 `.obsidian/plugins/Everyday/` 目录后，在 Obsidian 中启用插件即可。
