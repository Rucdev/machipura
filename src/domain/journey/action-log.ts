import type { Action } from "../shared/action";
import type { PlaceId } from "../map/place";

export type ActionLogId = string;

export class ActionLog {
  constructor(
    readonly id: ActionLogId,
    readonly placeId: PlaceId,
    readonly arrivedAt: Date,
    readonly travelDurationMinutes: number,
    readonly action: Action,
  ) {}
}
