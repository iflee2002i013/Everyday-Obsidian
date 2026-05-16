# Everyday

Everyday 是一个 Obsidian 一句话日记插件。它用快速弹窗记录每天的一句话和心情，并在月度记忆看板里按天回顾。

## 功能

- 命令面板：`Open quick diary capture` 打开快速记录弹窗。
- 命令面板：`Open monthly memory board` 打开月度记忆看板。
- 命令面板：`Capture yesterday's diary` 补记昨天。
- 左侧 ribbon 图标默认打开月度记忆看板。
- 所有日记内容保存为普通 Markdown 文件。

## 快速记录

弹窗包含日期、一句话、心情选择，以及“保存”“保存并打开日记”“取消”。如果所选日期已经有日记，弹窗会读取 frontmatter 中的 `summary` 和 `mood` 并预填。

保存时会创建或更新对应日期的 Markdown 文件。已有文件不会被整体覆盖，只会更新 frontmatter 和 `<!-- Everyday:start -->` 到 `<!-- Everyday:end -->` 之间的插件管理区域。

## 文件格式

默认路径：

```text
Diary/2026/2026-05-14.md
```

关闭年份子目录后：

```text
Diary/2026-05-14.md
```

日记文件会包含类似内容：

```markdown
---
Everyday: true
date: 2026-05-14
mood: normal
mood_label: 普通
mood_emoji: 😐
mood_score: 3
summary: 今天完成了一个小目标。
created_at: 2026-05-14T21:30:00.000Z
updated_at: 2026-05-14T21:30:00.000Z
---

# 2026-05-14

<!-- Everyday:start -->
## 一句话

😐 今天完成了一个小目标。
<!-- Everyday:end -->

## 随记
```

## 月度看板

月度看板默认显示当前月份。顶部按钮支持切换上个月、下个月、回到今天和快速记录。

- 已记录日期显示心情 emoji 和一句话。
- 未记录日期显示“未记录”。
- 点击任意日期可以补写或编辑。
- 已有文件的日期右侧有打开日记按钮。

设置中可以把月视图切换为列表或日历模式。

## 设置项

- 日记保存目录，默认 `Diary`。
- 是否使用年份子目录，默认开启。
- 默认心情，默认 `普通`。
- 月视图默认模式：列表或日历。
- 每周开始日：周一或周日。
- 保存后是否自动打开日记。
- 可选日记模板文件路径。

## 开发

```bash
npm install
npm run dev
```

构建发布版本：

```bash
npm run build
```
