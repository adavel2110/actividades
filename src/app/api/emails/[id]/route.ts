import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  try {
    const email = await db.emailRequest.findUnique({
      where: { id: params.id },
      include: { company: true, department: true },
    });
    if (!email) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    return NextResponse.json(email);
  } catch {
    return NextResponse.json({ error: "Error al consultar" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== "Admin") return NextResponse.json({ error: "Prohibido" }, { status: 403 });

  try {
    const body = await request.json();

    if (body.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(body.email)) {
        return NextResponse.json({ error: "El formato del correo no es valido" }, { status: 400 });
      }
      const existing = await db.emailRequest.findFirst({ where: { email: body.email, NOT: { id: params.id } } });
      if (existing) {
        return NextResponse.json({ error: "Este correo ya esta registrado" }, { status: 409 });
      }
      body.email = body.email.toLowerCase().trim();
    }

    if (body.fechaReg) {
      body.fechaReg = new Date(body.fechaReg);
    } else if (body.fechaReg === "" || body.fechaReg === null) {
      body.fechaReg = null;
    }

    const email = await db.emailRequest.update({ where: { id: params.id }, data: body });
    return NextResponse.json(email);
  } catch {
    return NextResponse.json({ error: "Error al actualizar" }, { status: 500 });
  }
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== "Admin") return NextResponse.json({ error: "Prohibido" }, { status: 403 });

  try {
    await db.emailRequest.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Error al eliminar" }, { status: 500 });
  }
}
