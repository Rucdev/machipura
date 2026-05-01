import type { Journey, JourneyId } from "./journey";
import type { MapId } from "../map/map";
import type { CharacterId } from "../character/character";

export interface JourneyRepository {
  findById(id: JourneyId): Promise<Journey | undefined>;
  findByMap(mapId: MapId): Promise<Journey[]>;
  findByCharacter(characterId: CharacterId): Promise<Journey[]>;
  save(journey: Journey): Promise<void>;
  deleteByMap(mapId: MapId): Promise<void>;
}
