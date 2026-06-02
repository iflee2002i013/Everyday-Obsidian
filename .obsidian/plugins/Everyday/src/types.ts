export interface MoodOption {
  id: string;
  label: string;
  emoji: string;
  score: number;
  color: string;
}

export type MemoryBoardLayoutMode = "half-year" | "quarter";

export type DiaryNameMode = "daily-notes" | "custom";

export interface YearMonth {
  year: number;
  month: number;
}

export interface EverydaySettings {
  diaryFolder: string;
  useYearSubfolders: boolean;
  diaryNameMode: DiaryNameMode;
  diaryNameFormat: string;
  defaultMoodId: string;
  openNoteAfterSave: boolean;
  memoryBoardLayoutMode: MemoryBoardLayoutMode;
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

export interface MemoryBoardMonth extends YearMonth {
  entries: DiaryEntry[];
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
