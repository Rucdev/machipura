import type { MapId } from "@/domain/map/map";
import type { MapRepository } from "@/domain/map/map-repository";
import { Place } from "@/domain/map/place";
import { BusinessHours } from "@/domain/shared/business-hours";
import { Category, type CategoryValue } from "@/domain/shared/category";
import { Coordinate } from "@/domain/shared/coordinate";
import { randomUUID } from "crypto";

export type AddPlaceInput = {
  mapId: MapId;
  requesterId: string;
  name: string;
  x: number;
  y: number;
  category: CategoryValue;
  openHour: number;
  openMinute: number;
  closeHour: number;
  closeMinute: number;
};

export async function addPlace(
  repo: MapRepository,
  input: AddPlaceInput,
): Promise<string> {
  const map = await repo.findById(input.mapId);
  if (!map) throw new Error("Map not found");
  if (map.ownerId !== input.requesterId) throw new Error("Not authorized");

  const place = new Place(
    randomUUID(),
    input.name,
    new Coordinate(input.x, input.y),
    new Category(input.category),
    new BusinessHours(input.openHour, input.openMinute, input.closeHour, input.closeMinute),
  );
  map.addPlace(place);
  await repo.save(map);
  return place.id;
}
