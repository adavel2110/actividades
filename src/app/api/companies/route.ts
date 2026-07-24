import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const limit = Math.max(1, Math.min(100, parseInt(searchParams.get("limit") || "5")));

  const [data, total] = await Promise.all([
    db.company.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { departments: true } } },
      skip: (page - 1) * limit,
      take: limit,
    }),
    db.company.count(),
  ]);

  return NextResponse.json({ data, total, page, limit, totalPages: Math.ceil(total / limit) });
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== "Admin") return NextResponse.json({ error: "Prohibido" }, { status: 403 });

  const body = await request.json();
  if (!body.name?.trim()) return NextResponse.json({ error: "El nombre es requerido" }, { status: 400 });

  try {
    const company = await db.company.create({ data: { name: body.name.trim() } });
    return NextResponse.json(company, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Error al crear la empresa" }, { status: 500 });
  }
}
