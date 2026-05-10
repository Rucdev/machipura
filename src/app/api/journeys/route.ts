import { requireSession } from "@/infrastructure/auth/get-session";
import { mapRepo, characterRepo, journeyRepo, categoryRepo } from "@/infrastructure/db/repos";
import { startJourney } from "@/application/journey/start-journey";

export async function POST(request: Request) {
  try {
    const session = await requireSession();
    const body = await request.json();
    const id = await startJourney(mapRepo, characterRepo, journeyRepo, categoryRepo, {
      mapId: body.mapId,
      characterId: body.characterId,
      startPlaceId: body.startPlaceId,
      goalPlaceId: body.goalPlaceId,
      requesterId: session.userId,
    });
    return Response.json({ id }, { status: 201 });
  } catch (e) {
    const msg = (e as Error).message;
    const status = msg === "Unauthorized" ? 401 : msg === "Not authorized" ? 403 : 400;
    return Response.json({ error: msg }, { status });
  }
}
