import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const emails = await db.emailRequest.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(emails);
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if ((session.user as any).role !== "Admin") return NextResponse.json({ error: "Prohibido" }, { status: 403 });

  const body = await request.json();
  if (!body.requester || !body.firstName || !body.lastName || !body.cedula || !body.department || !body.description) {
    return NextResponse.json({ error: "Todos los campos son requeridos" }, { status: 400 });
  }

  const email = await db.emailRequest.create({
    data: {
      requester: body.requester,
      domain: body.domain || null,
      firstName: body.firstName,
      lastName: body.lastName,
      cedula: body.cedula,
      department: body.department,
      status: body.status || "PENDIENTE",
      description: body.description,
    },
  });

  return NextResponse.json(email, { status: 201 });
}
