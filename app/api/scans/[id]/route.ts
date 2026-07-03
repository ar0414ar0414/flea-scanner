import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { scans } from "@/db/schema";
import { eq } from "drizzle-orm";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const body = await req.json();
    const updates: Partial<{ isPurchased: boolean; isFavorite: boolean; purchasePrice: number }> = {};
    if (typeof body.isPurchased === "boolean") updates.isPurchased = body.isPurchased;
    if (typeof body.isFavorite === "boolean") updates.isFavorite = body.isFavorite;
    if (typeof body.purchasePrice === "number") updates.purchasePrice = body.purchasePrice;

    const [updated] = await db.update(scans).set(updates).where(eq(scans.id, id)).returning();
    if (!updated) return NextResponse.json({ error: "not found" }, { status: 404 });
    return NextResponse.json(updated);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "更新に失敗しました" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    await db.delete(scans).where(eq(scans.id, id));
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "削除に失敗しました" }, { status: 500 });
  }
}
