import { Notice, Plugin, TFile } from "obsidian";

const DIARY_FOLDER = "日记";

const moods = ["calm", "focused", "curious", "steady", "bright", "reflective"];
const weather = ["sunny", "cloudy", "light rain", "breezy", "warm", "quiet night"];
const prompts = [
  "今天最值得记住的一件小事是什么？",
  "有没有一个瞬间让你感觉自己正在往前走？",
  "如果给今天取一个标题，你会怎么命名？",
  "今天有什么可以留给明天继续做？",
  "哪件事让你比早上更轻松了一点？"
];

export default class EverydayDiaryPlugin extends Plugin {
  async onload() {
    this.addCommand({
      id: "create-random-diary",
      name: "写入随机日记",
      callback: async () => {
        const file = await this.createRandomDiary();
        new Notice(`已创建日记：${file.path}`);
      }
    });
  }

  private async createRandomDiary(): Promise<TFile> {
    await this.ensureFolder(DIARY_FOLDER);

    const date = new Date();
    const dateText = this.formatDate(date);
    const path = await this.getAvailablePath(`${DIARY_FOLDER}/${dateText}.md`);
    const content = this.buildDiaryContent(dateText);

    return this.app.vault.create(path, content);
  }

  private buildDiaryContent(dateText: string): string {
    const mood = this.pick(moods);
    const sky = this.pick(weather);
    const prompt = this.pick(prompts);

    return `---\ndate: ${dateText}\nmood: ${mood}\nweather: ${sky}\ntags:\n  - diary\n  - generated\n---\n\n# ${dateText}\n\n${prompt}\n\n今天可以先写三句话：\n\n1. \n2. \n3. \n\n## 今日碎片\n\n- 心情：${mood}\n- 天气：${sky}\n- 关键词：\n`;
  }

  private async ensureFolder(path: string) {
    const folder = this.app.vault.getAbstractFileByPath(path);
    if (!folder) {
      await this.app.vault.createFolder(path);
    }
  }

  private async getAvailablePath(path: string): Promise<string> {
    if (!this.app.vault.getAbstractFileByPath(path)) {
      return path;
    }

    const dot = path.lastIndexOf(".");
    const base = dot >= 0 ? path.slice(0, dot) : path;
    const ext = dot >= 0 ? path.slice(dot) : "";

    let index = 2;
    while (this.app.vault.getAbstractFileByPath(`${base}-${index}${ext}`)) {
      index += 1;
    }

    return `${base}-${index}${ext}`;
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  }

  private pick(items: string[]): string {
    return items[Math.floor(Math.random() * items.length)];
  }
}
