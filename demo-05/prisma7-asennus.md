# Prisma ORM v7 + SQLite -asennus (Express/EJS/TS-projektiin)

Testattu toimivaksi: Node 24.21, TypeScript 7.0.2, tsx 4.23.13, Prisma 7.10.0.

## 1. Asenna paketit

Pinnaa versiot eksplisiittisesti — `prisma`-paketin uusin julkaisu npm:ssä on tätä kirjoitettaessa Prisma 8 (RC), ei v7.

```bash
npm install prisma@7.10.0 @types/better-sqlite3 --save-dev
npm install @prisma/client@7.10.0 @prisma/adapter-better-sqlite3@7.10.0
```

## 2. Alusta Prisma

```bash
npx prisma init --datasource-provider sqlite --output ../src/generated/prisma
```

Luo `prisma/schema.prisma`-, `.env`- ja config-tiedoston.

> ⚠️ **Huom:** Virallinen dokumentaatio näyttää tuloksena tiedoston `prisma.config.ts`. Prisma 7.10.0:sta lähtien komento voi kuitenkin luoda tiedoston nimellä **`prisma7.config.ts`** (osa uutta yhteensopivuuspakettia, jolla Prisma 7 ja 8 voivat elää rinnakkain samassa projektissa). Tarkista kumpi tiedosto asennus loi, ja käytä sitä johdonmukaisesti kaikissa komennoissa — CLI etsii oletuksena ensin `prisma7.config.*`-tiedostoa ja vasta sitten `prisma.config.*`-tiedostoa.

## 3. `.env`

Aseta SQLite-tiedoston polku:

```env
DATABASE_URL="file:./dev.db"
```

## 4. Client-instanssi driver-adapterilla

Prisma 7 vaatii driver-adapterin — pelkkä `DATABASE_URL` ei enää riitä. Luo esim. `src/db.ts`:

```ts
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "./generated/prisma/client.ts";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL as string,
});

export const prisma = new PrismaClient({ adapter });
```

## 5. Migraatio ja clientin generointi

```bash
npx prisma migrate dev --name init
npx prisma generate
```

## 6. Prisma Studio

Oletuskomento **ei toimi** SQLiten kanssa:

```bash
npx prisma studio --url file:./dev.db
# ! Prisma Studio is not supported for the "file:./dev.db" protocol.
```

Studion oma URL-jäsennin vaatii `://`-muotoisen protokollan, joten pelkkä yksi kaksoispiste (`file:`) tulkitaan virheellisesti koko merkkijonoksi "protokollaksi". Käytä sen sijaan **absoluuttista polkua** kolmella kauttaviivalla:

```bash
npx prisma studio --url "file://$(pwd)/dev.db"
```

> ⚠️ Älä käytä suhteellista muotoa `file:///./dev.db` — piste-kauttaviiva tulkitaan pois, jolloin Studio luo (tyhjän) tietokantatiedoston tiedostojärjestelmän juureen (`/dev.db`) ilman selkeää virhettä.
