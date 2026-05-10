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
// 駅↔その他はバス（幹線移動）
// その他同士は徒歩
export function resolveTransport(fromIsStation: boolean, toIsStation: boolean): TransportValue {
  if (fromIsStation && toIsStation) return "train";
  if (fromIsStation || toIsStation) return "bus";
  return "walk";
}
