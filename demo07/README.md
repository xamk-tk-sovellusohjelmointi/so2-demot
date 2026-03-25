# Demo 7: JWT-autorisointi

## Oppimistavoitteet

Tämän demon jälkeen opiskelija osaa:
- selittää, mitä JWT (JSON Web Token) on ja mihin sitä käytetään
- luoda JWT-tokenin `jsonwebtoken`-kirjastolla
- toteuttaa Express-middlewaren, joka tarkistaa tokenin pyynnön `Authorization`-headerista
- lisätä JWT-tokenin asiakassovelluksen fetch-kutsuihin
- tunnistaa tässä demossa käytetyn toteutustavan tietoturvariskin

---

## 1. JWT-autorisointi

### Mitä JWT on?

**JWT (JSON Web Token)** on avoin standardi (RFC 7519), jolla osapuolet voivat välittää tietoa turvallisesti JSON-muodossa. Token allekirjoitetaan salaisella avaimella, jolloin vastaanottaja voi varmistaa tokenin aitouden.

JWT koostuu kolmesta osasta, jotka erotetaan pisteillä:

```
HEADER.PAYLOAD.SIGNATURE
```

| Osa | Sisältö |
|---|---|
| **Header** | Algoritmi (esim. HS256) ja tokenin tyyppi (JWT) |
| **Payload** | Tokenin sisältämä data (esim. käyttäjätiedot, luontiaika) |
| **Signature** | Allekirjoitus, joka lasketaan headerin, payloadin ja salaisen avaimen perusteella |

### Autorisointi ja autentikointi

| Käsite | Merkitys |
|---|---|
| **Autentikointi** | Käyttäjän tunnistaminen (kuka olet?) |
| **Autorisointi** | Käyttöoikeuksien tarkistaminen (mitä saat tehdä?) |

Tässä demossa keskitytään **autorisointiin**: palvelin tarkistaa, onko asiakassovelluksella oikeus käyttää sen resursseja. Aiemmissa demoissa CORS-säännöillä rajoitettiin selainpohjaisten yhteyksien lähteitä, mutta CORS ei estä yhteydenottoa esimerkiksi Postmanilla tai `curl`-komennolla. JWT-tokeneilla voidaan rajoittaa pääsyä tarkemmin.

### Tokenin käyttö tässä demossa

Demossa JWT-token luodaan erillisellä aputiedostolla (`luoJWT.js`) ja liitetään manuaalisesti asiakassovelluksen lähdekoodiin. Palvelin tarkistaa jokaisen pyynnön `Authorization`-headerin ja päästää pyynnön läpi vain, jos token on validi.

> **Huomio:** Tässä demossa token on kovakoodattu asiakassovelluksen lähdekoodiin. Tämä on **tietoturvariski**, eikä näin tehtäisi tuotantosovelluksessa. Seuraavassa demossa (demo 8) toteutetaan turvallisempi tapa: token luodaan ohjelmallisesti onnistuneen kirjautumisen perusteella.

### Demosovellus

Demosovellus jatkaa aiempien demojen ostoslistasovellusta. Palvelimen REST API -reitit pysyvät samoina kuin demossa 6. Uutena ominaisuutena lisätään JWT-middleware, joka tarkistaa tokenin ennen kuin pyyntö pääsee API-reiteille.

Asiakassovellukseen lisätään `Authorization`-header jokaiseen fetch-kutsuun. Lisäksi virheenkäsittelyyn lisätään 401 (Unauthorized) -statuskoodi.

| Metodi | Reitti | Kuvaus |
|---|---|---|
| GET | `/api/ostokset` | Hakee kaikki ostokset |
| GET | `/api/ostokset/:id` | Hakee yksittäisen ostoksen |
| POST | `/api/ostokset` | Lisää uuden ostoksen |
| PUT | `/api/ostokset/:id` | Päivittää ostoksen |
| DELETE | `/api/ostokset/:id` | Poistaa ostoksen |

Muutos demo 6:een verrattuna: jokainen pyyntö vaatii validin JWT-tokenin `Authorization`-headerissa muodossa `Bearer <token>`.

---

## 2. Demosovelluksen rakentuminen vaihe vaiheelta

### Vaihe 1: Palvelinprojektin alustaminen

Luodaan uusi projektikansio ja alustetaan Node.js-projekti:

```bash
mkdir demo07
cd demo07
npm init -y
```

Avataan `package.json` ja muokataan se seuraavanlaiseksi:

```json
{
  "name": "demo07",
  "version": "1.0.0",
  "description": "",
  "main": "index.ts",
  "type": "module",
  "scripts": {
    "start": "npx nodemon --exec tsx index.ts"
  },
  "keywords": [],
  "author": "",
  "license": "ISC"
}
```

`"type": "module"` määrittää projektin käyttämään ESM-moduuleja (ECMAScript Modules). Tämä on Prisma 7:n vaatimus. `tsx` on TypeScript-suoritusympäristö, joka korvaa aiemmin käytetyn `ts-node`-työkalun ja toimii ESM-projektien kanssa.

### Vaihe 2: Riippuvuuksien asentaminen

Asennetaan tuotantoriippuvuudet:

```bash
npm install express cors jsonwebtoken @prisma/client @prisma/adapter-better-sqlite3 dotenv
```

Asennetaan kehitysriippuvuudet:

```bash
npm install -D typescript @types/express @types/cors @types/jsonwebtoken @types/node @types/better-sqlite3 prisma nodemon tsx
```

| Paketti | Tarkoitus |
|---|---|
| `express` | HTTP-palvelinkehys |
| `cors` | CORS-middleware |
| `jsonwebtoken` | JWT-tokenien luonti ja tarkistus |
| `@prisma/client` | Prisma Client -ajonaikainen kirjasto |
| `@prisma/adapter-better-sqlite3` | SQLite-tietokanta-adapteri Prisma 7:lle |
| `dotenv` | Ympäristömuuttujien lataaminen `.env`-tiedostosta |
| `prisma` | Prisma CLI (kehitystyökalu) |
| `tsx` | TypeScript-suoritusympäristö ESM-projekteille |
| `nodemon` | Automaattinen uudelleenkäynnistys koodien muuttuessa |

### Vaihe 3: TypeScript-asetukset

Luodaan `tsconfig.json` projektin juureen:

```json
{
  "compilerOptions": {
    "module": "ESNext",
    "moduleResolution": "bundler",
    "target": "ES2023",
    "strict": true,
    "esModuleInterop": true,
    "outDir": "./dist",
    "rootDir": "."
  },
  "include": ["./**/*.ts"],
  "exclude": ["node_modules", "generated"]
}
```

Prisma 7 edellyttää ESM-yhteensopivia TypeScript-asetuksia. `"module": "ESNext"` ja `"moduleResolution": "bundler"` varmistavat, että importit toimivat oikein.

### Vaihe 4: Prisman käyttöönotto (Prisma 7)

Alustetaan Prisma:

```bash
npx prisma init --datasource-provider sqlite --output ../generated/prisma
```

Komento luo kaksi tiedostoa:
- `prisma/schema.prisma` (tietomalli)
- `.env` (ympäristömuuttujat)

**Prisma 7:n keskeiset erot aiempiin versioihin:**

| Prisma 6 | Prisma 7 |
|---|---|
| `provider = "prisma-client-js"` | `provider = "prisma-client"` |
| Client generoituu `node_modules`-kansioon | Client generoituu projektin `generated/prisma`-kansioon |
| Tietokanta-URL schemassa | Tietokanta-URL `prisma.config.ts`-tiedostossa |
| Ei vaadi adapteria | Vaatii tietokanta-adapterin |

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

`provider = "prisma-client"` on Prisma 7:n uusi, Rust-vapaa client-generaattori. `output`-kenttä määrittää, mihin generoitu koodi tallennetaan.

**Luodaan `prisma.config.ts` projektin juureen:**

```typescript
import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "./prisma/schema.prisma",
  datasource: {
    url: process.env.DATABASE_URL || "file:./prisma/data.db",
  },
});
```

`prisma.config.ts` on Prisma 7:n uusi konfiguraatiotiedosto. Tietokanta-URL määritetään täällä eikä enää `schema.prisma`-tiedostossa. `dotenv/config`-importti lataa ympäristömuuttujat `.env`-tiedostosta automaattisesti.

**Muokataan `.env`-tiedosto:**

```
DATABASE_URL="file:./prisma/data.db"
```

**Luodaan tietokanta ja generoidaan Prisma Client:**

```bash
npx prisma migrate dev --name init
```

Komento luo migraation `prisma/migrations`-kansioon, luo SQLite-tietokantatiedoston ja generoi Prisma Clientin `generated/prisma`-kansioon.

Vaihtoehtoisesti Prisma Client voidaan generoida erikseen:

```bash
npx prisma generate
```

### Vaihe 5: Prisma Client -moduuli

Luodaan `lib/prisma.ts`:

```typescript
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "./generated/prisma/client.js";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL || "file:./prisma/data.db",
});

const prisma = new PrismaClient({ adapter });

export default prisma;
```

Prisma 7 vaatii **tietokanta-adapterin** käytettävän tietokannan mukaan. SQLite-tietokannalle käytetään `@prisma/adapter-better-sqlite3`-adapteria. Adapteri annetaan `PrismaClient`-konstruktorille.

> **Huomio:** `PrismaClient` importataan generoitujen tiedostojen polusta (`./generated/prisma/client.js`), ei enää `@prisma/client`-paketista.

### Vaihe 6: JWT-tokenin luominen

Luodaan aputiedosto `luoJWT.js` projektin juureen:

```javascript
import jwt from "jsonwebtoken";

const token = jwt.sign({}, "SalausLause_25");

console.log(token);
```

`jwt.sign(payload, salaisuus)` luo uuden JWT-tokenin. Ensimmäinen parametri on tokenin payload (tässä tyhjä objekti) ja toinen parametri on salainen avain, jolla token allekirjoitetaan. Salaisen avaimen tulee olla sama sekä tokenin luonnissa että tarkistuksessa.

Suoritetaan tiedosto:

```bash
node luoJWT.js
```

Terminaaliin tulostuu token, esimerkiksi:

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3NDIyMDMzNDh9.0OqTw4sohQE6UdVF8nRAAiMOwNK95mSwPOCbdgLjmgo
```

Token koostuu kolmesta Base64-koodatusta osasta, jotka erotetaan pisteillä. Kopioidaan token talteen; sitä tarvitaan asiakassovelluksessa.

> **Huomio:** Salainen avain (`"SalausLause_25"`) on tässä esimerkissä kovakoodattu. Tuotantosovelluksessa salainen avain tallennetaan ympäristömuuttujaan.

### Vaihe 7: Virhekäsittelijä

Luodaan kansio `errors` ja tiedosto `errors/virhekasittelija.ts`:

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
): void => {
  res.status(err.status).json({ virhe: err.viesti });
  next();
};

export default virhekasittelija;
```

Virhekäsittelijä on sama kuin aiemmissa demoissa. `Virhe`-luokka laajentaa JavaScriptin `Error`-luokkaa ja lisää siihen `status`- ja `viesti`-kentät. Virhekäsittelijä-middleware lähettää virheen JSON-vastauksena oikealla statuskoodilla.

### Vaihe 8: API-reitit

Luodaan kansio `routes` ja tiedosto `routes/apiOstokset.ts`:

```typescript
import express from "express";
import { Virhe } from "../errors/virhekasittelija.js";
import prisma from "../lib/prisma.js";

const apiOstoksetRouter: express.Router = express.Router();

apiOstoksetRouter.use(express.json());

// GET / — Hakee kaikki ostokset
apiOstoksetRouter.get(
  "/",
  async (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ): Promise<void> => {
    try {
      res.json(await prisma.ostos.findMany());
    } catch (e: any) {
      next(new Virhe());
    }
  }
);

// GET /:id — Hakee yksittäisen ostoksen
apiOstoksetRouter.get(
  "/:id",
  async (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ): Promise<void> => {
    try {
      const ostos = await prisma.ostos.findUnique({
        where: {
          id: Number(req.params.id),
        },
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

// POST / — Lisää uuden ostoksen
apiOstoksetRouter.post(
  "/",
  async (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ): Promise<void> => {
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

// PUT /:id — Päivittää ostoksen
apiOstoksetRouter.put(
  "/:id",
  async (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ): Promise<void> => {
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

// DELETE /:id — Poistaa ostoksen
apiOstoksetRouter.delete(
  "/:id",
  async (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ): Promise<void> => {
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

Reitit ovat pääosin samat kuin demossa 6. Muutoksena Prisma Client importataan erillisestä `lib/prisma.ts`-moduulista, jossa adapteri on konfiguroitu. Olemassaolon tarkistuksessa käytetään `findUnique()`-metodia `count()`-metodin sijasta: `findUnique()` palauttaa `null`, jos tietuetta ei löydy, jolloin tarkistus on selkeämpi.

> **Huomio:** ESM-moduuleissa import-poluissa käytetään `.js`-tiedostopäätettä, vaikka lähdetiedostot ovat `.ts`-muodossa. Tämä on ESM-standardin vaatimus.

### Vaihe 9: Pääpalvelintiedosto ja JWT-middleware

Luodaan `index.ts` projektin juureen:

```typescript
import "dotenv/config";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import apiOstoksetRouter from "./routes/apiOstokset.js";
import virhekasittelija from "./errors/virhekasittelija.js";
import jwt from "jsonwebtoken";
import cors from "cors";

const app: express.Application = express();

const portti: number = Number(process.env.PORT) || 3007;

// CORS: sallitaan yhteydet Vite-kehityspalvelimelta
app.use(cors({ origin: "http://localhost:3000" }));

// JWT-middleware: tarkistaa tokenin kaikista pyynnöistä
app.use(
  (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ): void => {
    try {
      const authHeader: string | undefined = req.headers.authorization;

      if (!authHeader) {
        res.status(401).json({ virhe: "Token puuttuu" });
        return;
      }

      const token: string = authHeader.split(" ")[1];

      jwt.verify(token, "SalausLause_25");

      next();
    } catch (e: any) {
      res.status(401).json({ virhe: "Virheellinen token" });
    }
  }
);

// Staattisten tiedostojen tarjoaminen
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.resolve(__dirname, "public")));

// API-reitit
app.use("/api/ostokset", apiOstoksetRouter);

// Virhekäsittelijä
app.use(virhekasittelija);

// 404-käsittelijä
app.use(
  (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ): void => {
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

**JWT-middleware** on Express-middleware, joka suoritetaan ennen API-reittejä. Se tekee seuraavat asiat:

1. Lukee `Authorization`-headerin pyynnöstä
2. Erottaa tokenin `Bearer`-etuliitteestä: `"Bearer eyJhbG..."` → `"eyJhbG..."`
3. Tarkistaa tokenin allekirjoituksen `jwt.verify(token, salaisuus)` -funktiolla
4. Jos token on validi, kutsutaan `next()` ja pyyntö jatkaa seuraavaan middlewareen
5. Jos token puuttuu tai on virheellinen, palautetaan `401 Unauthorized`

`jwt.verify()` heittää virheen, jos token on virheellinen tai vanhentunut. Siksi tarkistus tehdään `try/catch`-lohkossa.

> **Huomio:** ESM-moduuleissa `__dirname` ei ole suoraan käytettävissä (toisin kuin CommonJS:ssä). Se muodostetaan `import.meta.url`-arvosta `fileURLToPath()`- ja `path.dirname()`-funktioilla.

---

### Vaihe 10: Asiakassovelluksen luominen

Asiakassovellus luodaan palvelinprojektin juureen `client`-kansioon. Vite-projektin alustus on kuvattu erillisessä ohjeessa: **[Vite-projektin alustusohje](./client/VITE_ALUSTUS.md)**.

Kun Vite-projekti on alustettu ja MUI-riippuvuudet asennettu, muokataan `client/src/App.tsx`:

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

interface FetchAsetukset {
  method: string;
  headers?: Record<string, string>;
  body?: string;
}

const TOKEN =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3NDIyMDMzNDh9.0OqTw4sohQE6UdVF8nRAAiMOwNK95mSwPOCbdgLjmgo";

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

    const url: string = id
      ? `http://localhost:3007/api/ostokset/${id}`
      : `http://localhost:3007/api/ostokset`;

    let asetukset: FetchAsetukset = {
      method: metodi || "GET",
      headers: {
        Authorization: `Bearer ${TOKEN}`,
      },
    };

    if (metodi === "POST") {
      asetukset = {
        ...asetukset,
        headers: {
          ...asetukset.headers!,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(ostos),
      };
    }

    try {
      const yhteys = await fetch(url, asetukset);

      if (yhteys.status === 200) {
        setApiData({
          ...apiData,
          ostokset: await yhteys.json(),
          haettu: true,
        });
      } else {
        let virheteksti: string = "";

        switch (yhteys.status) {
          case 400:
            virheteksti = "Virhe pyynnön tiedoissa";
            break;
          case 401:
            virheteksti = "Virheellinen token";
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

  const poistaTuote = (ostos: Ostos): void => {
    apiKutsu("DELETE", undefined, ostos.id);
  };

  const lisaaTuote = (e: React.FormEvent): void => {
    e.preventDefault();

    apiKutsu("POST", {
      id: 0,
      tuote: lomakeRef.current?.uusiTuote.value,
      poimittu: false,
    });
  };

  useEffect(() => {
    apiKutsu();
  }, []);

  return (
    <Container>
      <Typography variant="h5">Demo 7: JWT-autorisointi</Typography>

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
                      onClick={() => {
                        poistaTuote(ostos);
                      }}
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

          <Button
            type="submit"
            variant="contained"
            size="large"
            fullWidth={true}
          >
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

**Keskeiset muutokset demo 6:een verrattuna:**

**`TOKEN`-vakio** sisältää vaiheessa 6 luodun JWT-tokenin. Token on sijoitettu moduulitason vakioksi, josta se on helppo löytää.

**`Authorization`-header** lisätään jokaiseen fetch-kutsuun `headers`-objektiin muodossa `"Bearer <token>"`. `Bearer` on standardin mukainen autentikaatiotyyppi, joka kertoo palvelimelle, että headerissa on JWT-token.

**`FetchAsetukset`-interface** on tyypitetty tarkemmin kuin demossa 6. `headers`-kenttä käyttää `Record<string, string>`-tyyppiä `any`-tyypin sijasta.

**401-virheen käsittely** on lisätty `switch`-lauseeseen. Jos palvelin palauttaa 401-statuskoodin, käyttäjälle näytetään "Virheellinen token" -virheilmoitus.

**`main.tsx`** pysyy samana kuin demossa 6:

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

### Projektin lopullinen rakenne

```
demo07/
├── client/                          # Asiakassovellus (Vite + React)
│   ├── src/
│   │   ├── App.tsx                  # Pääkomponentti
│   │   └── main.tsx                 # Sovelluksen käynnistyspiste
│   ├── index.html
│   ├── vite.config.ts               # Vite-konfiguraatio (portti 3000)
│   ├── tsconfig.json
│   ├── package.json
│   └── VITE_ALUSTUS.md              # Vite-projektin alustusohje
├── errors/
│   └── virhekasittelija.ts          # Virhekäsittelijä-middleware
├── generated/
│   └── prisma/                      # Prisma 7:n generoima client
│       └── client.js
├── lib/
│   └── prisma.ts                    # Prisma Client -instanssi adapterilla
├── prisma/
│   ├── schema.prisma                # Tietomalli
│   ├── data.db                      # SQLite-tietokantatiedosto
│   └── migrations/                  # Migraatiot
├── routes/
│   └── apiOstokset.ts               # API-reitit
├── .env                             # Ympäristömuuttujat
├── index.ts                         # Palvelimen pääohjelma ja JWT-middleware
├── luoJWT.js                        # JWT-tokenin luontiskripti
├── prisma.config.ts                 # Prisma 7 -konfiguraatio
├── tsconfig.json                    # TypeScript-asetukset
└── package.json                     # Riippuvuudet ja skriptit
```

---

## 3. JWT-autorisointi: muistilista

### JWT-tokenin luonti ja tarkistus

| Toiminto | Koodi |
|---|---|
| Tokenin luonti | `jwt.sign(payload, salaisuus)` |
| Tokenin tarkistus | `jwt.verify(token, salaisuus)` |
| Token headerissa | `Authorization: Bearer <token>` |
| Tokenin irrottaminen | `req.headers.authorization!.split(" ")[1]` |

### Prisma 7 vs. Prisma 6

| Ominaisuus | Prisma 6 | Prisma 7 |
|---|---|---|
| Generator | `prisma-client-js` | `prisma-client` |
| Client-sijainti | `node_modules` | Oma `output`-kansio (esim. `generated/prisma`) |
| Tietokanta-URL | `schema.prisma` `url`-kenttä | `prisma.config.ts` |
| Adapteri | Ei tarvita | Pakollinen (esim. `@prisma/adapter-better-sqlite3`) |
| PrismaClient-luonti | `new PrismaClient()` | `new PrismaClient({ adapter })` |
| Moduulityyppi | CJS tai ESM | ESM (`"type": "module"`) |
| Client import | `from "@prisma/client"` | `from "./generated/prisma/client.js"` |

### HTTP-statuskoodit autorisointiin liittyen

| Koodi | Merkitys |
|---|---|
| `200` | OK |
| `400` | Virheellinen pyyntö (esim. puuttuva data) |
| `401` | Unauthorized (puuttuva tai virheellinen token) |
| `404` | Reittiä ei löydy |
| `500` | Palvelinvirhe |

---

## Sovelluksen käynnistys

**1. Asenna palvelimen riippuvuudet:**

```bash
cd demo07
npm install
```

**2. Alusta tietokanta:**

```bash
npx prisma migrate dev --name init
```

**3. Luo JWT-token:**

```bash
node luoJWT.js
```

Kopioi tulostuneen tokenin ja liitä se asiakassovelluksen `App.tsx`-tiedoston `TOKEN`-vakioon.

**4. Käynnistä palvelin (ensimmäinen terminaali):**

```bash
npm start
```

Palvelin käynnistyy osoitteeseen `http://localhost:3007`.

**5. Asenna asiakassovelluksen riippuvuudet (toinen terminaali):**

```bash
cd client
npm install
```

**6. Käynnistä asiakassovellus (toinen terminaali):**

```bash
npm run dev
```

Asiakassovellus käynnistyy osoitteeseen `http://localhost:3000`.

**7. Testaa sovellusta:** avaa `http://localhost:3000` selaimessa. Ostoslistan pitäisi latautua normaalisti, koska asiakassovellus lähettää validin JWT-tokenin jokaisessa pyynnössä.

Voit testata tokenin toimintaa muuttamalla `TOKEN`-vakion arvoa tai poistamalla `Authorization`-headerin kokonaan. Palvelin palauttaa tällöin `401 Unauthorized` -vastauksen.
