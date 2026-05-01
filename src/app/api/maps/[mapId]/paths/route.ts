import { requireSession } from "@/infrastructure/auth/get-session";
import { mapRepo } from "@/infrastructure/db/repos";
import { addPath } from "@/application/map/add-path";
import type { TransportValue } from "@/domain/shared/transport";

export async function POST(request: Request, ctx: RouteContext<"/api/maps/[mapId]/paths">) {
  try {
    const session = await requireSession();
    const { mapId } = await ctx.params;
    const body = await request.json();
    const id = await addPath(mapRepo, {
      mapId,
      requesterId: session.userId,
      fromPlaceId: body.fromPlaceId,
      toPlaceId: body.toPlaceId,
      transport: body.transport as TransportValue,
      distanceKm: body.distanceKm,
    });
    return Response.json({ id }, { status: 201 });
  } catch (e) {
    const msg = (e as Error).message;
    const status = msg === "Unauthorized" ? 401 : msg === "Not authorized" ? 403 : 400;
    return Response.json({ error: msg }, { status });
  }
}
