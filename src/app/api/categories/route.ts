import { categoryRepo } from "@/infrastructure/db/repos";

export async function GET() {
  const cats = await categoryRepo.findAllCategories();
  return Response.json(cats.map((c) => ({ id: c.id, label: c.label, isStation: c.isStation })));
}
