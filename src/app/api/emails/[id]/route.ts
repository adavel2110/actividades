import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const email = await db.emailRequest.findUnique({ where: { id: params.id } });
  if (!email) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  return NextResponse.json(email);
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if ((session.user as any).role !== "Admin") return NextResponse.json({ error: "Prohibido" }, { status: 403 });

  const body = await request.json();
  const email = await db.emailRequest.update({ where: { id: params.id }, data: body });
  return NextResponse.json(email);
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if ((session.user as any).role !== "Admin") return NextResponse.json({ error: "Prohibido" }, { status: 403 });

  await db.emailRequest.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
