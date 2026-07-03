import { db } from "@/lib/db";
import { scans } from "@/db/schema";
import { desc } from "drizzle-orm";
import Link from "next/link";

export const dynamic = "force-dynamic";

type MonthStat = {
  month: string;
  scanCount: number;
  purchasedCount: number;
  totalPurchase: number;
  totalProfit: number;
  avgProfitRate: number;
};

export default async function DashboardPage() {
  const rows = await db.select().from(scans).orderBy(desc(scans.createdAt));

  // 月別集計
  const monthMap = new Map<string, MonthStat>();
  for (const s of rows) {
    const d = new Date(s.createdAt);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = `${d.getFullYear()}年${d.getMonth() + 1}月`;
    if (!monthMap.has(key)) {
      monthMap.set(key, { month: label, scanCount: 0, purchasedCount: 0, totalPurchase: 0, totalProfit: 0, avgProfitRate: 0 });
    }
    const stat = monthMap.get(key)!;
    stat.scanCount++;
    if (s.isPurchased) {
      stat.purchasedCount++;
      stat.totalPurchase += s.purchasePrice ?? 0;
      stat.totalProfit += s.profit ?? 0;
    }
  }

  // 平均利益率を計算
  const months = Array.from(monthMap.entries())
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([, stat]) => {
      const rate = stat.totalPurchase > 0
        ? Math.round((stat.totalProfit / stat.totalPurchase) * 100)
        : 0;
      return { ...stat, avgProfitRate: rate };
    });

  const totalScans = rows.length;
  const totalProfit = months.reduce((s, m) => s + m.totalProfit, 0);
  const totalPurchase = months.reduce((s, m) => s + m.totalPurchase, 0);
  const overallRate = totalPurchase > 0 ? Math.round((totalProfit / totalPurchase) * 100) : 0;

  return (
    <main className="min-h-screen bg-slate-50 pb-24">
      <div className="sticky top-0 bg-white border-b border-slate-200 z-10 px-4 py-3 flex items-center gap-3">
        <Link href="/" className="text-slate-500 hover:text-slate-800">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <h1 className="font-bold text-slate-800">収支ダッシュボード</h1>
      </div>

      <div className="max-w-lg mx-auto px-4 pt-4 space-y-4">
        {/* サマリーカード */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-2xl shadow-sm p-3 text-center">
            <p className="text-xs text-slate-400 mb-1">スキャン数</p>
            <p className="text-2xl font-black text-slate-800">{totalScans}</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm p-3 text-center">
            <p className="text-xs text-slate-400 mb-1">累計利益</p>
            <p className={`text-2xl font-black ${totalProfit >= 0 ? "text-green-600" : "text-red-500"}`}>
              {totalProfit >= 0 ? "+" : ""}¥{totalProfit.toLocaleString()}
            </p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm p-3 text-center">
            <p className="text-xs text-slate-400 mb-1">平均利益率</p>
            <p className={`text-2xl font-black ${overallRate >= 0 ? "text-orange-500" : "text-red-500"}`}>
              {overallRate}%
            </p>
          </div>
        </div>

        {/* 月別カード */}
        {months.length === 0 ? (
          <div className="text-center py-20 text-slate-400">
            <p className="text-4xl mb-3">📊</p>
            <p>まだデータがありません</p>
            <p className="text-sm mt-1">スキャン後に「履歴に保存」してください</p>
          </div>
        ) : (
          months.map((m) => (
            <div key={m.month} className="bg-white rounded-2xl shadow-sm p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-bold text-slate-800">{m.month}</h2>
                <span className="text-xs text-slate-400">{m.scanCount}件スキャン</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center text-sm">
                <div className="bg-slate-50 rounded-xl p-2">
                  <p className="text-xs text-slate-400">仕入れ額</p>
                  <p className="font-bold text-slate-700">¥{m.totalPurchase.toLocaleString()}</p>
                </div>
                <div className={`rounded-xl p-2 ${m.totalProfit >= 0 ? "bg-green-50" : "bg-red-50"}`}>
                  <p className="text-xs text-slate-400">利益</p>
                  <p className={`font-bold ${m.totalProfit >= 0 ? "text-green-600" : "text-red-500"}`}>
                    {m.totalProfit >= 0 ? "+" : ""}¥{m.totalProfit.toLocaleString()}
                  </p>
                </div>
                <div className="bg-orange-50 rounded-xl p-2">
                  <p className="text-xs text-slate-400">利益率</p>
                  <p className="font-bold text-orange-600">{m.avgProfitRate}%</p>
                </div>
              </div>
              {m.purchasedCount > 0 && (
                <p className="text-xs text-slate-400 mt-2 text-right">{m.purchasedCount}件仕入れ</p>
              )}
            </div>
          ))
        )}

        <Link href="/history" className="block text-center text-sm text-slate-400 hover:text-orange-500 py-2 transition-colors">
          スキャン履歴を見る →
        </Link>
      </div>
    </main>
  );
}
