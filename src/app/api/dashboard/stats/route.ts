import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const isAdmin = (session.user as any).role === "Admin";
  const sessionUserId = (session.user as any).id;
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") || "incidents";
  const filterUserId = searchParams.get("userId");
  const filterCompanyId = searchParams.get("companyId");

  if (type === "emails") {
    const where: any = {};
    if (filterCompanyId) where.companyId = filterCompanyId;

    const total = await db.emailRequest.count({ where });
    const byStatus = await db.emailRequest.groupBy({ by: ["status"], _count: true, where });
    const byCompany = await db.emailRequest.groupBy({ by: ["companyId"], _count: true, where });

    const companies = await db.company.findMany();
    const byCompanyName = byCompany.map((c) => ({
      name: companies.find((co) => co.id === c.companyId)?.name || "Sin empresa",
      count: c._count,
    })).sort((a, b) => b.count - a.count);

    return NextResponse.json({
      total,
      byStatus: byStatus.map((s) => ({ status: s.status, count: s._count })),
      byCompany: byCompanyName,
      isAdmin,
    });
  }

  // Default: incidents
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
