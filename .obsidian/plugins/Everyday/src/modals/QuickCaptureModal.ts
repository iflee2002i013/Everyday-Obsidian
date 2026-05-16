import { App, Modal, Notice, Setting } from "obsidian";
import type { DiaryEntry, EverydaySettings } from "../types";
import { DateService } from "../services/DateService";
import { DiaryStorageService } from "../services/DiaryStorageService";
import { MoodPicker } from "../ui/MoodPicker";

export class QuickCaptureModal extends Modal {
  private selectedDate: string;
  private selectedMoodId: string;
  private summary = "";
  private loadedEntry?: DiaryEntry;

  constructor(
    app: App,
    private readonly storage: DiaryStorageService,
    private readonly settings: EverydaySettings,
    initialDate: string = DateService.todayString(),
    private readonly onSaved?: (entry: DiaryEntry) => void | Promise<void>
  ) {
    super(app);
    this.selectedDate = initialDate;
    this.selectedMoodId = settings.defaultMoodId;
  }

  async onOpen(): Promise<void> {
    this.contentEl.addClass("Everyday-capture-modal");
    await this.loadEntry(this.selectedDate);
    this.render();
  }

  onClose(): void {
    this.contentEl.empty();
    this.contentEl.removeClass("Everyday-capture-modal");
  }

  private render(): void {
    const { contentEl } = this;
    contentEl.empty();

    contentEl.createEl("h2", { text: "快速记录" });

    const formEl = contentEl.createDiv({ cls: "Everyday-capture-form" });

    new Setting(formEl)
      .setName("日期")
      .addText((text) => {
        text.inputEl.type = "date";
        text.setValue(this.selectedDate);
        text.onChange(async (value) => {
          if (!value || value === this.selectedDate) {
            return;
          }

          this.selectedDate = value;
          await this.loadEntry(value);
          this.render();
        });
      });

    const summaryGroup = formEl.createDiv({ cls: "Everyday-form-group" });
    summaryGroup.createEl("label", {
      cls: "Everyday-form-label",
      text: "一句话"
    });
    const textarea = summaryGroup.createEl("textarea", {
      cls: "Everyday-summary-input",
      attr: {
        placeholder: "今天怎么样？",
        rows: "4"
      }
    });
    textarea.value = this.summary;
    textarea.addEventListener("input", () => {
      this.summary = textarea.value;
    });
    textarea.focus();

    const moodGroup = formEl.createDiv({ cls: "Everyday-form-group" });
    moodGroup.createEl("div", {
      cls: "Everyday-form-label",
      text: "心情"
    });
    const moodPickerEl = moodGroup.createDiv();
    new MoodPicker(moodPickerEl, {
      moods: this.settings.moods,
      selectedMoodId: this.selectedMoodId,
      onChange: (moodId) => {
        this.selectedMoodId = moodId;
        this.render();
      }
    }).render();

    if (this.loadedEntry?.exists && !this.loadedEntry.hasEverydayData) {
      formEl.createDiv({
        cls: "Everyday-form-hint",
        text: "这一天已经有 Markdown 文件，但还没有 Everyday 一句话记录。保存时会只添加插件管理区域。"
      });
    }

    const actions = formEl.createDiv({ cls: "Everyday-capture-actions" });
    const saveButton = actions.createEl("button", {
      cls: "mod-cta",
      text: "保存"
    });
    saveButton.addEventListener("click", () => {
      void this.save(false);
    });

    const saveOpenButton = actions.createEl("button", {
      text: "保存并打开日记"
    });
    saveOpenButton.addEventListener("click", () => {
      void this.save(true);
    });

    const cancelButton = actions.createEl("button", {
      text: "取消"
    });
    cancelButton.addEventListener("click", () => this.close());
  }

  private async loadEntry(date: string): Promise<void> {
    this.loadedEntry = await this.storage.getEntry(date);
    this.summary = this.loadedEntry.summary ?? "";
    this.selectedMoodId = this.loadedEntry.mood ?? this.settings.defaultMoodId;
  }

  private async save(openAfterSave: boolean): Promise<void> {
    const summary = this.summary.trim();

    if (!summary) {
      new Notice("Summary cannot be empty.");
      return;
    }

    if (!this.selectedMoodId) {
      new Notice("Please choose a mood.");
      return;
    }

    try {
      const entry = await this.storage.saveEntry({
        date: this.selectedDate,
        summary,
        moodId: this.selectedMoodId
      });

      new Notice(entry.created ? "Diary saved" : "Diary updated");
      await this.onSaved?.(entry);
      this.close();

      if (openAfterSave || this.settings.openNoteAfterSave) {
        await this.storage.openDiaryFile(entry.date);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      new Notice(`Diary save failed: ${message}`);
    }
  }
}
