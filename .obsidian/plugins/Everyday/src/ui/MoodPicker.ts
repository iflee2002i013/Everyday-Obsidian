import type { MoodOption } from "../types";

interface MoodPickerOptions {
  moods: MoodOption[];
  selectedMoodId: string;
  onChange: (moodId: string) => void;
}

export class MoodPicker {
  constructor(
    private readonly containerEl: HTMLElement,
    private readonly options: MoodPickerOptions
  ) {}

  render(): void {
    this.containerEl.empty();
    this.containerEl.addClass("Everyday-mood-picker");

    for (const mood of this.options.moods) {
      const button = this.containerEl.createEl("button", {
        cls: "Everyday-mood-option",
        type: "button"
      });
      button.style.setProperty("--Everyday-mood-color", mood.color);
      button.setAttribute("aria-pressed", mood.id === this.options.selectedMoodId ? "true" : "false");

      if (mood.id === this.options.selectedMoodId) {
        button.addClass("is-selected");
      }

      button.createSpan({ cls: "Everyday-mood-emoji", text: mood.emoji });
      button.createSpan({ cls: "Everyday-mood-label", text: mood.label });
      button.addEventListener("click", () => this.options.onChange(mood.id));
    }
  }
}
