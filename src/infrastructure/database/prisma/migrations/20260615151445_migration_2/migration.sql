/*
  Warnings:

  - Changed the type of `resource` on the `permissions` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "permission_resource_enum" AS ENUM ('tasks', 'users');

-- AlterTable
ALTER TABLE "permissions" DROP COLUMN "resource",
ADD COLUMN     "resource" "permission_resource_enum" NOT NULL;
