import { eq } from "drizzle-orm";
import type { Db } from "../db/client";
import { actionLogs, journeys } from "../db/schema";
import { Journey, type JourneyId, type JourneyStatus } from "@/domain/journey/journey";
import type { JourneyRepository } from "@/domain/journey/journey-repository";
import { ActionLog } from "@/domain/journey/action-log";
import { Action } from "@/domain/shared/action";
import type { MapId } from "@/domain/map/map";
import type { CharacterId } from "@/domain/character/character";

export class DrizzleJourneyRepository implements JourneyRepository {
  constructor(private readonly db: Db) {}

  async findById(id: JourneyId): Promise<Journey | undefined> {
    const row = await this.db.query.journeys.findFirst({
      where: eq(journeys.id, id),
    });
    if (!row) return undefined;
    return this.reconstruct(row);
  }

  async findByMap(mapId: MapId): Promise<Journey[]> {
    const rows = await this.db.query.journeys.findMany({
      where: eq(journeys.mapId, mapId),
    });
    return Promise.all(rows.map((row) => this.reconstruct(row)));
  }

  async findByCharacter(characterId: CharacterId): Promise<Journey[]> {
    const rows = await this.db.query.journeys.findMany({
      where: eq(journeys.characterId, characterId),
    });
    return Promise.all(rows.map((row) => this.reconstruct(row)));
  }

  async save(journey: Journey): Promise<void> {
    await this.db.transaction(async (tx) => {
      await tx
        .insert(journeys)
        .values({
          id: journey.id,
          characterId: journey.characterId,
          mapId: journey.mapId,
          startPlaceId: journey.startPlaceId,
          goalPlaceId: journey.goalPlaceId,
          startedAt: journey.startedAt,
          status: journey.status,
        })
        .onConflictDoUpdate({
          target: journeys.id,
          set: { status: journey.status },
        });

      await tx.delete(actionLogs).where(eq(actionLogs.journeyId, journey.id));
      if (journey.logs.length > 0) {
        await tx.insert(actionLogs).values(
          journey.logs.map((log) => ({
            id: log.id,
            journeyId: journey.id,
            placeId: log.placeId,
            arrivedAt: log.arrivedAt,
            travelDurationMinutes: log.travelDurationMinutes,
            action: log.action.description,
          })),
        );
      }
    });
  }

  async deleteByMap(mapId: MapId): Promise<void> {
    await this.db.delete(journeys).where(eq(journeys.mapId, mapId));
  }

  private async reconstruct(row: typeof journeys.$inferSelect): Promise<Journey> {
    const logRows = await this.db.query.actionLogs.findMany({
      where: eq(actionLogs.journeyId, row.id),
    });

    const domainLogs = logRows.map(
      (l) =>
        new ActionLog(
          l.id,
          l.placeId,
          l.arrivedAt,
          l.travelDurationMinutes,
          new Action(l.action),
        ),
    );

    return new Journey(
      row.id,
      row.characterId,
      row.mapId,
      row.startPlaceId,
      row.goalPlaceId,
      row.startedAt,
      row.status as JourneyStatus,
      domainLogs,
    );
  }
}
