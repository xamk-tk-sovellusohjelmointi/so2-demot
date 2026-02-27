# Demo 5: REST API ja Prisma ORM

## 1. ORM ja Prisma

### Mitä relaatiotietokannat ovat?

Relaatiotietokanta on tapa tallentaa sovelluksen tietoja pysyvään muistiin. Tietokanta tallentaa tiedot tauluihin, joiden rakenne on ennalta määritelty. Jokainen taulurivi on yksittäinen tietue ja sarakkeet määrittävät tietueen kentät. Tietokannan kanssa kommunikoidaan SQL-kielellä (Structured Query Language). SQL-lausekkeet `SELECT`, `INSERT`, `UPDATE` ja `DELETE` vastaavat REST API:n HTTP-metodeja GET, POST, PUT ja DELETE.

| id | reitti | km | ajaja | pvm |
| -- | -- | -- | -- | -- |
| 1 | "Mikkeli-Juva-Mikkeli" | 86 | "A12" | "4.3.2025" |
| 2 | ... | ... | ... | ... |

Node.js-sovelluksessa tietokannan käyttö ilman apukirjastoja vaatisi, että ohjelmakoodissa käsitellään SQL-merkkijonoja sellaisenaan. Tähän liittyy useita haasteita:

- SQL-kyselyt kirjoitetaan merkkijonoina, eikä TypeScriptin tyyppijärjestelmä voi tarkistaa niiden oikeellisuutta käännösvaiheessa.
- Tietokannasta palautuva tulos on tyypiltään `any` tai geneerinen objekti, jolloin kenttien oikeellisuus ei ole tyyppiturvallista.
- SQL-injektiohaavoittuvuuksien välttäminen vaatii huolellista parametrien käsittelyä erikseen.

### ORM

ORM (Object-Relational Mapper) on kirjasto, jonka avulla tietokantaa voidaan käsitellä ohjelmointikielen omilla rakenteilla SQL-merkkijonojen sijaan. ORM kääntää TypeScript-metodikutsut automaattisesti SQL-lausekkeiksi ja muuntaa tietokannasta palautuvan tuloksen TypeScript-objekteiksi.

Näin tietokantaa voidaan käyttää täysin TypeScript-syntaksilla, ja TypeScript voi tarkistaa kyselyiden oikeellisuuden käännösvaiheessa.

### Prisma ORM

Prisma on TypeScript-pohjainen ORM. Se koostuu kolmesta pääkomponentista:

**1. Prisma Schema** (`prisma/schema.prisma`) on tietomallin määrittelytiedosto. Siihen kirjoitetaan tietomallien rakenne Prisman omalla kielellä. Schema toimii sekä tietokannan rakenteen lähteenä, että TypeScript-tyyppien pohjana.

**2. Prisma Migrate** on migraatiotyökalu. Kun schemaan tehdään muutos, `prisma migrate dev` luo uuden migraatiotiedoston ja ajaa sen tietokantaan. Migraatiot ovat versionhallittuja SQL-tiedostoja, jotka kuvaavat tietokannan rakenteen muutoshistoriaa.

**3. Prisma Client** on schemasta generoitu TypeScript-kirjasto. `prisma generate` -komento tuottaa tyyppiturvallisen rajapinnan tietokannan käsittelyyn. Koska client generoidaan schemasta, TypeScript tietää tarkalleen jokaisen mallin kentät ja niiden tyypit.

### Prisma 7:n muutokset

Jos olet käyttänyt Prismaa aiemmin vanhemmilla versioilla, oppimasi työnkulku poikkeaa Prisman nykyisestä versiosta. Prisma 7 muutti useita keskeisiä toimintatapoja verrattuna aikaisempiin versioihin.

**Uusi `prisma-client`-generaattori**

Vanhemmissa versioissa schemassa käytettiin `provider = "prisma-client-js"`. Prisma 7:ssä tämä on korvattu `provider = "prisma-client"`:lla. Uusi generaattori tuottaa pienemmän ja nopeamman clientin.

**Pakollinen `output`-kenttä**

Vanhemmissa versioissa Prisma Client generoitui automaattisesti `node_modules/@prisma/client`-polkuun ilman erillistä määrittelyä. Prisma 7:ssä generaattoriin on aina kirjoitettava eksplisiittinen `output`-kenttä, joka osoittaa generoitavan clientin sijainnin projektin hakemistorakenteessa.

**Pakollinen Driver adapter**

Prisma 7:ssä jokainen tietokantayhteys vaatii eksplisiittisen "ajurisovittimen" (driver adapter). SQLitelle käytetään `@prisma/adapter-better-sqlite3`-pakettia. `PrismaClient`:n ilmentymä luodaan antamalla sille adapteri-ilmentymä `PrismaClient`-muodostimen (constructor) parametrina. Ilman adapteria Prisma 7:n client ei toimi.

**`prisma.config.ts`-konfiguraatiotiedosto**

Vanhemmissa versioissa Prisma CLI luki tietokantaosoitteen suoraan `schema.prisma`-tiedoston datasource-lohkon `url`-kentästä. Prisma 7:ssä CLI:n konfiguraatio on erotettu omaan `prisma.config.ts`-tiedostoon projektin juureen. Tiedosto sisältää viittauksen schemaan, migraatiopolun sekä tietokantaosoitteen.

### Demosovellus

Demo 5 on jatkoa demoille 3 ja 4. Sovellus toteuttaa saman ajopäiväkirjan REST API:n samoilla päätepisteillä, mutta taulukon sijasta ajot tallennetaan SQLite-tietokantaan Prisma ORM:n kautta.

Muutos näkyy erityisesti reittikäsittelijöissä. Demoissa 3 ja 4 reitit olivat synkronisia ja käyttivät JavaScriptin taulukkometodeja (`find`, `push`, `splice`). Demo 5:ssä reitit ovat asynkronisia ja käyttävät Prisma Clientin metodeja (`findMany`, `findUnique`, `create`, `update`, `delete`). Tietokannan tulos säilyy myös palvelimen uudelleenkäynnistyksen yli toisin kuin aiempien demojen taulukossa.

Sovelluksen REST API -päätepisteet pysyvät täsmälleen samoina kuin aiemmissa demoissa:

| Metodi | Polku                    | Toiminto                          |
|--------|--------------------------|-----------------------------------|
| GET    | /api/ajopaivakirja       | Palauttaa kaikki ajot             |
| GET    | /api/ajopaivakirja/:id   | Palauttaa yksittäisen ajon        |
| POST   | /api/ajopaivakirja       | Lisää uuden ajon                  |
| PUT    | /api/ajopaivakirja/:id   | Korvaa olemassa olevan ajon tiedot |
| DELETE | /api/ajopaivakirja/:id   | Poistaa ajon                      |

---

## 2. Demosovelluksen rakentuminen vaihe vaiheelta

### Vaihe 1: Projektin alustaminen

Luodaan projektille tyhjä kansio ja siirrytään siihen terminaalissa:

```bash
mkdir demo05
cd demo05
```

Alustetaan Node.js-projekti:

```bash
npm init -y
```

### Vaihe 2: Riippuvuuksien asentaminen

Demo 5 tarvitsee demojen 3 ja 4 peruspakettien lisäksi Prisma-kohtaisia paketteja:

```bash
npm install express
npm install --save-dev typescript tsx @types/node @types/express

# Uudet paketit
npm install --save-dev prisma @types/better-sqlite3
npm install @prisma/client @prisma/adapter-better-sqlite3 dotenv
```

**Kehitysriippuvuudet (`--save-dev`):**

- `prisma` on Prisma CLI -työkalu. Se sisältää komennot `prisma init`, `prisma migrate dev` ja `prisma generate`. CLI:tä tarvitaan vain kehitysvaiheessa, joten se asennetaan kehitysriippuvuutena.
- `@types/better-sqlite3` sisältää `better-sqlite3`-kirjaston TypeScript-tyypit. `better-sqlite3` on natiivi SQLite-ajuri, jota Prisma-adapteri käyttää sisäisesti. Ilman tyyppejä TypeScript ei tunnista adapterin rajapintaa.

**Suorituksen aikaiset riippuvuudet:**

- `@prisma/client` on Prisma Clientin runko. Se sisältää `PrismaClient`-luokan perustan, jonka päälle `prisma generate` rakentaa schemasta generoidun, tyyppiturvallisen clientin.
- `@prisma/adapter-better-sqlite3` on SQLite-ajurisovitin. Prisma 7:ssä tietokantayhteys avataan aina sovittimen (adapter) kautta. Sovitin välittää Prisma Clientin kyselyt `better-sqlite3`-kirjastolle, joka kommunikoi itse SQLite-tiedoston kanssa.
- `dotenv` lataa `.env`-tiedoston muuttujat `process.env`-objektiin. Prisma CLI ei lataa `.env`-tiedostoa automaattisesti, joten `prisma.config.ts` tuo `dotenv`:n itse.

Asennuksen jälkeen `package.json` tulisi näyttää tältä:

```json
{
  "name": "demo05",
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
    "@types/express": "^5.x.x",
    "@types/node": "^x.x.x",
    "prisma": "^7.x.x",
    "tsx": "^4.x.x",
    "typescript": "^5.x.x"
  },
  "dependencies": {
    "@prisma/adapter-better-sqlite3": "^7.x.x",
    "@prisma/client": "^7.x.x",
    "dotenv": "^x.x.x",
    "express": "^5.x.x"
  }
}
```

### Vaihe 3: TypeScript-konfiguraatio

Luodaan `tsconfig.json`. Asetukset ovat lähes identtiset demojen 3 ja 4 kanssa, mutta kaksi asetusta on poistettu Prisma-yhteensopivuuden vuoksi:

```json
{
  "compilerOptions": {
    "module": "preserve",
    "target": "esnext",
    "lib": ["esnext"],
    "types": ["node"],
    "sourceMap": true,
    "declaration": true,
    "declarationMap": true,
    "noUncheckedIndexedAccess": true,
    "strict": true,
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

Näistä ei tarvitse tässä vaiheessa ymmärtää mitään, mutta alla on kuitenkin selitetty syyt toimintamallille.

**Poistettu: `"exactOptionalPropertyTypes": true`**

Tämä asetus tiukentaa TypeScriptin vapaaehtoisten kenttien semantiikkaa niin, että `string | undefined` -tyyppistä arvoa ei voi sijoittaa `string?`-kenttään. Normaali TypeScript tulkitsee `string?` tarkoittamaan `string | undefined`, mutta `exactOptionalPropertyTypes`-asetuksella se tarkoittaa ainoastaan, että kenttä voidaan jättää pois kokonaan. Tästä seuraa, että `undefined`-arvoa ei voi antaa eksplisiittisesti.

Asetus rikkoo kaksi tavallista käyttötapausta tässä projektissa. Ensinnäkin `process.env["DATABASE_URL"]` on tyypiltään `string | undefined`, mutta Prisman `datasource.url`-kenttä on `string?`. Näiden välinen sijoitus epäonnistuu. Toiseksi tulevissa reiteissä Prisman `where`-lauseiden kentät saavat usein arvon `string | undefined`, ja sama ongelma toistuisi.

**Poistettu: `"jsx": "react-jsx"`**

JSX-asetus kuuluu React-projekteihin. Tässä Node.js-Express-palvelimessa ei ole `.tsx`-tiedostoja, joten asetus on tarpeeton.

### Vaihe 4: Käynnistysskriptit ja moduulimuoto

`package.json`:iin lisätään `"type": "module"` ja `scripts`-kenttä (tehty jo vaiheessa 2 `npm init`:n jälkeen manuaalisesti):

```json
{
  "type": "module",
  "scripts": {
    "start": "tsx index.ts",
    "dev": "tsx watch index.ts",
    "type-check": "tsc --noEmit"
  }
}
```

`"type": "module"` kertoo Node.js:lle, että projekti käyttää ES-moduulisyntaksia.

`"type-check": "tsc --noEmit"` on lisätty demoihin 3 ja 4 verrattuna. Se ajaa TypeScript-kääntäjän tyyppitarkistuksen tuottamatta käännettyä tiedostoa. Tämä on hyödyllinen kehitystyökalu virheiden löytämiseen ennen suoritusta. (ei tarvitse käyttää tai välittää tästä)

### Vaihe 5: Prisma-projektin alustaminen

Vaiheiden 5–9 työnkulku pohjautuu Prisman viralliseen dokumentaatioon. Sama asennusprosessi on kuvattu lyhyesti [Prisman SQLite-pikakäynnistysoppaassa](https://www.prisma.io/docs/getting-started/quickstart-sqlite), mutta tässä jokainen vaihe selitetään yksityiskohtaisemmin auki.

Luodaan Prisma-konfiguraatio komennolla:

```bash
npx prisma init --datasource-provider sqlite --output ../generated/prisma
```

`npx prisma init` luo kolme tiedostoa:

- `prisma/schema.prisma`: Tietomallien määrittelytiedosto. `--datasource-provider sqlite` asettaa tietokantatoimittajaksi SQLiten.
- `prisma.config.ts`: Prisma CLI:n konfiguraatiotiedosto projektin juureen.
- `.env`: Ympäristömuuttujatiedosto tietokantaosoitteelle.

`--output ../generated/prisma` asettaa Prisma Clientin generointipolun. Polku on suhteessa `prisma/`-kansion sijaintiin: `../generated/prisma` tarkoittaa projektin juuressa olevaa `generated/prisma/`-kansiota. Tämä on Prisma 7:n vaatima eksplisiittinen määrittely.

Alustuksen jälkeen `prisma/schema.prisma` näyttää tältä:

```prisma
generator client {
  provider = "prisma-client"
  output   = "../generated/prisma"
}

datasource db {
  provider = "sqlite"
}
```

`provider = "prisma-client"` on Prisma 7:n uusi generaattori. Datasource-lohkossa ei ole `url`-kenttää, koska tietokantaosoite on siirretty `prisma.config.ts`-tiedostoon.

### Vaihe 6: Prisma-konfiguraatiotiedosto (prisma.config.ts)

`npx prisma init` generoi `prisma.config.ts`:n automaattisesti. Tätä ei tarvitse muistaa tai osata ulkoa, mutta sisältö selitetään alla, jos kiinnostaa lukea. Tiedosto näyttää tältä:

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

`import "dotenv/config"` lataa `.env`-tiedoston muuttujat ennen kuin `process.env["DATABASE_URL"]` luetaan. Tämä on välttämätöntä, koska Prisma CLI ei lataa `.env`-tiedostoa itse.

`defineConfig` on Prisman apufunktio, joka tyypittää konfiguraatio-objektin. `schema`-kenttä osoittaa käytettävään schemaan, `migrations.path` migraatiotiedostojen kansioon ja `datasource.url` tietokantaosoitteeseen.

Tietokantaosoite luetaan `.env`-tiedostosta:

```
DATABASE_URL="file:./dev.db"
```

`file:./dev.db` määrittää tietokannan sijainnin. `./` viittaa projektin juurikansioon. Prisma luo `dev.db`-tiedoston automaattisesti ensimmäisen migraation yhteydessä.

### Vaihe 7: Tietomallin määrittely (prisma/schema.prisma)

Lisätään `Ajo`-malli schemaan:

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

`model Ajo` määrittelee tietokantamallin. Prisman malli vastaa sekä tietokantataulua että TypeScript-tyyppiä.

Kenttien selitykset:

| Kenttä | Prisma-tyyppi | TypeScript-tyyppi | Huomio |
|--------|--------------|-------------------|--------|
| `id`   | `Int`        | `number`          | `@id` määrittää kentän tietokantataulun pääavaimeksi (Primary Key), `@default(autoincrement())` kasvattaa arvoa automaattisesti |
| `reitti` | `String`   | `string`          |  |
| `km`   | `Int`        | `number`          |  |
| `ajaja` | `String`   | `string`          |  |
| `pvm`  | `DateTime`   | `Date`            | `@default(now())` asettaa päivämäärän arvoksi luontihetken automaattisesti. Verrattuna aiempiin demoihin nyt päivämäärä tallennetaan suoraan Date-ohjektina |

`@id` määrittää kentän pääavaimeksi. Jokaisessa Prisma-mallissa on oltava täsmälleen yksi pääavain.

`@default(autoincrement())` kasvattaa `id`-arvoa automaattisesti yhdellä jokaiselle uudelle tietueelle. Tietokanta huolehtii yksilöllisistä tunnuksista, eikä ohjelmakoodin tarvitse laskea niitä itse kuten demoissa 3 ja 4.

`@default(now())` asettaa `pvm`-kentän arvoksi tietueen luontihetken päivämäärän ja ajan automaattisesti. Arvo on `DateTime`-tyyppi, joka vastaa JavaScriptin `Date`-objektia.

Demoissa 3 ja 4 `pvm` oli merkkijono (`string`), joka muotoiltiin heti luontihetkellä suomalaiseksi päivämääräksi. Demo 5:ssä `pvm` on `Date`-objekti, jonka voi muotoilla tarvittaessa: `pvm.toLocaleDateString("fi-FI")`.

### Vaihe 8: Migraatio ja Prisma Clientin generointi

Luodaan ensimmäinen migraatio:

```bash
npx prisma migrate dev --name init
```

Komento tekee kaksi asiaa. Ensimmäisenä se luo migraatiotiedoston `prisma/migrations/`-kansioon. Tiedosto sisältää SQL-lausekkeen, joka luo `Ajo`-taulun tietokantaan:

```sql
CREATE TABLE "Ajo" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "reitti" TEXT NOT NULL,
    "km" INTEGER NOT NULL,
    "ajaja" TEXT NOT NULL,
    "pvm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

Toiseksi komento luo SQLite-tietokantatiedoston `dev.db` projektin juureen ja ajaa migraation.

`--name init` antaa migraatiolle nimen. Nimi näkyy migraatiotiedoston hakemistossa ja kuvaa migraation tarkoitusta.

Tämän jälkeen generoidaan Prisma Client:

```bash
npx prisma generate
```

Komento lukee `schema.prisma`:n ja tuottaa TypeScript-koodin `generated/prisma/`-kansioon. Kansio sisältää muun muassa `client.ts`-tiedoston, josta `PrismaClient` ja `Ajo`-tyyppi tuodaan sovelluskoodiin.

`prisma migrate dev` ei generoi clientiä automaattisesti, joten `prisma generate` on suoritettava erikseen. Schemaan tehtävien muutosten jälkeen molemmat komennot on ajettava uudelleen.

### Vaihe 9: Prisma Clientin alustus (lib/prisma.ts)

Luodaan palvelimen juureen `lib/`-kansio ja sinne `prisma.ts`-tiedosto:

```typescript
import "dotenv/config";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../generated/prisma/client";

const connectionString = process.env["DATABASE_URL"] ?? "file:./dev.db";
const adapter = new PrismaBetterSqlite3({ url: connectionString });
const prisma = new PrismaClient({ adapter });

export { prisma };
```

`lib/prisma.ts` on tiedosto, jonka palvelimen reitit tuovat (import) käyttääkseen tietokantaa. Tiedoston sisällöstä ei tarvitse välittää vaan se kopioidaan suoraan yltä tai Prisman virallisista ohjeista.

### Vaihe 10: Virhekäsittelijä (errors/virhekasittelija.ts)

Luodaan `errors/`-kansio ja kopioidaan virhekäsittelijä sellaisenaan demo 4:stä:

```typescript
import express from 'express';

export class Virhe extends Error {
    status: number;
    viesti: string;
    constructor(status?: number, viesti?: string) {
        super(viesti);
        this.status = status || 500;
        this.viesti = viesti || "Palvelimella tapahtui odottamaton virhe";
    }
}

const virhekasittelija = (err: Virhe, _req: express.Request, res: express.Response, _next: express.NextFunction): void => {
    res.status(err.status).json({ viesti: err.viesti });
}

export default virhekasittelija;
```

Virhekäsittely toimii täsmälleen samoin kuin demo 4:ssä. Reitit heittävät `Virhe`-ilmentymän, Express 5 välittää sen automaattisesti `virhekasittelija`-middlewarelle, joka lähettää HTTP-vastauksen.

### Vaihe 11: Reitinkäsittelijät (routes/apiAjopaivakirja.ts)

Luodaan `routes/`-kansio ja sinne `apiAjopaivakirja.ts`. Tiedoston rakenne on sama kuin demoissa 3 ja 4, mutta kahdella olennaisella erolla: reitit ovat `async`-funktioita ja tietokantakyselyt toteutetaan Prisma Clientilla.

**Tiedoston alkuosa**

```typescript
import express from 'express';
import { prisma } from '../lib/prisma';
import { Virhe } from '../errors/virhekasittelija';

const apiAjopaivakirjaRouter: express.Router = express.Router();
apiAjopaivakirjaRouter.use(express.json());
```

`prisma` tuodaan `lib/prisma.ts`:stä. `Virhe` tuodaan nimettynä tuontina, koska se on viety `export class`-lauseella.

**Miksi reitit ovat `async`**

Demoissa 3 ja 4 reitit olivat synkronisia, koska JavaScript-taulukon operaatiot (`find`, `push`, `splice`) suoritettiin välittömästi. Tietokantakutsut ovat asynkronisia: Prisma Clientin kaikki metodit palauttavat `Promise`-objektin, joten niitä on odotettava `await`-avainsanalla. `await` vaatii `async`-funktion.

Express 5 käsittelee `async`-funktioissa heitettävät virheet automaattisesti: jos reitissä heitetään virhe tai `Promise` hylätään, Express välittää sen virhekäsittelijälle ilman erillisiä `try/catch`-lohkoja.

---

**GET / — `findMany()`**

`findMany()` hakee kaikki taulun tietueet ja palauttaa ne taulukossa. Se ei tarvitse parametreja. Jos tietueita ei ole, palautusarvo on tyhjä taulukko `[]`.

```typescript
apiAjopaivakirjaRouter.get("/", async (_req: express.Request, res: express.Response) => {
    const ajot = await prisma.ajo.findMany();
    res.json(ajot);
});
```

Virhekäsittelyä ei tarvita: tyhjä tietokanta ei ole virhe, vaan `findMany()` palauttaa silloin `[]`.

---

**GET /:id — `findUnique()`**

`findUnique()` hakee yksittäisen tietueen `where`-ehdolla. Ehto on objekti, johon kirjoitetaan hakukenttä ja sen arvo. Koska haetaan pääavaimella, ehto on `{ id: Number(req.params.id) }`. URL-parametri on aina merkkijono, joten se muunnetaan luvuksi `Number()`-funktiolla.

`findUnique()` palauttaa `Ajo | null` — löytyneen tietueen tai `null`, jos tietuetta ei ole. Tulos ei koskaan heitä virhettä puuttuvan tietueen takia, vaan paluuarvo on `null`. Tästä syystä paluuarvo on aina tarkistettava ennen käyttöä.

```typescript
apiAjopaivakirjaRouter.get("/:id", async (req: express.Request, res: express.Response) => {
    const ajo = await prisma.ajo.findUnique({ where: { id: Number(req.params.id) } });
    if (!ajo) throw new Virhe(404, "Ajoa ei löytynyt");
    res.json(ajo);
});
```

`if (!ajo)` tarkistaa onko tulos `null`. Jos on, heitetään `Virhe`-ilmentymä statuksella 404. Express 5 välittää sen automaattisesti virhekäsittelijälle, joka lähettää JSON-virhevastauksen.

---

**POST / — `create()`**

`create()` lisää uuden tietueen tietokantaan. Uuden tietueen kenttien arvot annetaan `data`-objektissa. Kentät, joille on määritelty `@default`-arvo skeemassa (`id` ja `pvm`), jätetään `data`:sta kokonaan pois — tietokanta asettaa ne automaattisesti.

Ennen tietokantakutsua tarkistetaan, että pyynnön rungossa on kaikki pakolliset kentät. Validointi tehdään `if`-lauseella ennen `create()`-kutsua, ja puuttuvista kentistä heitetään 400-virhe.

```typescript
apiAjopaivakirjaRouter.post("/", async (req: express.Request, res: express.Response) => {
    if (!req.body.reitti || !req.body.km || !req.body.ajaja) throw new Virhe(400, "Virheellinen pyynnön body");
    const uusiAjo = await prisma.ajo.create({
        data: {
            reitti: req.body.reitti,
            km: Number(req.body.km),
            ajaja: req.body.ajaja,
        },
    });
    res.status(201).json(uusiAjo);
});
```

`create()` palauttaa luodun tietueen sisältäen tietokannan asettamat arvot, eli `id`:n ja `pvm`:n. Vastaus lähetetään statuksella 201 (Created).

---

**PUT /:id — `findUnique()` + `update()`**

`update()` päivittää olemassa olevan tietueen. Se ottaa kaksi pakollista kenttää: `where` (mikä tietue päivitetään) ja `data` (mitkä kentät päivitetään ja millä arvoilla).

Prisma heittää virheen, jos `update()`:lle annettu `where`-ehto ei löydä tietuetta. Siksi ennen päivitystä tarkistetaan ensin `findUnique()`-kutsulla, onko ajo olemassa, ja palautetaan selkeä 404-virhe. Tämän jälkeen validoidaan pyyntörungon kentät samoin kuin POST-reitissä.

```typescript
apiAjopaivakirjaRouter.put("/:id", async (req: express.Request, res: express.Response) => {
    const ajo = await prisma.ajo.findUnique({ where: { id: Number(req.params.id) } });
    if (!ajo) throw new Virhe(404, "Ajoa ei löydy");
    if (!req.body.reitti || !req.body.km || !req.body.ajaja) throw new Virhe(400, "Virheellinen pyynnön body");
    const paivitettyAjo = await prisma.ajo.update({
        where: { id: Number(req.params.id) },
        data: {
            reitti: req.body.reitti,
            km: Number(req.body.km),
            ajaja: req.body.ajaja,
        },
    });
    res.json(paivitettyAjo);
});
```

`update()` palauttaa päivitetyn tietueen.

---

**DELETE /:id — `findUnique()` + `delete()`**

`delete()` poistaa tietueen `where`-ehdolla. Kuten `update()`, myös `delete()` heittää Prisman oman virheen, jos tietuetta ei löydy. Siksi olemassaolo tarkistetaan ensin `findUnique()`-kutsulla.

```typescript
apiAjopaivakirjaRouter.delete("/:id", async (req: express.Request, res: express.Response) => {
    const ajo = await prisma.ajo.findUnique({ where: { id: Number(req.params.id) } });
    if (!ajo) throw new Virhe(404, "Ajoa ei löytynyt");
    await prisma.ajo.delete({ where: { id: Number(req.params.id) } });
    res.json(ajo);
});

export default apiAjopaivakirjaRouter;
```

`delete()` palauttaa poistetun tietueen. Koska `findUnique()` haettiin jo aiemmin, palautetaan se vastauksessa — näin pyyntöä tehneelle selviää, mikä tietue poistettiin.

### Vaihe 12: Pääohjelma (index.ts)

```typescript
import express from 'express';
import path from 'path';
import apiAjopaivakirjaRouter from './routes/apiAjopaivakirja';
import virhekasittelija from './errors/virhekasittelija';

const app: express.Application = express();

const portti: number = Number(process.env.PORT) || 3005;

app.use(express.static(path.resolve(import.meta.dirname, "public")));

app.use("/api/ajopaivakirja", apiAjopaivakirjaRouter);

app.use(virhekasittelija);

app.listen(portti, (): void => {
    console.log(`Palvelin käynnistettiin osoitteeseen http://localhost:${portti}`);
});
```

Rakenne on identtinen demo 4:n kanssa. Ainoa muutos on porttinumero: demo 5 käyttää porttia 3005.

### Projektin lopullinen rakenne

```
demo05/
├── index.ts                        # Palvelimen käynnistys ja kokoonpano
├── package.json                    # Projektin metatiedot ja riippuvuudet
├── package-lock.json               # Pakettien tarkat versiot
├── tsconfig.json                   # TypeScript-kääntäjän asetukset
├── prisma.config.ts                # Prisma CLI:n konfiguraatio
├── .env                            # DATABASE_URL-ympäristömuuttuja
├── .gitignore                      # Prisma lisää automaattisesti
├── errors/
│   └── virhekasittelija.ts         # Virhe-luokka ja virhekäsittelijä-middleware
├── lib/
│   └── prisma.ts                   # PrismaClient-instanssi
├── routes/
│   └── apiAjopaivakirja.ts         # REST API -päätepisteet
├── prisma/
│   ├── schema.prisma               # Tietomalli
│   ├── dev.db                      # SQLite-tietokantatiedosto
│   └── migrations/
│       └── 20xxxxxxxxxxxxxx_init/
│           └── migration.sql       # Tietokannan luontilauseke
├── generated/
│   └── prisma/                     # Generoitu Prisma Client (ei versionhallintaan)
└── public/
    └── index.html                  # Staattinen etusivu
```

---

## 3. Prisma-tekniikat: muistilista

### Prisma CLI -komennot

| Komento | Mitä tekee |
|---------|-----------|
| `npx prisma init --datasource-provider sqlite --output ../generated/prisma` | Luo `schema.prisma`, `prisma.config.ts` ja `.env` |
| `npx prisma migrate dev --name <nimi>` | Luo migraatiotiedoston, ajaa sen tietokantaa vasten. Ei generoi clientiä. |
| `npx prisma generate` | Generoi TypeScript-clientin schemasta `generated/prisma/`-kansioon |
| `npx prisma studio` | Avaa selainpohjaisen tietokantaselailun |
| `npx tsc --noEmit` | Tarkistaa TypeScript-tyypit ajamatta kääntäjää |

Schemaan tehdyn muutoksen jälkeen on ajettava aina molemmat: ensin `prisma migrate dev`, sitten `prisma generate`.

---

### Prisma Client -metodit

Taulukossa kuvataan reittikoodeissa käytettyjen metodien tarkoitus ja perusrakenne.

| Metodi | Käyttötarkoitus | Perusrakenne |
|--------|----------------|--------------|
| `findMany()` | Hakee kaikki tietueet | `await prisma.ajo.findMany()` |
| `findUnique()` | Hakee yksittäisen tietueen pääavaimella | `await prisma.ajo.findUnique({ where: { id: 1 } })` |
| `create()` | Lisää uuden tietueen | `await prisma.ajo.create({ data: { reitti: "...", km: 100, ajaja: "A12" } })` |
| `update()` | Muokkaa olemassa olevaa tietuetta | `await prisma.ajo.update({ where: { id: 1 }, data: { reitti: "..." } })` |
| `delete()` | Poistaa tietueen | `await prisma.ajo.delete({ where: { id: 1 } })` |

`findUnique()` palauttaa `Ajo | null`. Jos tietuetta ei löydy, palautusarvo on `null`, ei `undefined`. Tarkistus tehdään `if (!ajo)`.

`pvm`-kenttä asettuu automaattisesti `@default(now())`-attribuutin ansiosta. Sitä ei tarvitse eikä voi antaa `create()`-kutsun `data`-objektissa.

---

### Demo 3/4 vs Demo 5: tiedonhallinta

| Toiminto | Demo 3/4 | Demo 5 |
|----------|----------|--------|
| Tallennus | Muistitaulukko (`const ajot: Ajo[]`) | SQLite-tietokanta (`dev.db`) |
| Tiedon pysyvyys | Nollautuu palvelimen uudelleenkäynnistyksessä | Säilyy uudelleenkäynnistyksen yli |
| id:n generointi | `Math.max(...ajot.map(a => a.id)) + 1` | `@default(autoincrement())` |
| `pvm`:n asetus | `new Date().toLocaleDateString("fi-FI")` | `@default(now())`, tyyppi `Date` |
| Reittifunktiot | Synkronisia | Asynkronisia (`async/await`) |

---

## Sovelluksen käynnistys

Demo 5:ssä `.env`-tiedosto, `dev.db`-tietokantatiedosto ja `generated/prisma`-kansio eivät tallennu versionhallintaan, joten ne on luotava paikallisesti ennen palvelimen käynnistystä.

**1. Asenna riippuvuudet:**

```bash
npm install
```

**2. Luo `.env`-tiedosto projektin juureen:**

```
DATABASE_URL="file:./dev.db"
```

**3. Aja migraatiot ja generoi Prisma Client:**

```bash
npx prisma migrate dev
```

Tämä luo `dev.db`-tietokantatiedoston ja generoi Prisma Clientin `generated/prisma`-kansioon.

**4. Käynnistä palvelin:**

```bash
npm run dev
```

Palvelin käynnistyy osoitteeseen `http://localhost:3005`.
