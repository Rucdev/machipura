import type { MapId } from "@/domain/map/map";
import type { PlaceId } from "@/domain/map/place";
import type { MapRepository } from "@/domain/map/map-repository";

export async function removePlace(
  repo: MapRepository,
  mapId: MapId,
  placeId: PlaceId,
  requesterId: string,
): Promise<void> {
  const map = await repo.findById(mapId);
  if (!map) throw new Error("Map not found");
  if (map.ownerId !== requesterId) throw new Error("Not authorized");

  map.removePlace(placeId);
  await repo.save(map);
}
