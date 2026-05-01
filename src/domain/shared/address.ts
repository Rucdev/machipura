export class Address {
  constructor(readonly value: string) {
    if (value.trim().length === 0) throw new Error("Address cannot be empty");
  }

  equals(other: Address): boolean {
    return this.value === other.value;
  }
}
