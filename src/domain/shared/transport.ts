export const TRANSPORTS = ["walk", "bicycle", "car", "train", "bus"] as const;

export type TransportValue = (typeof TRANSPORTS)[number];

// km/h
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
