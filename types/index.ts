export type AiResult = {
  category: string;
  brand: string;
  model: string;
  color: string;
  condition: "S" | "A" | "B" | "C" | "D";
  conditionNote: string;
  keywords: string[];
  searchQuery: string;
};

export type PriceData = {
  platform: "yahoo_auction";
  keyword: string;
  median: number;
  min: number;
  max: number;
  count: number;
  items: PriceItem[];
};

export type PriceItem = {
  title: string;
  price: number;
  url: string;
};

export type PlatformProfit = {
  platform: string;
  fee: number;       // 手数料率
  profit: number;
  profitRate: number;
};

export type ScanResult = {
  aiResult: AiResult;
  priceData: PriceData | null;
  profits: PlatformProfit[];
};

// 手数料テーブル
export const PLATFORM_FEES: Record<string, { label: string; fee: number }> = {
  mercari:    { label: "メルカリ",      fee: 0.10 },
  yahoo:      { label: "ヤフオク",      fee: 0.088 },
  paypay:     { label: "PayPayフリマ",  fee: 0.05 },
  rakuma:     { label: "ラクマ",        fee: 0.06 },
};

// ヤフオク落札相場に対する各プラットフォームの想定出品価格倍率
// （固定価格サービスは競り上がりがないぶん高め設定が通りやすい）
export const PLATFORM_PRICE_RATIO: Record<string, { label: string; ratio: number; color: string }> = {
  yahoo:   { label: "ヤフオク",      ratio: 1.00, color: "text-slate-700" },
  mercari: { label: "メルカリ",      ratio: 1.15, color: "text-red-600"   },
  paypay:  { label: "PayPayフリマ",  ratio: 1.10, color: "text-yellow-600"},
  rakuma:  { label: "ラクマ",        ratio: 0.95, color: "text-blue-600"  },
};

// コンディション別相場補正
export const CONDITION_MULTIPLIER: Record<string, number> = {
  S: 1.3,
  A: 1.1,
  B: 1.0,
  C: 0.7,
  D: 0.4,
};
