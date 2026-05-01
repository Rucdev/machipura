export class Distance {
  constructor(readonly km: number) {
    if (km <= 0) throw new Error("Distance must be positive");
  }

  equals(other: Distance): boolean {
    return this.km === other.km;
  }
}
