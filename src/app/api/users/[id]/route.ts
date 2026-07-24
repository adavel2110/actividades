import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import bcryptjs from "bcryptjs";

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== "Admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const body = await request.json();
  const data: any = {};
  if (body.name) data.name = body.name;
  if (body.email) data.email = body.email;
  if (body.roleId) data.roleId = body.roleId;
  if (body.password) data.password = await bcryptjs.hash(body.password, 10);

  const user = await db.user.update({ where: { id: params.id }, data });
  return NextResponse.json(user);
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== "Admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  await db.user.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
