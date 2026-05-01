import type { Character, CharacterId } from "./character";
import type { UserId } from "../map/map";

export interface CharacterRepository {
  findById(id: CharacterId): Promise<Character | undefined>;
  findByOwner(ownerId: UserId): Promise<Character[]>;
  save(character: Character): Promise<void>;
  delete(id: CharacterId): Promise<void>;
}
