import { requireSuperUser } from "@/infrastructure/auth/get-session";
import { categoryRepo } from "@/infrastructure/db/repos";
import { Category } from "@/domain/shared/category";
import { randomUUID } from "crypto";

export async function GET() {
  try {
    await requireSuperUser();
    const cats = await categoryRepo.findAllCategories();
    return Response.json(cats.map((c) => ({ id: c.id, label: c.label, isStation: c.isStation })));
  } catch (e) {
    const msg = (e as Error).message;
    const status = msg === "Unauthorized" ? 401 : msg === "Forbidden" ? 403 : 400;
    return Response.json({ error: msg }, { status });
  }
}

export async function POST(request: Request) {
  try {
    await requireSuperUser();
    const body = await request.json();
    if (!body.label || typeof body.label !== "string") {
      return Response.json({ error: "label is required" }, { status: 400 });
    }
    const category = new Category(randomUUID(), body.label.trim(), body.isStation === true);
    await categoryRepo.saveCategory(category);
    return Response.json({ id: category.id, label: category.label, isStation: category.isStation }, { status: 201 });
  } catch (e) {
    const msg = (e as Error).message;
    const status = msg === "Unauthorized" ? 401 : msg === "Forbidden" ? 403 : 400;
    return Response.json({ error: msg }, { status });
  }
}
