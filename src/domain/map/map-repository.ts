import type { MapAggregate, MapId } from "./map";

export interface MapRepository {
  findById(id: MapId): Promise<MapAggregate | undefined>;
  findAll(): Promise<MapAggregate[]>;
  save(map: MapAggregate): Promise<void>;
  delete(id: MapId): Promise<void>;
}
