import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const isAdmin = (session.user as any).role === "Admin";
  const sessionUserId = (session.user as any).id;
  const filterUserId = request.nextUrl.searchParams.get("userId");

  const where = isAdmin ? (filterUserId ? { userId: filterUserId } : {}) : { userId: sessionUserId };

  const total = await db.incident.count({ where });
  const byStatus = await db.incident.groupBy({ by: ["status"], _count: true, where });
  const byCategory = await db.incident.groupBy({ by: ["categoryId"], _count: true, where });

  const categories = await db.category.findMany();
  const byCategoryName = byCategory.map((c) => ({
    name: categories.find((cat) => cat.id === c.categoryId)?.name || "Sin categoría",
    count: c._count,
  }));

  return NextResponse.json({
    total,
    byStatus: byStatus.map((s) => ({ status: s.status, count: s._count })),
    byCategory: byCategoryName,
    isAdmin,
  });
}
