import { requireSession } from "@/infrastructure/auth/get-session";
import { mapRepo, journeyRepo } from "@/infrastructure/db/repos";
import { deleteMap } from "@/application/map/delete-map";

export async function GET(_req: Request, ctx: RouteContext<"/api/maps/[mapId]">) {
  const { mapId } = await ctx.params;
  const map = await mapRepo.findById(mapId);
  if (!map) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json({
    id: map.id,
    name: map.name,
    ownerId: map.ownerId,
    places: map.places,
    paths: map.paths.map((p) => ({
      id: p.id,
      fromPlaceId: p.fromPlaceId,
      toPlaceId: p.toPlaceId,
      transport: p.transport.value,
      distanceKm: p.distanceKm,
    })),
  });
}

export async function DELETE(_req: Request, ctx: RouteContext<"/api/maps/[mapId]">) {
  try {
    const session = await requireSession();
    const { mapId } = await ctx.params;
    await deleteMap(mapRepo, journeyRepo, mapId, session.userId);
    return new Response(null, { status: 204 });
  } catch (e) {
    const msg = (e as Error).message;
    const status = msg === "Unauthorized" ? 401 : msg === "Not authorized" ? 403 : 400;
    return Response.json({ error: msg }, { status });
  }
}
