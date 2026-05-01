import { eq } from "drizzle-orm";
import type { Db } from "../db/client";
import { maps, paths, places } from "../db/schema";
import { MapAggregate } from "@/domain/map/map";
import type { MapId } from "@/domain/map/map";
import type { MapRepository } from "@/domain/map/map-repository";
import { Place } from "@/domain/map/place";
import { Path } from "@/domain/map/path";
import { Address } from "@/domain/shared/address";
import { Category, type CategoryValue } from "@/domain/shared/category";
import { BusinessHours } from "@/domain/shared/business-hours";
import { Transport, type TransportValue } from "@/domain/shared/transport";
import { Distance } from "@/domain/shared/distance";

export class DrizzleMapRepository implements MapRepository {
  constructor(private readonly db: Db) {}

  async findById(id: MapId): Promise<MapAggregate | undefined> {
    const map = await this.db.query.maps.findFirst({ where: eq(maps.id, id) });
    if (!map) return undefined;
    return this.reconstruct(map);
  }

  async findAll(): Promise<MapAggregate[]> {
    const rows = await this.db.query.maps.findMany();
    return Promise.all(rows.map((row) => this.reconstruct(row)));
  }

  async save(map: MapAggregate): Promise<void> {
    await this.db.transaction(async (tx) => {
      await tx.insert(maps).values({ id: map.id, name: map.name, ownerId: map.ownerId })
        .onConflictDoUpdate({ target: maps.id, set: { name: map.name } });

      await tx.delete(places).where(eq(places.mapId, map.id));
      if (map.places.length > 0) {
        await tx.insert(places).values(
          map.places.map((p) => ({
            id: p.id,
            mapId: map.id,
            name: p.name,
            address: p.address.value,
            category: p.category.value,
            openHour: p.businessHours.openHour,
            openMinute: p.businessHours.openMinute,
            closeHour: p.businessHours.closeHour,
            closeMinute: p.businessHours.closeMinute,
          })),
        );
      }

      await tx.delete(paths).where(eq(paths.mapId, map.id));
      if (map.paths.length > 0) {
        await tx.insert(paths).values(
          map.paths.map((p) => ({
            id: p.id,
            mapId: map.id,
            fromPlaceId: p.fromPlaceId,
            toPlaceId: p.toPlaceId,
            transport: p.transport.value,
            distanceKm: p.distance.km,
          })),
        );
      }
    });
  }

  async delete(id: MapId): Promise<void> {
    await this.db.delete(maps).where(eq(maps.id, id));
  }

  private async reconstruct(row: typeof maps.$inferSelect): Promise<MapAggregate> {
    const placeRows = await this.db.query.places.findMany({
      where: eq(places.mapId, row.id),
    });
    const pathRows = await this.db.query.paths.findMany({
      where: eq(paths.mapId, row.id),
    });

    const domainPlaces = placeRows.map(
      (p) =>
        new Place(
          p.id,
          p.name,
          new Address(p.address),
          new Category(p.category as CategoryValue),
          new BusinessHours(p.openHour, p.openMinute, p.closeHour, p.closeMinute),
        ),
    );

    const domainPaths = pathRows.map(
      (p) =>
        new Path(
          p.id,
          p.fromPlaceId,
          p.toPlaceId,
          new Transport(p.transport as TransportValue),
          new Distance(p.distanceKm),
        ),
    );

    return new MapAggregate(row.id, row.name, row.ownerId, domainPlaces, domainPaths);
  }
}
