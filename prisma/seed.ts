import { PrismaClient, IncidentStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  if (process.env.ALLOW_SEED !== "true") {
    console.error("⛔ Seeder abortado: define ALLOW_SEED=true para ejecutar.");
    console.error("   Este comando BORRA TODOS LOS DATOS existentes.");
    console.error("   Ejemplo: ALLOW_SEED=true npx prisma db seed");
    process.exit(1);
  }

  console.log("⚠️  Borrando datos existentes...");
  await prisma.incident.deleteMany({});
  await prisma.category.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.role.deleteMany({});

  const adminRole = await prisma.role.create({ data: { name: "Admin" } });
  const espRole = await prisma.role.create({ data: { name: "Especialista" } });

  const adminPassword = await bcrypt.hash("admin123", 10);
  const espPassword = await bcrypt.hash("esp123", 10);

  const admin = await prisma.user.create({
    data: { name: "Administrador", email: "admin@incidencias.com", password: adminPassword, roleId: adminRole.id },
  });

  const esp1 = await prisma.user.create({
    data: { name: "Carlos Mendoza", email: "carlos@incidencias.com", password: espPassword, roleId: espRole.id },
  });

  const esp2 = await prisma.user.create({
    data: { name: "Ana Gómez", email: "ana@incidencias.com", password: espPassword, roleId: espRole.id },
  });

  const cat1 = await prisma.category.create({ data: { name: "Infraestructura" } });
  const cat2 = await prisma.category.create({ data: { name: "Software" } });
  const cat3 = await prisma.category.create({ data: { name: "Redes" } });
  const cat4 = await prisma.category.create({ data: { name: "Correo Electrónico" } });

  const now = new Date();
  await prisma.incident.createMany({
    data: [
      { userId: esp1.id, categoryId: cat1.id, reportedBy: "Jorge Valenzuela", description: "Restauración de telefonía IP. Troncales SIP caídos.", date: new Date(now.getFullYear(), now.getMonth(), 2, 9, 0), status: IncidentStatus.PROCESADO },
      { userId: esp1.id, categoryId: cat2.id, reportedBy: "Clara Salazar", description: "Solución de bloqueo en módulo contable. Reindexación de base de datos.", date: new Date(now.getFullYear(), now.getMonth(), 3, 10, 0), status: IncidentStatus.PROCESADO },
      { userId: esp1.id, categoryId: cat4.id, reportedBy: "Roberto Dávila", description: "Migración de buzones a Exchange Online. Configuración MX.", date: new Date(now.getFullYear(), now.getMonth(), 3, 14, 0), status: IncidentStatus.EN_PROCESO },
      { userId: esp2.id, categoryId: cat3.id, reportedBy: "María Torres", description: "Configuración de VLAN y segmentación de red interna.", date: new Date(now.getFullYear(), now.getMonth(), 4, 8, 30), status: IncidentStatus.PENDIENTE },
      { userId: esp2.id, categoryId: cat2.id, reportedBy: "Pedro Ramírez", description: "Actualización de sistema ERP a última versión disponible.", date: new Date(now.getFullYear(), now.getMonth(), 4, 11, 0), status: IncidentStatus.DERIVADO },
    ],
  });

  console.log("Base de datos sembrada con éxito.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
