import { requireSuperUser } from "@/infrastructure/auth/get-session";
import { categoryRepo } from "@/infrastructure/db/repos";
import { CategoryAction } from "@/domain/shared/category-action";
import { randomUUID } from "crypto";

type Ctx = { params: Promise<{ categoryId: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  try {
    await requireSuperUser();
    const { categoryId } = await ctx.params;
    const actions = await categoryRepo.findActionsByCategoryId(categoryId);
    return Response.json(actions.map((a) => ({ id: a.id, description: a.description, sortOrder: a.sortOrder })));
  } catch (e) {
    const msg = (e as Error).message;
    const status = msg === "Unauthorized" ? 401 : msg === "Forbidden" ? 403 : 400;
    return Response.json({ error: msg }, { status });
  }
}

export async function POST(request: Request, ctx: Ctx) {
  try {
    await requireSuperUser();
    const { categoryId } = await ctx.params;
    const body = await request.json();
    if (!body.description || typeof body.description !== "string") {
      return Response.json({ error: "description is required" }, { status: 400 });
    }
    const action = new CategoryAction(randomUUID(), categoryId, body.description.trim(), body.sortOrder ?? 0);
    await categoryRepo.saveAction(action);
    return Response.json({ id: action.id, description: action.description, sortOrder: action.sortOrder }, { status: 201 });
  } catch (e) {
    const msg = (e as Error).message;
    const status = msg === "Unauthorized" ? 401 : msg === "Forbidden" ? 403 : 400;
    return Response.json({ error: msg }, { status });
  }
}
