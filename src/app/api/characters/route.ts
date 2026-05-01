import { requireSession } from "@/infrastructure/auth/get-session";
import { characterRepo } from "@/infrastructure/db/repos";
import { createCharacter } from "@/application/character/create-character";

export async function GET() {
  try {
    const session = await requireSession();
    const chars = await characterRepo.findByOwner(session.userId);
    return Response.json(chars.map((c) => ({ id: c.id, name: c.name })));
  } catch (e) {
    return Response.json({ error: (e as Error).message }, { status: 401 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireSession();
    const { name } = await request.json();
    const id = await createCharacter(characterRepo, session.userId, name);
    return Response.json({ id }, { status: 201 });
  } catch (e) {
    const msg = (e as Error).message;
    return Response.json({ error: msg }, { status: msg === "Unauthorized" ? 401 : 400 });
  }
}
