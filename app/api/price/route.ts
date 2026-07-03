import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { priceCache } from "@/db/schema";
import { eq } from "drizzle-orm";
import type { PriceData } from "@/types";

const YAHOO_CLIENT_ID = process.env.YAHOO_CLIENT_ID!;
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24時間

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

  // Yahoo!オークション 落札相場API
  const url = new URL("https://auctions.yahooapis.jp/AuctionWebService/V2/json/SearchCompletedAuctions");
  url.searchParams.set("appid", YAHOO_CLIENT_ID);
  url.searchParams.set("query", keyword);
  url.searchParams.set("hits", "20");
  url.searchParams.set("sort", "cbids");
  url.searchParams.set("order", "d");

  const res = await fetch(url.toString());
  if (!res.ok) {
    return NextResponse.json({ error: "相場データの取得に失敗しました" }, { status: 502 });
  }

  const json = await res.json();
  const rawItems = json?.ResultSet?.Result?.Item ?? [];

  if (rawItems.length === 0) {
    return NextResponse.json({ error: "相場データが見つかりませんでした" }, { status: 404 });
  }

  const items = (Array.isArray(rawItems) ? rawItems : [rawItems]).map((item: Record<string, string>) => ({
    title: item.Title ?? "",
    price: parseInt(item.Price ?? "0", 10),
    url: item.AuctionItemUrl ?? "",
  }));

  const prices = items.map((i: { price: number }) => i.price).sort((a: number, b: number) => a - b);
  const mid = Math.floor(prices.length / 2);
  const median = prices.length % 2 === 0
    ? Math.round((prices[mid - 1] + prices[mid]) / 2)
    : prices[mid];

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
