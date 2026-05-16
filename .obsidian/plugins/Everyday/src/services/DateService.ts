export class DateService {
  static todayString(): string {
    return DateService.formatDate(new Date());
  }

  static yesterdayString(): string {
    const date = new Date();
    date.setDate(date.getDate() - 1);
    return DateService.formatDate(date);
  }

  static formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  static monthDates(year: number, month: number): string[] {
    const days = DateService.daysInMonth(year, month);
    return Array.from({ length: days }, (_, index) => {
      const day = String(index + 1).padStart(2, "0");
      const monthText = String(month).padStart(2, "0");
      return `${year}-${monthText}-${day}`;
    });
  }

  static daysInMonth(year: number, month: number): number {
    return new Date(year, month, 0).getDate();
  }

  static weekdayLabel(dateText: string): string {
    const labels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    return labels[DateService.parseLocalDate(dateText).getDay()];
  }

  static monthTitle(year: number, month: number): string {
    const date = new Date(year, month - 1, 1);
    return date.toLocaleString("en-US", { month: "short", year: "numeric" }).toUpperCase();
  }

  static monthHeading(year: number, month: number): string {
    return `${year} 年 ${month} 月`;
  }

  static isToday(dateText: string): boolean {
    return dateText === DateService.todayString();
  }

  static dayOfMonth(dateText: string): string {
    return dateText.slice(8, 10);
  }

  static parseLocalDate(dateText: string): Date {
    const [year, month, day] = dateText.split("-").map((part) => Number(part));
    return new Date(year, month - 1, day);
  }

  static clampMonth(year: number, month: number): { year: number; month: number } {
    if (month < 1) {
      return { year: year - 1, month: 12 };
    }

    if (month > 12) {
      return { year: year + 1, month: 1 };
    }

    return { year, month };
  }
}
