import { getSession } from "@/infrastructure/auth/get-session";

export async function GET() {
  const session = await getSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  return Response.json({ userId: session.userId, isSuperUser: session.isSuperUser });
}
