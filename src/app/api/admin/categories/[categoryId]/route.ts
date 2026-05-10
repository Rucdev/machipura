import { requireSuperUser } from "@/infrastructure/auth/get-session";
import { categoryRepo } from "@/infrastructure/db/repos";
import { Category } from "@/domain/shared/category";

type Ctx = { params: Promise<{ categoryId: string }> };

export async function PATCH(request: Request, ctx: Ctx) {
  try {
    await requireSuperUser();
    const { categoryId } = await ctx.params;
    const existing = await categoryRepo.findCategoryById(categoryId);
    if (!existing) return Response.json({ error: "Not found" }, { status: 404 });
    const body = await request.json();
    const updated = new Category(
      categoryId,
      typeof body.label === "string" ? body.label.trim() : existing.label,
      typeof body.isStation === "boolean" ? body.isStation : existing.isStation,
    );
    await categoryRepo.saveCategory(updated);
    return Response.json({ id: updated.id, label: updated.label, isStation: updated.isStation });
  } catch (e) {
    const msg = (e as Error).message;
    const status = msg === "Unauthorized" ? 401 : msg === "Forbidden" ? 403 : 400;
    return Response.json({ error: msg }, { status });
  }
}

export async function DELETE(_req: Request, ctx: Ctx) {
  try {
    await requireSuperUser();
    const { categoryId } = await ctx.params;
    await categoryRepo.deleteCategory(categoryId);
    return new Response(null, { status: 204 });
  } catch (e) {
    const msg = (e as Error).message;
    const status = msg === "Unauthorized" ? 401 : msg === "Forbidden" ? 403 : 400;
    return Response.json({ error: msg }, { status });
  }
}
