import type { Address } from "../shared/address";
import type { BusinessHours } from "../shared/business-hours";
import type { Category } from "../shared/category";
import type { Distance } from "../shared/distance";
import type { Transport } from "../shared/transport";
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
    // 関連するパスも削除
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

  changePlaceAddress(placeId: PlaceId, address: Address): void {
    this.getPlace(placeId).changeAddress(address);
  }

  changePlaceCategory(placeId: PlaceId, category: Category): void {
    this.getPlace(placeId).changeCategory(category);
  }

  changePlaceBusinessHours(placeId: PlaceId, businessHours: BusinessHours): void {
    this.getPlace(placeId).changeBusinessHours(businessHours);
  }

  addPath(path: Path): void {
    if (!this._places.has(path.fromPlaceId)) throw new Error("fromPlace not found");
    if (!this._places.has(path.toPlaceId)) throw new Error("toPlace not found");
    this._paths.set(path.id, path);
  }

  removePath(pathId: PathId): void {
    if (!this._paths.has(pathId)) throw new Error("Path not found");
    this._paths.delete(pathId);
  }

  outboundPaths(placeId: PlaceId): Path[] {
    return this.paths.filter((p) => p.fromPlaceId === placeId);
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
