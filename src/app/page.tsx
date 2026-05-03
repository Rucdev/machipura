"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Nav } from "@/components/nav";

type MapItem = { id: string; name: string; ownerId: string };

export default function HomePage() {
  const router = useRouter();
  const [maps, setMaps] = useState<MapItem[]>([]);
  const [newName, setNewName] = useState("");

  useEffect(() => {
    fetch("/api/maps").then((r) => {
      if (r.status === 401) router.push("/login");
      else r.json().then(setMaps);
    });
  }, [router]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/maps", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName }),
    });
    if (res.ok) {
      const { id } = await res.json();
      router.push(`/maps/${id}`);
    }
  }

  return (
    <div className="flex flex-col min-h-full bg-white dark:bg-gray-950">
      <Nav />
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-8 space-y-8">
        <section>
          <h2 className="text-lg font-semibold mb-3 text-gray-900 dark:text-gray-100">新しいマップを作る</h2>
          <form onSubmit={handleCreate} className="flex gap-2">
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="マップ名"
              required
              className="flex-1 border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-500 placeholder-gray-400 dark:placeholder-gray-500"
            />
            <button
              type="submit"
              className="bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded px-4 py-2 text-sm font-medium hover:bg-gray-700 dark:hover:bg-gray-300"
            >
              作成
            </button>
          </form>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-3 text-gray-900 dark:text-gray-100">マップ一覧</h2>
          {maps.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">まだマップがありません</p>
          ) : (
            <ul className="space-y-2">
              {maps.map((m) => (
                <li key={m.id}>
                  <Link
                    href={`/maps/${m.id}`}
                    className="block border border-gray-200 dark:border-gray-700 rounded px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 text-sm font-medium text-gray-900 dark:text-gray-100"
                  >
                    {m.name}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}
