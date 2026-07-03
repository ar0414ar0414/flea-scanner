// Category keyword → estimated shipping cost (yen)
const SHIPPING_MAP: { keywords: string[]; cost: number }[] = [
  { keywords: ["ネクタイ", "靴下", "ソックス", "ハンカチ", "帽子", "キャップ", "ベルト", "財布", "アクセサリー"], cost: 200 },
  { keywords: ["Tシャツ", "シャツ", "カットソー", "タンクトップ"], cost: 300 },
  { keywords: ["パンツ", "スラックス", "チノ", "デニム", "ジーンズ", "ショートパンツ"], cost: 400 },
  { keywords: ["ジャケット", "コート", "ダウン", "ブルゾン", "パーカー", "スウェット", "フーディ"], cost: 600 },
  { keywords: ["スニーカー", "ブーツ", "シューズ", "靴"], cost: 700 },
  { keywords: ["バッグ", "リュック", "トート", "ショルダー", "ハンドバッグ", "ボストン"], cost: 800 },
];

export function suggestShipping(category: string, model: string): number {
  const text = `${category} ${model}`.toLowerCase();
  for (const { keywords, cost } of SHIPPING_MAP) {
    if (keywords.some((k) => text.includes(k.toLowerCase()))) return cost;
  }
  return 500; // default
}
