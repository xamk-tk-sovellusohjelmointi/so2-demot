-- CreateTable
CREATE TABLE "Ostos" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "tuote" TEXT NOT NULL,
    "poimittu" BOOLEAN NOT NULL DEFAULT false
);

-- CreateTable
CREATE TABLE "Kayttaja" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "kayttajatunnus" TEXT NOT NULL,
    "salasana" TEXT NOT NULL
);
