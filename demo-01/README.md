# Demo 1: Express-palvelimen perusteet

Ensimmäisessä palvelinkehityksen demossa rakennetaan yksinkertainen palvelinsovellus Express-kehyksellä. Kyseessä on palvelinohjelmoinnin oma versio "Hello World" -sovelluksesta, jolla varmistetaan uuden tekniikan toimivan ja opetellaan sen peruskäyttöä. Palvelin tarjoilee käyttäjälle etusivun, jolta löytyy muutama linkki, ja linkkejä painamalla selain pyytää palvelimelta eri osoitteita. Palvelin vastaa jokaiseen pyyntöön omalla tervehdyksellään, joko käyttäjän itse antamalla nimellä muotoillun tervehdyksen tai yksinkertaisen "Moikka!"-viestin.

## Sisällysluettelo

- [1 Node-projektin alustus ja määritykset](#1-node-projektin-alustus-ja-määritykset)
  - [1.1 package.json ja projektin perustiedot](#11-packagejson-ja-projektin-perustiedot)
  - [1.2 tsconfig.json ja TypeScript-asetukset](#12-tsconfigjson-ja-typescript-asetukset)
- [2 Riippuvuuksien asennus](#2-riippuvuuksien-asennus)
  - [2.1 npm ci vs. npm install](#21-npm-ci-vs-npm-install)
  - [2.2 Projektin riippuvuudet](#22-projektin-riippuvuudet)
- [3 Express-palvelimen luonti ja käynnistys](#3-express-palvelimen-luonti-ja-käynnistys)
- [4 Staattisten tiedostojen tarjoilu](#4-staattisten-tiedostojen-tarjoilu)
- [5 Reittien rakentaminen](#5-reittien-rakentaminen)
  - [5.1 GET /heippa ja kyselyparametrit](#51-get-heippa-ja-kyselyparametrit)
  - [5.2 GET /moikka](#52-get-moikka)
- [6 Palvelimen käynnistäminen ja reittien testaaminen](#6-palvelimen-käynnistäminen-ja-reittien-testaaminen)
- [7 Lopuksi](#7-lopuksi)

**Projektin asentaminen ja käynnistäminen**

Kun olet kloonannut demon omalle koneellesi, siirry VS Coden Terminalissa demon kansioon ja asenna riippuvuudet komennolla

```bash
npm ci
```

ja käynnistä palvelin kehitystilassa komennolla

```bash
npm run dev
```

Palvelin käynnistyy oletuksena osoitteeseen `http://localhost:3001`. Palvelimen pysäyttää komennolla `Ctrl+C`, ja käynnistää uudelleen ajamalla `npm run dev` uudelleen.

## 1 Node-projektin alustus ja määritykset

Tällä opintojaksolla ohjelmoitavat palvelinsovellukset suoritetaan Node.js-ympäristössä. Aiemmissa React-demoissa Vite-työkalu rakensi kehitysympäristön automaattisesti, mutta nyt kehitysympäristö rakennetaan itse. Node-projektin juureen määritetään tätä varten projektin asetukset (`package.json`), TypeScript-kääntäjän asetukset (`tsconfig.json`) ja tiedosto `.nvmrc`, joka lukitsee projektin käyttämään Node-versiota 24 [nvm](https://github.com/nvm-sh/nvm)-työkalulla (`nvm use`).

Jos aloitat ohjelmoimaan uutta sovellusta, sinun pitää alustaa tyhjä kansio Node-projektiksi komennolla:

```bash
npm init -y
```

Komento luo kansioon package.json -tiedoston, jota katsotaan seuraavaksi.

> [!TIP]
> Demo on tarkoituksella versiolukittu Node 24 -versioon ja `package.json`:ssa (sekä `package-lock.json`:ssa) määriteltyihin riippuvuusversioihin. Näin kaikilla kurssilla on käytössä sama ympäristö, eivätkä versioerot aiheuta selittämättömiä eroja koodin toiminnassa.

### 1.1 package.json ja projektin perustiedot

```json
{
  "name": "demo-01",
  "version": "1.0.0",
  "description": "",
  "main": "index.ts",
  "engines": {
    "node": "^24.0.0"
  },
  "scripts": {
    "dev": "tsx watch ./index.ts",
    "typecheck": "tsc --noEmit"
  },
  "type": "module",
  ...
}
```

- `"main"`-kenttä määrittää sovelluksen käynnistystiedostoksi `index.ts`.
- `"type": "module"` määrittää, että projektin JavaScript- ja TypeScript-tiedostot tulkitaan ES-moduuleina (`import`/`export`) eikä Node:n vanhemman CommonJS-järjestelmän mukaisesti (`require`/`module.exports`).
- `"engines": { "node": "^24.0.0" }` määrittää projektin vaatiman Node-version. Npm ei oletuksena estä asennusta muulla versiolla, mutta tieto ohjaa kehittäjää ja työkaluja (esim. `nvm use`) oikean version pariin.
- `"scripts"`-kohdassa määritellään komennot, joita ajetaan `npm run <nimi>` -komennolla. `dev` käynnistää kehityspalvelimen, ja `typecheck` tarkistaa koodin tyypit ilman että mitään käännetään levylle.

> [!NOTE]
> Aiemmissa React-demoissa projekti käynnistettiin `npm run dev` -komennolla, joka käynnisti Viten kehityspalvelimen. Sama `scripts`-komento löytyy tästäkin projektista, mutta sen takana on nyt eri työkalu, `tsx watch`. Komentojen nimet (esim. `dev`, `build`, `start`, `test`) ovat kehittäjän itse valittavissa olevia projektikohtaisia nimiä, eivät minkään työkalun kiinteitä vaatimuksia. Useimmissa ohjelmointiprojekteissa käytetään samanlaisia termejä.

### 1.2 tsconfig.json ja TypeScript-asetukset

`tsconfig.json` määrittää, miten TypeScript-kääntäjä tulkitsee ja tarkistaa projektin koodin.

```json
{
  "compilerOptions": {
    "module": "ESNext",
    "moduleResolution": "bundler",
    "target": "ES2023",
    "lib": ["esnext"],
    "types": ["node"],

    "strict": true,
    "verbatimModuleSyntax": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "skipLibCheck": true,
    "esModuleInterop": true
  }
}
```

Demon kannalta oleellisimmat asetukset ovat `"strict": true`, joka kytkee päälle TypeScriptin tiukimmat tyyppitarkastukset kerralla, ja `"verbatimModuleSyntax": true`, joka pakottaa merkitsemään pelkkää tyypitystä varten tuodut asiat `type`-avainsanalla (esim. `import { type Request } from 'express'`, ks. luku [3](#3-express-palvelimen-luonti-ja-käynnistys)). Muut asetukset liittyvät projektin moduulijärjestelmään ja kääntäjän tarkkuuteen, eikä niitä tarvitse käydä läpi yksitellen tämän demon ymmärtämiseksi. Tarkemmin niistä voi lukea [TypeScriptin dokumentaatiosta](https://www.typescriptlang.org/tsconfig/).

## 2 Riippuvuuksien asennus

### 2.1 npm ci vs. npm install

Riippuvuudet asennetaan komennolla

```bash
npm ci
```

`npm ci` poistaa ensin olemassa olevan `node_modules`-kansion kokonaan ja asentaa sitten täsmälleen ne versiot, jotka on kirjattu `package-lock.json`-tiedostoon, muuttamatta lock-tiedostoa. `npm install` puolestaan lukee `package.json`:n ja voi samalla päivittää `package-lock.json`-tiedostoa, jos riippuvuuksista löytyy uudempia, `package.json`:n salliman versiovälin sisällä olevia versioita. Kloonatussa demossa kannattaa käyttää `npm ci`:tä, koska sillä varmistaa projektin asentuvan täysin samoilla riippuvuuksien versioilla, jolloin ohjeistukset pysyvät yhdenmukaisena, vaikka riippuvuuksista julkaistaisiinkin uusia versioita myöhemmin.

### 2.2 Projektin riippuvuudet

Node-projekteissa käytetään yleisesti ulkoisia paketteja, jotka asennetaan komennolla `npm install <paketti>` (tai `npm install -D <paketti>`, jos paketti tarvitaan vain kehityksen aikana). Tässä demossa paketit on jo listattu `package.json`:iin valmiiksi, joten `npm ci` (luku [2.1](#21-npm-ci-vs-npm-install)) riittää asentamaan ne kaikki kerralla.

> [!TIP]
> Kun aloitat oman projektin tyhjästä, ei ole aina itsestään selvää, mistä tietää mitkä paketit projektiin kannattaa valita. Hyviä tapoja selvittää asiaa ovat pakettien viralliset dokumentaatiot, aiheeseen liittyvät tutoriaalit, ja kysyminen tekoälyltä. Tätä samaa taitoa harjoitellaan tällä kurssilla koko ajan.

`package.json`:n `dependencies`- ja `devDependencies`-kentistä löytyvät seuraavat paketit:

```json
"dependencies": {
  "express": "5.2.1"
},
"devDependencies": {
  "@types/express": "5.0.6",
  "@types/node": "22.20.3",
  "tsx": "4.23.13",
  "typescript": "7.0.2"
}
```

- `express` on palvelinkehys, joka hoitaa HTTP-pyyntöjen vastaanottamisen, reitittämisen ja vastausten muodostamisen. Se on varsinainen riippuvuus (`dependencies`), koska sovellus tarvitsee sitä myös suorituksessa.
- `@types/express` ja `@types/node` sisältävät TypeScript-tyyppimäärittelyt Expressille ja Node:n sisäänrakennetuille moduuleille. Molemmat ovat `devDependencies`-listalla, koska niitä tarvitaan vain kehitysvaiheessa.
- `tsx` ajaa TypeScript-tiedostoja suoraan Nodella ilman erillistä käännösvaihetta, ja `tsx watch` käynnistää palvelimen automaattisesti uudelleen tiedostomuutosten yhteydessä. Vastaa periaatteeltaan mahdollisesti tuttua `ts-node`+`nodemon`-yhdistelmää, mutta yhtenä pakettina ja on modernimpi.
- `typescript` on TypeScript-kääntäjä, jota käytetään `typecheck`-skriptissä tyyppien tarkistamiseen ilman että mitään käännetään levylle.

## 3 Express-palvelimen luonti ja käynnistys

Kehitysympäristön asetukset ovat nyt valmiit, joten seuraavaksi aletaan kirjoittaa itse palvelinta. Palvelin määritellään ja käynnistetään `index.ts`-tiedostossa:

```ts
import express, { type Application, type Request, type Response} from 'express';
import path from 'path';

const app: Application = express();

const port: number = Number(process.env.PORT) || 3001;

// ...

app.listen(port, () => {
    console.log(`Palvelin käynnistettiin osoitteeseen: http://localhost:${port}`);
});
```

`Application`, `Request` ja `Response` on merkitty tuonnissa `type`-avainsanalla, koska ne tuodaan vain tyypitykseen eikä ajonaikaiseksi koodiksi (ks. luku [1.2](#12-tsconfigjson-ja-typescript-asetukset)).

Ensin luodaan Express-sovellus kutsumalla `express()`-funktiota, ja tulos tallennetaan tavanomaisesti `app`-nimiseen muuttujaan. Tähän samaan `app`-olioon liitetään jatkossa kaikki reitit ja middlewaret. `Application`-tyyppi on kirjoitettu näkyviin, mutta ei ole pakollinen, koska TypeScript päättelisi saman tyypin myös ilman merkintää.

Portti, jota vastaan palvelin kuuntelee, määritetään lausekkeella `Number(process.env.PORT) || 3001`. `process.env.PORT` on ympäristömuuttuja, jonka avulla porttia voi vaihtaa ilman koodimuutosta, ja `|| 3001` antaa oletusportin, jos muuttujaa ei ole asetettu.

`app.listen(port, ...)` käynnistää palvelimen kuuntelemaan pyyntöjä annetussa portissa. Toinen parametri on funktio, joka suoritetaan heti kun palvelin on käynnistynyt, ja tässä demossa se vain tulostaa varmistusviestin.

Käynnistä palvelin (luku [6](#6-palvelimen-käynnistäminen-ja-reittien-testaaminen)) ja avaa selaimessa `http://localhost:3001`. Näytölle tulee Expressin oletusvirhe `Cannot GET /`, koska sovellukseen ei ole vielä määritelty yhtään reittiä osoitteelle `/`.

Kokeile lisätä palvelimeen väliaikaisesti yksinkertainen reitti ennen `app.listen`-kutsua:

```ts
app.get("/", (req, res) => {
    res.send("Palvelin toimii!");
});
```

Käynnistä palvelin uudelleen ja lataa sivu, niin näet tulostetun tekstin `Cannot GET /` -virheen sijaan. Poista tämä rivi tämän jälkeen, sillä juuriosoite `/` otetaan seuraavaksi käyttöön toisella tavalla.

## 4 Staattisten tiedostojen tarjoilu

Staattisilla tiedostoilla tarkoitetaan tiedostoja (HTML, CSS, kuvat), jotka palvelin tarjoilee suoraan sellaisenaan ilman että niille pitää kirjoittaa omaa reittiä jokaiselle erikseen. Tätä varten projektiin on luotu `public`-kansio, ja sen sisään tiedosto `index.html`, jonka Express tulkitsee automaattisesti palvelimen juurisivuksi.

```ts
app.use(express.static(path.join(import.meta.dirname, "public")));
```

`app.use()` liittää sovellukseen middlewaren, eli funktion, joka käsittelee jokaisen saapuvan pyynnön ennen kuin se ohjautuu varsinaiselle reitille. `express.static()` on Expressin sisäänrakennettu middleware, joka tarjoilee sille annetun kansion sisällön suoraan tiedostoina. Jos selain esimerkiksi pyytää osoitetta `/img/xamklogo.png`, Express etsii tiedoston annetusta kansiosta ja palauttaa sen sellaisenaan.

Kansion polku muodostetaan `path.join(import.meta.dirname, "public")` -kutsulla, joka yhdistää nykyisen tiedoston sijainnin ja `public`-alikansion nimen käyttöjärjestelmän mukaiseksi tiedostopoluksi.

> [!NOTE]
> Perinteisessä Node-koodissa hakemistopolku olisi haettu muuttujasta `__dirname`. ES-moduuleissa (`package.json`:n `"type": "module"`, ks. luku [1.1](#11-packagejson-ja-projektin-perustiedot)) tätä muuttujaa ei ole automaattisesti käytettävissä, ja `import.meta.dirname` on sen nykyinen korvaaja.

`public/index.html` on tavallinen HTML-sivu, joka lataa tyylit Bootstrapin CDN-jakelusta ja jonka sisällä on linkit demon reitteihin:

```html
<ul>
    <li><a href="/heippa?nimi=Matti">Sano heippa (Matti)</a></li>
    <li><a href="/heippa?nimi=Maija">Sano heippa (Maija)</a></li>
    <li><a href="/moikka">Sano moikka</a></li>
</ul>

<img src="/img/xamklogo.png" alt="Xamk-logo" />
```

Nämä linkit näkyvät palvelimen etusivulla `http://localhost:3001`, ja niitä käytetään luvussa [6](#6-palvelimen-käynnistäminen-ja-reittien-testaaminen) reittien testaamiseen. Koska `express.static()` tarjoilee koko `public`-kansion, myös `img`-alikansio ja siellä oleva kuva löytyvät suoraan osoitteesta `/img/xamklogo.png`, ilman että kuvalle tarvitsee kirjoittaa erillistä reittiä.

## 5 Reittien rakentaminen

Middlewaren jälkeen sovellukseen määritellään reitit, eli osoitteet joihin palvelin osaa vastata itse kirjoitetulla logiikalla. HTTP-pyynnöllä on aina jokin metodi, joka kertoo minkälaisesta toiminnosta on kyse (esimerkiksi GET tiedon hakemiseen), ja reitti kirjoitetaan aina tiettyä metodia varten kutsumalla Expressin vastaavaa metodia, tässä demossa `app.get()`. Metodille annetaan osoite ja pyynnön käsittelevä funktio.

Molemmat tämän demon reitit vastaavat `res.send()`-metodilla, joka lähettää siinä annetun sisällön takaisin selaimelle ja päättelee sen teknisen tyypin sisällön perusteella, merkkijonolla oletuksena HTML:ksi.

### 5.1 GET /heippa ja kyselyparametrit

Ensimmäinen reitti vastaa etusivun linkkeihin `/heippa?nimi=Matti` ja `/heippa?nimi=Maija` (luku [4](#4-staattisten-tiedostojen-tarjoilu)) ja muodostaa niiden mukana tulevasta nimestä tervehdyksen.

```ts
app.get("/heippa", (req: Request, res: Response) => {

    let nimi: string = "";

    if (typeof req.query.nimi === "string") {
        nimi = req.query.nimi;
    } else {
        nimi = "tuntematon";
    }

    res.send(`<h1>Heippa ${nimi}!</h1>`);

});
```

Pyynnön käsittelevä funktio saa parametreinaan `req`- ja `res`-oliot, jotka on tyypitetty `Request`- ja `Response`-tyyppeihin. Tyypitys on tässä pakollinen, koska Expressin `app.get()`-metodilla on useita vaihtoehtoisia parametriyhdistelmiä, ja tyyppi varmistaa että käsittelijäfunktio saa juuri oikeat pyyntö- ja vastausoliot.

`?nimi=Matti` osoitteen lopussa on kyselyparametri, jonka arvo luetaan Expressissä `req.query`-oliosta. `req.query.nimi` käsitellään merkkijonona, koska kyselyparametrit ovat aina tekstiä. `typeof req.query.nimi === "string"` -tarkistuksella varmistetaan, että arvo todella on annettu merkkijonona, koska parametri voi puuttua pyynnöstä kokonaan. Jos parametri puuttuu, `nimi`-muuttujaan asetetaan oletusarvo `"tuntematon"`.

### 5.2 GET /moikka

```ts
app.get("/moikka", (req: Request, res: Response) => {
    res.send("<h1>Moikka!</h1>")
});
```

Reitissä ei ole pakko lukea pyynnöstä mitään, jos se ei ole tarpeen. Tässä palautetaan aina sama kiinteä teksti, eikä vastaan odoteta pyynnön reittiparametrejä.

## 6 Palvelimen käynnistäminen ja reittien testaaminen

Palvelin käynnistyy `npm run dev` -komennolla, joka ajaa taustalla komennon `tsx watch ./index.ts`. Terminaaliin tulostuu palvelimen oma lokiviesti:

```
Palvelin käynnistettiin osoitteeseen: http://localhost:3001
```

Reittejä voi testata avaamalla selaimessa etusivun `http://localhost:3001` ja painamalla sivulla olevia linkkejä, jolloin selain siirtyy suoraan reitin osoitteeseen ja näyttää palvelimen palauttaman HTML-vastauksen. Yksittäistä reittiä voi testata myös suoraan selaimen osoiteriviltä, esimerkiksi `http://localhost:3001/heippa?nimi=Matti`.

Koska `tsx watch` seuraa tiedostomuutoksia, koodiin tehdyt muutokset näkyvät palvelimen vastauksissa heti tallennuksen jälkeen ilman, että palvelinta tarvitsee itse käynnistää uudelleen.

Koodin tyypit voi tarkistaa myös erikseen, ilman palvelimen käynnistämistä, komennolla

```bash
npm run typecheck
```

Komento on hyödyllinen etenkin ennen koodin palauttamista, koska se paljastaa tyypitysvirheet nopeasti ilman, että palvelinta tarvitsee käynnistää tai reittejä testata käsin.

## 7 Lopuksi

Demossa rakennettiin Express-palvelin, joka tarjoilee sekä staattisia tiedostoja että itse kirjoitettuja reittejä. Läpikäytyjä asioita:

- projektin määritystiedostot ja niiden tarkoitus
- riippuvuuksien asentaminen
- Express-sovelluksen luominen ja käynnistäminen
- staattisen `public`-kansion tarjoilu
- kahden erilaisen reitin kirjoittaminen, ja kyselyparametrin lukeminen pyynnöstä

Myöhemmissä demoissa reittejä tulee lisää, ja pyyntöjen mukana aletaan käsitellä myös muuta dataa kuin pelkkiä kyselyparametreja.
