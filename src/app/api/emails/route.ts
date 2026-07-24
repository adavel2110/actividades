import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if ((session.user as any).role !== "Admin") return NextResponse.json({ error: "Prohibido" }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const limit = Math.max(1, Math.min(100, parseInt(searchParams.get("limit") || "5")));
  const search = searchParams.get("search") || "";
  const companyId = searchParams.get("companyId") || "";

  const where: any = {};
  if (companyId) where.companyId = companyId;
  if (search) {
    where.OR = [
      { email: { contains: search, mode: "insensitive" } },
      { firstName: { contains: search, mode: "insensitive" } },
      { lastName: { contains: search, mode: "insensitive" } },
      { requester: { contains: search, mode: "insensitive" } },
      { cedula: { contains: search, mode: "insensitive" } },
      { domain: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
    ];
  }

  try {
    const [data, total] = await Promise.all([
      db.emailRequest.findMany({
        where,
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { id: true, name: true, email: true } },
          company: { select: { id: true, name: true } },
          department: { select: { id: true, name: true } },
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.emailRequest.count({ where }),
    ]);
    return NextResponse.json({ data, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch {
    return NextResponse.json({ data: [], total: 0, page: 1, limit, totalPages: 0 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if ((session.user as any).role !== "Admin") return NextResponse.json({ error: "Prohibido" }, { status: 403 });

  const body = await request.json();
  if (!body.email || !body.requester || !body.firstName || !body.lastName || !body.cedula || !body.description) {
    return NextResponse.json({ error: "Correo, solicitante, nombres, cedula y descripcion son requeridos" }, { status: 400 });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(body.email)) {
    return NextResponse.json({ error: "El formato del correo no es valido" }, { status: 400 });
  }

  try {
    const existing = await db.emailRequest.findUnique({ where: { email: body.email } });
    if (existing) {
      return NextResponse.json({ error: "Este correo ya esta registrado" }, { status: 409 });
    }

    const email = await db.emailRequest.create({
      data: {
        email: body.email.toLowerCase().trim(),
        requester: body.requester,
        domain: body.domain || null,
        firstName: body.firstName,
        lastName: body.lastName,
        cedula: body.cedula,
        status: body.status || "PENDIENTE",
        description: body.description,
        userId: (session.user as any).id,
        companyId: body.companyId || null,
        departmentId: body.departmentId || null,
      },
    });
    return NextResponse.json(email, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Error al crear el registro" }, { status: 500 });
  }
}
