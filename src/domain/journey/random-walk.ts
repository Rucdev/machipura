import type { MapAggregate } from "../map/map";
import type { PlaceId } from "../map/place";
import type { Character } from "../character/character";
import type { CategoryId } from "../shared/category";
import { Action } from "../shared/action";

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
  if (options.length === 0) return "しばらく過ごした";
  const totalWeight = options.reduce((sum, opt) => sum + (weights[opt] ?? 1), 0);
  let r = rand() * totalWeight;
  for (const opt of options) {
    r -= weights[opt] ?? 1;
    if (r <= 0) return opt;
  }
  return options[options.length - 1];
}

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

  const route: PlaceId[] = [];
  let cur: PlaceId | undefined = goalPlaceId;
  while (cur !== undefined && cur !== startPlaceId) {
    route.unshift(cur);
    const next = prev.get(cur);
    if (next === undefined) return null;
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
  actionsByCategoryId: Map<CategoryId, string[]>,
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
      const options = actionsByCategoryId.get(place.category.id) ?? [];
      const weights = character.traits.getWeightsFor(place.category.id);
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
