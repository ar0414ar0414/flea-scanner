"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { calcProfits, calcBreakeven } from "@/lib/profit";
import { suggestShipping } from "@/lib/shipping";
import { calcBuyScore, type BuyScore } from "@/lib/buyScore";
import { toast } from "@/lib/toast";
import { ChevronLeft, BarChart3, Store, Calculator, Target, Pencil, ShoppingCart, Lightbulb, ScanLine, Check } from "lucide-react";
import type { AiResult, PriceData, PlatformProfit } from "@/types";
import { CONDITION_MULTIPLIER, PLATFORM_PRICE_RATIO } from "@/types";

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
  const [priceTagFilled, setPriceTagFilled] = useState(false);
  const [shippingCost, setShippingCost] = useState("500");
  const [profits, setProfits] = useState<PlatformProfit[]>([]);
  const [buyScore, setBuyScore] = useState<BuyScore | null>(null);

  // save state
  const [saving, setSaving] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [purchased, setPurchased] = useState(false);
  const [purchasing, setPurchasing] = useState(false);
  const saved = savedId !== null;

  const saveScan = async () => {
    if (!aiResult || saving || saved) return;
    setSaving(true);
    try {
      const bestProfit = profits.reduce((best, p) => p.profit > best.profit ? p : best, profits[0]);
      const form = new FormData();
      form.append("payload", JSON.stringify({
        aiResult,
        priceData,
        medianPrice: priceData?.median ?? null,
        purchasePrice: parseInt(purchasePrice) || null,
        shippingCost: parseInt(shippingCost) || null,
        profit: bestProfit?.profit ?? null,
        profitRate: bestProfit?.profitRate ?? null,
        buyScore,
      }));
      // blob URL は同一セッション内なら再取得できる
      if (imageUrl?.startsWith("blob:")) {
        const blob = await fetch(imageUrl).then((r) => r.blob());
        form.append("image", blob, "scan.jpg");
      }
      const res = await fetch("/api/scans", { method: "POST", body: form });
      const data = await res.json();
      if (data.id) {
        setSavedId(data.id);
        toast("履歴に保存しました", "success");
      } else toast("保存に失敗しました", "error");
    } catch {
      toast("保存に失敗しました", "error");
    } finally {
      setSaving(false);
    }
  };

  const togglePurchased = async () => {
    if (!savedId || purchasing) return;
    setPurchasing(true);
    const next = !purchased;
    try {
      const res = await fetch(`/api/scans/${savedId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPurchased: next, purchasePrice: parseInt(purchasePrice) || 0 }),
      });
      if (res.ok) setPurchased(next);
    } finally {
      setPurchasing(false);
    }
  };

  // edit state
  const [editing, setEditing] = useState(false);
  const [editBrand, setEditBrand] = useState("");
  const [editModel, setEditModel] = useState("");
  const [editCondition, setEditCondition] = useState<AiResult["condition"]>("B");
  const [editQuery, setEditQuery] = useState("");

  const fetchPrice = (query: string) => {
    setPriceLoading(true);
    setPriceError(null);
    fetch(`/api/price?q=${encodeURIComponent(query)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setPriceError(data.error);
        else setPriceData(data);
      })
      .catch(() => setPriceError("相場取得に失敗しました"))
      .finally(() => setPriceLoading(false));
  };

  useEffect(() => {
    const ai = sessionStorage.getItem("aiResult");
    const img = sessionStorage.getItem("imageUrl");
    if (!ai) { router.push("/"); return; }
    const parsed: AiResult = JSON.parse(ai);
    setAiResult(parsed);
    setImageUrl(img);
    setEditBrand(parsed.brand);
    setEditModel(parsed.model);
    setEditCondition(parsed.condition);
    setEditQuery(parsed.searchQuery);
    setShippingCost(String(suggestShipping(parsed.category, parsed.model)));
    if (typeof parsed.priceTag === "number" && parsed.priceTag > 0) {
      setPurchasePrice(String(parsed.priceTag));
      setPriceTagFilled(true);
    }
    fetchPrice(parsed.searchQuery);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  useEffect(() => {
    if (!priceData || !aiResult) return;
    const base = priceData.median;
    const purchase = parseInt(purchasePrice) || 0;
    const shipping = parseInt(shippingCost) || 0;
    const newProfits = calcProfits(base, editCondition, purchase, shipping);
    setProfits(newProfits);
    if (purchase > 0) {
      setBuyScore(calcBuyScore(priceData, editCondition, newProfits, purchase));
    } else {
      setBuyScore(null);
    }
  }, [priceData, aiResult, editCondition, purchasePrice, shippingCost]);

  const applyEdit = () => {
    if (!aiResult) return;
    const updated: AiResult = { ...aiResult, brand: editBrand, model: editModel, condition: editCondition, searchQuery: editQuery };
    setAiResult(updated);
    sessionStorage.setItem("aiResult", JSON.stringify(updated));
    setEditing(false);
    fetchPrice(editQuery);
  };

  if (!aiResult) return null;

  const adjustedPrice = priceData
    ? Math.round(priceData.median * (CONDITION_MULTIPLIER[aiResult.condition] ?? 1))
    : null;

  const breakeven = priceData
    ? calcBreakeven(priceData.median, editCondition, parseInt(shippingCost) || 0)
    : null;

  const platformPrices = priceData
    ? Object.values(PLATFORM_PRICE_RATIO).map(({ label, ratio, color }) => ({
        label,
        color,
        price: Math.round(priceData.median * (CONDITION_MULTIPLIER[editCondition] ?? 1) * ratio),
      }))
    : [];

  const GRADE_COLOR: Record<string, string> = {
    S: "bg-purple-500", A: "bg-blue-500", B: "bg-green-500", C: "bg-yellow-500", D: "bg-red-500",
  };

  return (
    <main className="min-h-screen bg-slate-50 pb-24">
      {/* トップバー */}
      <div className="sticky top-0 bg-white/85 backdrop-blur-xl border-b border-slate-200/70 z-10 px-4 py-3 flex items-center gap-3">
        <button onClick={() => router.push("/")} className="w-8 h-8 flex items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 transition-colors">
          <ChevronLeft size={22} />
        </button>
        <h1 className="font-bold text-slate-800 tracking-tight">解析結果</h1>
      </div>

      <div className="max-w-lg mx-auto px-4 pt-4 space-y-4">
        {/* 商品情報カード */}
        <div className="bg-white rounded-3xl border border-slate-200/60 shadow-sm overflow-hidden">
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
            <button
              onClick={() => setEditing((e) => !e)}
              className="self-start text-slate-400 hover:text-orange-500 transition-colors p-1"
              aria-label="編集"
            >
              <Pencil size={18} />
            </button>
          </div>

          {editing && (
            <div className="border-t border-slate-100 px-4 pb-4 pt-3 space-y-3">
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-500">ブランド</label>
                <input
                  type="text"
                  value={editBrand}
                  onChange={(e) => setEditBrand(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-500">モデル名</label>
                <input
                  type="text"
                  value={editModel}
                  onChange={(e) => setEditModel(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-500">コンディション</label>
                <div className="flex gap-2">
                  {(["S", "A", "B", "C", "D"] as AiResult["condition"][]).map((c) => (
                    <button
                      key={c}
                      onClick={() => setEditCondition(c)}
                      className={`flex-1 py-1.5 rounded-xl text-sm font-bold border transition-colors ${
                        editCondition === c
                          ? "border-orange-400 bg-orange-50 text-orange-600"
                          : "border-slate-200 text-slate-500 hover:border-orange-300"
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-500">検索キーワード</label>
                <input
                  type="text"
                  value={editQuery}
                  onChange={(e) => setEditQuery(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                />
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => setEditing(false)}
                  className="flex-1 py-2 border border-slate-200 text-slate-500 rounded-xl text-sm hover:bg-slate-50 transition-colors"
                >
                  キャンセル
                </button>
                <button
                  onClick={applyEdit}
                  className="flex-1 py-2 bg-orange-500 text-white rounded-xl text-sm font-bold hover:bg-orange-600 transition-colors"
                >
                  再検索
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 相場カード */}
        <div className="bg-white rounded-3xl border border-slate-200/60 shadow-sm p-4">
          <h2 className="font-bold text-slate-800 mb-3 flex items-center gap-2.5 tracking-tight">
            <span className="w-8 h-8 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center"><BarChart3 size={16} /></span>
            ヤフオク落札相場
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
              {aiResult && priceData.keyword !== aiResult.searchQuery && (
                <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-2.5 py-1.5 mt-2">
                  元のキーワードでは0件のため「{priceData.keyword}」で再検索した結果です
                </p>
              )}

              {/* 落札実績リスト */}
              {priceData.items?.length > 0 && (
                <details className="mt-3 border-t border-slate-100 pt-3">
                  <summary className="text-sm text-slate-500 cursor-pointer select-none hover:text-orange-500 transition-colors">
                    実際の落札例を見る（{priceData.items.length}件）
                  </summary>
                  <ul className="mt-2 space-y-2">
                    {priceData.items.map((item, i) => (
                      <li key={i}>
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-between gap-3 bg-slate-50 rounded-xl px-3 py-2 hover:bg-orange-50 transition-colors"
                        >
                          <span className="text-xs text-slate-600 truncate flex-1">{item.title}</span>
                          <span className="text-sm font-bold text-slate-700 flex-shrink-0">
                            ¥{item.price.toLocaleString()}
                          </span>
                        </a>
                      </li>
                    ))}
                  </ul>
                </details>
              )}
            </>
          ) : null}
        </div>

        {/* ⑤ プラットフォーム別推定相場カード */}
        {platformPrices.length > 0 && (
          <div className="bg-white rounded-3xl border border-slate-200/60 shadow-sm p-4">
            <h2 className="font-bold text-slate-800 mb-1 flex items-center gap-2.5 tracking-tight">
              <span className="w-8 h-8 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center"><Store size={16} /></span>
              プラットフォーム別推定相場
            </h2>
            <p className="text-xs text-slate-400 mb-3">ヤフオク落札実績を基準とした出品価格の目安</p>
            <div className="grid grid-cols-2 gap-2">
              {platformPrices.map(({ label, price, color }) => (
                <div key={label} className="bg-slate-50 rounded-xl p-3">
                  <p className="text-xs text-slate-400 mb-0.5">{label}</p>
                  <p className={`font-bold text-sm ${color}`}>¥{price.toLocaleString()}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 利益計算カード */}
        <div className="bg-white rounded-3xl border border-slate-200/60 shadow-sm p-4">
          <h2 className="font-bold text-slate-800 mb-3 flex items-center gap-2.5 tracking-tight">
            <span className="w-8 h-8 bg-green-100 text-green-600 rounded-xl flex items-center justify-center"><Calculator size={16} /></span>
            利益計算
          </h2>

          {/* ⑬ 仕入れ上限の目安 */}
          {breakeven && (
            <div className="bg-orange-50 rounded-xl p-3 mb-4">
              <p className="text-xs font-bold text-orange-600 mb-2 flex items-center gap-1.5">
                <Lightbulb size={13} /> 仕入れ上限の目安（{breakeven.platform}で売る場合・タップで入力）
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setPurchasePrice(String(breakeven.target30))}
                  className="bg-white rounded-lg p-2 text-center hover:ring-2 hover:ring-orange-300 transition-all"
                >
                  <p className="text-xs text-slate-400">利益率30%確保</p>
                  <p className="font-bold text-green-600">¥{breakeven.target30.toLocaleString()} 以下</p>
                </button>
                <button
                  onClick={() => setPurchasePrice(String(breakeven.breakeven))}
                  className="bg-white rounded-lg p-2 text-center hover:ring-2 hover:ring-orange-300 transition-all"
                >
                  <p className="text-xs text-slate-400">損益分岐点</p>
                  <p className="font-bold text-slate-700">¥{breakeven.breakeven.toLocaleString()}</p>
                </button>
              </div>
            </div>
          )}

          <div className="space-y-3 mb-4">
            <div className="flex items-center gap-3">
              <label className="text-sm text-slate-600 w-24 flex-shrink-0">
                仕入値
                {priceTagFilled && (
                  <span className="block text-xs text-green-600 font-bold">値札を読取済</span>
                )}
              </label>
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">¥</span>
                <input
                  type="number"
                  value={purchasePrice}
                  onChange={(e) => { setPurchasePrice(e.target.value); setPriceTagFilled(false); }}
                  placeholder="0"
                  className={`w-full pl-8 pr-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 ${
                    priceTagFilled ? "border-green-300 bg-green-50/50" : "border-slate-200"
                  }`}
                />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <label className="text-sm text-slate-600 w-24 flex-shrink-0">
                送料
                <span className="block text-xs text-orange-400 font-normal">自動提案</span>
              </label>
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

        {/* ⑧ 買い時スコアカード */}
        {buyScore && (
          <div className="bg-white rounded-3xl border border-slate-200/60 shadow-sm p-4">
            <h2 className="font-bold text-slate-800 mb-3 flex items-center gap-2.5 tracking-tight">
              <span className="w-8 h-8 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center"><Target size={16} /></span>
              買い時スコア
            </h2>
            <div className="flex items-center gap-4 mb-3">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white text-2xl font-black flex-shrink-0 ${GRADE_COLOR[buyScore.grade]}`}>
                {buyScore.grade}
              </div>
              <div>
                <p className="font-bold text-slate-800">{buyScore.label}</p>
                <div className="flex items-center gap-1 mt-1">
                  <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${GRADE_COLOR[buyScore.grade]} transition-all`}
                      style={{ width: `${buyScore.score}%` }}
                    />
                  </div>
                  <span className="text-xs text-slate-500 w-10 text-right">{buyScore.score}/100</span>
                </div>
              </div>
            </div>
            <ul className="space-y-1">
              {buyScore.reasons.map((r, i) => (
                <li key={i} className="text-xs text-slate-500 flex items-start gap-1.5">
                  <span className="text-orange-400 mt-0.5">•</span>{r}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 仕入れたトグル（保存後に表示） */}
        {saved && (
          <button
            onClick={togglePurchased}
            disabled={purchasing}
            className={`w-full py-3.5 font-bold rounded-2xl transition-colors border-2 ${
              purchased
                ? "border-green-500 bg-green-500 text-white"
                : "border-green-400 text-green-600 bg-white hover:bg-green-50"
            }`}
          >
            <span className="flex items-center justify-center gap-2">
              {purchased ? <><Check size={18} strokeWidth={3} /> 仕入れ済み（タップで取消）</> : <><ShoppingCart size={18} /> この商品を仕入れた</>}
            </span>
          </button>
        )}

        {/* アクションボタン */}
        <div className="flex gap-3">
          <button
            onClick={saveScan}
            disabled={saving || saved}
            className={`flex-1 py-3.5 font-bold rounded-2xl transition-colors border ${
              saved
                ? "border-green-400 text-green-600 bg-green-50"
                : "border-orange-400 text-orange-500 hover:bg-orange-50"
            }`}
          >
            {saved ? "保存済み ✓" : saving ? "保存中..." : "履歴に保存"}
          </button>
          <button
            onClick={() => router.push("/")}
            className="flex-1 py-3.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold rounded-2xl transition-all shadow-lg shadow-orange-500/25 active:scale-[0.98]"
          >
            <span className="flex items-center justify-center gap-2"><ScanLine size={18} /> もう一品スキャン</span>
          </button>
        </div>
        <button
          onClick={() => router.push("/history")}
          className="w-full py-2 text-sm text-slate-400 hover:text-orange-500 transition-colors"
        >
          スキャン履歴を見る →
        </button>
      </div>
    </main>
  );
}
