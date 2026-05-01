import { requireSession } from "@/infrastructure/auth/get-session";
import { characterRepo } from "@/infrastructure/db/repos";
import { renameCharacter } from "@/application/character/rename-character";

export async function PATCH(
  request: Request,
  ctx: RouteContext<"/api/characters/[characterId]">,
) {
  try {
    const session = await requireSession();
    const { characterId } = await ctx.params;
    const { name } = await request.json();
    await renameCharacter(characterRepo, characterId, session.userId, name);
    return new Response(null, { status: 204 });
  } catch (e) {
    const msg = (e as Error).message;
    const status = msg === "Unauthorized" ? 401 : msg === "Not authorized" ? 403 : 400;
    return Response.json({ error: msg }, { status });
  }
}
