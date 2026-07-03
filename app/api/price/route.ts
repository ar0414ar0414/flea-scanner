import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { priceCache } from "@/db/schema";
import { eq } from "drizzle-orm";
import type { PriceData } from "@/types";

const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24時間

const UA =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";

type ClosedItem = { title?: string; price?: number; auctionId?: string };

// ヤフオク落札検索ページ（公開Web）の __NEXT_DATA__ から落札実績を抽出
// ※公式の落札相場APIは2018年に提供終了のため
async function fetchClosedAuctions(keyword: string): Promise<{ title: string; price: number; url: string }[]> {
  const url = `https://auctions.yahoo.co.jp/closedsearch/closedsearch?p=${encodeURIComponent(keyword)}&n=20`;
  const res = await fetch(url, { headers: { "User-Agent": UA }, cache: "no-store" });
  if (!res.ok) throw new Error(`closedsearch HTTP ${res.status}`);
  const html = await res.text();

  const m = html.match(/<script id="__NEXT_DATA__" type="application\/json">(.*?)<\/script>/s);
  if (!m) throw new Error("NEXT_DATA not found");

  const data = JSON.parse(m[1]);
  const rawItems: ClosedItem[] =
    data?.props?.pageProps?.initialState?.search?.items?.listing?.items ?? [];

  return rawItems
    .filter((i) => typeof i.price === "number" && i.price > 0)
    .map((i) => ({
      title: i.title ?? "",
      price: i.price!,
      url: i.auctionId ? `https://auctions.yahoo.co.jp/jp/auction/${i.auctionId}` : "",
    }));
}

export async function GET(req: NextRequest) {
  const keyword = req.nextUrl.searchParams.get("q");
  if (!keyword) return NextResponse.json({ error: "キーワードが必要です" }, { status: 400 });

  // キャッシュ確認
  const cached = await db.select().from(priceCache).where(eq(priceCache.keyword, keyword)).limit(1);
  if (cached.length > 0) {
    const age = Date.now() - new Date(cached[0].cachedAt).getTime();
    if (age < CACHE_TTL_MS) {
      return NextResponse.json(cached[0].priceData);
    }
  }

  let items: { title: string; price: number; url: string }[];
  try {
    items = await fetchClosedAuctions(keyword);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "相場データの取得に失敗しました" }, { status: 502 });
  }

  if (items.length === 0) {
    return NextResponse.json({ error: "相場データが見つかりませんでした" }, { status: 404 });
  }

  const calcMedian = (sorted: number[]) => {
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0
      ? Math.round((sorted[mid - 1] + sorted[mid]) / 2)
      : sorted[mid];
  };

  let prices = items.map((i) => i.price).sort((a, b) => a - b);
  // 1円落札などの極端な外れ値（中央値の15%未満）を除去
  const roughMedian = calcMedian(prices);
  const trimmed = prices.filter((p) => p >= roughMedian * 0.15);
  if (trimmed.length >= 3) {
    prices = trimmed;
    items = items.filter((i) => i.price >= roughMedian * 0.15);
  }
  const median = calcMedian(prices);

  const priceData: PriceData = {
    platform: "yahoo_auction",
    keyword,
    median,
    min: prices[0],
    max: prices[prices.length - 1],
    count: prices.length,
    items: items.slice(0, 5),
  };

  // キャッシュ保存（upsert）
  await db.insert(priceCache).values({ keyword, priceData }).onConflictDoUpdate({
    target: priceCache.keyword,
    set: { priceData, cachedAt: new Date() },
  });

  return NextResponse.json(priceData);
}
