"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Nav } from "@/components/nav";

type ActionLog = {
  id: string;
  placeId: string;
  arrivedAt: string;
  travelDurationMinutes: number;
  action: string;
};
type Journey = {
  id: string;
  characterId: string;
  mapId: string;
  startPlaceId: string;
  goalPlaceId: string;
  startedAt: string;
  status: string;
  logs: ActionLog[];
};

function formatTime(iso: string) {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function formatDuration(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (h === 0) return `${m}分`;
  return `${h}時間${m}分`;
}

export default function JourneyPage({ params }: { params: Promise<{ journeyId: string }> }) {
  const router = useRouter();
  const [journey, setJourney] = useState<Journey | null>(null);

  useEffect(() => {
    params.then(({ journeyId }) => {
      fetch(`/api/journeys/${journeyId}`).then(async (r) => {
        if (r.status === 401) { router.push("/login"); return; }
        if (!r.ok) { router.push("/"); return; }
        setJourney(await r.json());
      });
    });
  }, [params, router]);

  if (!journey) {
    return (
      <div className="flex flex-col min-h-full">
        <Nav />
        <p className="p-8 text-sm text-gray-500">読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full">
      <Nav />
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Journey記録</h1>
          <Link href={`/maps/${journey.mapId}`} className="text-sm text-gray-500 hover:text-gray-900">
            マップに戻る
          </Link>
        </div>

        <div className="text-sm text-gray-500 space-y-1">
          <p>出発時刻: {formatTime(journey.startedAt)}</p>
          <p>ステータス: {journey.status === "completed" ? "完了" : "進行中"}</p>
          <p>経由地点数: {journey.logs.length}</p>
        </div>

        <section>
          <h2 className="text-lg font-semibold mb-4">軌跡</h2>
          {journey.logs.length === 0 ? (
            <p className="text-sm text-gray-500">記録がありません</p>
          ) : (
            <ol className="relative border-l border-gray-200 space-y-6 ml-3">
              {journey.logs.map((log, i) => (
                <li key={log.id} className="ml-6">
                  <span className="absolute -left-3 flex h-6 w-6 items-center justify-center rounded-full bg-gray-900 text-white text-xs font-bold">
                    {i + 1}
                  </span>
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="text-sm font-medium">{formatTime(log.arrivedAt)}</span>
                    <span className="text-xs text-gray-400">
                      ({formatDuration(log.travelDurationMinutes)}かけて到着)
                    </span>
                  </div>
                  <p className="text-sm text-gray-700">{log.action}</p>
                </li>
              ))}
            </ol>
          )}
        </section>
      </main>
    </div>
  );
}
