import { Plugin, WorkspaceLeaf } from "obsidian";
import { VIEW_TYPE_MONTH_MEMORY } from "./constants";
import { QuickCaptureModal } from "./modals/QuickCaptureModal";
import { DateService } from "./services/DateService";
import { DiaryStorageService } from "./services/DiaryStorageService";
import { EverydaySettingTab, normalizeSettings } from "./settings";
import type { DiaryEntry, EverydaySettings } from "./types";
import { MonthMemoryView } from "./views/MonthMemoryView";

export default class EverydayPlugin extends Plugin {
  settings: EverydaySettings;
  private storage: DiaryStorageService;

  async onload(): Promise<void> {
    await this.loadSettings();
    this.storage = new DiaryStorageService(this.app, this.settings);

    this.registerView(
      VIEW_TYPE_MONTH_MEMORY,
      (leaf) => new MonthMemoryView(
        leaf,
        this.storage,
        () => this.settings,
        (date) => this.openQuickCapture(date)
      )
    );

    this.addRibbonIcon("calendar-days", "Open monthly memory board", () => {
      void this.openMonthView();
    });

    this.addCommand({
      id: "open-quick-diary-capture",
      name: "Open quick diary capture",
      callback: () => this.openQuickCapture()
    });

    this.addCommand({
      id: "open-monthly-memory-board",
      name: "Open monthly memory board",
      callback: () => {
        void this.openMonthView();
      }
    });

    this.addCommand({
      id: "capture-yesterdays-diary",
      name: "Capture yesterday's diary",
      callback: () => this.openQuickCapture(DateService.yesterdayString())
    });

    this.addSettingTab(new EverydaySettingTab(this.app, this));
  }

  onunload(): void {
    this.app.workspace.detachLeavesOfType(VIEW_TYPE_MONTH_MEMORY);
  }

  async loadSettings(): Promise<void> {
    this.settings = normalizeSettings(await this.loadData());
  }

  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
    this.storage?.updateSettings(this.settings);
  }

  openQuickCapture(initialDate?: string): void {
    new QuickCaptureModal(
      this.app,
      this.storage,
      this.settings,
      initialDate ?? DateService.todayString(),
      async (entry) => this.handleEntrySaved(entry)
    ).open();
  }

  async openMonthView(): Promise<void> {
    let leaf: WorkspaceLeaf | undefined = this.app.workspace.getLeavesOfType(VIEW_TYPE_MONTH_MEMORY)[0];

    if (!leaf) {
      leaf = this.app.workspace.getRightLeaf(false) ?? this.app.workspace.getLeaf(true);
      await leaf.setViewState({
        type: VIEW_TYPE_MONTH_MEMORY,
        active: true
      });
    }

    this.app.workspace.revealLeaf(leaf);
  }

  async refreshMonthViews(): Promise<void> {
    const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_MONTH_MEMORY);

    for (const leaf of leaves) {
      if (leaf.view instanceof MonthMemoryView) {
        await leaf.view.refresh();
      }
    }
  }

  private async handleEntrySaved(_entry: DiaryEntry): Promise<void> {
    await this.refreshMonthViews();
  }
}
