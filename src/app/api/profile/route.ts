import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import bcrypt from "bcryptjs";

export async function PUT(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const userId = (session.user as any).id;
  const { name, email, currentPassword, newPassword } = await request.json();

  const update: any = {};

  if (name) update.name = name;

  if (email) {
    const existing = await db.user.findUnique({ where: { email } });
    if (existing && existing.id !== userId) {
      return NextResponse.json({ error: "El email ya está en uso" }, { status: 400 });
    }
    update.email = email;
  }

  if (currentPassword && newPassword) {
    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) return NextResponse.json({ error: "Contraseña actual incorrecta" }, { status: 400 });
    update.password = await bcrypt.hash(newPassword, 10);
  }

  const user = await db.user.update({ where: { id: userId }, data: update });

  return NextResponse.json({ name: user.name, email: user.email });
}
