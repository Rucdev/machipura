import type { CategoryValue } from "./category";

export const TRANSPORTS = ["walk", "bicycle", "car", "train", "bus"] as const;

export type TransportValue = (typeof TRANSPORTS)[number];

const SPEED_KMH: Record<TransportValue, number> = {
  walk: 4,
  bicycle: 15,
  car: 40,
  train: 80,
  bus: 25,
};

export class Transport {
  constructor(readonly value: TransportValue) {}

  speedKmh(): number {
    return SPEED_KMH[this.value];
  }

  equals(other: Transport): boolean {
    return this.value === other.value;
  }
}

// 駅同士は電車で確定
// 駅↔その他は バス（幹線移動）
// その他同士は 徒歩・自転車・車から距離で選択
export function resolveTransport(from: CategoryValue, to: CategoryValue): TransportValue {
  const isStation = (c: CategoryValue) => c === "station";
  if (isStation(from) && isStation(to)) return "train";
  if (isStation(from) || isStation(to)) return "bus";
  return "walk";
}
