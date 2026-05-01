import type { UserId } from "../map/map";
import type { Traits } from "../shared/traits";

export type CharacterId = string;

export class Character {
  constructor(
    readonly id: CharacterId,
    public name: string,
    readonly ownerId: UserId,
    readonly traits: Traits,
  ) {}

  rename(name: string): void {
    if (name.trim().length === 0) throw new Error("Character name cannot be empty");
    this.name = name;
  }
}
