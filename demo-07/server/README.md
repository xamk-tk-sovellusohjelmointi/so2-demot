# Demo 7: JWT-autorisointi (palvelinsovellus)

Ostoslista näyttää käyttäjälle samalta kuin edellisessä demossa. Selaimessa avataan osoite `http://localhost:3000`, listalla näkyvät tietokantaan tallennetut tuotteet, ja rivejä lisätään tekstikentällä ja poistetaan roskakorikuvakkeella. Muutos on pyyntöjen sisällä. Jokaisen pyynnön mukana lähtee nyt token, jonka palvelin tarkistaa ennen pyynnön käsittelyä. Jos token puuttuu tai on väärä, palvelin vastaa virhekoodilla `401`, lista jää tyhjäksi ja näkymään tulee punainen ilmoitus "Virheellinen token".

Demo jakautuu kahteen kansioon:

- `server` sisältää Express-palvelimen ja REST API -rajapinnan, joka on muuten sama sovellus kuin demossa 6.
- `client` sisältää Vitellä rakennetun React-sovelluksen, joka käyttää rajapintaa.

Tämä README käsittelee `server`-kansion palvelinsovellusta. React-asiakassovellus käydään läpi erikseen `client`-kansion omassa dokumentaatiossa. Palvelimen puolella tietokanta ja reitit siirtyvät demosta 6 sellaisenaan, ja uutta on token-tarkistus, joka tehdään omassa middlewaressa ennen reittejä.

## Sisällysluettelo

- [1 Projektin rakenne ja määritystiedostot](#1-projektin-rakenne-ja-määritystiedostot)
- [2 Riippuvuuksien asennus](#2-riippuvuuksien-asennus)
- [3 Tietokanta, reitit ja virheenkäsittely](#3-tietokanta-reitit-ja-virheenkäsittely)
- [4 Ympäristömuuttujat ja JWT-salaisuus](#4-ympäristömuuttujat-ja-jwt-salaisuus)
- [5 JWT-autorisointi palvelimella](#5-jwt-autorisointi-palvelimella)
  - [5.1 Mikä JWT-token on](#51-mikä-jwt-token-on)
  - [5.2 tarkistaToken-middleware](#52-tarkistatoken-middleware)
  - [5.3 Middlewarejen järjestys ja palvelimen etusivu](#53-middlewarejen-järjestys-ja-palvelimen-etusivu)
  - [5.4 Tokenin luominen luoJWT.mjs-skriptillä](#54-tokenin-luominen-luojwtmjs-skriptillä)
- [6 Asiakassovelluksen pyynnöt ja Viten proxy](#6-asiakassovelluksen-pyynnöt-ja-viten-proxy)
- [7 Käynnistäminen ja testaaminen](#7-käynnistäminen-ja-testaaminen)
  - [7.1 Palvelimen ja asiakassovelluksen käynnistäminen](#71-palvelimen-ja-asiakassovelluksen-käynnistäminen)
  - [7.2 Testaaminen asiakassovelluksen kautta](#72-testaaminen-asiakassovelluksen-kautta)
  - [7.3 Rajapinnan testaaminen Postmanilla](#73-rajapinnan-testaaminen-postmanilla)
- [8 Lopuksi](#8-lopuksi)

**Projektin asentaminen ja käynnistäminen**

Kun olet kloonannut demon omalle koneellesi, siirry VS Coden Terminalissa demon `server`-kansioon ja asenna riippuvuudet komennolla

```bash
npm ci
```

Luo sen jälkeen `server`-kansion juureen tiedosto `.env`, jonka sisällöksi kirjoitat

```
DATABASE_URL="file:./dev.db"
JWT_SALAISUUS="SuuriSalaisuus123!!!"
```

Kirjoita `JWT_SALAISUUS` täsmälleen yllä olevassa muodossa, koska asiakassovellukseen on tallennettu valmis token, joka on muodostettu tällä arvolla (luku [5.4](#54-tokenin-luominen-luojwtmjs-skriptillä)).

Muodosta Prisma Client tietomallin pohjalta komennolla

```bash
npx prisma generate --config prisma7.config.ts
```

ja käynnistä palvelin kehitystilassa komennolla

```bash
npm run dev
```

Palvelin käynnistyy oletuksena osoitteeseen `http://localhost:3007`. Palvelimen saa sammutettua Terminalissa `Ctrl+C`-näppäinyhdistelmällä ja käynnistettyä uudelleen samalla `npm run dev` -komennolla. Asiakassovellus käynnistetään erikseen `client`-kansiossa, ks. luku [7.1](#71-palvelimen-ja-asiakassovelluksen-käynnistäminen).

> [!WARNING]
> `.env`-tiedosto ja `generated/prisma`-kansio on merkitty `.gitignore`-tiedostossa versionhallinnan ulkopuolelle. Kloonatussa projektissa niitä ei siis ole valmiina, ja yllä olevat kaksi lisävaihetta pitää tehdä itse ennen `npm run dev` -komennon ajamista, tai palvelin ei käynnisty. Perustelut löytyvät [demo 5:n luvuista 3.1](../../demo-05/README.md#31-ympäristömuuttujat-ja-env) ja [3.4](../../demo-05/README.md#34-prisma-client-ja-tietokantayhteys).

## 1 Projektin rakenne ja määritystiedostot

`server` ja `client` ovat kaksi erillistä Node-projektia, joilla on omat `package.json`- ja `package-lock.json`-tiedostonsa sekä asennuksen jälkeen omat `node_modules`-kansionsa. npm-komennot ajetaan aina siinä kansiossa, jota ne koskevat, eli Terminalissa siirrytään ensin komennolla `cd server` tai `cd client`.

Palvelimen määritystiedostot ovat samat kuin demoissa 5 ja 6. `tsconfig.json` on muuttumaton, ja keskeiset asetukset on käyty läpi [demo 5:n luvussa 1.2](../../demo-05/README.md#12-tsconfigjson-ja-typescript-asetukset). `package.json`:iin on tullut projektin nimen lisäksi kaksi uutta riippuvuutta, jotka käsitellään luvussa [2](#2-riippuvuuksien-asennus). Palvelin ajetaan `dev`-skriptillä (`tsx watch ./index.ts`), joka käynnistää palvelimen automaattisesti uudelleen aina, kun jokin palvelimen tiedosto tallennetaan.

Yhden rivin mittaisessa `.nvmrc`-tiedostossa on arvo `24`, jolla `nvm use` -komento valitsee projektiin Node-version 24. Demo on versiolukittu Node 24 -versioon ja `package.json`:ssa sekä `package-lock.json`:ssa määriteltyihin riippuvuusversioihin.

## 2 Riippuvuuksien asennus

Riippuvuudet asennetaan `server`-kansiossa `npm ci` -komennolla, joka asentaa täsmälleen `package-lock.json`-tiedostoon kirjatut versiot. Ero `npm install` -komentoon on selitetty [demo 1:n luvussa 2.1](../../demo-01/README.md#21-npm-ci-vs-npm-install).

```json
"dependencies": {
  "@prisma/adapter-better-sqlite3": "7.10.0",
  "@prisma/client": "7.10.0",
  "cors": "2.8.6",
  "dotenv": "^18.0.1",
  "express": "5.2.1",
  "jsonwebtoken": "^9.0.3"
},
"devDependencies": {
  "@types/better-sqlite3": "9.6.0",
  "@types/cors": "2.8.19",
  "@types/express": "5.0.6",
  "@types/jsonwebtoken": "^9.0.10",
  "@types/node": "22.20.3",
  "prisma": "7.10.0",
  "tsx": "4.23.13",
  "typescript": "7.0.2"
}
```

Uutta demoon 6 verrattuna on kaksi pakettia:

- `jsonwebtoken` muodostaa ja tarkistaa JWT-tokeneita.
- `@types/jsonwebtoken` sisältää TypeScript-tyyppimäärittelyt `jsonwebtoken`-paketille.

Paketit lisättiin projektiin komennoilla `npm install jsonwebtoken` ja `npm install -D @types/jsonwebtoken`. Muut paketit ovat samat kuin demossa 6, ja ne on lueteltu [demo 5:n luvussa 2.2](../../demo-05/README.md#22-projektin-riippuvuudet). `cors` ja `@types/cors` ovat edelleen riippuvuuksissa, vaikka `cors`-middlewarea ei tässä demossa oteta käyttöön (luku [6](#6-asiakassovelluksen-pyynnöt-ja-viten-proxy)).

## 3 Tietokanta, reitit ja virheenkäsittely

Nämä tiedostot siirtyvät demosta 6 muuttumattomina, eikä niihin tehdä tässä demossa mitään:

- [`prisma/schema.prisma`](./prisma/schema.prisma) sisältää `Ostos`-mallin, ks. [demo 5:n luku 3.2](../../demo-05/README.md#32-tietomalli-schemaprisma-tiedostossa)
- [`prisma7.config.ts`](./prisma7.config.ts) on Prisman komentorivityökalun asetustiedosto, ks. [demo 5:n luku 3.3](../../demo-05/README.md#33-prisman-asetustiedosto-ja-tietokannan-migraatiot)
- [`lib/prisma.ts`](./lib/prisma.ts) muodostaa tietokantayhteyden ja vie `prisma`-olion reittien käyttöön, ks. [demo 5:n luku 3.4](../../demo-05/README.md#34-prisma-client-ja-tietokantayhteys)
- [`errors/virhekasittelija.ts`](./errors/virhekasittelija.ts) sisältää `Virhe`-luokan ja virheenkäsittelijä-middlewaren, ks. [demo 4:n luku 6](../../demo-04/README.md#6-virheenkäsittelyn-perusta)
- [`routes/apiOstokset.ts`](./routes/apiOstokset.ts) sisältää Prisma Clientilla toteutetut reitit, ks. [demo 5:n luku 6](../../demo-05/README.md#6-reittien-rakentaminen-prisma-clientilla)

Rajapinnassa on viisi reittiä:

- `GET /api/ostokset` hakee koko listan
- `GET /api/ostokset/:id` hakee yhden rivin
- `POST /api/ostokset` lisää uuden tuotteen
- `PUT /api/ostokset/:id` muokkaa olemassa olevaa riviä
- `DELETE /api/ostokset/:id` poistaa rivin

`dev.db`-tiedosto tulee demon mukana, ja migraatio on ajettu siihen valmiiksi. Tietokannassa on kolme valmista riviä, jotka näkyvät asiakassovelluksessa heti ensimmäisellä avauskerralla.

## 4 Ympäristömuuttujat ja JWT-salaisuus

Tietokanta ja rajapinta ovat siis valmiina. Ensimmäinen uusi asia on `.env`-tiedostoon tuleva salaisuus, jota token-tarkistus tarvitsee.

```
DATABASE_URL="file:./dev.db"
JWT_SALAISUUS="SuuriSalaisuus123!!!"
```

`JWT_SALAISUUS` on merkkijono, jolla tokenit allekirjoitetaan ja jolla allekirjoitus tarkistetaan (luku [5.1](#51-mikä-jwt-token-on)). Arvo pysyy vain palvelimella, koska kuka tahansa saman merkkijonon tietävä voi muodostaa palvelimelle kelpaavia tokeneita. Oikeassa projektissa salaisuus on pitkä satunnaisesti muodostettu merkkijono. Demossa se on lyhyt ja luettava, jotta sen voi kirjoittaa itse käsin asennusohjeen mukaan. `.env` on merkitty `.gitignore`-tiedostossa versionhallinnan ulkopuolelle, ks. [demo 5:n luku 3.1](../../demo-05/README.md#31-ympäristömuuttujat-ja-env).

Aiemmissa demoissa `.env` luettiin `import "dotenv/config"` -rivillä tiedostoissa `lib/prisma.ts` ja `prisma7.config.ts`. Nyt sama luku tehdään myös palvelimen käynnistystiedostossa [`index.ts`](./index.ts), koska salaisuus tarvitaan siellä.

```ts
import { config } from "dotenv";
config();

const JWT_SALAISUUS = process.env.JWT_SALAISUUS;
```

`config()`-kutsu tekee saman asian kuin aiemmin käytetty import-rivi, eli lukee `.env`-tiedoston ja asettaa sen arvot `process.env`-olioon.

## 5 JWT-autorisointi palvelimella

Seuraavaksi katsotaan palvelimen käynnistystiedostoa [`index.ts`](./index.ts), johon token-tarkistus on lisätty.

```ts
import express, { type Application, type NextFunction, type Request, type Response } from 'express';
import path from 'path';
import apiOstoksetRouter from './routes/apiOstokset';
import virhekasittelija, { Virhe } from './errors/virhekasittelija';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import { config } from "dotenv";
config();

const JWT_SALAISUUS = process.env.JWT_SALAISUUS;

const app: Application = express();
const port: number = Number(process.env.PORT) || 3007;

//app.use(cors({ origin: "http://localhost:3000"}));
app.use(express.json());

const tarkistaToken = (req: Request, res: Response, next: NextFunction) => {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
        return res.status(401).json();
    }
    try {
        const token: string | undefined = header.split(" ")[1];
        if (!token || !JWT_SALAISUUS) { return res.status(500).json() }
        jwt.verify(token, JWT_SALAISUUS, { algorithms: ["HS256"] });
        next();
    } catch {
        res.status(401).json();
    }
}

app.use(tarkistaToken);

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

Erot demon 6 vastaavaan tiedostoon ovat:

- porttinumero on `3007`
- `tarkistaToken`-middleware tarkistaa jokaisen pyynnön tokenin (luku [5.2](#52-tarkistatoken-middleware))
- `cors`-middlewaren rivi on kommentoitu pois (luku [6](#6-asiakassovelluksen-pyynnöt-ja-viten-proxy))
- demon 6 sekunnin viive on poistettu
- `express.json()` on rekisteröity koko sovellukselle

Viiveen poiston huomaa asiakassovelluksessa siten, että latausanimaatio välähtää näkyviin vain hetkeksi. `express.json()` jäsentää pyynnön bodyn JSON-muodosta JavaScript-olioksi. Sama middleware on rekisteröity myös reitittimessä (ks. [demo 3:n luku 6.1](../../demo-03/README.md#61-router-ja-json-pyyntöjen-jäsentäminen)), joten `/api/ostokset`-reittien toiminta ei muutu.

Loput toimivat samalla tavalla kuin demossa 6:

- `app`-muuttujan luonti ja palvelimen käynnistys `app.listen`-metodilla, ks. [demo 1:n luku 3](../../demo-01/README.md#3-express-palvelimen-luonti-ja-käynnistys)
- staattisten tiedostojen tarjoilu `public`-kansiosta, ks. [demo 1:n luku 4](../../demo-01/README.md#4-staattisten-tiedostojen-tarjoilu)
- `apiOstoksetRouter`:n liittäminen osoitteeseen `/api/ostokset`
- tuntemattomien reittien käsittely ja virheenkäsittelijän rekisteröinti, ks. [demo 4:n luku 6.3](../../demo-04/README.md#63-tuntemattomat-reitit-ja-middlewarejen-järjestys)

### 5.1 Mikä JWT-token on

JWT (JSON Web Token) on merkkijono, jonka palvelin on allekirjoittanut ja jonka asiakassovellus liittää pyyntöihinsä. Merkkijono jakautuu pisteillä kolmeen osaan. Alla on demon asiakassovellukseen tallennettu token.

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3ODk5MTU0MDR9.bkwKknYk10BEbds5vq34kVu4ps2q9950Ub9gOtf-G4o
```

Osat ovat järjestyksessä:

- Otsake (header), jossa määritetään allekirjoituksen algoritmi. Tämän tokenin otsake on `{"alg":"HS256","typ":"JWT"}`.
- Sisältöosa (payload), johon kirjoitetaan tokeniin liitettävät tiedot. Tämän tokenin sisältöosa on `{"iat":1789915404}`, eli pelkkä muodostamisajankohta sekunteina.
- Allekirjoitus (signature), joka lasketaan kahdesta ensimmäisestä osasta ja palvelimen salaisuudesta.

Kaksi ensimmäistä osaa ovat base64url-koodattuja, ja kuka tahansa saa ne auki ilman salaisuutta. Koodaus ei ole salausta, joten tokeniin ei kirjoiteta salasanoja eikä muuta arkaluontoista tietoa.

Allekirjoitus muodostetaan HMAC-SHA256-algoritmilla (`HS256`) kahdesta ensimmäisestä osasta ja `JWT_SALAISUUS`-arvosta. Tarkistuksessa palvelin toistaa saman laskennan ja vertaa tulosta tokenin allekirjoitukseen. Jos tokenin sisältöä on muutettu matkalla, laskettu allekirjoitus poikkeaa tokenin allekirjoituksesta ja tarkistus epäonnistuu. Palvelimen ei tarvitse tallentaa tokeneita mihinkään, koska tarkistukseen riittää salaisuus.

Token liitetään pyyntöön `Authorization`-otsakkeessa muodossa `Bearer <token>`. `Bearer` on vakiintunut etuliite tämäntyyppisille tokeneille.

> [!NOTE]
> Tässä demossa palvelin tarkistaa vain sen, että pyynnön mukana on kelvollinen token. Käyttäjiä, kirjautumista tai käyttäjäkohtaisia oikeuksia ei ole, ja token on kirjoitettu asiakassovelluksen koodiin valmiiksi. Pyynnön lähettäjän tunnistaminen ja tokenin hakeminen kirjautumisen yhteydessä tulevat demossa 8.

### 5.2 tarkistaToken-middleware

Tarkistus tehdään middlewaressa, joka saa tavalliseen tapaan kolme parametria.

```ts
const tarkistaToken = (req: Request, res: Response, next: NextFunction) => {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
        return res.status(401).json();
    }
    try {
        const token: string | undefined = header.split(" ")[1];
        if (!token || !JWT_SALAISUUS) { return res.status(500).json() }
        jwt.verify(token, JWT_SALAISUUS, { algorithms: ["HS256"] });
        next();
    } catch {
        res.status(401).json();
    }
}
```

Käsittely etenee vaiheittain:

- `req.headers.authorization` hakee pyynnön `Authorization`-otsakkeen. Jos otsaketta ei ole tai se ei ala merkkijonolla `"Bearer "`, vastaukseksi lähtee koodi `401`. `next()`-kutsua ei tehdä, joten pyyntö ei etene reitteihin asti.
- `header.split(" ")[1]` erottaa varsinaisen tokenin `Bearer`-etuliitteen jälkeen.
- `jwt.verify` laskee allekirjoituksen uudelleen ja vertaa sitä tokenin allekirjoitukseen. Kelvollisella tokenilla suoritus jatkuu `next()`-kutsuun, jolloin pyyntö siirtyy seuraavalle middlewarelle tai reitille.
- `jwt.verify` heittää virheen, jos allekirjoitus ei täsmää tai token on muuten kelvoton, esimerkiksi vanhentunut. Virhe otetaan kiinni `catch`-lohkossa, ja vastauskoodi on `401`.

`{ algorithms: ["HS256"] }` määrittää, että allekirjoitus tarkistetaan vain HS256-algoritmilla. Tokenin otsakkeessa ilmoitettu algoritmi tulee pyynnön mukana, eli se on lähettäjän valittavissa, joten hyväksytyt algoritmit rajataan palvelimen päässä.

Muuttujan `token` arvo tarkistetaan ennen käyttöä, koska `tsconfig.json`-asetuksen `noUncheckedIndexedAccess` takia taulukosta indeksillä haetun arvon tyyppi on `string | undefined`. Samassa ehdossa tarkistetaan myös `JWT_SALAISUUS`. Puuttuva salaisuus on palvelimen asetusvirhe eikä pyynnön virhe, joten siitä vastataan koodilla `500`.

Kutsu `res.status(401).json()` ilman argumenttia lähettää tyhjän vastauksen, jossa on pelkkä tilakoodi. Asiakassovellus lukee vastauksesta vain koodin `401` ja näyttää sen perusteella ilmoituksen "Virheellinen token". Middleware kirjoittaa vastauksen itse, eli se ei käytä demossa 4 tehtyä `Virhe`-luokkaa ja virheenkäsittelijää.

### 5.3 Middlewarejen järjestys ja palvelimen etusivu

Express käy middlewaret ja reitit läpi rekisteröintijärjestyksessä (ks. [demo 4:n luku 6.3](../../demo-04/README.md#63-tuntemattomat-reitit-ja-middlewarejen-järjestys)). `app.use(tarkistaToken)` on kirjoitettu ennen staattisten tiedostojen tarjoilua ja ennen reitittimen liittämistä, joten tarkistus koskee kaikkia palvelimelle tulevia pyyntöjä. Myös `public`-kansion [`index.html`](./public/index.html) on tokenin takana.

> [!WARNING]
> Osoitteen `http://localhost:3007` avaaminen selaimessa antaa tyhjän sivun ja vastauskoodin `401`, koska selaimen osoiteriviltä lähtevään pyyntöön ei voi liittää `Authorization`-otsaketta. Palvelimen etusivun ja rajapinnan saa auki Postmanilla (luku [7.3](#73-rajapinnan-testaaminen-postmanilla)). Asiakassovellus osoitteessa `http://localhost:3000` toimii normaalisti, koska se liittää tokenin jokaiseen pyyntöönsä.

> [!TIP]
> Kokeile harjoituksena siirtää `app.use(tarkistaToken)` -rivi `app.use(express.static(...))` -rivin alapuolelle ja tallentaa tiedosto. Nyt palvelimen etusivu aukeaa selaimessa, mutta osoite `http://localhost:3007/api/ostokset` vastaa edelleen koodilla `401`. Näin rajapinta pysyy suojattuna ja julkinen etusivu näkyy kaikille. Palauta rivi kokeilun jälkeen alkuperäiselle paikalleen.

### 5.4 Tokenin luominen luoJWT.mjs-skriptillä

Tokenit muodostetaan `jwt.sign`-funktiolla samalla salaisuudella, jolla ne tarkistetaan. Demossa tätä varten on erillinen skripti [`luoJWT.mjs`](./luoJWT.mjs), jonka olennainen sisältö on:

```js
const token = jwt.sign({}, JWT_SALAISUUS, { algorithm: "HS256" });

console.log(token);
```

Ensimmäinen argumentti on tokenin sisältöosa. Tässä se on tyhjä olio, jolloin tokeniin tulee vain `jsonwebtoken`-paketin lisäämä muodostusaika `iat`. Käyttäjätunnuksille tai rooleille ei ole tarvetta, koska pyynnöistä tarkistetaan pelkkä allekirjoitus.

Skripti on kirjoitettu JavaScriptillä (`.mjs`), joten sen voi ajaa suoraan Nodella ilman `tsx`-työkalua. Komento ajetaan `server`-kansiossa.

```bash
node luoJWT.mjs
```

Tulostuksen ensimmäisellä rivillä on `dotenv`-paketin ilmoitus luetusta `.env`-tiedostosta, ja sen jälkeen tulee itse token omalla rivillään. Token kopioidaan tiedostoon `client/src/App.tsx` `Authorization`-otsakkeen arvoksi `Bearer`-etuliitteen perään. Demon asiakassovelluksessa on valmiina token, joka on muodostettu salaisuudella `SuuriSalaisuus123!!!`. Uusi token tarvitaan vain, jos salaisuuden vaihtaa toiseksi.

> [!WARNING]
> `jwt.sign`-kutsussa ei anneta voimassaoloaikaa (`expiresIn`), joten token kelpaa niin kauan kuin salaisuus pysyy samana. Token on myös kirjoitettu suoraan asiakassovelluksen koodiin, josta kuka tahansa löytää sen selaimen kehittäjätyökaluilla. Molemmat ovat demon yksinkertaistuksia. Oikeassa sovelluksessa token annetaan kirjautumisen yhteydessä ja sille asetetaan lyhyt voimassaoloaika.

## 6 Asiakassovelluksen pyynnöt ja Viten proxy

Demossa 6 palvelimelle lisättiin `cors`-middleware, koska selaimessa ajettava asiakassovellus haki dataa suoraan osoitteesta `http://localhost:3006`, eli eri alkuperästä kuin mistä itse sivu oli ladattu (ks. [demo 6:n luku 4.1](../../demo-06/server/README.md#41-cors-ja-pyynnöt-toisesta-osoitteesta)). Tässä demossa sama rivi on kommentoitu pois.

```ts
//app.use(cors({ origin: "http://localhost:3000"}));
```

Asiakassovellus lähettää pyyntönsä osoitteeseen `/api/ostokset` ilman palvelimen nimeä ja porttia, jolloin pyyntö lähtee samaan osoitteeseen, josta sivu on ladattu. Viten kehityspalvelin välittää `/api`-alkuiset pyynnöt eteenpäin Express-palvelimelle. Välitys määritetään tiedostossa `client/vite.config.ts`.

```ts
server: {
  port: 3000,
  proxy: {
    "/api": {
      target: "http://localhost:3007",
      changeOrigin: true
    }
  }
}
```

Selaimen kannalta pyyntö ja vastaus kulkevat saman alkuperän sisällä, joten CORS-otsakkeita ei tarvita. Välitys tapahtuu Viten kehityspalvelimen ja Express-palvelimen välillä palvelinohjelmien kesken, eivätkä selaimen alkuperäsäännöt koske sitä. `cors`-paketti on edelleen asennettuna ja tuotu `index.ts`-tiedostoon, joten middlewaren saa takaisin käyttöön poistamalla rivin alusta kauttaviivat.

> [!NOTE]
> Pyyntöjen välitys on Viten kehityspalvelimen ominaisuus, eikä se ole käytössä valmiissa julkaistussa sovelluksessa. Julkaisussa sama tilanne ratkaistaan tarjoilemalla asiakassovellus ja rajapinta samasta osoitteesta tai ottamalla CORS-otsakkeet käyttöön.

## 7 Käynnistäminen ja testaaminen

### 7.1 Palvelimen ja asiakassovelluksen käynnistäminen

Sovelluksen kokonaisuus vaatii kaksi käynnissä olevaa kehityspalvelinta, joten VS Codessa avataan kaksi Terminal-välilehteä.

Ensimmäisessä välilehdessä käynnistetään palvelin `server`-kansiossa dokumentin alussa kuvatulla tavalla. Terminaaliin tulostuu lokiviesti:

```
Palvelin käynnistettiin osoitteeseen: http://localhost:3007
```

Toisessa välilehdessä siirrytään `client`-kansioon. Asiakassovelluksen riippuvuudet asennetaan ja Viten kehityspalvelin käynnistetään samoilla `npm ci` ja `npm run dev` -komennoilla kuin palvelinprojektissa. Vite tulostaa Terminaaliin painettavan linkin osoitteeseen `http://localhost:3000`. React-sovelluksen rakenne käydään läpi `client`-kansion omassa dokumentaatiossa.

Kumpikin kehityspalvelin sammutetaan omassa välilehdessään `Ctrl+C`-näppäinyhdistelmällä.

> [!WARNING]
> Neljän asetuksen pitää olla keskenään yhteensopivia:
>
> - Viten kehityspalvelin ajaa asiakassovellusta portissa `3000`, joka on määritetty tiedostossa `client/vite.config.ts`
> - saman tiedoston `proxy`-asetuksessa kohdeosoite on `http://localhost:3007`
> - palvelin kuuntelee porttia `3007`
> - `server/.env`-tiedoston `JWT_SALAISUUS` vastaa asiakassovellukseen tallennettua tokenia
>
> Jos jotain näistä muuttaa, sama muutos tehdään myös muihin kohtiin.

### 7.2 Testaaminen asiakassovelluksen kautta

Avaa selaimessa osoite `http://localhost:3000`. Perustoiminnot ovat samat kuin demossa 6:

- Sivun avaaminen. Listalla näkyvät tietokannan rivit.
- Tuotteen lisääminen. Kirjoita nimi tekstikenttään ja paina "Lisää tuote ostoslistaan".
- Tuotteen poistaminen. Paina rivin roskakorikuvaketta.
- Tyhjä lisäys. Paina lisäysnappia ilman tekstiä. Palvelin vastaa koodilla `400`, ja näkymään tulee ilmoitus "Virhe pyynnön tiedoissa".

Tokenin toiminnan voi kokeilla rikkomalla sen. Avaa tiedosto `client/src/App.tsx`, muuta tokenin viimeinen merkki toiseksi ja tallenna. Lataa sivu uudelleen selaimessa. Lista jää tyhjäksi, ja näkymään tulee punainen ilmoitus "Virheellinen token", koska palvelin vastasi koodilla `401`. Palauta merkki kokeilun jälkeen.

Pyynnöt ja vastaukset näkyvät selaimen kehittäjätyökaluissa:

- Avaa työkalut F12-näppäimellä ja valitse Network-välilehti.
- Lataa sivu uudelleen ja valitse listasta `ostokset`-pyyntö.
- Vastauksen tilakoodi näkyy pyynnön rivillä, ja lähetetty `Authorization`-otsake löytyy Headers-välilehden Request Headers -osiosta.

Salaisuuden vaihtamisen voi kokeilla samaan tapaan:

- Sammuta palvelin `Ctrl+C`:llä ja vaihda `.env`-tiedoston `JWT_SALAISUUS` toiseen arvoon.
- Käynnistä palvelin uudelleen. Muutos vaatii uudelleenkäynnistyksen, koska `.env` luetaan vain käynnistyksen yhteydessä.
- Lataa asiakassovellus uudelleen. Vanha token ei enää kelpaa, ja näkymään tulee sama ilmoitus "Virheellinen token".
- Muodosta uusi token komennolla `node luoJWT.mjs` ja kopioi se tiedostoon `client/src/App.tsx`. Sivun lataamisen jälkeen lista näkyy taas.

### 7.3 Rajapinnan testaaminen Postmanilla

Rajapinta toimii edelleen ilman asiakassovellusta, ja pyynnöt muodostetaan Postmanilla samaan tapaan kuin demoissa 3-6. Selaimen osoiterivi ei tässä demossa riitä edes GET-pyyntöihin, koska pyyntöön pitää liittää `Authorization`-otsake. Token otetaan `node luoJWT.mjs` -komennon tulostuksesta tai asiakassovelluksen koodista.

Pyyntö muodostetaan näin:

- Valitse metodi pudotusvalikosta.
- Kirjoita osoitteeksi `http://localhost:3007/api/ostokset`.
- Lisää Headers-välilehdelle avain `Authorization` ja sen arvoksi `Bearer <token>`.
- POST- ja PUT-pyynnöissä valitse Body-välilehdeltä raw ja JSON, ja kirjoita pyynnön sisältö.

Esimerkiksi uuden tuotteen lisääminen:

```
POST http://localhost:3007/api/ostokset
Headers: Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Body (raw, JSON): {"tuote": "Kaurajuomaa", "poimittu": false}
```

Tokenin tarkistuksen voi kokeilla poistamalla `Authorization`-otsakkeen valinnan Headers-välilehdeltä ja lähettämällä saman pyynnön uudelleen. Vastaus on tyhjä ja sen tilakoodi `401`. Sama tapahtuu, jos tokenin merkkejä muuttaa.

Kelvollisella tokenilla rajapinta vastaa kuten demossa 6:

- Tuntematon reitti palauttaa koodin `404` ja vastauksen `{"virhe":"Virheellinen reitti"}`.
- Puuttuva `tuote`-kenttä POST-pyynnön bodyssa palauttaa koodin `400` ja vastauksen `{"virhe":"Virheellinen pyynnön body"}`.
- Olemattoman rivin poistaminen palauttaa koodin `404` ja vastauksen `{"virhe":"Ostosta ei löytynyt"}`.

Virheellisten pyyntöjen testaaminen muilta osin on käyty läpi [demo 4:n luvussa 8](../../demo-04/README.md#8-palvelimen-käynnistäminen-ja-reittien-testaaminen). Myös palvelimen oman etusivun saa auki Postmanilla lähettämällä GET-pyynnön osoitteeseen `http://localhost:3007` samalla `Authorization`-otsakkeella, jolloin vastauksena tulee `index.html`-tiedoston sisältö.

## 8 Lopuksi

Rajapinnan reitit, tietokanta ja virheenkäsittely säilyivät sellaisenaan demosta 6. Palvelimelle tuli kaksi muutosta:

- token-tarkistus omana middlewarena ennen staattisia tiedostoja ja reittejä
- CORS-otsakkeiden tilalle Viten kehityspalvelimen kautta kulkeva pyyntöjen välitys

Token-tarkistus on koko sovellusta koskeva sääntö, joka kirjoitetaan yhteen paikkaan. Yksittäisiä reittejä ei tarvinnut muuttaa lainkaan, vaikka jokainen niistä on nyt tokenin takana. Sama rakenne toistuu muissakin koko sovellusta koskevissa säännöissä, kuten lokituksessa ja pyyntöjen määrän rajoittamisessa.

Tässä demossa token on kirjoitettu asiakassovelluksen koodiin valmiiksi, eikä palvelin tunnista pyynnön lähettäjää. Demossa 8 siirrytään käyttäjänhallintaan, jossa token haetaan palvelimelta kirjautumisen yhteydessä. Asiakassovelluksen toteutus jatkuu `client`-kansion dokumentaatiossa.
