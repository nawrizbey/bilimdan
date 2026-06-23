-- Drop the old global uniqueness on School.name; schools are now scoped per district.
DROP INDEX "School_name_key";

-- Add districtId as nullable first so existing rows can be backfilled.
ALTER TABLE "School" ADD COLUMN "districtId" INTEGER;

-- Backfill existing schools (all originally untied to a district) into Chilonzor
-- tumani / Toshkent shahri, the district the seeded demo account already uses.
UPDATE "School" SET "districtId" = (
  SELECT d.id FROM "District" d
  JOIN "Region" r ON r.id = d."regionId"
  WHERE d.name = 'Chilonzor tumani' AND r.name = 'Toshkent shahri'
)
WHERE "districtId" IS NULL;

-- Now that every row has a value, enforce NOT NULL + FK + per-district uniqueness.
ALTER TABLE "School" ALTER COLUMN "districtId" SET NOT NULL;

CREATE UNIQUE INDEX "School_districtId_name_key" ON "School"("districtId", "name");

ALTER TABLE "School" ADD CONSTRAINT "School_districtId_fkey" FOREIGN KEY ("districtId") REFERENCES "District"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
