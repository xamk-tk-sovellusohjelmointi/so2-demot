# Demo 9: Ajopäiväkirjan aloituspohja (Express ja Prisma v7 + SQLite)

Tämä kansio sisältää demon 9 lähtötilanteen. Siinä on Express-palvelin, SQLite-tietokanta ja Prisma ORM:n versio 7 valmiiksi määritettyinä. Sovelluksen aiheena on ajopäiväkirja. Tietokantaan tallennetaan ajoja, joilla on reitti, kilometrimäärä, ajaja ja päivämäärä. Demon varsinainen toteutus ja ohjeet ovat valmiin version README-tiedostossa.

Prisma on asennettu virallisen ohjeen [Quickstart: Prisma ORM with SQLite](https://www.prisma.io/docs/prisma-orm/quickstart/sqlite) mukaisesti. Pakettiversiot ovat samat kuin syksyn aiemmissa demoissa (Node.js 24, Express 5, TypeScript 7, Prisma 7.10.0).

---

## 1. Projektin sisältö

```text
Starter-Using-Prisma/
├── generated/prisma/          # npx prisma generate -komennon tuottama Prisma Client (ei versionhallinnassa)
├── lib/
│   └── prisma.ts              # PrismaClient-olio ja tietokantayhteys
├── prisma/
│   ├── migrations/
│   │   ├── <aikaleima>_init/
│   │   │   └── migration.sql  # Ajo-taulun luonti
│   │   └── migration_lock.toml
│   ├── schema.prisma          # Tietomalli (Ajo)
│   └── seed.ts                # Esimerkkidata tietokantaan
├── public/
│   └── index.html             # Etusivu
├── .env                       # DATABASE_URL (ei versionhallinnassa)
├── .gitignore
├── dev.db                     # SQLite-tietokanta
├── index.ts                   # Express-palvelin
├── package.json
├── package-lock.json
├── prisma7.config.ts          # Prisman asetukset ja seed-komento
└── tsconfig.json
```

`index.ts` sisältää pelkän Express-palvelimen, joka tarjoilee `public`-kansion sisällön portissa `3009`. Reittejä ei vielä ole.

`package.json` ja `tsconfig.json` ovat samat kuin demoissa 5–8. Prisman kannalta olennaiset paketit ovat:

| Paketti | Tehtävä |
|---|---|
| `prisma` | Prisman komentorivityökalu (`npx prisma ...`), kehitysriippuvuus |
| `@prisma/client` | Prisma Clientin ajonaikainen kirjasto |
| `@prisma/adapter-better-sqlite3` | Yhdistää Prisma Clientin SQLite-tietokantaan `better-sqlite3`-ajurin kautta |
| `@types/better-sqlite3` | Ajurin tyyppimäärittelyt |
| `dotenv` | Lukee `.env`-tiedoston arvot `process.env`-olioon |

---

## 2. Prisman määritykset

### Prisman alustaminen

Prisma alustettiin komennolla:

```bash
npx prisma init --datasource-provider sqlite --output ../generated/prisma
```

Komento loi tiedostot `prisma/schema.prisma`, `prisma7.config.ts`, `.env` ja `.gitignore`. `.env`-tiedoston olennainen rivi on tietokannan sijainnin tunniste:

```bash
DATABASE_URL="file:./dev.db"
```

`.gitignore` jättää versionhallinnan ulkopuolelle kansiot `node_modules` ja `generated/prisma` sekä `.env`-tiedoston.

> **Huomio:** `prisma init` luo myös tekoälyavustimille tarkoitetut kansiot `.agents`, `.claude` ja `.windsurf` sekä tiedoston `skills-lock.json`. Ne on poistettu, koska niitä ei tarvita demossa.

### Tietomalli

`prisma/schema.prisma`:

```prisma
generator client {
  provider = "prisma-client"
  output   = "../generated/prisma"
}

datasource db {
  provider = "sqlite"
}

model Ajo {
  id     Int      @id @default(autoincrement())
  reitti String
  km     Int
  ajaja  String
  pvm    DateTime @default(now())
}
```

| Kenttä | Selitys |
|---|---|
| `id` | Ensisijainen avain, joka kasvaa automaattisesti |
| `reitti` | Ajettu reitti tekstinä |
| `km` | Ajetut kilometrit kokonaislukuna |
| `ajaja` | Ajajan nimi |
| `pvm` | Ajon päivämäärä, oletuksena lisäyshetki (`now()`) |

### Asetustiedosto

`prisma7.config.ts`:

```typescript
import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
```

Prisman generoimaan tiedostoon on tehty kaksi muutosta:

- `migrations.seed` määrittää komennon, jolla tietokanta täytetään esimerkkidatalla (luku [3](#3-tietokannan-täyttäminen-seedts-tiedostolla)).
- `process.env["DATABASE_URL"]` on vaihdettu `env("DATABASE_URL")`-kutsuun kuten demoissa 5–8. `process.env`-arvon tyyppi on `string | undefined`, ja se aiheuttaa `exactOptionalPropertyTypes`-asetuksen kanssa virheen `npm run typecheck` -komennossa.

### Migraatio ja Prisma Client

Tietokanta luotiin ja Prisma Client generoitiin komennoilla:

```bash
npx prisma migrate dev --name init
npx prisma generate
```

`migrate dev` loi tietokantatiedoston `dev.db` ja migraation `prisma/migrations/<aikaleima>_init/migration.sql`:

```sql
-- CreateTable
CREATE TABLE "Ajo" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "reitti" TEXT NOT NULL,
    "km" INTEGER NOT NULL,
    "ajaja" TEXT NOT NULL,
    "pvm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

Prisma 7:ssä `migrate dev` ei generoi Prisma Clientia, joten `npx prisma generate` ajetaan erikseen. Generoitu koodi on kansiossa `generated/prisma`, eikä sitä muokata käsin.

### Tietokantayhteys

`lib/prisma.ts`:

```typescript
import "dotenv/config";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../generated/prisma/client";

const connectionString = `${process.env.DATABASE_URL}`;

const adapter = new PrismaBetterSqlite3({ url: connectionString });
const prisma = new PrismaClient({ adapter });

export { prisma };
```

Tiedosto on sama kuin demossa 5. Sovelluksen kaikki osat käyttävät tästä tiedostosta vietyä `prisma`-oliota.

---

## 3. Tietokannan täyttäminen seed.ts-tiedostolla

Tietokantaan voidaan alustaa tietoa erillisen seed-skriptin avulla. `prisma/seed.ts` lisää tietokantaan viisi esimerkkiajoa:

```typescript
import { prisma } from "../lib/prisma";

const ajot = [
    { reitti: "Mikkeli - Kouvola", km: 98, ajaja: "Matti Meikäläinen", pvm: new Date("2026-11-02") },
    { reitti: "Kouvola - Kotka", km: 53, ajaja: "Maija Meikäläinen", pvm: new Date("2026-11-03") },
    { reitti: "Kotka - Helsinki", km: 132, ajaja: "Matti Meikäläinen", pvm: new Date("2026-11-04") },
    { reitti: "Helsinki - Mikkeli", km: 230, ajaja: "Maija Meikäläinen", pvm: new Date("2026-11-05") },
    { reitti: "Mikkeli - Savonlinna", km: 101, ajaja: "Teppo Testaaja", pvm: new Date("2026-11-06") },
];

const main = async () => {
    await prisma.ajo.deleteMany();
    await prisma.ajo.createMany({ data: ajot });
    console.log(`Tietokantaan lisättiin ${ajot.length} ajoa.`);
};

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
```

| Kohta | Selitys |
|---|---|
| `deleteMany()` | Tyhjentää `Ajo`-taulun, jotta skriptin voi ajaa uudelleen ilman tuplarivejä |
| `createMany({ data: ajot })` | Lisää kaikki taulukon ajot yhdellä kutsulla |
| `$disconnect()` | Sulkee tietokantayhteyden skriptin lopussa |
| `process.exit(1)` | Päättää skriptin virhekoodilla, jos jokin kutsu epäonnistuu |

Seed ajetaan komennolla:

```bash
npx prisma db seed
```

Prisma ajaa `prisma7.config.ts`-tiedostossa määritellyn komennon `tsx prisma/seed.ts`. Terminaaliin tulostuu:

```bash
Tietokantaan lisättiin 5 ajoa.
🌱  The seed command has been executed.
```

> **Huomio:** Prisma 7:ssä `migrate dev` ei aja seediä automaattisesti, joten seed ajetaan aina erikseen komennolla `npx prisma db seed`. Uudelleenajon jälkeen `id`-arvot jatkuvat edellisestä suurimmasta arvosta, koska `deleteMany()` ei nollaa taulun `AUTOINCREMENT`-laskuria.

Lisätyt rivit voi tarkastaa Prisma Studiolla:

```bash
npx prisma@7.9.1 studio --url file:./dev.db
```

> **Huomio:** Prisman versioissa 7.10.0 ja 7.10.1 komento `npx prisma studio` päättyy virheeseen `Prisma Studio is not supported for the "file:./dev.db" protocol.` Versiot 7.10.x tunnistavat tietokannan tyypin vain osoitteista, joissa on merkkijono `://`, eikä SQLiten suhteellinen osoite `file:./dev.db` sisällä sitä. Studio käynnistetään siksi versiolla 7.9.1, jonka `npx` lataa erikseen projektin riippuvuuksia muuttamatta. Valitsin `--url` tarvitaan, koska versio 7.9.1 ei lue tietokannan osoitetta `prisma7.config.ts`-tiedostosta. Studio tulostaa terminaaliin osoitteensa ja avaa sen selaimeen. Studio sammutetaan `Ctrl+C`-näppäinyhdistelmällä.
