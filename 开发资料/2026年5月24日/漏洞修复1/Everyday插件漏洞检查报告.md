# Everyday 插件漏洞检查报告

审计日期：2026-05-24

审计对象：

- `.obsidian/plugins/Everyday/src/**/*.ts`
- `.obsidian/plugins/Everyday/main.js`
- `.obsidian/plugins/Everyday/manifest.json`
- `.obsidian/plugins/Everyday/package.json`
- `.obsidian/plugins/Everyday/data.json`
- 参考资料：`开发资料/MVP1`、`开发资料/MVP2`

## 结论摘要

未发现明显恶意行为：没有发现联网请求、遥测、命令执行、`eval`、任意 shell、全库删除、批量移动、`vault.delete`、`vault.trash` 或直接覆盖正文的 `vault.modify`。

发现 1 个高危问题：保存 Everyday 记录时会删除若干 frontmatter 字段，可能造成用户笔记 YAML 元数据丢失。该问题不属于恶意代码，但属于真实的数据损坏风险。

未发现能稳定导致整个 Obsidian 崩溃的代码；但发现若干未捕获异步异常路径，可能导致插件视图刷新失败、操作失败或控制台出现 unhandled rejection。

TypeScript 静态检查已执行：

```text
npm.cmd exec tsc -- -noEmit -skipLibCheck
结果：通过
```

## 高危问题

### 1. 保存记录时删除用户 frontmatter 字段，可能造成笔记元数据丢失

严重级别：高危

位置：

- `.obsidian/plugins/Everyday/src/services/DiaryStorageService.ts:169-187`
- `.obsidian/plugins/Everyday/src/services/DiaryStorageService.ts:263-275`

问题描述：

`writeFrontmatter()` 在每次保存 Everyday 记录时，都会进入 `processFrontMatter()` 修改目标日记的 YAML。当前代码会无条件删除：

```ts
delete frontmatter.Everyday;
delete frontmatter.mood;
delete frontmatter.mood_score;
delete frontmatter.summery;
```

并且当 `hasLegacyPluginData(frontmatter)` 判断为真时，还会删除：

```ts
delete frontmatter.date;
delete frontmatter.created_at;
delete frontmatter.updated_at;
```

风险点：

- `mood`、`mood_score`、`date`、`created_at`、`updated_at` 都是非常常见的用户自定义元数据字段，不一定属于 Everyday。
- `hasLegacyPluginData()` 的判断条件过宽，只要存在 `mood_score` 数字，或存在 `mood` 字符串并伴随 `summary` / `mood_label` / `mood_emoji`，就可能被当成旧版插件数据。
- 用户在已有日记里保存 Everyday 一句话时，正文不会被覆盖，但 YAML 中的上述字段可能被静默删除。

影响：

- 可能破坏用户已有日记的 Dataview 查询、模板字段、统计字段或外部插件字段。
- 属于用户笔记内容的一部分丢失，且保存后不容易察觉。

建议修复：

- 不要无条件删除 `mood`、`mood_score`、`summery` 等字段。
- 不要删除通用字段 `date`、`created_at`、`updated_at`。
- 若确实需要迁移旧字段，只在存在明确插件标记时迁移，例如 `frontmatter.Everyday === true`。
- 更稳妥的做法是只写入当前 MVP2 字段：

```ts
frontmatter.mood_label = mood.label;
frontmatter.mood_emoji = mood.emoji;
frontmatter.summary = summary;
```

旧字段保留给用户自行清理，或在设置里提供明确的一次性迁移命令。

## 中危问题

### 2. 日记路径格式未显式禁止 `..`，可能写入非预期笔记

严重级别：中危

位置：

- `.obsidian/plugins/Everyday/src/utils/path.ts:4-10`
- `.obsidian/plugins/Everyday/src/utils/path.ts:35-36`
- `.obsidian/plugins/Everyday/src/utils/path.ts:48-55`
- `.obsidian/plugins/Everyday/src/services/DiaryStorageService.ts:76-94`

问题描述：

`cleanPathSegment()` 会清理反斜杠、空段和首尾空格，但不会禁止 `..`。同时 `diaryNameFormat` 和 Obsidian 日记插件的 `format` 可以生成带 `/` 的路径。

因此，当用户或核心日记插件配置中出现 `../`、过深子目录或指向已有笔记的格式时，Everyday 可能会对非预期 Markdown 文件执行 `processFrontMatter()`。

影响：

- 正常用户不太会主动配置 `../`，所以不是直接恶意行为。
- 一旦配置错误，插件可能修改不属于日记目录的已有笔记 frontmatter。
- 与高危问题 1 叠加时，可能删除非预期笔记的 YAML 字段。

建议修复：

- 对 `diaryFolder`、`templateFilePath`、`diaryNameFormat` 生成结果、Daily Notes `folder` 和 `format` 结果做统一路径校验。
- 明确拒绝路径段 `.`、`..`。
- 对最终 `filePath` 做 allowlist 校验，至少确保它仍位于预期日记目录，或在 UI 中明确提示将写入的路径。
- 保存前如果目标文件已存在且不在日记目录内，应给出二次确认或拒绝写入。

### 3. 异步刷新没有统一捕获异常，可能产生 unhandled rejection

严重级别：中危

位置：

- `.obsidian/plugins/Everyday/src/main.ts:134-157`
- `.obsidian/plugins/Everyday/src/main.ts:202-204`

问题描述：

文件变化事件会延迟调用：

```ts
void this.refreshOpenEverydayViews();
```

但没有 `.catch()`。如果任一打开视图的 `refresh()` 抛错，Promise 会被丢弃，可能导致控制台 unhandled rejection。当前视图内部对数据加载有部分 try/catch，但 DOM 初始化和其他刷新步骤不完全在 try/catch 内。

影响：

- 不太可能让整个 Obsidian 崩溃。
- 可能让 Everyday 视图停止刷新或出现控制台错误。
- 如果错误在频繁文件变化时重复出现，会影响插件稳定性。

建议修复：

- 给定时刷新加兜底：

```ts
void this.refreshOpenEverydayViews().catch((error) => {
  console.error("Everyday refresh failed", error);
});
```

- `refreshOpenEverydayViews()` 内对每个 leaf 单独 try/catch，避免一个视图失败影响另一个视图。

### 4. 视图渲染依赖 `containerEl.children[1]`，DOM 结构变化时可能抛错

严重级别：中危

位置：

- `.obsidian/plugins/Everyday/src/views/MonthMemoryView.ts:69-77`
- `.obsidian/plugins/Everyday/src/views/MemoryBoardView.ts:88-97`

问题描述：

两个 ItemView 都通过：

```ts
const container = this.containerEl.children[1] as HTMLElement;
container.empty();
```

直接假设 Obsidian 的 ItemView DOM 第二个子节点一定存在。如果 Obsidian 内部 DOM 结构变化、视图尚未完全初始化、或卸载/刷新交错发生，这里会在进入业务 try/catch 之前抛错。

影响：

- 可能导致视图打开失败或刷新失败。
- 与问题 3 叠加时，可能形成 unhandled rejection。

建议修复：

- 优先使用 Obsidian `ItemView` 提供的 `contentEl`。
- 如果继续使用 `containerEl.children[1]`，需要先判断是否是 `HTMLElement`，失败时显示错误并返回。

### 5. 月视图点击已有日记时打开文件未捕获异常

严重级别：中危

位置：

- `.obsidian/plugins/Everyday/src/views/MonthMemoryView.ts:315-322`
- `.obsidian/plugins/Everyday/src/services/DiaryStorageService.ts:109-127`

问题描述：

`MonthMemoryView.handlePrimaryAction()` 对已有日记执行：

```ts
await this.storage.openDiaryFile(entry.date);
```

调用链外层事件处理使用 `void this.handlePrimaryAction(entry)`，但没有 catch。如果 `openDiaryFile()` 因路径冲突、文件创建失败、工作区打开失败等原因抛错，会产生未捕获异步异常。

影响：

- 不会直接删除数据。
- 可能造成点击操作失败且没有友好提示。
- 在异常路径下可能造成插件控制台错误。

建议修复：

- 参考 `MemoryBoardView.handleDayClick()` 的实现，给 `openDiaryFile()` 包裹 try/catch 并显示 Notice。
- 或者在事件处理层统一捕获。

## 低危问题与质量风险

### 6. QuickCaptureModal 打开时加载已有记录没有兜底

严重级别：低危

位置：

- `.obsidian/plugins/Everyday/src/modals/QuickCaptureModal.ts:25-28`
- `.obsidian/plugins/Everyday/src/modals/QuickCaptureModal.ts:122-126`

问题描述：

弹窗打开时执行：

```ts
await this.loadEntry(this.selectedDate);
this.render();
```

如果 `storage.getEntry()` 因异常路径或 Obsidian API 错误抛出，弹窗可能无法正常渲染，且没有 Notice。

建议修复：

- 在 `onOpen()` 中捕获异常，显示错误提示，并用空表单降级渲染。

### 7. 设置变更刷新范围不完全一致

严重级别：低危

位置：

- `.obsidian/plugins/Everyday/src/settings.ts:96-100`
- `.obsidian/plugins/Everyday/src/settings.ts:109-113`
- `.obsidian/plugins/Everyday/src/settings.ts:124-128`
- `.obsidian/plugins/Everyday/src/settings.ts:140-144`

问题描述：

日记保存目录、年份子目录、命名方式、文件名格式等设置变更后，只刷新 `MonthMemoryView`，没有刷新 `MemoryBoardView`。这不是安全漏洞，但会导致 Memory Board 短时间显示旧路径下的数据。

建议修复：

- 这些影响数据读取路径的设置变更后，统一调用 `refreshOpenEverydayViews()`。

## 恶意行为专项检查

检查结果：未发现恶意行为。

已确认：

- 未发现 `fetch()`、`requestUrl`、`XMLHttpRequest` 等联网行为。
- 未发现 `child_process`、`exec`、`spawn`、shell 调用或外部程序执行。
- 未发现 `eval()` 或 `new Function()`。
- 未发现 `vault.delete`、`vault.trash`、`vault.rename`。
- 未发现遍历全库后批量修改 Markdown 的逻辑。
- 用户输入展示使用 `text` / `createDiv({ text })`，未发现直接插入 HTML 的 XSS 风险。

需要注意：

- 插件确实会修改 Markdown 文件 frontmatter，这是产品功能的一部分。
- 当前正文内容没有被整篇覆盖；正文初始内容仅在新建文件时写入。
- 最大的数据风险来自 frontmatter 字段删除，而不是正文覆盖。

## 建议修复优先级

1. 立即修复高危 frontmatter 删除逻辑，停止删除用户通用字段。
2. 增加最终日记路径校验，禁止 `.` / `..` 路径段，并避免写入非预期文件。
3. 给后台刷新和所有事件触发的 async 操作增加 `.catch()` 或 try/catch。
4. 改用 `contentEl` 或增加 DOM 容器存在性判断。
5. 统一设置变更后的刷新入口，避免 Memory Board 显示过期数据。

## 总体判断

当前 Everyday 插件没有发现恶意代码，也没有发现会稳定导致 Obsidian 整体崩溃的代码。

但保存逻辑存在高危数据损坏风险：它会删除用户日记 frontmatter 中的常见字段。建议在继续开发 MVP2/MVP3 前先修复该问题，并补充针对已有日记 YAML 字段保留的回归测试。
