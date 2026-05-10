export type CategoryId = string;

export class Category {
  constructor(
    readonly id: CategoryId,
    readonly label: string,
    readonly isStation: boolean,
  ) {}

  equals(other: Category): boolean {
    return this.id === other.id;
  }
}
