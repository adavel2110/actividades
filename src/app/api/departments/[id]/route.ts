import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  try {
    const department = await db.department.findUnique({
      where: { id: params.id },
      include: { company: true },
    });
    if (!department) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    return NextResponse.json(department);
  } catch {
    return NextResponse.json({ error: "Error al consultar" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== "Admin") return NextResponse.json({ error: "Prohibido" }, { status: 403 });

  try {
    const body = await request.json();
    const department = await db.department.update({
      where: { id: params.id },
      data: { name: body.name.trim(), companyId: body.companyId },
    });
    return NextResponse.json(department);
  } catch {
    return NextResponse.json({ error: "Error al actualizar" }, { status: 500 });
  }
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== "Admin") return NextResponse.json({ error: "Prohibido" }, { status: 403 });

  try {
    await db.department.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Error al eliminar" }, { status: 500 });
  }
}
