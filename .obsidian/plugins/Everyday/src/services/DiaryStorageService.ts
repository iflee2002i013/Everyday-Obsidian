import { App, Notice, TFile, TFolder } from "obsidian";
import { DEFAULT_MOODS } from "../constants";
import type { DailyNotesSettings, DiaryEntry, EverydaySettings, MoodOption, SaveDiaryInput } from "../types";
import { applyTemplateVariables } from "../utils/markdown";
import { getDiaryFilePath, getDiaryFolderPathFromFilePath, normalizeVaultPath } from "../utils/path";
import { DateService } from "./DateService";

export class DiaryStorageService {
  constructor(
    private readonly app: App,
    private settings: EverydaySettings
  ) {}

  updateSettings(settings: EverydaySettings): void {
    this.settings = settings;
  }

  getDiaryFilePath(date: string): string {
    return getDiaryFilePath(date, this.settings, this.getDailyNotesSettings());
  }

  async ensureDiaryFolder(date: string): Promise<void> {
    await this.ensureFolderPath(getDiaryFolderPathFromFilePath(this.getDiaryFilePath(date)));
  }

  async getEntry(date: string): Promise<DiaryEntry> {
    const filePath = this.getDiaryFilePath(date);
    const abstractFile = this.app.vault.getAbstractFileByPath(filePath);

    if (!(abstractFile instanceof TFile)) {
      return {
        date,
        filePath,
        exists: false
      };
    }

    const frontmatter = this.getFrontmatter(abstractFile);
    const hasLegacyData = hasLegacyPluginData(frontmatter);
    const summary = readString(frontmatter, "summary") ?? readString(frontmatter, "summery");
    const moodLabel = readString(frontmatter, "mood_label");
    const moodEmoji = readString(frontmatter, "mood_emoji");
    const mood = this.getMoodIdFromFrontmatter(frontmatter, moodLabel, moodEmoji);

    return {
      date,
      filePath,
      exists: true,
      mood,
      moodLabel,
      moodEmoji,
      summary,
      hasEverydayData: Boolean(summary || hasLegacyData)
    };
  }

  async getMonthEntries(year: number, month: number): Promise<DiaryEntry[]> {
    const dates = DateService.monthDates(year, month);
    const entries: DiaryEntry[] = [];

    for (const date of dates) {
      entries.push(await this.getEntry(date));
    }

    return entries;
  }

  async saveEntry(input: SaveDiaryInput): Promise<DiaryEntry> {
    const summary = input.summary.trim();

    if (!summary) {
      throw new Error("Summary cannot be empty.");
    }

    const mood = this.getMood(input.moodId);
    const filePath = this.getDiaryFilePath(input.date);
    const abstractFile = this.app.vault.getAbstractFileByPath(filePath);
    let file: TFile;
    let created = false;

    if (abstractFile && !(abstractFile instanceof TFile)) {
      throw new Error(`Path is not a Markdown file: ${filePath}`);
    }

    if (abstractFile instanceof TFile) {
      file = abstractFile;
    } else {
      await this.ensureDiaryFolder(input.date);
      const initialContent = await this.buildInitialContent(input.date);
      file = await this.app.vault.create(filePath, initialContent);
      created = true;
    }

    await this.writeFrontmatter(file, input.date, summary, mood);

    return {
      date: input.date,
      filePath,
      exists: true,
      mood: mood.id,
      moodLabel: mood.label,
      moodEmoji: mood.emoji,
      summary,
      hasEverydayData: true,
      created
    };
  }

  async openDiaryFile(date: string): Promise<void> {
    const filePath = this.getDiaryFilePath(date);
    const abstractFile = this.app.vault.getAbstractFileByPath(filePath);

    if (!(abstractFile instanceof TFile)) {
      new Notice("Diary file not found.");
      return;
    }

    await this.app.workspace.getLeaf(false).openFile(abstractFile);
  }

  private getMood(moodId: string): MoodOption {
    return (
      this.settings.moods.find((mood) => mood.id === moodId) ??
      this.settings.moods.find((mood) => mood.id === this.settings.defaultMoodId) ??
      DEFAULT_MOODS[2]
    );
  }

  private async buildInitialContent(date: string): Promise<string> {
    const templateContent = await this.readTemplateContent();

    if (templateContent !== undefined) {
      return applyTemplateVariables(templateContent, date);
    }

    return `# ${date}

## 随记

`;
  }

  private async readTemplateContent(): Promise<string | undefined> {
    const templatePath = this.settings.templateFilePath.trim();

    if (!templatePath) {
      return undefined;
    }

    const normalizedPath = normalizeVaultPath(templatePath);
    const templateFile = this.app.vault.getAbstractFileByPath(normalizedPath);

    if (!(templateFile instanceof TFile)) {
      new Notice("Everyday template file not found. Using built-in template.");
      return undefined;
    }

    return this.app.vault.cachedRead(templateFile);
  }

  private async writeFrontmatter(file: TFile, _date: string, summary: string, mood: MoodOption): Promise<void> {
    await this.app.fileManager.processFrontMatter(file, (frontmatter) => {
      const shouldRemoveLegacyFields = hasLegacyPluginData(frontmatter);

      delete frontmatter.Everyday;
      delete frontmatter.mood;
      delete frontmatter.mood_score;
      delete frontmatter.summery;

      if (shouldRemoveLegacyFields) {
        delete frontmatter.date;
        delete frontmatter.created_at;
        delete frontmatter.updated_at;
      }

      frontmatter.mood_label = mood.label;
      frontmatter.mood_emoji = mood.emoji;
      frontmatter.summary = summary;
    });
  }

  private async ensureFolderPath(folderPath: string): Promise<void> {
    const parts = folderPath.split("/").filter(Boolean);
    let currentPath = "";

    for (const part of parts) {
      currentPath = currentPath ? `${currentPath}/${part}` : part;
      const existing = this.app.vault.getAbstractFileByPath(currentPath);

      if (existing instanceof TFolder) {
        continue;
      }

      if (existing) {
        throw new Error(`Cannot create diary folder because a file exists at ${currentPath}.`);
      }

      await this.app.vault.createFolder(currentPath);
    }
  }

  private getFrontmatter(file: TFile): Record<string, unknown> | undefined {
    return this.app.metadataCache.getFileCache(file)?.frontmatter as Record<string, unknown> | undefined;
  }

  private getDailyNotesSettings(): DailyNotesSettings | undefined {
    const appWithInternalPlugins = this.app as unknown as {
      internalPlugins?: {
        plugins?: Record<string, unknown>;
      };
    };
    const dailyNotesPlugin = appWithInternalPlugins.internalPlugins?.plugins?.["daily-notes"];

    if (!isRecord(dailyNotesPlugin)) {
      return undefined;
    }

    const instance = isRecord(dailyNotesPlugin.instance) ? dailyNotesPlugin.instance : undefined;
    const options = isRecord(instance?.options) ? instance.options : undefined;

    if (!options) {
      return undefined;
    }

    return {
      folder: readString(options, "folder"),
      format: readString(options, "format")
    };
  }

  private getMoodIdFromFrontmatter(
    frontmatter: Record<string, unknown> | undefined,
    moodLabel: string | undefined,
    moodEmoji: string | undefined
  ): string | undefined {
    const legacyMoodId = readString(frontmatter, "mood");

    if (legacyMoodId && this.settings.moods.some((mood) => mood.id === legacyMoodId)) {
      return legacyMoodId;
    }

    return this.settings.moods.find((mood) => mood.label === moodLabel || mood.emoji === moodEmoji)?.id;
  }
}

function readString(frontmatter: Record<string, unknown> | undefined, key: string): string | undefined {
  const value = frontmatter?.[key];
  return typeof value === "string" ? value : undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function hasLegacyPluginData(frontmatter: Record<string, unknown> | undefined): boolean {
  if (!frontmatter) {
    return false;
  }

  return (
    frontmatter.Everyday === true ||
    typeof frontmatter.mood_score === "number" ||
    (
      typeof frontmatter.mood === "string" &&
      (typeof frontmatter.summary === "string" || typeof frontmatter.mood_label === "string" || typeof frontmatter.mood_emoji === "string")
    )
  );
}
