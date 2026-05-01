import type { Distance } from "../shared/distance";
import type { Transport } from "../shared/transport";
import type { PlaceId } from "./place";

export type PathId = string;

export class Path {
  constructor(
    readonly id: PathId,
    readonly fromPlaceId: PlaceId,
    readonly toPlaceId: PlaceId,
    public transport: Transport,
    public distance: Distance,
  ) {}

  // 移動時間（分）
  travelDurationMinutes(): number {
    return (this.distance.km / this.transport.speedKmh()) * 60;
  }
}
