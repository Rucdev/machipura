import type { CharacterId } from "../character/character";
import type { MapId } from "../map/map";
import type { PlaceId } from "../map/place";
import { ActionLog, type ActionLogId } from "./action-log";
import type { Action } from "../shared/action";

export type JourneyId = string;
export type JourneyStatus = "in_progress" | "completed";

export class Journey {
  private _logs: ActionLog[] = [];

  constructor(
    readonly id: JourneyId,
    readonly characterId: CharacterId,
    readonly mapId: MapId,
    readonly startPlaceId: PlaceId,
    readonly goalPlaceId: PlaceId,
    readonly startedAt: Date,
    public status: JourneyStatus = "in_progress",
    logs: ActionLog[] = [],
  ) {
    this._logs = [...logs];
  }

  get logs(): ActionLog[] {
    return [...this._logs];
  }

  recordAction(
    id: ActionLogId,
    placeId: PlaceId,
    arrivedAt: Date,
    travelDurationMinutes: number,
    action: Action,
  ): void {
    if (this.status === "completed") throw new Error("Journey is already completed");
    this._logs.push(new ActionLog(id, placeId, arrivedAt, travelDurationMinutes, action));
  }

  complete(): void {
    if (this.status === "completed") throw new Error("Journey is already completed");
    this.status = "completed";
  }
}
