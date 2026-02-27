# Demo 2: Web Service -perusteet

## 1. Web Service

### Mikä on Web Service?

Demo 1:ssä palvelin palautti vastauksena HTML-sivuja, joita selain näytti käyttäjälle. Web Service on erilainen: se ei tarjoa sivuja ihmiselle, vaan dataa toisille sovelluksille.

Web Servicen asiakas voi olla toinen palvelinohjelma, mobiilisovellus tai selainpuolen JavaScript-koodi. Asiakassovellus lähettää pyynnön, palvelin palauttaa datan koneluettavassa muodossa, ja asiakassovellus käyttää dataa itse parhaaksi katsomallaan tavalla — esimerkiksi näyttämällä sen omassa käyttöliittymässä.

Demo 2 toteuttaa yksinkertaisen Web Servicen, joka tarjoaa käyttäjädataa eri muodoissa kolmelta reitiltä. Koska vastaukset on tarkoitettu sovelluksille eikä suoraan ihmisille, palvelin ei palauta HTML:ää vaan JSON-muotoista dataa.

### JSON

JSON (JavaScript Object Notation) on tekstipohjainen tiedonsiirtomuoto. Se kuvaa tietorakenteen — objektin tai taulukon — merkkijonona, jota voidaan lähettää verkon yli.

JSON-objekti näyttää tältä:

```json
{
    "id": 1,
    "nimi": "Shayne Thorsby",
    "sahkoposti": "sthorsby0@disqus.com"
}
```

JSON-taulukko sisältää useita objekteja:

```json
[
    { "id": 1, "nimi": "Shayne Thorsby" },
    { "id": 2, "nimi": "Loise Hedylstone" }
]
```

JSON:ia käytetään lähes universaalisti REST-rajapintojen tiedonsiirtomuotona, koska se on kevyt, ihmisluettava ja kaikki ohjelmointikielet osaavat jäsentää sen.

### res.json()

Demo 1:ssä vastaukset lähetettiin `res.send()`-metodilla, joka lähettää tekstimuotoisen vastauksen. JSON-dataa varten käytetään `res.json()`-metodia:

```typescript
res.json({ id: 1, nimi: "Shayne Thorsby" });
```

`res.json()` tekee kaksi asiaa automaattisesti:
1. Muuntaa JavaScript-objektin tai -taulukon JSON-merkkijonoksi (`JSON.stringify()`)
2. Asettaa vastauksen `Content-Type`-otsakkeen arvoksi `application/json`

`Content-Type`-otsake kertoo vastaanottajalle, mitä muotoa vastauksen runko on. `application/json` kertoo, että kyseessä on JSON-data, jolloin asiakassovellus osaa jäsentää sen oikein.

---

## 2. TypeScript-rajapinta (interface)

### Mikä on interface?

TypeScript-rajapinta (`interface`) on tapa määritellä objektin rakenne: mitä kenttiä objektilla on ja minkä tyyppisiä ne ovat. Rajapinta on puhtaasti TypeScript-käsite — siitä ei generoidu ajoaikaista JavaScript-koodia. Se on vain TypeScript-kääntäjälle annettu kuvaus siitä, minkä muotoisia objekteja ohjelmassa käytetään.

```typescript
interface Yhteystieto {
    id: number;
    nimi: string;
    sahkoposti: string;
}
```

Tämä rajapinta kuvaa objektin, jossa on kolme kenttää: numeerinen `id`, merkkijono `nimi` ja merkkijono `sahkoposti`.

### Rajapinnan käyttö

Kun muuttuja tai funktion paluuarvo tyypitetään rajapinnalla, TypeScript tarkistaa, että kaikki kentät ovat oikein:

```typescript
const yhteystieto: Yhteystieto = {
    id: 1,
    nimi: "Shayne Thorsby",
    sahkoposti: "sthorsby0@disqus.com"
};
```

Jos yrität asettaa kentälle väärän tyypin tai jättää pakollisen kentän pois, TypeScript ilmoittaa virheestä jo ennen koodin suorittamista.

Rajapintaa voidaan käyttää myös taulukon alkioiden tyypin kuvaamiseen:

```typescript
const lista: Yhteystieto[] = [ /* ... */ ];
```

---

## 3. Tietomalli erillisessä tiedostossa

### Miksi erottaa tietomalli omaan tiedostoon?

Kun sovelluksessa on useita reittejä, jotka käyttävät samaa dataa, kannattaa data erottaa omaan tiedostoonsa. Tämä pitää koodin selkeänä: pääohjelma (`index.ts`) sisältää vain reittilogiikan, tietomalli (`models/kayttajat.ts`) sisältää datan ja sen tyypin.

### Viennit: export default ja export interface

TypeScript-tiedostosta voi viedä arvoja kahdella tavalla:

**Nimetty vienti** (`export`) vie yksittäisen nimetyn arvon tai tyypin. Saman tiedoston sisällä voi olla useita nimettyjä vientejä:

```typescript
export interface Kayttaja {
    id: number;
    etunimi: string;
    // ...
}
```

Nimetty vienti tuodaan aaltosulkeilla:

```typescript
import { type Kayttaja } from './models/kayttajat.js';
```

`type`-avainsana tuonnin edessä kertoo TypeScriptille, että kyseessä on pelkkä tyyppi, ei ajoaikainen arvo. Tämä on hyvä tapa tehdä selväksi, ettei rajapinnalla ole ajoaikavaikutusta.

**Oletusvienti** (`export default`) vie yhden pääasiallisen arvon tiedostosta. Tiedostossa voi olla vain yksi oletusvienti:

```typescript
const kayttajat: Kayttaja[] = [ /* ... */ ];

export default kayttajat;
```

Oletusvienti tuodaan ilman aaltosulkeita, ja tuodulle arvolle voi antaa haluamansa nimen:

```typescript
import kayttajat from './models/kayttajat.js';
```

Sama tuontilause voi tuoda sekä oletusvientin että nimetyn viennin:

```typescript
import kayttajat, { type Kayttaja } from './models/kayttajat.js';
```

### Huomio tiedostopäätteestä

Tuonnissa käytetään `.js`-päätettä vaikka tiedosto on `.ts`. Tämä johtuu siitä, että ES-moduulistandardi edellyttää tiedostopäätettä tuontipolussa, ja tsx kääntää `.ts`-tiedostot `.js`-tiedostoiksi. TypeScript osaa yhdistää `.js`-tuontipolun oikeaan `.ts`-lähdekooditiedostoon.

---

## 4. Taulukon käsittelymenetelmät

Demo 2 käyttää kolmea JavaScript-taulukon metodia datan muuntamiseen ja hakemiseen. Kaikki kolme ovat niin sanottuja korkeamman asteen funktioita: ne ottavat parametrikseen toisen funktion (callback-funktion), jota kutsutaan jokaiselle taulukon alkiolle.

### map()

`map()` käy taulukon jokaisen alkion läpi ja muodostaa uuden taulukon, jossa jokainen alkio on muunnettu callback-funktion palauttamaan muotoon. Alkuperäinen taulukko ei muutu.

```typescript
const numerot = [1, 2, 3, 4];
const tuplat = numerot.map(n => n * 2);
// tuplat === [2, 4, 6, 8]
```

Demo 2:ssa `map()`:ä käytetään muuntamaan `Kayttaja`-objektit suppeampaan muotoon, jossa arkaluonteiset kentät jätetään pois:

```typescript
const kayttajatiedot: Kayttajatieto[] = kayttajat.map((kayttaja: Kayttaja) => {
    return {
        id: kayttaja.id,
        nimi: `${kayttaja.etunimi} ${kayttaja.sukunimi}`,
        sahkoposti: kayttaja.sahkoposti,
        kayttajatunnus: kayttaja.kayttajatunnus,
        rekisteroitymisPvm: kayttaja.rekisteroitymisPvm
    };
});
```

Jokaista `Kayttaja`-objektia kohti callback palauttaa uuden `Kayttajatieto`-objektin. Kentät `salasana` ja `ipOsoite` jätetään tarkoituksella pois — niitä ei kirjoiteta palautuvan objektin kenttiin.

Huomaa myös, että `etunimi` ja `sukunimi` yhdistetään `nimi`-kentäksi template literaalin avulla: `` `${kayttaja.etunimi} ${kayttaja.sukunimi}` ``.

### filter()

`filter()` käy taulukon läpi ja palauttaa uuden taulukon, johon otetaan mukaan vain ne alkiot, joille callback palauttaa `true`. Alkuperäinen taulukko ei muutu.

```typescript
const numerot = [1, 2, 3, 4, 5, 6];
const parilliset = numerot.filter(n => n % 2 === 0);
// parilliset === [2, 4, 6]
```

Demo 2:ssa `filter()`:ä käytetään suodattamaan käyttäjät rekisteröitymisvuoden perusteella:

```typescript
kayttajatiedot = kayttajatiedot.filter(
    (kayttajatieto: Kayttajatieto) =>
        kayttajatieto.rekisteroitymisPvm.substring(0, 4) === req.query.vuosi
);
```

`substring(0, 4)` poimii merkkijonon ensimmäiset neljä merkkiä. Koska `rekisteroitymisPvm` on muodossa `"2021-03-05T18:48:22Z"`, `substring(0, 4)` palauttaa `"2021"`.

### find()

`find()` käy taulukon läpi ja palauttaa ensimmäisen alkion, jolle callback palauttaa `true`. Jos yhtään sopivaa alkiota ei löydy, palautusarvo on `undefined`.

```typescript
const numerot = [10, 20, 30, 40];
const yli25 = numerot.find(n => n > 25);
// yli25 === 30 (ensimmäinen ehdon täyttävä)

const yli100 = numerot.find(n => n > 100);
// yli100 === undefined (ei löytynyt)
```

Demo 2:ssa `find()`:ä käytetään hakemaan yksittäinen käyttäjä `id`-tunnuksella:

```typescript
const yhteystieto: Yhteystieto | undefined = muunnettuTaulukko
    .find((y: Yhteystieto) => y.id === Number(req.params.id));
```

Palautustyyppi on `Yhteystieto | undefined`, koska `find()` voi palauttaa joko löytyneen objektin tai `undefined`. Tämä pakottaa tarkistamaan löytyikö haettu alkio ennen kuin sen arvoa käytetään:

```typescript
if (yhteystieto) {
    res.json(yhteystieto);
} else {
    res.json({ virhe: `Käyttäjää id: ${req.params.id} ei löytynyt` });
}
```

---

## 5. Pyyntöparametrit

### Kyselyparametri (req.query)

Kyselyparametri on URL:n loppuun `?`-merkillä liitettävä valinnainen lisätieto:

```
http://localhost:3002/kayttajatiedot?vuosi=2021
```

Expressissa kyselyparametrit luetaan `req.query`-objektista:

```typescript
req.query.vuosi // "2021" tai undefined
```

Kyselyparametri on valinnainen: pyyntö `/kayttajatiedot` on yhtä lailla kelvollinen ilman parametriakin. Koodi tarkistaa onko parametri annettu ennen sen käyttöä.

### Reittiparametri (req.params)

Reittiparametri on URL-polkuun kirjoitettu muuttuva osa. Se merkitään reittimäärittelyssä kaksoispisteellä:

```typescript
app.get("/yhteystiedot/:id", ...)
```

Kun selain tekee pyynnön `/yhteystiedot/7`, Express täsmää tämän reitin ja asettaa `req.params.id` arvoksi `"7"`. Arvo on aina merkkijono, joten numeerinen vertailu vaatii muunnoksen:

```typescript
Number(req.params.id) // "7" → 7
```

Reittiparametri poikkeaa kyselyparametrista siinä, että reittiparametri on osa URL-polkua eikä ole valinnainen — ilman `:id`-arvoa pyyntö ei täsmää reittiin lainkaan.

### Milloin käyttää mitäkin?

| Tilanne | Suositeltava tapa |
|---------|-------------------|
| Yksittäisen resurssin hakeminen tunnuksella | Reittiparametri: `/kayttajat/7` |
| Tulosten suodattaminen tai rajaaminen | Kyselyparametri: `/kayttajat?vuosi=2021` |
| Useat valinnaiset hakukriteerit | Kyselyparametri: `/kayttajat?vuosi=2021&tunnus=abc` |

---

## 6. Sovelluksen rakentaminen vaiheittain

### Vaihe 1: Projektin alustaminen

Luodaan projektin kansio ja alustetaan npm-projekti:

```bash
npm init -y
```

Luodaan projektin kansiorakenne:

```
demo02/
├── models/
│   └── kayttajat.ts
├── public/
│   └── index.html
└── index.ts
```

### Vaihe 2: Riippuvuuksien asentaminen

```bash
npm install express
npm install -D tsx typescript @types/express @types/node
```

### Vaihe 3: package.json ja tsconfig.json

`package.json` ja `tsconfig.json` ovat identtiset demo 1:n kanssa, ainoastaan porttinumero eroaa (`3002`). Katso tiedostojen rakenne demo 1:n ohjeesta.

### Vaihe 4: Tietomalli (models/kayttajat.ts)

Luodaan `models/kayttajat.ts`. Tiedosto sisältää `Kayttaja`-rajapinnan ja käyttäjätaulukon:

```typescript
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
        "salasana": "5548746452ceef5433d972...",
        "ipOsoite": "106.223.35.204",
        "rekisteroitymisPvm": "2020-10-08T08:17:24Z"
    },
    // ... loput käyttäjät
];

export default kayttajat;
```

`Kayttaja`-rajapinta kuvaa tietomallin sellaisena kuin se tallennetaan: kaikki kentät mukaan lukien `salasana` ja `ipOsoite`. Nämä kentät ovat olemassa mallissa, mutta ne piilotetaan rajapintavastauksista muuntamalla data toiseen muotoon reiteissä.

### Vaihe 5: Etusivu (public/index.html)

Luodaan `public/index.html`, joka toimii sovelluksen etusivuna ja ohjaa Postman-testaukseen:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Demo 2</title>
</head>
<body>
    <h1>Demo 2: Web Service -perusteita</h1>
    <p>Testaa rajapintaa Postman-sovelluksella.
       GET-pyyntö osoitteeseen http://localhost:3002/kayttajatiedot
       palauttaa käyttäjälistan JSON-muodossa.</p>
</body>
</html>
```

### Vaihe 6: Pääohjelma (index.ts)

Luodaan `index.ts`. Ensin tuodaan moduulit ja luodaan Express-sovellus:

```typescript
import express from 'express';
import path from 'path';
import kayttajat, { type Kayttaja } from './models/kayttajat.js';

const app: express.Application = express();
const portti: number = Number(process.env.PORT) || 3002;

app.use(express.static(path.resolve(import.meta.dirname, "public")));
```

Sitten määritellään vastausmuotojen rajapinnat. Nämä ovat supistuksia `Kayttaja`-mallista — vain ne kentät, jotka kukin reitti palauttaa:

```typescript
interface Kayttajatieto {
    id: number;
    nimi: string;
    sahkoposti: string;
    kayttajatunnus: string;
    rekisteroitymisPvm: string;
}

interface Yhteystieto {
    id: number;
    nimi: string;
    sahkoposti: string;
}
```

`Kayttajatieto` sisältää käyttäjätiedot ilman arkaluonteisia kenttiä. `Yhteystieto` on vielä suppeampi — vain yhteystietoihin tarvittavat kentät.

**GET /kayttajatiedot**

```typescript
app.get("/kayttajatiedot", (req: express.Request, res: express.Response): void => {

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
        kayttajatiedot = kayttajatiedot.filter(
            (kayttajatieto: Kayttajatieto) =>
                kayttajatieto.rekisteroitymisPvm.substring(0, 4) === req.query.vuosi
        );
    }

    res.json(kayttajatiedot);

});
```

Ensin `map()` muuntaa kaikki käyttäjät `Kayttajatieto`-muotoon. Sitten tarkistetaan onko `vuosi`-kyselyparametri annettu — `typeof`-tarkistus varmistaa, että arvo on merkkijono, jotta `filter()`-vertailu toimii oikein. Jos parametri on annettu, taulukko suodatetaan rekisteröitymisvuoden mukaan. Lopuksi taulukko palautetaan JSON-vastauksena.

**GET /yhteystiedot**

```typescript
app.get("/yhteystiedot", (req: express.Request, res: express.Response): void => {

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

Palauttaa kaikki käyttäjät suppeammassa `Yhteystieto`-muodossa. Valinnaisia suodatuksia ei ole.

**GET /yhteystiedot/:id**

```typescript
app.get("/yhteystiedot/:id", (req: express.Request, res: express.Response): void => {

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
        res.json({ virhe: `Käyttäjää id: ${req.params.id} ei löytynyt` });
    }

});
```

`map()` muuntaa kaikki käyttäjät ensin `Yhteystieto`-muotoon, minkä jälkeen `find()` etsii oikean tunnuksella. Koska metodit palauttavat arvon, ketjutus `taulukko.map(...).find(...)` on mahdollinen ilman välimuuttujaa.

`Number(req.params.id)` muuntaa URL-parametrin merkkijonosta luvuksi, koska `Yhteystieto.id` on `number`-tyyppiä. Vertailu `=== `kahdella eri tyypillä (`number` ja `string`) ei toimisi.

Huomaa, että virhetilanteessa tämä reitti palauttaa HTTP 200 -vastauksen virheobjektin kera, ei HTTP 404:ää. Asianmukaisten tilakoodien käyttö virhevastauksissa otetaan käyttöön demo 3:ssa.

**Palvelimen käynnistys**

```typescript
app.listen(portti, (): void => {
    console.log(`Palvelin käynnistyi osoitteeseen: http://localhost:${portti}`);
});
```

---

## 7. Muistilista

### Taulukon käsittelymenetelmät

| Metodi | Mitä tekee | Paluuarvo |
|--------|-----------|-----------|
| `map(callback)` | Muuntaa jokaisen alkion callback-funktion palauttamaan muotoon | Uusi taulukko, sama pituus |
| `filter(callback)` | Pitää mukaan vain alkiot, joille callback palauttaa `true` | Uusi taulukko, pienempi tai yhtä suuri |
| `find(callback)` | Palauttaa ensimmäisen alkion, jolle callback palauttaa `true` | Yksittäinen alkio tai `undefined` |

### Pyyntöparametrit

| Rakenne | Miten URL:ssa | Esimerkki |
|---------|--------------|-----------|
| `req.query.avain` | `/reitti?avain=arvo` | `req.query.vuosi` → `"2021"` |
| `req.params.avain` | `/reitti/:avain` | `req.params.id` → `"7"` |

### Vientirakenteet

| Rakenne | Tiedostossa | Tuonnissa |
|---------|-------------|-----------|
| `export interface Foo` | Nimetty vienti | `import { type Foo } from './tiedosto.js'` |
| `export default arvo` | Oletusvienti | `import arvo from './tiedosto.js'` |
| Molemmat | Molemmat | `import arvo, { type Foo } from './tiedosto.js'` |

---

## Sovelluksen käynnistys

Jos kloonasit projektin valmiina, asenna riippuvuudet ja käynnistä palvelin:

```bash
npm install
npm run dev
```

Palvelin käynnistyy osoitteeseen `http://localhost:3002`. Testaa rajapintaa Postman-sovelluksella.
