# 插件功能描述

## 一句话简介

Everyday 帮你在 Obsidian 里用一句话和一个心情记录每天，并用月度看板和 Memory Board 回顾这些轻量日记。

## 短描述

一个面向低负担日记习惯的 Obsidian 插件。它提供快速记录弹窗、心情选择、月度列表/日历看板、连续多月 Memory Board，并把所有内容保存为普通 Markdown 文件。

## 完整描述

Everyday 是一个 Obsidian 一句话日记插件，核心目标是降低每天记录的阻力。你可以通过命令面板或侧边栏图标快速打开记录弹窗，为某一天写下一句话并选择一个心情。插件会把记录保存到 vault 中的 Markdown 日记文件，使用 YAML frontmatter 存储心情和摘要，方便后续搜索、同步、备份和手动编辑。

插件提供月度记忆看板，支持列表和日历两种视图。已记录的日期会展示心情 emoji 和一句话摘要，未记录的日期可以直接补记。Memory Board / 月度回顾可在一个界面中查看连续 3 或 6 个月的每日一句和心情，更适合回顾一段时间的生活轨迹。

Everyday 支持自定义日记目录、年份子目录、文件名日期格式、每周开始日、默认视图模式、Memory Board 排版模式、默认心情和日记模板。设置页支持路径候选：日记目录可以从 vault 内文件夹点选，模板文件可以从 Markdown 文件中点选。

v0.2.1 重点改善侧边栏月视图体验：“今天”按钮会跳转并滚动定位到今天，打开侧边栏时也会自动把今天放到视图中间附近；窄侧边栏下按钮换行时，月份切换区域会随操作按钮保持一致的右对齐。

## 推荐标签

- obsidian
- diary
- daily-notes
- journal
- mood-tracker
- markdown

## GitHub Release 标题

Everyday v0.2.1 - Sidebar polish

## GitHub Release 正文

Everyday v0.2.1 是一个小修版本，主要改善侧边栏月视图体验。

本版本增强“今天”按钮：点击后会跳到今天所在月份，并自动把今天滚动到视图中间附近；打开侧边栏月视图时也会自动定位今天。窄侧边栏下，当“日历 / 今天 / 快速记录”按钮换行时，月份切换区域会同步右对齐，让头部两行保持一致。

上传文件请使用：

- `manifest.json`
- `main.js`
- `styles.css`
- `Everyday-v0.2.1.zip`

安装时将前三个文件放入 vault 的 `.obsidian/plugins/Everyday/` 目录后，在 Obsidian 中启用插件即可。
