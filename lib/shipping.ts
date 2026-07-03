// Category keyword → estimated shipping cost (yen)
// 先にマッチしたものが優先されるため、具体的なキーワードほど上に置く
const SHIPPING_MAP: { keywords: string[]; cost: number }[] = [
  // 小型メール便系（〜厚さ3cm）
  { keywords: ["トレカ", "カード", "シール", "ステッカー"], cost: 180 },
  { keywords: ["書籍", "漫画", "コミック", "雑誌", "文庫", "単行本", "絵本", "小説"], cost: 200 },
  { keywords: ["CD", "DVD", "Blu-ray", "ブルーレイ"], cost: 200 },
  // 「本体」を含むものはソフトより先にゲーム機として判定
  { keywords: ["ゲーム機", "本体", "プレイステーション", "Xbox"], cost: 900 },
  { keywords: ["ゲームソフト", "Switch", "スイッチ", "PS4", "PS5", "3DS", "カセット"], cost: 230 },
  { keywords: ["ネクタイ", "靴下", "ソックス", "ハンカチ", "帽子", "キャップ", "ベルト", "財布", "アクセサリー", "ネックレス", "指輪", "ピアス"], cost: 200 },
  // コンパクト便系
  { keywords: ["スマホ", "スマートフォン", "iPhone", "携帯電話", "イヤホン", "腕時計", "時計"], cost: 500 },
  { keywords: ["Tシャツ", "シャツ", "カットソー", "タンクトップ"], cost: 300 },
  { keywords: ["パンツ", "スラックス", "チノ", "デニム", "ジーンズ", "ショートパンツ"], cost: 400 },
  { keywords: ["ぬいぐるみ", "クッション"], cost: 500 },
  // 60〜80サイズ
  { keywords: ["ジャケット", "コート", "ダウン", "ブルゾン", "パーカー", "スウェット", "フーディ"], cost: 600 },
  { keywords: ["食器", "皿", "カップ", "グラス", "茶碗", "陶器", "マグ"], cost: 700 },
  { keywords: ["スニーカー", "ブーツ", "シューズ", "靴"], cost: 700 },
  { keywords: ["フィギュア", "プラモデル", "模型", "ドール"], cost: 800 },
  { keywords: ["バッグ", "リュック", "トート", "ショルダー", "ハンドバッグ", "ボストン"], cost: 800 },
  { keywords: ["カメラ", "レンズ", "オーディオ", "スピーカー", "ヘッドホン", "アンプ"], cost: 800 },
  // 大型
  { keywords: ["パソコン", "ノートPC", "タブレット", "iPad", "モニター"], cost: 1000 },
  { keywords: ["家電", "炊飯器", "掃除機", "扇風機", "プリンター"], cost: 1200 },
];

export function suggestShipping(category: string, model: string): number {
  const text = `${category} ${model}`.toLowerCase();
  for (const { keywords, cost } of SHIPPING_MAP) {
    if (keywords.some((k) => text.includes(k.toLowerCase()))) return cost;
  }
  return 500; // default
}
