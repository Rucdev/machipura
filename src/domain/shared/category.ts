export const CATEGORIES = [
  "cafe",
  "park",
  "station",
  "restaurant",
  "shop",
  "museum",
  "hotel",
  "other",
] as const;

export type CategoryValue = (typeof CATEGORIES)[number];

export class Category {
  constructor(readonly value: CategoryValue) {}

  equals(other: Category): boolean {
    return this.value === other.value;
  }
}
