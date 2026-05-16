import type { EverydaySettings, MoodOption } from "./types";

export const VIEW_TYPE_MONTH_MEMORY = "Everyday-month-view";

export const EVERYDAY_BLOCK_START = "<!-- Everyday:start -->";
export const EVERYDAY_BLOCK_END = "<!-- Everyday:end -->";

export const DEFAULT_MOODS: MoodOption[] = [
  {
    id: "happy",
    label: "开心",
    emoji: "😄",
    score: 5,
    color: "#f6c453"
  },
  {
    id: "calm",
    label: "平静",
    emoji: "🙂",
    score: 4,
    color: "#8fcf8f"
  },
  {
    id: "normal",
    label: "普通",
    emoji: "😐",
    score: 3,
    color: "#b8b8b8"
  },
  {
    id: "sad",
    label: "低落",
    emoji: "😔",
    score: 2,
    color: "#7fa7d9"
  },
  {
    id: "awful",
    label: "崩溃",
    emoji: "😫",
    score: 1,
    color: "#d98282"
  },
  {
    id: "thinking",
    label: "思考",
    emoji: "🤔",
    score: 3,
    color: "#b49ddb"
  }
];

export const DEFAULT_SETTINGS: EverydaySettings = {
  diaryFolder: "Diary",
  useYearSubfolders: true,
  defaultMoodId: "normal",
  weekStart: "monday",
  openNoteAfterSave: false,
  viewMode: "list",
  templateFilePath: "",
  moods: DEFAULT_MOODS
};
