"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Nav } from "@/components/nav";
import { MapCanvas, type CanvasMode } from "@/components/map-canvas";
import { CATEGORIES, type CategoryValue } from "@/domain/shared/category";

type Place = {
  id: string;
  name: string;
  coordinate: { x: number; y: number };
  category: { value: CategoryValue };
  businessHours: { openHour: number; openMinute: number; closeHour: number; closeMinute: number };
};
type Path = {
  id: string;
  fromPlaceId: string;
  toPlaceId: string;
  transport: string;
  distanceKm: number;
};
type MapDetail = { id: string; name: string; ownerId: string; places: Place[]; paths: Path[] };
type Character = { id: string; name: string };

const CATEGORY_LABELS: Record<CategoryValue, string> = {
  cafe: "カフェ", park: "公園", station: "駅", restaurant: "レストラン",
  shop: "ショップ", museum: "博物館", hotel: "ホテル", other: "その他",
};
const TRANSPORT_LABELS: Record<string, string> = {
  walk: "徒歩", bicycle: "自転車", car: "車", train: "電車", bus: "バス",
};

function pad(n: number) { return String(n).padStart(2, "0"); }

const BLANK_PLACE_FORM = {
  name: "", category: "cafe" as CategoryValue,
  openHour: 9, openMinute: 0, closeHour: 21, closeMinute: 0,
};

const INPUT_CLS = "w-full border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500";
const SELECT_CLS = "w-full border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100";
const NUM_CLS = "w-12 border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100";
const BTN_PRIMARY = "bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded px-3 py-1 text-sm hover:bg-gray-700 dark:hover:bg-gray-300";
const BTN_GHOST = "text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200";

export default function MapPage({ params }: { params: Promise<{ mapId: string }> }) {
  const router = useRouter();
  const [mapId, setMapId] = useState("");
  const [map, setMap] = useState<MapDetail | null>(null);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [canvasMode, setCanvasMode] = useState<CanvasMode>("normal");

  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);
  const [pendingCoord, setPendingCoord] = useState<{ x: number; y: number } | null>(null);
  const [placeForm, setPlaceForm] = useState(BLANK_PLACE_FORM);
  const [journeyForm, setJourneyForm] = useState({ characterId: "", startPlaceId: "", goalPlaceId: "" });
  const [journeyError, setJourneyError] = useState<string | null>(null);

  useEffect(() => {
    params.then(({ mapId }) => { setMapId(mapId); loadMap(mapId); });
    fetch("/api/characters").then(async (r) => {
      if (r.status === 401) { router.push("/login"); return; }
      setCharacters(await r.json());
    });
  }, [params, router]);

  async function loadMap(id: string) {
    const r = await fetch(`/api/maps/${id}`);
    if (r.status === 401) { router.push("/login"); return; }
    if (!r.ok) { router.push("/"); return; }
    const data = await r.json();
    setMap(data);
    setCurrentUserId(data.ownerId);
  }

  async function handleAddPlace(e: React.FormEvent) {
    e.preventDefault();
    if (!pendingCoord) return;
    const res = await fetch(`/api/maps/${mapId}/places`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...placeForm, x: pendingCoord.x, y: pendingCoord.y }),
    });
    if (res.ok) { setPlaceForm(BLANK_PLACE_FORM); setPendingCoord(null); loadMap(mapId); }
  }

  async function handleDeletePlace(placeId: string) {
    await fetch(`/api/maps/${mapId}/places/${placeId}`, { method: "DELETE" });
    setSelectedPlaceId(null);
    loadMap(mapId);
  }

  async function handleMovePlace(placeId: string, x: number, y: number) {
    await fetch(`/api/maps/${mapId}/places/${placeId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ x, y }),
    });
    loadMap(mapId);
  }

  async function handleConnectPlaces(fromPlaceId: string, toPlaceId: string) {
    await fetch(`/api/maps/${mapId}/paths`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fromPlaceId, toPlaceId }),
    });
    loadMap(mapId);
  }

  async function handleDeletePath(pathId: string) {
    await fetch(`/api/maps/${mapId}/paths/${pathId}`, { method: "DELETE" });
    loadMap(mapId);
  }

  async function handleDeleteMap() {
    if (!confirm("このマップを削除しますか？")) return;
    const res = await fetch(`/api/maps/${mapId}`, { method: "DELETE" });
    if (res.ok) router.push("/");
  }

  async function handleStartJourney(e: React.FormEvent) {
    e.preventDefault();
    setJourneyError(null);
    const res = await fetch("/api/journeys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mapId, ...journeyForm }),
    });
    if (res.ok) {
      const { id } = await res.json();
      router.push(`/journeys/${id}`);
    } else {
      const body = await res.json();
      setJourneyError(body.error ?? "エラーが発生しました");
    }
  }

  if (!map) return (
    <div className="flex flex-col min-h-full bg-white dark:bg-gray-950">
      <Nav />
      <p className="p-8 text-sm text-gray-500 dark:text-gray-400">読み込み中...</p>
    </div>
  );

  const isOwner = map.ownerId === currentUserId;
  const selectedPlace = map.places.find((p) => p.id === selectedPlaceId) ?? null;
  const placeById = Object.fromEntries(map.places.map((p) => [p.id, p]));

  return (
    <div className="flex flex-col min-h-full bg-white dark:bg-gray-950">
      <Nav />
      <main className="flex-1 w-full px-4 py-8 max-w-6xl mx-auto space-y-6">
        {/* header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{map.name}</h1>
          {isOwner && (
            <button type="button" onClick={handleDeleteMap} className="text-sm text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300">
              マップを削除
            </button>
          )}
        </div>

        {/* canvas + side panel */}
        <div className="flex gap-6 items-start">
          <div className="flex-1 min-w-0 space-y-2">
            {/* mode toggle */}
            {isOwner && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => { setCanvasMode("normal"); setPendingCoord(null); }}
                  className={`px-3 py-1 text-xs rounded border ${canvasMode === "normal" ? "bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 border-transparent" : "border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400"}`}
                >
                  ノーマル
                </button>
                <button
                  type="button"
                  onClick={() => { setCanvasMode("edit"); setPendingCoord(null); }}
                  className={`px-3 py-1 text-xs rounded border ${canvasMode === "edit" ? "bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 border-transparent" : "border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400"}`}
                >
                  編集
                </button>
                <span className="text-xs text-gray-400 dark:text-gray-500">
                  {canvasMode === "normal"
                    ? "クリック→地点追加 / 地点からドラッグ→パス作成"
                    : "ドラッグ→地点を移動"}
                </span>
              </div>
            )}

            <MapCanvas
              places={map.places}
              paths={map.paths}
              selectedPlaceId={selectedPlaceId}
              pendingCoord={pendingCoord}
              mode={canvasMode}
              isOwner={isOwner}
              onSelectPlace={setSelectedPlaceId}
              onClickEmpty={(x, y) => {
                if (canvasMode !== "normal") return;
                setSelectedPlaceId(null);
                setPendingCoord({ x, y });
              }}
              onMovePlace={handleMovePlace}
              onConnectPlaces={handleConnectPlaces}
            />
          </div>

          {/* side panel */}
          <div className="w-72 shrink-0 space-y-4">
            {/* selected place info */}
            {selectedPlace && (
              <div className="border border-indigo-200 dark:border-indigo-800 rounded p-4 space-y-2 bg-indigo-50 dark:bg-indigo-950">
                <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100">{selectedPlace.name}</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">{CATEGORY_LABELS[selectedPlace.category.value]}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {pad(selectedPlace.businessHours.openHour)}:{pad(selectedPlace.businessHours.openMinute)}〜
                  {pad(selectedPlace.businessHours.closeHour)}:{pad(selectedPlace.businessHours.closeMinute)}
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  ({selectedPlace.coordinate.x}, {selectedPlace.coordinate.y})
                </p>
                {isOwner && (
                  <button type="button" onClick={() => handleDeletePlace(selectedPlace.id)}
                    className="text-xs text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300">
                    この地点を削除
                  </button>
                )}
              </div>
            )}

            {/* add place form */}
            {isOwner && pendingCoord && (
              <div className="border border-dashed border-indigo-300 dark:border-indigo-700 rounded p-4 space-y-3 bg-white dark:bg-gray-900">
                <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  地点を追加
                  <span className="ml-2 text-xs text-gray-400 dark:text-gray-500 font-normal">
                    ({pendingCoord.x}, {pendingCoord.y})
                  </span>
                </h3>
                <form onSubmit={handleAddPlace} className="space-y-2">
                  <input placeholder="地点名" required value={placeForm.name}
                    onChange={(e) => setPlaceForm({ ...placeForm, name: e.target.value })}
                    className={INPUT_CLS} />
                  <select value={placeForm.category}
                    onChange={(e) => setPlaceForm({ ...placeForm, category: e.target.value as CategoryValue })}
                    className={SELECT_CLS}>
                    {CATEGORIES.map((c) => <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>)}
                  </select>
                  <div className="flex items-center gap-1 text-xs text-gray-700 dark:text-gray-300">
                    <input type="number" min={0} max={23} value={placeForm.openHour}
                      onChange={(e) => setPlaceForm({ ...placeForm, openHour: Number(e.target.value) })} className={NUM_CLS} />
                    <span>:</span>
                    <input type="number" min={0} max={59} value={placeForm.openMinute}
                      onChange={(e) => setPlaceForm({ ...placeForm, openMinute: Number(e.target.value) })} className={NUM_CLS} />
                    <span>〜</span>
                    <input type="number" min={0} max={23} value={placeForm.closeHour}
                      onChange={(e) => setPlaceForm({ ...placeForm, closeHour: Number(e.target.value) })} className={NUM_CLS} />
                    <span>:</span>
                    <input type="number" min={0} max={59} value={placeForm.closeMinute}
                      onChange={(e) => setPlaceForm({ ...placeForm, closeMinute: Number(e.target.value) })} className={NUM_CLS} />
                  </div>
                  <div className="flex gap-2">
                    <button type="submit" className={BTN_PRIMARY}>追加</button>
                    <button type="button" onClick={() => { setPendingCoord(null); setPlaceForm(BLANK_PLACE_FORM); }} className={BTN_GHOST}>キャンセル</button>
                  </div>
                </form>
              </div>
            )}

            {/* paths list */}
            {map.paths.length > 0 && (
              <div className="border border-gray-200 dark:border-gray-700 rounded p-4 space-y-2 bg-white dark:bg-gray-900">
                <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">パス一覧</h3>
                <ul className="space-y-1">
                  {map.paths.map((p) => (
                    <li key={p.id} className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
                      <span>
                        {placeById[p.fromPlaceId]?.name ?? "?"}
                        <span className="mx-1 text-gray-400">↔</span>
                        {placeById[p.toPlaceId]?.name ?? "?"}
                        <span className="ml-1 text-gray-400">({TRANSPORT_LABELS[p.transport] ?? p.transport})</span>
                      </span>
                      {isOwner && (
                        <button type="button" onClick={() => handleDeletePath(p.id)}
                          className="text-red-400 hover:text-red-600 ml-2">削除</button>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Journey section */}
        {map.places.length >= 2 && characters.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Journeyを始める</h2>
            <form onSubmit={handleStartJourney} className="border border-gray-200 dark:border-gray-700 rounded p-4 space-y-3 bg-white dark:bg-gray-900">
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                <select required value={journeyForm.characterId}
                  onChange={(e) => setJourneyForm({ ...journeyForm, characterId: e.target.value })}
                  className={SELECT_CLS}>
                  <option value="">キャラクターを選択</option>
                  {characters.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <select required value={journeyForm.startPlaceId}
                  onChange={(e) => setJourneyForm({ ...journeyForm, startPlaceId: e.target.value })}
                  className={SELECT_CLS}>
                  <option value="">始点を選択</option>
                  {map.places.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                <select required value={journeyForm.goalPlaceId}
                  onChange={(e) => setJourneyForm({ ...journeyForm, goalPlaceId: e.target.value })}
                  className={SELECT_CLS}>
                  <option value="">終点を選択</option>
                  {map.places.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              {journeyError && <p className="text-sm text-red-600 dark:text-red-400">{journeyError}</p>}
              <button type="submit" className="bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded px-4 py-2 text-sm font-medium hover:bg-gray-700 dark:hover:bg-gray-300">
                出発する
              </button>
            </form>
          </section>
        )}
      </main>
    </div>
  );
}
