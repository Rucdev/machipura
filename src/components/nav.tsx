"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

export function Nav() {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  return (
    <nav className="flex items-center justify-between px-6 py-3 border-b border-gray-200">
      <div className="flex items-center gap-6">
        <Link href="/" className="font-bold text-lg">machipura</Link>
        <Link href="/characters" className="text-sm text-gray-600 hover:text-gray-900">キャラクター</Link>
      </div>
      <button
        type="button"
        onClick={handleLogout}
        className="text-sm text-gray-600 hover:text-gray-900"
      >
        ログアウト
      </button>
    </nav>
  );
}
