# 插件功能描述

## 一句话简介

Everyday 帮你在 Obsidian 里用一句话和一个心情记录每天，并用月度看板回顾这些轻量日记。

## 短描述

一个面向低负担日记习惯的 Obsidian 插件。它提供快速记录弹窗、心情选择、昨天补记、月度列表/日历看板，并把所有内容保存为普通 Markdown 文件。

## 完整描述

Everyday 是一个 Obsidian 一句话日记插件，核心目标是降低每天记录的阻力。你可以通过命令面板或侧边栏图标快速打开记录弹窗，为某一天写下一句话并选择一个心情。插件会把记录保存到 vault 中的 Markdown 日记文件，使用 YAML frontmatter 存储心情和摘要，方便后续搜索、同步、备份和手动编辑。

插件还提供月度记忆看板，支持列表和日历两种视图。已记录的日期会展示心情 emoji 和一句话摘要，未记录的日期可以直接点击补记。你也可以使用专门的“补记昨天”命令快速补上漏掉的一天。

Everyday 支持自定义日记目录、年份子目录、文件名日期格式、每周开始日、默认视图模式、默认心情和日记模板。它也可以沿用 Obsidian 核心日记插件的目录和日期格式，适合已经在使用 Daily Notes 的用户。

## 推荐标签

- obsidian
- diary
- daily-notes
- journal
- mood-tracker
- markdown

## GitHub Release 标题

Everyday v0.1.0 - First release

## GitHub Release 正文

Everyday 的第一个公开版本。

本版本提供快速一句话日记记录、心情选择、昨天补记、月度列表/日历看板，以及普通 Markdown 存储。日记信息会写入 YAML frontmatter，已有 Markdown 文件不会被整篇覆盖。

上传文件请使用：

- `manifest.json`
- `main.js`
- `styles.css`
- `Everyday-v0.1.0.zip`

安装时将前三个文件放入 vault 的 `.obsidian/plugins/Everyday/` 目录后，在 Obsidian 中启用插件即可。
