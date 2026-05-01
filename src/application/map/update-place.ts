import type { MapId } from "@/domain/map/map";
import type { PlaceId } from "@/domain/map/place";
import type { MapRepository } from "@/domain/map/map-repository";
import { Address } from "@/domain/shared/address";
import { BusinessHours } from "@/domain/shared/business-hours";
import { Category, type CategoryValue } from "@/domain/shared/category";

export type UpdatePlaceInput = {
  mapId: MapId;
  placeId: PlaceId;
  requesterId: string;
  name?: string;
  address?: string;
  category?: CategoryValue;
  openHour?: number;
  openMinute?: number;
  closeHour?: number;
  closeMinute?: number;
};

export async function updatePlace(
  repo: MapRepository,
  input: UpdatePlaceInput,
): Promise<void> {
  const map = await repo.findById(input.mapId);
  if (!map) throw new Error("Map not found");
  if (map.ownerId !== input.requesterId) throw new Error("Not authorized");

  if (input.name !== undefined) map.renamePlace(input.placeId, input.name);
  if (input.address !== undefined) map.changePlaceAddress(input.placeId, new Address(input.address));
  if (input.category !== undefined) map.changePlaceCategory(input.placeId, new Category(input.category));

  const { openHour, openMinute, closeHour, closeMinute } = input;
  if (
    openHour !== undefined &&
    openMinute !== undefined &&
    closeHour !== undefined &&
    closeMinute !== undefined
  ) {
    map.changePlaceBusinessHours(
      input.placeId,
      new BusinessHours(openHour, openMinute, closeHour, closeMinute),
    );
  }

  await repo.save(map);
}
