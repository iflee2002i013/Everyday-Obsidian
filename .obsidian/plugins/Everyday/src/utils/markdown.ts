import { EVERYDAY_BLOCK_END, EVERYDAY_BLOCK_START } from "../constants";
import type { MoodOption } from "../types";

export function buildManagedBlock(summary: string, mood: MoodOption): string {
  return `${EVERYDAY_BLOCK_START}
## 一句话

${mood.emoji} ${summary.trim()}
${EVERYDAY_BLOCK_END}`;
}

export function updateManagedBlock(content: string, block: string): string {
  const startIndex = content.indexOf(EVERYDAY_BLOCK_START);
  const endIndex = startIndex >= 0 ? content.indexOf(EVERYDAY_BLOCK_END, startIndex) : -1;

  if (startIndex >= 0 && endIndex >= 0) {
    const afterEndIndex = endIndex + EVERYDAY_BLOCK_END.length;
    let replacement = block.trimEnd();
    const after = content.slice(afterEndIndex);

    if (after.length > 0 && !after.startsWith("\n")) {
      replacement += "\n";
    }

    return `${content.slice(0, startIndex)}${replacement}${after}`;
  }

  return insertManagedBlock(content, block);
}

export function extractSummaryFromManagedBlock(content: string): string | undefined {
  const startIndex = content.indexOf(EVERYDAY_BLOCK_START);
  const endIndex = startIndex >= 0 ? content.indexOf(EVERYDAY_BLOCK_END, startIndex) : -1;

  if (startIndex < 0 || endIndex < 0) {
    return undefined;
  }

  const blockContent = content
    .slice(startIndex + EVERYDAY_BLOCK_START.length, endIndex)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith("#"));

  return blockContent[0];
}

export function applyTemplateVariables(content: string, date: string): string {
  return content
    .replace(/\{\{date\}\}/g, date)
    .replace(/\{\{year\}\}/g, date.slice(0, 4))
    .replace(/\{\{month\}\}/g, date.slice(5, 7))
    .replace(/\{\{day\}\}/g, date.slice(8, 10));
}

function insertManagedBlock(content: string, block: string): string {
  const frontmatterEnd = getFrontmatterEnd(content);
  const body = content.slice(frontmatterEnd);
  const headingMatch = /^# .+$/m.exec(body);
  const blockText = block.trimEnd();

  if (headingMatch?.index !== undefined) {
    const insertAt = frontmatterEnd + headingMatch.index + headingMatch[0].length;
    const before = content.slice(0, insertAt);
    const after = content.slice(insertAt).replace(/^\r?\n+/, "");
    return `${before}\n\n${blockText}${after.length > 0 ? `\n\n${after}` : "\n"}`;
  }

  const before = content.slice(0, frontmatterEnd);
  const after = content.slice(frontmatterEnd).replace(/^\r?\n+/, "");

  if (before.length > 0) {
    return `${before.trimEnd()}\n\n${blockText}${after.length > 0 ? `\n\n${after}` : "\n"}`;
  }

  return `${blockText}${after.length > 0 ? `\n\n${after}` : "\n"}`;
}

function getFrontmatterEnd(content: string): number {
  const match = /^---\r?\n[\s\S]*?\r?\n---\r?\n?/.exec(content);
  return match ? match[0].length : 0;
}
