import type { MapId } from "@/domain/map/map";
import type { MapRepository } from "@/domain/map/map-repository";
import { Path } from "@/domain/map/path";
import type { PlaceId } from "@/domain/map/place";
import { Distance } from "@/domain/shared/distance";
import { Transport, type TransportValue } from "@/domain/shared/transport";
import { randomUUID } from "crypto";

export type AddPathInput = {
  mapId: MapId;
  requesterId: string;
  fromPlaceId: PlaceId;
  toPlaceId: PlaceId;
  transport: TransportValue;
  distanceKm: number;
};

export async function addPath(
  repo: MapRepository,
  input: AddPathInput,
): Promise<string> {
  const map = await repo.findById(input.mapId);
  if (!map) throw new Error("Map not found");
  if (map.ownerId !== input.requesterId) throw new Error("Not authorized");

  const path = new Path(
    randomUUID(),
    input.fromPlaceId,
    input.toPlaceId,
    new Transport(input.transport),
    new Distance(input.distanceKm),
  );
  map.addPath(path);
  await repo.save(map);
  return path.id;
}
