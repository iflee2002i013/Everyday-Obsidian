export interface MoodOption {
  id: string;
  label: string;
  emoji: string;
  score: number;
  color: string;
}

export type WeekStart = "monday" | "sunday";

export type MonthViewMode = "list" | "calendar";

export interface EverydaySettings {
  diaryFolder: string;
  useYearSubfolders: boolean;
  defaultMoodId: string;
  weekStart: WeekStart;
  openNoteAfterSave: boolean;
  viewMode: MonthViewMode;
  templateFilePath: string;
  moods: MoodOption[];
}

export interface DiaryEntry {
  date: string;
  filePath: string;
  exists: boolean;
  mood?: string;
  moodLabel?: string;
  moodEmoji?: string;
  summary?: string;
  hasEverydayData?: boolean;
  created?: boolean;
}

export interface SaveDiaryInput {
  date: string;
  summary: string;
  moodId: string;
}
