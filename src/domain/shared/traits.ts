import type { CategoryValue } from "./category";

export type ActionWeights = Record<string, number>;

// キャラクターの特性：カテゴリごとの行動選択重みを持つ
export class Traits {
  constructor(
    readonly weights: Partial<Record<CategoryValue, ActionWeights>>,
  ) {}

  getWeightsFor(category: CategoryValue): ActionWeights {
    return this.weights[category] ?? {};
  }
}
