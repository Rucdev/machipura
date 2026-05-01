import type { MapId } from "@/domain/map/map";
import type { PathId } from "@/domain/map/path";
import type { MapRepository } from "@/domain/map/map-repository";

export async function removePath(
  repo: MapRepository,
  mapId: MapId,
  pathId: PathId,
  requesterId: string,
): Promise<void> {
  const map = await repo.findById(mapId);
  if (!map) throw new Error("Map not found");
  if (map.ownerId !== requesterId) throw new Error("Not authorized");

  map.removePath(pathId);
  await repo.save(map);
}
