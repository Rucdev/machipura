import type { MapId } from "@/domain/map/map";
import type { MapRepository } from "@/domain/map/map-repository";
import type { PlaceId } from "@/domain/map/place";
import { randomUUID } from "crypto";

export type AddPathInput = {
  mapId: MapId;
  requesterId: string;
  fromPlaceId: PlaceId;
  toPlaceId: PlaceId;
};

export async function addPath(
  repo: MapRepository,
  input: AddPathInput,
): Promise<string> {
  const map = await repo.findById(input.mapId);
  if (!map) throw new Error("Map not found");
  if (map.ownerId !== input.requesterId) throw new Error("Not authorized");

  const path = map.addPath(input.fromPlaceId, input.toPlaceId, randomUUID());
  await repo.save(map);
  return path.id;
}
