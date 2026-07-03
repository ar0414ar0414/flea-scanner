import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { scans } from "@/db/schema";
import { desc } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { aiResult, priceData, medianPrice, purchasePrice, shippingCost, profit, profitRate, imageUrl } = body;

    const [scan] = await db.insert(scans).values({
      aiResult,
      priceData,
      medianPrice: medianPrice ?? null,
      purchasePrice: purchasePrice ?? null,
      shippingCost: shippingCost ?? null,
      profit: profit ?? null,
      profitRate: profitRate ?? null,
      imageUrl: imageUrl ?? null,
    }).returning();

    return NextResponse.json({ id: scan.id });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "保存に失敗しました" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const rows = await db.select().from(scans).orderBy(desc(scans.createdAt)).limit(50);
    return NextResponse.json(rows);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "取得に失敗しました" }, { status: 500 });
  }
}
