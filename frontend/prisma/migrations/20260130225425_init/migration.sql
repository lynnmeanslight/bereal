-- CreateTable
CREATE TABLE "Auction" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "amount" TEXT NOT NULL,
    "configHash" TEXT NOT NULL,
    "creator" TEXT NOT NULL,
    "startBlock" BIGINT NOT NULL,
    "endBlock" BIGINT NOT NULL,
    "claimBlock" BIGINT NOT NULL,
    "blockNumber" BIGINT NOT NULL,
    "logIndex" INTEGER NOT NULL,
    "txHash" TEXT NOT NULL,
    "chainId" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "insertedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Auction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RawConfig" (
    "auction" TEXT NOT NULL,
    "configData" BYTEA NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RawConfig_pkey" PRIMARY KEY ("auction")
);

-- CreateTable
CREATE TABLE "BlockCursor" (
    "id" TEXT NOT NULL,
    "lastProcessedBlock" BIGINT NOT NULL,
    "lastProcessedLog" INTEGER NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BlockCursor_pkey" PRIMARY KEY ("id")
);
