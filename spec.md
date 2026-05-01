# machipura

## コンセプト

オリジナルのマップを作って好きな始点と終点を決めてキャラクターを向かわせる。
その軌跡はランダムに描かれる。

軌跡は道筋と各地点で何をしたかが書き加えられて、ユーザーはそれを後から見ることができる。

## 開発

DDDで進める。

Next.jsのみで開発する。

DBはSQLite。ORMはDrizzle。

本番環境はbunのコンテナで運用する。

## マップ

- マップは地点とパスからなる有向グラフとして管理する
- マップは誰でも作成・閲覧できる
- 編集（地点・パスの追加・削除・変更）は作成したユーザーのみ可能
- 複数のキャラクターが同時に同じマップを移動できる

## キャラクター

- キャラクターはユーザーに紐づく
- ユーザーはキャラクターに名前をつけることができる
- キャラクターの特性（行動選択の確率分布）はシステムが決定し、ユーザーは変更できない
- 複数のキャラクターが同時に一つのマップを移動することが可能

## ランダムウォーク

- キャラクターは始点から終点へランダムウォークで移動する
- 各地点で次に進むパスはランダムに選択される（有向グラフなので出方向のパスのみ対象）
- 行き止まり（終点以外で出方向のパスがない地点）に入った場合は折り返し、以降その行き止まりへのパスには進まない
- 終点に辿り着いた時点で移動終了

## 地点

- 地点はカテゴリと営業時間を持つ
- カテゴリによって、その地点で発生しうる行動の選択肢が変わる
- 地点は仮想的な住所（アドレス）を持つ（実際の地名・座標は不要）

## パス

- パスは有向で、始点地点・終点地点・移動手段・距離を持つ
- 移動手段と距離から移動時間が算出される
- 移動時間は記録として行動履歴に表示されるが、リアルタイムの待ち時間は発生しない

## 行動

- 移動開始時刻はシステム時刻（現実の時刻）を使用する
- 各地点への到着時刻は、移動開始時刻に経路上の移動時間を積算して算出する
- キャラクターが地点に到達すると、その地点の営業時間と到着時刻を照合する
  - 営業時間内の選択肢と営業時間外の選択肢は異なる（営業時間外は取れる行動が制限される）
- 有効な行動選択肢の中から、キャラクターの特性に基づく確率でひとつが選ばれる
- 行動履歴には選ばれた行動の結果のみ記録される（選択の過程は記録しない）

## ユーザー認証

- ユーザーのログインとアカウント認証は必須
- キャラクターはログインユーザーに紐づく

## ドメインモデル

### 集約1: Map

地点とパスからなるグラフの整合性をマップ単位で保証する。

```
Map（集約ルート）
├── id
├── name
├── ownerId
├── Place[]
│   ├── id
│   ├── name
│   ├── address: Address
│   ├── category: Category
│   └── businessHours: BusinessHours
└── Path[]
    ├── id
    ├── fromPlaceId
    ├── toPlaceId
    ├── transport: Transport
    └── distance: Distance
```

### 集約2: Character

ユーザーに紐づくキャラクター。特性はシステムが生成し不変。

```
Character（集約ルート）
├── id
├── name
├── ownerId
└── traits: Traits
```

### 集約3: Journey

キャラクターがマップ上を移動した1回の記録。ランダムウォークのロジックと行動履歴を管理する。

- Journey は mapId・characterId を参照するのみで、Map集約の内部には依存しない
- Map が削除されると Journey も合わせて削除される
- ランダムウォークは1回の実行で完結する（中断・再開なし）
- 行き止まりリストは実行中のメモリ上で管理し、永続化しない

```
Journey（集約ルート）
├── id
├── characterId
├── mapId
├── startPlaceId
├── goalPlaceId
├── startedAt
├── status: JourneyStatus  // 進行中 | 完了
└── ActionLog[]
    ├── id
    ├── placeId
    ├── arrivedAt
    ├── travelDuration
    └── action: Action
```

### 値オブジェクト

| 名前 | 説明 |
|---|---|
| Address | 仮想的な住所文字列 |
| Category | 地点のカテゴリ（行動選択肢を規定） |
| BusinessHours | 営業時間（開始・終了時刻） |
| Transport | 移動手段（移動時間の算出に使用） |
| Distance | 距離（移動時間の算出に使用） |
| Traits | キャラクターの特性（行動選択の確率分布） |
| Action | 行動結果の記録 |
| JourneyStatus | 進行中 / 完了 |

### リポジトリ

- MapRepository
- CharacterRepository
- JourneyRepository

## ディレクトリ構成

```
src/
├── app/                          # Next.js App Router（UIとAPI）
│   ├── (auth)/                   # ログイン・登録画面
│   ├── maps/                     # マップ一覧・詳細
│   ├── characters/               # キャラクター管理
│   ├── journeys/                 # Journey記録閲覧
│   └── api/                      # Route Handlers
│       ├── maps/
│       ├── characters/
│       └── journeys/
│
├── domain/                       # ドメイン層（純粋なビジネスロジック、外部依存なし）
│   ├── map/
│   │   ├── map.ts                # Map集約ルート
│   │   ├── place.ts              # Placeエンティティ
│   │   ├── path.ts               # Pathエンティティ
│   │   └── map-repository.ts     # リポジトリインターフェース
│   ├── character/
│   │   ├── character.ts
│   │   └── character-repository.ts
│   ├── journey/
│   │   ├── journey.ts
│   │   ├── action-log.ts
│   │   ├── random-walk.ts        # ランダムウォークロジック
│   │   └── journey-repository.ts
│   └── shared/                   # 共有値オブジェクト
│       ├── address.ts
│       ├── category.ts
│       ├── business-hours.ts
│       ├── transport.ts
│       ├── distance.ts
│       ├── traits.ts
│       └── action.ts
│
├── infrastructure/               # インフラ層（DB・外部サービス）
│   ├── db/
│   │   ├── schema.ts             # Drizzleスキーマ
│   │   ├── client.ts             # DBクライアント
│   │   └── migrations/
│   └── repository/               # リポジトリ実装
│       ├── map-repository.ts
│       ├── character-repository.ts
│       └── journey-repository.ts
│
└── application/                  # アプリケーション層（ユースケース）
    ├── map/
    │   ├── create-map.ts
    │   ├── delete-map.ts
    │   ├── add-place.ts
    │   └── ...
    ├── character/
    │   ├── create-character.ts
    │   └── rename-character.ts
    └── journey/
        └── start-journey.ts
```

依存の方向: `app` → `application` → `domain` ← `infrastructure`

## ユースケース

### マップ管理
- マップを作成する
- マップを削除する

### 地点管理
- 地点を追加する
- 地点を削除する
- 地点のアドレスを変更する
- 地点の名前を変更する
- 地点のカテゴリを変更する
- 地点の営業時間を変更する

### パス管理
- パスを作成する（有向：始点と終点を指定）
- パスを削除する

### キャラクター管理
- キャラクターを作成する
- キャラクターの名前を変更する

### 行動
- キャラクターをマップ上で移動させる（始点・終点を指定してランダムウォーク開始）
- 地点到達時に行動を記録する
