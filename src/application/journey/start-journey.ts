import type { CharacterRepository } from "@/domain/character/character-repository";
import type { MapRepository } from "@/domain/map/map-repository";
import type { MapId } from "@/domain/map/map";
import type { PlaceId } from "@/domain/map/place";
import type { CharacterId } from "@/domain/character/character";
import { Journey } from "@/domain/journey/journey";
import type { JourneyRepository } from "@/domain/journey/journey-repository";
import { executeRandomWalk } from "@/domain/journey/random-walk";
import { randomUUID } from "crypto";

export type StartJourneyInput = {
  mapId: MapId;
  characterId: CharacterId;
  startPlaceId: PlaceId;
  goalPlaceId: PlaceId;
  requesterId: string;
};

export async function startJourney(
  mapRepo: MapRepository,
  characterRepo: CharacterRepository,
  journeyRepo: JourneyRepository,
  input: StartJourneyInput,
): Promise<string> {
  const [map, character] = await Promise.all([
    mapRepo.findById(input.mapId),
    characterRepo.findById(input.characterId),
  ]);
  if (!map) throw new Error("Map not found");
  if (!character) throw new Error("Character not found");
  if (character.ownerId !== input.requesterId) throw new Error("Not authorized");

  const startedAt = new Date();
  const journey = new Journey(
    randomUUID(),
    character.id,
    map.id,
    input.startPlaceId,
    input.goalPlaceId,
    startedAt,
  );

  const steps = executeRandomWalk(
    map,
    character,
    input.startPlaceId,
    input.goalPlaceId,
    startedAt,
  );

  for (const step of steps) {
    journey.recordAction(
      randomUUID(),
      step.placeId,
      step.arrivedAt,
      step.travelDurationMinutes,
      step.action,
    );
  }

  journey.complete();
  await journeyRepo.save(journey);
  return journey.id;
}
