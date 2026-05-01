export class Action {
  constructor(readonly description: string) {
    if (description.trim().length === 0) throw new Error("Action description cannot be empty");
  }

  equals(other: Action): boolean {
    return this.description === other.description;
  }
}
