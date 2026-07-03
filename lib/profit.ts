import { PLATFORM_FEES, CONDITION_MULTIPLIER, type PlatformProfit } from "@/types";

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
