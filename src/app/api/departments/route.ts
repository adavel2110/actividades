import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const companyId = searchParams.get("companyId");
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const limit = Math.max(1, Math.min(100, parseInt(searchParams.get("limit") || "5")));

  const where: any = {};
  if (companyId) where.companyId = companyId;

  const [data, total] = await Promise.all([
    db.department.findMany({
      where,
      orderBy: { name: "asc" },
      include: { company: { select: { id: true, name: true } } },
      skip: (page - 1) * limit,
      take: limit,
    }),
    db.department.count({ where }),
  ]);

  return NextResponse.json({ data, total, page, limit, totalPages: Math.ceil(total / limit) });
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== "Admin") return NextResponse.json({ error: "Prohibido" }, { status: 403 });

  const body = await request.json();
  if (!body.name?.trim() || !body.companyId) {
    return NextResponse.json({ error: "Nombre y empresa son requeridos" }, { status: 400 });
  }

  try {
    const department = await db.department.create({
      data: { name: body.name.trim(), companyId: body.companyId },
    });
    return NextResponse.json(department, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Error al crear el departamento" }, { status: 500 });
  }
}
