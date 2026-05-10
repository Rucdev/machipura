import type { CharacterRepository } from "@/domain/character/character-repository";
import type { MapRepository } from "@/domain/map/map-repository";
import type { MapId } from "@/domain/map/map";
import type { PlaceId } from "@/domain/map/place";
import type { CharacterId } from "@/domain/character/character";
import { Journey } from "@/domain/journey/journey";
import type { JourneyRepository } from "@/domain/journey/journey-repository";
import type { CategoryRepository } from "@/domain/shared/category-repository";
import { executeRandomWalk } from "@/domain/journey/random-walk";
import { Action } from "@/domain/shared/action";
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
  categoryRepo: CategoryRepository,
  input: StartJourneyInput,
): Promise<string> {
  const [map, character, allActions] = await Promise.all([
    mapRepo.findById(input.mapId),
    characterRepo.findById(input.characterId),
    categoryRepo.findAllActions(),
  ]);
  if (!map) throw new Error("Map not found");
  if (!character) throw new Error("Character not found");
  if (character.ownerId !== input.requesterId) throw new Error("Not authorized");

  const actionsByCategoryId = new Map<string, string[]>();
  for (const action of allActions) {
    const list = actionsByCategoryId.get(action.categoryId) ?? [];
    list.push(action.description);
    actionsByCategoryId.set(action.categoryId, list);
  }

  const startedAt = new Date();
  const journey = new Journey(
    randomUUID(),
    character.id,
    map.id,
    input.startPlaceId,
    input.goalPlaceId,
    startedAt,
  );

  const startPlace = map.findPlace(input.startPlaceId);
  if (!startPlace) throw new Error("Start place not found");
  const goalPlace = map.findPlace(input.goalPlaceId);
  if (!goalPlace) throw new Error("Goal place not found");

  journey.recordAction(randomUUID(), input.startPlaceId, startedAt, 0, new Action(`${startPlace.name} を出発した`));

  const steps = executeRandomWalk(
    map,
    character,
    input.startPlaceId,
    input.goalPlaceId,
    startedAt,
    actionsByCategoryId,
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

  const lastTime = steps.length > 0 ? steps[steps.length - 1].arrivedAt : startedAt;
  journey.recordAction(randomUUID(), input.goalPlaceId, lastTime, 0, new Action(`${goalPlace.name} に到着した`));

  journey.complete();
  await journeyRepo.save(journey);
  return journey.id;
}
