import { PLATFORM_FEES, CONDITION_MULTIPLIER, type PlatformProfit } from "@/types";

export type Breakeven = {
  platform: string;   // 手数料が最も安く手取りが最大になるプラットフォーム
  breakeven: number;  // 利益0円になる仕入値上限
  target30: number;   // 利益率30%を確保できる仕入値上限
};

// 「いくらまでなら仕入れてよいか」を相場から逆算
export function calcBreakeven(
  basePrice: number,
  condition: string,
  shippingCost: number
): Breakeven {
  const multiplier = CONDITION_MULTIPLIER[condition] ?? 1.0;
  const adjustedPrice = Math.round(basePrice * multiplier);

  const best = Object.values(PLATFORM_FEES).reduce((a, b) => (a.fee <= b.fee ? a : b));
  const afterFee = Math.round(adjustedPrice * (1 - best.fee));
  const breakeven = Math.max(0, afterFee - shippingCost);
  // profit >= 0.3 * purchase → purchase <= (afterFee - shipping) / 1.3
  const target30 = Math.max(0, Math.floor((afterFee - shippingCost) / 1.3));

  return { platform: best.label, breakeven, target30 };
}

export function calcProfits(
  basePrice: number,
  condition: string,
  purchasePrice: number,
  shippingCost: number
): PlatformProfit[] {
  const multiplier = CONDITION_MULTIPLIER[condition] ?? 1.0;
  const adjustedPrice = Math.round(basePrice * multiplier);

  return Object.entries(PLATFORM_FEES).map(([key, { label, fee }]) => {
    const afterFee = Math.round(adjustedPrice * (1 - fee));
    const profit = afterFee - shippingCost - purchasePrice;
    const profitRate = purchasePrice > 0 ? Math.round((profit / purchasePrice) * 100) : 0;
    return { platform: label, fee, profit, profitRate };
  });
}
