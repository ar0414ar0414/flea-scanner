"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { AiResult } from "@/types";

const CONDITION_COLOR: Record<string, string> = {
  S: "bg-purple-100 text-purple-700",
  A: "bg-blue-100 text-blue-700",
  B: "bg-green-100 text-green-700",
  C: "bg-yellow-100 text-yellow-700",
  D: "bg-red-100 text-red-700",
};

type Scan = {
  id: string;
  imageUrl: string | null;
  aiResult: AiResult | null;
  medianPrice: number | null;
  purchasePrice: number | null;
  profit: number | null;
  isPurchased: boolean;
  isFavorite: boolean;
  createdAt: string;
};

type Filter = "all" | "favorite" | "purchased";

export default function HistoryClient() {
  const router = useRouter();
  const [scans, setScans] = useState<Scan[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("all");

  useEffect(() => {
    fetch("/api/scans")
      .then((r) => r.json())
      .then((data) => Array.isArray(data) && setScans(data))
      .finally(() => setLoading(false));
  }, []);

  const patch = async (id: string, body: Record<string, boolean>) => {
    setScans((prev) => prev.map((s) => (s.id === id ? { ...s, ...body } : s)));
    const res = await fetch(`/api/scans/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      // revert
      setScans((prev) => prev.map((s) => (s.id === id ? { ...s, ...Object.fromEntries(Object.entries(body).map(([k, v]) => [k, !v])) } : s)));
    }
  };

  const remove = async (id: string) => {
    if (!confirm("この履歴を削除しますか？")) return;
    const res = await fetch(`/api/scans/${id}`, { method: "DELETE" });
    if (res.ok) setScans((prev) => prev.filter((s) => s.id !== id));
  };

  const reopen = (scan: Scan) => {
    if (!scan.aiResult) return;
    sessionStorage.setItem("aiResult", JSON.stringify(scan.aiResult));
    if (scan.imageUrl) sessionStorage.setItem("imageUrl", scan.imageUrl);
    else sessionStorage.removeItem("imageUrl");
    router.push("/result");
  };

  const filtered = scans.filter((s) =>
    filter === "favorite" ? s.isFavorite : filter === "purchased" ? s.isPurchased : true
  );

  return (
    <main className="min-h-screen bg-slate-50 pb-10">
      <div className="sticky top-0 bg-white border-b border-slate-200 z-10 px-4 py-3 flex items-center gap-3">
        <Link href="/" className="text-slate-500 hover:text-slate-800">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <h1 className="font-bold text-slate-800">スキャン履歴</h1>
      </div>

      <div className="max-w-lg mx-auto px-4 pt-4 space-y-3">
        {/* フィルタタブ */}
        <div className="flex gap-2">
          {([["all", "すべて"], ["favorite", "★ お気に入り"], ["purchased", "🛒 仕入れ済み"]] as [Filter, string][]).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                filter === key
                  ? "bg-orange-500 text-white"
                  : "bg-white text-slate-500 border border-slate-200 hover:border-orange-300"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-orange-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-slate-400">
            <p className="text-4xl mb-3">📷</p>
            <p>{filter === "all" ? "まだスキャン履歴がありません" : "該当する履歴がありません"}</p>
          </div>
        ) : (
          filtered.map((scan) => {
            const ai = scan.aiResult;
            const date = new Date(scan.createdAt).toLocaleDateString("ja-JP", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
            return (
              <div key={scan.id} className="bg-white rounded-2xl shadow-sm p-4">
                <div className="flex gap-3 cursor-pointer" onClick={() => reopen(scan)}>
                  {scan.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={scan.imageUrl} alt="商品" className="w-16 h-16 object-cover rounded-xl flex-shrink-0" />
                  ) : (
                    <div className="w-16 h-16 bg-slate-100 rounded-xl flex-shrink-0 flex items-center justify-center text-2xl">📦</div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 mb-1">
                          {ai?.condition && (
                            <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full ${CONDITION_COLOR[ai.condition] ?? ""}`}>
                              {ai.condition}
                            </span>
                          )}
                          {scan.isPurchased && (
                            <span className="inline-block text-xs font-medium px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                              仕入れ済み
                            </span>
                          )}
                        </div>
                        <p className="font-bold text-slate-800 text-sm truncate">{ai?.brand ?? "不明"}</p>
                        <p className="text-xs text-slate-500 truncate">{ai?.model}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        {scan.profit != null && (
                          <p className={`font-bold text-sm ${scan.profit > 0 ? "text-green-600" : "text-red-500"}`}>
                            {scan.profit > 0 ? "+" : ""}¥{scan.profit.toLocaleString()}
                          </p>
                        )}
                        {scan.medianPrice && (
                          <p className="text-xs text-orange-500">相場 ¥{scan.medianPrice.toLocaleString()}</p>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-slate-300 mt-1">{date}</p>
                  </div>
                </div>

                {/* 操作行 */}
                <div className="flex items-center justify-end gap-1 mt-2 pt-2 border-t border-slate-50">
                  <button
                    onClick={() => patch(scan.id, { isFavorite: !scan.isFavorite })}
                    className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                      scan.isFavorite ? "text-yellow-500" : "text-slate-300 hover:text-yellow-400"
                    }`}
                    aria-label="お気に入り"
                  >
                    ★
                  </button>
                  <button
                    onClick={() => patch(scan.id, { isPurchased: !scan.isPurchased })}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      scan.isPurchased ? "text-green-600" : "text-slate-400 hover:text-green-500"
                    }`}
                  >
                    {scan.isPurchased ? "仕入れ取消" : "仕入れた"}
                  </button>
                  <button
                    onClick={() => remove(scan.id)}
                    className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-red-500 transition-colors"
                  >
                    削除
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </main>
  );
}
