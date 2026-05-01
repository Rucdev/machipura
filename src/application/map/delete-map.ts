import type { MapId } from "@/domain/map/map";
import type { MapRepository } from "@/domain/map/map-repository";
import type { JourneyRepository } from "@/domain/journey/journey-repository";

export async function deleteMap(
  mapRepo: MapRepository,
  journeyRepo: JourneyRepository,
  mapId: MapId,
  requesterId: string,
): Promise<void> {
  const map = await mapRepo.findById(mapId);
  if (!map) throw new Error("Map not found");
  if (map.ownerId !== requesterId) throw new Error("Not authorized");

  await journeyRepo.deleteByMap(mapId);
  await mapRepo.delete(mapId);
}
