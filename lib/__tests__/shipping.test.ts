import { describe, it, expect } from "vitest";
import { suggestShipping } from "@/lib/shipping";

describe("suggestShipping", () => {
  it.each([
    ["ゲームソフト", "Nintendo Switch マリオカート8", 230],
    ["ゲーム機", "Nintendo Switch 本体", 900],
    ["漫画", "ワンピース 全巻セット", 200],
    ["トレーディングカード", "ポケモンカード リザードン", 180],
    ["フィギュア", "ドラゴンボール 孫悟空", 800],
    ["メンズジャケット", "ノースフェイス マウンテンパーカー", 600],
    ["Tシャツ", "ユニクロ 白T", 300],
    ["スニーカー", "ナイキ エアマックス", 700],
    ["腕時計", "セイコー 5スポーツ", 500],
    ["食器", "ノリタケ ティーカップ", 700],
    ["家電", "象印 炊飯器", 1200],
    ["パソコン", "MacBook Air", 1000],
  ])("%s / %s → ¥%i", (category, model, expected) => {
    expect(suggestShipping(category, model)).toBe(expected);
  });

  it("未知カテゴリはデフォルト500円", () => {
    expect(suggestShipping("雑貨", "謎のオブジェ")).toBe(500);
  });

  it("「日本製」が書籍（本）と誤マッチしない", () => {
    expect(suggestShipping("雑貨", "日本製 オブジェ")).toBe(500);
  });

  it("「Switch 本体」はソフト(230)でなくゲーム機(900)と判定される", () => {
    expect(suggestShipping("ゲーム", "Nintendo Switch 有機EL 本体")).toBe(900);
  });
});
