export interface MoodOption {
  id: string;
  label: string;
  emoji: string;
  score: number;
  color: string;
}

export type WeekStart = "monday" | "sunday";

export type MonthViewMode = "list" | "calendar";

export type DiaryNameMode = "daily-notes" | "custom";

export interface EverydaySettings {
  diaryFolder: string;
  useYearSubfolders: boolean;
  diaryNameMode: DiaryNameMode;
  diaryNameFormat: string;
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

export interface DailyNotesSettings {
  folder?: string;
  format?: string;
}
