import { AbstractInputSuggest, App, PluginSettingTab, Setting } from "obsidian";
import { DEFAULT_MOODS, DEFAULT_SETTINGS } from "./constants";
import type EverydayPlugin from "./main";
import type { TFile, TFolder } from "obsidian";
import type { DiaryNameMode, EverydaySettings, MemoryBoardLayoutMode, MoodOption } from "./types";

const MAX_PATH_SUGGESTIONS = 30;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isMoodOption(value: unknown): value is MoodOption {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.id === "string" &&
    typeof value.label === "string" &&
    typeof value.emoji === "string" &&
    typeof value.score === "number" &&
    typeof value.color === "string"
  );
}

function cloneMoods(moods: MoodOption[]): MoodOption[] {
  return moods.map((mood) => ({ ...mood }));
}

function readString(raw: Record<string, unknown>, key: string, fallback: string): string {
  const value = raw[key];
  return typeof value === "string" ? value : fallback;
}

function readBoolean(raw: Record<string, unknown>, key: string, fallback: boolean): boolean {
  const value = raw[key];
  return typeof value === "boolean" ? value : fallback;
}

function readMemoryBoardLayoutMode(raw: Record<string, unknown>): MemoryBoardLayoutMode {
  return raw.memoryBoardLayoutMode === "quarter" ? "quarter" : "half-year";
}

function readDiaryNameMode(raw: Record<string, unknown>): DiaryNameMode {
  return raw.diaryNameMode === "daily-notes" ? "daily-notes" : "custom";
}

function normalizePathQuery(query: string): string {
  return query.trim().replace(/\\/g, "/").toLowerCase();
}

function sortPathSuggestions(paths: string[], query: string): string[] {
  const normalizedQuery = normalizePathQuery(query);

  return paths
    .filter((path) => {
      if (!normalizedQuery) {
        return true;
      }

      return path.toLowerCase().includes(normalizedQuery);
    })
    .sort((left, right) => {
      const leftPath = left.toLowerCase();
      const rightPath = right.toLowerCase();
      const leftStartsWith = normalizedQuery ? leftPath.startsWith(normalizedQuery) : false;
      const rightStartsWith = normalizedQuery ? rightPath.startsWith(normalizedQuery) : false;

      if (leftStartsWith !== rightStartsWith) {
        return leftStartsWith ? -1 : 1;
      }

      return left.localeCompare(right);
    })
    .slice(0, MAX_PATH_SUGGESTIONS);
}

abstract class VaultPathSuggest<T extends { path: string }> extends AbstractInputSuggest<T> {
  constructor(
    app: App,
    textInputEl: HTMLInputElement,
    private readonly onChoosePath: (path: string) => void | Promise<void>
  ) {
    super(app, textInputEl);
    this.limit = MAX_PATH_SUGGESTIONS;
  }

  protected async getSuggestions(query: string): Promise<T[]> {
    const items = this.getItems();
    const sortedPaths = sortPathSuggestions(items.map((item) => item.path), query);
    const itemByPath = new Map(items.map((item) => [item.path, item]));

    return sortedPaths
      .map((path) => itemByPath.get(path))
      .filter((item): item is T => item !== undefined);
  }

  renderSuggestion(value: T, el: HTMLElement): void {
    el.setText(value.path);
  }

  selectSuggestion(value: T): void {
    this.setValue(value.path);
    void this.onChoosePath(value.path);
  }

  protected abstract getItems(): T[];
}

class FolderPathSuggest extends VaultPathSuggest<TFolder> {
  protected getItems(): TFolder[] {
    return this.app.vault.getAllFolders(false);
  }
}

class MarkdownFilePathSuggest extends VaultPathSuggest<TFile> {
  protected getItems(): TFile[] {
    return this.app.vault.getMarkdownFiles();
  }
}

export function normalizeSettings(data: unknown): EverydaySettings {
  const raw = isRecord(data) ? data : {};
  const moods = Array.isArray(raw.moods) && raw.moods.every(isMoodOption)
    ? cloneMoods(raw.moods)
    : cloneMoods(DEFAULT_MOODS);

  const defaultMoodId = readString(raw, "defaultMoodId", DEFAULT_SETTINGS.defaultMoodId);

  return {
    diaryFolder: readString(raw, "diaryFolder", DEFAULT_SETTINGS.diaryFolder).trim() || DEFAULT_SETTINGS.diaryFolder,
    useYearSubfolders: readBoolean(raw, "useYearSubfolders", DEFAULT_SETTINGS.useYearSubfolders),
    diaryNameMode: readDiaryNameMode(raw),
    diaryNameFormat: readString(raw, "diaryNameFormat", DEFAULT_SETTINGS.diaryNameFormat).trim() || DEFAULT_SETTINGS.diaryNameFormat,
    defaultMoodId: moods.some((mood) => mood.id === defaultMoodId) ? defaultMoodId : DEFAULT_SETTINGS.defaultMoodId,
    openNoteAfterSave: readBoolean(raw, "openNoteAfterSave", DEFAULT_SETTINGS.openNoteAfterSave),
    memoryBoardLayoutMode: readMemoryBoardLayoutMode(raw),
    templateFilePath: readString(raw, "templateFilePath", DEFAULT_SETTINGS.templateFilePath).trim(),
    moods
  };
}

export class EverydaySettingTab extends PluginSettingTab {
  constructor(app: App, private readonly plugin: EverydayPlugin) {
    super(app, plugin);
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.addClass("Everyday-settings");

    containerEl.createEl("h2", { text: "Everyday" });

    new Setting(containerEl)
      .setName("日记保存目录")
      .setDesc("例如 Diary 或 日记。保存时会自动创建缺失目录。")
      .addText((text) => {
        new FolderPathSuggest(this.app, text.inputEl, async (path) => {
          this.plugin.settings.diaryFolder = path || DEFAULT_SETTINGS.diaryFolder;
          await this.plugin.saveSettings();
          await this.plugin.refreshOpenEverydayViews();
        });

        text
          .setPlaceholder(DEFAULT_SETTINGS.diaryFolder)
          .setValue(this.plugin.settings.diaryFolder)
          .onChange(async (value) => {
            this.plugin.settings.diaryFolder = value.trim() || DEFAULT_SETTINGS.diaryFolder;
            await this.plugin.saveSettings();
            await this.plugin.refreshOpenEverydayViews();
          });
      });

    new Setting(containerEl)
      .setName("使用年份子目录")
      .setDesc("使用自定义文件名格式时生效。开启后保存到 Diary/2026/。")
      .addToggle((toggle) => {
        toggle
          .setValue(this.plugin.settings.useYearSubfolders)
          .onChange(async (value) => {
            this.plugin.settings.useYearSubfolders = value;
            await this.plugin.saveSettings();
            await this.plugin.refreshOpenEverydayViews();
          });
      });

    new Setting(containerEl)
      .setName("日记命名方式")
      .setDesc("可以沿用 Obsidian 核心日记插件的文件夹和格式，也可以由 Everyday 自定义。")
      .addDropdown((dropdown) => {
        dropdown
          .addOption("daily-notes", "使用日记插件格式")
          .addOption("custom", "自定义格式")
          .setValue(this.plugin.settings.diaryNameMode)
          .onChange(async (value) => {
            this.plugin.settings.diaryNameMode = value === "daily-notes" ? "daily-notes" : "custom";
            await this.plugin.saveSettings();
            await this.plugin.refreshOpenEverydayViews();
            this.display();
          });
      });

    if (this.plugin.settings.diaryNameMode === "custom") {
      new Setting(containerEl)
        .setName("自定义日记文件名格式")
        .setDesc("使用 Moment.js 格式，例如 YYYY-MM-DD 或 YYYY/MM/YYYYMMDD。插件会自动补 .md。")
        .addText((text) => {
          text
            .setPlaceholder(DEFAULT_SETTINGS.diaryNameFormat)
            .setValue(this.plugin.settings.diaryNameFormat)
            .onChange(async (value) => {
              this.plugin.settings.diaryNameFormat = value.trim() || DEFAULT_SETTINGS.diaryNameFormat;
              await this.plugin.saveSettings();
              await this.plugin.refreshOpenEverydayViews();
            });
        });
    }

    new Setting(containerEl)
      .setName("默认心情")
      .setDesc("新建记录时默认选中的心情。")
      .addDropdown((dropdown) => {
        for (const mood of this.plugin.settings.moods) {
          dropdown.addOption(mood.id, `${mood.emoji} ${mood.label}`);
        }

        dropdown
          .setValue(this.plugin.settings.defaultMoodId)
          .onChange(async (value) => {
            this.plugin.settings.defaultMoodId = value;
            await this.plugin.saveSettings();
          });
      });

    new Setting(containerEl)
      .setName("Memory Board 排版模式")
      .setDesc("半年视图显示 6 个月；季度视图每页显示 3 个月。")
      .addDropdown((dropdown) => {
        dropdown
          .addOption("half-year", "半年视图（6 个月）")
          .addOption("quarter", "季度视图（3 个月）")
          .setValue(this.plugin.settings.memoryBoardLayoutMode)
          .onChange(async (value) => {
            this.plugin.settings.memoryBoardLayoutMode = value === "quarter" ? "quarter" : "half-year";
            await this.plugin.saveSettings();
            await this.plugin.refreshMemoryBoardViews();
          });
      });

    new Setting(containerEl)
      .setName("保存后自动打开日记")
      .setDesc("开启后，普通保存也会打开对应 Markdown 文件。")
      .addToggle((toggle) => {
        toggle
          .setValue(this.plugin.settings.openNoteAfterSave)
          .onChange(async (value) => {
            this.plugin.settings.openNoteAfterSave = value;
            await this.plugin.saveSettings();
          });
      });

    new Setting(containerEl)
      .setName("日记模板文件")
      .setDesc("可选。填写 vault 内 Markdown 模板路径，例如 Templates/daily.md。")
      .addText((text) => {
        new MarkdownFilePathSuggest(this.app, text.inputEl, async (path) => {
          this.plugin.settings.templateFilePath = path;
          await this.plugin.saveSettings();
        });

        text
          .setPlaceholder("Templates/daily.md")
          .setValue(this.plugin.settings.templateFilePath)
          .onChange(async (value) => {
            this.plugin.settings.templateFilePath = value.trim();
            await this.plugin.saveSettings();
          });
      });
  }
}
