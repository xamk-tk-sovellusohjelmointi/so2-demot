# Demo 1: Express-perusteita

## Sisällysluettelo

- [1. Oppimistavoitteet](#1-oppimistavoitteet)
- [2. Kloonaus ja käynnistys](#2-kloonaus-ja-käynnistys)
- [3. Projektin rakenne alussa](#3-projektin-rakenne-alussa)
- [4. Tutoriaali](#4-tutoriaali)
  - [4.1 Node.js 24:n asentaminen](#41-nodejs-24n-asentaminen)
  - [4.2 Projektikansio ja paketit](#42-projektikansio-ja-paketit)
  - [4.3 TypeScriptin asetukset](#43-typescriptin-asetukset)
  - [4.4 Ensimmäinen Express-palvelin](#44-ensimmäinen-express-palvelin)
  - [4.5 Ensimmäinen reitti](#45-ensimmäinen-reitti)
  - [4.6 Kyselyparametrit](#46-kyselyparametrit)
  - [4.7 Staattiset tiedostot](#47-staattiset-tiedostot)
  - [4.8 Tyyppien tarkistaminen](#48-tyyppien-tarkistaminen)
- [5. Projektin rakenne lopussa](#5-projektin-rakenne-lopussa)
- [6. Yhteenveto](#6-yhteenveto)
- [7. Jatka harjoittelua](#7-jatka-harjoittelua)

## 1. Oppimistavoitteet

Sovellusohjelmointi 2 -kurssilla rakennetaan sovellusten palvelinpuolta. Ensimmäisessä demossa luodaan Node.js-ympäristössä toimiva Express-palvelin, joka kirjoitetaan TypeScriptillä. Palvelin jakaa selaimelle HTML-sivun ja kuvan `public`-kansiosta ja vastaa kahteen omaan reittiin, joista toinen lukee nimen osoitteen kyselyparametrista.

Demon jälkeen osataan:

- asentaa Node.js 24 ja tarkistaa asennettu versio
- asentaa projektin lukitut pakettiversiot komennolla `npm ci`
- tunnistaa `package.json`-, `package-lock.json`- ja `tsconfig.json`-tiedostojen tehtävät Express-projektissa
- luoda Express-sovellus ja käynnistää se tiettyyn porttiin
- käynnistää palvelin kehitystilassa `tsx`-työkalulla, joka käynnistää palvelimen uudelleen koodin muuttuessa
- määritellä GET-reittejä, jotka vastaavat selaimelle HTML-merkkijonolla
- lukea kyselyparametrin arvo `req.query`-oliosta ja varautua sen puuttumiseen
- jakaa staattisia tiedostoja `express.static`-väliohjelmistolla
- tarkistaa TypeScript-tyypit erillisellä `npm run typecheck` -komennolla

## 2. Kloonaus ja käynnistys

Valmis demo ladataan kurssin repositoriosta, sen paketit asennetaan ja palvelin käynnistetään seuraavilla komennoilla. Komennot edellyttävät, että Node.js 24 on asennettu luvun [4.1](#41-nodejs-24n-asentaminen) ohjeella.

```bash
git clone https://github.com/xamk-tk-sovellusohjelmointi/so2-demot.git
cd so2-demot/demo-01
npm ci
npm run dev
```

Palvelin käynnistyy osoitteeseen <http://localhost:3001>, joka avataan selaimessa.

> [!IMPORTANT]
> Demo on lukittu tarkoituksella Node.js 24:ään ja `package-lock.json`-tiedoston pakettiversioihin, ja tutoriaali on testattu juuri niillä versioilla. Paketit asennetaan komennolla `npm ci`. Muut versiot (esimerkiksi ilman versionumeroa annetusta asennuskomennosta, kirjaston omasta dokumentaatiosta kopioidusta komennosta tai hyväksytystä "update available" -kehotteesta) voivat poiketa tutoriaalista eivätkä välttämättä toimi.

## 3. Projektin rakenne alussa

Demo alkaa tyhjästä projektikansiosta.

```text
demo-01/
```

## 4. Tutoriaali

### 4.1 Node.js 24:n asentaminen

Node.js on **ajoympäristö** (runtime), jolla JavaScript-koodia suoritetaan selaimen ulkopuolella. SO1-kurssilla Node.js oli käytössä Viten ja npm:n taustalla, mutta nyt sillä ajetaan itse sovellusta. Kaikki kurssin palvelinsovellukset ovat Node.js-ohjelmia, joten se asennetaan ensimmäisenä.

Kurssilla käytetään Node.js:n versiota 24 koko syksyn 2026 lukukauden ajan, vaikka Node.js 26 nousee LTS-versioksi lokakuussa 2026. Asennus tehdään Windowsissa seuraavasti.

1. Avataan Node.js:n virallinen lataussivu <https://nodejs.org/en/download>.
2. Sivun versiovalikosta valitaan versio 24, jonka perässä on merkintä LTS. Valinnalla on merkitystä, koska lokakuusta 2026 alkaen sivu tarjoaa oletuksena Node.js 26:ta.
3. Ladataan Windows-asennusohjelma (`.msi`) ja ajetaan se oletusasetuksilla.
4. Avataan uusi komentorivi-ikkuna ja tarkistetaan asennettu versio.

```bash
node --version
```

Tulosteen täytyy alkaa `v24.`. Jos se alkaa jollain muulla numerolla, koneella on käytössä eri Node.js-versio, ja versio 24 asennetaan yllä olevilla ohjeilla.

> ⚠️ **FACT-CHECK:** Windows-asennuksen vaiheita (oletusasetukset, uusi komentorivi-ikkuna, v24:n asentaminen toisen Node.js-version päälle) ei testattu Windowsilla, eikä lataussivun versiovalikkoa voitu tarkistaa, koska sivu muodostuu JavaScriptillä.

macOS:lle samalta lataussivulta löytyy `.pkg`-asennusohjelma, ja Linuxille sivu antaa omat asennusohjeensa. Versio tarkistetaan niissäkin samalla komennolla.

Node.js:n asennuksen mukana tulee npm, jolla projektin paketit asennetaan. Aiheesta lisää: [Introduction to Node.js](https://nodejs.org/en/learn/getting-started/introduction-to-nodejs).

### 4.2 Projektikansio ja paketit

Projektille luodaan oma kansio, esimerkiksi `demo-01`. Kurssin demot käyttävät lukittuja pakettiversioita, joten uuteen projektiin ei asenneta paketteja yksitellen. Kansioon kopioidaan demon `package.json`, `package-lock.json` ja `tsconfig.json`, minkä jälkeen paketit asennetaan projektikansiossa komennolla `npm ci`.

```bash
npm ci
```

`npm ci` asentaa `package-lock.json`-tiedostoon kirjatut versiot `node_modules`-kansioon. Lukitustiedosto sisältää koko riippuvuuspuun eli myös pakettien omat riippuvuudet, joten asennus tuottaa täsmälleen saman kokonaisuuden kuin demossa. Aiheesta lisää: [npm ci -dokumentaatio](https://docs.npmjs.com/cli/commands/npm-ci).

Demon `package.json` näyttää tältä.

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
  "devDependencies": {
    "@types/express": "5.0.6",
    "@types/node": "22.20.3",
    "tsx": "4.23.13",
    "typescript": "7.0.2"
  },
  "dependencies": {
    "express": "5.2.1"
  },
  "allowScripts": {
    "esbuild@0.28.2": true
  }
}
```

`dependencies`-kohdassa on sovelluksen ainoa ajonaikainen paketti Express, joka on Node.js:lle tehty palvelinkirjasto. `devDependencies`-kohdan paketteja tarvitaan vain kehityksen aikana. `typescript` tarkistaa tyypit, `tsx` suorittaa TypeScript-tiedostoja suoraan, ja `@types/node` ja `@types/express` sisältävät Node.js:n ja Expressin tyyppimääritykset.

Samat `package.json`-tiedoston rivit syntyvät alla olevilla asennuskomennoilla. Komennot näytetään vain, jotta nähdään, mistä rivit ovat peräisin. Niitä ei ajeta `npm ci`:n jälkeen. Valitsin `-E` tallentaa tarkan versionumeron, ja `-D` merkitsee paketin kehitysaikaiseksi.

```bash
npm install -E express@5.2.1
npm install -E -D typescript@7.0.2 tsx@4.23.13 @types/node@22.20.3 @types/express@5.0.6
```

`"type": "module"` ottaa käyttöön ES-moduulit, jolloin tiedostoissa käytetään `import`-lauseita. `engines` kertoo, että projekti on tehty Node.js 24:lle. `scripts` määrittelee komennot `npm run dev` ja `npm run typecheck`, joita käytetään luvuissa 4.4 ja 4.8.

`allowScripts` hyväksyy `esbuild`-paketin asennusskriptin. `esbuild` asentuu `tsx`:n riippuvuutena, ja ilman hyväksyntää npm tulostaa asennuksen yhteydessä varoituksen tarkistamattomasta asennusskriptistä. Saman kentän tuottaa komento `npm approve-scripts esbuild`.

> [!NOTE]
> Tyhjään kansioon voi luoda uuden `package.json`-tiedoston myös komennolla `npm init -y`. Se tuottaa oletusarvoisen tiedoston, jossa on esimerkiksi `"type": "commonjs"`, joten kurssin projekteissa lähtökohdaksi kopioidaan demon valmis tiedosto.

### 4.3 TypeScriptin asetukset

`tsconfig.json` määrittää, miten TypeScript tarkistaa projektin koodin. Tiedoston pohjana on komennon `npx tsc --init` luoma oletustiedosto, jonka asetuksia on muokattu Node.js-palvelimelle sopiviksi.

```json
{
  // Visit https://aka.ms/tsconfig to read more about this file
  "compilerOptions": {
    // File Layout
    // "rootDir": "./src",
    // "outDir": "./dist",
    // Environment Settings
    // See also https://aka.ms/tsconfig/module
    "module": "ESNext",
    "moduleResolution": "bundler",
    "target": "ES2023",
    "lib": [
      "esnext"
    ],
    "types": [
      "node"
    ],
    // For nodejs:
    // "lib": ["esnext"],
    // "types": ["node"],
    // and npm install -D @types/node
    // Other Outputs
    "sourceMap": true,
    "declaration": true,
    "declarationMap": true,
    // Stricter Typechecking Options
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    // Style Options
    // "noImplicitReturns": true,
    // "noImplicitOverride": true,
    // "noUnusedLocals": true,
    // "noUnusedParameters": true,
    // "noFallthroughCasesInSwitch": true,
    // "noPropertyAccessFromIndexSignature": true,
    // Recommended Options
    "strict": true,
    "verbatimModuleSyntax": true,
    "isolatedModules": true,
    "noUncheckedSideEffectImports": true,
    "moduleDetection": "force",
    "skipLibCheck": true,
    "esModuleInterop": true,
  }
}
```

Oletustiedostoon verrattuna muutetut kohdat ovat `module`, `moduleResolution`, `target`, `lib`, `types` ja `esModuleInterop`, ja React-projekteja varten oleva `jsx`-asetus on poistettu. Kun `types`-kohdassa on `node`, TypeScript ottaa käyttöön `@types/node`-paketin tyypit, jolloin esimerkiksi `process` ja `path` tunnistetaan. `strict` ottaa käyttöön tiukan tyyppitarkistuksen. `verbatimModuleSyntax` vaatii, että pelkät tyypit tuodaan `import`-lauseessa `type`-sanalla merkittyinä. Tämä näkyy luvun 4.4 koodissa.

Tiedostoa ei tarvitse muokata demon aikana. Aiheesta lisää: [TSConfig-dokumentaatio](https://www.typescriptlang.org/tsconfig/).

### 4.4 Ensimmäinen Express-palvelin

**Palvelin** (server) on ohjelma, joka kuuntelee verkosta tulevia **pyyntöjä** (requests) ja lähettää niihin **vastauksia** (responses). Selain lähettää pyynnön esimerkiksi silloin, kun osoiteriville kirjoitetaan osoite. Express tarjoaa valmiit välineet pyyntöjen käsittelyyn, joten palvelinta ei tarvitse rakentaa Node.js:n perusmoduulien varaan.

Projektin juureen luodaan tiedosto `index.ts`.

```typescript
import express, { type Application } from 'express';

const app: Application = express();

const port: number = Number(process.env.PORT) || 3001;

app.listen(port, () => {
    console.log(`Palvelin käynnistettiin osoitteeseen: http://localhost:${port}`);
});
```

`express()` luo sovellusolion `app`, jonka tyyppi on Expressin `Application`. Kaikki palvelimen toiminnot määritellään tämän olion kautta. `Application` on pelkkä tyyppi, joten se tuodaan `type`-sanalla luvussa 4.3 mainitun `verbatimModuleSyntax`-asetuksen vuoksi.

**Portti** (port) on numero, jolla koneen verkkoliikenne ohjataan oikealle ohjelmalle. Portti luetaan ensin **ympäristömuuttujasta** (environment variable) `PORT`, jonka arvo on Node.js:ssä saatavilla `process.env`-oliosta. Jos muuttujaa ei ole asetettu, `Number(process.env.PORT)` on `NaN` ja `||`-operaattori valitsee oletusarvon `3001`. Paikallisessa kehityksessä palvelin toimii siis portissa 3001.

`app.listen` käynnistää palvelimen kuuntelemaan porttia. Toisena parametrina annettu funktio suoritetaan, kun palvelin on käynnistynyt, ja se tulostaa palvelimen osoitteen komentoriville.

Palvelin käynnistetään kehitystilassa.

```bash
npm run dev
```

Komento suorittaa `package.json`-tiedoston `dev`-skriptin `tsx watch ./index.ts`. `tsx` on työkalu, joka suorittaa TypeScript-tiedoston suoraan ilman erillistä käännösvaihetta. `watch`-tila käynnistää palvelimen uudelleen aina, kun tiedosto tallennetaan. Palvelin pysäytetään komentorivillä näppäinyhdistelmällä `Ctrl + C`. Aiheesta lisää: [tsx-dokumentaatio](https://tsx.hirok.io/).

Komentoriville tulostuu `Palvelin käynnistettiin osoitteeseen: http://localhost:3001`. Kun osoite avataan selaimessa, palvelin vastaa virheellä `Cannot GET /`, koska sille ei ole vielä määritelty yhtään vastattavaa osoitetta. Aiheesta lisää: [Expressin Hello world -esimerkki](https://expressjs.com/en/starter/hello-world.html).

### 4.5 Ensimmäinen reitti

**Reitti** (route) yhdistää pyynnön osoitteen ja **HTTP-metodin** (HTTP method) funktioon, joka muodostaa vastauksen. Selain käyttää osoiterivin kautta tehdyissä pyynnöissä GET-metodia, joten reitit määritellään `app.get`-metodilla. Ensimmäinen reitti vastaa osoitteeseen `/moikka`.

```typescript
import express, { type Application, type Request, type Response } from 'express'; // muutettu

const app: Application = express();

const port: number = Number(process.env.PORT) || 3001;

app.get("/moikka", (req: Request, res: Response) => { // uusi
    res.send("<h1>Moikka!</h1>") // uusi
}); // uusi

app.listen(port, () => {
    console.log(`Palvelin käynnistettiin osoitteeseen: http://localhost:${port}`);
});
```

`app.get` saa ensimmäisenä parametrina polun ja toisena **käsittelijäfunktion** (handler), jota Express kutsuu jokaisella polkuun tulevalla pyynnöllä. Käsittelijä saa kaksi parametria. `req` on `Request`-tyyppinen olio, joka sisältää pyynnön tiedot, ja `res` on `Response`-tyyppinen olio, jolla vastaus lähetetään. `Request` ja `Response` lisätään `import`-lauseeseen samalla tavalla `type`-sanalla kuin `Application`.

`res.send` lähettää merkkijonon vastauksena. Merkkijonona annettu vastaus lähetetään HTML-sisältönä, joten selain näyttää `<h1>`-elementin otsikkona.

Tallennuksen jälkeen `tsx` käynnistää palvelimen uudelleen, ja osoitteessa <http://localhost:3001/moikka> näkyy otsikko "Moikka!". Aiheesta lisää: [Expressin reititysopas](https://expressjs.com/en/guide/routing.html).

### 4.6 Kyselyparametrit

**Kyselyparametrit** (query parameters) ovat osoitteen perään `?`-merkin jälkeen kirjoitettuja nimi–arvo-pareja, esimerkiksi `/heippa?nimi=Matti`. Niillä pyyntöön saadaan mukaan tietoa ilman, että jokaiselle arvolle tarvitaan oma reitti. Seuraava reitti `/heippa` tervehtii nimeä, joka annetaan kyselyparametrissa `nimi`.

```typescript
import express, { type Application, type Request, type Response } from 'express';

const app: Application = express();

const port: number = Number(process.env.PORT) || 3001;

app.get("/heippa", (req: Request, res: Response) => { // uusi

    let nimi: string = ""; // uusi

    if (typeof req.query.nimi === "string") { // uusi
        nimi = req.query.nimi; // uusi
    } else { // uusi
        nimi = "tuntematon"; // uusi
    } // uusi

    res.send(`<h1>Heippa ${nimi}!</h1>`); // uusi

}); // uusi

app.get("/moikka", (req: Request, res: Response) => {
    res.send("<h1>Moikka!</h1>")
});

app.listen(port, () => {
    console.log(`Palvelin käynnistettiin osoitteeseen: http://localhost:${port}`);
});
```

Express kokoaa kyselyparametrit `req.query`-olioon, jossa parametrin nimi on avaimena. `req.query.nimi` ei kuitenkaan ole aina merkkijono. Jos parametri puuttuu, arvo on `undefined`, ja jos sama parametri annetaan osoitteessa kahdesti, arvo on taulukko. `typeof`-tarkistus varmistaa, että muuttujaan `nimi` sijoitetaan vain merkkijono. Muissa tapauksissa käytetään arvoa `"tuntematon"`. Tarkistus tarvitaan myös TypeScriptin vuoksi, koska `req.query.nimi` ei tyypiltään kelpaa suoraan `string`-muuttujaan.

Vastaus muodostetaan template literal -merkkijonolla, jossa `${nimi}` korvautuu muuttujan arvolla.

Osoite <http://localhost:3001/heippa?nimi=Matti> näyttää otsikon "Heippa Matti!", ja pelkkä <http://localhost:3001/heippa> näyttää otsikon "Heippa tuntematon!". Aiheesta lisää: [req.query Expressin API-dokumentaatiossa](https://expressjs.com/en/5x/api.html#req.query).

### 4.7 Staattiset tiedostot

**Staattiset tiedostot** (static files) ovat tiedostoja, jotka palvelin lähettää selaimelle sellaisenaan, kuten HTML-sivut, kuvat ja tyylitiedostot. Tehdyt reitit ovat nyt olemassa, joten niihin voidaan linkittää palvelimen etusivulta.

Projektiin luodaan kansio `public` ja sen alle kansio `img`. Kuvatiedosto `xamklogo.png` kopioidaan demon kansiosta `public/img`. Kansioon `public` luodaan tiedosto `index.html`.

```html
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/css/bootstrap.min.css" rel="stylesheet"
        integrity="sha384-sRIl4kxILFvY47J16cr9ZwB07vP4J8+LH7qKQnuqkuIAvNWLzeN8tE5YBujZqJLB" crossorigin="anonymous">
    <title>Demo 1</title>
</head>

<body>

    <div class="container">

        <h1>Demo 1: Express-perusteita</h1>

        <h2>Hello world! x 3</h2>

        <ul>
            <li><a href="/heippa?nimi=Matti">Sano heippa (Matti)</a></li>
            <li><a href="/heippa?nimi=Maija">Sano heippa (Maija)</a></li>
            <li><a href="/moikka">Sano moikka</a></li>
        </ul>

        <img src="/img/xamklogo.png" alt="Xamk-logo" />

    </div>
</body>

</html>
```

Sivu hakee Bootstrapin tyylitiedoston CDN-palvelusta, ja `container`-luokka tulee siitä. Linkit osoittavat luvuissa 4.5 ja 4.6 tehtyihin reitteihin. Kuvan polku `/img/xamklogo.png` alkaa `public`-kansion juuresta.

`index.ts`-tiedostoon lisätään `path`-moduulin tuonti ja `express.static`-rivi ennen reittejä.

```typescript
import express, { type Application, type Request, type Response } from 'express';
import path from 'path'; // uusi

const app: Application = express();

const port: number = Number(process.env.PORT) || 3001;

app.use(express.static(path.join(import.meta.dirname, "public"))); // uusi

app.get("/heippa", (req: Request, res: Response) => {

    let nimi: string = "";

    if (typeof req.query.nimi === "string") {
        nimi = req.query.nimi;
    } else {
        nimi = "tuntematon";
    }

    res.send(`<h1>Heippa ${nimi}!</h1>`);

});

app.get("/moikka", (req: Request, res: Response) => {
    res.send("<h1>Moikka!</h1>")
});

app.listen(port, () => {
    console.log(`Palvelin käynnistettiin osoitteeseen: http://localhost:${port}`);
});
```

`app.use` lisää sovellukseen **väliohjelmiston** (middleware), joka käsittelee pyynnön ennen reittejä. `express.static` on Expressin valmis väliohjelmisto, joka etsii pyydetyn polun mukaista tiedostoa annetusta kansiosta ja lähettää sen, jos tiedosto löytyy. Muuten pyyntö siirtyy eteenpäin reiteille. Pyyntö osoitteeseen `/` palauttaa kansion `index.html`-tiedoston ja pyyntö osoitteeseen `/img/xamklogo.png` kuvan.

`import.meta.dirname` on sen kansion polku, jossa `index.ts` sijaitsee. `path.join` yhdistää sen ja kansion nimen `public` käyttöjärjestelmälle sopivaksi poluksi, joten kansio löytyy riippumatta siitä, mistä kansiosta palvelin käynnistetään. `path` on Node.js:n oma moduuli, eikä sitä tarvitse asentaa erikseen.

Osoitteessa <http://localhost:3001> näkyy nyt etusivu, jonka linkit avaavat reittien vastaukset. Aiheesta lisää: [Staattiset tiedostot Expressissä](https://expressjs.com/en/starter/static-files.html).

### 4.8 Tyyppien tarkistaminen

`tsx` poistaa koodista tyypit ja suorittaa sen tarkistamatta tyyppejä. Palvelin käynnistyy siis myös silloin, kun koodissa on tyyppivirhe. Tyypit tarkistetaan erikseen komennolla `npm run typecheck`, joka ajaa `package.json`-tiedoston skriptin `tsc --noEmit`.

```bash
npm run typecheck
```

`tsc` on TypeScriptin kääntäjä. Valitsin `--noEmit` tekee pelkän tarkistuksen luomatta JavaScript-tiedostoja. Jos komento päättyy ilman virheilmoituksia, tyypit ovat kunnossa. Virheen kohdalla tulostuu tiedosto, rivi ja kuvaus, esimerkiksi `index.ts(6,7): error TS2322: Type 'string' is not assignable to type 'number'.`, jos porttimuuttujaan sijoitetaan merkkijono.

## 5. Projektin rakenne lopussa

`npm ci` luo lisäksi kansion `node_modules`, jota ei näytetä rakenteessa.

```text
demo-01/
├── public/
│   ├── img/
│   │   └── xamklogo.png
│   └── index.html
├── index.ts
├── package-lock.json
├── package.json
└── tsconfig.json
```

## 6. Yhteenveto

Demossa asennettiin Node.js 24 ja luotiin TypeScript-pohjainen Express-projekti lukituilla pakettiversioilla. Palvelimeen tehtiin kaksi GET-reittiä, joista toinen lukee kyselyparametrin, ja `public`-kansion tiedostot jaettiin selaimelle `express.static`-väliohjelmistolla. Lisäksi opittiin käynnistämään palvelin kehitystilassa `tsx`:llä ja tarkistamaan tyypit erikseen `tsc`:llä.

---

## 7. Jatka harjoittelua

1. **Toinen kyselyparametri.** Muutetaan reittiä `/heippa` niin, että se lukee myös parametrin `kaupunki` ja tulostaa esimerkiksi "Heippa Matti (Mikkeli)!". Vihje: `req.query.kaupunki` tarkistetaan samalla `typeof`-tavalla kuin `nimi`.
2. **Uusi reitti.** Lisätään reitti `/aika`, joka vastaa palvelimen kellonajalla. Vihje: `new Date().toLocaleTimeString("fi-FI")` palauttaa kellonajan merkkijonona. Etusivulle lisätään linkki uuteen reittiin.
3. **Toinen staattinen sivu.** Lisätään `public`-kansioon sivu `tietoa.html` ja linkki siihen etusivulta. Vihje: `index.ts`-tiedostoon ei tarvita muutoksia, koska `express.static` jakaa kaikki `public`-kansion tiedostot.
