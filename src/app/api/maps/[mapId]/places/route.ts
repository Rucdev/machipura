import { requireSession } from "@/infrastructure/auth/get-session";
import { mapRepo } from "@/infrastructure/db/repos";
import { addPlace } from "@/application/map/add-place";
import type { CategoryValue } from "@/domain/shared/category";

export async function POST(request: Request, ctx: RouteContext<"/api/maps/[mapId]/places">) {
  try {
    const session = await requireSession();
    const { mapId } = await ctx.params;
    const body = await request.json();
    const id = await addPlace(mapRepo, {
      mapId,
      requesterId: session.userId,
      name: body.name,
      x: body.x,
      y: body.y,
      category: body.category as CategoryValue,
      openHour: body.openHour,
      openMinute: body.openMinute,
      closeHour: body.closeHour,
      closeMinute: body.closeMinute,
    });
    return Response.json({ id }, { status: 201 });
  } catch (e) {
    const msg = (e as Error).message;
    const status = msg === "Unauthorized" ? 401 : msg === "Not authorized" ? 403 : 400;
    return Response.json({ error: msg }, { status });
  }
}
