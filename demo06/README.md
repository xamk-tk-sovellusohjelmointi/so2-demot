# Demo 6: React-asiakassovellus ja REST API

## 1. Asiakassovellus ja palvelin yhteistoiminnassa

Demo 6 rakentuu kahdesta erillisestä sovelluksesta: Express-palvelimesta ja React-asiakassovelluksesta. Palvelinsovellus (`server/`) tarjoaa REST API:n ostoslistan hallintaan. Asiakassovellus (`client/`) on selaimessa ajettava React-sovellus, joka hakee ja muokkaa ostoslistan tietoja palvelimen REST API:n kautta.

Tässä demossa rakennetaan palvelinsovellus. Asiakassovellus toteutetaan erikseen.

Sovelluksen REST API -päätepisteet:

| Metodi | Polku                  | Toiminto                                            |
|--------|------------------------|-----------------------------------------------------|
| GET    | /api/ostokset          | Palauttaa kaikki ostokset                           |
| GET    | /api/ostokset/:id      | Palauttaa yksittäisen ostoksen                      |
| POST   | /api/ostokset          | Lisää uuden ostoksen, palauttaa päivitetyn listan   |
| PUT    | /api/ostokset/:id      | Päivittää ostoksen kentät                           |
| DELETE | /api/ostokset/:id      | Poistaa ostoksen, palauttaa päivitetyn listan       |

---

## 2. CORS

### Mikä CORS on?

CORS (Cross-Origin Resource Sharing) on selaimen turvallisuusmekanismi, joka rajoittaa, mistä osoitteesta JavaScript-koodi voi tehdä HTTP-pyyntöjä. Oletuksena selain estää pyynnöt, joissa pyynnön lähde (origin) poikkeaa pyydetyn resurssin osoitteesta.

**Origin** koostuu kolmesta osasta: protokollasta, isäntäosoitteesta ja portista. Kaksi osoitetta ovat sama origin vain, jos kaikki kolme osaa ovat identtiset.

Kehitysvaiheessa palvelin ja React-asiakassovellus ajetaan yleensä eri porteissa:

| Sovellus              | Osoite                   |
|-----------------------|--------------------------|
| Express-palvelin      | `http://localhost:3006`  |
| React (Vite)          | `http://localhost:5173`  |

Nämä ovat eri origineita, koska portti on eri. Ilman CORS-asetuksia selain estää React-sovelluksen pyynnöt Express-palvelimelle.

### CORS-ongelma kehityksessä

Selain suorittaa CORS-tarkistuksen automaattisesti ennen varsinaista pyyntöä. Ensin selain lähettää `OPTIONS`-metodilla niin sanotun "preflight"-pyynnön, jolla se kysyy palvelimelta, hyväksyykö se pyynnöt tästä originista. Jos palvelin ei vastaa oikeilla CORS-otsakkeilla, selain hylkää pyynnön.

Virhe näkyy selaimen konsolissa muodossa:

```
Access to fetch at 'http://localhost:3006/api/ostokset' from origin
'http://localhost:5173' has been blocked by CORS policy
```

### CORS-middlewaren käyttö Expressissä

`cors`-paketti lisää palvelimen vastauksiin tarvittavat CORS-otsakkeet automaattisesti:

```bash
npm install cors
npm install --save-dev @types/cors
```

Middlewaren rekisteröinti tapahtuu `index.ts`:ssä ennen reittejä:

```typescript
import cors from 'cors';

app.use(cors({ origin: 'http://localhost:5173' }));
```

`origin`-asetus rajoittaa pääsyn vain asiakassovelluksen osoitteeseen. Tämä on turvallisempi kuin salliminen kaikille (`'*'`), etenkin jos API käsittelee arkaluonteista dataa.

---

## 3. Verkkoviiveen simulointi kehityksessä

Kehitysvaiheessa palvelin ja asiakas ajetaan paikallisesti samalla koneella. Tällöin pyyntöihin ei käytännössä kulu aikaa, mikä antaa epärealistisen kuvan sovelluksen toiminnasta. Tuotannossa pyyntöihin kuluu aina jonkin verran aikaa verkon yli.

Asiakassovelluksessa on usein latausindikaattori (esim. `CircularProgress`), jonka toiminta jää näkymättömäksi, jos pyynnöt päättyvät lähes välittömästi. Tätä varten lisätään palvelimelle middleware, joka viivästyttää jokaista pyyntöä hieman:

```typescript
app.use((_req, _res, next) => {
    setTimeout(() => next(), 500);
});
```

Viive poistetaan tai kommentoidaan pois tuotantoversiossa tai kun se ei enää ole tarpeen.

---

## 4. Demosovelluksen rakentuminen vaihe vaiheelta

### Vaihe 1: Projektin alustaminen

Luodaan palvelimelle oma kansio demo06:n sisälle:

```bash
mkdir demo06/server
cd demo06/server
```

Alustetaan Node.js-projekti:

```bash
npm init -y
```

### Vaihe 2: Riippuvuuksien asentaminen

Demo 6 perustuu demo 5:n Prisma-rakenteeseen. Uutena pakettina lisätään `cors`:

```bash
npm install express cors
npm install --save-dev typescript tsx @types/node @types/express @types/cors

# Prisma-paketit
npm install --save-dev prisma @types/better-sqlite3
npm install @prisma/client @prisma/adapter-better-sqlite3 dotenv
```

Asennuksen jälkeen `package.json` tulisi näyttää tältä:

```json
{
  "name": "server",
  "version": "1.0.0",
  "main": "index.ts",
  "type": "module",
  "scripts": {
    "start": "tsx index.ts",
    "dev": "tsx watch index.ts",
    "type-check": "tsc --noEmit"
  },
  "devDependencies": {
    "@types/better-sqlite3": "^7.x.x",
    "@types/cors": "^2.x.x",
    "@types/express": "^5.x.x",
    "@types/node": "^x.x.x",
    "prisma": "^7.x.x",
    "tsx": "^4.x.x",
    "typescript": "^5.x.x"
  },
  "dependencies": {
    "@prisma/adapter-better-sqlite3": "^7.x.x",
    "@prisma/client": "^7.x.x",
    "cors": "^2.x.x",
    "dotenv": "^x.x.x",
    "express": "^5.x.x"
  }
}
```

### Vaihe 3: TypeScript-konfiguraatio

`tsconfig.json` on identtinen demo 5:n konfiguraation kanssa. Prisma 7 edellyttää samat lisäasetukset:

```json
{
  "compilerOptions": {
    // Node/Express-perusasetukset
    "module": "preserve",
    "target": "esnext",
    "lib": ["esnext"],
    "types": ["node"],
    "sourceMap": true,
    "strict": true,
    "resolveJsonModule": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "allowJs": true,

    // Prisma 7 edellyttää nämä lisäasetukset
    "declaration": true,
    "declarationMap": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noUncheckedSideEffectImports": true,
    "noUncheckedIndexedAccess": true,
    "verbatimModuleSyntax": true
  }
}
```

### Vaihe 4: Prisma-projektin alustaminen

Alustetaan Prisma SQLite-tietokannalla:

```bash
npx prisma init --datasource-provider sqlite --output ../generated/prisma
```

Komento luo kolme tiedostoa: `prisma/schema.prisma`, `prisma.config.ts` ja `.env`.

`.env`-tiedostossa määritetään tietokantatiedoston polku:

```
DATABASE_URL="file:./dev.db"
```

### Vaihe 5: Tietomallin määrittely (prisma/schema.prisma)

Lisätään `Ostos`-malli schemaan:

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

Kenttien selitykset:

| Kenttä     | Prisma-tyyppi | TypeScript-tyyppi | Huomio |
|------------|---------------|-------------------|--------|
| `id`       | `Int`         | `number`          | Automaattisesti kasvava pääavain |
| `tuote`    | `String`      | `string`          | Ostoksen nimi |
| `poimittu` | `Boolean`     | `boolean`         | `@default(false)` asettaa oletusarvoksi `false` |

`@default(false)` tarkoittaa, että uusi ostos luodaan aina poimimattomana, eikä asiakassovelluksen tarvitse lähettää kenttää POST-pyynnössä.

### Vaihe 6: Migraatio ja Prisma Clientin generointi

Luodaan ensimmäinen migraatio:

```bash
npx prisma migrate dev --name init
```

Komento luo SQLite-tietokantatiedoston `dev.db` ja ajaa migraation. Migraatiotiedostoon generoituu SQL:

```sql
CREATE TABLE "Ostos" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "tuote" TEXT NOT NULL,
    "poimittu" BOOLEAN NOT NULL DEFAULT false
);
```

Tämän jälkeen generoidaan Prisma Client:

```bash
npx prisma generate
```

Komento tuottaa TypeScript-koodin `generated/prisma/`-kansioon.

### Vaihe 7: Prisma Clientin alustus (lib/prisma.ts)

Luodaan `lib/`-kansio ja sinne `prisma.ts`. Tiedosto on identtinen demo 5:n kanssa:

```typescript
import 'dotenv/config';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { PrismaClient } from '../generated/prisma/client.ts';

const connectionString = process.env['DATABASE_URL'] ?? 'file:./dev.db';
const adapter = new PrismaBetterSqlite3({ url: connectionString });
const prisma = new PrismaClient({ adapter });

export { prisma };
```

### Vaihe 8: Virhekäsittelijä (errors/virhekasittelija.ts)

Luodaan `errors/`-kansio ja kopioidaan virhekäsittelijä demo 5:stä sellaisenaan:

```typescript
import express from 'express';

export class Virhe extends Error {
    status: number;
    viesti: string;
    constructor(status?: number, viesti?: string) {
        super(viesti);
        this.status = status || 500;
        this.viesti = viesti || 'Palvelimella tapahtui odottamaton virhe';
    }
}

const virhekasittelija = (err: Virhe, _req: express.Request, res: express.Response, _next: express.NextFunction): void => {
    res.status(err.status).json({ viesti: err.viesti });
};

export default virhekasittelija;
```

### Vaihe 9: Reitinkäsittelijät (routes/apiOstokset.ts)

Luodaan `routes/`-kansio ja sinne `apiOstokset.ts`. Rakenne on sama kuin demo 5:ssä, mutta reiteissä on kaksi eroa aiempaan:

- POST palauttaa päivitetyn listan yksittäisen luodun objektin sijaan.
- DELETE palauttaa myös päivitetyn listan, ei poistetun objektin. Asiakassovellus tarvitsee ajan tasalla olevan listan jokaisen muutoksen jälkeen.

```typescript
import express from 'express';
import { prisma } from '../lib/prisma.ts';
import { Virhe } from '../errors/virhekasittelija.ts';

const apiOstoksetRouter: express.Router = express.Router();
apiOstoksetRouter.use(express.json());

apiOstoksetRouter.get('/', async (_req, res) => {
    const ostokset = await prisma.ostos.findMany();
    res.json(ostokset);
});

apiOstoksetRouter.get('/:id', async (req, res) => {
    const ostos = await prisma.ostos.findUnique({ where: { id: Number(req.params.id) } });
    if (!ostos) throw new Virhe(404, 'Ostosta ei löytynyt');
    res.json(ostos);
});

apiOstoksetRouter.post('/', async (req, res) => {
    if (!req.body.tuote) throw new Virhe(400, 'Virheellinen pyynnön body');
    await prisma.ostos.create({ data: { tuote: req.body.tuote, poimittu: false } });
    const ostokset = await prisma.ostos.findMany();
    res.status(201).json(ostokset);
});

apiOstoksetRouter.put('/:id', async (req, res) => {
    const ostos = await prisma.ostos.findUnique({ where: { id: Number(req.params.id) } });
    if (!ostos) throw new Virhe(404, 'Ostosta ei löydy');
    if (req.body.tuote === undefined && req.body.poimittu === undefined) throw new Virhe(400, 'Virheellinen pyynnön body');
    const paivitettyOstos = await prisma.ostos.update({
        where: { id: Number(req.params.id) },
        data: {
            tuote: req.body.tuote ?? ostos.tuote,
            poimittu: req.body.poimittu ?? ostos.poimittu,
        },
    });
    res.json(paivitettyOstos);
});

apiOstoksetRouter.delete('/:id', async (req, res) => {
    const ostos = await prisma.ostos.findUnique({ where: { id: Number(req.params.id) } });
    if (!ostos) throw new Virhe(404, 'Ostosta ei löytynyt');
    await prisma.ostos.delete({ where: { id: Number(req.params.id) } });
    const ostokset = await prisma.ostos.findMany();
    res.json(ostokset);
});

export default apiOstoksetRouter;
```

### Vaihe 10: Palvelimen pääohjelma (index.ts)

Luodaan `index.ts`. Tähän tulee uutena cors-middleware ja viivemiddleware verrattuna demo 5:een:

```typescript
import express from 'express';
import path from 'path';
import cors from 'cors';
import apiOstoksetRouter from './routes/apiOstokset.ts';
import virhekasittelija from './errors/virhekasittelija.ts';

const app: express.Application = express();

const portti: number = Number(process.env.PORT) || 3006;

// Sallitaan CORS React-kehityspalvelimelle
app.use(cors({ origin: 'http://localhost:5173' }));

// Simuloidaan verkkoviivettä kehitystä varten
app.use((_req, _res, next) => {
    setTimeout(() => next(), 500);
});

app.use(express.static(path.resolve(import.meta.dirname, 'public')));

app.use('/api/ostokset', apiOstoksetRouter);

app.use(virhekasittelija);

app.listen(portti, (): void => {
    console.log(`Palvelin käynnistettiin osoitteeseen http://localhost:${portti}`);
});
```

### Vaihe 11: Palvelimen käynnistäminen

```bash
npm run dev
```

Palvelin käynnistyy osoitteeseen `http://localhost:3006`. Testaa Postmanilla tai selaimella.
