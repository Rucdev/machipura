import type { MapAggregate } from "../map/map";
import type { PlaceId } from "../map/place";
import type { Character } from "../character/character";
import type { CategoryValue } from "../shared/category";
import { Action } from "../shared/action";

const ACTION_OPTIONS: Record<CategoryValue, string[]> = {
  cafe: ["コーヒーを飲んだ", "読書をした", "友人と話した", "軽食を食べた"],
  park: ["散歩をした", "ベンチで休んだ", "写真を撮った", "ジョギングをした"],
  station: ["電車を待った", "時刻表を確認した", "売店で買い物をした"],
  restaurant: ["食事をした", "メニューを眺めた", "持ち帰りを注文した"],
  shop: ["ウィンドウショッピングをした", "商品を購入した", "店員と話した"],
  museum: ["展示を鑑賞した", "図録を買った", "解説を読んだ"],
  hotel: ["チェックインした", "ロビーで休憩した", "荷物を預けた"],
  other: ["しばらく過ごした", "周囲を観察した"],
};

const CLOSED_ACTION_OPTIONS: Record<CategoryValue, string[]> = {
  cafe: ["閉まっていたので外から眺めた"],
  park: ["散歩をした", "ベンチで休んだ", "写真を撮った"],
  station: ["時刻表を確認した"],
  restaurant: ["閉まっていたのでメニューを外から確認した"],
  shop: ["ウィンドウショッピングをした"],
  museum: ["外観を眺めた"],
  hotel: ["外から確認した"],
  other: ["しばらく過ごした"],
};

// mulberry32 — fast seedable PRNG returning [0, 1)
function makePrng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s += 0x6d2b79f5;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) >>> 0;
    return ((t ^ (t >>> 14)) >>> 0) / 0x100000000;
  };
}

function selectAction(
  options: string[],
  weights: Record<string, number>,
  rand: () => number,
): string {
  const totalWeight = options.reduce((sum, opt) => sum + (weights[opt] ?? 1), 0);
  let r = rand() * totalWeight;
  for (const opt of options) {
    r -= weights[opt] ?? 1;
    if (r <= 0) return opt;
  }
  return options[options.length - 1];
}

// ダイクストラ法で start → goal の最短経路（PlaceId の配列、始点を含まず）を返す。
// 到達不可能な場合は null を返す。
function shortestPath(
  map: MapAggregate,
  startPlaceId: PlaceId,
  goalPlaceId: PlaceId,
): PlaceId[] | null {
  if (startPlaceId === goalPlaceId) return [];

  const dist = new Map<PlaceId, number>();
  const prev = new Map<PlaceId, PlaceId>();
  const visited = new Set<PlaceId>();

  for (const p of map.places) dist.set(p.id, Number.POSITIVE_INFINITY);
  dist.set(startPlaceId, 0);

  while (true) {
    // 未訪問の中で最小コストのノードを選ぶ
    let u: PlaceId | null = null;
    let minDist = Number.POSITIVE_INFINITY;
    for (const [id, d] of dist) {
      if (!visited.has(id) && d < minDist) { minDist = d; u = id; }
    }
    if (u === null || minDist === Number.POSITIVE_INFINITY) break;

    visited.add(u);
    if (u === goalPlaceId) break;

    for (const { path, nextPlaceId } of map.outboundPaths(u)) {
      if (visited.has(nextPlaceId)) continue;
      const alt = minDist + path.travelDurationMinutes();
      if (alt < (dist.get(nextPlaceId) ?? Number.POSITIVE_INFINITY)) {
        dist.set(nextPlaceId, alt);
        prev.set(nextPlaceId, u);
      }
    }
  }

  if (!prev.has(goalPlaceId)) return null;

  // prev を辿って経路を復元（始点は含まない）
  const route: PlaceId[] = [];
  let cur: PlaceId | undefined = goalPlaceId;
  while (cur !== undefined && cur !== startPlaceId) {
    route.unshift(cur);
    const next = prev.get(cur);
    if (next === undefined) return null; // 経路が途切れている（到達不可）
    cur = next;
  }
  return route;
}

export type WalkStep = {
  placeId: PlaceId;
  arrivedAt: Date;
  travelDurationMinutes: number;
  action: Action;
};

export function executeRandomWalk(
  map: MapAggregate,
  character: Character,
  startPlaceId: PlaceId,
  goalPlaceId: PlaceId,
  startedAt: Date,
): WalkStep[] {
  const rand = makePrng(character.seed);
  const route = shortestPath(map, startPlaceId, goalPlaceId);
  if (route === null) throw new Error("No path from start to goal");
  if (route.length === 0) return [];

  const steps: WalkStep[] = [];
  let currentPlaceId = startPlaceId;
  let currentTime = new Date(startedAt);

  for (const nextPlaceId of route) {
    const edge = map.outboundPaths(currentPlaceId).find((e) => e.nextPlaceId === nextPlaceId);
    if (!edge) break;

    const durationMinutes = edge.path.travelDurationMinutes();
    const arrivedAt = new Date(currentTime.getTime() + durationMinutes * 60 * 1000);

    const place = map.findPlace(nextPlaceId);
    if (!place) break;

    const isBus = edge.path.transport.value === "bus";
    const isLastStep = nextPlaceId === goalPlaceId;

    let description: string;
    if (isBus && !isLastStep) {
      description = "バスで通過した";
    } else {
      const isOpen = place.businessHours.isOpen(arrivedAt);
      const options = isOpen
        ? ACTION_OPTIONS[place.category.value]
        : CLOSED_ACTION_OPTIONS[place.category.value];
      const weights = character.traits.getWeightsFor(place.category.value);
      description = selectAction(options, weights, rand);
    }

    steps.push({
      placeId: place.id,
      arrivedAt,
      travelDurationMinutes: durationMinutes,
      action: new Action(description),
    });

    currentTime = arrivedAt;
    currentPlaceId = nextPlaceId;
  }

  return steps;
}
