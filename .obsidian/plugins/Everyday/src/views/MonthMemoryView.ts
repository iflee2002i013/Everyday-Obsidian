import { ItemView, Notice, WorkspaceLeaf, setIcon } from "obsidian";
import { VIEW_TYPE_MONTH_MEMORY } from "../constants";
import { DateService } from "../services/DateService";
import { DiaryStorageService } from "../services/DiaryStorageService";
import type { DiaryEntry } from "../types";

type OpenCapture = (date?: string) => void;
type OpenMemoryBoard = () => void | Promise<void>;

interface RenderOptions {
  scrollToToday?: boolean;
  behavior?: ScrollBehavior;
}

export class MonthMemoryView extends ItemView {
  private currentYear: number;
  private currentMonth: number;
  private headerResizeObserver: ResizeObserver | undefined;

  constructor(
    leaf: WorkspaceLeaf,
    private readonly storage: DiaryStorageService,
    private readonly openCapture: OpenCapture,
    private readonly openMemoryBoard: OpenMemoryBoard
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
    await this.render({ scrollToToday: true, behavior: "auto" });
  }

  async onClose(): Promise<void> {
    this.disconnectHeaderResizeObserver();
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
    await this.render({ scrollToToday: true, behavior: "smooth" });
  }

  async render(options: RenderOptions = {}): Promise<void> {
    const container = this.contentEl;
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

      this.renderList(body, entries);

      if (options.scrollToToday) {
        this.scrollTodayIntoView(options.behavior ?? "auto");
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

  private scrollTodayIntoView(behavior: ScrollBehavior): void {
    window.requestAnimationFrame(() => {
      const todayEl = this.contentEl.querySelector<HTMLElement>(".is-today");

      todayEl?.scrollIntoView({
        block: "center",
        inline: "nearest",
        behavior
      });
    });
  }

  private observeHeaderWrap(header: HTMLElement, nav: HTMLElement, actions: HTMLElement): void {
    this.disconnectHeaderResizeObserver();

    const updateHeaderWrapClass = () => {
      header.classList.toggle("is-actions-wrapped", actions.offsetTop > nav.offsetTop);
    };

    window.requestAnimationFrame(updateHeaderWrapClass);
    this.headerResizeObserver = new ResizeObserver(updateHeaderWrapClass);
    this.headerResizeObserver.observe(header);
  }

  private disconnectHeaderResizeObserver(): void {
    this.headerResizeObserver?.disconnect();
    this.headerResizeObserver = undefined;
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
    this.renderMemoryBoardButton(actions);

    const todayButton = actions.createEl("button", { text: "今天" });
    todayButton.addEventListener("click", () => {
      void this.goToCurrentMonth();
    });

    const captureButton = actions.createEl("button", {
      cls: "mod-cta",
      text: "快速记录"
    });
    captureButton.addEventListener("click", () => this.openCapture());

    this.observeHeaderWrap(header, nav, actions);
  }

  private renderMemoryBoardButton(container: HTMLElement): void {
    const button = container.createEl("button", {
      cls: "Everyday-memory-board-open",
      text: "Memory Board",
      attr: {
        "aria-label": "打开 Memory Board"
      }
    });
    button.addEventListener("click", async () => {
      await this.openMemoryBoard();
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

  private getEntrySummary(entry: DiaryEntry): string {
    if (entry.summary) {
      return entry.summary;
    }

    if (entry.exists) {
      return "已创建日记，点击打开";
    }

    return "未记录";
  }

  private async handlePrimaryAction(entry: DiaryEntry): Promise<void> {
    if (entry.exists) {
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

  private getPrimaryActionTitle(entry: DiaryEntry): string {
    if (entry.exists) {
      return "打开日记";
    }

    return "记录一句话";
  }
}
