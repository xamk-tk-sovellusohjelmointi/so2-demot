  # Demo 5: Tietomallin toteutus Prisma ORM:n avulla

Ostoslistasovellus toimii käyttäjän kannalta täsmälleen kuten demoissa 3 ja 4. Rajapinnan kautta haetaan koko ostoslista, lisätään uusi ostos, muokataan olemassa olevaa riviä ja poistetaan ostoksia. Muutos on sovelluksen sisällä. Tähän saakka ostokset tallennettiin `ostokset.json`-tiedostoon, jota käsiteltiin itse ohjelmoidulla `Ostoslista`-luokalla. Tässä demossa tiedot tallennetaan SQLite-tietokantaan, ja tiedostoa käsittelevän luokan tilalle tulee Prisma ORM (Object-Relational Mapping).

Prismalle kuvataan sovelluksen tietomalli yhteen tiedostoon. Sen pohjalta muodostetaan sekä tietokannan taulut että TypeScript-tyypit ja tietokantaa käsittelevät metodit. Reitit pysyvät asiakassovellukselle samanlaisina, mutta niiden sisällä ajetaan nyt oikeita tietokantakyselyitä.

> [!WARNING]
> **Prisma v7 asennusohjeet** löytyvät [prisma7_asennus.md](./prisma7_asennus.md) -tiedostosta. Siellä on muutama huomio Prisman käyttöön demoissa, joka kannattaa huomioida.

## Sisällysluettelo

- [1 Node-projektin alustus ja määritykset](#1-node-projektin-alustus-ja-määritykset)
  - [1.1 package.json ja projektin perustiedot](#11-packagejson-ja-projektin-perustiedot)
  - [1.2 tsconfig.json ja TypeScript-asetukset](#12-tsconfigjson-ja-typescript-asetukset)
- [2 Riippuvuuksien asennus](#2-riippuvuuksien-asennus)
  - [2.1 npm ci vs. npm install](#21-npm-ci-vs-npm-install)
  - [2.2 Projektin riippuvuudet](#22-projektin-riippuvuudet)
- [3 Tietokannan ja Prisma Clientin alustus](#3-tietokannan-ja-prisma-clientin-alustus)
  - [3.1 Ympäristömuuttujat ja .env](#31-ympäristömuuttujat-ja-env)
  - [3.2 Tietomalli schema.prisma-tiedostossa](#32-tietomalli-schemaprisma-tiedostossa)
  - [3.3 Prisman asetustiedosto ja tietokannan migraatiot](#33-prisman-asetustiedosto-ja-tietokannan-migraatiot)
  - [3.4 Prisma Client ja tietokantayhteys](#34-prisma-client-ja-tietokantayhteys)
- [4 Express-palvelin ja staattisten tiedostojen tarjoilu](#4-express-palvelin-ja-staattisten-tiedostojen-tarjoilu)
- [5 Virheenkäsittelyn perusta](#5-virheenkäsittelyn-perusta)
- [6 Reittien rakentaminen Prisma Clientilla](#6-reittien-rakentaminen-prisma-clientilla)
  - [6.1 Rivin olemassaolon tarkistus ja pyynnön validointi](#61-rivin-olemassaolon-tarkistus-ja-pyynnön-validointi)
  - [6.2 Tietojen lukeminen, luominen, muokkaaminen ja poistaminen](#62-tietojen-lukeminen-luominen-muokkaaminen-ja-poistaminen)
- [7 Palvelimen käynnistäminen ja reittien testaaminen](#7-palvelimen-käynnistäminen-ja-reittien-testaaminen)
- [8 Lopuksi](#8-lopuksi)

**Projektin asentaminen ja käynnistäminen**

Kun olet kloonannut demon omalle koneellesi, siirry VS Coden Terminalissa demon kansioon ja asenna riippuvuudet komennolla

```bash
npm ci
```

Luo sen jälkeen projektin juureen tiedosto `.env`, jonka sisällöksi kirjoitat (ks. tarkemmin luku [3.1](#31-ympäristömuuttujat-ja-env)):

```
DATABASE_URL="file:./dev.db"
```

Muodosta Prisma Client tietomallin pohjalta komennolla

```bash
npx prisma generate --config prisma7.config.ts
```

ja käynnistä palvelin kehitystilassa komennolla

```bash
npm run dev
```

Palvelin käynnistyy oletuksena osoitteeseen `http://localhost:3005`. Palvelimen saa sammutettua Terminalissa `Ctrl+C`-näppäinyhdistelmällä ja käynnistettyä uudelleen samalla `npm run dev` -komennolla.

> [!WARNING]
> `.env`-tiedosto ja `generated/prisma`-kansio on merkitty `.gitignore`-tiedostossa versionhallinnan ulkopuolelle (ks. luku [3.1](#31-ympäristömuuttujat-ja-env) ja [3.4](#34-prisma-client-ja-tietokantayhteys)). Kloonatussa projektissa niitä ei siis ole valmiina, ja yllä olevat kaksi lisävaihetta pitää tehdä itse ennen `npm run dev`-komennon ajamista, tai palvelin ei käynnisty.

## 1 Node-projektin alustus ja määritykset

Projektin juuresta löytyvät samat määritystiedostot kuin edellisissä demoissa: `package.json`, `tsconfig.json` ja `.nvmrc`. Sisältö ja tarkoitus ovat pääosin samat, joten tässä kerrataan vain se, mikä on muuttunut. `package.json`:n ja `tsconfig.json`:n rivi riviltä -selitys löytyy [demo 1:n README:stä](../demo-01/README.md#1-node-projektin-alustus-ja-määritykset).

Yhden rivin mittaisessa `.nvmrc`-tiedostossa on arvo `24`, jolla `nvm use` -komento valitsee projektiin Node-version 24. Myös tämä demo on versiolukittu Node 24 -versioon ja `package.json`:ssa sekä `package-lock.json`:ssa määriteltyihin riippuvuusversioihin.

### 1.1 package.json ja projektin perustiedot

```json
{
  "name": "demo-05",
  "version": "1.0.0",
  "main": "index.ts",
  "engines": {
    "node": "^24.0.0"
  },
  "scripts": {
    "dev": "tsx watch ./index.ts",
    "typecheck": "tsc --noEmit"
  },
  "type": "module"
}
```

Rakenne on sama kuin edellisissä demoissa. Riippuvuuksia käsitellään erikseen luvussa [2](#2-riippuvuuksien-asennus).

### 1.2 tsconfig.json ja TypeScript-asetukset

`tsconfig.json` on suurimmaksi osaksi sama kuin edellisissä demoissa, ja kertaus keskeisistä asetuksista löytyy [demo 4:n luvusta 1.2](../demo-04/README.md#12-tsconfigjson-ja-typescript-asetukset). Tiedostoon on tullut yksi uusi rivi:

```json
"ignoreDeprecations": "6.0"
```

Asetus vaimentaa varoitukset niistä TypeScript-asetuksista, jotka poistuvat käytöstä vasta versiossa 6.0. Rivi liittyy Prisman generoimaan koodiin (luku [3.4](#34-prisma-client-ja-tietokantayhteys)), joka nojaa näihin asetuksiin.

## 2 Riippuvuuksien asennus

### 2.1 npm ci vs. npm install

Riippuvuudet asennetaan komennolla

```bash
npm ci
```

`npm ci` poistaa ensin olemassa olevan `node_modules`-kansion ja asentaa sitten täsmälleen ne versiot, jotka on kirjattu `package-lock.json`-tiedostoon. `npm install` voi samalla päivittää lock-tiedostoa `package.json`:n sallimissa rajoissa, joten kloonatuissa demoissa käytetään `npm ci`:tä. Näin jokainen kurssilainen ajaa koodia täsmälleen samoilla riippuvuusversioilla. Tarkempi vertailu löytyy [demo 1:n luvusta 2.1](../demo-01/README.md#21-npm-ci-vs-npm-install).

### 2.2 Projektin riippuvuudet

```json
"dependencies": {
  "@prisma/adapter-better-sqlite3": "7.10.0",
  "@prisma/client": "7.10.0",
  "dotenv": "17.4.2",
  "express": "5.2.1"
},
"devDependencies": {
  "@types/better-sqlite3": "9.6.0",
  "@types/express": "5.0.6",
  "@types/node": "22.20.3",
  "prisma": "7.10.0",
  "tsx": "4.23.13",
  "typescript": "7.0.2"
}
```

`express`, `@types/express`, `@types/node`, `tsx` ja `typescript` ovat samat riippuvuudet kuin aiemmissa demoissa. Uutta ovat Prismaan ja tietokantayhteyteen liittyvät paketit:

- `prisma` on Prisman komentorivityökalu, jolla tietomallista muodostetaan tietokannan rakenne ja TypeScript-koodi. Paketti on `devDependencies`-listalla, koska sitä tarvitaan vain kehityksen aikana.
- `@prisma/client` on Prisma Clientin ajonaikainen peruskirjasto.
- `@prisma/adapter-better-sqlite3` liittää Prisma Clientin `better-sqlite3`-ajuriin, jonka kautta SQLite-tietokantaa käytetään (luku [3.4](#34-prisma-client-ja-tietokantayhteys)).
- `@types/better-sqlite3` sisältää TypeScript-tyyppimäärittelyt kyseiselle ajurille.
- `dotenv` lukee `.env`-tiedoston arvot `process.env`-olioon (luku [3.1](#31-ympäristömuuttujat-ja-env)).

> [!NOTE]
> Osa näistä paketeista suorittaa asennuksen yhteydessä omia asennusskriptejään. Tämän takia `package.json`:n `allowScripts`-kenttään on [demossa 2](../demo-02/README.md#11-packagejson-ja-projektin-perustiedot) esiin nostetun `esbuild`-merkinnän lisäksi tullut merkinnät myös paketeille `prisma`, `@prisma/engines` ja `better-sqlite3`. Kenttä on työkalujen itse lisäämä, eikä sitä muokata käsin.

## 3 Tietokannan ja Prisma Clientin alustus

Riippuvuudet ovat nyt paikallaan. Seuraavaksi määritetään, mistä tietokanta löytyy ja millainen sen rakenne on.

### 3.1 Ympäristömuuttujat ja .env

Projektin juuresta löytyy tiedosto [`.env`](./.env), jonka olennainen sisältö on:

```
DATABASE_URL="file:./dev.db"
```

`.env`-tiedostoon kirjoitetaan asetuksia, joiden ei ole tarkoitus olla kiinteästi koodissa. Arvo voi vaihdella ympäristön mukaan (kehitys, testaus, tuotanto), tai se voi olla arkaluontoista tietoa, kuten salasana tai API-avain. Tässä demossa arvo on pelkkä paikallisen tietokantatiedoston polku eikä siis salainen, mutta sama tapa opetellaan nyt, koska oikeassa projektissa `.env`-tiedostossa on salasanoja ja API-avaimia.

`dotenv`-paketti lukee `.env`-tiedoston ja asettaa sen arvot `process.env`-olioon. Tätä varten sekä [`lib/prisma.ts`](./lib/prisma.ts) että [`prisma7.config.ts`](./prisma7.config.ts) alkavat rivillä

```ts
import "dotenv/config";
```

Rivin suorittaminen lukee `.env`-tiedoston, jonka jälkeen esimerkiksi `process.env.DATABASE_URL` on käytettävissä muualla tiedostossa.

Projektin juuressa on lisäksi `.gitignore`-tiedosto:

```
node_modules
# Keep environment variables out of version control
.env

/generated/prisma
```

`.env` on merkitty versionhallinnan ulkopuolelle, jotta arkaluontoiset asetukset eivät päädy vahingossa julkiseen versionhallintaan. Kloonattuun projektiin ei siis tule valmista `.env`-tiedostoa, ja se luodaan itse edellä kuvatulla sisällöllä, kuten dokumentin alun asennusohjeessa mainitaan.

### 3.2 Tietomalli schema.prisma-tiedostossa

Tietomalli kuvataan yhdessä tiedostossa, [`prisma/schema.prisma`](./prisma/schema.prisma):

```prisma
generator client {
  provider = "prisma-client"
  output   = "../generated/prisma"
}

datasource db {
  provider = "sqlite"
}

model Ostos {
  id Int @id @default(autoincrement())
  tuote String
  poimittu Boolean @default(false)
}
```

Tiedostossa käytetään Prisman omaa mallinnuskieltä. `generator client` -lohkossa määritetään, että mallista tuotetaan Prisma Client -koodi kansioon `generated/prisma` (luku [3.4](#34-prisma-client-ja-tietokantayhteys)). `datasource db` -lohkossa määritetään tietokannan tyypiksi `sqlite`. Yhteysosoite määritetään erikseen tiedostossa `prisma7.config.ts`, ks. luku [3.3](#33-prisman-asetustiedosto-ja-tietokannan-migraatiot).

`model Ostos` vastaa yhtä tietokantataulua ja määrittää sen sarakkeet. Kentät ovat samat kuin demojen 3 ja 4 käsin kirjoitetussa `Ostos`-rajapinnassa (`interface Ostos { id: number; tuote: string; poimittu: boolean; }`).

- `id Int @id @default(autoincrement())` määrittää `id`-kentän kokonaisluvuksi ja taulun ensisijaiseksi avaimeksi (`@id`). Arvo muodostuu automaattisesti kasvavana numerosarjana (`@default(autoincrement())`).
- `tuote String` vastaa suoraan demojen 3 ja 4 samannimistä kenttää.
- `poimittu Boolean @default(false)` saa oletusarvokseen `false`.

Tästä yhdestä mallimäärittelystä muodostetaan seuraavaksi tietokannan taulun rakenne (luku [3.3](#33-prisman-asetustiedosto-ja-tietokannan-migraatiot)) sekä TypeScript-tyypit ja tietokantametodit (luku [3.4](#34-prisma-client-ja-tietokantayhteys)).

### 3.3 Prisman asetustiedosto ja tietokannan migraatiot

[`prisma7.config.ts`](./prisma7.config.ts) on Prisman komentorivityökalun asetustiedosto:

```ts
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

Tiedostossa määritetään komentorivityökalulle tietomallin sijainti, migraatioiden hakemisto ja tietokannan yhteysosoite. Yhteysosoite luetaan `.env`-tiedostosta `env("DATABASE_URL")`-kutsulla (luku [3.1](#31-ympäristömuuttujat-ja-env)). Prisman oletusnimi tälle tiedostolle on `prisma.config.ts`. Koska tässä projektissa nimi on `prisma7.config.ts`, tiedosto nimetään jokaisessa komennossa erikseen `--config`-valitsimella.

Tietokannan rakenne muodostuu tietomallista migraatioiden kautta. Migraatiot ovat SQL-tiedostoja, joihin tietokannan rakenteen muutokset kirjataan askel askeleelta. Tämän demon migraatio löytyy kansiosta [`prisma/migrations/20260916153215_init`](./prisma/migrations/20260916153215_init/migration.sql):

```sql
-- CreateTable
CREATE TABLE "Ostos" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "tuote" TEXT NOT NULL,
    "poimittu" BOOLEAN NOT NULL DEFAULT false
);
```

Migraatio on luotu komennolla `npx prisma migrate dev --config prisma7.config.ts --name init` sen jälkeen, kun `Ostos`-malli oli kirjoitettu tiedostoon. Komento muodosti yllä olevan SQL-lauseen mallin perusteella, tallensi sen migraatiotiedostoksi ja ajoi sen tietokantatiedostoon `dev.db`. Uusi kenttä mallissa tuottaisi samalla komennolla uuden migraatiotiedoston, jossa olisi vain kyseinen muutos.

> [!TIP]
> Migraatiotiedostot tallennetaan versionhallintaan, toisin kuin `.env` ja `generated/prisma` (luku [3.4](#34-prisma-client-ja-tietokantayhteys)). Näin jokaisen kehittäjän tietokantaan tulevat samat muutokset samassa järjestyksessä. Saman kansion [`migration_lock.toml`](./prisma/migrations/migration_lock.toml) lukitsee projektin yhteen tietokantatyyppiin (`sqlite`), jottei tietokantaa vaihdettaisi vahingossa kesken projektin.

Tämän demon `dev.db`-tiedosto on projektissa valmiina, ja migraatio on ajettu siihen. Projektin käynnistämiseen riittää siis pelkkä `npx prisma generate` (luku [3.4](#34-prisma-client-ja-tietokantayhteys)). Tietokannan voi luoda tyhjästä uudelleen komennolla

```bash
npx prisma migrate dev --config prisma7.config.ts
```

### 3.4 Prisma Client ja tietokantayhteys

Sovelluksen oma yhteys tietokantaan muodostetaan tiedostossa [`lib/prisma.ts`](./lib/prisma.ts):

```ts
import "dotenv/config";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../generated/prisma/client";

const connectionString = `${process.env.DATABASE_URL}`;

const adapter = new PrismaBetterSqlite3({ url: connectionString });
const prisma = new PrismaClient({ adapter });

export { prisma };
```

Prisma Client tarvitsee adapterin, joka välittää kyselyt valitun tietokannan ajurille. Tässä demossa adapteri on `PrismaBetterSqlite3`, joka käyttää `better-sqlite3`-kirjastoa (luku [2.2](#22-projektin-riippuvuudet)). Adapteri luodaan ensin yhteysosoitteella, ja se annetaan sitten `PrismaClient`-olion konstruktorille.

`PrismaClient`-luokka tuodaan polusta `../generated/prisma/client`. Kyseinen kansio sisältää `npx prisma generate --config prisma7.config.ts` -komennon tuottamaa koodia, jossa on juuri tämän projektin `Ostos`-mallia vastaavat TypeScript-tyypit ja tietokantametodit. Kansio on merkitty `.gitignore`-tiedostossa versionhallinnan ulkopuolelle, koska se voidaan tuottaa uudelleen milloin tahansa mallin pohjalta. Kansiota ei avata tai muokata käsin, samaan tapaan kuin `node_modules`-kansiota.

`prisma`-olio luodaan ja viedään (`export`) käyttöön kerran tässä tiedostossa, ja kaikki reitit (luku [6](#6-reittien-rakentaminen-prisma-clientilla)) käyttävät samaa oliota. Tämä vastaa periaatteeltaan demojen 3 ja 4 tapaa luoda yksi `Ostoslista`-olio ja jakaa se kaikkien reittien kesken.

## 4 Express-palvelin ja staattisten tiedostojen tarjoilu

Tietokantayhteys on valmis, joten seuraavaksi käydään läpi palvelin, joka sitä käyttää.

```ts
import express, { type Application, type NextFunction, type Request, type Response} from 'express';
import path from 'path';
import apiOstoksetRouter from './routes/apiOstokset';
import virhekasittelija, { Virhe } from './errors/virhekasittelija';

const app: Application = express();

const port: number = Number(process.env.PORT) || 3005;

app.use(express.static(path.join(import.meta.dirname, "public")));

app.use("/api/ostokset", apiOstoksetRouter);

app.use((req: Request, res: Response, next: NextFunction) => {
    next(new Virhe(404, "Virheellinen reitti"))
});

app.use(virhekasittelija);

app.listen(port, () => {
    console.log(`Palvelin käynnistettiin osoitteeseen: http://localhost:${port}`);
});
```

`index.ts` on sama tiedosto kuin demossa 4, ainoana erona porttinumero `3005`. Nämä kaikki toimivat siinä samalla tavalla kuin demossa 4:

- `app`-muuttujan luonti ja palvelimen käynnistys `app.listen`-metodilla, ks. [demo 1:n luku 3](../demo-01/README.md#3-express-palvelimen-luonti-ja-käynnistys)
- staattisten tiedostojen tarjoilu `public`-kansiosta, ks. [demo 1:n luku 4](../demo-01/README.md#4-staattisten-tiedostojen-tarjoilu)
- `apiOstoksetRouter`:n liittäminen osoitteeseen `/api/ostokset`, ks. [demo 3:n luku 6.1](../demo-03/README.md#61-router-ja-json-pyyntöjen-jäsentäminen)
- tuntemattomien reittien käsittely ja virheenkäsittelijän rekisteröinti, ks. [demo 4:n luku 6.3](../demo-04/README.md#63-tuntemattomat-reitit-ja-middlewarejen-järjestys)

`express.static`-middlewaren kautta tarjoillaan `public`-kansion sisältö. Kansiossa on [`index.html`](./public/index.html), joka näkyy palvelimen juuressa osoitteessa `http://localhost:3005`. Sivulla on lyhyt kuvaus demon aiheesta ja ohje rajapinnan testaamiseen Postmanilla.

## 5 Virheenkäsittelyn perusta

[`errors/virhekasittelija.ts`](./errors/virhekasittelija.ts) on sama tiedosto kuin demossa 4. Siinä ovat sama `Virhe`-luokka ja sama `ErrorRequestHandler`-tyyppinen `virhekasittelija`-middleware, ja molempien kokonaisselitys löytyy [demo 4:n luvusta 6](../demo-04/README.md#6-virheenkäsittelyn-perusta). Tässä demossa reitit heittävät `Virhe`-olioita Prisma Clientin kyselyiden tulosten perusteella.

Reitit heittävät virheen suoraan `async`-käsittelijän sisällä, ja Express 5 välittää sen automaattisesti virheenkäsittelijälle ilman omaa `try`/`catch`-lohkoa tai `next(err)`-kutsua. Tämä on selitetty kokonaisuudessaan [demo 4:n luvussa 7.1](../demo-04/README.md#71-olemassaolon-tarkistus-ennen-muokkausta-ja-poistoa).

## 6 Reittien rakentaminen Prisma Clientilla

[`routes/apiOstokset.ts`](./routes/apiOstokset.ts) sisältää samat viisi reittiä kuin demoissa 3 ja 4, samalla `Router`-rakenteella ja `express.json()`-middlewarella (ks. [demo 3:n luku 6.1](../demo-03/README.md#61-router-ja-json-pyyntöjen-jäsentäminen)). `models`-kansiota ei tässä demossa ole, ja sen tilalle tuodaan Prisma Client -olio:

```ts
import { prisma } from '../lib/prisma';
```

`prisma.ostos` viittaa `Ostos`-malliin (luku [3.2](#32-tietomalli-schemaprisma-tiedostossa)). Mallin nimestä muodostuu automaattisesti pienellä alkukirjaimella kirjoitettu ominaisuus (`Ostos` -> `ostos`), jonka kautta kaikki kyseiseen tauluun kohdistuvat kyselyt tehdään.

### 6.1 Rivin olemassaolon tarkistus ja pyynnön validointi

```ts
const valinta = await prisma.ostos.count({
    where: { id: Number(req.params.id) }
}) === 1;

if (!valinta) {
    throw new Virhe(404, "Ostosta ei löytynyt");
}
```

DELETE-, PUT- ja GET `/:id` -reitit tarkistavat demon 4 tapaan ensin, että kohde on olemassa. Demossa 4 tarkistus tehtiin `Ostoslista`-luokan `haeYksi`-metodilla, joka etsi vastaavan alkion muistissa olevasta taulukosta. Tässä demossa käytetään `prisma.ostos.count({ where: { id: ... } })` -kutsua, joka laskee, montako riviä ehtoon täsmää. Koska `id` on ensisijainen avain (luku [3.2](#32-tietomalli-schemaprisma-tiedostossa)), täsmääviä rivejä voi olla 0 tai 1. Siksi tulosta verrataan suoraan lukuun 1.

Prisma Clientin mukana tulevat valmiit tyypit `Ostos`-mallille (luku [3.4](#34-prisma-client-ja-tietokantayhteys)), joten `where`- ja `data`-olioiden kentät tarkistetaan ilman erikseen kirjoitettua tyyppiä.

POST- ja PUT-reittien validointi on sisällöltään sama kuin demossa 4:

```ts
const hyvaksyttyBody = req.body.tuote?.length > 0 && (req.body.poimittu === true || req.body.poimittu === false);

if (!hyvaksyttyBody) {
    throw new Virhe(400, "Virheellinen pyynnön body");
}
```

Tarkistus tehdään ennen mitään tietokantaan kirjoittavaa kutsua samasta syystä kuin demossa 4, koska virheellistä dataa ei haluta päästää tietokantaan asti. Perustelu kummallekin ehdolle (`?.`-operaattori ja vertailu suoraan arvoihin `true` ja `false`) on käyty läpi [demo 4:n luvussa 7.2](../demo-04/README.md#72-pyynnön-rungon-validointi).

### 6.2 Tietojen lukeminen, luominen, muokkaaminen ja poistaminen

```ts
apiOstoksetRouter.get("/", async (req: Request, res: Response) => {
    res.json(await prisma.ostos.findMany());
});
```

`findMany()` palauttaa kaikki taulun rivit taulukkona ja korvaa demojen 3 ja 4 `haeKaikki()`-metodin. Kutsu on nyt asynkroninen (`await`), koska kyseessä on oikea tietokantakysely. Demojen 3 ja 4 vastaava metodi luki suoraan muistissa olevaa taulukkoa.

```ts
apiOstoksetRouter.post("/", async (req: Request, res: Response) => {

    const hyvaksyttyBody = req.body.tuote?.length > 0 && (req.body.poimittu === true || req.body.poimittu === false);

    if (!hyvaksyttyBody) {
        throw new Virhe(400, "Virheellinen pyynnön body");
    }

    await prisma.ostos.create({
        data: {
            tuote: req.body.tuote,
            poimittu: req.body.poimittu
        }
    });

    res.json(await prisma.ostos.findMany());

});
```

`create({ data: {...} })` lisää uuden rivin. `id`-kenttää ei anneta ollenkaan, koska sen arvon muodostaa tietokanta luvussa [3.2](#32-tietomalli-schemaprisma-tiedostossa) kuvatun `@default(autoincrement())`-määrityksen perusteella.

```ts
apiOstoksetRouter.put("/:id", async (req: Request, res: Response) => {

    // olemassaolon tarkistus ja validointi, ks. luku 6.1

    await prisma.ostos.update({
        where: {
            id: Number(req.params.id)
        },
        data: {
            tuote: req.body.tuote,
            poimittu: req.body.poimittu
        }
    });

    res.json(await prisma.ostos.findMany());

});
```

`update({ where: {...}, data: {...} })` korvaa yhdellä kutsulla demojen 3 ja 4 `muokkaa`-metodin koko sisällön. Metodissa tehtiin neljä asiaa:

- vanhan rivin etsiminen
- rivin poistaminen taulukosta
- uuden version lisääminen taulukkoon
- listan järjestäminen

Kohde valitaan `where`-ehdolla, ja uusi sisältö annetaan `data`-oliossa.

```ts
apiOstoksetRouter.delete("/:id", async (req: Request, res: Response) => {

    // olemassaolon tarkistus, ks. luku 6.1

    await prisma.ostos.delete({
        where: {
            id: Number(req.params.id)
        }
    });

    res.json(await prisma.ostos.findMany());

});
```

`delete({ where: {...} })` poistaa rivin yhdellä kutsulla. Demoissa 3 ja 4 sama tehtiin `poista`-metodissa `filter`-metodin avulla.

```ts
apiOstoksetRouter.get("/:id", async (req: Request, res: Response) => {

    // olemassaolon tarkistus, ks. luku 6.1

    res.json(await prisma.ostos.findUnique({
        where: {
            id: Number(req.params.id)
        }
    }));

});
```

`findUnique({ where: {...} })` hakee yhden rivin ensisijaisen avaimen perusteella ja korvaa demojen 3 ja 4 `haeYksi`-metodin. Kohde valitaan samalla `req.params.id`-arvolla, jota käytettiin jo olemassaolon tarkistuksessa (luku [6.1](#61-rivin-olemassaolon-tarkistus-ja-pyynnön-validointi)).

## 7 Palvelimen käynnistäminen ja reittien testaaminen

Kun riippuvuudet on asennettu, `.env` luotu ja Prisma Client muodostettu dokumentin alun ohjeen mukaisesti, palvelin käynnistetään `npm run dev` -komennolla. Terminaaliin tulostuu tuttu lokiviesti:

```
Palvelin käynnistettiin osoitteeseen: http://localhost:3005
```

Rajapintaa testataan Postmanilla samaan tapaan kuin demoissa 3 ja 4. Jokainen pyyntö muodostetaan kolmessa vaiheessa:

- Pyynnön tyyppi valitaan pudotusvalikosta.
- Osoitteeksi kirjoitetaan `http://localhost:3005/api/ostokset`, tai `http://localhost:3005/api/ostokset/:id` yksittäiselle riville.
- POST- ja PUT-pyynnöissä data kirjoitetaan Body-välilehdelle valitsemalla raw ja JSON.

```
GET http://localhost:3005/api/ostokset

POST http://localhost:3005/api/ostokset
Body (raw, JSON): {"tuote": "Kahvia", "poimittu": false}

PUT http://localhost:3005/api/ostokset/1
Body (raw, JSON): {"tuote": "Kaurajuomaa", "poimittu": true}

DELETE http://localhost:3005/api/ostokset/1
```

> [!NOTE]
> Tietokannassa `dev.db` on valmiina kolme riviä, joten `GET /api/ostokset` palauttaa dataa heti ensimmäisellä käynnistyskerralla ilman että mitään pitää lisätä erikseen.

Virheelliset pyynnöt toimivat täsmälleen samoin kuin [demo 4:n testausesimerkeissä](../demo-04/README.md#8-palvelimen-käynnistäminen-ja-reittien-testaaminen), koska `Virhe`-luokka ja virheenkäsittelijä ovat muuttumattomat. Kokeiltavia tapauksia on neljä:

- olematon id
- puuttuva `tuote`
- väärän tyyppinen `poimittu`
- tuntematon reitti

## 8 Lopuksi

Demossa korvattiin demojen 3 ja 4 käsin kirjoitettu, tekstitiedostoon tallentava `Ostoslista`-luokka Prisma ORM:lla ja oikealla SQLite-tietokannalla. Kolme asiaa muuttui:

- Tietomalli kuvataan kerran tiedostossa `schema.prisma`.
- Tietokannan taulut muodostetaan samasta mallista migraatioiden kautta.
- TypeScript-tyypit ja tietokantametodit muodostetaan samasta mallista Prisma Clientiin.

Demoissa 3 ja 4 nämä kolme asiaa kirjoitettiin käsin erikseen rajapintana, tallennusmuotona ja CRUD-metodeina. Demon 4 validointi- ja virheenkäsittelylogiikka säilyi tässä demossa täysin muuttumattomana, vaikka tietovarasto vaihtui kokonaan.

Prisma on yksi esimerkki ORM-työkalusta, ja vastaavia löytyy muillekin ohjelmointikielille ja kehyksille. Periaate on kaikissa sama. Tietomalli kuvataan yhteen paikkaan, ja työkalu pitää tietokantarakenteen ja sovelluskoodin yhdenmukaisina sen kanssa.
