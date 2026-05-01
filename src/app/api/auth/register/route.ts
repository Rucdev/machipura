import { register, login, SESSION_COOKIE } from "@/infrastructure/auth/auth";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();
    await register(email, password);
    const sessionId = await login(email, password);
    return Response.json(
      { ok: true },
      {
        headers: {
          "Set-Cookie": `${SESSION_COOKIE}=${sessionId}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${60 * 60 * 24 * 30}`,
        },
      },
    );
  } catch (e) {
    return Response.json({ error: (e as Error).message }, { status: 400 });
  }
}
