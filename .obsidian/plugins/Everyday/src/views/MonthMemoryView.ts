import { ItemView, Notice, WorkspaceLeaf, setIcon } from "obsidian";
import { VIEW_TYPE_MONTH_MEMORY } from "../constants";
import { DateService } from "../services/DateService";
import { DiaryStorageService } from "../services/DiaryStorageService";
import type { DiaryEntry, EverydaySettings, MonthViewMode } from "../types";

type OpenCapture = (date?: string) => void;
type ChangeViewMode = (mode: MonthViewMode) => void | Promise<void>;

export class MonthMemoryView extends ItemView {
  private currentYear: number;
  private currentMonth: number;

  constructor(
    leaf: WorkspaceLeaf,
    private readonly storage: DiaryStorageService,
    private readonly getSettings: () => EverydaySettings,
    private readonly openCapture: OpenCapture,
    private readonly changeViewMode: ChangeViewMode
  ) {
    super(leaf);

    const today = new Date();
    this.currentYear = today.getFullYear();
    this.currentMonth = today.getMonth() + 1;
  }

  getViewType(): string {
    return VIEW_TYPE_MONTH_MEMORY;
  }

  getDisplayText(): string {
    return "Everyday";
  }

  getIcon(): string {
    return "calendar-days";
  }

  async onOpen(): Promise<void> {
    await this.render();
  }

  async refresh(): Promise<void> {
    await this.render();
  }

  async goToPreviousMonth(): Promise<void> {
    const next = DateService.clampMonth(this.currentYear, this.currentMonth - 1);
    this.currentYear = next.year;
    this.currentMonth = next.month;
    await this.render();
  }

  async goToNextMonth(): Promise<void> {
    const next = DateService.clampMonth(this.currentYear, this.currentMonth + 1);
    this.currentYear = next.year;
    this.currentMonth = next.month;
    await this.render();
  }

  async goToCurrentMonth(): Promise<void> {
    const today = new Date();
    this.currentYear = today.getFullYear();
    this.currentMonth = today.getMonth() + 1;
    await this.render();
  }

  async render(): Promise<void> {
    const container = this.containerEl.children[1] as HTMLElement;
    container.empty();
    container.addClass("Everyday-view");

    this.renderHeader(container);

    const body = container.createDiv({ cls: "Everyday-body" });
    body.createDiv({
      cls: "Everyday-month-title",
      text: DateService.monthTitle(this.currentYear, this.currentMonth)
    });

    try {
      const entries = await this.storage.getMonthEntries(this.currentYear, this.currentMonth);

      if (this.getSettings().viewMode === "calendar") {
        this.renderCalendar(body, entries);
      } else {
        this.renderList(body, entries);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      body.createDiv({
        cls: "Everyday-error",
        text: `月度看板加载失败：${message}`
      });
      new Notice(`Everyday load failed: ${message}`);
    }
  }

  private renderHeader(container: HTMLElement): void {
    const header = container.createDiv({ cls: "Everyday-header" });
    const nav = header.createDiv({ cls: "Everyday-nav" });

    const previousButton = nav.createEl("button", {
      cls: "Everyday-icon-button",
      attr: { "aria-label": "上个月" }
    });
    previousButton.setText("<");
    previousButton.addEventListener("click", () => {
      void this.goToPreviousMonth();
    });

    nav.createDiv({
      cls: "Everyday-current-month",
      text: DateService.monthHeading(this.currentYear, this.currentMonth)
    });

    const nextButton = nav.createEl("button", {
      cls: "Everyday-icon-button",
      attr: { "aria-label": "下个月" }
    });
    nextButton.setText(">");
    nextButton.addEventListener("click", () => {
      void this.goToNextMonth();
    });

    const actions = header.createDiv({ cls: "Everyday-header-actions" });
    this.renderModeToggleButton(actions);

    const todayButton = actions.createEl("button", { text: "今天" });
    todayButton.addEventListener("click", () => {
      void this.goToCurrentMonth();
    });

    const captureButton = actions.createEl("button", {
      cls: "mod-cta",
      text: "快速记录"
    });
    captureButton.addEventListener("click", () => this.openCapture());
  }

  private renderModeToggleButton(container: HTMLElement): void {
    const currentMode = this.getSettings().viewMode;
    const nextMode: MonthViewMode = currentMode === "calendar" ? "list" : "calendar";
    const label = currentMode === "calendar" ? "列表" : "日历";
    const button = container.createEl("button", {
      cls: "Everyday-view-mode-toggle",
      text: label,
      attr: {
        "aria-label": `切换到${label}模式`
      }
    });
    button.addEventListener("click", async () => {
      await this.changeViewMode(nextMode);
    });
  }

  private renderList(container: HTMLElement, entries: DiaryEntry[]): void {
    const list = container.createDiv({ cls: "Everyday-list" });

    for (const entry of entries) {
      const row = list.createDiv({
        cls: this.getDayRowClass(entry),
        attr: {
          role: "button",
          tabindex: "0",
          title: this.getPrimaryActionTitle(entry)
        }
      });
      row.addEventListener("click", () => {
        void this.handlePrimaryAction(entry);
      });
      row.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          void this.handlePrimaryAction(entry);
        }
      });

      row.createDiv({
        cls: "Everyday-day-number",
        text: DateService.dayOfMonth(entry.date)
      });
      row.createDiv({
        cls: "Everyday-weekday",
        text: DateService.weekdayLabel(entry.date)
      });
      row.createDiv({
        cls: "Everyday-mood-pill",
        text: entry.moodEmoji ?? ""
      });
      row.createDiv({
        cls: "Everyday-summary",
        text: this.getEntrySummary(entry)
      });

      if (entry.exists) {
        const editButton = row.createEl("button", {
          cls: "Everyday-entry-action",
          attr: { "aria-label": "编辑一句话" }
        });
        editButton.title = "编辑一句话";
        setIcon(editButton, "pencil");
        editButton.addEventListener("click", (event) => {
          event.stopPropagation();
          this.openCapture(entry.date);
        });
      }
    }
  }

  private renderCalendar(container: HTMLElement, entries: DiaryEntry[]): void {
    const settings = this.getSettings();
    const weekdays = settings.weekStart === "sunday"
      ? ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
      : ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const calendar = container.createDiv({ cls: "Everyday-calendar" });
    const header = calendar.createDiv({ cls: "Everyday-calendar-weekdays" });

    for (const weekday of weekdays) {
      header.createDiv({
        cls: "Everyday-calendar-weekday",
        text: weekday
      });
    }

    const grid = calendar.createDiv({ cls: "Everyday-calendar-grid" });
    const firstDay = new Date(this.currentYear, this.currentMonth - 1, 1).getDay();
    const offset = settings.weekStart === "sunday" ? firstDay : (firstDay + 6) % 7;

    for (let index = 0; index < offset; index += 1) {
      grid.createDiv({ cls: "Everyday-calendar-cell is-blank" });
    }

    for (const entry of entries) {
      const cell = grid.createDiv({
        cls: this.getCalendarCellClass(entry),
        attr: {
          role: "button",
          tabindex: "0",
          title: this.getPrimaryActionTitle(entry)
        }
      });
      cell.addEventListener("click", () => {
        void this.handlePrimaryAction(entry);
      });
      cell.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          void this.handlePrimaryAction(entry);
        }
      });

      const top = cell.createDiv({ cls: "Everyday-calendar-cell-top" });
      top.createSpan({
        cls: "Everyday-calendar-day",
        text: String(Number(DateService.dayOfMonth(entry.date)))
      });
      top.createSpan({
        cls: "Everyday-calendar-mood",
        text: entry.moodEmoji ?? ""
      });

      cell.createDiv({
        cls: "Everyday-calendar-summary",
        text: this.truncate(this.getEntrySummary(entry), 20)
      });
    }
  }

  private getDayRowClass(entry: DiaryEntry): string {
    const classes = ["Everyday-day-row"];

    if (!entry.exists || !entry.hasEverydayData) {
      classes.push("is-empty");
    }

    if (DateService.isToday(entry.date)) {
      classes.push("is-today");
    }

    return classes.join(" ");
  }

  private getCalendarCellClass(entry: DiaryEntry): string {
    const classes = ["Everyday-calendar-cell"];

    if (!entry.exists || !entry.hasEverydayData) {
      classes.push("is-empty");
    }

    if (DateService.isToday(entry.date)) {
      classes.push("is-today");
    }

    return classes.join(" ");
  }

  private getEntrySummary(entry: DiaryEntry): string {
    if (entry.summary) {
      return entry.summary;
    }

    if (entry.exists) {
      return "已创建日记，点击打开";
    }

    return "未记录";
  }

  private truncate(value: string, maxLength: number): string {
    return value.length > maxLength ? `${value.slice(0, maxLength)}...` : value;
  }

  private async handlePrimaryAction(entry: DiaryEntry): Promise<void> {
    if (entry.exists) {
      await this.storage.openDiaryFile(entry.date);
      return;
    }

    this.openCapture(entry.date);
  }

  private getPrimaryActionTitle(entry: DiaryEntry): string {
    if (entry.exists) {
      return "打开日记";
    }

    return "记录一句话";
  }
}
