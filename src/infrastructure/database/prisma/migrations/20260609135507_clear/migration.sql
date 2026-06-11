/*
  Warnings:

  - You are about to drop the column `media_type` on the `media` table. All the data in the column will be lost.
  - You are about to drop the column `storage_provider` on the `media` table. All the data in the column will be lost.
  - Added the required column `mediaType` to the `media` table without a default value. This is not possible if the table is not empty.
  - Added the required column `storageProvider` to the `media` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "MediaType" AS ENUM ('image');

-- CreateEnum
CREATE TYPE "MediaStorageProvider" AS ENUM ('cloudinary');

-- AlterTable
ALTER TABLE "media" DROP COLUMN "media_type",
DROP COLUMN "storage_provider",
ADD COLUMN     "mediaType" "MediaType" NOT NULL,
ADD COLUMN     "storageProvider" "MediaStorageProvider" NOT NULL;
