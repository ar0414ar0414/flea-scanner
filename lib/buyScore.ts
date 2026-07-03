import { CONDITION_MULTIPLIER } from "@/types";
import type { PriceData, PlatformProfit } from "@/types";

export type BuyScore = {
  score: number;       // 0-100
  grade: "S" | "A" | "B" | "C" | "D";
  label: string;
  reasons: string[];
};

export function calcBuyScore(
  priceData: PriceData,
  condition: string,
  profits: PlatformProfit[],
  purchasePrice: number,
): BuyScore {
  const reasons: string[] = [];
  let score = 0;

  // 1. 最大利益率（40点満点）
  const bestProfit = profits.reduce((b, p) => p.profit > b.profit ? p : b, profits[0]);
  const profitRate = purchasePrice > 0 ? (bestProfit.profit / purchasePrice) * 100 : 0;
  const profitScore = Math.min(40, Math.max(0, profitRate * 0.8));
  score += profitScore;
  if (profitRate >= 30) reasons.push(`利益率 ${Math.round(profitRate)}% は高水準`);
  else if (profitRate < 0) reasons.push("仕入値が相場を超えている");

  // 2. 相場の安定性（20点満点）: 価格分散が小さいほど予測しやすい
  const spread = priceData.max > 0 ? (priceData.max - priceData.min) / priceData.max : 1;
  const stabilityScore = Math.round((1 - spread) * 20);
  score += Math.max(0, stabilityScore);
  if (spread < 0.3) reasons.push("相場が安定している（価格ブレ小）");
  else if (spread > 0.7) reasons.push("相場のブレが大きい（注意）");

  // 3. 取引数（20点満点）: 流動性の目安
  const liquidityScore = Math.min(20, priceData.count * 2);
  score += liquidityScore;
  if (priceData.count >= 10) reasons.push(`取引実績 ${priceData.count} 件（流動性あり）`);
  else reasons.push(`取引実績 ${priceData.count} 件（流動性低め）`);

  // 4. コンディションボーナス（20点満点）
  const condBonus: Record<string, number> = { S: 20, A: 16, B: 12, C: 6, D: 2 };
  const condScore = condBonus[condition] ?? 12;
  score += condScore;
  const condMultiplier = CONDITION_MULTIPLIER[condition] ?? 1;
  if (condMultiplier > 1) reasons.push(`コンディション ${condition} は相場+${Math.round((condMultiplier - 1) * 100)}%`);

  const total = Math.round(Math.min(100, Math.max(0, score)));

  let grade: BuyScore["grade"];
  let label: string;
  if (total >= 80) { grade = "S"; label = "強く買い推奨"; }
  else if (total >= 65) { grade = "A"; label = "買い推奨"; }
  else if (total >= 45) { grade = "B"; label = "検討の余地あり"; }
  else if (total >= 25) { grade = "C"; label = "慎重に検討"; }
  else { grade = "D"; label = "見送りを推奨"; }

  return { score: total, grade, label, reasons };
}
