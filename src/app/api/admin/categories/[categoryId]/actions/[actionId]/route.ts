import { requireSuperUser } from "@/infrastructure/auth/get-session";
import { categoryRepo } from "@/infrastructure/db/repos";

type Ctx = { params: Promise<{ categoryId: string; actionId: string }> };

export async function DELETE(_req: Request, ctx: Ctx) {
  try {
    await requireSuperUser();
    const { actionId } = await ctx.params;
    await categoryRepo.deleteAction(actionId);
    return new Response(null, { status: 204 });
  } catch (e) {
    const msg = (e as Error).message;
    const status = msg === "Unauthorized" ? 401 : msg === "Forbidden" ? 403 : 400;
    return Response.json({ error: msg }, { status });
  }
}
