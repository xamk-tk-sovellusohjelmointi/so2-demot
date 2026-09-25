# Demo 6: Asiakassovelluksen toteutus (palvelinsovellus)

Ostoslistaa on tähän asti käytetty Postmanilla kirjoittamalla pyynnöt käsin. Tässä demossa listalle tehdään oikea käyttöliittymä. Käyttäjä avaa selaimessa osoitteen `http://localhost:3000` ja näkee ostoslistan, tekstikentän uuden tuotteen lisäämiseen ja roskakorikuvakkeen jokaisen rivin kohdalla. Lista haetaan palvelimen rajapinnasta, ja jokainen lisäys ja poisto tallentuu palvelimen tietokantaan. Pyynnön ajan näkymän päällä pyörii latausanimaatio.

Demo jakautuu kahteen kansioon:

- `server` sisältää Express-palvelimen ja REST API -rajapinnan, joka on lähes sama sovellus kuin demossa 5.
- `client` sisältää Vitellä rakennetun React-sovelluksen, joka käyttää rajapintaa.

Tämä README käsittelee `server`-kansion palvelinsovellusta. React-asiakassovelluksen rakentaminen käydään läpi erikseen `client`-kansion omassa dokumentaatiossa. Palvelimen puolella muutoksia demoon 5 on vähän, koska rajapinta on jo valmis. Selaimessa ajettava sovellus asettaa rajapinnalle kuitenkin yhden vaatimuksen, jota Postman ei aseta, ja se käydään läpi luvussa [4.1](#41-cors-ja-pyynnöt-toisesta-osoitteesta).

## Sisällysluettelo

- [1 Projektin rakenne ja määritystiedostot](#1-projektin-rakenne-ja-määritystiedostot)
- [2 Riippuvuuksien asennus](#2-riippuvuuksien-asennus)
- [3 Tietokanta ja Prisma Client](#3-tietokanta-ja-prisma-client)
- [4 Express-palvelin ja uudet middlewaret](#4-express-palvelin-ja-uudet-middlewaret)
  - [4.1 CORS ja pyynnöt toisesta osoitteesta](#41-cors-ja-pyynnöt-toisesta-osoitteesta)
  - [4.2 Keinotekoinen viive vastauksiin](#42-keinotekoinen-viive-vastauksiin)
- [5 Virheenkäsittely ja reitit](#5-virheenkäsittely-ja-reitit)
- [6 Käynnistäminen ja testaaminen](#6-käynnistäminen-ja-testaaminen)
  - [6.1 Palvelimen ja asiakassovelluksen käynnistäminen](#61-palvelimen-ja-asiakassovelluksen-käynnistäminen)
  - [6.2 Testaaminen asiakassovelluksen kautta](#62-testaaminen-asiakassovelluksen-kautta)
  - [6.3 Rajapinnan testaaminen Postmanilla](#63-rajapinnan-testaaminen-postmanilla)
- [7 Lopuksi](#7-lopuksi)

**Projektin asentaminen ja käynnistäminen**

Kun olet kloonannut demon omalle koneellesi, siirry VS Coden Terminalissa demon `server`-kansioon ja asenna riippuvuudet komennolla

```bash
npm ci
```

Luo sen jälkeen `server`-kansion juureen tiedosto `.env`, jonka sisällöksi kirjoitat

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

Palvelin käynnistyy oletuksena osoitteeseen `http://localhost:3006`. Palvelimen saa sammutettua Terminalissa `Ctrl+C`-näppäinyhdistelmällä ja käynnistettyä uudelleen samalla `npm run dev` -komennolla. Asiakassovellus käynnistetään erikseen `client`-kansiossa, ks. luku [6.1](#61-palvelimen-ja-asiakassovelluksen-käynnistäminen).

> [!WARNING]
> `.env`-tiedosto ja `generated/prisma`-kansio on merkitty `.gitignore`-tiedostossa versionhallinnan ulkopuolelle. Kloonatussa projektissa niitä ei siis ole valmiina, ja yllä olevat kaksi lisävaihetta pitää tehdä itse ennen `npm run dev` -komennon ajamista, tai palvelin ei käynnisty. Perustelut löytyvät [demo 5:n luvuista 3.1](../../demo-05/README.md#31-ympäristömuuttujat-ja-env) ja [3.4](../../demo-05/README.md#34-prisma-client-ja-tietokantayhteys).

## 1 Projektin rakenne ja määritystiedostot

`server` ja `client` ovat kaksi erillistä Node-projektia. Molemmissa on oma `package.json`, oma `package-lock.json` ja asennuksen jälkeen oma `node_modules`-kansio, eikä niillä ole yhteisiä riippuvuuksia. Käytännössä tämä tarkoittaa, että npm-komennot ajetaan aina siinä kansiossa, jota ne koskevat. Jos VS Code on auki demon juuressa, Terminalissa siirrytään ensin oikeaan kansioon komennolla `cd server` tai `cd client`.

Palvelimen määritystiedostot ovat samat kuin demossa 5. `tsconfig.json` on muuttumaton, ja keskeiset asetukset on käyty läpi [demo 5:n luvussa 1.2](../../demo-05/README.md#12-tsconfigjson-ja-typescript-asetukset). `package.json`:iin on tullut projektin nimen lisäksi kaksi uutta riippuvuutta, jotka käsitellään luvussa [2](#2-riippuvuuksien-asennus). Palvelin ajetaan `dev`-skriptillä (`tsx watch ./index.ts`), joka käynnistää palvelimen automaattisesti uudelleen aina, kun jokin palvelimen tiedosto tallennetaan.

Yhden rivin mittaisessa `.nvmrc`-tiedostossa on arvo `24`, jolla `nvm use` -komento valitsee projektiin Node-version 24. Demo on versiolukittu Node 24 -versioon ja `package.json`:ssa sekä `package-lock.json`:ssa määriteltyihin riippuvuusversioihin.

## 2 Riippuvuuksien asennus

Riippuvuudet asennetaan `server`-kansiossa `npm ci` -komennolla, joka asentaa täsmälleen `package-lock.json`-tiedostoon kirjatut versiot. Ero `npm install` -komentoon on selitetty [demo 1:n luvussa 2.1](../../demo-01/README.md#21-npm-ci-vs-npm-install).

```json
"dependencies": {
  "@prisma/adapter-better-sqlite3": "7.10.0",
  "@prisma/client": "7.10.0",
  "cors": "2.8.6",
  "dotenv": "^18.0.1",
  "express": "5.2.1"
},
"devDependencies": {
  "@types/better-sqlite3": "9.6.0",
  "@types/cors": "2.8.19",
  "@types/express": "5.0.6",
  "@types/node": "22.20.3",
  "prisma": "7.10.0",
  "tsx": "4.23.13",
  "typescript": "7.0.2"
}
```

Uutta demoon 5 verrattuna on kaksi pakettia:

- `cors` on middleware, joka lisää palvelimen vastauksiin otsakkeet, joilla selain sallii rajapinnan käytön toisesta osoitteesta (luku [4.1](#41-cors-ja-pyynnöt-toisesta-osoitteesta)).
- `@types/cors` sisältää TypeScript-tyyppimäärittelyt `cors`-paketille.

Paketit lisättiin projektiin komennoilla `npm install cors` ja `npm install -D @types/cors`. Muut paketit ovat samat kuin demossa 5, ja ne on lueteltu [demo 5:n luvussa 2.2](../../demo-05/README.md#22-projektin-riippuvuudet).

## 3 Tietokanta ja Prisma Client

Tietokantaan liittyvät tiedostot ovat samat kuin demossa 5, eikä niihin tehdä tässä demossa muutoksia:

- [`prisma/schema.prisma`](./prisma/schema.prisma) sisältää `Ostos`-mallin, ks. [demo 5:n luku 3.2](../../demo-05/README.md#32-tietomalli-schemaprisma-tiedostossa)
- [`prisma7.config.ts`](./prisma7.config.ts) on Prisman komentorivityökalun asetustiedosto, ks. [demo 5:n luku 3.3](../../demo-05/README.md#33-prisman-asetustiedosto-ja-tietokannan-migraatiot)
- [`prisma/migrations`](./prisma/migrations) sisältää saman migraation kuin demossa 5, uudella aikaleimalla kansion nimessä
- [`lib/prisma.ts`](./lib/prisma.ts) muodostaa tietokantayhteyden ja vie `prisma`-olion reittien käyttöön, ks. [demo 5:n luku 3.4](../../demo-05/README.md#34-prisma-client-ja-tietokantayhteys)
- `.env` sisältää tietokannan osoitteen `DATABASE_URL` ja luodaan itse käsin, ks. [demo 5:n luku 3.1](../../demo-05/README.md#31-ympäristömuuttujat-ja-env)

`dev.db`-tiedosto tulee demon mukana, ja migraatio on ajettu siihen valmiiksi. Tietokannassa on kolme riviä (Leipää, Kahvia ja Maitoa), jotka näkyvät asiakassovelluksessa heti ensimmäisellä avauskerralla.

## 4 Express-palvelin ja uudet middlewaret

Tietokanta ja rajapinta ovat siis valmiina. Seuraavaksi katsotaan palvelimen käynnistystiedostoa [`index.ts`](./index.ts), johon demon molemmat uudet middlewaret on lisätty.

```ts
import express, { type Application, type NextFunction, type Request, type Response } from 'express';
import path from 'path';
import apiOstoksetRouter from './routes/apiOstokset';
import virhekasittelija, { Virhe } from './errors/virhekasittelija';
import cors from 'cors';

const app: Application = express();

const port: number = Number(process.env.PORT) || 3006;

app.use(cors({ origin: "http://localhost:3000" }));

app.use((req: Request, res: Response, next: NextFunction) => {
    setTimeout(() => next(), 1000);
});

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

Tiedostossa on kolme eroa demon 5 vastaavaan tiedostoon:

- porttinumero on `3006`
- `cors`-middleware on rekisteröity ensimmäisenä (luku [4.1](#41-cors-ja-pyynnöt-toisesta-osoitteesta))
- pyyntöihin lisätään sekunnin viive (luku [4.2](#42-keinotekoinen-viive-vastauksiin))

Loput toimivat samalla tavalla kuin demossa 5:

- `app`-muuttujan luonti ja palvelimen käynnistys `app.listen`-metodilla, ks. [demo 1:n luku 3](../../demo-01/README.md#3-express-palvelimen-luonti-ja-käynnistys)
- staattisten tiedostojen tarjoilu `public`-kansiosta, ks. [demo 1:n luku 4](../../demo-01/README.md#4-staattisten-tiedostojen-tarjoilu)
- `apiOstoksetRouter`:n liittäminen osoitteeseen `/api/ostokset`, ks. [demo 3:n luku 6.1](../../demo-03/README.md#61-router-ja-json-pyyntöjen-jäsentäminen)
- tuntemattomien reittien käsittely ja virheenkäsittelijän rekisteröinti, ks. [demo 4:n luku 6.3](../../demo-04/README.md#63-tuntemattomat-reitit-ja-middlewarejen-järjestys)

`public`-kansion [`index.html`](./public/index.html) näkyy edelleen palvelimen juuressa osoitteessa `http://localhost:3006`. Sivulla on lyhyt kuvaus demon aiheesta ja ohje asiakassovelluksen käynnistämiseen. Kyseessä on palvelimen oma etusivu, ja asiakassovelluksen näkymä löytyy eri osoitteesta (luku [6.1](#61-palvelimen-ja-asiakassovelluksen-käynnistäminen)).

### 4.1 CORS ja pyynnöt toisesta osoitteesta

Selain rajoittaa sitä, mihin osoitteisiin sivulla ajettava JavaScript-koodi saa olla yhteydessä. Vertailu tehdään sivun alkuperän perusteella. Alkuperä muodostuu protokollasta, palvelimen nimestä ja portista. Asiakassovellus ladataan Viten kehityspalvelimelta osoitteesta `http://localhost:3000`, ja rajapinta vastaa osoitteessa `http://localhost:3006`. Portti on eri, joten selaimen kannalta kyseessä on kaksi eri alkuperää.

Selaimen oletussääntö on, että sivu saa lähettää pyynnön toiseen alkuperään, mutta se ei saa lukea vastausta. Poikkeuksena on vastaus, jossa palvelin on erikseen ilmoittanut sallivansa kyseisen alkuperän. Ilmoitus tehdään HTTP-otsakkeilla, ja mekanismin nimi on CORS (Cross-Origin Resource Sharing).

Demoissa 3-5 rajapintaa käytettiin Postmanilla, joka ei ole selain eikä noudata tätä sääntöä. Sen takia rajapinta toimi ilman lisämäärityksiä. Nyt samaa rajapintaa käyttää selaimessa ajettava sovellus, joten palvelimen vastauksiin pitää lisätä sallivat otsakkeet.

```ts
import cors from 'cors';

app.use(cors({ origin: "http://localhost:3000" }));
```

`cors`-middleware lisää vastaukseen otsakkeen `Access-Control-Allow-Origin: http://localhost:3000`. Kun otsake on paikallaan, selain antaa asiakassovelluksen lukea vastauksen sisällön. `origin`-asetus rajaa sallitun alkuperän yhteen osoitteeseen. Ilman asetuksia `cors()` sallisi pyynnöt mistä tahansa alkuperästä (`*`), mikä sopii avoimeen julkiseen rajapintaan. Tätä rajapintaa käyttää vain oma asiakassovellus, joten sallittu osoite kirjoitetaan täsmällisesti.

Middleware rekisteröidään ennen staattisia tiedostoja ja reittejä, koska Express käy middlewaret ja reitit läpi rekisteröintijärjestyksessä (ks. [demo 4:n luku 6.3](../../demo-04/README.md#63-tuntemattomat-reitit-ja-middlewarejen-järjestys)). Näin otsakkeet tulevat mukaan kaikkiin vastauksiin.

Otsakkeet voi tarkistaa selaimen kehittäjätyökaluista:

- Avaa työkalut F12-näppäimellä.
- Valitse Network-välilehti ja lataa sivu uudelleen.
- Valitse listasta jokin pyyntö. Response Headers -osiossa näkyy `Access-Control-Allow-Origin`.

Samasta näkymästä näkyy myös jokaisen pyynnön kesto, johon vaikuttaa seuraavassa luvussa käsiteltävä viive.

> [!NOTE]
> Selain lähettää ennen POST- ja DELETE-pyyntöä erillisen OPTIONS-pyynnön samaan osoitteeseen ja tarkistaa vastauksesta, mitkä metodit ja otsakkeet palvelin sallii. Varsinainen pyyntö lähtee vasta hyväksytyn tarkistuksen jälkeen. `cors`-middleware vastaa näihin OPTIONS-pyyntöihin automaattisesti. Käsin kirjoitetussa otsakekäsittelyssä OPTIONS jää helposti huomaamatta, jolloin listan lukeminen toimii mutta lisääminen ja poistaminen eivät.

> [!TIP]
> Kokeile harjoituksena kommentoida `app.use(cors(...))` -rivi pois ja tallentaa tiedosto. Lataa asiakassovellus tämän jälkeen uudelleen selaimessa. Näkymään tulee punainen ilmoitus "Palvelimeen ei saada yhteyttä", ja selaimen kehittäjätyökalujen (F12) Console-välilehdellä näkyy CORS-virhe. Sama rajapinta vastaa samaan aikaan Postmanissa täysin normaalisti. Palauta rivi kokeilun jälkeen.

CORS-otsakkeita tarvitaan tässä demossa kehitysvaiheen takia, koska asiakassovellusta ja rajapintaa ajetaan kahdessa eri portissa. Yksi tavallinen tapa julkaista valmis sovellus on kääntää React-sovellus staattisiksi tiedostoiksi ja tarjoilla ne saman palvelimen `public`-kansiosta. Silloin sivu ja rajapinta ovat samassa alkuperässä.

### 4.2 Keinotekoinen viive vastauksiin

Asiakassovellus näyttää latausanimaation aina, kun pyyntö on kesken. Palvelin, tietokanta ja selain ovat kehitysvaiheessa samalla koneella. Vastaus tulisi muutamassa millisekunnissa, ja animaatio välähtäisi näkyviin liian lyhyeksi ajaksi. Sen takia palvelimeen on lisätty middleware, joka viivyttää jokaista pyyntöä sekunnilla.

```ts
app.use((req: Request, res: Response, next: NextFunction) => {
    setTimeout(() => next(), 1000);
});
```

Middlewaren kolmas parametri `next` siirtää käsittelyn eteenpäin seuraavalle middlewarelle tai reitille. Tässä `next()`-kutsu on `setTimeout`-funktion sisällä, joten käsittely jatkuu vasta sekunnin kuluttua. Middleware ei kirjoita vastausta itse, joten pyyntö käsitellään muuten normaalisti.

Viive koskee kaikkia pyyntöjä, myös palvelimen omaa etusivua osoitteessa `http://localhost:3006`, koska middleware on rekisteröity ennen staattisten tiedostojen tarjoilua.

> [!WARNING]
> Viive on demossa vain opetustarkoituksessa, ja oikeasta sovelluksesta se poistetaan. Latausanimaatio itsessään on silti tarpeellinen, koska oikeassa käytössä verkkoyhteys ja tietokantakyselyt kestävät selvästi kauemmin kuin paikallisesti.

## 5 Virheenkäsittely ja reitit

[`errors/virhekasittelija.ts`](./errors/virhekasittelija.ts) ja [`routes/apiOstokset.ts`](./routes/apiOstokset.ts) ovat muuttumattomia demoon 5 verrattuna. `Virhe`-luokka ja virheenkäsittelijä-middleware on selitetty [demo 4:n luvussa 6](../../demo-04/README.md#6-virheenkäsittelyn-perusta), ja Prisma Clientilla toteutetut reitit [demo 5:n luvussa 6](../../demo-05/README.md#6-reittien-rakentaminen-prisma-clientilla).

Asiakassovellus käyttää rajapinnasta kolmea reittiä:

- `GET /api/ostokset` hakee koko listan, kun sivu avataan
- `POST /api/ostokset` lisää uuden tuotteen
- `DELETE /api/ostokset/:id` poistaa tuotteen

`GET /api/ostokset/:id` ja `PUT /api/ostokset/:id` ovat rajapinnassa edelleen mukana, ja niitä voi testata Postmanilla (luku [6.3](#63-rajapinnan-testaaminen-postmanilla)).

Jokainen muokkaava reitti vastaa koko ostoslistalla (`findMany`). Asiakassovellus päivittää oman näkymänsä suoraan tästä vastauksesta, joten erillistä uutta GET-pyyntöä ei tarvita.

Asiakassovellus lähettää POST-pyynnön bodyssa kentät `id`, `tuote` ja `poimittu`. Reitti lukee bodysta vain kentät `tuote` ja `poimittu`, joten ylimääräinen `id` jää käyttämättä eikä aiheuta virhettä. Uuden rivin `id`-arvon muodostaa tietokanta, ks. [demo 5:n luku 3.2](../../demo-05/README.md#32-tietomalli-schemaprisma-tiedostossa).

Reittien palauttamat virhekoodit näkyvät käyttäjälle asiakassovelluksen ilmoituksina:

- Virhekoodi `400` ja viesti "Virheellinen pyynnön body" tulevat esimerkiksi silloin, kun tuotetta yritetään lisätä tyhjällä tekstikentällä. Asiakassovellus näyttää tällöin ilmoituksen "Virhe pyynnön tiedoissa".
- Muut virhekoodit, kuten olemattoman rivin poistamisesta tuleva `404`, näkyvät ilmoituksena "Palvelimella tapahtui odottamaton virhe".
- Jos palvelin ei ole käynnissä, pyyntö ei saa vastausta lainkaan, ja asiakassovellus näyttää ilmoituksen "Palvelimeen ei saada yhteyttä".

Validoinnin sisältö ja perustelut löytyvät [demo 4:n luvusta 7.2](../../demo-04/README.md#72-pyynnön-rungon-validointi).

## 6 Käynnistäminen ja testaaminen

### 6.1 Palvelimen ja asiakassovelluksen käynnistäminen

Sovelluksen kokonaisuus vaatii kaksi käynnissä olevaa kehityspalvelinta, joten VS Codessa avataan kaksi Terminal-välilehteä.

Ensimmäisessä välilehdessä käynnistetään palvelin `server`-kansiossa dokumentin alussa kuvatulla tavalla. Terminaaliin tulostuu tuttu lokiviesti:

```
Palvelin käynnistettiin osoitteeseen: http://localhost:3006
```

Toisessa välilehdessä siirrytään `client`-kansioon. Asiakassovelluksen riippuvuudet asennetaan ja Viten kehityspalvelin käynnistetään samoilla `npm ci` ja `npm run dev` -komennoilla kuin palvelinprojektissa. Vite tulostaa Terminaaliin painettavan linkin osoitteeseen `http://localhost:3000`. React-sovelluksen rakenne ja Vite-projektin asetukset käydään läpi `client`-kansion omassa dokumentaatiossa.

Kumpikin kehityspalvelin sammutetaan omassa välilehdessään `Ctrl+C`-näppäinyhdistelmällä.

> [!WARNING]
> Kolmen osoitteen pitää olla keskenään yhteensopivia:
>
> - Viten kehityspalvelin ajaa asiakassovellusta portissa `3000`, joka on määritetty tiedostossa `client/vite.config.ts`
> - palvelimen `cors`-asetuksessa sallittu alkuperä on `http://localhost:3000`
> - asiakassovelluksen käyttämä rajapintaosoite on `http://localhost:3006/api/ostokset`
>
> Jos jotain näistä porteista muuttaa, sama muutos tehdään myös muihin kohtiin.

### 6.2 Testaaminen asiakassovelluksen kautta

Avaa selaimessa osoite `http://localhost:3000`. Kokeiltavia asioita on viisi:

- Sivun avaaminen. Näkymän päällä pyörii latausanimaatio noin sekunnin ajan, jonka jälkeen listalla näkyvät tietokannan kolme riviä.
- Tuotteen lisääminen. Kirjoita nimi tekstikenttään ja paina "Lisää tuote ostoslistaan". Rivi ilmestyy listalle, kun palvelin on vastannut POST-pyyntöön.
- Tuotteen poistaminen. Paina rivin roskakorikuvaketta.
- Tyhjä lisäys. Paina lisäysnappia ilman tekstiä. Palvelin vastaa virhekoodilla `400`, ja näkymään tulee punainen ilmoitus.
- Sivun lataaminen uudelleen. Lista pysyy samana, koska rivit on tallennettu `dev.db`-tietokantaan.

Kokeile lopuksi sammuttaa palvelin `Ctrl+C`:llä ja painaa lisäysnappia. Asiakassovellus ilmoittaa, ettei palvelimeen saada yhteyttä. Käynnistä palvelin uudelleen ja lataa sivu.

### 6.3 Rajapinnan testaaminen Postmanilla

Rajapinta toimii edelleen ilman asiakassovellusta, ja pyynnöt muodostetaan Postmanilla samaan tapaan kuin demoissa 3-5. Osoitteen portti on nyt `3006`. Esimerkiksi PUT-reitti, jota asiakassovellus ei käytä, testataan näin:

```
PUT http://localhost:3006/api/ostokset/1
Body (raw, JSON): {"tuote": "Kaurajuomaa", "poimittu": true}
```

Muutos näkyy asiakassovelluksessa, kun selaimessa avatun sivun lataa uudelleen. Asiakassovellus hakee listan vain sivun avaamisen yhteydessä ja omien pyyntöjensä vastauksista.

Virheellisten pyyntöjen testaaminen toimii samoin kuin [demo 4:n luvussa 8](../../demo-04/README.md#8-palvelimen-käynnistäminen-ja-reittien-testaaminen).

## 7 Lopuksi

Palvelinsovellus säilyi lähes sellaisenaan demosta 5, ja demon uusi osa on selaimessa ajettava React-asiakassovellus. Palvelimen puolelle tuli kaksi asiaa:

- CORS-otsakkeet, joiden ansiosta selaimessa ajettava sovellus saa lukea toisesta alkuperästä tulevan vastauksen
- keinotekoinen viive, jonka avulla asiakassovelluksen latausanimaatio näkyy myös paikallisessa kehitysympäristössä

Rajapinnan reitit, vastausten muoto ja virhekoodit pysyivät samoina riippumatta siitä, käytetäänkö rajapintaa Postmanilla vai asiakassovelluksella. Tämä on REST API:n suunnittelun kannalta oleellista, koska sama rajapinta palvelee Postmania, React-sovellusta ja vaikkapa mobiilisovellusta, kun pyynnöt ja vastaukset noudattavat samaa sopimusta. Asiakassovelluksen toteutus jatkuu `client`-kansion dokumentaatiossa.
