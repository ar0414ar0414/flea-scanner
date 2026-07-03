import { describe, it, expect } from "vitest";
import { filterByRelevance } from "@/lib/relevance";

const item = (title: string) => ({ title, price: 1000, url: "" });

describe("filterByRelevance", () => {
  it("キーワードの語の50%以上を含むタイトルだけ残す（ちょうど50%は採用）", () => {
    const items = [
      item("SEIKO セイコー プロスペックス SBDL095"),   // 2/2 → 採用
      item("セイコー 掛け時計 昭和レトロ"),              // 1/2 = 50% → 採用
      item("カシオ G-SHOCK デジタル"),                  // 0/2 → 除外
    ];
    const result = filterByRelevance(items, "セイコー プロスペックス");
    expect(result).toHaveLength(2);
    expect(result.map((i) => i.title).join()).not.toContain("カシオ");
  });

  it("50%未満のタイトルは除外される", () => {
    const items = [
      item("セイコー プロスペックス ダイバー 自動巻"),  // 3/3 → 採用
      item("セイコー 掛け時計"),                        // 1/3 → 除外
    ];
    const result = filterByRelevance(items, "セイコー プロスペックス ダイバー");
    expect(result).toHaveLength(1);
    expect(result[0].title).toContain("自動巻");
  });

  it("全角・大文字小文字の揺れを吸収する（NFKC正規化）", () => {
    const items = [item("ＳＥＩＫＯ ダイバー")];
    const result = filterByRelevance(items, "seiko ダイバー");
    expect(result).toHaveLength(1);
  });

  it("一致品が0件なら元のリストを返す（フォールバック）", () => {
    const items = [item("カシオ G-SHOCK"), item("シチズン アテッサ")];
    const result = filterByRelevance(items, "ロレックス デイトナ");
    expect(result).toHaveLength(2);
  });

  it("1文字の語はトークンとして無視する", () => {
    const items = [item("ノースフェイス ジャケット")];
    const result = filterByRelevance(items, "ノースフェイス ジャケット M 赤");
    expect(result).toHaveLength(1);
  });

  it("空キーワードなら全件返す", () => {
    const items = [item("なんでも")];
    expect(filterByRelevance(items, "")).toHaveLength(1);
  });
});
