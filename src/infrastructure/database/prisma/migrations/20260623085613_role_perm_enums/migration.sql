/*
  Warnings:

  - You are about to drop the column `inverted` on the `role_permission_rules` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "role_permission_rule_effect" AS ENUM ('allow', 'deny');

-- CreateEnum
CREATE TYPE "role_permission_rule_type" AS ENUM ('conditional', 'full_access');

-- AlterTable
ALTER TABLE "role_permission_rules" DROP COLUMN "inverted",
ADD COLUMN     "effect" "role_permission_rule_effect" NOT NULL DEFAULT 'allow',
ADD COLUMN     "type" "role_permission_rule_type" NOT NULL DEFAULT 'conditional',
ALTER COLUMN "conditions" DROP NOT NULL;
