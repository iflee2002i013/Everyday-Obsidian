import { ItemView, WorkspaceLeaf } from "obsidian";
import { VIEW_TYPE_MEMORY_BOARD } from "../constants";

type OpenCapture = () => void;

export class MemoryBoardView extends ItemView {
  private readonly monthCount = 6;

  constructor(
    leaf: WorkspaceLeaf,
    private readonly openCapture: OpenCapture
  ) {
    super(leaf);
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
    previousButton.disabled = true;

    const titleButton = nav.createEl("button", {
      cls: "Everyday-memory-board-title-button",
      text: "Memory Board",
      attr: { "aria-label": "选择年月" }
    });
    titleButton.disabled = true;

    const nextButton = nav.createEl("button", {
      cls: "Everyday-icon-button",
      attr: { "aria-label": "下一个时间段" }
    });
    nextButton.setText(">");
    nextButton.disabled = true;

    const actions = toolbar.createDiv({ cls: "Everyday-memory-board-actions" });
    const todayButton = actions.createEl("button", { text: "今天" });
    todayButton.disabled = true;

    const captureButton = actions.createEl("button", {
      cls: "mod-cta",
      text: "快速记录"
    });
    captureButton.addEventListener("click", () => this.openCapture());
  }

  private renderBlankGrid(container: HTMLElement): void {
    const scroll = container.createDiv({ cls: "Everyday-memory-board-scroll" });
    const grid = scroll.createDiv({ cls: "Everyday-memory-board-grid" });

    for (let index = 0; index < this.monthCount; index += 1) {
      const column = grid.createDiv({ cls: "Everyday-memory-month-column" });
      const header = column.createDiv({ cls: "Everyday-memory-month-header" });
      header.createDiv({
        cls: "Everyday-memory-month-title",
        text: `MONTH ${index + 1}`
      });
      header.createDiv({
        cls: "Everyday-memory-month-year",
        text: "Memory Board"
      });

      column.createDiv({ cls: "Everyday-memory-month-days" });
    }
  }
}
