import type { CategoryId } from "./category";

export type ActionWeights = Record<string, number>;

export class Traits {
  constructor(
    readonly weights: Partial<Record<CategoryId, ActionWeights>>,
  ) {}

  getWeightsFor(categoryId: CategoryId): ActionWeights {
    return this.weights[categoryId] ?? {};
  }
}
