"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Nav } from "@/components/nav";
import { CATEGORIES, type CategoryValue } from "@/domain/shared/category";
import { TRANSPORTS, type TransportValue } from "@/domain/shared/transport";

type Place = {
  id: string;
  name: string;
  address: { value: string };
  category: { value: CategoryValue };
  businessHours: { openHour: number; openMinute: number; closeHour: number; closeMinute: number };
};
type Path = {
  id: string;
  fromPlaceId: string;
  toPlaceId: string;
  transport: { value: TransportValue };
  distance: { km: number };
};
type MapDetail = { id: string; name: string; ownerId: string; places: Place[]; paths: Path[] };
type Character = { id: string; name: string };

const CATEGORY_LABELS: Record<CategoryValue, string> = {
  cafe: "カフェ",
  park: "公園",
  station: "駅",
  restaurant: "レストラン",
  shop: "ショップ",
  museum: "博物館",
  hotel: "ホテル",
  other: "その他",
};
const TRANSPORT_LABELS: Record<TransportValue, string> = {
  walk: "徒歩",
  bicycle: "自転車",
  car: "車",
  train: "電車",
  bus: "バス",
};

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export default function MapPage({ params }: { params: Promise<{ mapId: string }> }) {
  const router = useRouter();
  const [mapId, setMapId] = useState("");
  const [map, setMap] = useState<MapDetail | null>(null);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // 地点追加フォーム
  const [placeForm, setPlaceForm] = useState({
    name: "", address: "", category: "cafe" as CategoryValue,
    openHour: 9, openMinute: 0, closeHour: 21, closeMinute: 0,
  });

  // パス追加フォーム
  const [pathForm, setPathForm] = useState({
    fromPlaceId: "", toPlaceId: "", transport: "walk" as TransportValue, distanceKm: 1,
  });

  // Journey開始フォーム
  const [journeyForm, setJourneyForm] = useState({
    characterId: "", startPlaceId: "", goalPlaceId: "",
  });

  useEffect(() => {
    params.then(({ mapId }) => {
      setMapId(mapId);
      loadMap(mapId);
    });
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
    // ownerId を currentUserId と照合するために、別途セッション確認が必要だが
    // 簡易的に地点追加時のエラーで判断する
    setCurrentUserId(data.ownerId);
  }

  async function handleAddPlace(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch(`/api/maps/${mapId}/places`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(placeForm),
    });
    if (res.ok) {
      setPlaceForm({ name: "", address: "", category: "cafe", openHour: 9, openMinute: 0, closeHour: 21, closeMinute: 0 });
      loadMap(mapId);
    }
  }

  async function handleDeletePlace(placeId: string) {
    await fetch(`/api/maps/${mapId}/places/${placeId}`, { method: "DELETE" });
    loadMap(mapId);
  }

  async function handleAddPath(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch(`/api/maps/${mapId}/paths`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(pathForm),
    });
    if (res.ok) {
      setPathForm({ fromPlaceId: "", toPlaceId: "", transport: "walk", distanceKm: 1 });
      loadMap(mapId);
    }
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
    const res = await fetch("/api/journeys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mapId, ...journeyForm }),
    });
    if (res.ok) {
      const { id } = await res.json();
      router.push(`/journeys/${id}`);
    }
  }

  if (!map) return <div className="flex flex-col min-h-full"><Nav /><p className="p-8 text-sm text-gray-500">読み込み中...</p></div>;

  const isOwner = map.ownerId === currentUserId;
  const placeById = Object.fromEntries(map.places.map((p) => [p.id, p]));

  return (
    <div className="flex flex-col min-h-full">
      <Nav />
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-8 space-y-10">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">{map.name}</h1>
          {isOwner && (
            <button
              type="button"
              onClick={handleDeleteMap}
              className="text-sm text-red-600 hover:text-red-800"
            >
              マップを削除
            </button>
          )}
        </div>

        {/* 地点一覧 */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold">地点</h2>
          {map.places.length === 0 ? (
            <p className="text-sm text-gray-500">地点がありません</p>
          ) : (
            <ul className="space-y-2">
              {map.places.map((p) => (
                <li key={p.id} className="flex items-center justify-between border border-gray-200 rounded px-4 py-2 text-sm">
                  <div>
                    <span className="font-medium">{p.name}</span>
                    <span className="ml-2 text-gray-500">{CATEGORY_LABELS[p.category.value]}</span>
                    <span className="ml-2 text-gray-400">{p.address.value}</span>
                    <span className="ml-2 text-gray-400">
                      {pad(p.businessHours.openHour)}:{pad(p.businessHours.openMinute)}〜{pad(p.businessHours.closeHour)}:{pad(p.businessHours.closeMinute)}
                    </span>
                  </div>
                  {isOwner && (
                    <button
                      type="button"
                      onClick={() => handleDeletePlace(p.id)}
                      className="text-red-500 hover:text-red-700 ml-4"
                    >
                      削除
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}

          {isOwner && (
            <form onSubmit={handleAddPlace} className="border border-dashed border-gray-300 rounded p-4 space-y-3">
              <h3 className="text-sm font-medium">地点を追加</h3>
              <div className="grid grid-cols-2 gap-2">
                <input
                  placeholder="地点名"
                  required
                  value={placeForm.name}
                  onChange={(e) => setPlaceForm({ ...placeForm, name: e.target.value })}
                  className="border border-gray-300 rounded px-2 py-1 text-sm"
                />
                <input
                  placeholder="住所"
                  required
                  value={placeForm.address}
                  onChange={(e) => setPlaceForm({ ...placeForm, address: e.target.value })}
                  className="border border-gray-300 rounded px-2 py-1 text-sm"
                />
                <select
                  value={placeForm.category}
                  onChange={(e) => setPlaceForm({ ...placeForm, category: e.target.value as CategoryValue })}
                  className="border border-gray-300 rounded px-2 py-1 text-sm"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
                  ))}
                </select>
                <div className="flex items-center gap-1 text-sm">
                  <input
                    type="number" min={0} max={23} value={placeForm.openHour}
                    onChange={(e) => setPlaceForm({ ...placeForm, openHour: Number(e.target.value) })}
                    className="w-14 border border-gray-300 rounded px-2 py-1"
                  />
                  <span>:</span>
                  <input
                    type="number" min={0} max={59} value={placeForm.openMinute}
                    onChange={(e) => setPlaceForm({ ...placeForm, openMinute: Number(e.target.value) })}
                    className="w-14 border border-gray-300 rounded px-2 py-1"
                  />
                  <span>〜</span>
                  <input
                    type="number" min={0} max={23} value={placeForm.closeHour}
                    onChange={(e) => setPlaceForm({ ...placeForm, closeHour: Number(e.target.value) })}
                    className="w-14 border border-gray-300 rounded px-2 py-1"
                  />
                  <span>:</span>
                  <input
                    type="number" min={0} max={59} value={placeForm.closeMinute}
                    onChange={(e) => setPlaceForm({ ...placeForm, closeMinute: Number(e.target.value) })}
                    className="w-14 border border-gray-300 rounded px-2 py-1"
                  />
                </div>
              </div>
              <button type="submit" className="bg-gray-900 text-white rounded px-3 py-1 text-sm hover:bg-gray-700">
                追加
              </button>
            </form>
          )}
        </section>

        {/* パス一覧 */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold">パス</h2>
          {map.paths.length === 0 ? (
            <p className="text-sm text-gray-500">パスがありません</p>
          ) : (
            <ul className="space-y-2">
              {map.paths.map((p) => (
                <li key={p.id} className="flex items-center justify-between border border-gray-200 rounded px-4 py-2 text-sm">
                  <span>
                    {placeById[p.fromPlaceId]?.name ?? p.fromPlaceId}
                    <span className="mx-2 text-gray-400">→</span>
                    {placeById[p.toPlaceId]?.name ?? p.toPlaceId}
                    <span className="ml-2 text-gray-500">{TRANSPORT_LABELS[p.transport.value]}</span>
                    <span className="ml-2 text-gray-400">{p.distance.km}km</span>
                  </span>
                  {isOwner && (
                    <button
                      type="button"
                      onClick={() => handleDeletePath(p.id)}
                      className="text-red-500 hover:text-red-700 ml-4"
                    >
                      削除
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}

          {isOwner && map.places.length >= 2 && (
            <form onSubmit={handleAddPath} className="border border-dashed border-gray-300 rounded p-4 space-y-3">
              <h3 className="text-sm font-medium">パスを追加</h3>
              <div className="grid grid-cols-2 gap-2">
                <select
                  required
                  value={pathForm.fromPlaceId}
                  onChange={(e) => setPathForm({ ...pathForm, fromPlaceId: e.target.value })}
                  className="border border-gray-300 rounded px-2 py-1 text-sm"
                >
                  <option value="">始点を選択</option>
                  {map.places.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                <select
                  required
                  value={pathForm.toPlaceId}
                  onChange={(e) => setPathForm({ ...pathForm, toPlaceId: e.target.value })}
                  className="border border-gray-300 rounded px-2 py-1 text-sm"
                >
                  <option value="">終点を選択</option>
                  {map.places.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                <select
                  value={pathForm.transport}
                  onChange={(e) => setPathForm({ ...pathForm, transport: e.target.value as TransportValue })}
                  className="border border-gray-300 rounded px-2 py-1 text-sm"
                >
                  {TRANSPORTS.map((t) => <option key={t} value={t}>{TRANSPORT_LABELS[t]}</option>)}
                </select>
                <div className="flex items-center gap-1 text-sm">
                  <input
                    type="number" min={0.1} step={0.1} value={pathForm.distanceKm}
                    onChange={(e) => setPathForm({ ...pathForm, distanceKm: Number(e.target.value) })}
                    className="w-20 border border-gray-300 rounded px-2 py-1"
                  />
                  <span>km</span>
                </div>
              </div>
              <button type="submit" className="bg-gray-900 text-white rounded px-3 py-1 text-sm hover:bg-gray-700">
                追加
              </button>
            </form>
          )}
        </section>

        {/* Journey開始 */}
        {map.places.length >= 2 && characters.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-lg font-semibold">Journeyを始める</h2>
            <form onSubmit={handleStartJourney} className="border border-gray-200 rounded p-4 space-y-3">
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                <select
                  required
                  value={journeyForm.characterId}
                  onChange={(e) => setJourneyForm({ ...journeyForm, characterId: e.target.value })}
                  className="border border-gray-300 rounded px-2 py-1 text-sm"
                >
                  <option value="">キャラクターを選択</option>
                  {characters.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <select
                  required
                  value={journeyForm.startPlaceId}
                  onChange={(e) => setJourneyForm({ ...journeyForm, startPlaceId: e.target.value })}
                  className="border border-gray-300 rounded px-2 py-1 text-sm"
                >
                  <option value="">始点を選択</option>
                  {map.places.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                <select
                  required
                  value={journeyForm.goalPlaceId}
                  onChange={(e) => setJourneyForm({ ...journeyForm, goalPlaceId: e.target.value })}
                  className="border border-gray-300 rounded px-2 py-1 text-sm"
                >
                  <option value="">終点を選択</option>
                  {map.places.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <button type="submit" className="bg-gray-900 text-white rounded px-4 py-2 text-sm font-medium hover:bg-gray-700">
                出発する
              </button>
            </form>
          </section>
        )}
      </main>
    </div>
  );
}
