-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "wallet" TEXT NOT NULL,
    "stake" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "reward" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Statistics" (
    "id" SERIAL NOT NULL,
    "totalStaked" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalRewards" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalUsers" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Statistics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_wallet_key" ON "User"("wallet");
