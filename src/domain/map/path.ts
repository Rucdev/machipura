import type { CategoryValue } from "../shared/category";
import type { Coordinate } from "../shared/coordinate";
import { Transport, resolveTransport } from "../shared/transport";
import type { PlaceId } from "./place";

export type PathId = string;

export class Path {
  constructor(
    readonly id: PathId,
    readonly fromPlaceId: PlaceId,
    readonly toPlaceId: PlaceId,
    readonly fromCategory: CategoryValue,
    readonly toCategory: CategoryValue,
    public fromCoordinate: Coordinate,
    public toCoordinate: Coordinate,
  ) {}

  get transport(): Transport {
    return new Transport(resolveTransport(this.fromCategory, this.toCategory));
  }

  get distanceKm(): number {
    return this.fromCoordinate.distanceTo(this.toCoordinate);
  }

  travelDurationMinutes(): number {
    return (this.distanceKm / this.transport.speedKmh()) * 60;
  }

  recalculateFrom(coordinate: Coordinate): void {
    this.fromCoordinate = coordinate;
  }

  recalculateTo(coordinate: Coordinate): void {
    this.toCoordinate = coordinate;
  }
}
