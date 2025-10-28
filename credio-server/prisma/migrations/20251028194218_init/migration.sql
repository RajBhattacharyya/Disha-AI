-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'RESPONDER', 'ADMIN');

-- CreateEnum
CREATE TYPE "DisasterType" AS ENUM ('FLOOD', 'EARTHQUAKE', 'FIRE', 'CYCLONE', 'LANDSLIDE', 'TORNADO', 'TSUNAMI', 'HURRICANE', 'WILDFIRE', 'OTHER');

-- CreateEnum
CREATE TYPE "Severity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "DisasterStatus" AS ENUM ('ACTIVE', 'RESOLVED', 'MONITORING');

-- CreateEnum
CREATE TYPE "AlertType" AS ENUM ('WARNING', 'EVACUATION', 'ALL_CLEAR', 'UPDATE');

-- CreateEnum
CREATE TYPE "DeliveryStatus" AS ENUM ('PENDING', 'SENT', 'DELIVERED', 'FAILED');

-- CreateEnum
CREATE TYPE "DeliveryMethod" AS ENUM ('PUSH', 'SMS', 'EMAIL', 'IN_APP');

-- CreateEnum
CREATE TYPE "ResourceType" AS ENUM ('SHELTER', 'HOSPITAL', 'RESCUE_TEAM', 'FOOD', 'WATER', 'MEDICAL', 'POLICE', 'FIRE_STATION');

-- CreateEnum
CREATE TYPE "ResourceAvailability" AS ENUM ('AVAILABLE', 'LIMITED', 'UNAVAILABLE');

-- CreateEnum
CREATE TYPE "EmergencyType" AS ENUM ('MEDICAL', 'FIRE', 'TRAPPED', 'INJURY', 'NATURAL_DISASTER', 'OTHER');

-- CreateEnum
CREATE TYPE "SOSStatus" AS ENUM ('PENDING', 'DISPATCHED', 'IN_PROGRESS', 'RESOLVED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "DataCategory" AS ENUM ('PROTOCOL', 'HISTORICAL', 'REALTIME', 'PREDICTION', 'GUIDANCE');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phoneNumber" TEXT,
    "name" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "preferredLanguage" TEXT NOT NULL DEFAULT 'en',
    "location" JSONB NOT NULL,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "emergencyContacts" JSONB NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "notificationPreferences" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DisasterEvent" (
    "id" TEXT NOT NULL,
    "type" "DisasterType" NOT NULL,
    "severity" "Severity" NOT NULL,
    "location" JSONB NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" "DisasterStatus" NOT NULL,
    "dataSource" TEXT NOT NULL,
    "predictedImpact" JSONB NOT NULL,
    "affectedPopulation" INTEGER NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3),
    "metadata" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DisasterEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Alert" (
    "id" TEXT NOT NULL,
    "disasterId" TEXT,
    "userId" TEXT,
    "alertType" "AlertType" NOT NULL,
    "message" TEXT NOT NULL,
    "translatedMessages" JSONB NOT NULL,
    "deliveryStatus" "DeliveryStatus" NOT NULL,
    "deliveryMethod" "DeliveryMethod" NOT NULL,
    "sentAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "location" JSONB NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Alert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT,
    "messages" JSONB NOT NULL,
    "context" JSONB NOT NULL,
    "language" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sessionMetadata" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChatSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmergencyResource" (
    "id" TEXT NOT NULL,
    "type" "ResourceType" NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "location" JSONB NOT NULL,
    "contactPhone" TEXT NOT NULL,
    "contactEmail" TEXT NOT NULL,
    "website" TEXT,
    "availability" "ResourceAvailability" NOT NULL,
    "capacity" INTEGER,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "operatingHours" JSONB NOT NULL,
    "lastUpdated" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmergencyResource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SOSRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "location" JSONB NOT NULL,
    "emergencyType" "EmergencyType" NOT NULL,
    "status" "SOSStatus" NOT NULL,
    "description" TEXT NOT NULL,
    "severity" "Severity" NOT NULL,
    "responderAssigned" TEXT,
    "responderNotes" TEXT,
    "mediaUrls" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "SOSRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DisasterData" (
    "id" TEXT NOT NULL,
    "disasterId" TEXT,
    "content" TEXT NOT NULL,
    "embedding" BYTEA,
    "source" TEXT NOT NULL,
    "metadata" JSONB NOT NULL,
    "category" "DataCategory" NOT NULL,
    "language" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DisasterData_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "ipAddress" TEXT NOT NULL,
    "userAgent" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_phoneNumber_key" ON "User"("phoneNumber");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_phoneNumber_idx" ON "User"("phoneNumber");

-- CreateIndex
CREATE INDEX "DisasterEvent_type_idx" ON "DisasterEvent"("type");

-- CreateIndex
CREATE INDEX "DisasterEvent_status_idx" ON "DisasterEvent"("status");

-- CreateIndex
CREATE INDEX "Alert_disasterId_idx" ON "Alert"("disasterId");

-- CreateIndex
CREATE INDEX "Alert_userId_idx" ON "Alert"("userId");

-- CreateIndex
CREATE INDEX "ChatSession_userId_idx" ON "ChatSession"("userId");

-- CreateIndex
CREATE INDEX "EmergencyResource_type_idx" ON "EmergencyResource"("type");

-- CreateIndex
CREATE INDEX "EmergencyResource_availability_idx" ON "EmergencyResource"("availability");

-- CreateIndex
CREATE INDEX "SOSRequest_userId_idx" ON "SOSRequest"("userId");

-- CreateIndex
CREATE INDEX "SOSRequest_responderAssigned_idx" ON "SOSRequest"("responderAssigned");

-- CreateIndex
CREATE INDEX "SOSRequest_status_idx" ON "SOSRequest"("status");

-- CreateIndex
CREATE INDEX "DisasterData_disasterId_idx" ON "DisasterData"("disasterId");

-- CreateIndex
CREATE INDEX "DisasterData_category_idx" ON "DisasterData"("category");

-- CreateIndex
CREATE UNIQUE INDEX "UserSession_token_key" ON "UserSession"("token");

-- CreateIndex
CREATE INDEX "UserSession_userId_idx" ON "UserSession"("userId");

-- AddForeignKey
ALTER TABLE "Alert" ADD CONSTRAINT "Alert_disasterId_fkey" FOREIGN KEY ("disasterId") REFERENCES "DisasterEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Alert" ADD CONSTRAINT "Alert_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatSession" ADD CONSTRAINT "ChatSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SOSRequest" ADD CONSTRAINT "SOSRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SOSRequest" ADD CONSTRAINT "SOSRequest_responderAssigned_fkey" FOREIGN KEY ("responderAssigned") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DisasterData" ADD CONSTRAINT "DisasterData_disasterId_fkey" FOREIGN KEY ("disasterId") REFERENCES "DisasterEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSession" ADD CONSTRAINT "UserSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
