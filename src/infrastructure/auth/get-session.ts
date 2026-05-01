import { cookies } from "next/headers";
import { SESSION_COOKIE, validateSession } from "./auth";

export async function getSession(): Promise<{ userId: string } | null> {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value;
  if (!sessionId) return null;
  return validateSession(sessionId);
}

export async function requireSession(): Promise<{ userId: string }> {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  return session;
}
