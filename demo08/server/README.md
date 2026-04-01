# Demo 8: Käyttäjähallinta ja autentikointi

## Oppimistavoitteet

Tämän demon jälkeen opiskelija osaa:
- selittää autentikoinnin ja autorisoinnin eron
- tallentaa salasanan tiivisteenä (hash) tietokantaan SHA-256-algoritmilla
- toteuttaa kirjautumisreitin, joka tarkistaa käyttäjätunnuksen ja salasanan ja palauttaa JWT-tokenin
- soveltaa JWT-middlewarea vain tietyille reiteille (reittikohtainen autorisointi)
- luoda Prisma-schemaan uuden mallin käyttäjätietojen tallentamista varten

---

## 1. Autentikointi ja autorisointi

### Mitä eroa on autentikoinnilla ja autorisoinnilla?

| Käsite | Merkitys | Esimerkki |
|---|---|---|
| **Autentikointi** | Käyttäjän tunnistaminen — kuka olet? | Kirjautuminen käyttäjätunnuksella ja salasanalla |
| **Autorisointi** | Käyttöoikeuksien tarkistaminen — mitä saat tehdä? | JWT-tokenin tarkistus ennen API-reitin käsittelyä |

Autentikointia ja autorisointia voi verrata konserttitapahtumaan osallistumiseen. Näytät tapahtumapaikan ovella järjestyksenvalvojalle pääsylippusi (**autentikointi**) ja saat hyväksyttyä pääsylippua vastaan rannekkeen (**autorisointi**), jonka avulla voit kulkea tapahtumapaikalle ja ulos sieltä vapaasti. Kulkulupa on voimassa sen ajan, mille olet hankkinut pääsylipun — samalla tavalla JWT-token voidaan myöntää rajatuksi ajaksi.

Demossa 7 autorisointi oli yksinkertainen: kovakoodattu token liitettiin manuaalisesti asiakassovellukseen, ja palvelin tarkisti sen kaikista pyynnöistä. Tässä demossa toteutetaan **autentikointi**: käyttäjä kirjautuu tunnuksella ja salasanalla, ja palvelin luo onnistuneen kirjautumisen perusteella JWT-tokenin.

### Demosovelluksen idea

Demossa 8 ostoslistanäkymä on autorisoinnilla rajoitettu resurssi, jonne vain kirjautuneet käyttäjät pääsevät. Sovelluksessa on erikseen kirjautumisreitti (`/api/auth/login`), joka **ei vaadi tokenia** — sinne kenellä tahansa on pääsy. Onnistuneen kirjautumisen jälkeen palvelin palauttaa JWT-tokenin, jota asiakassovellus käyttää ostoslista-API:n kutsuissa.

### Salasanan tiivistäminen (hashing)

Salasanoja ei koskaan tallenneta selkokielisinä tietokantaan. Sen sijaan salasanasta lasketaan **tiiviste** (hash) yksisuuntaisella algoritmilla. Tässä demossa käytetään SHA-256-algoritmia:

```
passu123  →  SHA-256  →  008c7...e4f (64 merkkiä pitkä heksamerkkijono)
```

Kirjautumisen yhteydessä käyttäjän lähettämästä salasanasta lasketaan tiiviste ja verrataan sitä tietokantaan tallennettuun tiivisteeseen. Jos ne täsmäävät, salasana on oikea.

> **Huomio:** SHA-256 on opetuskäyttöön sopiva esimerkki, mutta tuotantosovelluksissa käytetään hitaampia algoritmeja kuten `bcrypt` tai `argon2`, jotka ovat paremmin suojattuja brute force -hyökkäyksiä vastaan.

### Muutokset demo 7:ään verrattuna

| Ominaisuus | Demo 7 | Demo 8 |
|---|---|---|
| Tokenin luonti | Manuaalinen (`luoJWT.js`) | Ohjelmallinen (kirjautumisen yhteydessä) |
| JWT-middleware | Kaikille reiteille (`app.use`) | Vain ostoslistareiteille (`app.use('/api/ostokset', checkToken, ...)`) |
| Kirjautuminen | Ei toteutettu | `POST /api/auth/login` |
| Käyttäjätiedot | Ei tietokannassa | `Kayttaja`-malli Prismassa |
| JWT-payload | Tyhjä `{}` | Sisältää käyttäjän id:n `{ id }` |

### API-reitit

| Metodi | Reitti | Kuvaus | Token vaaditaan |
|---|---|---|---|
| POST | `/api/auth/login` | Kirjautuminen | Ei |
| GET | `/api/ostokset` | Hakee kaikki ostokset | Kyllä |
| GET | `/api/ostokset/:id` | Hakee yksittäisen ostoksen | Kyllä |
| POST | `/api/ostokset` | Lisää uuden ostoksen | Kyllä |
| PUT | `/api/ostokset/:id` | Päivittää ostoksen | Kyllä |
| DELETE | `/api/ostokset/:id` | Poistaa ostoksen | Kyllä |

---

## 2. Palvelinsovelluksen rakentuminen vaihe vaiheelta

### Vaihe 1: Palvelinprojektin alustaminen

Luodaan uusi projektikansio ja alustetaan Node.js-projekti:

```bash
mkdir demo08
cd demo08
mkdir server
cd server
npm init -y
```

Avataan `package.json` ja muokataan se seuraavanlaiseksi:

```json
{
  "name": "server",
  "version": "1.0.0",
  "main": "index.ts",
  "type": "module",
  "scripts": {
    "start": "tsx index.ts",
    "dev": "tsx watch index.ts"
  }
}
```

`"type": "module"` määrittää projektin käyttämään ESM-moduuleja. `tsx` on TypeScript-suoritusympäristö, joka korvaa aiemmin käytetyn `ts-node`-työkalun. `tsx watch` käynnistää palvelimen uudelleen automaattisesti, kun tiedostoja muutetaan.

### Vaihe 2: Riippuvuuksien asentaminen

Asennetaan tuotantoriippuvuudet:

```bash
npm install express cors jsonwebtoken @prisma/client @prisma/adapter-better-sqlite3 dotenv
```

Asennetaan kehitysriippuvuudet:

```bash
npm install -D typescript @types/express @types/cors @types/jsonwebtoken @types/node @types/better-sqlite3 prisma tsx
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

### Vaihe 3: TypeScript-asetukset

Luodaan `tsconfig.json` projektin juureen:

```json
{
  "compilerOptions": {
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

Prisma 7 edellyttää ESM-yhteensopivia TypeScript-asetuksia. `noUncheckedIndexedAccess` lisää `undefined`-tarkistukset taulukon ja objektin indeksoinnille. `verbatimModuleSyntax` vaatii, että tyyppien importit merkitään `import type` -syntaksilla.

### Vaihe 4: Prisman käyttöönotto

Alustetaan Prisma:

```bash
npx prisma init --datasource-provider sqlite --output ../generated/prisma
```

Komento luo kaksi tiedostoa:
- `prisma/schema.prisma` (tietomalli)
- `.env` (ympäristömuuttujat)

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

model Kayttaja {
  id             Int    @id @default(autoincrement())
  kayttajatunnus String @unique
  salasana       String
}
```

Schemaan on lisätty `Kayttaja`-malli, joka tallentaa käyttäjätunnuksen ja salasanan tiivisteen. `@unique` varmistaa, ettei samaa käyttäjätunnusta voi olla kahdella käyttäjällä.

**Luodaan `prisma.config.ts` projektin juureen:**

```typescript
import 'dotenv/config';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: process.env['DATABASE_URL'],
  },
});
```

**Muokataan `.env`-tiedosto:**

```
DATABASE_URL="file:./prisma/dev.db"
```

**Luodaan tietokanta ja generoidaan Prisma Client:**

```bash
npx prisma migrate dev --name init
```

### Vaihe 5: Prisma Client -moduuli

Luodaan `lib/prisma.ts`:

```typescript
import 'dotenv/config';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { PrismaClient } from '../generated/prisma/client.ts';

const connectionString = process.env['DATABASE_URL'] ?? 'file:./dev.db';
const adapter = new PrismaBetterSqlite3({ url: connectionString });
const prisma = new PrismaClient({ adapter });

export { prisma };
```

Prisma 7 vaatii tietokanta-adapterin. SQLite-tietokannalle käytetään `@prisma/adapter-better-sqlite3`-adapteria. Prisma Client -instanssi luodaan yhteen paikkaan ja eksportataan, jolloin kaikki reitit käyttävät samaa yhteyttä.

### Vaihe 6: Salasanan tiivistäminen

Luodaan aputiedosto `luoSalasana.js` projektin juureen:

```javascript
import { createHash } from 'crypto';

const hash = createHash('SHA256').update('passu123').digest('hex');

console.log(hash);
```

`crypto` on Noden sisäänrakennettu moduuli, joka tarjoaa kryptografisia toimintoja. `createHash('SHA256')` luo SHA-256-tiivistäjän, `.update('passu123')` syöttää siihen datan ja `.digest('hex')` tuottaa tiivisteen heksadesimaalimerkkijonona.

Suoritetaan tiedosto:

```bash
node luoSalasana.js
```

Terminaaliin tulostuu 64 merkkiä pitkä heksamerkkijono. Tätä tiivistettä käytetään testikäyttäjän salasanana tietokannassa.

### Vaihe 7: Testikäyttäjän luominen

Luodaan `luoTestiKayttaja.ts` projektin juureen:

```typescript
// Lisää testikäyttäjän tietokantaan.
// Aja komennolla: npx tsx luoTestiKayttaja.ts
import { createHash } from 'crypto';
import { prisma } from './lib/prisma.ts';

const hash = createHash('SHA256').update('passu123').digest('hex');

await prisma.kayttaja.upsert({
    where: { kayttajatunnus: 'juuseri' },
    update: { salasana: hash },
    create: { kayttajatunnus: 'juuseri', salasana: hash },
});

console.log('Testikäyttäjä luotu: juuseri / passu123');

await prisma.$disconnect();
```

`upsert` on Prisman metodi, joka joko päivittää olemassa olevan tietueen (`update`) tai luo uuden (`create`), riippuen siitä löytyykö `where`-ehdon mukaista tietuetta. Tämä on turvallinen tapa luoda testidataa: skriptin voi ajaa useita kertoja ilman duplikaatteja.

Suoritetaan tiedosto:

```bash
npx tsx luoTestiKayttaja.ts
```

### Vaihe 8: Virhekäsittelijä

Luodaan kansio `errors` ja tiedosto `errors/virhekasittelija.ts`:

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

const virhekasittelija = (
    err: Virhe,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
): void => {
    res.status(err.status).json({ viesti: err.viesti });
};

export default virhekasittelija;
```

Virhekäsittelijä on sama kuin aiemmissa demoissa. Express 5 propagoi `async`-reiteistä heitetyt virheet automaattisesti virhekäsittelijälle, joten reiteissä ei tarvita erillisiä `try/catch`-lohkoja.

### Vaihe 9: Kirjautumisreitti

Luodaan kansio `routes` ja tiedosto `routes/apiAuth.ts`:

```typescript
import express from 'express';
import { createHash } from 'crypto';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma.ts';
import { Virhe } from '../errors/virhekasittelija.ts';

const apiAuthRouter: express.Router = express.Router();
apiAuthRouter.use(express.json());

// POST /api/auth/login — tarkistaa tunnukset ja palauttaa JWT-tokenin
apiAuthRouter.post('/login', async (req: express.Request, res: express.Response) => {
    const kayttaja = await prisma.kayttaja.findFirst({
        where: { kayttajatunnus: req.body.kayttajatunnus as string },
    });

    if (!kayttaja) throw new Virhe(401, 'Virheellinen käyttäjätunnus tai salasana');

    const hash = createHash('SHA256').update(req.body.salasana as string).digest('hex');

    if (hash !== kayttaja.salasana) throw new Virhe(401, 'Virheellinen käyttäjätunnus tai salasana');

    const token = jwt.sign({ id: kayttaja.id }, 'ToinenSalausLause_25');

    res.json({ token });
});

export default apiAuthRouter;
```

**Kirjautumisen kulku:**

1. Haetaan tietokannasta käyttäjä annetulla käyttäjätunnuksella (`findFirst`)
2. Jos käyttäjää ei löydy, heitetään `401`-virhe
3. Lasketaan lähetetystä salasanasta SHA-256-tiiviste
4. Verrataan tiivistettä tietokannassa olevaan tiivisteeseen
5. Jos tiivisteet eivät täsmää, heitetään `401`-virhe
6. Jos kaikki on ok, luodaan JWT-token käyttäjän id:llä ja palautetaan se

Virheviesti on tarkoituksella sama molemmissa tapauksissa ("Virheellinen käyttäjätunnus tai salasana"). Näin hyökkääjä ei saa tietoa siitä, onko käyttäjätunnus oikea vai väärä.

`jwt.sign({ id: kayttaja.id }, 'ToinenSalausLause_25')` luo tokenin, jonka payload sisältää käyttäjän id:n. Salaisen avaimen tulee olla sama kuin `checkToken`-middlewaressa.

> **Huomio:** Express 5 propagoi `async`-funktioissa heitetyt virheet automaattisesti virhekäsittelijälle. Siksi reiteissä ei tarvita `try/catch`-lohkoja eikä `next(error)`-kutsuja.

### Vaihe 10: Ostoslistareitit

Luodaan `routes/apiOstokset.ts`:

```typescript
import express from 'express';
import { prisma } from '../lib/prisma.ts';
import { Virhe } from '../errors/virhekasittelija.ts';

const apiOstoksetRouter: express.Router = express.Router();
apiOstoksetRouter.use(express.json());

// Haetaan kaikki ostokset
apiOstoksetRouter.get('/', async (_req: express.Request, res: express.Response) => {
    const ostokset = await prisma.ostos.findMany();
    res.json(ostokset);
});

// Haetaan yksittäinen ostos
apiOstoksetRouter.get('/:id', async (req: express.Request, res: express.Response) => {
    const ostos = await prisma.ostos.findUnique({ where: { id: Number(req.params['id']) } });
    if (!ostos) throw new Virhe(404, 'Ostosta ei löytynyt');
    res.json(ostos);
});

// Lisätään uusi ostos
apiOstoksetRouter.post('/', async (req: express.Request, res: express.Response) => {
    if (!req.body.tuote) throw new Virhe(400, 'Virheellinen pyynnön body');
    await prisma.ostos.create({
        data: {
            tuote: req.body.tuote as string,
            poimittu: false,
        },
    });
    const ostokset = await prisma.ostos.findMany();
    res.status(201).json(ostokset);
});

// Päivitetään ostos
apiOstoksetRouter.put('/:id', async (req: express.Request, res: express.Response) => {
    const ostos = await prisma.ostos.findUnique({ where: { id: Number(req.params['id']) } });
    if (!ostos) throw new Virhe(404, 'Ostosta ei löydy');
    if (req.body.tuote === undefined && req.body.poimittu === undefined) {
        throw new Virhe(400, 'Virheellinen pyynnön body');
    }
    const paivitettyOstos = await prisma.ostos.update({
        where: { id: Number(req.params['id']) },
        data: {
            tuote: req.body.tuote ?? ostos.tuote,
            poimittu: req.body.poimittu ?? ostos.poimittu,
        },
    });
    res.json(paivitettyOstos);
});

// Poistetaan ostos ja palautetaan päivitetty lista
apiOstoksetRouter.delete('/:id', async (req: express.Request, res: express.Response) => {
    const ostos = await prisma.ostos.findUnique({ where: { id: Number(req.params['id']) } });
    if (!ostos) throw new Virhe(404, 'Ostosta ei löytynyt');
    await prisma.ostos.delete({ where: { id: Number(req.params['id']) } });
    const ostokset = await prisma.ostos.findMany();
    res.json(ostokset);
});

export default apiOstoksetRouter;
```

Ostoslistareitit ovat samat kuin demossa 7. Tärkeä ero: nämä reitit ovat `checkToken`-middlewaren takana, joten vain validilla tokenilla varustetut pyynnöt pääsevät näihin reitteihin.

### Vaihe 11: Pääpalvelintiedosto

Luodaan `index.ts` projektin juureen:

```typescript
import express from 'express';
import path from 'path';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import apiAuthRouter from './routes/apiAuth.ts';
import apiOstoksetRouter from './routes/apiOstokset.ts';
import virhekasittelija from './errors/virhekasittelija.ts';

const app: express.Application = express();

const portti: number = Number(process.env.PORT) || 3008;

// JWT-tarkistus middlewarena — käytetään vain suojatuissa reiteissä
const checkToken = (req: express.Request, res: express.Response, next: express.NextFunction): void => {
    try {
        const token: string = req.headers.authorization!.split(' ')[1]!;
        jwt.verify(token, 'ToinenSalausLause_25');
        next();
    } catch (_e) {
        res.status(401).json({ viesti: 'Virheellinen tai puuttuva token' });
    }
};

// Sallitaan CORS asiakassovellukselle (Vite-kehityspalvelin portissa 3000)
app.use(cors({ origin: 'http://localhost:3000' }));

// Simuloidaan verkkoviivettä kehitystä varten
app.use((_req: express.Request, _res: express.Response, next: express.NextFunction) => {
    setTimeout(() => next(), 500);
});

app.use(express.static(path.resolve(import.meta.dirname, 'public')));

// Kirjautumisreitti — ei vaadi tokenia
app.use('/api/auth', apiAuthRouter);

// Ostoslistareitti — vaatii tokenin (checkToken-middleware ennen reittikäsittelijää)
app.use('/api/ostokset', checkToken, apiOstoksetRouter);

app.use(virhekasittelija);

// 404-käsittelijä — tuntematon reitti
app.use((_req: express.Request, res: express.Response, next: express.NextFunction): void => {
    if (!res.headersSent) {
        res.status(404).json({ viesti: 'Virheellinen reitti' });
    }
    next();
});

app.listen(portti, (): void => {
    console.log(`Palvelin käynnistettiin osoitteeseen http://localhost:${portti}`);
});
```

**Keskeiset erot demo 7:ään verrattuna:**

**`checkToken` on nimetty funktio** eikä anonyymi middleware. Demossa 7 JWT-tarkistus tehtiin `app.use()`-kutsulla kaikille reiteille. Demossa 8 se on erillinen funktio, joka liitetään vain ostoslistareitteihin:

```typescript
app.use('/api/auth', apiAuthRouter);                    // Ei tokenia
app.use('/api/ostokset', checkToken, apiOstoksetRouter); // Token vaaditaan
```

Tämä mahdollistaa sen, että kirjautumisreitti toimii ilman tokenia, mutta ostoslistareitit vaativat sen.

**Viivemiddleware** (`setTimeout(() => next(), 500)`) simuloi verkkoviivettä kehityskäytössä. Se lisää jokaiseen pyyntöön 500 millisekunnin viiveen, jolloin asiakassovelluksen latausanimaatio (spinner) näkyy selkeästi. Tämä ei ole tuotantokoodia — se on vain kehitystyökalu, joka auttaa havainnollistamaan asynkronisen datan latauksen käyttöliittymässä.

**`import.meta.dirname`** korvaa CommonJS:n `__dirname`-muuttujan ESM-moduuleissa. Se palauttaa nykyisen tiedoston kansion absoluuttisen polun.

**404-käsittelijä** on viimeisenä middleware-ketjussa. Se käsittelee pyynnöt, jotka eivät osuneet mihinkään reittiin. `res.headersSent`-tarkistus varmistaa, ettei vastausta yritetä lähettää uudelleen, jos jokin aiempi middleware on jo vastannut.

---

## 3. Muistilista

### Autentikoinnin kulku

```
1. Käyttäjä lähettää POST /api/auth/login { kayttajatunnus, salasana }
2. Palvelin hakee käyttäjän tietokannasta
3. Palvelin laskee salasanasta SHA-256-tiivisteen
4. Palvelin vertaa tiivistettä tietokannassa olevaan
5. Jos ok → palvelin luo JWT-tokenin ja palauttaa sen
6. Asiakassovellus tallentaa tokenin
7. Seuraavissa pyynnöissä token lähetetään Authorization-headerissa
```

### JWT-tokenin käyttö

| Toiminto | Koodi |
|---|---|
| Tokenin luonti | `jwt.sign({ id: kayttaja.id }, salaisuus)` |
| Tokenin tarkistus | `jwt.verify(token, salaisuus)` |
| Token headerissa | `Authorization: Bearer <token>` |
| Tokenin irrottaminen | `req.headers.authorization!.split(' ')[1]!` |

### SHA-256-tiivistäminen

| Toiminto | Koodi |
|---|---|
| Tiivisteen luonti | `createHash('SHA256').update(salasana).digest('hex')` |
| Moduuli | `import { createHash } from 'crypto'` |

### HTTP-statuskoodit

| Koodi | Merkitys |
|---|---|
| `200` | OK |
| `201` | Created (uusi resurssi luotu) |
| `400` | Virheellinen pyyntö |
| `401` | Unauthorized (puuttuva tai virheellinen token / tunnukset) |
| `404` | Reittiä tai resurssia ei löydy |
| `500` | Palvelinvirhe |

---

## Projektin lopullinen rakenne

```
demo08/
├── server/
│   ├── errors/
│   │   └── virhekasittelija.ts          # Virhekäsittelijä-middleware
│   ├── generated/
│   │   └── prisma/                      # Prisma 7:n generoima client
│   │       └── client.ts
│   ├── lib/
│   │   └── prisma.ts                    # Prisma Client -instanssi adapterilla
│   ├── prisma/
│   │   ├── schema.prisma                # Tietomalli (Ostos + Kayttaja)
│   │   ├── dev.db                       # SQLite-tietokantatiedosto
│   │   └── migrations/                  # Migraatiot
│   ├── routes/
│   │   ├── apiAuth.ts                   # Kirjautumisreitti
│   │   └── apiOstokset.ts              # Ostoslistan API-reitit
│   ├── .env                             # Ympäristömuuttujat
│   ├── index.ts                         # Palvelimen pääohjelma ja JWT-middleware
│   ├── luoSalasana.js                   # Salasanatiivisteen luontiskripti
│   ├── luoTestiKayttaja.ts             # Testikäyttäjän luontiskripti
│   ├── prisma.config.ts                 # Prisma 7 -konfiguraatio
│   ├── tsconfig.json                    # TypeScript-asetukset
│   └── package.json                     # Riippuvuudet ja skriptit
└── client/                              # Asiakassovellus (ks. client/README.md)
```

---

## Sovelluksen käynnistys

**1. Asenna palvelimen riippuvuudet:**

```bash
cd demo08/server
npm install
```

**2. Alusta tietokanta:**

```bash
npx prisma migrate dev --name init
```

**3. Luo testikäyttäjä:**

```bash
npx tsx luoTestiKayttaja.ts
```

Terminaaliin tulostuu: `Testikäyttäjä luotu: juuseri / passu123`

**4. Käynnistä palvelin (ensimmäinen terminaali):**

```bash
npm run dev
```

Palvelin käynnistyy osoitteeseen `http://localhost:3008`.

**5. Asenna ja käynnistä asiakassovellus (toinen terminaali):**

```bash
cd demo08/client
npm install
npm run dev
```

Asiakassovellus käynnistyy osoitteeseen `http://localhost:3000`.

**6. Testaa sovellusta:** avaa `http://localhost:3000` selaimessa. Sovellus ohjaa kirjautumissivulle, koska tokenia ei ole vielä tallennettu. Kirjaudu testitunnuksilla: käyttäjä `juuseri`, salasana `passu123`.
