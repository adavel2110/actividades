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
  const isAdmin = (session.user as any).role === "Admin";

  const where: any = {};
  if (!isAdmin) where.userId = (session.user as any).id;
  if (isAdmin && userId) where.userId = userId;
  if (categoryId) where.categoryId = categoryId;
  if (status) where.status = status;

  const incidents = await db.incident.findMany({
    where,
    include: { category: true, user: { select: { id: true, name: true, email: true } } },
    orderBy: { date: "desc" },
  });

  return NextResponse.json(incidents);
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
