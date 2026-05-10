import type { MapId } from "@/domain/map/map";
import type { MapRepository } from "@/domain/map/map-repository";
import { Place } from "@/domain/map/place";
import type { CategoryRepository } from "@/domain/shared/category-repository";
import { Coordinate } from "@/domain/shared/coordinate";
import { randomUUID } from "crypto";

export type AddPlaceInput = {
  mapId: MapId;
  requesterId: string;
  name: string;
  x: number;
  y: number;
  categoryId: string;
};

export async function addPlace(
  mapRepo: MapRepository,
  categoryRepo: CategoryRepository,
  input: AddPlaceInput,
): Promise<string> {
  const map = await mapRepo.findById(input.mapId);
  if (!map) throw new Error("Map not found");
  if (map.ownerId !== input.requesterId) throw new Error("Not authorized");

  const category = await categoryRepo.findCategoryById(input.categoryId);
  if (!category) throw new Error("Category not found");

  const place = new Place(
    randomUUID(),
    input.name,
    new Coordinate(input.x, input.y),
    category,
  );
  map.addPlace(place);
  await mapRepo.save(map);
  return place.id;
}
