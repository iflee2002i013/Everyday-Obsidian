可以，下面这份可以直接交给 Codex 作为开发任务。技术基准建议使用 Obsidian 官方 sample plugin 作为项目脚手架；Obsidian 插件开发主要使用 TypeScript，官方 API 中也有 `Modal`、`ItemView`、`PluginSettingTab` 等适合本插件的 UI 基础类。([GitHub][1])
另外，涉及修改 frontmatter 时，优先使用 Obsidian 官方推荐的 `FileManager.processFrontMatter()`，不要手写 YAML 解析与覆盖，以避免破坏用户原有笔记。([Developer Documentation][2])

---

# Obsidian 插件开发 Spec：One Line Diary / 每日一格

## 1. 插件定位

开发一个 Obsidian 插件，用极低成本记录每天的一句话和心情，并提供按月展示的回顾界面。

插件核心目标：

1. 用户可以通过快捷入口快速记录：

   * 日期
   * 一句话日记
   * 心情

2. 插件会自动创建或更新对应日期的 Markdown 日记文件。

3. 插件提供一个“月度记忆看板”，按月份展示每天的一句话和心情。

4. 数据必须保存在普通 Markdown 文件中，避免锁定在插件私有数据库中。

---

## 2. MVP 范围

第一版只实现以下功能，不要扩展过多：

### 必须实现

1. 快速记录弹窗
2. Markdown 日记文件创建 / 更新
3. 月度看板视图
4. 点击某天可以新增、修改或打开对应日记
5. 插件设置页
6. 基础样式

### 暂不实现

1. 年度总览
2. 复杂统计图
3. 心情趋势分析
4. 手写笔记识别
5. Dataview 集成
6. 移动端专门优化
7. 云同步或外部账户系统

---

## 3. 插件名称和基本信息

建议插件名：

```text
One Line Diary
```

插件 ID：

```text
one-line-diary
```

简介：

```text
Quickly capture one sentence and one mood for each day, then review your memories in a monthly board.
```

---

## 4. 数据存储设计

### 4.1 存储原则

所有日记数据必须保存为 Markdown 文件。

不要只保存在 `.obsidian/plugins/one-line-diary/data.json` 中。

插件设置可以保存到插件自己的 `data.json`，但用户日记内容必须存在普通 `.md` 文件中。

---

### 4.2 默认目录结构

默认日记目录：

```text
Diary/
```

默认启用年份子目录：

```text
Diary/2026/2026-05-14.md
```

用户可以在设置中修改日记目录。

---

### 4.3 单篇日记格式

新建日记时，使用以下格式：

```markdown
---
one_line_diary: true
date: 2026-05-14
mood: normal
mood_label: 普通
mood_emoji: 😐
mood_score: 3
summary: 今天完成了 AAC 量化模块的重构，但还有些地方没想清楚。
created_at: 2026-05-14T21:30:00
updated_at: 2026-05-14T21:30:00
---

# 2026-05-14

<!-- one-line-diary:start -->
## 一句话

😐 今天完成了 AAC 量化模块的重构，但还有些地方没想清楚。
<!-- one-line-diary:end -->

## 随记

```

---

### 4.4 更新已有日记的规则

当目标日期的日记已经存在时：

1. 不要覆盖整篇文件。

2. 使用 `processFrontMatter()` 更新以下字段：

   * `one_line_diary`
   * `date`
   * `mood`
   * `mood_label`
   * `mood_emoji`
   * `mood_score`
   * `summary`
   * `updated_at`

3. 正文中只更新插件管理区域：

```markdown
<!-- one-line-diary:start -->
...
<!-- one-line-diary:end -->
```

4. 如果正文中没有插件管理区域，则在文件开头标题后追加该区域。
5. 必须保留用户在 `## 随记` 或其他区域手写的内容。

---

## 5. 默认心情选项

第一版内置以下心情：

```ts
[
  {
    id: "happy",
    label: "开心",
    emoji: "😄",
    score: 5,
    color: "#f6c453"
  },
  {
    id: "calm",
    label: "平静",
    emoji: "🙂",
    score: 4,
    color: "#8fcf8f"
  },
  {
    id: "normal",
    label: "普通",
    emoji: "😐",
    score: 3,
    color: "#b8b8b8"
  },
  {
    id: "sad",
    label: "低落",
    emoji: "😔",
    score: 2,
    color: "#7fa7d9"
  },
  {
    id: "awful",
    label: "崩溃",
    emoji: "😫",
    score: 1,
    color: "#d98282"
  },
  {
    id: "thinking",
    label: "思考",
    emoji: "🤔",
    score: 3,
    color: "#b49ddb"
  }
]
```

MVP 阶段可以先不支持用户自定义心情，但设置结构中要预留 `moods` 数组。

---

## 6. 插件设置

实现一个设置页，包含以下配置：

```ts
interface OneLineDiarySettings {
  diaryFolder: string;          // 默认 "Diary"
  useYearSubfolders: boolean;   // 默认 true
  defaultMoodId: string;        // 默认 "normal"
  weekStart: "monday" | "sunday";
  openNoteAfterSave: boolean;   // 默认 false
  viewMode: "list" | "calendar";
  moods: MoodOption[];
}
```

默认设置：

```ts
const DEFAULT_SETTINGS: OneLineDiarySettings = {
  diaryFolder: "Diary",
  useYearSubfolders: true,
  defaultMoodId: "normal",
  weekStart: "monday",
  openNoteAfterSave: false,
  viewMode: "list",
  moods: DEFAULT_MOODS
};
```

设置页第一版需要支持修改：

1. 日记保存目录
2. 是否使用年份子目录
3. 默认心情
4. 月视图默认模式：列表 / 日历

---

## 7. 命令设计

插件加载后注册以下命令：

### 7.1 快速记录

命令名：

```text
Open quick diary capture
```

功能：

打开快速记录弹窗。

---

### 7.2 打开月度看板

命令名：

```text
Open monthly memory board
```

功能：

打开插件自定义视图，默认显示当前月份。

---

### 7.3 记录昨天

命令名：

```text
Capture yesterday's diary
```

功能：

打开快速记录弹窗，日期默认填昨天。

这个命令可以作为 MVP 的可选功能。

---

## 8. Ribbon 图标

在 Obsidian 左侧 ribbon 添加一个图标。

点击图标时：

1. 默认打开“月度记忆看板”。
2. 月度看板内部提供“快速记录”按钮。

---

## 9. 快速记录弹窗

### 9.1 交互目标

用户打开弹窗后，可以在 10 秒内完成记录。

### 9.2 弹窗内容

字段：

1. 日期选择器

   * 默认今天
   * 支持选择过去日期，用于补写

2. 一句话输入框

   * 使用 textarea
   * placeholder 示例：`今天最重要的一件事是什么？`

3. 心情选择按钮

   * 横向排列 emoji + label
   * 点击后高亮当前心情

4. 操作按钮

   * 保存
   * 保存并打开日记
   * 取消

---

### 9.3 行为规则

打开弹窗时：

1. 如果该日期已经有日记：

   * 自动读取 frontmatter
   * 预填 summary 和 mood

2. 如果没有日记：

   * summary 为空
   * mood 使用默认心情

点击保存时：

1. summary 不能为空。
2. mood 必须有值。
3. 创建或更新对应 Markdown 文件。
4. 显示 Notice：

   * 新建成功：`Diary saved`
   * 更新成功：`Diary updated`
5. 刷新已打开的月度看板。

---

## 10. 月度记忆看板

### 10.1 视图类型

实现一个自定义 `ItemView`：

```ts
const VIEW_TYPE_MONTH_MEMORY = "one-line-diary-month-view";
```

类名建议：

```ts
class MonthMemoryView extends ItemView
```

---

### 10.2 顶部区域

月度看板顶部包含：

```text
<  2026 年 5 月  >     [今天] [快速记录]
```

按钮行为：

1. `<`：切换到上个月
2. `>`：切换到下个月
3. `今天`：回到当前月份
4. `快速记录`：打开快速记录弹窗

---

### 10.3 默认展示模式：列表模式

优先实现列表模式，因为它最接近用户原始手帐需求。

展示形式：

```text
MAY 2026

01 Fri  🙂  今天完成了 AAC 量化模块的重构。
02 Sat  😐  状态一般，但推进了一点点。
03 Sun      未记录
04 Mon  😔  今天有点焦虑。
...
31 Sun  😄  完成了月度复盘。
```

每一行包含：

1. 日期
2. 星期
3. 心情 emoji
4. 一句话 summary
5. 记录状态

---

### 10.4 未记录日期

未记录日期显示为：

```text
03 Sun      未记录
```

样式要求：

1. 字体颜色淡一些
2. 鼠标 hover 时显示可点击状态
3. 点击后打开快速记录弹窗，并自动填入该日期

---

### 10.5 已记录日期

已记录日期显示：

```text
14 Thu  😐  今天完成了 AAC 量化模块的重构。
```

点击后弹出一个小操作菜单或直接打开快速记录弹窗。

MVP 推荐行为：

* 单击：打开快速记录弹窗，允许编辑
* 右侧提供一个小按钮：打开日记文件

---

### 10.6 可选展示模式：日历格子模式

如果时间允许，实现 calendar 模式：

```text
Mon      Tue      Wed      Thu      Fri      Sat      Sun
                  1 🙂     2 😐     3 😄
4 😔     5 🙂     6       7 😫     8 😐     9 😄     10 🙂
...
```

每个格子显示：

1. 日期数字
2. 心情 emoji
3. summary 前 20 个字符

MVP 可以先只完成列表模式。

---

## 11. 数据读取逻辑

### 11.1 读取某个月的数据

输入：

```ts
year: number
month: number // 1-12
```

输出：

```ts
interface DiaryEntry {
  date: string;          // YYYY-MM-DD
  filePath: string;
  exists: boolean;
  mood?: string;
  moodLabel?: string;
  moodEmoji?: string;
  moodScore?: number;
  summary?: string;
}
```

读取规则：

1. 计算该月所有日期。
2. 对每一天生成预期文件路径。
3. 判断文件是否存在。
4. 如果存在，读取 metadataCache 中的 frontmatter。
5. 如果 frontmatter 中 `one_line_diary === true`，读取插件字段。
6. 如果文件存在但没有插件字段，仍可显示为“已有笔记，但未记录一句话”。

---

### 11.2 文件路径生成规则

默认：

```ts
Diary/2026/2026-05-14.md
```

如果关闭年份子目录：

```ts
Diary/2026-05-14.md
```

路径生成函数：

```ts
function getDiaryFilePath(date: string, settings: OneLineDiarySettings): string
```

要求：

1. 使用 `normalizePath`
2. 不允许路径中出现双斜杠
3. 自动创建缺失文件夹

---

## 12. 模块划分

建议项目结构：

```text
src/
  main.ts
  constants.ts
  types.ts
  settings.ts

  services/
    DateService.ts
    DiaryStorageService.ts

  modals/
    QuickCaptureModal.ts

  views/
    MonthMemoryView.ts

  ui/
    MoodPicker.ts

  utils/
    path.ts
    markdown.ts

styles.css
manifest.json
package.json
```

---

### 12.1 main.ts

职责：

1. 加载设置
2. 注册命令
3. 注册 ribbon 图标
4. 注册自定义 view
5. 注册设置页
6. 初始化 service

保持 `main.ts` 尽量薄，不要把全部逻辑堆在里面。

---

### 12.2 DiaryStorageService

核心方法：

```ts
class DiaryStorageService {
  constructor(app: App, settings: OneLineDiarySettings)

  getDiaryFilePath(date: string): string

  ensureDiaryFolder(date: string): Promise<void>

  getEntry(date: string): Promise<DiaryEntry>

  getMonthEntries(year: number, month: number): Promise<DiaryEntry[]>

  saveEntry(input: SaveDiaryInput): Promise<DiaryEntry>

  openDiaryFile(date: string): Promise<void>
}
```

输入类型：

```ts
interface SaveDiaryInput {
  date: string;
  summary: string;
  moodId: string;
}
```

---

### 12.3 QuickCaptureModal

职责：

1. 显示快速记录表单
2. 根据日期加载已有记录
3. 选择心情
4. 保存
5. 保存后回调刷新月视图

构造函数建议：

```ts
class QuickCaptureModal extends Modal {
  constructor(
    app: App,
    storage: DiaryStorageService,
    settings: OneLineDiarySettings,
    initialDate?: string,
    onSaved?: (entry: DiaryEntry) => void
  )
}
```

---

### 12.4 MonthMemoryView

职责：

1. 渲染当前月份
2. 支持上月 / 下月 / 今天跳转
3. 显示每天的记录状态
4. 点击日期打开 QuickCaptureModal
5. 点击打开日记按钮时打开 Markdown 文件

关键状态：

```ts
private currentYear: number;
private currentMonth: number;
```

关键方法：

```ts
render(): Promise<void>
goToPreviousMonth(): Promise<void>
goToNextMonth(): Promise<void>
goToCurrentMonth(): Promise<void>
refresh(): Promise<void>
```

---

## 13. 样式要求

CSS 类统一加前缀，避免污染其他插件：

```css
.one-line-diary-view {}
.one-line-diary-header {}
.one-line-diary-day-row {}
.one-line-diary-day-row.is-empty {}
.one-line-diary-day-row.is-today {}
.one-line-diary-mood-pill {}
.one-line-diary-summary {}
```

视觉风格：

1. 简洁、柔和、接近手帐
2. 不使用强烈边框
3. 每天一行要有轻微分隔
4. 今天高亮
5. 未记录日期颜色降低
6. 心情 emoji 明显一些

---

## 14. 错误处理

必须处理以下情况：

1. 日记目录不存在

   * 自动创建

2. 文件已存在但没有 frontmatter

   * 添加插件字段，不覆盖正文

3. summary 为空

   * 不允许保存，并显示提示

4. 用户设置了非法路径

   * normalize 后处理
   * 创建失败时显示错误 Notice

5. metadataCache 还没更新

   * 保存后以返回的输入数据刷新 UI，不强依赖立即读取 metadataCache

---

## 15. 验收标准

### 15.1 快速记录

满足以下条件视为通过：

1. 命令面板可以找到 `Open quick diary capture`
2. 打开后默认日期为今天
3. 可以输入一句话
4. 可以选择心情
5. 点击保存后生成 Markdown 文件
6. 文件包含正确 frontmatter
7. 文件包含插件管理的“一句话”正文区域

---

### 15.2 更新已有记录

满足以下条件视为通过：

1. 再次打开同一天记录时，会预填已有 summary 和 mood
2. 修改后保存，frontmatter 被更新
3. 正文中插件管理区域被更新
4. 用户手写的其他正文内容不会丢失

---

### 15.3 月度看板

满足以下条件视为通过：

1. 命令面板可以打开月度看板
2. 默认显示当前月份
3. 上月 / 下月按钮可用
4. 已记录日期显示 emoji 和 summary
5. 未记录日期显示“未记录”
6. 点击未记录日期可以补写
7. 点击已记录日期可以编辑
8. 保存后月度看板自动刷新

---

## 16. 建议开发顺序

第一阶段：项目初始化

1. 使用 Obsidian sample plugin 初始化项目
2. 修改 `manifest.json`
3. 建立 `src/` 目录结构
4. 加入 settings 类型和默认设置

第二阶段：快速记录

1. 实现 `QuickCaptureModal`
2. 实现心情选择器
3. 实现保存 Markdown 文件
4. 实现更新已有文件

第三阶段：月度看板

1. 注册 `MonthMemoryView`
2. 渲染当前月份所有日期
3. 读取每一天的 frontmatter
4. 实现上月 / 下月 / 今天切换
5. 实现点击补写和编辑

第四阶段：打磨

1. 加 CSS
2. 加 Notice
3. 加错误处理
4. 测试不同目录配置
5. 清理 console.log
6. 确保不破坏已有笔记

---

## 17. 代码质量要求

1. 使用 TypeScript。
2. 避免 `any`。
3. `main.ts` 只负责注册和装配。
4. 文件读写集中在 `DiaryStorageService`。
5. UI 逻辑不要直接操作复杂文件内容。
6. 不引入 React。
7. 不引入大型依赖。
8. 不联网。
9. 不收集遥测。
10. 不修改非插件管理区域内容。

---

## 18. 最终交付物

需要交付：

```text
manifest.json
main.ts / src/**/*.ts
styles.css
package.json
README.md
```

README 至少说明：

1. 插件用途
2. 快速记录方式
3. 日记文件保存格式
4. 月度看板使用方式
5. 设置项说明
6. 数据全部保存在 Markdown 文件中

---

## 19. 插件的产品原则

开发时始终遵守这三个原则：

第一，记录成本要低。
用户不应该为了写一句话日记而打开复杂页面。

第二，数据要可控。
所有日记都必须是普通 Markdown 文件，插件卸载后内容仍然可读。

第三，展示要有生活感。
月度看板不是数据报表，而是一本自动排版的数字手帐。

[1]: https://github.com/obsidianmd/obsidian-sample-plugin?utm_source=chatgpt.com "obsidianmd/obsidian-sample-plugin"
[2]: https://docs.obsidian.md/Reference/TypeScript%2BAPI/FileManager/processFrontMatter?utm_source=chatgpt.com "processFrontMatter - Developer Documentation"
