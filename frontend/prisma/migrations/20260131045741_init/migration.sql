/*
  Warnings:

  - The primary key for the `Auction` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `RawConfig` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `auction` on the `RawConfig` table. All the data in the column will be lost.
  - Added the required column `chainId` to the `BlockCursor` table without a default value. This is not possible if the table is not empty.
  - Added the required column `auctionId` to the `RawConfig` table without a default value. This is not possible if the table is not empty.
  - Added the required column `chainId` to the `RawConfig` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Auction" DROP CONSTRAINT "Auction_pkey",
ADD CONSTRAINT "Auction_pkey" PRIMARY KEY ("id", "chainId");

-- AlterTable
ALTER TABLE "BlockCursor" ADD COLUMN     "chainId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "RawConfig" DROP CONSTRAINT "RawConfig_pkey",
DROP COLUMN "auction",
ADD COLUMN     "auctionId" TEXT NOT NULL,
ADD COLUMN     "chainId" INTEGER NOT NULL,
ADD CONSTRAINT "RawConfig_pkey" PRIMARY KEY ("auctionId", "chainId");

-- CreateTable
CREATE TABLE "HumanVerification" (
    "id" TEXT NOT NULL,
    "walletAddress" TEXT NOT NULL,
    "nullifierHash" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "chainId" INTEGER NOT NULL,
    "verifiedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HumanVerification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "HumanVerification_nullifierHash_key" ON "HumanVerification"("nullifierHash");

-- CreateIndex
CREATE INDEX "HumanVerification_walletAddress_action_idx" ON "HumanVerification"("walletAddress", "action");

-- CreateIndex
CREATE INDEX "HumanVerification_chainId_idx" ON "HumanVerification"("chainId");

-- CreateIndex
CREATE INDEX "Auction_creator_idx" ON "Auction"("creator");

-- CreateIndex
CREATE INDEX "Auction_active_idx" ON "Auction"("active");

-- CreateIndex
CREATE INDEX "Auction_chainId_blockNumber_idx" ON "Auction"("chainId", "blockNumber");

-- CreateIndex
CREATE INDEX "BlockCursor_chainId_idx" ON "BlockCursor"("chainId");

-- AddForeignKey
ALTER TABLE "RawConfig" ADD CONSTRAINT "RawConfig_auctionId_chainId_fkey" FOREIGN KEY ("auctionId", "chainId") REFERENCES "Auction"("id", "chainId") ON DELETE CASCADE ON UPDATE CASCADE;
