# 第七阶段：文档与回归

## 执行结果回执

已完成 MVP2 第七阶段文档与回归。

本阶段完成内容：

- 更新 README：新增 `Memory Board / 月度回顾` 说明，覆盖打开方式、半年 / 季度排版、顶部导航、快速记录、点击日期和 Alt + 点击日期。
- 补充数据规则说明：Memory Board 只读取 YAML frontmatter 中的 `summary`、`mood_label`、`mood_emoji`，不会写入 `Everyday:start` / `Everyday:end` 管理区，也不会维护正文中的 `## 一句话`。
- 更新设置项说明：补充 `Memory Board 排版模式`，说明支持半年视图和季度视图。
- 回归核对 MonthMemoryView：当前单月月度看板仍通过 `VIEW_TYPE_MONTH_MEMORY` 独立注册，入口命令 `Open monthly memory board` 和 ribbon 仍打开 MonthMemoryView；Memory Board 使用独立的 `VIEW_TYPE_MEMORY_BOARD` 和 `Open Memory Board` 命令。
- 回归核对刷新逻辑：保存、Markdown 文件变化和 metadata changed 会通过 `refreshOpenEverydayViews()` 同时刷新 MonthMemoryView 和 MemoryBoardView。

涉及文件：

- `.obsidian/plugins/Everyday/README.md`
- `.obsidian/plugins/Everyday/main.js`

已运行验证：`npm.cmd run build` 通过，`main.js` 已重新生成。

备注：

- 第五阶段反馈已取消“点击顶部时间范围弹出年月选择器”的方案，因此 README 按当前真实能力记录为顶部导航按钮切换时间段，没有写入标题点击选择年月。
