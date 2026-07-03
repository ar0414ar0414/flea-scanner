import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { db } from "@/lib/db";
import { scans } from "@/db/schema";
import { desc } from "drizzle-orm";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const payload = JSON.parse(form.get("payload") as string);
    const image = form.get("image") as File | null;

    let imageUrl: string | null = null;
    if (image) {
      const ext = image.type === "image/png" ? "png" : "jpg";
      const path = `${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage
        .from("scan-images")
        .upload(path, image, { contentType: image.type });
      if (!error) {
        imageUrl = supabase.storage.from("scan-images").getPublicUrl(path).data.publicUrl;
      }
    }

    const { aiResult, priceData, medianPrice, purchasePrice, shippingCost, profit, profitRate, buyScore } = payload;

    const [scan] = await db.insert(scans).values({
      aiResult,
      priceData,
      buyScore: buyScore ?? null,
      medianPrice: medianPrice ?? null,
      purchasePrice: purchasePrice ?? null,
      shippingCost: shippingCost ?? null,
      profit: profit ?? null,
      profitRate: profitRate ?? null,
      imageUrl,
    }).returning();

    return NextResponse.json({ id: scan.id, imageUrl });
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
