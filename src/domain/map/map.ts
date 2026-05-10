import type { Category } from "../shared/category";
import type { Coordinate } from "../shared/coordinate";
import { Path, type PathId } from "./path";
import { Place, type PlaceId } from "./place";

export type MapId = string;
export type UserId = string;

export class MapAggregate {
  private _places: Map<PlaceId, Place>;
  private _paths: Map<PathId, Path>;

  constructor(
    readonly id: MapId,
    public name: string,
    readonly ownerId: UserId,
    places: Place[] = [],
    paths: Path[] = [],
  ) {
    this._places = new Map(places.map((p) => [p.id, p]));
    this._paths = new Map(paths.map((p) => [p.id, p]));
  }

  get places(): Place[] {
    return Array.from(this._places.values());
  }

  get paths(): Path[] {
    return Array.from(this._paths.values());
  }

  addPlace(place: Place): void {
    this._places.set(place.id, place);
  }

  removePlace(placeId: PlaceId): void {
    if (!this._places.has(placeId)) throw new Error("Place not found");
    for (const [pathId, path] of this._paths) {
      if (path.fromPlaceId === placeId || path.toPlaceId === placeId) {
        this._paths.delete(pathId);
      }
    }
    this._places.delete(placeId);
  }

  renamePlace(placeId: PlaceId, name: string): void {
    this.getPlace(placeId).rename(name);
  }

  changePlaceCoordinate(placeId: PlaceId, coordinate: Coordinate): void {
    this.getPlace(placeId).changeCoordinate(coordinate);
    for (const path of this._paths.values()) {
      if (path.fromPlaceId === placeId) path.recalculateFrom(coordinate);
      if (path.toPlaceId === placeId) path.recalculateTo(coordinate);
    }
  }

  changePlaceCategory(placeId: PlaceId, category: Category): void {
    const place = this.getPlace(placeId);
    place.changeCategory(category);
    for (const path of this._paths.values()) {
      if (path.fromPlaceId === placeId) {
        const updated = new Path(
          path.id,
          path.fromPlaceId,
          path.toPlaceId,
          category.isStation,
          path.toIsStation,
          path.fromCoordinate,
          path.toCoordinate,
        );
        this._paths.set(path.id, updated);
      }
      if (path.toPlaceId === placeId) {
        const updated = new Path(
          path.id,
          path.fromPlaceId,
          path.toPlaceId,
          path.fromIsStation,
          category.isStation,
          path.fromCoordinate,
          path.toCoordinate,
        );
        this._paths.set(path.id, updated);
      }
    }
  }

  addPath(fromPlaceId: PlaceId, toPlaceId: PlaceId, id: PathId): Path {
    const from = this._places.get(fromPlaceId);
    if (!from) throw new Error("fromPlace not found");
    const to = this._places.get(toPlaceId);
    if (!to) throw new Error("toPlace not found");
    const path = new Path(
      id,
      fromPlaceId,
      toPlaceId,
      from.category.isStation,
      to.category.isStation,
      from.coordinate,
      to.coordinate,
    );
    this._paths.set(path.id, path);
    return path;
  }

  removePath(pathId: PathId): void {
    if (!this._paths.has(pathId)) throw new Error("Path not found");
    this._paths.delete(pathId);
  }

  outboundPaths(placeId: PlaceId): { path: Path; nextPlaceId: PlaceId }[] {
    const result: { path: Path; nextPlaceId: PlaceId }[] = [];
    for (const path of this._paths.values()) {
      if (path.fromPlaceId === placeId) result.push({ path, nextPlaceId: path.toPlaceId });
      else if (path.toPlaceId === placeId) result.push({ path, nextPlaceId: path.fromPlaceId });
    }
    return result;
  }

  private getPlace(placeId: PlaceId): Place {
    const place = this._places.get(placeId);
    if (!place) throw new Error("Place not found");
    return place;
  }

  findPlace(placeId: PlaceId): Place | undefined {
    return this._places.get(placeId);
  }
}
