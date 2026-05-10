/**
 * SuperUserを作成するCLIスクリプト
 * 実行: npx tsx scripts/create-superuser.ts <email> <password>
 */
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { eq } from "drizzle-orm";
import * as schema from "../src/infrastructure/db/schema";
import { Argon2id } from "oslo/password";
import { randomUUID } from "crypto";

const [, , email, password] = process.argv;

if (!email || !password) {
  console.error("使い方: npx tsx scripts/create-superuser.ts <email> <password>");
  process.exit(1);
}

const client = createClient({
  url: `file:${process.env.DATABASE_URL ?? "db.sqlite"}`,
});
const db = drizzle(client, { schema });
const argon2id = new Argon2id();

async function main() {
  const existing = await db.query.users.findFirst({ where: eq(schema.users.email, email) });

  if (existing) {
    if (existing.isSuperUser) {
      console.log(`${email} は既にSuperUserです。`);
    } else {
      await db.update(schema.users).set({ isSuperUser: true }).where(eq(schema.users.email, email));
      console.log(`${email} をSuperUserに昇格しました。`);
    }
  } else {
    const passwordHash = await argon2id.hash(password);
    await db.insert(schema.users).values({
      id: randomUUID(),
      email,
      passwordHash,
      isSuperUser: true,
    });
    console.log(`SuperUser ${email} を作成しました。`);
  }

  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });
