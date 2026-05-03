"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Nav } from "@/components/nav";

type ActionLog = {
  id: string;
  placeId: string;
  placeName: string | null;
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
      <div className="flex flex-col min-h-full bg-white dark:bg-gray-950">
        <Nav />
        <p className="p-8 text-sm text-gray-500 dark:text-gray-400">読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full bg-white dark:bg-gray-950">
      <Nav />
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Journey記録</h1>
          <Link href={`/maps/${journey.mapId}`} className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100">
            マップに戻る
          </Link>
        </div>

        <div className="text-sm text-gray-500 dark:text-gray-400 space-y-1">
          <p>出発時刻: {formatTime(journey.startedAt)}</p>
          <p>ステータス: {journey.status === "completed" ? "完了" : "進行中"}</p>
          <p>経由地点数: {journey.logs.length}</p>
        </div>

        <section>
          <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">軌跡</h2>
          {journey.logs.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">記録がありません</p>
          ) : (
            <ol className="relative border-l border-gray-200 dark:border-gray-700 space-y-6 ml-3">
              {journey.logs.map((log, i) => {
                const isDepart = i === 0;
                const isArrive = i === journey.logs.length - 1;
                const isMilestone = isDepart || isArrive;
                return (
                  <li key={log.id} className="ml-6">
                    <span className={`absolute -left-3 flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                      isMilestone
                        ? "bg-indigo-600 dark:bg-indigo-400 text-white dark:text-gray-900"
                        : "bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900"
                    }`}>
                      {isDepart ? "▶" : isArrive ? "★" : i}
                    </span>
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{formatTime(log.arrivedAt)}</span>
                      {log.placeName && (
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                          @ {log.placeName}
                        </span>
                      )}
                      {!isMilestone && (
                        <span className="text-xs text-gray-400 dark:text-gray-500">
                          ({formatDuration(log.travelDurationMinutes)}かけて到着)
                        </span>
                      )}
                    </div>
                    <p className={`text-sm ${isMilestone ? "font-semibold text-indigo-700 dark:text-indigo-300" : "text-gray-700 dark:text-gray-300"}`}>
                      {log.action}
                    </p>
                  </li>
                );
              })}
            </ol>
          )}
        </section>
      </main>
    </div>
  );
}
