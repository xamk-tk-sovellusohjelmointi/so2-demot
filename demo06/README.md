# Demo 6: Asiakassovelluksen toteutus

## Oppimistavoitteet

Tämän demon jälkeen opiskelija osaa:
- luoda React-asiakassovelluksen Vite-kehitystyökalulla palvelinsovelluksen yhteyteen
- selittää, mikä CORS on ja miksi se tarvitaan
- käyttää fetch-rajapintaa HTTP-pyyntöjen tekemiseen palvelimelle
- käyttää MUI-komponenttikirjastoa palvelinsovelluksen REST API:a hyödyntävän käyttöliittymän rakentamiseen

---

## 1. Asiakassovelluksen ja palvelimen välinen kommunikaatio

### Mitä asiakassovelluksella tarkoitetaan?

Aiemmat demot sopivat palvelinsovelluksen testaamiseen suoraan Postmanilla tai selaimella. Oikea verkkosovellus koostuu tyypillisesti **palvelinsovelluksesta** (backend) ja **asiakassovelluksesta** (frontend). Palvelin tarjoaa verkkosovelluksen taustajärjestelmistä saatavaa dataa rajapinnan (REST API) kautta, ja asiakassovellus esittää datan käyttäjälle selaimessa graafisessa käyttöliittymässä. Sovellusohjelmointi 1 -opintojaksolla opiskeltiin React-asiakassovellusten rakentamista erilaisin käyttöliittymäelementein ja tässä vaiheessa Sovellusohjelmointi 2 -opintojakson toteutusta on palautettava mieleen React-ohjelmoinnin perusteita.

Tässä demossa asiakassovellus on ns. **SPA** (eli "Single Page Application"), joka suoritetaan käyttäjän selaimessa. Asiakassovellus hakee tietoja palvelimelta HTTP-pyynnöillä ja päivittää näkymäänsä saamiensa tietojen pohjalta. React-sovelluksissa varsinaista selaimelle tulostettavaa sivua ei vaihdeta näkymien välillä, vaan selaimeen tulostetaan staattinen HTML-sivu, jonka sisällä olevaa "root"-elementtiä käytetään kehyksenä Reactin luomien dynaamisten komponenttinäkymien näyttämiseen. React-sovellusten näkymien tilaa ohjataan JavaScriptilla tai opintojaksojen tapauksessa siihen pohjautuvalla TypeScriptilla.

### Miten asiakassovellus tekee pyyntöjä palvelimelle?

Selaimen `fetch`-funktio on JavaScriptin sisäänrakennettu tapa tehdä HTTP-pyyntöjä palvelimelle. `fetch` palauttaa lupauksen tiedoista `Promise`-objektina, jota pitää käsitellä asynkroonisesti `async`/`await` -komennoilla.

```typescript
// Asiakassovellukseen ohjelmoitava GET-pyyntö
const vastaus = await fetch("http://localhost:3006/api/ostokset");    // Muuttuja 'vastaus' on palvelimen REST API reitinkäsittelijän palauttama data asiakkaalle.
const data = await vastaus.json();                                    // Vastauksen sisältämä tieto pitää muuntaa JSON-muotoon ohjelmallista käsittelyä varten.

// Asiakassovellukseen ohjelmoitava POST-pyyntö
const vastaus = await fetch("http://localhost:3006/api/ostokset", {   // POST-pyyntöä varten fetch-kutsun toiseksi parametriksi on annettava pyynnössä lähetettävät tiedot eli pyynnön asetukset.
  method: "POST",                                                     // 'method' määrittää pyynnössä käytetyn HTTP-metodin. Tässä tehdään POST-pyyntö.
  headers: { "Content-Type": "application/json" },                    // Otsikkotietoihin liitetään tietoa pyynnössä tulevan tiedon tyypistä. Välitettäessä JSON-dataa sovellusten välillä 'Content-Type' on 'application/json'. Tämä on yleisin tiedon sisältömuoto, jolla asiakas ja palvelin keskustelevat.
  body: JSON.stringify({ tuote: "Maitoa", poimittu: false })          // Pyynnön a
});
```



`fetch` ottaa kaksi parametria: URL-osoitteen ja valinnaisen asetukset-objektin. GET-pyynnössä asetuksia ei tarvita. POST-, PUT- ja DELETE-pyynnöissä asetetaan `method`, tarvittaessa `headers` ja `body`.

### CORS

**CORS** (Cross-Origin Resource Sharing) on selaimen suojamekanismi, joka estää verkkosivua tekemästä pyyntöjä eri alkuperään (origin) kuin mistä sivu ladattiin. Alkuperä muodostuu protokollasta, domainista ja portista.

Tässä demossa palvelin toimii osoitteessa `http://localhost:3006` ja asiakassovelluksen Vite-kehityspalvelin osoitteessa `http://localhost:3000`. Portit eroavat, joten selain tulkitsee pyynnöt eri alkuperien välisiksi ja estää ne oletuksena.

Palvelimella CORS-ongelma ratkaistaan `cors`-kirjastolla, joka lisää vastauksiin tarvittavat HTTP-otsikot. Näin palvelin kertoo selaimelle, mistä alkuperistä pyynnöt sallitaan.

| Termi | Selitys |
|---|---|
| Origin | Protokolla + domain + portti, esim. `http://localhost:3000` |
| Same-origin | Pyyntö samaan alkuperään kuin sivu ladattiin |
| Cross-origin | Pyyntö eri alkuperään kuin sivu ladattiin |
| CORS-otsikot | Palvelimen vastauksen HTTP-otsikot, jotka kertovat sallitut alkuperät |

### Vite-kehitystyökalu

**Vite** on moderni kehitystyökalu, joka tarjoaa nopean kehityspalvelimen ja tuotantobuildin React-sovelluksille. Vite käynnistää oman kehityspalvelimen (oletuksena portti 5173), joka tarjoilee asiakassovelluksen selaimeen. Demossa kehityspalvelimen portti asetetaan arvoon `3000`.

Kehityksen aikana ajetaan kahta palvelinta samanaikaisesti:
1. Express-palvelin (portti 3006) tarjoaa REST API:n
2. Vite-kehityspalvelin (portti 3000) tarjoilee React-asiakassovelluksen

### MUI-komponenttikirjasto

**MUI** (Material UI) on React-komponenttikirjasto, joka tarjoaa valmiita käyttöliittymäkomponentteja Googlen Material Design -tyylillä. MUI:n avulla voidaan rakentaa siisti käyttöliittymä nopeasti ilman manuaalista CSS-tyylittelyä.

### Demosovellus

Tässä demossa rakennetaan asiakassovellus aiemmissa demoissa kehitetylle ostoslista-palvelimelle. Palvelimen REST API:a hyödynnetään asiakassovelluksesta `fetch`-pyynnöillä. Asiakassovellus toteutetaan React-sovelluksena Vite 8 -kehitystyökalulla ja MUI-komponenttikirjastolla.

Palvelimeen tehdään seuraavat muutokset: Prisma päivitetään versioon 7 ja CORS otetaan käyttöön. API-reitit ja virheenkäsittely pysyvät pääosin ennallaan.

Asiakassovelluksessa käytettävät REST API -reitit:

| Metodi | Reitti | Kuvaus |
|---|---|---|
| GET | `/api/ostokset` | Hakee kaikki ostokset |
| POST | `/api/ostokset` | Lisää uuden ostoksen |
| DELETE | `/api/ostokset/:id` | Poistaa ostoksen id:n perusteella |

---

## 2. Demosovelluksen rakentuminen vaihe vaiheelta

### Vaihe 1: Palvelimen alustaminen ja Prisma 7

Aiemmissa demoissa Prisma oli käytössä vanhemmalla versiolla. Prisma 7 tuo mukanaan merkittäviä muutoksia: Rust-pohjainen moottori on vaihdettu TypeScript-toteutukseen, generoitu client tuotetaan projektin lähdekoodiin, ja tietokantayhteys vaatii erillisen ajuriadapterin.

> **Huomio:** Prisma 7:n muutokset eivät vaikuta itse tietokantakyselyihin. Tutut metodit kuten `findMany()`, `create()`, `update()` ja `delete()` toimivat ennallaan. Muutokset koskevat asetuksia ja alustusta.

Aloitetaan tyhjästä projektikansiosta `demo06`. Alustetaan Node-projekti ja asennetaan riippuvuudet.

```bash
mkdir demo06
cd demo06
npm init -y
```

**Asennetaan kehitysriippuvuudet:**

```bash
npm install typescript tsx @types/node @types/express @types/cors @types/better-sqlite3 nodemon prisma --save-dev
```

| Paketti | Tarkoitus |
|---|---|
| `typescript` | TypeScript-kääntäjä |
| `tsx` | TypeScript-suoritusympäristö (korvaa ts-noden) |
| `@types/node` | Noden tyypitykset |
| `@types/express` | Expressin tyypitykset |
| `@types/cors` | CORS-kirjaston tyypitykset |
| `@types/better-sqlite3` | SQLite-ajurin tyypitykset |
| `nodemon` | Automaattinen uudelleenkäynnistys tiedostomuutoksissa |
| `prisma` | Prisma CLI (migraatiot, generointi) |

**Asennetaan tuotantoriippuvuudet:**

```bash
npm install express cors @prisma/client @prisma/adapter-better-sqlite3 dotenv
```

| Paketti | Tarkoitus |
|---|---|
| `express` | HTTP-palvelinkehys |
| `cors` | CORS-otsikkoja lisäävä middleware |
| `@prisma/client` | Prisma Client -kirjasto |
| `@prisma/adapter-better-sqlite3` | SQLite-ajuriadapteri Prisma 7:lle |
| `dotenv` | Ympäristömuuttujien lataaminen `.env`-tiedostosta |

> **Huomio:** Prisma 7:ssä `@prisma/adapter-better-sqlite3` on pakollinen. Aiemmin PrismaClient käytti sisäänrakennettua Rust-moottoria tietokantayhteyteen. Prisma 7:ssä yhteys hoidetaan JavaScript-pohjaisella ajuriadapterilla.

**Luodaan `tsconfig.json`:**

```json
{
  "compilerOptions": {
    "module": "ESNext",
    "moduleResolution": "bundler",
    "target": "ES2023",
    "strict": true,
    "esModuleInterop": true,
    "outDir": "./dist",
    "ignoreDeprecations": "6.0"
  }
}
```

**Muokataan `package.json`** lisäämällä `scripts`-osio:

```json
{
  "name": "demo06",
  "version": "1.0.0",
  "main": "index.ts",
  "scripts": {
    "dev": "npx nodemon --exec tsx index.ts"
  },
  "devDependencies": {
    "@types/better-sqlite3": "^7.6.14",
    "@types/cors": "^2.8.17",
    "@types/express": "^5.0.0",
    "@types/node": "^22.13.10",
    "nodemon": "^3.1.9",
    "prisma": "^7.0.0",
    "tsx": "^4.21.0",
    "typescript": "^5.8.2"
  },
  "dependencies": {
    "@prisma/adapter-better-sqlite3": "^7.0.0",
    "@prisma/client": "^7.0.0",
    "cors": "^2.8.5",
    "dotenv": "^17.0.0",
    "express": "^4.21.2"
  }
}
```

`tsx` korvaa aiempien demojen `ts-node`-paketin. `tsx` on nopeampi ja yhteensopivampi uudempien pakettien kanssa.

---

**Alustetaan Prisma:**

```bash
npx prisma init --datasource-provider sqlite --output ../generated/prisma
```

Komento luo kolme tiedostoa:
- `prisma/schema.prisma` (tietokantamallin määritys)
- `prisma.config.ts` (Prisma CLI:n asetukset)
- `.env` (ympäristömuuttujat)

**`prisma.config.ts`** on Prisma 7:n uusi asetustiedosto. Se kertoo Prisma CLI:lle, mistä schema löytyy ja mikä tietokannan osoite on:

```typescript
import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
```

| Asetus | Selitys |
|---|---|
| `schema` | Prisma schema -tiedoston sijainti |
| `migrations.path` | Migraatiotiedostojen kansio |
| `datasource.url` | Tietokannan osoite ympäristömuuttujasta |

**Muokataan `.env`-tiedostoa:**

```
DATABASE_URL="file:./prisma/data.db"
```

**Muokataan `prisma/schema.prisma`:**

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

Prisma 7:n schema eroaa aiemmista versioista seuraavilla tavoilla:

| Muutos | Vanha (Prisma 5/6) | Uusi (Prisma 7) |
|---|---|---|
| Generator | `provider = "prisma-client-js"` | `provider = "prisma-client"` |
| Output | Ei määritelty (node_modules) | `output = "../generated/prisma"` |
| URL schemassa | `url = "file:./data.db"` | Poistettu schemasta, siirretty `prisma.config.ts`:ään |

`output`-asetus kertoo, minne generoitu Prisma Client tallennetaan. Prisma 7 generoi clientin projektin lähdekoodiin `node_modules`-kansion sijasta.

**Suoritetaan migraatio ja generointi:**

```bash
npx prisma migrate dev --name init
npx prisma generate
```

Migraatio luo tietokantataulun `Ostos` schema-mallin perusteella. `prisma generate` generoi tyypitetyn PrismaClient-koodin `generated/prisma/`-kansioon.

---

**Luodaan `lib/prisma.ts`:**

Prisma 7:ssä PrismaClient tarvitsee ajuriadapterin konstruktorissa. Luodaan erillinen tiedosto, josta PrismaClient tuodaan muualle sovellukseen.

```typescript
import "dotenv/config";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../generated/prisma/client";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL || "file:./prisma/data.db",
});

const prisma = new PrismaClient({ adapter });

export { prisma };
```

| Rivi | Selitys |
|---|---|
| `import "dotenv/config"` | Lataa `.env`-tiedoston ympäristömuuttujat |
| `PrismaBetterSqlite3` | SQLite-ajuriadapteri, joka hoitaa tietokantayhteyden |
| `PrismaClient` | Tuodaan generoidusta kansiosta, ei `@prisma/client`-paketista |
| `new PrismaClient({ adapter })` | PrismaClient alustetaan antamalla sille adapterin ilmentymä |

---

**Luodaan `errors/virhekasittelija.ts`:**

Virhekäsittelijä on sama kuin demo 5:ssä.

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

---

**Luodaan `routes/apiOstokset.ts`:**

API-reitit pysyvät lähes ennallaan demo 5:stä. PrismaClient tuodaan nyt `lib/prisma.ts`-tiedostosta.

```typescript
import express from "express";
import { Virhe } from "../errors/virhekasittelija";
import { prisma } from "../lib/prisma";

const apiOstoksetRouter: express.Router = express.Router();

apiOstoksetRouter.use(express.json());

// GET / — Hae kaikki ostokset
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

// GET /:id — Hae yksittäinen ostos
apiOstoksetRouter.get(
  "/:id",
  async (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    try {
      const ostos = await prisma.ostos.findUnique({
        where: { id: Number(req.params.id) },
      });

      if (ostos) {
        res.json(ostos);
      } else {
        next(new Virhe(400, "Virheellinen id"));
      }
    } catch (e: any) {
      next(new Virhe());
    }
  }
);

// POST / — Lisää uusi ostos
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

// PUT /:id — Muokkaa ostosta
apiOstoksetRouter.put(
  "/:id",
  async (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    const ostos = await prisma.ostos.findUnique({
      where: { id: Number(req.params.id) },
    });

    if (!ostos) {
      return next(new Virhe(400, "Virheellinen id"));
    }

    if (
      req.body.tuote?.length > 0 &&
      (req.body.poimittu === true || req.body.poimittu === false)
    ) {
      try {
        await prisma.ostos.update({
          where: { id: Number(req.params.id) },
          data: {
            tuote: req.body.tuote,
            poimittu: req.body.poimittu,
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

// DELETE /:id — Poista ostos
apiOstoksetRouter.delete(
  "/:id",
  async (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    const ostos = await prisma.ostos.findUnique({
      where: { id: Number(req.params.id) },
    });

    if (!ostos) {
      return next(new Virhe(400, "Virheellinen id"));
    }

    try {
      await prisma.ostos.delete({
        where: { id: Number(req.params.id) },
      });

      res.json(await prisma.ostos.findMany());
    } catch (e: any) {
      next(new Virhe());
    }
  }
);

export default apiOstoksetRouter;
```

> **Huomio:** Aiemmista demoista poiketen olemassaolon tarkistus tehdään `findUnique()`-metodilla `count()`-metodin sijasta. `findUnique()` palauttaa `null`, jos tietuetta ei löydy, jolloin tarkistus on luettavampi: `if (!ostos)`.

---

**Luodaan `index.ts`:**

Palvelimen juuritiedosto sisältää Expressin alustuksen. CORS-asetusta **ei** lisätä vielä tässä vaiheessa. Se lisätään myöhemmin, kun CORS-virhe havaitaan asiakassovelluksesta.

```typescript
import express from "express";
import path from "path";
import apiOstoksetRouter from "./routes/apiOstokset";
import virhekasittelija from "./errors/virhekasittelija";

const app: express.Application = express();

const portti: number = Number(process.env.PORT) || 3006;

// Simuloidaan verkkoviivettä 1 sekunnin viiveellä.
// Tämä havainnollistaa latausindikaattorin toimintaa asiakassovelluksessa.
app.use(
  (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    setTimeout(() => next(), 1000);
  }
);

app.use(express.static(path.resolve(__dirname, "public")));

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

app.listen(portti, () => {
  console.log(`Palvelin käynnistyi osoitteeseen: http://localhost:${portti}`);
});
```

Käynnistetään palvelin ja testataan Postmanilla, että API toimii:

```bash
npm run dev
```

Testataan `GET http://localhost:3006/api/ostokset`. Vastauksen pitäisi olla tyhjä taulukko `[]`, koska tietokanta on uusi.

---

### Vaihe 2: Asiakassovelluksen luominen Vitellä

Asiakassovellus luodaan palvelimen juurikansioon `client`-alikansion alle Vite-kehitystyökalulla.

> **Huomio:** Erillinen Vite-projektin alustusohje löytyy tiedostosta `client/VITE_ALUSTUS.md`. Siinä käydään läpi Vite 8:n asennus ja oletusten siivous yksityiskohtaisemmin.

Suoritetaan palvelimen juurikansiossa:

```bash
npm create vite@latest client -- --template react-swc-ts
```

Komento luo `client`-kansion, johon Vite generoi React + TypeScript + SWC -pohjan. Siirrytään kansioon ja asennetaan riippuvuudet:

```bash
cd client
npm install
```

**Siistitään Viten oletuspohja.** Poistetaan tarpeettomat tiedostot:

```bash
rm src/App.css src/index.css src/assets/react.svg public/vite.svg
```

**Muokataan `src/main.tsx`** poistamalla CSS-tuonti:

```typescript
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
```

**Muokataan `src/App.tsx`** yksinkertaiseen testinäkymään:

```typescript
const App = () => {
  return <h1>Ostoslista</h1>;
};

export default App;
```

> **Huomio:** React-komponentteja ei tarvitse tyypittää `React.FC`-tyypillä. Nykyisten käytäntöjen mukaan komponenttifunktioille ei lisätä erillistä tyyppiä, koska TypeScript päättelee palautusarvon automaattisesti. Tyypitys kohdistetaan yksittäisiin osiin, kuten tilamuuttujiin (`useState<Tyyppi>`) ja propseihin (`interface Props { ... }`).

**Muokataan `vite.config.ts`:**

```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
  },
});
```

Portti asetetaan arvoon `3000`, jotta se ei mene päällekkäin Express-palvelimen portin `3006` kanssa.

**Käynnistetään Vite-kehityspalvelin** uudessa VS Coden terminaalissa:

```bash
cd client
npm run dev
```

Selaimessa osoitteessa `http://localhost:3000` pitäisi näkyä teksti "Ostoslista".

---

### Vaihe 3: Ensimmäinen API-kutsu ja CORS-virhe

Tehdään ensimmäinen API-kutsu asiakassovelluksesta palvelimelle. Muokataan `src/App.tsx`:

```typescript
import { useEffect, useState } from "react";

const App = () => {
  const [data, setData] = useState<string>("Ladataan...");

  useEffect(() => {
    fetch("http://localhost:3006/api/ostokset")
      .then((res) => res.json())
      .then((json) => setData(JSON.stringify(json)))
      .catch((err) => setData("Virhe: " + err.message));
  }, []);

  return <h1>{data}</h1>;
};

export default App;
```

Selaimessa näkyy nyt virheilmoitus. Avataan selaimen kehittäjätyökalut (F12) ja tarkistetaan Console-välilehti. Siellä on CORS-virhe:

```
Access to fetch at 'http://localhost:3006/api/ostokset' from origin 'http://localhost:3000' 
has been blocked by CORS policy
```

Virhe johtuu siitä, että asiakassovellus (portti 3000) yrittää hakea dataa eri alkuperästä (portti 3006). Selain estää tämän oletuksena.

**Korjataan CORS palvelimella.** Muokataan `index.ts` lisäämällä `cors`-middleware:

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
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    setTimeout(() => next(), 1000);
  }
);

app.use(express.static(path.resolve(__dirname, "public")));

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

app.listen(portti, () => {
  console.log(`Palvelin käynnistyi osoitteeseen: http://localhost:${portti}`);
});
```

`cors({ origin: "http://localhost:3000" })` sallii pyynnöt vain Vite-kehityspalvelimen osoitteesta. Palvelin lisää vastauksiin `Access-Control-Allow-Origin`-otsikon, jonka perusteella selain päästää vastauksen läpi.

CORS-middleware asetetaan ennen muita middlewareja, jotta se koskee kaikkia reittejä.

Palvelimen uudelleenkäynnistyksen jälkeen selaimessa pitäisi nyt näkyä `[]` (tyhjä taulukko tietokannasta).

---

### Vaihe 4: MUI-komponenttikirjaston asennus

Asennetaan MUI ja sen vaatimat fontit `client`-kansiossa:

```bash
cd client
npm install @mui/material @emotion/react @emotion/styled @mui/icons-material @fontsource/roboto
```

| Paketti | Tarkoitus |
|---|---|
| `@mui/material` | MUI:n pääkomponentit |
| `@emotion/react` | MUI:n tyylityskirjasto |
| `@emotion/styled` | MUI:n tyylityskirjasto |
| `@mui/icons-material` | MUI:n ikonikirjasto |
| `@fontsource/roboto` | Material Designin Roboto-fontti |

Tuodaan Roboto-fontti `src/main.tsx`-tiedostossa:

```typescript
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "@fontsource/roboto/300.css";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
```

---

### Vaihe 5: App.tsx:n toteutus

Rakennetaan varsinainen ostoslistanäkymä. Toteutetaan `src/App.tsx` kokonaan uudelleen.

**Määritellään tietotyypit:**

```typescript
interface Ostos {
  id: number;
  tuote: string;
  poimittu: boolean;
}

interface ApiData {
  ostokset: Ostos[];
  virhe: string;
  haettu: boolean;
}
```

`Ostos` vastaa palvelimen tietokantamallia. `ApiData` kokoaa kaikki API-kutsun tilaan liittyvät arvot yhteen: listan ostokset, mahdollisen virheen ja tiedon siitä, onko haku suoritettu.

---

**Toteutetaan komponentti kokonaisuudessaan:**

```typescript
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Backdrop,
  Button,
  CircularProgress,
  Container,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";

interface Ostos {
  id: number;
  tuote: string;
  poimittu: boolean;
}

interface ApiData {
  ostokset: Ostos[];
  virhe: string;
  haettu: boolean;
}

const App = () => {
  const lomakeRef = useRef<HTMLFormElement>(null);

  const [apiData, setApiData] = useState<ApiData>({
    ostokset: [],
    virhe: "",
    haettu: false,
  });

  const apiKutsu = async (
    metodi?: string,
    ostos?: Ostos,
    id?: number
  ): Promise<void> => {
    setApiData({
      ...apiData,
      haettu: false,
    });

    const url = id
      ? `http://localhost:3006/api/ostokset/${id}`
      : `http://localhost:3006/api/ostokset`;

    let asetukset: RequestInit = {
      method: metodi || "GET",
    };

    if (metodi === "POST") {
      asetukset = {
        ...asetukset,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(ostos),
      };
    }

    try {
      const vastaus = await fetch(url, asetukset);

      if (vastaus.status === 200) {
        setApiData({
          ...apiData,
          ostokset: await vastaus.json(),
          haettu: true,
        });
      } else {
        let virheteksti = "";

        switch (vastaus.status) {
          case 400:
            virheteksti = "Virhe pyynnön tiedoissa";
            break;
          default:
            virheteksti = "Palvelimella tapahtui odottamaton virhe";
            break;
        }

        setApiData({
          ...apiData,
          virhe: virheteksti,
          haettu: true,
        });
      }
    } catch (e: any) {
      setApiData({
        ...apiData,
        virhe: "Palvelimeen ei saada yhteyttä",
        haettu: true,
      });
    }
  };

  const lisaaTuote = (e: React.FormEvent) => {
    e.preventDefault();

    const lomake = lomakeRef.current;
    if (!lomake) return;

    const tuoteKentta = lomake.elements.namedItem(
      "uusiTuote"
    ) as HTMLInputElement;

    apiKutsu("POST", {
      id: 0,
      tuote: tuoteKentta.value,
      poimittu: false,
    });
  };

  const poistaTuote = (ostos: Ostos) => {
    apiKutsu("DELETE", undefined, ostos.id);
  };

  useEffect(() => {
    apiKutsu();
  }, []);

  return (
    <Container>
      <Typography variant="h5">Demo 6: Asiakassovelluksen toteutus</Typography>

      <Typography variant="h6" sx={{ marginBottom: 2, marginTop: 2 }}>
        Ostoslista
      </Typography>

      {Boolean(apiData.virhe) ? (
        <Alert severity="error">{apiData.virhe}</Alert>
      ) : apiData.haettu ? (
        <Stack
          component="form"
          onSubmit={lisaaTuote}
          ref={lomakeRef}
          spacing={2}
        >
          <List>
            {apiData.ostokset.map((ostos: Ostos, idx: number) => {
              return (
                <ListItem
                  key={idx}
                  secondaryAction={
                    <IconButton
                      edge="end"
                      onClick={() => poistaTuote(ostos)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  }
                >
                  <ListItemText primary={ostos.tuote} />
                </ListItem>
              );
            })}
          </List>

          <TextField
            name="uusiTuote"
            fullWidth={true}
            placeholder="Kirjoita tähän uusi tuote..."
          />

          <Button type="submit" variant="contained" size="large" fullWidth>
            Lisää tuote ostoslistaan
          </Button>
        </Stack>
      ) : (
        <Backdrop open={true}>
          <CircularProgress color="inherit" />
        </Backdrop>
      )}
    </Container>
  );
};

export default App;
```

**Koodin selitys osissa:**

**`apiKutsu`-funktio** on yleiskäyttöinen funktio kaikille API-pyynnöille. Se ottaa parametreina HTTP-metodin, mahdollisen ostoksen ja mahdollisen id:n.

1. Asetetaan `haettu: false`, jolloin näytetään latausindikaattori
2. Rakennetaan URL parametrien perusteella
3. Rakennetaan `fetch`-asetukset: metodi ja POST-pyynnöissä headerit sekä body
4. Suoritetaan `fetch` ja käsitellään vastaus
5. Jos status on 200, päivitetään ostoslista vastauksesta
6. Jos status on jotain muuta, asetetaan virheviesti
7. Jos `fetch` itsessään epäonnistuu (palvelin ei vastaa), asetetaan yhteysvirhe

**`RequestInit`** on selaimen sisäänrakennettu tyyppi `fetch`-funktion asetuksille. Aiemmassa koodissa käytettiin `any`-tyyppiä, mutta `RequestInit` on tarkempi ja turvallisempi vaihtoehto.

**`useEffect`** suorittaa API-kutsun komponentin latautuessa. Tyhjä riippuvuustaulukko `[]` tarkoittaa, että kutsu tehdään vain kerran.

**`useRef`** viittaa lomakkeeseen, josta tuotteen nimi luetaan. Lomakkeen kentät luetaan `elements.namedItem()`-metodilla.

**Näkymän kolme tilaa:**
1. **Virhe:** `Alert`-komponentti punaisella virheilmoituksella
2. **Data haettu:** lomake ja ostoslista
3. **Ladataan:** `Backdrop` + `CircularProgress` -latausindikaattori

---

### Projektin lopullinen rakenne

```
demo06/
├── index.ts                    # Express-palvelimen pääohjelma
├── package.json
├── tsconfig.json
├── prisma.config.ts            # Prisma 7:n asetustiedosto
├── .env                        # Ympäristömuuttujat (DATABASE_URL)
├── lib/
│   └── prisma.ts               # PrismaClient-instanssin alustus
├── routes/
│   └── apiOstokset.ts          # Ostoslistan REST API -reitit
├── errors/
│   └── virhekasittelija.ts     # Virhekäsittelijä-middleware
├── prisma/
│   ├── schema.prisma           # Tietokantamalli
│   ├── data.db                 # SQLite-tietokanta (generoitu)
│   └── migrations/             # Migraatiotiedostot (generoitu)
├── generated/
│   └── prisma/                 # Generoitu Prisma Client (generoitu)
└── client/                     # React-asiakassovellus
    ├── src/
    │   ├── App.tsx             # Ostoslista-komponentti
    │   ├── main.tsx            # Sovelluksen käynnistys
    │   └── vite-env.d.ts       # Vite-tyyppimääritykset
    ├── index.html
    ├── vite.config.ts
    ├── package.json
    └── tsconfig.json
```

---

## 3. Demo 6: muistilista

### fetch-asetukset

| Asetus | Tyyppi | Käyttö |
|---|---|---|
| `method` | `string` | HTTP-metodi: `"GET"`, `"POST"`, `"PUT"`, `"DELETE"` |
| `headers` | `object` | Pyynnön otsikot, esim. `{ "Content-Type": "application/json" }` |
| `body` | `string` | Pyynnön runko, esim. `JSON.stringify(data)` |

### CORS-asetukset (cors-paketti)

| Asetus | Esimerkki | Selitys |
|---|---|---|
| `origin` | `"http://localhost:3000"` | Sallittu alkuperä (merkkijono) |
| `origin` | `["http://localhost:3000", "http://example.com"]` | Useita sallittuja alkuperiä (taulukko) |
| `origin` | `"*"` | Kaikki alkuperät sallittu (ei suositella tuotannossa) |

### Prisma 7 vs. Prisma 5/6

| Asia | Prisma 5/6 | Prisma 7 |
|---|---|---|
| Generator | `prisma-client-js` | `prisma-client` |
| Client-sijainti | `node_modules/.prisma/client` | Projektikansio (`generated/prisma/`) |
| Import | `from "@prisma/client"` | `from "./generated/prisma/client"` |
| Alustus | `new PrismaClient()` | `new PrismaClient({ adapter })` |
| Tietokannan URL | `schema.prisma` | `.env` + `prisma.config.ts` |
| Asetustiedosto | Ei tarvita | `prisma.config.ts` (pakollinen) |
| Ajuriadapteri | Ei tarvita | Pakollinen (esim. `@prisma/adapter-better-sqlite3`) |
| Suoritusympäristö | ts-node | tsx (suositus) |

### MUI-komponentit tässä demossa

| Komponentti | Käyttö |
|---|---|
| `Container` | Sivun pääkehys |
| `Typography` | Otsikot |
| `List`, `ListItem`, `ListItemText` | Ostoslistan renderöinti |
| `TextField` | Tuotteen nimen syöttökenttä |
| `Button` | Lisäyspainike |
| `IconButton` + `DeleteIcon` | Poistopainike |
| `Alert` | Virhenäkymä |
| `Backdrop` + `CircularProgress` | Latausindikaattori |
| `Stack` | Lomake-elementtien asettelu |

---

## Sovelluksen käynnistys

**1. Asenna palvelimen riippuvuudet:**

```bash
cd demo06
npm install
```

**2. Alusta tietokanta ja generoi Prisma Client:**

```bash
npx prisma migrate dev --name init
npx prisma generate
```

**3. Asenna asiakassovelluksen riippuvuudet:**

```bash
cd client
npm install
```

**4. Käynnistä Express-palvelin** (ensimmäisessä terminaalissa):

```bash
cd demo06
npm run dev
```

Palvelin käynnistyy osoitteeseen `http://localhost:3006`.

**5. Käynnistä Vite-kehityspalvelin** (toisessa terminaalissa):

```bash
cd demo06/client
npm run dev
```

Asiakassovellus avautuu osoitteeseen `http://localhost:3000`.
