# Demo 2: Web Service perusteita

Toisessa demossa Express-palvelimesta rakennetaan web-rajapinta, joka palauttaa käyttäjätietoja JSON-muodossa toisen ohjelman käsiteltäväksi. Sovelluksessa on pieni käyttäjärekisteri, ja palvelimelta voi pyytää kolmenlaista tietoa:

- kaikkien käyttäjien perustiedot, joita voi rajata rekisteröitymisvuoden mukaan
- kaikkien käyttäjien yhteystiedot
- yhden käyttäjän yhteystiedot id:n perusteella

Etusivulla kerrotaan, mistä osoitteista tiedot löytyvät ja miten rajapintaa testataan Postman-sovelluksella.

## Sisällysluettelo

- [1 Node-projektin alustus ja määritykset](#1-node-projektin-alustus-ja-määritykset)
  - [1.1 package.json ja projektin perustiedot](#11-packagejson-ja-projektin-perustiedot)
  - [1.2 tsconfig.json ja TypeScript-asetukset](#12-tsconfigjson-ja-typescript-asetukset)
- [2 Riippuvuuksien asennus](#2-riippuvuuksien-asennus)
- [3 Express-palvelimen luonti ja käynnistys](#3-express-palvelimen-luonti-ja-käynnistys)
- [4 Staattisten tiedostojen tarjoilu](#4-staattisten-tiedostojen-tarjoilu)
- [5 Käyttäjädatan malli](#5-käyttäjädatan-malli)
- [6 Reittien rakentaminen](#6-reittien-rakentaminen)
  - [6.1 GET /kayttajatiedot ja suodatus kyselyparametrilla](#61-get-kayttajatiedot-ja-suodatus-kyselyparametrilla)
  - [6.2 GET /yhteystiedot](#62-get-yhteystiedot)
  - [6.3 GET /yhteystiedot/:id ja reittiparametrit](#63-get-yhteystiedotid-ja-reittiparametrit)
- [7 Palvelimen käynnistäminen ja reittien testaaminen](#7-palvelimen-käynnistäminen-ja-reittien-testaaminen)
- [8 Lopuksi](#8-lopuksi)

**Projektin asentaminen ja käynnistäminen**

Kun olet kloonannut demon omalle koneellesi, siirry VS Coden Terminalissa demon kansioon ja asenna riippuvuudet komennolla

```bash
npm ci
```

ja käynnistä palvelin kehitystilassa komennolla

```bash
npm run dev
```

Palvelin käynnistyy oletuksena osoitteeseen `http://localhost:3002`.

## 1 Node-projektin alustus ja määritykset

Projektin juuresta löytyvät samat määritystiedostot kuin demossa 1, eli `package.json`, `tsconfig.json` ja `.nvmrc`. Sisältö on lähes identtinen demoon 1 verrattuna, joten tässä käydään läpi vain oleellisimmat kohdat ja demojen väliset erot. Tiedostot on käyty tarkemmin läpi [demo 1:n README:ssä](../demo-01/README.md#1-node-projektin-alustus-ja-määritykset). Myös `.nvmrc` on samanlainen, ja se lukitsee projektin Node-version 24:ään `nvm use` -komennolla.

> [!TIP]
> Myös tämä demo on versiolukittu Node 24 -versioon ja `package.json`:ssa (sekä `package-lock.json`:ssa) määriteltyihin riippuvuusversioihin. Näin jokainen kurssilainen ajaa koodia samoilla versioilla eivätkä ympäristöerot aiheuta selittämättömiä ongelmia.

### 1.1 package.json ja projektin perustiedot

```json
{
  "name": "demo-02",
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

Rakenne on sama kuin demossa 1.

- `"main"`-kenttä määrittää sovelluksen käynnistystiedostoksi `index.ts`.
- `"type": "module"` määrittää, että projektin tiedostot tulkitaan ES-moduuleina (`import`/`export`).
- `"engines": { "node": "^24.0.0" }` määrittää projektin vaatiman Node-version.
- `"scripts"`-kohdan `dev` käynnistää kehityspalvelimen, ja `typecheck` tarkistaa koodin tyypit ilman että mitään käännetään levylle.

### 1.2 tsconfig.json ja TypeScript-asetukset

`tsconfig.json` on sisällöltään sama kuin demossa 1. Tämän demon koodin kannalta oleellisia asetuksia on kaksi:

- `"strict": true` kytkee päälle TypeScriptin tiukimmat tyyppitarkistukset, muun muassa sen, että `undefined`-arvot pitää huomioida tyypeissä erikseen.
- `"verbatimModuleSyntax": true` vaatii merkitsemään pelkkää tyypitystä varten tuodut asiat `type`-avainsanalla, kuten luvun [3](#3-express-palvelimen-luonti-ja-käynnistys) tuontiriveillä näkyy.

## 2 Riippuvuuksien asennus

Riippuvuudet asennetaan komennolla

```bash
npm ci
```

`npm ci` asentaa täsmälleen ne versiot, jotka on kirjattu `package-lock.json`-tiedostoon, joten kaikilla kurssilaisilla on käytössä samat riippuvuudet. Komentojen `npm ci` ja `npm install` ero on selitetty tarkemmin [demo 1:n luvussa 2.1](../demo-01/README.md#21-npm-ci-vs-npm-install).

Paketit ovat samat kuin demossa 1:

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

Jokaisen paketin käyttötarkoitus on käyty läpi [demo 1:n luvussa 2.2](../demo-01/README.md#22-projektin-riippuvuudet).

## 3 Express-palvelimen luonti ja käynnistys

Määritykset ovat nyt kunnossa, joten seuraavaksi kirjoitetaan itse palvelin. Palvelin määritellään ja käynnistetään `index.ts`-tiedostossa.

```ts
import express, { type Application, type Request, type Response } from 'express';
import path from 'path';
import kayttajat, { type Kayttaja } from './models/kayttajat';

const app: Application = express();

const port: number = Number(process.env.PORT) || 3002;
```

Express-sovelluksen luonti ja portin määritys ovat rakenteeltaan samat kuin demossa 1. Erona on porttinumero, joka on tässä demossa 3002. Uutta on kolmas tuontirivi, jolla `models/kayttajat.ts`-tiedostosta tuodaan käyttäjädata (`kayttajat`) ja sen tyyppi (`type Kayttaja`). Tähän palataan luvussa [5](#5-käyttäjädatan-malli).

Tiedoston lopussa palvelin käynnistetään kuten demossa 1:

```ts
app.listen(port, () => {
    console.log(`Palvelin käynnistettiin osoitteeseen: http://localhost:${port}`);
});
```

## 4 Staattisten tiedostojen tarjoilu

Palvelin on nyt pystyssä, ja seuraavaksi sille annetaan tarjoiltavaksi `public`-kansion sisältö. Rivi kirjoitetaan `index.ts`:ään ennen reittejä.

```ts
app.use(express.static(path.join(import.meta.dirname, "public")));
```

Rivi on identtinen demoon 1 verrattuna, jossa `express.static()` ja polun muodostaminen on selitetty tarkemmin ([demo 1, luku 4](../demo-01/README.md#4-staattisten-tiedostojen-tarjoilu)).

Tässä demossa `public`-kansiossa on pelkkä `index.html`. Sivulla kuvaillaan sanallisesti, mistä osoitteista dataa löytyy ja miten rajapintaa testataan Postmanilla.

## 5 Käyttäjädatan malli

Palvelin tarjoilee käyttäjätietoja, jotka ovat tallessa palvelimen omassa datassa. Data pidetään erillään reittien logiikasta, jotta molempia voi muokata toisistaan riippumatta. Tässä demossa data on omassa tiedostossaan [`models/kayttajat.ts`](./models/kayttajat.ts).

Tuotantosovelluksessa tämä tiedosto korvattaisiin usein tietokantahaulla. Reitin kannalta rakenne pysyy samana, koska data haetaan joka tapauksessa yhdestä tyypitetystä lähteestä.

```ts
export interface Kayttaja {
    id: number;
    sukunimi: string;
    etunimi: string;
    sahkoposti: string;
    kayttajatunnus: string;
    salasana: string;
    ipOsoite: string;
    rekisteroitymisPvm: string;
}

const kayttajat: Kayttaja[] = [
    {
        "id": 1,
        "sukunimi": "Thorsby",
        "etunimi": "Shayne",
        "sahkoposti": "sthorsby0@disqus.com",
        "kayttajatunnus": "sthorsby0",
        "salasana": "5548746452ceef5433d972cbe7eec6f3aa3005f6c03df0b61c0c2145503155c5",
        "ipOsoite": "106.223.35.204",
        "rekisteroitymisPvm": "2020-10-08T08:17:24Z"
    },
    // ...
]

export default kayttajat;
```

`Kayttaja` on `interface`-avainsanalla määritelty tyyppi, joka kuvaa yhden käyttäjän kentät. Se on merkitty `export`-avainsanalla, jotta sen voi tuoda muihin tiedostoihin, tässä tapauksessa `index.ts`:ään. Muuttuja `kayttajat` on tyypitetty `Kayttaja[]`-taulukoksi, jolloin jokainen listan alkio tarkistetaan `Kayttaja`-tyyppiä vasten jo koodia kirjoitettaessa.

Datassa on myös kenttiä, joita ei ole tarkoitus palauttaa rajapinnan kautta, kuten `salasana` ja `ipOsoite`. Sisäinen datamalli sisältää usein enemmän tietoa kuin mitä ulkopuolelle näytetään.

> [!WARNING]
> Esimerkkidatassa salasana on tiivistetyssä eli hashatussa muodossa, mutta sitäkään ei palauteta rajapinnan vastauksissa. Myös `ipOsoite` liittyy käyttäjän yksityisyyteen. Seuraavassa luvussa nähdään, miten reiteissä vastaukseen poimitaan vain julkaistavaksi tarkoitetut kentät.

## 6 Reittien rakentaminen

Reittien ja HTTP-metodien perusrakenne käytiin läpi [demo 1:n luvussa 5](../demo-01/README.md#5-reittien-rakentaminen), ja tämänkin demon kolme reittiä kirjoitetaan `app.get()`-metodilla. Reittien yläpuolelle `index.ts`:n alkuun on määritelty kaksi tyyppiä, `Kayttajatieto` ja `Yhteystieto`, jotka kuvaavat vastausten muodot.

Kaikki reitit vastaavat `res.json()`-metodilla, joka muuntaa sille annetun olion tai taulukon JSON-muotoon. Demon 1 `res.send()` taipuisi tähän myös, mutta `res.json()` on vakiintunut tapa dataa palauttavissa rajapinnoissa.

### 6.1 GET /kayttajatiedot ja suodatus kyselyparametrilla

Ensimmäinen reitti palauttaa kaikkien käyttäjien perustiedot. Listan voi lisäksi rajata rekisteröitymisvuoden mukaan.

```ts
interface Kayttajatieto {
    id: number,
    nimi: string,
    sahkoposti: string,
    kayttajatunnus: string,
    rekisteroitymisPvm: string
}

app.get("/kayttajatiedot", (req: Request, res: Response) => {

    let kayttajatiedot: Kayttajatieto[] = kayttajat.map((kayttaja: Kayttaja) => {
        return {
            id: kayttaja.id,
            nimi: `${kayttaja.etunimi} ${kayttaja.sukunimi}`,
            sahkoposti: kayttaja.sahkoposti,
            kayttajatunnus: kayttaja.kayttajatunnus,
            rekisteroitymisPvm: kayttaja.rekisteroitymisPvm
        }
    });

    if (typeof req.query.vuosi === "string") {

        kayttajatiedot = kayttajatiedot.filter((kayttajatieto: Kayttajatieto) => kayttajatieto.rekisteroitymisPvm.substring(0, 4) === req.query.vuosi);

    }

    res.json(kayttajatiedot);

});
```

`Kayttajatieto` kuvaa, minkä muotoisena data näytetään rajapinnan käyttäjälle. `Kayttaja`-malliin verrattuna kentät `salasana` ja `ipOsoite` puuttuvat kokonaan, ja `etunimi` sekä `sukunimi` on yhdistetty yhdeksi `nimi`-kentäksi template string -muotoilulla.

Vastaus muodostetaan `.map()`-metodilla, joka käy käyttäjät läpi ja palauttaa jokaisesta uuden olion `Kayttajatieto`-muodossa.

Suodatus tehdään valinnaisella kyselyparametrilla `?vuosi=`, esimerkiksi `/kayttajatiedot?vuosi=2021`. Arvo varmistetaan merkkijonoksi `typeof`-tarkistuksella ennen käyttöä, koska kyselyparametri voi puuttua pyynnöstä kokonaan (kyselyparametrit käytiin läpi [demo 1:n luvussa 5.1](../demo-01/README.md#51-get-heippa-ja-kyselyparametrit)). If-lohkon sisällä listalle jäävät ne käyttäjät, joiden `rekisteroitymisPvm`-kentän neljä ensimmäistä merkkiä (`substring(0, 4)`) täsmäävät annettuun vuoteen.

### 6.2 GET /yhteystiedot

Toinen reitti palauttaa kaikkien käyttäjien yhteystiedot, eli suppeamman muodon samasta datasta.

```ts
interface Yhteystieto {
    id: number,
    nimi: string,
    sahkoposti: string
}

app.get("/yhteystiedot", (req: Request, res: Response) => {

    let yhteystiedot: Yhteystieto[] = kayttajat.map((kayttaja: Kayttaja) => {
        return {
            id: kayttaja.id,
            nimi: `${kayttaja.etunimi} ${kayttaja.sukunimi}`,
            sahkoposti: kayttaja.sahkoposti
        }
    });

    res.json(yhteystiedot);

});
```

Reitti muistuttaa rakenteeltaan edellistä. Mukana ovat pelkät yhteystiedot ilman käyttäjätunnusta ja rekisteröitymispäivää. `Yhteystieto` on oma tyyppinsä, vaikka osa kentistä on samoja kuin `Kayttajatieto`:ssa, koska tyypit kuvaavat eri käyttötarkoituksia. Toinen palvelee käyttäjätietojen hallintaa, toinen pelkkää yhteystietojen hakua.

### 6.3 GET /yhteystiedot/:id ja reittiparametrit

Kolmas reitti palauttaa yhden käyttäjän yhteystiedot. Haettavan käyttäjän id kirjoitetaan osoitteeseen, esimerkiksi `/yhteystiedot/7`.

```ts
app.get("/yhteystiedot/:id", (req: Request, res: Response) => {

    let yhteystieto: Yhteystieto | undefined = kayttajat.map((kayttaja: Kayttaja) => {
        return {
            id: kayttaja.id,
            nimi: `${kayttaja.etunimi} ${kayttaja.sukunimi}`,
            sahkoposti: kayttaja.sahkoposti
        }
    }).find((yhteystieto: Yhteystieto) => yhteystieto.id === Number(req.params.id));

    if (yhteystieto) {
        res.json(yhteystieto);
    } else {
        res.json({ virhe: `Käyttäjää id : ${req.params.id} ei löytynyt` });
    }

});
```

Osoitteen lopussa oleva `:id` on reittiparametri, eli osa URL-polkua, joka vaihtelee pyynnöstä toiseen. Sen arvo luetaan `req.params`-oliosta, tässä `req.params.id`. Arvo on aina merkkijono, joten `typeof`-tarkistusta ei tarvita. Vertailua varten se muunnetaan `Number()`-funktiolla numeroksi, koska `id`-kenttä on tyypitetty numeroksi.

Tulos haetaan ketjuttamalla `.map()`-kutsun perään `.find()`, joka palauttaa ensimmäisen ehdon täyttävän alkion tai `undefined`, jos yhtään sopivaa ei löydy. Muuttujan tyypiksi merkitään siksi `Yhteystieto | undefined`.

Hakutulosta käsitellään if/else-rakenteella. Jos `yhteystieto` on totuusarvoltaan tosi, se palautetaan sellaisenaan. Muussa tapauksessa palautetaan virheviestin sisältävä olio.

> [!TIP]
> Tämän demon reitit palauttavat aina HTTP-tilakoodin 200 (OK), myös silloin kun vastauksen sisältönä on virheilmoitus. Rajapintaa kutsuva ohjelma saa siis tiedon epäonnistumisesta vastauksen sisällöstä. Tilakoodeihin ja virheiden käsittelyyn palataan myöhemmissä demoissa.

## 7 Palvelimen käynnistäminen ja reittien testaaminen

Kun palvelin on käynnistetty yllä kuvatulla tavalla, terminaaliin tulostuu palvelimen oma lokiviesti:

```
Palvelin käynnistettiin osoitteeseen: http://localhost:3002
```

Koska reitit palauttavat JSON-dataa, niitä voi testata suoraan kirjoittamalla osoitteen selaimen osoiteriville:

```
http://localhost:3002/kayttajatiedot?vuosi=2021
http://localhost:3002/yhteystiedot
http://localhost:3002/yhteystiedot/7
```

Selain näyttää palvelimen palauttaman JSON-vastauksen suoraan sivulla. Pyynnöt onnistuvat myös [Postmanilla](https://www.postman.com/), josta on hyötyä myöhemmissä demoissa, kun rajapintaan lisätään myös muita HTTP-metodeja kuin GET.

Koska `tsx watch` seuraa tiedostomuutoksia, koodiin tehdyt muutokset näkyvät palvelimen vastauksissa heti tallennuksen jälkeen ilman, että palvelinta tarvitsee itse käynnistää uudelleen. Palvelimen voi sammuttaa painamalla `Ctrl+C` samassa terminaalissa.

Koodin tyypit voi tarkistaa myös erikseen, ilman palvelimen käynnistämistä, komennolla

```bash
npm run typecheck
```

## 8 Lopuksi

Demossa rakennettiin Express-palvelin, joka toimii web-rajapintana ja palauttaa dataa JSON-muodossa. Läpikäytyjä asioita:

- käyttäjädatan eriyttäminen omaan tiedostoonsa `models/kayttajat.ts`
- suppeampien vastausmuotojen muodostaminen sisäisestä datamallista
- arkaluontoisten kenttien jättäminen pois vastauksista
- reittiparametrit ja niiden ero kyselyparametreihin
- `.map()`- ja `.find()`-metodien käyttö datan muokkaamisessa ja hakemisessa

Myöhemmissä demoissa rajapintaa laajennetaan lisää, ja käyttäjältä aletaan vastaanottaa dataa pelkkien GET-pyyntöjen lisäksi myös muilla HTTP-metodeilla.
