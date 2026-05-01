import { MapAggregate, type UserId } from "@/domain/map/map";
import type { MapRepository } from "@/domain/map/map-repository";
import { randomUUID } from "crypto";

export type CreateMapInput = {
  name: string;
  ownerId: UserId;
};

export async function createMap(
  repo: MapRepository,
  input: CreateMapInput,
): Promise<string> {
  const map = new MapAggregate(randomUUID(), input.name, input.ownerId);
  await repo.save(map);
  return map.id;
}
