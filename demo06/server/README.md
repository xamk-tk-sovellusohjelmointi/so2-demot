# Demo 6: Ostoslistan palvelinsovellus

Tässä ohjeessa rakennetaan ostoslistan palvelinsovellus vaihe vaiheelta. Palvelin tarjoaa REST API:n, jonka kautta ostoksia voidaan hakea, lisätä, muokata ja poistaa.

---

## Palvelinsovelluksen rakentaminen vaihe vaiheelta

Palvelinsovellus luodaan demokansion alle omaan alikansioonsa ja kaikki seuraavat toimenpiteet tehdään palvelinsovelluksen alikansiossa.

### Vaihe 1: Projektikansion luominen ja VS Code

Luodaan tietokoneelle johonkin sijaintiin kansio `demo06` ja sen alle alikansio `server`.

```
demo06/
└── server/
```

Avataan `demo06`-kansio VS Codessa. Avataan VS Coden terminaali ja siirrytään `server`-kansioon:

```bash
cd server
```

Kaikki komennot suoritetaan tässä kansiossa.

### Vaihe 2: Node-projektin alustaminen

Alustetaan Node.js-projekti:

```bash
npm init -y
```

Avataan `package.json` ja lisätään `type`-kenttä sekä `scripts`:

```json
{
  "name": "server",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "start": "tsx index.ts",
    "dev": "tsx watch index.ts"
  }
}
```

`"type": "module"` aktivoi ES-moduulisyntaksin (`import`/`export`). `tsx watch` käynnistää palvelimen ja seuraa tiedostomuutoksia. Palvelin käynnistyy uudelleen automaattisesti muutoksia tehtäessä.

### Vaihe 3: Kehityspalvelimen riippuvuuksien asentaminen

Asennetaan Express-sovelluskehys:

```bash
npm install express
```

Asennetaan lisäksi kehitysriippuvuudet:

```bash
npm install -D typescript tsx @types/node @types/express
```

|Paketti|Tarkoitus|
|---|---|
|`express`|HTTP-palvelinkehys|
|`typescript`|TypeScript-kääntäjä|
|`tsx`|TypeScript-suoritusympäristö|
|`@types/node`|Node.js:n tyypitykset|
|`@types/express`|Expressin tyypitykset|

### Vaihe 4: TypeScript-sovelluksen lisämääritykset

Alustetaan TypeScript-sovelluksen asetustiedosto:

```bash
npx tsc --init
```

Komento luo `tsconfig.json`-tiedoston oletusasetuksilla. Muokataan siitä seuraavat kohdat:

**1. Vaihdetaan `module`-asetus:**

```json
"module": "preserve",
```

Oletuksena arvo on `"nodenext"`. `"preserve"` säilyttää `import`-lauseet sellaisinaan, jolloin tsx käsittelee ne kehityspalvelimen suorituksen aikana.

**2. Lisätään Node.js:n tyypit `types`-kenttään:**

```json
"types": ["node"],
```

Oletuksena arvo on tyhjä taulukko `[]`. `"node"` lisää Node.js:n tyypitykset (`process`, `import.meta` jne.).

**3. Lisätään tsx:n tarvitsemat asetukset `compilerOptions`-lohkon loppuun:**

```json
"resolveJsonModule": true,
"allowJs": true,
"esModuleInterop": true
```

`esModuleInterop` mahdollistaa CommonJS-moduulien (kuten Express) importtaamisen `import`-syntaksilla. `resolveJsonModule` sallii JSON-tiedostojen importtaamisen. `allowJs` sallii JavaScript-tiedostojen käytön TypeScript-projektissa (periaatteessa tarpeetonta tässä projektissa, koska emme käytä JavaScriptiä).

Muokkausten jälkeen `tsconfig.json` tulisi näyttää suurin piirtein tältä:

```json
{
  "compilerOptions": {
    "module": "preserve",
    "target": "esnext",
    "types": ["node"],
    "sourceMap": true,
    "declaration": true,
    "declarationMap": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "strict": true,
    "jsx": "react-jsx",
    "verbatimModuleSyntax": true,
    "isolatedModules": true,
    "noUncheckedSideEffectImports": true,
    "moduleDetection": "force",
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "allowJs": true,
    "esModuleInterop": true
  }
}
```

### Vaihe 5: Virhekäsittelijän lisääminen palvelimeen

Tämä on saman asian kertaamista aiemmista demoista. Luodaan palvelimen juureen kansio `errors/` ja sen alle tiedosto `virhekasittelija.ts` seuraavilla koodeilla:

```typescript
import express from "express";

export class Virhe extends Error {
  status: number;
  viesti: string;
  constructor(status?: number, viesti?: string) {
    super();
    this.status = status || 500;
    this.viesti = viesti || "Palvelimella tapahtui odottamaton virhe";
  }
}

const virhekasittelija = (
  err: Virhe,
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  res.status(err.status).json({ virhe: err.viesti });
  next();
};

export default virhekasittelija;
```

`Virhe`-luokka laajentaa JavaScriptin `Error`-luokkaa kahdella lisäkentällä: `status` (HTTP-statuskoodi) ja `viesti` (virheilmoitus). Jos arvoja ei anneta, oletuskoodi on 500 ja viesti kertoo odottamattomasta palvelinvirheestä.

Virhekäsittelijä-middleware vastaanottaa reiteissä heitetyt `Virhe`-ilmentymät ja palauttaa ne JSON-muodossa asiakkaalle.

### Vaihe 6: Ostoslistan rajapinta (API)

Luodaan palvelimen reiteille REST API:n mukainen rakenne. Luodaan palvelimen juureen uusi kansio `routes/` ja sen alle ostoslistan käsittelyn reitit tiedostoon `apiOstokset.ts`. Luodaan rajapinta aluksi tyhjänä "luurankona", johon myöhemmin lisätään varsinaiset reitinkäsittelijät:

```typescript
import express from "express";

const apiOstoksetRouter: express.Router = express.Router();

apiOstoksetRouter.use(express.json());

apiOstoksetRouter.get(
  "/",
  async (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    res.json({ viesti: "Kaikki ostokset tulisivat tähän" });
  }
);

export default apiOstoksetRouter;
```

`express.json()` -middleware parsii pyynnön JSON-muotoisen bodyn `req.body`-objektiin. Se asetetaan reittikohtaisesti vain tälle routerille. Toistaiseksi ainoa reitti on GET `/`, joka palauttaa testiviestin.

### Vaihe 7: Palvelimen pääohjelma

Luodaan seuraavaksi palvelimen pääohjelma `index.ts`. Loimme virhekäsittelijän ja ostokset-reitityksen ennen tätä vaihetta, jotta tuonneissa ei tulisi virheitä. Oikeasti näiden tiedostojen luonnin järjestyksellä ei ole mitään väliä ja palvelimen pääohjelman voisi myös luoda ensiksi.:

```typescript
import express from "express";
import path from "path";
import apiOstoksetRouter from "./routes/apiOstokset";
import virhekasittelija from "./errors/virhekasittelija";

const app: express.Application = express();

const portti: number = Number(process.env.PORT) || 3006;

// Staattisten tiedostojen kansio
app.use(express.static(path.resolve(import.meta.dirname, "public")));

// Reitin määrittäminen ostokset-reitittäjälle
app.use("/api/ostokset", apiOstoksetRouter);

// Virhekäsittelijä-middlewaren tuonti palvelinohjelmaan
app.use(virhekasittelija);

// Oletusvirhekäsittelijä, jos käyttäjä hakee olematonta reittiä
app.use(
  (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    if (!res.headersSent) {
      res.status(404).json({ viesti: "Virheellinen reitti" });
    }
    next();
  }
);

// Palvelimen käynnistäminen
app.listen(portti, (): void => {
  console.log(`Palvelin käynnistyi osoitteeseen: http://localhost:${portti}`);
});
```

`import.meta.dirname` palauttaa nykyisen tiedoston kansion polun ESM-moduuleissa. `express.static()` tarjoaa `public/`-kansion tiedostot staattisina resursseina.

Luodaan palvelimelle myös staattisten tiedostojen kansio `public` ja sen alle `index.html`-tiedosto palvelimen selainnäkymän etusivuksi. Tämän voi kopioida suoraan demon lähdekoodeista.

Käynnistetään palvelin ja testataan, että se toimii:

```bash
npm run dev
```

Palvelin käynnistyy osoitteeseen `http://localhost:3006`. Testataan selaimella palvelimen etusivua ja osoitetta `http://localhost:3006/api/ostokset`. Vastauksen pitäisi olla `{"viesti":"Kaikki ostokset tulisivat tähän"}`. Testit voi tehdä joko selaimella tai Postman-sovelluksella.

Kun palvelin toimii tässä vaiheessa, voidaan siirtyä ostosten tietokannan käyttöönottoon ja varsinaisten reittien luomiseen ostokset-reitittäjään.
### Vaihe 8: Tietokannan Prisma-riippuvuuksien asentaminen

Tietokantana käytetään SQLite-tietokantaa Prisma ORM:n kautta. Prisma hoitaa tietokantakyselyt ja tarjoaa tyypitetyn rajapinnan tietokantaoperaatioille.

Ohjeet perustuvat Prisman [viralliseen dokumentaatioon](https://www.prisma.io/docs/prisma-orm/quickstart/sqlite "https://www.prisma.io/docs/prisma-orm/quickstart/sqlite"). Voit seurata ohjeita sieltä tai tästä.

Asennetaan Prisma kehitysriippuvuutena:

```bash
npm install -D prisma @types/better-sqlite3
```

Asennetaan Prismaan liittyvät suorituksen aikaiset riippuvuudet:

```bash
npm install @prisma/client @prisma/adapter-better-sqlite3 dotenv
```

|Paketti|Tarkoitus|
|---|---|
|`prisma`|Prisma CLI (migraatiot, generointi)|
|`@types/better-sqlite3`|SQLite-ajurin tyypitykset|
|`@prisma/client`|Prisma Client -kirjasto|
|`@prisma/adapter-better-sqlite3`|SQLite-ajuriadapteri|
|`dotenv`|Ympäristömuuttujien lataaminen `.env`-tiedostosta|

### Vaihe 9: TypeScript-konfiguraation päivitys Prismaa varten

Noudatetaan virallisia ohjeita ja tehdään seuraavat muutokset `tsconfig.json`-tioedostoon:

```json
{
  "compilerOptions": {
    "module": "ESNext",
    "moduleResolution": "bundler",
    "target": "ES2023",
    "strict": true,
    "esModuleInterop": true,
  }
}
```

### Vaihe 10: Prisma-projektin alustaminen

Alustetaan Prisma:

```bash
npx prisma init --datasource-provider sqlite --output ../generated/prisma
```

Komento luo kolme tiedostoa:

- `prisma/schema.prisma` (tietomalli)
- `prisma.config.ts` (Prisman konfiguraatio)
- `.env` (ympäristömuuttujat)

**`.env`-tiedosto** sisältää tietokantaosoitteen:

```
DATABASE_URL="file:./prisma/data.db"
```

>[!warning]
>`.env`-tiedosto sisältyy yleensä `.gitignore`-tiedostoon eikä päädy versionhallintaan. Kun projekti kloonataan GitHubista, `.env`-tiedosto pitää luoda itse. Tietokantaosoite on kuitenkin sama kaikille, joten riittää, että luo uuden `.env`-tiedoston yllä olevalla sisällöllä.

**`prisma.config.ts`** generoitiin automaattisesti eikä sitä tarvitse muokata:

```typescript
import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env["DATABASE_URL"],
  },
});
```

`import "dotenv/config"` lataa `.env`-tiedoston ympäristömuuttujat ennen kuin `process.env["DATABASE_URL"]` luetaan.

### Vaihe 11: Tietokannan Ostos-tietomallin luominen

Avataan ja muokataan `prisma/schema.prisma`:

```prisma
generator client {
  provider = "prisma-client"
  output   = "../generated/prisma"
}

datasource db {
  provider = "sqlite"
}

model Ostos {
  id       Int     @id @default(autoincrement())
  tuote    String
  poimittu Boolean @default(false)
}
```

**Ostos**-malli kuvaa yksittäisen ostoksen ostoslistalla:

|Kenttä|Tyyppi|Selitys|
|---|---|---|
|`id`|`Int`|Automaattisesti kasvava pääavain|
|`tuote`|`String`|Ostoksen nimi|
|`poimittu`|`Boolean`|Onko ostos poimittu (oletuksena `false`)|

Suoritetaan migraatio ja generoidaan Prisma Client:

```bash
npx prisma migrate dev --name init
```

Komento luo migraation `prisma/migrations/`-kansioon, luo SQLite-tietokantatiedoston ja generoi Prisma Clientin `generated/prisma/`-kansioon.

### Vaihe 12: Prisma Client -moduuli

Seuraavaksi luodaan tiedosto, jolla Prisma-tietokanta otetaan käyttöön ja voidaan tuoda osaksi palvelinsovellusta. Luodaan palvelimen juureen kansio `lib/` ja sen alle tiedosto `prisma.ts`.

```typescript
import "dotenv/config";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../generated/prisma/client.js";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL || "file:./prisma/data.db",
});

const prisma = new PrismaClient({ adapter });

export default prisma;
```

| Rivi                            | Selitys                                                     |
| ------------------------------- | ----------------------------------------------------------- |
| `import "dotenv/config"`        | Lataa `.env`-tiedoston ympäristömuuttujat                   |
| `PrismaBetterSqlite3`           | SQLite-ajuriadapteri, joka hoitaa tietokantayhteyden        |
| `PrismaClient`                  | Tuodaan generoidusta kansiosta (`generated/prisma/`)        |
| `new PrismaClient({ adapter })` | PrismaClient alustetaan antamalla sille määritetty adapteri |
>[!tip]
>Huomaa, että adapterissa tietokannan osoite (url) on annettu joko ympäristömuuttujien tiedostosta (`.env`) viittaamalla `DATABASE_URL` -avaimeen tai kovakoodattuna `"file:./prisma/data.db"`. Tämä on varmistuksena sille, jos ympäristömuuttujien tiedostoa ei ole, niin tietokanta saa silti oikean osoitteen.


### Vaihe 13: Ostosten API-reittien toteutus

Muokataan `routes/apiOstokset.ts` korvaamalla luuranko täydellisillä CRUD-reiteillä. Lisätään tiedoston alkuun tuonteihin Prisma-tietokanta:

```typescript
import express from "express";
import { Virhe } from "../errors/virhekasittelija";
import prisma from "../lib/prisma";

const apiOstoksetRouter: express.Router = express.Router();

apiOstoksetRouter.use(express.json());
```

Yllä olevien rivien alle lähdetään lisäämään jokainen reitinkäsittelijä yksi kerrallaan.

---

**GET / — Kaikki ostokset**

```typescript
apiOstoksetRouter.get(
  "/",
  async (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    try {
      res.json(await prisma.ostos.findMany());
    } catch (e: any) {
      next(new Virhe());
    }
  }
);
```

`findMany()` palauttaa kaikki tietokannan ostokset taulukkona.

---

**POST / — Uusi ostos**

```typescript
apiOstoksetRouter.post(
  "/",
  async (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    if (req.body.tuote?.length > 0) {
      try {
        await prisma.ostos.create({
          data: {
            tuote: req.body.tuote,
            poimittu: Boolean(req.body.poimittu),
          },
        });

        res.json(await prisma.ostos.findMany());
      } catch (e: any) {
        next(new Virhe());
      }
    } else {
      next(new Virhe(400, "Virheellinen pyynnön body"));
    }
  }
);
```

Ensin validoidaan, että `tuote`-kenttä on annettu ja ei ole tyhjä. `?.`-operaattori (optional chaining) estää virheen, jos `tuote`-kenttää ei ole pyynnön bodyssa lainkaan. `create()` luo uuden ostoksen tietokantaan. Onnistuneen lisäyksen jälkeen palautetaan koko ostoslista.

---

**DELETE /:id — Ostoksen poisto**

```typescript
apiOstoksetRouter.delete(
  "/:id",
  async (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    if (
      (await prisma.ostos.count({
        where: { id: Number(req.params.id) },
      })) === 1
    ) {
      try {
        await prisma.ostos.delete({
          where: { id: Number(req.params.id) },
        });

        res.json(await prisma.ostos.findMany());
      } catch (e: any) {
        next(new Virhe());
      }
    } else {
      next(new Virhe(400, "Virheellinen id"));
    }
  }
);

export default apiOstoksetRouter;
```

Tarkistetaan ensin, että ostos löytyy. `delete()` poistaa sen tietokannasta. Poiston jälkeen palautetaan jäljelle jääneet ostokset.

>[!warning]
>Huomioi, että apiOstoksetRouter viedään `export default` -komennolla tiedoston lopussa.

---

Palvelin toimii nyt Postmanilla ja selaimella. Voit testata reittejä Postmanilla tai selaimella osoitteessa `http://localhost:3006/api/ostokset`.

### [Vaihe 14: CORS-tuki asiakassovellusta varten](#vaihe-14-cors-tuki-asiakassovellusta-varten)

Tässä vaiheessa palvelin toimii normaalisti selaimella ja Postmanilla. Erillinen asiakassovellus eri portissa (esim. `http://localhost:3000`) ei kuitenkaan pysty hakemaan dataa palvelimelta. Selain estää pyynnön ja konsoliin tulee [CORS-virhe](../client/README.md/#vaihe-6-ensimmäinen-api-kutsu-ja-cors-virhe).

**CORS** (Cross-Origin Resource Sharing) on selaimen suojausmekanismi. Se rajoittaa selaimen tekemiä pyyntöjä eri **alkuperään** (origin). Alkuperä koostuu protokollasta, domain-nimestä ja portista. `http://localhost:3000` ja `http://localhost:3006` ovat eri alkuperiä, koska portti eroaa. Selain estää tällaiset pyynnöt oletuksena.

> **Huomio:** CORS koskee vain selaimessa tehtyjä pyyntöjä. Postmanilla tai curl-komennolla pyynnöt toimivat ilman CORS-otsikoita.

Palvelin voi sallia pyynnöt tietyistä alkuperistä lisäämällä vastauksiinsa `Access-Control-Allow-Origin` -otsikon. `cors`-paketti tekee tämän automaattisesti.

Asennetaan `cors`-paketti ja sen tyypitykset:

```bash
npm install cors
npm install -D @types/cors
```

Muokataan `index.ts` lisäämällä `cors`-importti ja middleware:

```typescript
import express from "express";
import path from "path";
import cors from "cors";
import apiOstoksetRouter from "./routes/apiOstokset";
import virhekasittelija from "./errors/virhekasittelija";

const app: express.Application = express();

const portti: number = Number(process.env.PORT) || 3006;

app.use(cors({ origin: "http://localhost:3000" }));

app.use(
  (
    _req: express.Request,
    _res: express.Response,
    next: express.NextFunction
  ) => {
    setTimeout(() => next(), 1000);
  }
);

app.use(express.static(path.resolve(import.meta.dirname, "public")));

app.use("/api/ostokset", apiOstoksetRouter);

app.use(virhekasittelija);

app.use(
  (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    if (!res.headersSent) {
      res.status(404).json({ viesti: "Virheellinen reitti" });
    }
    next();
  }
);

app.listen(portti, (): void => {
  console.log(`Palvelin käynnistyi osoitteeseen: http://localhost:${portti}`);
});
```

`cors({ origin: "http://localhost:3000" })` sallii pyynnöt vain asiakassovelluksen kehityspalvelimen osoitteesta. CORS-middleware asetetaan ennen muita middlewareja ja reittejä.

`setTimeout()` -middleware lisää kaikkiin pyyntöihin yhden sekunnin viiveen. Tämä simuloi hitaampaa verkkoa ja auttaa havainnollistamaan asiakassovelluksen lataustilan toimintaa. Tuotantoympäristössä tällaista ei käytettäisi.

CORS-tuen lisäämisen jälkeen asiakassovelluksen pitäisi saada vastauksia palvelimelta.

### Palvelinsovelluksen lopullinen rakenne

Kun palvelinsovellus on valmis, sen rakenne on suurin piirtein tämän näköinen.

```
demo06/
└── server/
    ├── errors/
    │   └── virhekasittelija.ts          # Virhekäsittelijä-middleware
    ├── generated/
    │   └── prisma/                      # Prisma Clientin generoima koodi
    │       └── client.js
    ├── lib/
    │   └── prisma.ts                    # PrismaClient-instanssi adapterilla
    ├── prisma/
    │   ├── schema.prisma                # Tietomalli
    │   ├── data.db                      # SQLite-tietokantatiedosto
    │   └── migrations/                  # Migraatiot
    ├── public/                          # Staattisten tiedostojen kansio
    ├── routes/
    │   └── apiOstokset.ts               # API-reitit (CRUD)
    ├── .env                             # Ympäristömuuttujat (DATABASE_URL)
    ├── index.ts                         # Palvelimen pääohjelma
    ├── prisma.config.ts                 # Prisma CLI -konfiguraatio
    ├── tsconfig.json                    # TypeScript-asetukset
    └── package.json                     # Riippuvuudet ja skriptit
```

---

## Muistilista

### Prisma Client -metodit

|Metodi|Toiminto|
|---|---|
|`findMany()`|Hakee kaikki tietueet|
|`findUnique({ where })`|Hakee yhden tietueen|
|`create({ data })`|Luo uuden tietueen|
|`update({ where, data })`|Päivittää olemassa olevan tietueen|
|`delete({ where })`|Poistaa tietueen|
|`count({ where })`|Laskee tietueiden määrän|

### CORS-asetukset

|Asetus|Esimerkki|Selitys|
|---|---|---|
|Salli yksi alkuperä|`cors({ origin: "http://localhost:3000" })`|Vain yksi osoite sallittu|
|Salli useita|`cors({ origin: ["http://localhost:3000", "http://localhost:5173"] })`|Taulukko sallituista|
|Salli kaikki|`cors()`|Kaikki alkuperät sallittu (ei suositella)|

### HTTP-statuskoodit

|Koodi|Merkitys|
|---|---|
|`200`|OK|
|`400`|Virheellinen pyyntö|
|`404`|Reittiä ei löydy|
|`500`|Palvelinvirhe|

---

## Sovelluksen käynnistys

Jos haluat vain testata kloonattua valmista palvelinsovellusta, tee seuraavat toimenpiteet.

**1. Siirry `server`-kansioon ja asenna riippuvuudet:**

```bash
cd server
npm install
```

**2. Luo `.env`-tiedosto `server`-kansion juureen (jos puuttuu):**

```
DATABASE_URL="file:./prisma/data.db"
```

**3. Suorita migraatio ja generoi Prisma Client:**

```bash
npx prisma migrate dev --name init
```

**4. Käynnistä palvelin:**

```bash
npm run dev
```

Palvelin käynnistyy osoitteeseen `http://localhost:3006`.
