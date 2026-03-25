# Demo 7: JWT-autorisointi

## 1. Lähtötilanne ja motivaatio

Demo 7 jatkaa demo 6:n ostoslista-sovelluksesta. Edellisessä demossa palvelin suojattiin CORS-middlewarella, joka rajoittaa selainsovelluksien pääsyä eri originista. Tämä ei kuitenkaan estä pyyntöjä Postman-ohjelmasta tai komentorivityökaluista kuten `curl` — ne eivät välitä CORS-säännöistä lainkaan.

Tässä demossa otetaan käyttöön JWT-pohjainen (JSON Web Token) autorisointi, joka toimii palvelinpuolella. Palvelin tarkistaa jokaisen pyynnön yhteydessä, että mukana on oikea token. Ilman tokenia pyyntö hylätään — oli lähettäjä sitten selain, Postman tai mikä tahansa muu ohjelma.

Sovelluksen REST API -päätepisteet ovat samat kuin demo 6:ssa:

| Metodi | Polku                  | Toiminto                                            |
|--------|------------------------|-----------------------------------------------------|
| GET    | /api/ostokset          | Palauttaa kaikki ostokset                           |
| GET    | /api/ostokset/:id      | Palauttaa yksittäisen ostoksen                      |
| POST   | /api/ostokset          | Lisää uuden ostoksen, palauttaa päivitetyn listan   |
| PUT    | /api/ostokset/:id      | Päivittää ostoksen kentät                           |
| DELETE | /api/ostokset/:id      | Poistaa ostoksen, palauttaa päivitetyn listan       |

---

## 2. JWT:n perusteet

### Mikä JWT on?

JSON Web Token (JWT) on avoimen standardin mukainen tapa siirtää tietoa turvallisesti osapuolten välillä kompaktina merkkijonona. Token on digitaalisesti allekirjoitettu, joten sen aitous voidaan varmistaa.

JWT koostuu kolmesta pisteellä (`.`) erotetusta osasta:

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3NDIyMDMzNDh9.0OqTw4sohQE6UdVF8nRAAiMOwNK95mSwPOCbdgLjmgo
```

| Osa           | Sisältö                                                        |
|---------------|----------------------------------------------------------------|
| **Header**    | Käytetty salausalgoritmi (esim. `HS256`)                       |
| **Payload**   | Varsinainen data — voi sisältää mitä tahansa JSON-kenttää      |
| **Signature** | Digitaalinen allekirjoitus, joka varmistaa tokenin aitouden    |

Tärkeä periaate: vain salaisen avaimen haltija voi luoda oikeita tokeneita. Kuka tahansa voi _lukea_ tokenin sisällön, mutta allekirjoitusta ei voi väärentää ilman avainta.

### Autorisointi vs. autentikointi

Nämä kaksi käsitettä sekoitetaan usein:

- **Autentikointi** — *kuka olet?* (esim. kirjautuminen käyttäjätunnuksella ja salasanalla)
- **Autorisointi** — *mihin sinulla on oikeus?* (esim. onko sinulla lupa käyttää tätä API:a)

Tässä demossa toteutetaan vain autorisointi: palvelin ei vielä tunnista käyttäjiä, mutta se tarkistaa, että pyyntöön on liitetty oikea token. Seuraavassa demossa lisätään myös autentikointi.

### Miksi JWT on parempi kuin pelkkä CORS?

| Ominaisuus               | CORS                          | JWT                              |
|--------------------------|-------------------------------|----------------------------------|
| Suojaa selainsovelluksia | Kyllä                         | Kyllä                            |
| Suojaa Postmanilta       | Ei                            | Kyllä                            |
| Suojaa curl-pyynnöiltä   | Ei                            | Kyllä                            |
| Toteutetaan palvelimella | Ei (selain tarkistaa)         | Kyllä                            |

---

## 3. Demosovelluksen rakentuminen vaihe vaiheelta

### Vaihe 1: Projektin alustaminen

Luodaan palvelimelle oma kansio demo07:n sisälle:

```bash
mkdir demo07/server
cd demo07/server
```

Alustetaan Node.js-projekti:

```bash
npm init -y
```

### Vaihe 2: Riippuvuuksien asentaminen

Demo 7 perustuu demo 6:n rakenteeseen. Uutena pakettina lisätään `jsonwebtoken`:

```bash
npm install express cors jsonwebtoken
npm install --save-dev typescript tsx @types/node @types/express @types/cors @types/jsonwebtoken

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
    "@types/jsonwebtoken": "^9.x.x",
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
    "express": "^5.x.x",
    "jsonwebtoken": "^9.x.x"
  }
}
```

### Vaihe 3: TypeScript-konfiguraatio

`tsconfig.json` on identtinen demo 6:n konfiguraation kanssa:

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

### Vaihe 4: Prisma-projektin alustaminen

Alustetaan Prisma SQLite-tietokannalla:

```bash
npx prisma init --datasource-provider sqlite --output ../generated/prisma
```

`.env`-tiedostossa määritetään tietokantatiedoston polku:

```
DATABASE_URL="file:./dev.db"
```

### Vaihe 5: Tietomallin määrittely (prisma/schema.prisma)

`Ostos`-malli on identtinen demo 6:n kanssa:

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

### Vaihe 6: Migraatio ja Prisma Clientin generointi

```bash
npx prisma migrate dev --name init
npx prisma generate
```

### Vaihe 7: Prisma Clientin alustus (lib/prisma.ts)

Tiedosto on identtinen demo 6:n kanssa:

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

Kopioidaan virhekäsittelijä demo 6:sta sellaisenaan:

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

Reitit ovat identtiset demo 6:n kanssa — JWT-tarkistus tapahtuu ennen reittejä palvelimen pääohjelmassa, joten reittitiedostoon ei tarvita muutoksia:

```typescript
import express from 'express';
import { prisma } from '../lib/prisma';
import { Virhe } from '../errors/virhekasittelija';

const apiOstoksetRouter: express.Router = express.Router();
apiOstoksetRouter.use(express.json());

apiOstoksetRouter.get('/', async (_req: express.Request, res: express.Response) => {
    const ostokset = await prisma.ostos.findMany();
    res.json(ostokset);
});

apiOstoksetRouter.get('/:id', async (req: express.Request, res: express.Response) => {
    const ostos = await prisma.ostos.findUnique({ where: { id: Number(req.params['id']) } });
    if (!ostos) throw new Virhe(404, 'Ostosta ei löytynyt');
    res.json(ostos);
});

apiOstoksetRouter.post('/', async (req: express.Request, res: express.Response) => {
    if (!req.body.tuote) throw new Virhe(400, 'Virheellinen pyynnön body');
    await prisma.ostos.create({ data: { tuote: req.body.tuote, poimittu: false } });
    const ostokset = await prisma.ostos.findMany();
    res.status(201).json(ostokset);
});

apiOstoksetRouter.put('/:id', async (req: express.Request, res: express.Response) => {
    const ostos = await prisma.ostos.findUnique({ where: { id: Number(req.params['id']) } });
    if (!ostos) throw new Virhe(404, 'Ostosta ei löydy');
    if (req.body.tuote === undefined && req.body.poimittu === undefined) throw new Virhe(400, 'Virheellinen pyynnön body');
    const paivitettyOstos = await prisma.ostos.update({
        where: { id: Number(req.params['id']) },
        data: {
            tuote: req.body.tuote ?? ostos.tuote,
            poimittu: req.body.poimittu ?? ostos.poimittu,
        },
    });
    res.json(paivitettyOstos);
});

apiOstoksetRouter.delete('/:id', async (req: express.Request, res: express.Response) => {
    const ostos = await prisma.ostos.findUnique({ where: { id: Number(req.params['id']) } });
    if (!ostos) throw new Virhe(404, 'Ostosta ei löytynyt');
    await prisma.ostos.delete({ where: { id: Number(req.params['id']) } });
    const ostokset = await prisma.ostos.findMany();
    res.json(ostokset);
});

export default apiOstoksetRouter;
```

### Vaihe 10: JWT-tokenin luominen (luoJWT.js)

Ennen palvelimen pääohjelman kirjoittamista tarvitaan token, joka kovakoodataan demoamistarkoituksessa asiakassovellukseen. Token luodaan erillisellä apuohjelmalla.

Luodaan palvelinsovelluksen juureen tiedosto `luoJWT.js`. Tiedosto on tavallista JavaScript-koodia, jotta se voidaan suorittaa suoraan Node.js:llä:

```javascript
import jwt from 'jsonwebtoken';

const token = jwt.sign({}, 'SalausLause_25');

console.log(token);
```

Tiedoston toiminta:

1. Tuodaan `jsonwebtoken`-kirjasto ES-moduuli-importilla
2. Kutsutaan `sign`-metodia kahdella argumentilla:
   - Tyhjä objekti `{}` — payload, joka voi sisältää mitä tahansa dataa (tässä tyhjä)
   - Merkkijono `'SalausLause_25'` — salainen avain, jolla token allekirjoitetaan
3. Tulostetaan luotu token konsoliin

Suoritetaan ohjelma terminaalissa:

```bash
node luoJWT.js
```

Ohjelma tulostaa pitkän merkkijonon, esimerkiksi:

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3NDIyMDMzNDh9.0OqTw4sohQE6UdVF8nRAAiMOwNK95mSwPOCbdgLjmgo
```

Tämä token kopioidaan talteen — sitä tarvitaan Postman-testauksessa ja myöhemmin asiakassovelluksessa.

**Huomio salaisesta avaimesta:** `'SalausLause_25'` on esimerkki. Oikeassa tuotantosovelluksessa käytettäisiin ympäristömuuttujaa (`process.env.JWT_SECRET`), ei koodiin kovakoodattua arvoa.

### Vaihe 11: Palvelimen pääohjelma (index.ts)

Tässä on tämän demon ydinmuutos demo 6:een verrattuna. Palvelimen pääohjelmaan lisätään JWT-middleware ennen reittejä:

```typescript
import express from 'express';
import path from 'path';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import apiOstoksetRouter from './routes/apiOstokset';
import virhekasittelija from './errors/virhekasittelija';

const app: express.Application = express();

const portti: number = Number(process.env.PORT) || 3007;

// Sallitaan CORS asiakassovelluksille (Vite-kehityspalvelin portissa 3000)
app.use(cors({ origin: 'http://localhost:3000' }));

// JWT-autorisoinnin middleware — tarkistaa jokaisen pyynnön tokenin
app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
        // Poimitaan Authorization-headerista token (muoto: "Bearer <token>")
        const token: string = req.headers.authorization!.split(' ')[1]!;

        // Varmennetaan token salaisen avaimen avulla
        jwt.verify(token, 'SalausLause_25');

        // Jos token on oikea, päästetään pyyntö eteenpäin
        next();
    } catch (_e) {
        // Token puuttuu tai on väärä → 401 Unauthorized
        res.status(401).json({ viesti: 'Virheellinen token' });
    }
});

app.use((_req: express.Request, _res: express.Response, next: express.NextFunction) => {
    setTimeout(() => next(), 500);
});

app.use(express.static(path.resolve(import.meta.dirname, 'public')));

app.use('/api/ostokset', apiOstoksetRouter);

app.use(virhekasittelija);

app.listen(portti, (): void => {
    console.log(`Palvelin käynnistettiin osoitteeseen http://localhost:${portti}`);
});
```

### JWT-middlewaren toiminta vaihe vaiheelta

```typescript
const token: string = req.headers.authorization!.split(' ')[1]!;
```

- Pyynnön `Authorization`-headerista luetaan arvo
- Header on muotoa: `"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."`
- `split(' ')` jakaa merkkijonon välilyönnistä taulukkoon `["Bearer", "token..."]`
- Indeksillä `[1]` poimitaan varsinainen token ilman `"Bearer"`-etuliitettä
- Huutomerkki `!` kertoo TypeScriptille, että arvo ei ole `undefined`

```typescript
jwt.verify(token, 'SalausLause_25');
```

- `verify`-metodi tarkistaa, että token on allekirjoitettu samalla salaisella avaimella
- Jos token täsmää, suoritus jatkuu normaalisti `next()`-kutsuun
- Jos token on väärä tai puuttuu, metodi heittää poikkeuksen ja siirrytään `catch`-lohkoon

```typescript
catch (_e) {
    res.status(401).json({ viesti: 'Virheellinen token' });
}
```

- Palautetaan HTTP 401 (Unauthorized) -statuskoodi virheviestin kera
- Pyyntö loppuu tähän, eikä se pääse eteenpäin reittikäsittelijöille

**Middlewaren sijainti on kriittinen:** JWT-tarkistus on sijoitettu CORS-asetuksen jälkeen, mutta ennen reittejä. Näin jokainen pyyntö käy automaattisesti läpi autorisoinnin.

### Vaihe 12: Palvelimen käynnistäminen

```bash
npm run dev
```

Palvelin käynnistyy osoitteeseen `http://localhost:3007`.

---

## 4. Testaaminen Postmanilla

### Pyyntö ilman tokenia

Tehdään GET-pyyntö `http://localhost:3007/api/ostokset` ilman Authorization-headeria:

- Vastaus: `401 Unauthorized`
- Body: `{ "viesti": "Virheellinen token" }`

Palvelin hylkää pyynnön, koska Authorization-headeria ei ole.

### Tokenin lisääminen Postmaniin

1. Valitaan "Authorization"-välilehti Postmanissa
2. Valitaan tyypiksi "Bearer Token"
3. Syötetään aiemmin `luoJWT.js`-ohjelmalla generoitu token

Tai vaihtoehtoisesti "Headers"-välilehdellä:
- Key: `Authorization`
- Value: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (koko token)

Nyt pyyntö menee läpi ja ostokset palautuvat normaalisti.

### Testaus väärällä tokenilla

Muokataan tokenista pari merkkiä (esim. vaihdetaan loppuosa), jolloin allekirjoitus ei enää täsmää:

- Vastaus: `401 Unauthorized`
- Body: `{ "viesti": "Virheellinen token" }`

---

## 5. Tietoturvahuomioita

### Tämän toteutuksen rajoitteet

Tässä demossa on tarkoituksellisia yksinkertaistuksia, jotka eivät sovellu tuotantokäyttöön:

1. **Salainen avain on kovakoodattu** — oikeasti se pitäisi lukea ympäristömuuttujasta `process.env.JWT_SECRET`
2. **Tokenilla ei ole vanhentumisaikaa** — oikeassa sovelluksessa token asetetaan vanhenemaan (esim. `{ expiresIn: '1h' }`)
3. **Kaikki käyttävät samaa tokenia** — oikeassa sovelluksessa jokainen käyttäjä saa oman tokenin kirjautuessaan sisään

### Seuraavaan demoon

Seuraavassa demossa toteutetaan turvallisempi ratkaisu:

1. Käyttäjä kirjautuu sisään lähettämällä käyttäjätunnuksen ja salasanan
2. Palvelin luo kirjautumisen yhteydessä käyttäjäkohtaisen tokenin
3. Token palautetaan asiakassovellukselle, joka tallentaa sen ja lähettää sen mukana jatkossa

Tässä demossa opittiin JWT:n perusperiaatteet: miten token luodaan, miten se varmennetaan ja miten middleware-rakenne toimii. Nämä perustat pysyvät samoina myös monimutkaisemmissa toteutuksissa.

---

## 6. Asiakassovellus

React-asiakassovelluksen rakentamisohjeet löytyvät erillisestä dokumentista:

### [Asiakassovelluksen ohjeistus →](./client/README.md)
