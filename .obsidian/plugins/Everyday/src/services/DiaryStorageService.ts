import { App, Notice, TFile, TFolder } from "obsidian";
import { DEFAULT_MOODS } from "../constants";
import type { DiaryEntry, EverydaySettings, MoodOption, SaveDiaryInput } from "../types";
import { applyTemplateVariables, buildManagedBlock, extractSummaryFromManagedBlock, updateManagedBlock } from "../utils/markdown";
import { getDiaryFilePath, getDiaryFolderPath, normalizeVaultPath } from "../utils/path";
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
    return getDiaryFilePath(date, this.settings);
  }

  async ensureDiaryFolder(date: string): Promise<void> {
    await this.ensureFolderPath(getDiaryFolderPath(date, this.settings));
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
    const content = await this.app.vault.cachedRead(abstractFile);
    const summary = readString(frontmatter, "summary") ?? extractSummaryFromManagedBlock(content);
    const mood = readString(frontmatter, "mood");

    return {
      date,
      filePath,
      exists: true,
      mood,
      moodLabel: readString(frontmatter, "mood_label"),
      moodEmoji: readString(frontmatter, "mood_emoji"),
      moodScore: readNumber(frontmatter, "mood_score"),
      summary,
      hasEverydayData: readBoolean(frontmatter, "Everyday") || Boolean(summary || mood)
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
      const initialContent = await this.buildInitialContent(input.date, summary, mood);
      file = await this.app.vault.create(filePath, initialContent);
      created = true;
    }

    await this.writeFrontmatter(file, input.date, summary, mood);
    await this.writeManagedBlock(file, summary, mood);

    return {
      date: input.date,
      filePath,
      exists: true,
      mood: mood.id,
      moodLabel: mood.label,
      moodEmoji: mood.emoji,
      moodScore: mood.score,
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

  private async buildInitialContent(date: string, summary: string, mood: MoodOption): Promise<string> {
    const templateContent = await this.readTemplateContent();
    const block = buildManagedBlock(summary, mood);

    if (templateContent !== undefined) {
      return updateManagedBlock(applyTemplateVariables(templateContent, date), block);
    }

    return `# ${date}

${block}

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

  private async writeFrontmatter(file: TFile, date: string, summary: string, mood: MoodOption): Promise<void> {
    const now = new Date().toISOString();

    await this.app.fileManager.processFrontMatter(file, (frontmatter) => {
      frontmatter.Everyday = true;
      frontmatter.date = date;
      frontmatter.mood = mood.id;
      frontmatter.mood_label = mood.label;
      frontmatter.mood_emoji = mood.emoji;
      frontmatter.mood_score = mood.score;
      frontmatter.summary = summary;

      if (!frontmatter.created_at) {
        frontmatter.created_at = now;
      }

      frontmatter.updated_at = now;
    });
  }

  private async writeManagedBlock(file: TFile, summary: string, mood: MoodOption): Promise<void> {
    const content = await this.app.vault.read(file);
    const nextContent = updateManagedBlock(content, buildManagedBlock(summary, mood));

    if (nextContent !== content) {
      await this.app.vault.modify(file, nextContent);
    }
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
}

function readString(frontmatter: Record<string, unknown> | undefined, key: string): string | undefined {
  const value = frontmatter?.[key];
  return typeof value === "string" ? value : undefined;
}

function readNumber(frontmatter: Record<string, unknown> | undefined, key: string): number | undefined {
  const value = frontmatter?.[key];
  return typeof value === "number" ? value : undefined;
}

function readBoolean(frontmatter: Record<string, unknown> | undefined, key: string): boolean {
  return frontmatter?.[key] === true;
}
