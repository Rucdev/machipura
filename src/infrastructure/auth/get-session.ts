import { cookies } from "next/headers";
import { SESSION_COOKIE, validateSession } from "./auth";

export async function getSession(): Promise<{ userId: string; isSuperUser: boolean } | null> {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value;
  if (!sessionId) return null;
  return validateSession(sessionId);
}

export async function requireSession(): Promise<{ userId: string; isSuperUser: boolean }> {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  return session;
}

export async function requireSuperUser(): Promise<{ userId: string; isSuperUser: boolean }> {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  if (!session.isSuperUser) throw new Error("Forbidden");
  return session;
}
