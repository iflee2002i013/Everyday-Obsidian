import { normalizePath } from "obsidian";
import type { EverydaySettings } from "../types";

function cleanPathSegment(path: string): string {
  return path
    .replace(/\\/g, "/")
    .split("/")
    .map((part) => part.trim())
    .filter(Boolean)
    .join("/");
}

export function getDiaryFolderPath(date: string, settings: EverydaySettings): string {
  const baseFolder = cleanPathSegment(settings.diaryFolder) || "Diary";
  const year = date.slice(0, 4);
  const folder = settings.useYearSubfolders ? `${baseFolder}/${year}` : baseFolder;
  return normalizePath(folder);
}

export function getDiaryFilePath(date: string, settings: EverydaySettings): string {
  return normalizePath(`${getDiaryFolderPath(date, settings)}/${date}.md`);
}

export function normalizeVaultPath(path: string): string {
  return normalizePath(cleanPathSegment(path));
}
