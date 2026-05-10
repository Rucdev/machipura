/**
 * カテゴリとアクションのfixture投入スクリプト
 * 実行: npx tsx scripts/seed-categories.ts
 */
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "../src/infrastructure/db/schema";
import { randomUUID } from "crypto";

const client = createClient({
  url: `file:${process.env.DATABASE_URL ?? "db.sqlite"}`,
});
const db = drizzle(client, { schema });

const FIXTURE = [
  {
    id: "cafe",
    label: "カフェ",
    isStation: false,
    actions: ["コーヒーを飲んだ", "読書をした", "友人と話した", "軽食を食べた"],
  },
  {
    id: "park",
    label: "公園",
    isStation: false,
    actions: ["散歩をした", "ベンチで休んだ", "写真を撮った", "ジョギングをした"],
  },
  {
    id: "station",
    label: "駅",
    isStation: true,
    actions: ["電車を待った", "時刻表を確認した", "売店で買い物をした"],
  },
  {
    id: "restaurant",
    label: "レストラン",
    isStation: false,
    actions: ["食事をした", "メニューを眺めた", "持ち帰りを注文した"],
  },
  {
    id: "shop",
    label: "ショップ",
    isStation: false,
    actions: ["ウィンドウショッピングをした", "商品を購入した", "店員と話した"],
  },
  {
    id: "museum",
    label: "博物館",
    isStation: false,
    actions: ["展示を鑑賞した", "図録を買った", "解説を読んだ"],
  },
  {
    id: "hotel",
    label: "ホテル",
    isStation: false,
    actions: ["チェックインした", "ロビーで休憩した", "荷物を預けた"],
  },
  {
    id: "other",
    label: "その他",
    isStation: false,
    actions: ["しばらく過ごした", "周囲を観察した"],
  },
];

async function main() {
  console.log("カテゴリとアクションを投入します...");

  for (const cat of FIXTURE) {
    await db
      .insert(schema.categories)
      .values({ id: cat.id, label: cat.label, isStation: cat.isStation, sortOrder: 0 })
      .onConflictDoUpdate({
        target: schema.categories.id,
        set: { label: cat.label, isStation: cat.isStation },
      });

    for (let i = 0; i < cat.actions.length; i++) {
      await db
        .insert(schema.categoryActions)
        .values({
          id: randomUUID(),
          categoryId: cat.id,
          description: cat.actions[i],
          sortOrder: i,
        })
        .onConflictDoNothing();
    }

    console.log(`  ✓ ${cat.label} (${cat.actions.length}件のアクション)`);
  }

  console.log("完了しました。");
  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });
