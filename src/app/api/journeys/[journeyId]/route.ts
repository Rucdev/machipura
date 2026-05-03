import { journeyRepo, mapRepo } from "@/infrastructure/db/repos";

export async function GET(_req: Request, ctx: RouteContext<"/api/journeys/[journeyId]">) {
  const { journeyId } = await ctx.params;
  const journey = await journeyRepo.findById(journeyId);
  if (!journey) return Response.json({ error: "Not found" }, { status: 404 });

  const map = await mapRepo.findById(journey.mapId);
  const placeNameById = new Map(map?.places.map((p) => [p.id, p.name]) ?? []);

  return Response.json({
    id: journey.id,
    characterId: journey.characterId,
    mapId: journey.mapId,
    startPlaceId: journey.startPlaceId,
    goalPlaceId: journey.goalPlaceId,
    startedAt: journey.startedAt,
    status: journey.status,
    logs: journey.logs.map((l) => ({
      id: l.id,
      placeId: l.placeId,
      placeName: placeNameById.get(l.placeId) ?? null,
      arrivedAt: l.arrivedAt,
      travelDurationMinutes: l.travelDurationMinutes,
      action: l.action.description,
    })),
  });
}
