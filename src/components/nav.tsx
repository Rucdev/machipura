"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export function Nav() {
  const router = useRouter();
  const [isSuperUser, setIsSuperUser] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me").then(async (r) => {
      if (r.ok) {
        const data = await r.json();
        setIsSuperUser(data.isSuperUser === true);
      }
    });
  }, []);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  return (
    <nav className="flex items-center justify-between px-6 py-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
      <div className="flex items-center gap-6">
        <Link href="/" className="font-bold text-lg text-gray-900 dark:text-gray-100">machipura</Link>
        <Link href="/characters" className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100">キャラクター</Link>
        {isSuperUser && (
          <Link href="/admin" className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300">管理</Link>
        )}
      </div>
      <button
        type="button"
        onClick={handleLogout}
        className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
      >
        ログアウト
      </button>
    </nav>
  );
}
