import type { Address } from "../shared/address";
import type { BusinessHours } from "../shared/business-hours";
import type { Category } from "../shared/category";

export type PlaceId = string;

export class Place {
  constructor(
    readonly id: PlaceId,
    public name: string,
    public address: Address,
    public category: Category,
    public businessHours: BusinessHours,
  ) {}

  rename(name: string): void {
    if (name.trim().length === 0) throw new Error("Place name cannot be empty");
    this.name = name;
  }

  changeAddress(address: Address): void {
    this.address = address;
  }

  changeCategory(category: Category): void {
    this.category = category;
  }

  changeBusinessHours(businessHours: BusinessHours): void {
    this.businessHours = businessHours;
  }
}
