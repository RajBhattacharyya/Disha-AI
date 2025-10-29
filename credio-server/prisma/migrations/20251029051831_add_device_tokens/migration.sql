-- AlterTable
ALTER TABLE "User" ADD COLUMN     "deviceTokens" JSONB NOT NULL DEFAULT '[]';
