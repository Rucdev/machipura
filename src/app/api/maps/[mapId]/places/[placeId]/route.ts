import { requireSession } from "@/infrastructure/auth/get-session";
import { mapRepo } from "@/infrastructure/db/repos";
import { removePlace } from "@/application/map/remove-place";
import { updatePlace } from "@/application/map/update-place";
import type { CategoryValue } from "@/domain/shared/category";

export async function PATCH(
  request: Request,
  ctx: RouteContext<"/api/maps/[mapId]/places/[placeId]">,
) {
  try {
    const session = await requireSession();
    const { mapId, placeId } = await ctx.params;
    const body = await request.json();
    await updatePlace(mapRepo, {
      mapId,
      placeId,
      requesterId: session.userId,
      name: body.name,
      x: body.x,
      y: body.y,
      category: body.category as CategoryValue | undefined,
      openHour: body.openHour,
      openMinute: body.openMinute,
      closeHour: body.closeHour,
      closeMinute: body.closeMinute,
    });
    return new Response(null, { status: 204 });
  } catch (e) {
    const msg = (e as Error).message;
    const status = msg === "Unauthorized" ? 401 : msg === "Not authorized" ? 403 : 400;
    return Response.json({ error: msg }, { status });
  }
}

export async function DELETE(
  _req: Request,
  ctx: RouteContext<"/api/maps/[mapId]/places/[placeId]">,
) {
  try {
    const session = await requireSession();
    const { mapId, placeId } = await ctx.params;
    await removePlace(mapRepo, mapId, placeId, session.userId);
    return new Response(null, { status: 204 });
  } catch (e) {
    const msg = (e as Error).message;
    const status = msg === "Unauthorized" ? 401 : msg === "Not authorized" ? 403 : 400;
    return Response.json({ error: msg }, { status });
  }
}
