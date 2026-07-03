import { db } from "@/lib/db";
import { scans } from "@/db/schema";
import { desc } from "drizzle-orm";
import Link from "next/link";
import type { AiResult } from "@/types";

const CONDITION_COLOR: Record<string, string> = {
  S: "bg-purple-100 text-purple-700",
  A: "bg-blue-100 text-blue-700",
  B: "bg-green-100 text-green-700",
  C: "bg-yellow-100 text-yellow-700",
  D: "bg-red-100 text-red-700",
};

export const dynamic = "force-dynamic";

export default async function HistoryPage() {
  const rows = await db.select().from(scans).orderBy(desc(scans.createdAt)).limit(50);

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
        {rows.length === 0 ? (
          <div className="text-center py-20 text-slate-400">
            <p className="text-4xl mb-3">📷</p>
            <p>まだスキャン履歴がありません</p>
          </div>
        ) : (
          rows.map((scan) => {
            const ai = scan.aiResult as AiResult | null;
            const date = new Date(scan.createdAt).toLocaleDateString("ja-JP", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
            return (
              <div key={scan.id} className="bg-white rounded-2xl shadow-sm p-4 flex gap-3">
                {scan.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={scan.imageUrl} alt="商品" className="w-16 h-16 object-cover rounded-xl flex-shrink-0" />
                ) : (
                  <div className="w-16 h-16 bg-slate-100 rounded-xl flex-shrink-0 flex items-center justify-center text-2xl">📦</div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      {ai?.condition && (
                        <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full mb-1 ${CONDITION_COLOR[ai.condition] ?? ""}`}>
                          {ai.condition}
                        </span>
                      )}
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
            );
          })
        )}
      </div>
    </main>
  );
}
