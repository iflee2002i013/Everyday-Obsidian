# Everyday v0.2.2

Everyday v0.2.2 是一个小修版本，重点调整侧边栏月视图的入口设计。

## 更新内容

- 将侧边栏月视图顶部原来的“日历”按钮替换为 `Memory Board` 按钮。
- 点击 `Memory Board` 会直接打开连续多月回顾视图，减少在月视图内切换日历模式的步骤。
- 月视图现在固定使用列表布局，保留按月浏览、跳转今天、快速记录和打开日记等核心操作。
- 设置页移除“月视图默认模式”和“每周开始日”选项，因为旧日历模式已删除。
- 清理旧日历视图相关的 TypeScript 类型、渲染逻辑和 CSS 样式。

## 修复说明

- 避免侧边栏顶部出现低频使用的“日历”切换入口。
- 避免设置页保留已经无效的日历模式配置。
- 保持现有 Memory Board 排版模式设置，仍可选择半年视图或季度视图。

## 安装方式

1. 下载本 release 中的 `Everyday-v0.2.2.zip`。
2. 解压后将 `manifest.json`、`main.js`、`styles.css` 放入 vault 的 `.obsidian/plugins/Everyday/` 目录。
3. 在 Obsidian 设置中启用社区插件，然后启用 `Everyday`。

## 上传到 GitHub Release 的文件

- `manifest.json`
- `main.js`
- `styles.css`
- `Everyday-v0.2.2.zip`

## 兼容性

- Obsidian 最低版本：1.5.0
- 插件版本：0.2.2
- 桌面端和移动端均可用。

## 注意

本 release 包不包含 `data.json`，避免把本地设置或个人 vault 配置打包给其他用户。
