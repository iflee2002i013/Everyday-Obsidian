import { Plugin, TAbstractFile, TFile, WorkspaceLeaf } from "obsidian";
import { VIEW_TYPE_MEMORY_BOARD, VIEW_TYPE_MONTH_MEMORY } from "./constants";
import { QuickCaptureModal } from "./modals/QuickCaptureModal";
import { DateService } from "./services/DateService";
import { DiaryStorageService } from "./services/DiaryStorageService";
import { EverydaySettingTab, normalizeSettings } from "./settings";
import type { DiaryEntry, EverydaySettings, MonthViewMode } from "./types";
import { MemoryBoardView } from "./views/MemoryBoardView";
import { MonthMemoryView } from "./views/MonthMemoryView";

export default class EverydayPlugin extends Plugin {
  settings: EverydaySettings;
  private storage: DiaryStorageService;
  private refreshTimer: number | undefined;

  async onload(): Promise<void> {
    await this.loadSettings();
    this.storage = new DiaryStorageService(this.app, this.settings);

    this.registerView(
      VIEW_TYPE_MONTH_MEMORY,
      (leaf) => new MonthMemoryView(
        leaf,
        this.storage,
        () => this.settings,
        (date) => this.openQuickCapture(date),
        (mode) => this.changeMonthViewMode(mode)
      )
    );

    this.registerView(
      VIEW_TYPE_MEMORY_BOARD,
      (leaf) => new MemoryBoardView(
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
      id: "open-memory-board",
      name: "Open Memory Board",
      callback: () => {
        void this.openMemoryBoard();
      }
    });

    this.addCommand({
      id: "capture-yesterdays-diary",
      name: "Capture yesterday's diary",
      callback: () => this.openQuickCapture(DateService.yesterdayString())
    });

    this.addSettingTab(new EverydaySettingTab(this.app, this));
    this.registerFileChangeRefreshEvents();
    this.register(() => {
      if (this.refreshTimer !== undefined) {
        window.clearTimeout(this.refreshTimer);
      }
    });
  }

  onunload(): void {
    this.app.workspace.detachLeavesOfType(VIEW_TYPE_MONTH_MEMORY);
    this.app.workspace.detachLeavesOfType(VIEW_TYPE_MEMORY_BOARD);
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

  async openMemoryBoard(): Promise<void> {
    let leaf: WorkspaceLeaf | undefined = this.app.workspace.getLeavesOfType(VIEW_TYPE_MEMORY_BOARD)[0];

    if (!leaf) {
      leaf = this.app.workspace.getLeaf("tab");
      await leaf.setViewState({
        type: VIEW_TYPE_MEMORY_BOARD,
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

  async refreshMemoryBoardViews(): Promise<void> {
    const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_MEMORY_BOARD);

    for (const leaf of leaves) {
      if (leaf.view instanceof MemoryBoardView) {
        await leaf.view.refresh();
      }
    }
  }

  async refreshOpenEverydayViews(): Promise<void> {
    await this.refreshMonthViews();
    await this.refreshMemoryBoardViews();
  }

  async changeMonthViewMode(mode: MonthViewMode): Promise<void> {
    this.settings.viewMode = mode;
    await this.saveSettings();
    await this.refreshMonthViews();
  }

  private async handleEntrySaved(_entry: DiaryEntry): Promise<void> {
    await this.refreshOpenEverydayViews();
  }

  private registerFileChangeRefreshEvents(): void {
    this.registerEvent(this.app.vault.on("modify", (file) => this.scheduleRefreshForFile(file)));
    this.registerEvent(this.app.vault.on("create", (file) => this.scheduleRefreshForFile(file)));
    this.registerEvent(this.app.vault.on("delete", (file) => this.scheduleRefreshForFile(file)));
    this.registerEvent(this.app.vault.on("rename", (file, oldPath) => {
      this.scheduleRefreshForFile(file);

      if (oldPath.endsWith(".md")) {
        this.scheduleEverydayViewsRefresh();
      }
    }));
    this.registerEvent(this.app.metadataCache.on("changed", (file) => this.scheduleRefreshForFile(file)));
  }

  private scheduleRefreshForFile(file: TAbstractFile): void {
    if (file instanceof TFile && file.extension === "md") {
      this.scheduleEverydayViewsRefresh();
    }
  }

  private scheduleEverydayViewsRefresh(): void {
    const hasOpenEverydayView =
      this.app.workspace.getLeavesOfType(VIEW_TYPE_MONTH_MEMORY).length > 0 ||
      this.app.workspace.getLeavesOfType(VIEW_TYPE_MEMORY_BOARD).length > 0;

    if (!hasOpenEverydayView) {
      return;
    }

    if (this.refreshTimer !== undefined) {
      window.clearTimeout(this.refreshTimer);
    }

    this.refreshTimer = window.setTimeout(() => {
      this.refreshTimer = undefined;
      void this.refreshOpenEverydayViews();
    }, 300);
  }
}
