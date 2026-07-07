import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import bcryptjs from "bcryptjs";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== "Admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const users = await db.user.findMany({
    include: { role: { select: { name: true } } },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(users);
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
