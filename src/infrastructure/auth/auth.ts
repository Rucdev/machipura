import { Argon2id } from "oslo/password";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";
import { db } from "../db/client";
import { sessions, users } from "../db/schema";

const argon2id = new Argon2id();

const SESSION_COOKIE = "session_id";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30; // 30日

export async function register(email: string, password: string): Promise<string> {
  const existing = await db.query.users.findFirst({ where: eq(users.email, email) });
  if (existing) throw new Error("Email already in use");

  const passwordHash = await argon2id.hash(password);
  const id = randomUUID();
  await db.insert(users).values({ id, email, passwordHash, isSuperUser: false });
  return id;
}

export async function login(email: string, password: string): Promise<string> {
  const user = await db.query.users.findFirst({ where: eq(users.email, email) });
  if (!user) throw new Error("Invalid email or password");

  const valid = await argon2id.verify(user.passwordHash, password);
  if (!valid) throw new Error("Invalid email or password");

  const sessionId = randomUUID();
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  await db.insert(sessions).values({ id: sessionId, userId: user.id, expiresAt });
  return sessionId;
}

export async function logout(sessionId: string): Promise<void> {
  await db.delete(sessions).where(eq(sessions.id, sessionId));
}

export async function validateSession(sessionId: string): Promise<{ userId: string; isSuperUser: boolean } | null> {
  const session = await db.query.sessions.findFirst({
    where: eq(sessions.id, sessionId),
  });
  if (!session) return null;
  if (session.expiresAt < new Date()) {
    await db.delete(sessions).where(eq(sessions.id, sessionId));
    return null;
  }
  const user = await db.query.users.findFirst({ where: eq(users.id, session.userId) });
  if (!user) return null;
  return { userId: session.userId, isSuperUser: user.isSuperUser };
}

export { SESSION_COOKIE };
