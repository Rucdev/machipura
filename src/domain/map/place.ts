import type { Category } from "../shared/category";
import type { Coordinate } from "../shared/coordinate";

export type PlaceId = string;

export class Place {
  constructor(
    readonly id: PlaceId,
    public name: string,
    public coordinate: Coordinate,
    public category: Category,
  ) {}

  rename(name: string): void {
    if (name.trim().length === 0) throw new Error("Place name cannot be empty");
    this.name = name;
  }

  changeCoordinate(coordinate: Coordinate): void {
    this.coordinate = coordinate;
  }

  changeCategory(category: Category): void {
    this.category = category;
  }
}
