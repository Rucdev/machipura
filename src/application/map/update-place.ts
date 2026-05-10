import type { MapId } from "@/domain/map/map";
import type { PlaceId } from "@/domain/map/place";
import type { MapRepository } from "@/domain/map/map-repository";
import type { CategoryRepository } from "@/domain/shared/category-repository";
import { Coordinate } from "@/domain/shared/coordinate";

export type UpdatePlaceInput = {
  mapId: MapId;
  placeId: PlaceId;
  requesterId: string;
  name?: string;
  x?: number;
  y?: number;
  categoryId?: string;
};

export async function updatePlace(
  mapRepo: MapRepository,
  categoryRepo: CategoryRepository,
  input: UpdatePlaceInput,
): Promise<void> {
  const map = await mapRepo.findById(input.mapId);
  if (!map) throw new Error("Map not found");
  if (map.ownerId !== input.requesterId) throw new Error("Not authorized");

  if (input.name !== undefined) map.renamePlace(input.placeId, input.name);
  if (input.x !== undefined && input.y !== undefined) {
    map.changePlaceCoordinate(input.placeId, new Coordinate(input.x, input.y));
  }
  if (input.categoryId !== undefined) {
    const category = await categoryRepo.findCategoryById(input.categoryId);
    if (!category) throw new Error("Category not found");
    map.changePlaceCategory(input.placeId, category);
  }

  await mapRepo.save(map);
}
