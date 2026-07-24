-- AlterTable: Add missing user_id column and drop old department text column
ALTER TABLE "email_requests" ADD COLUMN "user_id" UUID;

-- Set a default admin user for existing records (first user in the table)
UPDATE "email_requests" SET "user_id" = (SELECT "id" FROM "users" LIMIT 1) WHERE "user_id" IS NULL;

-- Now make user_id required
ALTER TABLE "email_requests" ALTER COLUMN "user_id" SET NOT NULL;

-- Drop old department text column if it still exists
ALTER TABLE "email_requests" DROP COLUMN IF EXISTS "department";

-- Add fecha_baja column for deactivation tracking
ALTER TABLE "email_requests" ADD COLUMN "fecha_baja" TIMESTAMP(3);

-- AddForeignKey
ALTER TABLE "email_requests" ADD CONSTRAINT "email_requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
