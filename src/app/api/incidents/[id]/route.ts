import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const incident = await db.incident.findUnique({
    where: { id: params.id },
    include: { category: true, user: { select: { id: true, name: true } } },
  });

  if (!incident) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  const isAdmin = (session.user as any).role === "Admin";
  if (!isAdmin && incident.userId !== (session.user as any).id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  return NextResponse.json(incident);
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const existing = await db.incident.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  const isAdmin = (session.user as any).role === "Admin";
  if (!isAdmin && existing.userId !== (session.user as any).id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const body = await request.json();
  const { categoryId, reportedBy, place, description, date, endDate, status, userId } = body;

  const data: any = {};
  if (categoryId) data.categoryId = categoryId;
  if (reportedBy) data.reportedBy = reportedBy;
  if (place !== undefined) data.place = place;
  if (description) data.description = description;
  if (date) data.date = new Date(date);
  if (endDate) data.endDate = new Date(endDate);
  if (endDate === null) data.endDate = null;
  if (status) data.status = status;
  if (isAdmin && userId) data.userId = userId;

  const incident = await db.incident.update({ where: { id: params.id }, data });
  return NextResponse.json(incident);
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const existing = await db.incident.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  const isAdmin = (session.user as any).role === "Admin";
  if (!isAdmin && existing.userId !== (session.user as any).id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  await db.incident.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
