import { requireSession } from "@/infrastructure/auth/get-session";
import { mapRepo } from "@/infrastructure/db/repos";
import { removePath } from "@/application/map/remove-path";

export async function DELETE(
  _req: Request,
  ctx: RouteContext<"/api/maps/[mapId]/paths/[pathId]">,
) {
  try {
    const session = await requireSession();
    const { mapId, pathId } = await ctx.params;
    await removePath(mapRepo, mapId, pathId, session.userId);
    return new Response(null, { status: 204 });
  } catch (e) {
    const msg = (e as Error).message;
    const status = msg === "Unauthorized" ? 401 : msg === "Not authorized" ? 403 : 400;
    return Response.json({ error: msg }, { status });
  }
}
