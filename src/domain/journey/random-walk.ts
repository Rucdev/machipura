import type { MapAggregate } from "../map/map";
import type { PlaceId } from "../map/place";
import type { Path } from "../map/path";
import type { Character } from "../character/character";
import type { CategoryValue } from "../shared/category";
import { Action } from "../shared/action";

// カテゴリごとの行動選択肢定義
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

// 営業時間外の行動選択肢
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

function selectAction(
  options: string[],
  weights: Record<string, number>,
): string {
  const totalWeight = options.reduce((sum, opt) => sum + (weights[opt] ?? 1), 0);
  let rand = Math.random() * totalWeight;
  for (const opt of options) {
    rand -= weights[opt] ?? 1;
    if (rand <= 0) return opt;
  }
  return options[options.length - 1];
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
  const steps: WalkStep[] = [];
  const deadEndIds = new Set<PlaceId>();
  let currentPlaceId = startPlaceId;
  let currentTime = new Date(startedAt);

  while (currentPlaceId !== goalPlaceId) {
    const candidatePaths = map
      .outboundPaths(currentPlaceId)
      .filter((p) => !deadEndIds.has(p.toPlaceId));

    if (candidatePaths.length === 0) {
      // 行き止まり：現在地を行き止まりとしてマークして折り返せない場合は終了
      deadEndIds.add(currentPlaceId);
      // 前のステップに戻る
      const prev = steps[steps.length - 1];
      if (!prev) break;
      currentPlaceId = prev.placeId;
      continue;
    }

    const path = candidatePaths[Math.floor(Math.random() * candidatePaths.length)];
    const durationMinutes = path.travelDurationMinutes();
    const arrivedAt = new Date(currentTime.getTime() + durationMinutes * 60 * 1000);

    const place = map.findPlace(path.toPlaceId);
    if (!place) break;

    const isOpen = place.businessHours.isOpen(arrivedAt);
    const options = isOpen
      ? ACTION_OPTIONS[place.category.value]
      : CLOSED_ACTION_OPTIONS[place.category.value];
    const weights = character.traits.getWeightsFor(place.category.value);
    const description = selectAction(options, weights);

    steps.push({
      placeId: place.id,
      arrivedAt,
      travelDurationMinutes: durationMinutes,
      action: new Action(description),
    });

    currentTime = arrivedAt;
    currentPlaceId = place.id;
  }

  return steps;
}
