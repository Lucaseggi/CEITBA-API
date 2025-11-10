-- DropForeignKey
ALTER TABLE "public"."plan" DROP CONSTRAINT "plan_career_id_fkey";

-- AddForeignKey
ALTER TABLE "public"."plan" ADD CONSTRAINT "plan_career_id_fkey" FOREIGN KEY ("career_id") REFERENCES "public"."careers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
