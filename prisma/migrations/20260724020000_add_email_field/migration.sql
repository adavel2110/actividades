-- AlterTable: Add email field with unique constraint
ALTER TABLE "email_requests" ADD COLUMN "email" TEXT NOT NULL DEFAULT '';

-- CreateIndex: Unique email
CREATE UNIQUE INDEX "email_requests_email_key" ON "email_requests"("email");
