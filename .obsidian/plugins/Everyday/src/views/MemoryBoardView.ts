import { ItemView, Notice, WorkspaceLeaf } from "obsidian";
import { VIEW_TYPE_MEMORY_BOARD } from "../constants";
import { DateService } from "../services/DateService";
import type { DiaryStorageService } from "../services/DiaryStorageService";
import type { DiaryEntry, MemoryBoardMonth, YearMonth } from "../types";

type OpenCapture = (date?: string) => void;

interface RangeTitleParts {
  primary: string;
  secondary?: string;
}

export class MemoryBoardView extends ItemView {
  private readonly monthCount = 6;
  private startYear: number;
  private startMonth: number;

  constructor(
    leaf: WorkspaceLeaf,
    private readonly storage: DiaryStorageService,
    private readonly openCapture: OpenCapture
  ) {
    super(leaf);

    const start = DateService.getHalfYearStart();
    this.startYear = start.year;
    this.startMonth = start.month;
  }

  getViewType(): string {
    return VIEW_TYPE_MEMORY_BOARD;
  }

  getDisplayText(): string {
    return "Memory Board";
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

  async goToPreviousPeriod(): Promise<void> {
    const start = DateService.addMonths(this.startYear, this.startMonth, -this.monthCount);
    this.startYear = start.year;
    this.startMonth = start.month;
    await this.render();
  }

  async goToNextPeriod(): Promise<void> {
    const start = DateService.addMonths(this.startYear, this.startMonth, this.monthCount);
    this.startYear = start.year;
    this.startMonth = start.month;
    await this.render();
  }

  async goToCurrentPeriod(): Promise<void> {
    const start = DateService.getHalfYearStart();
    this.startYear = start.year;
    this.startMonth = start.month;
    await this.render();
  }

  private async render(): Promise<void> {
    const container = this.containerEl.children[1] as HTMLElement;
    container.empty();
    container.addClass("Everyday-view");
    container.addClass("Everyday-memory-board");

    this.renderToolbar(container);
    const body = container.createDiv({ cls: "Everyday-memory-board-body" });

    try {
      const months = await this.loadMonths();
      this.renderGrid(body, months);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      body.createDiv({
        cls: "Everyday-error",
        text: `Memory Board 加载失败：${message}`
      });
      new Notice(`Memory Board load failed: ${message}`);
    }
  }

  private renderToolbar(container: HTMLElement): void {
    const toolbar = container.createDiv({ cls: "Everyday-memory-board-toolbar" });
    const nav = toolbar.createDiv({ cls: "Everyday-memory-board-nav" });

    const previousButton = nav.createEl("button", {
      cls: "Everyday-icon-button",
      attr: { "aria-label": "上一个时间段" }
    });
    previousButton.setText("<");
    previousButton.addEventListener("click", () => {
      void this.goToPreviousPeriod();
    });

    const titleButton = nav.createEl("button", {
      cls: "Everyday-memory-board-title-button",
      attr: { "aria-label": "选择年月" }
    });
    const titleParts = this.getRangeTitleParts();
    titleButton.createSpan({
      cls: "Everyday-memory-board-title-primary",
      text: titleParts.primary
    });

    if (titleParts.secondary) {
      titleButton.createSpan({
        cls: "Everyday-memory-board-title-secondary",
        text: titleParts.secondary
      });
    }

    titleButton.disabled = true;

    const nextButton = nav.createEl("button", {
      cls: "Everyday-icon-button",
      attr: { "aria-label": "下一个时间段" }
    });
    nextButton.setText(">");
    nextButton.addEventListener("click", () => {
      void this.goToNextPeriod();
    });

    const actions = toolbar.createDiv({ cls: "Everyday-memory-board-actions" });
    const todayButton = actions.createEl("button", { text: "今天" });
    todayButton.addEventListener("click", () => {
      void this.goToCurrentPeriod();
    });

    const captureButton = actions.createEl("button", {
      cls: "mod-cta",
      text: "快速记录"
    });
    captureButton.addEventListener("click", () => this.openCapture());
  }

  private renderGrid(container: HTMLElement, months: MemoryBoardMonth[]): void {
    const scroll = container.createDiv({ cls: "Everyday-memory-board-scroll" });
    const grid = scroll.createDiv({ cls: "Everyday-memory-board-grid" });

    for (const month of months) {
      const column = grid.createDiv({ cls: "Everyday-memory-month-column" });
      const header = column.createDiv({ cls: "Everyday-memory-month-header" });
      header.createDiv({
        cls: "Everyday-memory-month-title",
        text: DateService.monthLabel(month.year, month.month)
      });
      header.createDiv({
        cls: "Everyday-memory-month-year",
        text: String(month.year)
      });

      this.renderMonthDays(column.createDiv({ cls: "Everyday-memory-month-days" }), month);
    }
  }

  private renderMonthDays(container: HTMLElement, month: MemoryBoardMonth): void {
    const entriesByDay = new Map<number, DiaryEntry>();

    for (const entry of month.entries) {
      entriesByDay.set(Number(DateService.dayOfMonth(entry.date)), entry);
    }

    const daysInMonth = DateService.daysInMonth(month.year, month.month);

    for (let day = 1; day <= 31; day += 1) {
      if (day > daysInMonth) {
        container.createDiv({
          cls: "Everyday-memory-day-row is-invalid",
          attr: { "aria-hidden": "true" }
        });
        continue;
      }

      const dateText = this.formatDate(month.year, month.month, day);
      const entry = entriesByDay.get(day) ?? {
        date: dateText,
        filePath: "",
        exists: false
      };
      const row = container.createDiv({
        cls: this.getDayRowClass(entry),
        attr: {
          role: "button",
          tabindex: "0",
          title: "点击编辑一句话，Alt + 点击打开日记"
        }
      });
      row.addEventListener("click", (event) => {
        void this.handleDayClick(event, entry);
      });
      row.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          this.openCapture(entry.date);
        }
      });

      row.createDiv({
        cls: "Everyday-memory-day-date",
        text: String(day).padStart(2, "0")
      });
      row.createDiv({
        cls: "Everyday-memory-day-weekday",
        text: DateService.weekdayLabel(dateText)
      });
      row.createDiv({
        cls: "Everyday-memory-day-mood",
        text: entry.moodEmoji ?? ""
      });
      row.createDiv({
        cls: "Everyday-memory-day-summary",
        text: this.getEntrySummary(entry)
      });
    }
  }

  private async loadMonths(): Promise<MemoryBoardMonth[]> {
    const months: MemoryBoardMonth[] = [];

    for (const month of this.getDisplayedMonths()) {
      months.push({
        ...month,
        entries: await this.storage.getMonthEntries(month.year, month.month)
      });
    }

    return months;
  }

  private getDisplayedMonths(): YearMonth[] {
    return DateService.getMonthRange(this.startYear, this.startMonth, this.monthCount);
  }

  private getDayRowClass(entry: DiaryEntry): string {
    const classes = ["Everyday-memory-day-row"];

    if (!entry.exists || !entry.hasEverydayData) {
      classes.push("is-empty");
    }

    if (entry.exists && !entry.hasEverydayData) {
      classes.push("has-note");
    }

    if (entry.summary) {
      classes.push("has-summary");
    }

    if (entry.moodEmoji) {
      classes.push("has-mood");
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
      return "已创建日记";
    }

    return "";
  }

  private async handleDayClick(event: MouseEvent, entry: DiaryEntry): Promise<void> {
    if (event.altKey) {
      try {
        await this.storage.openDiaryFile(entry.date);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        new Notice(`Diary open failed: ${message}`);
      }
      return;
    }

    this.openCapture(entry.date);
  }

  private getRangeTitleParts(): RangeTitleParts {
    const months = this.getDisplayedMonths();
    const first = months[0];
    const last = months[months.length - 1];
    const firstMonth = DateService.monthNumberLabel(first.year, first.month);
    const lastMonth = DateService.monthNumberLabel(last.year, last.month);

    if (first.year === last.year) {
      const halfYearLabel = this.getHalfYearLabel(first.month, last.month);

      return {
        primary: `${first.year} 年`,
        secondary: halfYearLabel
          ? `${firstMonth} - ${lastMonth} · ${halfYearLabel}`
          : `${firstMonth} - ${lastMonth}`
      };
    }

    return {
      primary: `${first.year} 年 ${firstMonth} - ${last.year} 年 ${lastMonth}`
    };
  }

  private getHalfYearLabel(startMonth: number, endMonth: number): string | undefined {
    if (startMonth === 1 && endMonth === 6) {
      return "上半年";
    }

    if (startMonth === 7 && endMonth === 12) {
      return "下半年";
    }

    return undefined;
  }

  private formatDate(year: number, month: number, day: number): string {
    return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }
}
