"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { calcProfits } from "@/lib/profit";
import type { AiResult, PriceData, PlatformProfit } from "@/types";
import { CONDITION_MULTIPLIER } from "@/types";

const CONDITION_LABEL: Record<string, string> = {
  S: "S - 未使用・新品同様",
  A: "A - 美品",
  B: "B - 使用感少",
  C: "C - 使用感あり",
  D: "D - 傷・汚れあり",
};

const CONDITION_COLOR: Record<string, string> = {
  S: "bg-purple-100 text-purple-700",
  A: "bg-blue-100 text-blue-700",
  B: "bg-green-100 text-green-700",
  C: "bg-yellow-100 text-yellow-700",
  D: "bg-red-100 text-red-700",
};

export default function ResultClient() {
  const router = useRouter();
  const [aiResult, setAiResult] = useState<AiResult | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [priceData, setPriceData] = useState<PriceData | null>(null);
  const [priceLoading, setPriceLoading] = useState(true);
  const [priceError, setPriceError] = useState<string | null>(null);
  const [purchasePrice, setPurchasePrice] = useState("");
  const [shippingCost, setShippingCost] = useState("500");
  const [profits, setProfits] = useState<PlatformProfit[]>([]);

  useEffect(() => {
    const ai = sessionStorage.getItem("aiResult");
    const img = sessionStorage.getItem("imageUrl");
    if (!ai) { router.push("/"); return; }
    const parsed: AiResult = JSON.parse(ai);
    setAiResult(parsed);
    setImageUrl(img);

    fetch(`/api/price?q=${encodeURIComponent(parsed.searchQuery)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setPriceError(data.error);
        else setPriceData(data);
      })
      .catch(() => setPriceError("相場取得に失敗しました"))
      .finally(() => setPriceLoading(false));
  }, [router]);

  useEffect(() => {
    if (!priceData || !aiResult) return;
    const base = priceData.median;
    const purchase = parseInt(purchasePrice) || 0;
    const shipping = parseInt(shippingCost) || 0;
    setProfits(calcProfits(base, aiResult.condition, purchase, shipping));
  }, [priceData, aiResult, purchasePrice, shippingCost]);

  if (!aiResult) return null;

  const adjustedPrice = priceData
    ? Math.round(priceData.median * (CONDITION_MULTIPLIER[aiResult.condition] ?? 1))
    : null;

  return (
    <main className="min-h-screen bg-slate-50 pb-24">
      {/* トップバー */}
      <div className="sticky top-0 bg-white border-b border-slate-200 z-10 px-4 py-3 flex items-center gap-3">
        <button onClick={() => router.push("/")} className="text-slate-500 hover:text-slate-800">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="font-bold text-slate-800">解析結果</h1>
      </div>

      <div className="max-w-lg mx-auto px-4 pt-4 space-y-4">
        {/* 商品情報カード */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="flex gap-4 p-4">
            {imageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={imageUrl} alt="商品" className="w-24 h-24 object-cover rounded-xl flex-shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full mb-1 ${CONDITION_COLOR[aiResult.condition]}`}>
                {CONDITION_LABEL[aiResult.condition]}
              </span>
              <p className="text-xs text-slate-500">{aiResult.category}</p>
              <p className="font-bold text-slate-800 truncate">{aiResult.brand}</p>
              <p className="text-sm text-slate-600 truncate">{aiResult.model}</p>
              <p className="text-xs text-slate-400 mt-1">{aiResult.color} / {aiResult.conditionNote}</p>
            </div>
          </div>
        </div>

        {/* 相場カード */}
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <h2 className="font-bold text-slate-700 mb-3 flex items-center gap-2">
            <span>📊</span> ヤフオク落札相場
          </h2>
          {priceLoading ? (
            <div className="flex items-center gap-2 text-slate-400 text-sm">
              <div className="w-4 h-4 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" />
              取得中...
            </div>
          ) : priceError ? (
            <p className="text-sm text-slate-400">{priceError}</p>
          ) : priceData ? (
            <>
              <div className="flex items-end gap-2 mb-3">
                <span className="text-3xl font-bold text-orange-500">
                  ¥{adjustedPrice?.toLocaleString()}
                </span>
                <span className="text-slate-400 text-sm mb-1">状態補正後</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center text-sm">
                <div className="bg-slate-50 rounded-xl p-2">
                  <p className="text-xs text-slate-400">最安値</p>
                  <p className="font-medium text-slate-700">¥{priceData.min.toLocaleString()}</p>
                </div>
                <div className="bg-orange-50 rounded-xl p-2">
                  <p className="text-xs text-orange-400">中央値</p>
                  <p className="font-bold text-orange-600">¥{priceData.median.toLocaleString()}</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-2">
                  <p className="text-xs text-slate-400">最高値</p>
                  <p className="font-medium text-slate-700">¥{priceData.max.toLocaleString()}</p>
                </div>
              </div>
              <p className="text-xs text-slate-400 mt-2 text-right">{priceData.count}件の落札実績</p>
            </>
          ) : null}
        </div>

        {/* 利益計算カード */}
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <h2 className="font-bold text-slate-700 mb-3 flex items-center gap-2">
            <span>💴</span> 利益計算
          </h2>
          <div className="space-y-3 mb-4">
            <div className="flex items-center gap-3">
              <label className="text-sm text-slate-600 w-24 flex-shrink-0">仕入値</label>
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">¥</span>
                <input
                  type="number"
                  value={purchasePrice}
                  onChange={(e) => setPurchasePrice(e.target.value)}
                  placeholder="0"
                  className="w-full pl-8 pr-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <label className="text-sm text-slate-600 w-24 flex-shrink-0">送料</label>
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">¥</span>
                <input
                  type="number"
                  value={shippingCost}
                  onChange={(e) => setShippingCost(e.target.value)}
                  placeholder="500"
                  className="w-full pl-8 pr-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                />
              </div>
            </div>
          </div>

          {profits.length > 0 && (
            <div className="space-y-2">
              {profits.map((p) => (
                <div key={p.platform} className={`flex items-center justify-between rounded-xl px-3 py-2.5 ${p.profit > 0 ? "bg-green-50" : "bg-red-50"}`}>
                  <span className="text-sm text-slate-600">{p.platform}</span>
                  <div className="text-right">
                    <span className={`font-bold ${p.profit > 0 ? "text-green-600" : "text-red-500"}`}>
                      {p.profit > 0 ? "+" : ""}¥{p.profit.toLocaleString()}
                    </span>
                    <span className={`text-xs ml-1 ${p.profit > 0 ? "text-green-500" : "text-red-400"}`}>
                      ({p.profitRate}%)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* もう一度ボタン */}
        <button
          onClick={() => router.push("/")}
          className="w-full py-3.5 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-2xl transition-colors"
        >
          もう一品スキャン
        </button>
      </div>
    </main>
  );
}
