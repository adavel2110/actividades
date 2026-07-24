import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import bcryptjs from "bcryptjs";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== "Admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const limit = Math.max(1, Math.min(100, parseInt(searchParams.get("limit") || "5")));

  const [data, total] = await Promise.all([
    db.user.findMany({
      include: { role: { select: { name: true } } },
      orderBy: { name: "asc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    db.user.count(),
  ]);

  return NextResponse.json({ data, total, page, limit, totalPages: Math.ceil(total / limit) });
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== "Admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const body = await request.json();
  const { name, email, password, roleId } = body;

  if (!name || !email || !password || !roleId) {
    return NextResponse.json({ error: "Todos los campos son requeridos" }, { status: 400 });
  }

  const hashed = await bcryptjs.hash(password, 10);

  const user = await db.user.create({ data: { name, email, password: hashed, roleId } });
  return NextResponse.json(user, { status: 201 });
}
