import { ItemView, WorkspaceLeaf } from "obsidian";
import { VIEW_TYPE_MEMORY_BOARD } from "../constants";
import { DateService } from "../services/DateService";
import type { YearMonth } from "../types";

type OpenCapture = () => void;

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
    this.renderBlankGrid(container);
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

  private renderBlankGrid(container: HTMLElement): void {
    const scroll = container.createDiv({ cls: "Everyday-memory-board-scroll" });
    const grid = scroll.createDiv({ cls: "Everyday-memory-board-grid" });
    const months = this.getDisplayedMonths();

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

      column.createDiv({ cls: "Everyday-memory-month-days" });
    }
  }

  private getDisplayedMonths(): YearMonth[] {
    return DateService.getMonthRange(this.startYear, this.startMonth, this.monthCount);
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
}
