import { requireSession } from "@/infrastructure/auth/get-session";
import { mapRepo } from "@/infrastructure/db/repos";
import { createMap } from "@/application/map/create-map";

export async function GET() {
  const maps = await mapRepo.findAll();
  return Response.json(maps.map((m) => ({ id: m.id, name: m.name, ownerId: m.ownerId })));
}

export async function POST(request: Request) {
  try {
    const session = await requireSession();
    const { name } = await request.json();
    const id = await createMap(mapRepo, { name, ownerId: session.userId });
    return Response.json({ id }, { status: 201 });
  } catch (e) {
    const msg = (e as Error).message;
    return Response.json({ error: msg }, { status: msg === "Unauthorized" ? 401 : 400 });
  }
}
