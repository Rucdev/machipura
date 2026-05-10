import { eq } from "drizzle-orm";
import type { Db } from "../db/client";
import { maps, paths, places, categories } from "../db/schema";
import { MapAggregate } from "@/domain/map/map";
import type { MapId } from "@/domain/map/map";
import type { MapRepository } from "@/domain/map/map-repository";
import { Place } from "@/domain/map/place";
import { Path } from "@/domain/map/path";
import { Category } from "@/domain/shared/category";
import { Coordinate } from "@/domain/shared/coordinate";

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
            x: p.coordinate.x,
            y: p.coordinate.y,
            categoryId: p.category.id,
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
            fromIsStation: p.fromIsStation,
            toIsStation: p.toIsStation,
            fromX: p.fromCoordinate.x,
            fromY: p.fromCoordinate.y,
            toX: p.toCoordinate.x,
            toY: p.toCoordinate.y,
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

    const categoryIds = [...new Set(placeRows.map((p) => p.categoryId))];
    const categoryRows = categoryIds.length > 0
      ? await this.db.query.categories.findMany()
      : [];
    const categoryMap = new Map(categoryRows.map((c) => [c.id, c]));

    const domainPlaces = placeRows.map((p) => {
      const cat = categoryMap.get(p.categoryId);
      const category = cat
        ? new Category(cat.id, cat.label, cat.isStation)
        : new Category(p.categoryId, p.categoryId, false);
      return new Place(p.id, p.name, new Coordinate(p.x, p.y), category);
    });

    const domainPaths = pathRows.map(
      (p) =>
        new Path(
          p.id,
          p.fromPlaceId,
          p.toPlaceId,
          p.fromIsStation,
          p.toIsStation,
          new Coordinate(p.fromX, p.fromY),
          new Coordinate(p.toX, p.toY),
        ),
    );

    return new MapAggregate(row.id, row.name, row.ownerId, domainPlaces, domainPaths);
  }
}
