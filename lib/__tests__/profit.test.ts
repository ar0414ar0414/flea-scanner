import { describe, it, expect } from "vitest";
import { calcProfits, calcBreakeven } from "@/lib/profit";

describe("calcProfits", () => {
  it("コンディションBで各プラットフォームの利益を計算する", () => {
    const profits = calcProfits(10000, "B", 3000, 500);
    const byName = Object.fromEntries(profits.map((p) => [p.platform, p]));

    // メルカリ: 10000 * 0.9 = 9000 - 500 - 3000 = 5500
    expect(byName["メルカリ"].profit).toBe(5500);
    // PayPayフリマ: 10000 * 0.95 = 9500 - 3500 = 6000
    expect(byName["PayPayフリマ"].profit).toBe(6000);
    // ヤフオク: 10000 * 0.912 = 9120 - 3500 = 5620
    expect(byName["ヤフオク"].profit).toBe(5620);
  });

  it("コンディションSは相場を1.3倍に補正する", () => {
    const profits = calcProfits(10000, "S", 0, 0);
    const mercari = profits.find((p) => p.platform === "メルカリ")!;
    expect(mercari.profit).toBe(Math.round(13000 * 0.9));
  });

  it("仕入値0のとき利益率は0になる（ゼロ除算しない）", () => {
    const profits = calcProfits(10000, "B", 0, 500);
    for (const p of profits) expect(p.profitRate).toBe(0);
  });

  it("赤字ケースでマイナス利益を返す", () => {
    const profits = calcProfits(1000, "D", 5000, 500);
    for (const p of profits) expect(p.profit).toBeLessThan(0);
  });
});

describe("calcBreakeven", () => {
  it("最安手数料PF（PayPayフリマ5%）基準で損益分岐を逆算する", () => {
    const be = calcBreakeven(10000, "B", 500);
    expect(be.platform).toBe("PayPayフリマ");
    // 10000 * 0.95 = 9500 - 500 = 9000
    expect(be.breakeven).toBe(9000);
    // floor(9000 / 1.3) = 6923
    expect(be.target30).toBe(6923);
  });

  it("送料が手取りを上回る場合は0円を返す（マイナスにしない）", () => {
    const be = calcBreakeven(100, "D", 5000);
    expect(be.breakeven).toBe(0);
    expect(be.target30).toBe(0);
  });

  it("コンディション補正が反映される", () => {
    const b = calcBreakeven(10000, "B", 0);
    const s = calcBreakeven(10000, "S", 0);
    expect(s.breakeven).toBeGreaterThan(b.breakeven);
  });
});
