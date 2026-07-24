import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const categoryId = searchParams.get("categoryId");
  const status = searchParams.get("status");
  const userId = searchParams.get("userId");
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const limit = Math.max(1, Math.min(100, parseInt(searchParams.get("limit") || "5")));
  const sort = searchParams.get("sort") || "date";
  const order = searchParams.get("order") || "desc";
  const isAdmin = (session.user as any).role === "Admin";

  const where: any = {};
  if (!isAdmin) where.userId = (session.user as any).id;
  if (isAdmin && userId) where.userId = userId;
  if (categoryId) where.categoryId = categoryId;
  if (status) where.status = status;
  if (startDate || endDate) {
    where.date = {};
    if (startDate) where.date.gte = new Date(startDate);
    if (endDate) where.date.lte = new Date(endDate);
  }

  const [data, total] = await Promise.all([
    db.incident.findMany({
      where,
      include: { category: true, user: { select: { id: true, name: true, email: true } } },
      orderBy: { [sort]: order },
      skip: (page - 1) * limit,
      take: limit,
    }),
    db.incident.count({ where }),
  ]);

  return NextResponse.json({ data, total, page, limit, totalPages: Math.ceil(total / limit) });
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await request.json();
  const { categoryId, reportedBy, place, description, date, endDate, status } = body;

  if (!categoryId || !reportedBy || !description || !date) {
    return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 });
  }

  const incident = await db.incident.create({
    data: {
      userId: (session.user as any).id,
      categoryId,
      reportedBy,
      place,
      description,
      date: new Date(date),
      endDate: endDate ? new Date(endDate) : null,
      status: status || "PENDIENTE",
    },
  });

  return NextResponse.json(incident, { status: 201 });
}
