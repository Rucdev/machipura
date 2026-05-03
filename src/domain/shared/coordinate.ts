export class Coordinate {
  constructor(
    readonly x: number,
    readonly y: number,
  ) {}

  distanceTo(other: Coordinate): number {
    const dx = this.x - other.x;
    const dy = this.y - other.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  equals(other: Coordinate): boolean {
    return this.x === other.x && this.y === other.y;
  }
}
