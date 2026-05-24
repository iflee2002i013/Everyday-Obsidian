import { moment, normalizePath } from "obsidian";
import type { DailyNotesSettings, EverydaySettings } from "../types";

function cleanPathSegment(path: string, context: string): string {
  const parts = path
    .replace(/\\/g, "/")
    .split("/")
    .map((part) => part.trim())
    .filter(Boolean);

  assertSafeVaultPathParts(parts, context);

  return parts.join("/");
}

function assertSafeVaultPathParts(parts: string[], context: string): void {
  if (parts.some((part) => part === "." || part === "..")) {
    throw new Error(`Unsafe ${context}: "." and ".." path segments are not allowed.`);
  }
}

export function getDiaryFolderPath(date: string, settings: EverydaySettings): string {
  const baseFolder = cleanPathSegment(settings.diaryFolder, "diary folder") || "Diary";
  const year = date.slice(0, 4);
  const folder = settings.useYearSubfolders ? `${baseFolder}/${year}` : baseFolder;
  return normalizePath(folder);
}

export function getDiaryFolderPathFromFilePath(filePath: string): string {
  const normalizedPath = normalizePath(filePath);
  const lastSlashIndex = normalizedPath.lastIndexOf("/");
  return lastSlashIndex >= 0 ? normalizedPath.slice(0, lastSlashIndex) : "";
}

export function getDiaryFilePath(
  date: string,
  settings: EverydaySettings,
  dailyNotesSettings?: DailyNotesSettings
): string {
  if (settings.diaryNameMode === "daily-notes") {
    return getDailyNotesFilePath(date, settings, dailyNotesSettings);
  }

  const filename = cleanPathSegment(
    ensureMarkdownExtension(formatDiaryName(date, settings.diaryNameFormat || "YYYY-MM-DD")),
    "diary filename format"
  );
  return normalizePath(`${getDiaryFolderPath(date, settings)}/${ensureMarkdownExtension(filename)}`);
}

export function normalizeVaultPath(path: string): string {
  return normalizePath(cleanPathSegment(path, "vault path"));
}

function getDailyNotesFilePath(
  date: string,
  settings: EverydaySettings,
  dailyNotesSettings?: DailyNotesSettings
): string {
  const format = dailyNotesSettings?.format?.trim() || settings.diaryNameFormat || "YYYY-MM-DD";
  const configuredFolder = dailyNotesSettings?.folder?.trim();
  const folder = configuredFolder !== undefined
    ? cleanPathSegment(configuredFolder, "Daily Notes folder")
    : getDiaryFolderPath(date, settings);
  const filename = cleanPathSegment(
    ensureMarkdownExtension(formatDiaryName(date, format)),
    "Daily Notes format"
  );

  return normalizePath(folder ? `${folder}/${filename}` : filename);
}

function formatDiaryName(date: string, format: string): string {
  const parsedDate = moment(date, "YYYY-MM-DD", true);
  return parsedDate.isValid() ? parsedDate.format(format) : date;
}

function ensureMarkdownExtension(path: string): string {
  return path.endsWith(".md") ? path : `${path}.md`;
}
