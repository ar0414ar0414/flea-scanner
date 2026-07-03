import { GoogleGenerativeAI, type Part } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";
import type { AiResult } from "@/types";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const MODEL = "gemini-3.5-flash";

// JSONパース失敗・一時エラーに備えて最大2回試行
async function generateAiResult(parts: (string | Part)[]): Promise<AiResult> {
  const model = genAI.getGenerativeModel({ model: MODEL });
  let lastError: unknown;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const result = await model.generateContent(parts);
      const text = result.response.text().replace(/```json\n?|\n?```/g, "").trim();
      return JSON.parse(text) as AiResult;
    } catch (e) {
      lastError = e;
    }
  }
  throw lastError;
}

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") ?? "";

    // barcode mode: JSON body with { barcode: "..." }
    if (contentType.includes("application/json")) {
      const { barcode } = await req.json() as { barcode: string };
      const barcodePrompt = `JANコード/バーコード「${barcode}」の商品を特定して以下のJSON形式で回答してください。余分なテキストは不要です。
{
  "category": "商品カテゴリ",
  "brand": "ブランド名（不明な場合は「不明」）",
  "model": "商品名・モデル名",
  "color": "色（不明な場合は「不明」）",
  "condition": "B",
  "conditionNote": "バーコードスキャン、状態未確認",
  "keywords": ["${barcode}", "キーワード2"],
  "searchQuery": "ヤフオク検索用の最適なキーワード文字列"
}`;
      const aiResult = await generateAiResult([barcodePrompt]);
      return NextResponse.json(aiResult);
    }

    const formData = await req.formData();
    const file = formData.get("image") as File;
    if (!file) return NextResponse.json({ error: "画像がありません" }, { status: 400 });

    const bytes = await file.arrayBuffer();
    const base64 = Buffer.from(bytes).toString("base64");

    const prompt = `この商品画像を分析して、以下のJSON形式で回答してください。余分なテキストは不要です。
{
  "category": "商品カテゴリ（例: メンズジャケット）",
  "brand": "ブランド名（不明な場合は「不明」）",
  "model": "商品名・モデル名",
  "color": "色",
  "condition": "状態ランク（S/A/B/C/D）",
  "conditionNote": "状態の説明（例: 使用感少なく良好）",
  "keywords": ["検索キーワード1", "検索キーワード2", "検索キーワード3"],
  "searchQuery": "ヤフオク検索用の最適なキーワード文字列"
}
状態ランクの基準: S=未使用/新品同様, A=美品, B=使用感少, C=使用感あり, D=傷・汚れあり`;

    const aiResult = await generateAiResult([
      prompt,
      { inlineData: { mimeType: file.type, data: base64 } },
    ]);

    return NextResponse.json(aiResult);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "AI識別に失敗しました" }, { status: 500 });
  }
}
