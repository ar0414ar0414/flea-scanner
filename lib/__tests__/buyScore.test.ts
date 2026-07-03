import { describe, it, expect } from "vitest";
import { calcBuyScore } from "@/lib/buyScore";
import { calcProfits } from "@/lib/profit";
import type { PriceData } from "@/types";

const priceData = (over: Partial<PriceData> = {}): PriceData => ({
  platform: "yahoo_auction",
  keyword: "test",
  median: 10000,
  min: 8000,
  max: 12000,
  count: 20,
  items: [],
  ...over,
});

describe("calcBuyScore", () => {
  it("高利益率・安定相場・十分な取引数で高グレードになる", () => {
    const pd = priceData();
    const profits = calcProfits(pd.median, "A", 3000, 500);
    const score = calcBuyScore(pd, "A", profits, 3000);
    expect(score.score).toBeGreaterThanOrEqual(65);
    expect(["S", "A"]).toContain(score.grade);
  });

  it("仕入値が相場超えなら低グレードで理由を含む", () => {
    const pd = priceData();
    const profits = calcProfits(pd.median, "D", 20000, 500);
    const score = calcBuyScore(pd, "D", profits, 20000);
    expect(["C", "D"]).toContain(score.grade);
    expect(score.reasons.join()).toContain("仕入値が相場を超えている");
  });

  it("スコアは常に0〜100の範囲", () => {
    const cases: [string, number][] = [["S", 100], ["B", 5000], ["D", 50000]];
    for (const [cond, purchase] of cases) {
      const pd = priceData();
      const profits = calcProfits(pd.median, cond, purchase, 500);
      const s = calcBuyScore(pd, cond, profits, purchase);
      expect(s.score).toBeGreaterThanOrEqual(0);
      expect(s.score).toBeLessThanOrEqual(100);
    }
  });

  it("相場のブレが大きいと注意の理由が付く", () => {
    const pd = priceData({ min: 100, max: 50000 });
    const profits = calcProfits(pd.median, "B", 3000, 500);
    const score = calcBuyScore(pd, "B", profits, 3000);
    expect(score.reasons.join()).toContain("ブレが大きい");
  });

  it("取引数が少ないと流動性低めの理由が付く", () => {
    const pd = priceData({ count: 3 });
    const profits = calcProfits(pd.median, "B", 3000, 500);
    const score = calcBuyScore(pd, "B", profits, 3000);
    expect(score.reasons.join()).toContain("流動性低め");
  });
});
