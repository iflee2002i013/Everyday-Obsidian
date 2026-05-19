下面这份可以直接交给 Codex / AI Agent 继续开发。它基于你现在 `Everyday v0.1.0` 已经完成的能力：快速记录、YAML-only 日记字段、`MonthMemoryView`、`DiaryStorageService`、`QuickCaptureModal`、文件变化自动刷新等都已经可用；同时也遵循你对 MVP2 的确认：**月份作为列，日期作为行；英文名 Memory Board，中文叫月度回顾；第一版先做默认 6 个月横向视图；暂不做密度切换和完整全年卡片视图**。

---

# Everyday 插件 MVP2 开发 Spec：Memory Board / 月度回顾

## 1. 开发目标

在现有 Everyday 插件基础上新增一个核心视图：

```text
Memory Board / 月度回顾
```

该视图用于在一个界面中查看连续多个月份的每日一句和心情。

MVP2 第一阶段目标：

1. 新增一个 `MemoryBoardView`。
    
2. 默认展示连续 6 个月。
    
3. 布局采用“月份作为列，日期作为行”。
    
4. 每一天显示内容尽量沿用当前侧边栏月视图的展示方式。
    
5. 支持点击日期进行快速记录 / 编辑。
    
6. 支持 Alt + 左键打开原始日记。
    
7. 支持顶部时间导航。
    
8. 支持点击时间标题弹出年份 / 月份选择器。
    
9. 保存记录后自动刷新 Memory Board。
    
10. 不破坏现有 MVP1 功能。
    

---

## 2. 当前基础约束

当前 Everyday v0.1.0 已经实现：

```text
QuickCaptureModal
DiaryStorageService
MonthMemoryView
MoodPicker
settings
DateService
path utils
markdown utils
```

当前数据设计已经收敛为：

```yaml
---
mood_label: 普通
mood_emoji: 😐
summary: 今天完成了某件事情。
---
```

MVP2 必须继续遵守：

1. 不再写入 `<!-- Everyday:start -->` / `<!-- Everyday:end -->`。
    
2. 不再维护正文中的 `## 一句话`。
    
3. 一句话只读取 / 写入 YAML frontmatter 的 `summary` 字段。
    
4. 心情只依赖 `mood_label` 和 `mood_emoji`。
    
5. 保持对旧字段的兼容逻辑，不主动新增旧字段。
    
6. 不大规模重构 MVP1 已稳定功能。
    

---

## 3. MVP2 不做的功能

本阶段暂不实现：

1. 年度 3 × 4 月份卡片视图。
    
2. Comfort / Compact / Mood-only 密度切换。
    
3. 心情统计图。
    
4. 心情趋势分析。
    
5. 心情列表 UI 自定义。
    
6. 完整月度回顾正文管理。
    
7. Dataview 集成。
    
8. 移动端专项优化。
    
9. 手写日记识别。
    
10. 新的数据存储系统。
    

---

## 4. 新增视图：MemoryBoardView

新增文件：

```text
src/views/MemoryBoardView.ts
```

新增 View Type：

```ts
export const VIEW_TYPE_MEMORY_BOARD = "everyday-memory-board-view";
```

类名：

```ts
export class MemoryBoardView extends ItemView
```

职责：

1. 渲染连续 6 个月的每日一句。
    
2. 管理当前显示范围的起始年月。
    
3. 支持上一时间段 / 下一时间段 / 今天。
    
4. 支持点击标题选择年月。
    
5. 支持点击某一天快速编辑。
    
6. 支持 Alt + 左键打开原始日记。
    
7. 监听保存回调并刷新界面。
    

---

## 5. 命令设计

在 `src/main.ts` 中新增命令：

```text
Open memory board
```

命令 ID 建议：

```ts
"open-memory-board"
```

命令行为：

1. 打开 `MemoryBoardView`。
    
2. 如果视图已打开，则激活已有视图。
    
3. 默认显示包含今天的 6 个月区间。
    

中文命令名可显示为：

```text
打开月度回顾
```

英文命令名可显示为：

```text
Open Memory Board
```

---

## 6. Ribbon 行为

MVP2 不强制替换当前 ribbon 入口。

推荐做法：

1. 现有 ribbon 图标继续打开 `MonthMemoryView`。
    
2. 新增一个命令用于打开 `MemoryBoardView`。
    
3. 可以在 `MonthMemoryView` 顶部工具栏增加一个按钮：
    

```text
月度回顾
```

点击后打开 `MemoryBoardView`。

这样不会破坏当前用户已经习惯的月视图入口。

---

## 7. 默认时间范围规则

Memory Board 默认显示 6 个月。

### 7.1 默认起始月份

打开视图时，默认显示当前日期所在的半年：

如果今天在 1 月到 6 月：

```text
Jan - Jun
```

如果今天在 7 月到 12 月：

```text
Jul - Dec
```

例如：

```text
2026-05-19 -> 2026 Jan - Jun
2026-09-10 -> 2026 Jul - Dec
```

### 7.2 内部状态

`MemoryBoardView` 内部维护：

```ts
private startYear: number;
private startMonth: number; // 1-12
private readonly monthCount = 6;
```

### 7.3 月份计算

新增工具函数或在 `DateService` 中实现：

```ts
interface YearMonth {
  year: number;
  month: number; // 1-12
}

function getHalfYearStart(date: moment.Moment): YearMonth

function addMonths(year: number, month: number, offset: number): YearMonth

function getMonthRange(startYear: number, startMonth: number, count: number): YearMonth[]
```

示例：

```ts
getMonthRange(2026, 1, 6)
// [
//   { year: 2026, month: 1 },
//   { year: 2026, month: 2 },
//   ...
//   { year: 2026, month: 6 },
// ]
```

跨年必须正确：

```ts
getMonthRange(2026, 10, 6)
// 2026 Oct, Nov, Dec, 2027 Jan, Feb, Mar
```

---

## 8. 顶部工具栏

Memory Board 顶部布局：

```text
<    2026 Jan - Jun    >        [今天] [快速记录]
```

建议 DOM 结构：

```text
.Everyday-memory-board
  .Everyday-memory-board-toolbar
    button previous
    button title / date range
    button next
    button today
    button quick capture
  .Everyday-memory-board-grid
```

按钮行为：

### 8.1 上一个时间段

点击 `<`：

```ts
startMonth -= 6
```

显示上一个 6 个月区间。

例如：

```text
2026 Jan - Jun -> 2025 Jul - Dec
```

### 8.2 下一个时间段

点击 `>`：

```ts
startMonth += 6
```

显示下一个 6 个月区间。

例如：

```text
2026 Jan - Jun -> 2026 Jul - Dec
```

### 8.3 今天

点击 `[今天]`：

1. 重新计算今天所在半年。
    
2. 跳转到对应 6 个月区间。
    
3. 刷新视图。
    

### 8.4 快速记录

点击 `[快速记录]`：

1. 打开 `QuickCaptureModal`。
    
2. 日期默认为今天。
    
3. 保存后刷新 `MemoryBoardView`。
    

---

## 9. 点击时间标题选择年月

你希望时间导航可以点击日期来快速选择年份和月份，因此需要新增一个简单的月份选择弹窗。

新增文件：

```text
src/modals/MonthPickerModal.ts
```

或者：

```text
src/modals/MemoryBoardPeriodPickerModal.ts
```

推荐类名：

```ts
export class MemoryBoardPeriodPickerModal extends Modal
```

### 9.1 打开方式

点击顶部标题：

```text
2026 Jan - Jun
```

弹出选择器。

### 9.2 选择器 UI

弹窗示意：

```text
        <<    <    2026    >    >>

Jan   Feb   Mar   Apr
May   Jun   Jul   Aug
Sep   Oct   Nov   Dec

[取消]
```

按钮行为：

```text
<<  上一年
>>  下一年
<   上一个月
>   下一个月
```

说明：

1. 中间显示当前选择年份。
    
2. 月份按钮显示 12 个月。
    
3. 点击某个月后，将该月作为 Memory Board 的起始月份。
    
4. 然后显示从该月开始的连续 6 个月。
    

例如：

点击 `2026 Mar` 后显示：

```text
2026 Mar - Aug
```

### 9.3 高亮规则

1. 当前起始月份高亮。
    
2. 今天所在月份可以有轻微标记。
    
3. 不需要复杂动画。
    

---

## 10. Memory Board 主体布局

核心布局采用：

```text
月份作为列，日期作为行
```

示意：

```text
┌─────────────┬─────────────┬─────────────┬─────────────┬─────────────┬─────────────┐
│ JANUARY     │ FEBRUARY    │ MARCH       │ APRIL       │ MAY         │ JUNE        │
├─────────────┼─────────────┼─────────────┼─────────────┼─────────────┼─────────────┤
│ 01 Thu 🙂...│ 01 Sun 😐...│ 01 Sun      │ 01 Wed 🙂...│ 01 Fri      │ 01 Mon      │
│ 02 Fri      │ 02 Mon 🙂...│ 02 Mon 😔...│ 02 Thu      │ 02 Sat 🤔...│ 02 Tue      │
│ 03 Sat 🙂...│ 03 Tue      │ 03 Tue      │ 03 Fri 🙂...│ 03 Sun      │ 03 Wed      │
│ ...         │ ...         │ ...         │ ...         │ ...         │ ...         │
│ 31 Sat      │             │ 31 Tue 😐...│             │ 31 Sun 🙂...│             │
└─────────────┴─────────────┴─────────────┴─────────────┴─────────────┴─────────────┘
```

### 10.1 CSS 布局建议

使用横向滚动，避免窄屏压缩到不可读。

```css
.Everyday-memory-board-scroll {
  overflow-x: auto;
}

.Everyday-memory-board-grid {
  display: grid;
  grid-template-columns: repeat(6, minmax(180px, 1fr));
  gap: 8px;
  min-width: 1080px;
}
```

在侧边栏很窄时，允许横向滚动。

---

## 11. 月份列设计

每个月一列：

```text
.Everyday-memory-month-column
  .Everyday-memory-month-header
  .Everyday-memory-month-days
  .Everyday-memory-month-review-placeholder
```

### 11.1 月份标题

显示：

```text
JANUARY
2026
```

或者紧凑显示：

```text
JANUARY 2026
```

推荐在 6 个月视图中使用：

```text
JANUARY
2026
```

这样列宽较窄时更稳定。

### 11.2 日期行数量

每个月列内部显示 1 到 31 行。

对于不存在的日期，例如 2 月 30 日、4 月 31 日：

1. 显示为空占位行。
    
2. 不可点击。
    
3. 维持行高一致，使不同月份的日期大致横向对齐。
    

示例：

```text
29 Thu ...
30 Fri ...
31 Sat ...
```

2 月中：

```text
29
30 空白占位
31 空白占位
```

---

## 12. 每日行显示规则

尽量沿用当前侧边栏月视图的显示方式。

每一行结构：

```text
日期 星期 心情 一句话
```

示例：

```text
14 Thu 😐 今天完成了 AAC 量化模块...
```

### 12.1 已记录 Everyday 一句话

如果该日期有 `summary`：

```text
14 Thu 😐 今天完成了 AAC 量化模块...
```

显示字段：

1. 日期：`14`
    
2. 星期：`Thu` 或当前已有星期格式
    
3. 心情：`mood_emoji`
    
4. 摘要：`summary`
    

摘要需要单行截断：

```css
white-space: nowrap;
overflow: hidden;
text-overflow: ellipsis;
```

### 12.2 没有记录，但日记文件存在

如果该日期有 Markdown 文件，但没有 `summary`：

显示当前月视图已有文案风格，例如：

```text
14 Thu 已创建日记，点击打开
```

但 Memory Board 空间较窄，推荐紧凑为：

```text
14 Thu 已创建日记
```

点击行为仍然是快速记录 / 编辑 Everyday 一句话。

### 12.3 没有日记文件

显示淡化状态：

```text
14 Thu
```

或者：

```text
14 Thu ·
```

不建议在 Memory Board 中每个空日期都写“未记录”，会让页面太吵。

### 12.4 今天

今天所在行增加轻微高亮：

```css
.Everyday-memory-day-row.is-today
```

要求：

1. 不能过于刺眼。
    
2. 使用 Obsidian 主题变量。
    
3. 不要写死强烈颜色。
    

---

## 13. 心情背景色

MVP2 允许先在 Memory Board 中实现心情背景色。

要求：

1. 已记录心情的日期行可以有非常淡的背景色。
    
2. 背景色必须适配不同 Obsidian 主题。
    
3. 不能影响文字可读性。
    
4. 不要使用过深的硬编码背景。
    

建议实现方式：

```ts
rowEl.style.setProperty("--Everyday-mood-color", mood.color);
```

CSS：

```css
.Everyday-memory-day-row.has-mood {
  border-left: 3px solid var(--Everyday-mood-color);
  background-color: color-mix(
    in srgb,
    var(--Everyday-mood-color) 12%,
    transparent
  );
}
```

如果担心 `color-mix` 兼容性，可以先只实现左边色条：

```css
.Everyday-memory-day-row.has-mood {
  border-left: 3px solid var(--Everyday-mood-color);
}
```

优先保证在深色 / 浅色主题下都能看清文字。

---

## 14. 点击交互

Memory Board 因为列较窄，不建议强依赖右侧编辑按钮。

### 14.1 默认点击

单击任意有效日期行：

```text
打开 QuickCaptureModal
```

行为：

1. 如果已有 `summary` 和心情，预填。
    
2. 如果没有记录，日期预设为该日期。
    
3. 保存后刷新 Memory Board。
    

### 14.2 Alt + 左键

`Alt + 左键`：

```text
打开原始日记文件
```

行为：

1. 调用现有 `DiaryStorageService.openDiaryFile(date)`。
    
2. 如果文件不存在，按当前日记路径规则和模板创建。
    
3. 打开对应 Markdown 文件。
    

### 14.3 Tooltip

每一行 hover 时显示 tooltip：

```text
点击编辑一句话，Alt + 点击打开日记
```

如果实现 tooltip 麻烦，可以使用 `title` 属性。

### 14.4 编辑按钮

MVP2 不强制显示编辑按钮。

如果列宽足够，可以在 hover 时显示一个小铅笔按钮，但不要因为按钮导致布局拥挤。

---

## 15. 数据读取逻辑

不要为 Memory Board 新建私有数据库。

继续复用 `DiaryStorageService`。

### 15.1 推荐新增方法

在 `DiaryStorageService` 中新增：

```ts
async getMonthsEntries(
  months: YearMonth[]
): Promise<Map<string, DiaryEntry[]>>
```

或者更简单：

```ts
async getMemoryBoardEntries(
  startYear: number,
  startMonth: number,
  monthCount: number
): Promise<MemoryBoardMonth[]>
```

类型建议：

```ts
interface YearMonth {
  year: number;
  month: number; // 1-12
}

interface MemoryBoardMonth {
  year: number;
  month: number;
  label: string;
  entries: DiaryEntry[];
}
```

也可以第一版直接在 `MemoryBoardView` 中循环调用已有方法：

```ts
const entries = await this.storage.getMonthEntries(year, month);
```

要求：

1. 不直接扫描 vault。
    
2. 不重复实现路径解析。
    
3. 不直接解析 Markdown 正文。
    
4. 只读取 frontmatter 中的 `summary`、`mood_label`、`mood_emoji`。
    
5. 保持对旧字段兼容的读取逻辑。
    

---

## 16. 保存后的刷新机制

当前 MVP1 已经有文件变化自动刷新和保存后刷新能力。

MVP2 要求：

1. QuickCaptureModal 保存后刷新当前打开的 `MemoryBoardView`。
    
2. vault 中 Markdown create / modify / delete / rename 后，已打开的 MemoryBoardView 也应延迟刷新。
    
3. metadata changed 后，MemoryBoardView 也应延迟刷新。
    
4. 刷新逻辑和 MonthMemoryView 尽量复用。
    

建议在 `main.ts` 中抽象：

```ts
refreshOpenEverydayViews()
```

它负责刷新：

```text
MonthMemoryView
MemoryBoardView
```

不要只刷新月视图。

---

## 17. 设置项

MVP2 第一版不要增加太多设置。

可以新增内部默认值：

```ts
const DEFAULT_MEMORY_BOARD_MONTH_COUNT = 6;
```

暂不需要在设置页暴露。

如果必须写入 settings，建议加：

```ts
memoryBoardMonthCount: number; // 默认 6，暂不提供 UI 修改
```

但第一版可以不改设置结构。

---

## 18. 月度回顾占位

MVP2 第二阶段可以在每个月底部显示：

```text
+ 添加月度回顾
```

第一阶段可以先不做。

如果实现占位，要求：

1. 只显示入口。
    
2. 不强制实现 monthly note 存储。
    
3. 点击后可以先显示 Notice：
    

```text
月度回顾将在后续版本实现
```

或者打开 / 创建一个月记文件：

```text
Diary/2026/2026-05.md
```

但不建议在 MVP2 第一阶段引入月记文件逻辑，避免影响主线开发。

---

## 19. 推荐文件结构变更

新增：

```text
src/views/MemoryBoardView.ts
src/modals/MemoryBoardPeriodPickerModal.ts
```

可选新增：

```text
src/types/memoryBoard.ts
src/utils/dateRange.ts
```

现有文件需要修改：

```text
src/main.ts
src/services/DiaryStorageService.ts
src/constants.ts
src/types.ts
styles.css
README.md
```

如果要避免过度拆分，也可以把 `YearMonth` 等类型放入现有 `types.ts`。

---

## 20. CSS 类命名

继续使用当前 `Everyday-` 前缀。

新增类名建议：

```css
.Everyday-memory-board {}
.Everyday-memory-board-toolbar {}
.Everyday-memory-board-title-button {}
.Everyday-memory-board-scroll {}
.Everyday-memory-board-grid {}

.Everyday-memory-month-column {}
.Everyday-memory-month-header {}
.Everyday-memory-month-title {}
.Everyday-memory-month-year {}
.Everyday-memory-month-days {}

.Everyday-memory-day-row {}
.Everyday-memory-day-row.is-empty {}
.Everyday-memory-day-row.is-invalid {}
.Everyday-memory-day-row.is-today {}
.Everyday-memory-day-row.has-summary {}
.Everyday-memory-day-row.has-note {}
.Everyday-memory-day-row.has-mood {}

.Everyday-memory-day-date {}
.Everyday-memory-day-weekday {}
.Everyday-memory-day-mood {}
.Everyday-memory-day-summary {}

.Everyday-period-picker {}
.Everyday-period-picker-toolbar {}
.Everyday-period-picker-month-grid {}
.Everyday-period-picker-month-button {}
.Everyday-period-picker-month-button.is-selected {}
.Everyday-period-picker-month-button.is-current {}
```

---

## 21. 架构原则

### 21.1 优先新增，不破坏旧功能

不要为了实现 Memory Board 大改 `MonthMemoryView`。

允许复用代码，但不要让现有月视图行为发生变化。

### 21.2 文件读取集中在 Storage

Memory Board 不应该自己处理路径和 Markdown。

所有路径、读取、打开文件逻辑继续通过：

```ts
DiaryStorageService
```

### 21.3 UI 尽量轻

不要引入 React。

继续使用 Obsidian 原生 DOM API。

### 21.4 兼容主题

所有颜色尽量依赖 Obsidian CSS variables。

避免写死大面积背景色。

---

## 22. 验收标准

### 22.1 打开视图

通过命令面板可以找到：

```text
Open Memory Board
```

执行后打开 Memory Board。

默认显示当前日期所在半年。

例如当前是 2026 年 5 月，则显示：

```text
2026 Jan - Jun
```

---

### 22.2 六个月展示

Memory Board 中应同时显示 6 个月。

每个月作为一列。

每列显示：

1. 月份标题。
    
2. 每天一行。
    
3. 已记录日期显示 emoji + summary。
    
4. 未记录日期保持淡化。
    
5. 无效日期保持空白占位。
    

---

### 22.3 导航

顶部 `<` 可以跳转到上一个 6 个月。

顶部 `>` 可以跳转到下一个 6 个月。

`今天` 可以回到当前日期所在半年。

`快速记录` 可以打开今天的 QuickCaptureModal。

---

### 22.4 点击标题选择年月

点击标题：

```text
2026 Jan - Jun
```

弹出年月选择器。

选择某个月后，Memory Board 从该月开始显示连续 6 个月。

例如选择 2026 Mar 后显示：

```text
2026 Mar - Aug
```

跨年显示必须正确。

---

### 22.5 日期点击

单击任意有效日期：

1. 打开 QuickCaptureModal。
    
2. 日期正确。
    
3. 已有记录时预填 summary 和 mood。
    
4. 保存后 Memory Board 自动刷新。
    

---

### 22.6 Alt + 点击

Alt + 左键点击有效日期：

1. 打开原始 Markdown 日记。
    
2. 如果文件不存在，则按当前日记规则创建。
    
3. 不打开 QuickCaptureModal。
    

---

### 22.7 数据兼容

Memory Board 必须正确读取现有 YAML-only 数据：

```yaml
mood_label
mood_emoji
summary
```

不得依赖正文管理区。

不得重新引入：

```text
Everyday:start
Everyday:end
## 一句话
```

---

### 22.8 主题兼容

在浅色主题和深色主题下：

1. 文字可读。
    
2. 心情色条或淡背景不刺眼。
    
3. 未记录日期不会过度抢眼。
    
4. 横向滚动正常。
    

---

### 22.9 构建

运行：

```bash
npm run build
```

必须通过。

---

## 23. 推荐开发顺序

### 第一阶段：视图骨架

1. 新建 `MemoryBoardView.ts`。
    
2. 注册 `VIEW_TYPE_MEMORY_BOARD`。
    
3. 新增命令 `Open Memory Board`。
    
4. 打开后显示顶部 toolbar 和空白 6 列布局。
    
a
### 第二阶段：月份范围

1. 实现 `getHalfYearStart()`。
    
2. 实现 `getMonthRange()`。
    
3. 支持上一段、下一段、今天。
    
4. 正确处理跨年。
    

### 第三阶段：读取数据

1. 循环调用 `DiaryStorageService.getMonthEntries()`。
    
2. 每个月渲染 1 到 31 行。
    
3. 渲染 summary、mood_emoji、weekday。
    
4. 无效日期显示空白占位。
    

### 第四阶段：点击交互

1. 单击日期打开 QuickCaptureModal。
    
2. Alt + 点击打开原始日记。
    
3. 保存后刷新 Memory Board。
    
4. 增加 tooltip。
    

### 第五阶段：年月选择器

1. 新建 `MemoryBoardPeriodPickerModal`。
    
2. 实现 `<<`、`<`、`>`、`>>`。
    
3. 实现月份网格。
    
4. 点击月份后更新 Memory Board 起始月份。
    

### 第六阶段：样式打磨

1. 增加横向滚动。
    
2. 增加心情色条 / 淡背景。
    
3. 增加今天高亮。
    
4. 适配窄侧边栏。
    
5. 适配深色 / 浅色主题。
    

### 第七阶段：文档与回归

1. 更新 README。
    
2. 说明 Memory Board 使用方式。
    
3. 说明点击和 Alt + 点击。
    
4. 回归测试 MonthMemoryView 不受影响。
    
5. 构建通过。
    

---

## 24. README 更新要求

README 中新增一节：

```markdown
## Memory Board / 月度回顾

Memory Board 可以在一个界面中查看连续 6 个月的每日一句。
每个月作为一列，每一天作为一行。

- 点击日期：记录或编辑当天的一句话
- Alt + 点击日期：打开原始日记
- 点击顶部时间范围：快速选择年份和月份
- 使用 < 和 > 切换上一个 / 下一个 6 个月
```

同时说明：

```markdown
Memory Board 只读取 YAML frontmatter 中的 summary、mood_label、mood_emoji。
插件不会向正文插入额外管理区。
```

---

## 25. 最终产品原则

开发时始终遵守：

1. **低成本记录**  
    用户点击某天就能补写一句话。
    
2. **一眼看到生活轨迹**  
    Memory Board 的重点不是数据统计，而是让用户看到几个月内每天留下的生活痕迹。
    
3. **不破坏 Markdown 可控性**  
    所有日记仍然是普通 Markdown 文件。
    
4. **不破坏 MVP1 稳定功能**  
    Memory Board 是新增能力，不应让现有月视图、快速记录、日记路径规则失效。