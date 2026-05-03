"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Nav } from "@/components/nav";

type Character = { id: string; name: string };

export default function CharactersPage() {
  const router = useRouter();
  const [characters, setCharacters] = useState<Character[]>([]);
  const [newName, setNewName] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const r = await fetch("/api/characters");
    if (r.status === 401) { router.push("/login"); return; }
    setCharacters(await r.json());
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/characters", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName }),
    });
    if (res.ok) { setNewName(""); load(); }
  }

  async function handleRename(id: string) {
    await fetch(`/api/characters/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editName }),
    });
    setEditId(null);
    load();
  }

  return (
    <div className="flex flex-col min-h-full bg-white dark:bg-gray-950">
      <Nav />
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-8 space-y-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">キャラクター</h1>

        <section>
          <h2 className="text-lg font-semibold mb-3 text-gray-900 dark:text-gray-100">新しいキャラクターを作る</h2>
          <form onSubmit={handleCreate} className="flex gap-2">
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="キャラクター名"
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
          <h2 className="text-lg font-semibold mb-3 text-gray-900 dark:text-gray-100">キャラクター一覧</h2>
          {characters.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">キャラクターがいません</p>
          ) : (
            <ul className="space-y-2">
              {characters.map((c) => (
                <li key={c.id} className="flex items-center justify-between border border-gray-200 dark:border-gray-700 rounded px-4 py-3 bg-white dark:bg-gray-900">
                  {editId === c.id ? (
                    <div className="flex gap-2 flex-1">
                      <input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="flex-1 border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                      />
                      <button
                        type="button"
                        onClick={() => handleRename(c.id)}
                        className="text-sm text-gray-900 dark:text-gray-100 font-medium"
                      >
                        保存
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditId(null)}
                        className="text-sm text-gray-500 dark:text-gray-400"
                      >
                        キャンセル
                      </button>
                    </div>
                  ) : (
                    <>
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{c.name}</span>
                      <button
                        type="button"
                        onClick={() => { setEditId(c.id); setEditName(c.name); }}
                        className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                      >
                        名前を変更
                      </button>
                    </>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}
