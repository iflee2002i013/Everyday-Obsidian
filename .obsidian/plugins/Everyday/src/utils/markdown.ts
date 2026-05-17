export function applyTemplateVariables(content: string, date: string): string {
  return content
    .replace(/\{\{date\}\}/g, date)
    .replace(/\{\{year\}\}/g, date.slice(0, 4))
    .replace(/\{\{month\}\}/g, date.slice(5, 7))
    .replace(/\{\{day\}\}/g, date.slice(8, 10));
}
