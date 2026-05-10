"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Nav } from "@/components/nav";

type CategoryAction = { id: string; description: string; sortOrder: number };
type Category = { id: string; label: string; isStation: boolean; actions?: CategoryAction[] };

const INPUT_CLS = "border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100";
const BTN_PRIMARY = "bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded px-3 py-1 text-sm hover:bg-gray-700 dark:hover:bg-gray-300 disabled:opacity-50";
const BTN_DANGER = "text-sm text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300";
const BTN_GHOST = "text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200";

export default function AdminPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [newCategoryLabel, setNewCategoryLabel] = useState("");
  const [newCategoryIsStation, setNewCategoryIsStation] = useState(false);
  const [newActionDesc, setNewActionDesc] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCategories();
  }, []);

  async function loadCategories() {
    const res = await fetch("/api/admin/categories");
    if (res.status === 401) { router.push("/login"); return; }
    if (res.status === 403) { router.push("/"); return; }
    const cats: Category[] = await res.json();
    setCategories(cats);
    setLoading(false);
  }

  async function loadActions(categoryId: string) {
    const res = await fetch(`/api/admin/categories/${categoryId}/actions`);
    if (!res.ok) return;
    const actions: CategoryAction[] = await res.json();
    setCategories((prev) =>
      prev.map((c) => (c.id === categoryId ? { ...c, actions } : c)),
    );
  }

  async function handleToggleExpand(categoryId: string) {
    if (expandedId === categoryId) {
      setExpandedId(null);
    } else {
      setExpandedId(categoryId);
      await loadActions(categoryId);
    }
  }

  async function handleAddCategory(e: React.FormEvent) {
    e.preventDefault();
    if (!newCategoryLabel.trim()) return;
    const res = await fetch("/api/admin/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label: newCategoryLabel.trim(), isStation: newCategoryIsStation }),
    });
    if (res.ok) {
      setNewCategoryLabel("");
      setNewCategoryIsStation(false);
      loadCategories();
    }
  }

  async function handleDeleteCategory(categoryId: string, label: string) {
    if (!confirm(`カテゴリ「${label}」を削除しますか？\n（このカテゴリを使用中のplaceがある場合、削除に失敗する可能性があります）`)) return;
    await fetch(`/api/admin/categories/${categoryId}`, { method: "DELETE" });
    setExpandedId(null);
    loadCategories();
  }

  async function handleToggleStation(category: Category) {
    await fetch(`/api/admin/categories/${category.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isStation: !category.isStation }),
    });
    loadCategories();
  }

  async function handleAddAction(e: React.FormEvent, categoryId: string) {
    e.preventDefault();
    const desc = newActionDesc[categoryId]?.trim();
    if (!desc) return;
    const res = await fetch(`/api/admin/categories/${categoryId}/actions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ description: desc }),
    });
    if (res.ok) {
      setNewActionDesc((prev) => ({ ...prev, [categoryId]: "" }));
      loadActions(categoryId);
    }
  }

  async function handleDeleteAction(categoryId: string, actionId: string) {
    await fetch(`/api/admin/categories/${categoryId}/actions/${actionId}`, { method: "DELETE" });
    loadActions(categoryId);
  }

  if (loading) {
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
      <main className="flex-1 w-full px-4 py-8 max-w-3xl mx-auto space-y-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">管理画面</h1>

        {/* カテゴリ追加 */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">カテゴリ管理</h2>
          <form onSubmit={handleAddCategory} className="flex items-center gap-2 flex-wrap">
            <input
              placeholder="カテゴリ名"
              value={newCategoryLabel}
              onChange={(e) => setNewCategoryLabel(e.target.value)}
              className={`${INPUT_CLS} flex-1 min-w-40`}
              required
            />
            <label className="flex items-center gap-1 text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">
              <input
                type="checkbox"
                checked={newCategoryIsStation}
                onChange={(e) => setNewCategoryIsStation(e.target.checked)}
              />
              駅カテゴリ
            </label>
            <button type="submit" className={BTN_PRIMARY}>追加</button>
          </form>

          {/* カテゴリ一覧 */}
          <div className="space-y-2">
            {categories.length === 0 && (
              <p className="text-sm text-gray-400 dark:text-gray-500">カテゴリがありません</p>
            )}
            {categories.map((cat) => (
              <div key={cat.id} className="border border-gray-200 dark:border-gray-700 rounded">
                <div className="flex items-center gap-2 px-4 py-3">
                  <button
                    type="button"
                    onClick={() => handleToggleExpand(cat.id)}
                    className="flex-1 text-left text-sm font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2"
                  >
                    <span className="text-gray-400 dark:text-gray-500">{expandedId === cat.id ? "▼" : "▶"}</span>
                    {cat.label}
                    {cat.isStation && (
                      <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded">駅</span>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToggleStation(cat)}
                    className={BTN_GHOST}
                  >
                    {cat.isStation ? "駅解除" : "駅にする"}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteCategory(cat.id, cat.label)}
                    className={BTN_DANGER}
                  >
                    削除
                  </button>
                </div>

                {expandedId === cat.id && (
                  <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-3 space-y-3 bg-gray-50 dark:bg-gray-900">
                    <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">アクション</h3>
                    <ul className="space-y-1">
                      {(cat.actions ?? []).length === 0 && (
                        <li className="text-xs text-gray-400 dark:text-gray-500">アクションがありません</li>
                      )}
                      {(cat.actions ?? []).map((action) => (
                        <li key={action.id} className="flex items-center gap-2 text-sm text-gray-800 dark:text-gray-200">
                          <span className="flex-1">・{action.description}</span>
                          <button
                            type="button"
                            onClick={() => handleDeleteAction(cat.id, action.id)}
                            className={BTN_DANGER}
                          >
                            削除
                          </button>
                        </li>
                      ))}
                    </ul>
                    <form
                      onSubmit={(e) => handleAddAction(e, cat.id)}
                      className="flex items-center gap-2"
                    >
                      <input
                        placeholder="アクション説明"
                        value={newActionDesc[cat.id] ?? ""}
                        onChange={(e) =>
                          setNewActionDesc((prev) => ({ ...prev, [cat.id]: e.target.value }))
                        }
                        className={`${INPUT_CLS} flex-1`}
                        required
                      />
                      <button type="submit" className={BTN_PRIMARY}>追加</button>
                    </form>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
