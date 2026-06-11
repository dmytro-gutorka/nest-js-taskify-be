/*
  Warnings:

  - The values [LOW,MEDIUM,HIGH] on the enum `tasks_priority_enum` will be removed. If these variants are still used in the database, this will fail.
  - The values [TODO,IN_PROGRESS,DONE] on the enum `tasks_status_enum` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "tasks_priority_enum_new" AS ENUM ('low', 'medium', 'high');
ALTER TABLE "public"."tasks" ALTER COLUMN "priority" DROP DEFAULT;
ALTER TABLE "tasks" ALTER COLUMN "priority" TYPE "tasks_priority_enum_new" USING ("priority"::text::"tasks_priority_enum_new");
ALTER TYPE "tasks_priority_enum" RENAME TO "tasks_priority_enum_old";
ALTER TYPE "tasks_priority_enum_new" RENAME TO "tasks_priority_enum";
DROP TYPE "public"."tasks_priority_enum_old";
ALTER TABLE "tasks" ALTER COLUMN "priority" SET DEFAULT 'medium';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "tasks_status_enum_new" AS ENUM ('todo', 'in_progress', 'done');
ALTER TABLE "public"."tasks" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "tasks" ALTER COLUMN "status" TYPE "tasks_status_enum_new" USING ("status"::text::"tasks_status_enum_new");
ALTER TYPE "tasks_status_enum" RENAME TO "tasks_status_enum_old";
ALTER TYPE "tasks_status_enum_new" RENAME TO "tasks_status_enum";
DROP TYPE "public"."tasks_status_enum_old";
ALTER TABLE "tasks" ALTER COLUMN "status" SET DEFAULT 'todo';
COMMIT;

-- AlterTable
ALTER TABLE "tasks" ALTER COLUMN "status" SET DEFAULT 'todo',
ALTER COLUMN "priority" SET DEFAULT 'medium';
