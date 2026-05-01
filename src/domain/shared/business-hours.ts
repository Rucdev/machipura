export class BusinessHours {
  constructor(
    readonly openHour: number,
    readonly openMinute: number,
    readonly closeHour: number,
    readonly closeMinute: number,
  ) {
    if (openHour < 0 || openHour > 23) throw new Error("Invalid openHour");
    if (closeHour < 0 || closeHour > 23) throw new Error("Invalid closeHour");
    if (openMinute < 0 || openMinute > 59) throw new Error("Invalid openMinute");
    if (closeMinute < 0 || closeMinute > 59) throw new Error("Invalid closeMinute");
  }

  isOpen(date: Date): boolean {
    const totalMinutes = date.getHours() * 60 + date.getMinutes();
    const openTotal = this.openHour * 60 + this.openMinute;
    const closeTotal = this.closeHour * 60 + this.closeMinute;

    if (openTotal <= closeTotal) {
      return totalMinutes >= openTotal && totalMinutes < closeTotal;
    }
    // 日をまたぐ営業時間（例: 22:00〜02:00）
    return totalMinutes >= openTotal || totalMinutes < closeTotal;
  }

  equals(other: BusinessHours): boolean {
    return (
      this.openHour === other.openHour &&
      this.openMinute === other.openMinute &&
      this.closeHour === other.closeHour &&
      this.closeMinute === other.closeMinute
    );
  }
}
