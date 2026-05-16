import { App, PluginSettingTab, Setting } from "obsidian";
import { DEFAULT_MOODS, DEFAULT_SETTINGS } from "./constants";
import type EverydayPlugin from "./main";
import type { EverydaySettings, MonthViewMode, MoodOption, WeekStart } from "./types";

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

function readWeekStart(raw: Record<string, unknown>): WeekStart {
  return raw.weekStart === "sunday" ? "sunday" : "monday";
}

function readViewMode(raw: Record<string, unknown>): MonthViewMode {
  return raw.viewMode === "calendar" ? "calendar" : "list";
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
    defaultMoodId: moods.some((mood) => mood.id === defaultMoodId) ? defaultMoodId : DEFAULT_SETTINGS.defaultMoodId,
    weekStart: readWeekStart(raw),
    openNoteAfterSave: readBoolean(raw, "openNoteAfterSave", DEFAULT_SETTINGS.openNoteAfterSave),
    viewMode: readViewMode(raw),
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
        text
          .setPlaceholder(DEFAULT_SETTINGS.diaryFolder)
          .setValue(this.plugin.settings.diaryFolder)
          .onChange(async (value) => {
            this.plugin.settings.diaryFolder = value.trim() || DEFAULT_SETTINGS.diaryFolder;
            await this.plugin.saveSettings();
            await this.plugin.refreshMonthViews();
          });
      });

    new Setting(containerEl)
      .setName("使用年份子目录")
      .setDesc("开启后保存为 Diary/2026/2026-05-14.md。")
      .addToggle((toggle) => {
        toggle
          .setValue(this.plugin.settings.useYearSubfolders)
          .onChange(async (value) => {
            this.plugin.settings.useYearSubfolders = value;
            await this.plugin.saveSettings();
            await this.plugin.refreshMonthViews();
          });
      });

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
      .setName("月视图默认模式")
      .setDesc("列表更接近手帐；日历以格子展示每月概览。")
      .addDropdown((dropdown) => {
        dropdown
          .addOption("list", "列表")
          .addOption("calendar", "日历")
          .setValue(this.plugin.settings.viewMode)
          .onChange(async (value) => {
            this.plugin.settings.viewMode = value === "calendar" ? "calendar" : "list";
            await this.plugin.saveSettings();
            await this.plugin.refreshMonthViews();
          });
      });

    new Setting(containerEl)
      .setName("每周开始日")
      .setDesc("影响日历模式的列顺序。")
      .addDropdown((dropdown) => {
        dropdown
          .addOption("monday", "周一")
          .addOption("sunday", "周日")
          .setValue(this.plugin.settings.weekStart)
          .onChange(async (value) => {
            this.plugin.settings.weekStart = value === "sunday" ? "sunday" : "monday";
            await this.plugin.saveSettings();
            await this.plugin.refreshMonthViews();
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
