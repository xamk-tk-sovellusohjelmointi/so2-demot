# Demo 1: Express-perusteet

## 1. Node.js ja web-palvelin

### Mikä on Node.js?

JavaScript on alun perin suunniteltu ajettavaksi selaimessa. Selain tarjoaa JavaScript-koodille ajoympäristön, jossa koodi voi muokata sivun rakennetta, reagoida käyttäjän toimiin ja lähettää pyyntöjä palvelimelle.

Node.js on erillinen ajoympäristö, joka mahdollistaa JavaScript- ja TypeScript-koodin suorittamisen palvelimella — selaimen ulkopuolella. Node.js:n ansiosta samaa ohjelmointikieltä voidaan käyttää sekä selainpuolella että palvelinpuolella.

Node.js sisältää myös laajan vakiokirjaston, jolla voidaan esimerkiksi lukea tiedostoja, käsitellä verkkopyyntöjä ja käynnistää HTTP-palvelimia. Vakiokirjaston päälle on rakennettu npm-ekosysteemi, joka tarjoaa satojatuhansia valmiita kirjastoja.

### Mikä on web-palvelin?

Web-palvelin on ohjelma, joka odottaa verkon kautta tulevia pyyntöjä ja lähettää niihin vastauksia. Kun kirjoitat osoitteen selaimen osoitekenttään ja painat Enter, selain lähettää pyynnön siihen osoitteeseen. Osoitteessa kuunteleva web-palvelin vastaanottaa pyynnön, käsittelee sen ja lähettää vastauksen takaisin.

Kehitysvaiheessa palvelin käynnistetään omalla koneella. Selain ja palvelin viestivät tällöin saman koneen sisällä, ja palvelimen osoite on `http://localhost`. Localhost tarkoittaa "tämä kone".

### Portti

Yksi tietokone voi ajaa useita palvelinohjelmia samanaikaisesti. Portti on numero, jolla erotetaan eri palvelut toisistaan. Portti kirjoitetaan osoitteeseen kaksoispisteellä erotettuna: `http://localhost:3001`. Tässä `3001` on portti, jolla palvelin kuuntelee.

Yleisesti käytettyjä portteja on varattu tietyille palveluille (esim. 80 on HTTP:n oletusportti, 443 HTTPS:n), joten kehityspalvelimet käyttävät tavallisesti suurempia numeroita kuten 3000–9000.

### Mikä on Express?

Node.js sisältää sisäänrakennetun `http`-moduulin, jolla HTTP-palvelimen voi rakentaa. Se on kuitenkin matalan tason rajapinta: kehittäjän on itse vertailtava URL-osoitteita, jäsennettävä pyyntöjen sisältö ja muodostettava vastaukset käsin.

Express on Node.js-sovelluskehys, joka rakentuu `http`-moduulin päälle ja yksinkertaistaa palvelimen rakentamista huomattavasti. Se tarjoaa selkeän rajapinnan reittien määrittelyyn, pyyntöjen käsittelyyn ja vastausten lähettämiseen.

---

## 2. HTTP-protokolla

### Mikä on HTTP?

HTTP (Hypertext Transfer Protocol) on protokolla, jolla selaimet ja palvelimet viestivät keskenään. Protokolla on sopimus siitä, miten viestit muotoillaan ja mitä ne tarkoittavat. HTTP toimii pyyntö–vastaus-mallilla: asiakas (yleensä selain) lähettää pyynnön, palvelin käsittelee sen ja palauttaa vastauksen.

### URL-osoitteen rakenne

URL (Uniform Resource Locator) on osoite, jolla resurssi yksilöidään verkossa. URL koostuu useasta osasta:

```
http://localhost:3001/heippa?nimi=Henri
 │         │        │   │       │
 │         │        │   │       └── kyselyparametrit (query string)
 │         │        │   └────────── polku (path)
 │         │        └────────────── portti
 │         └─────────────────────── isäntänimi (hostname)
 └───────────────────────────────── protokolla
```

- **Protokolla** kertoo, mitä protokollaa käytetään (`http` tai `https`)
- **Isäntänimi** on palvelimen osoite (`localhost` kehityksessä, verkkotunnus tuotannossa)
- **Portti** yksilöi palvelun tietokoneella
- **Polku** kertoo, mitä resurssia pyydetään (`/heippa`)
- **Kyselyparametrit** ovat valinnaisia lisätietoja, joita välitetään pyynnön mukana (`?nimi=Henri`)

### HTTP-pyyntö

HTTP-pyyntö sisältää kolme keskeistä osaa:

**Metodi** kertoo, mitä halutaan tehdä. Yleisimmät metodit:

| Metodi | Tarkoitus |
|--------|-----------|
| GET | Haetaan tietoa palvelimelta |
| POST | Lähetetään uutta tietoa palvelimelle |
| PUT | Korvataan olemassa oleva tieto kokonaan |
| DELETE | Poistetaan tieto |

**URL** kertoo, mihin resurssi kohdistuu.

**Otsakkeet** (headers) sisältävät lisätietoja pyynnöstä, kuten tiedon siitä, minkä tyyppistä sisältöä selain odottaa vastaukseksi.

GET-pyynnöissä ei yleensä ole runkoa (body). POST- ja PUT-pyynnöissä runko sisältää lähetettävän datan.

### HTTP-vastaus

Palvelin lähettää vastauksena:

**Tilakoodin**, joka kertoo pyynnön lopputuloksen. Tilakoodi on kolminumeroinen luku:

| Tilakoodi | Merkitys |
|-----------|----------|
| 200 OK | Pyyntö onnistui |
| 201 Created | Uusi resurssi luotiin onnistuneesti |
| 400 Bad Request | Pyyntö oli virheellinen |
| 404 Not Found | Pyydettyä resurssia ei löydy |
| 500 Internal Server Error | Palvelimella tapahtui odottamaton virhe |

**Otsakkeet**, jotka kertovat mm. palautuvan sisällön tyypin (`Content-Type: text/html` tai `Content-Type: application/json`).

**Rungon**, joka sisältää varsinaisen sisällön: HTML-sivun, JSON-datan tai muun.

---

## 3. Express-sovelluksen rakenne

### Sovelluksen luominen

Express-sovellus luodaan kutsumalla `express()`-funktiota:

```typescript
import express from 'express';

const app: express.Application = express();
```

`express()` palauttaa sovelluksen, johon rekisteröidään reitit ja middleware. Tyyppi `express.Application` on TypeScript-tyyppimäärittely, joka kuvaa sovelluksen rakennetta.

### Palvelimen käynnistäminen

Palvelin käynnistetään `app.listen()`-metodilla:

```typescript
const portti: number = Number(process.env.PORT) || 3001;

app.listen(portti, (): void => {
    console.log(`Palvelin käynnistyi osoitteeseen: http://localhost:${portti}`);
});
```

`app.listen()` saa ensimmäisenä parametrinaan porttinumeron ja toisena callback-funktion, joka ajetaan heti kun palvelin on valmis vastaanottamaan pyyntöjä.

`process.env.PORT` on ympäristömuuttuja, johon palvelualusta voi asettaa portin. Kehitysvaiheessa ympäristömuuttujaa ei ole asetettu, joten `process.env.PORT` on `undefined`. `Number(undefined)` tuottaa `NaN`, jolloin `||`-operaattori valitsee oletusarvon `3001`.

### Reitit

Reitti yhdistää HTTP-metodin, URL-polun ja käsittelyfunktion. GET-reitti rekisteröidään `app.get()`-metodilla:

```typescript
app.get("/moikka", (req: express.Request, res: express.Response): void => {
    res.send("<h1>Moikka!</h1>");
});
```

`app.get()` ottaa kaksi parametria:
- **Polku** merkkijonona — tässä `"/moikka"`. Polku on URL-osoitteen osa isäntänimen ja portin jälkeen.
- **Käsittelyfunktio** — funktio, joka suoritetaan, kun pyyntö saapuu tälle reitille.

Käsittelyfunktio saa kaksi parametria:
- **`req`** (`express.Request`) — pyyntöolio, joka sisältää kaikki pyynnön tiedot: URL:n, parametrit, otsakkeet ja mahdollisen rungon.
- **`res`** (`express.Response`) — vastusolio, jonka metodeilla rakennetaan ja lähetetään vastaus selaimelle.

`res.send()` lähettää tekstimuotoisen vastauksen. Se asettaa `Content-Type`-otsakkeen automaattisesti: HTML-merkkijonoille `text/html`, muille merkkijonoille `text/plain`.

### Kyselyparametrit

Kyselyparametrit ovat URL:n loppuun `?`-merkillä liitettäviä `avain=arvo`-pareja. Useita parametreja erotetaan `&`-merkillä:

```
/heippa?nimi=Henri&kieli=fi
```

Expressissa kyselyparametrit löytyvät `req.query`-objektista. Jos URL on `/heippa?nimi=Henri`, niin `req.query.nimi` sisältää merkkijonon `"Henri"`.

`req.query`-objektin arvojen tyyppi on TypeScriptissa laaja: `string | ParsedQs | string[] | ParsedQs[] | undefined`. Tämä johtuu siitä, että URL:n voi rakentaa kuka tahansa — parametri voi puuttua kokonaan, olla yksittäinen arvo, tai sama avain voi esiintyä useita kertoja (jolloin se muuttuu taulukoksi).

Ennen käyttöä tyyppi on kaventava tarkistus:

```typescript
app.get("/heippa", (req: express.Request, res: express.Response): void => {

    let nimi: string = "";

    if (typeof req.query.nimi === "string") {
        nimi = req.query.nimi; // TypeScript tietää nyt, että tyyppi on string
    } else {
        nimi = "tuntematon"; // parametri puuttui tai oli muuta tyyppiä
    }

    res.send(`<h1>Heippa, ${nimi}!</h1>`);

});
```

`typeof`-tarkistus on TypeScriptin tyyppikavennusta (type narrowing): `if`-lohkon sisällä TypeScript tietää `req.query.nimi`:n olevan `string`, koska se on ainoa vaihtoehto, joka läpäisee `typeof === "string"` -tarkistuksen.

### Middleware

Middleware on funktio, joka suoritetaan pyyntöä käsiteltäessä ennen varsinaista reittikäsittelijää. Middleware voi muokata pyyntöä tai vastausta, lopettaa käsittelyn tai siirtää sen eteenpäin. Middleware rekisteröidään `app.use()`-metodilla.

Expressissa middlewaret suoritetaan rekisteröimisjärjestyksessä: ensin rekisteröidyt ensin.

### Staattiset tiedostot

Staattiset tiedostot ovat selaimelle sellaisenaan toimitettavia tiedostoja: HTML-sivut, CSS-tiedostot, kuvat, JavaScript-tiedostot jne. Niitä ei käsitellä ohjelmakoodissa, vaan ne lähetetään suoraan tiedostojärjestelmästä.

`express.static()` on Expressin sisäänrakennettu middleware, joka toimittaa tiedostot annetusta kansiosta:

```typescript
import path from 'path';

app.use(express.static(path.resolve(import.meta.dirname, "public")));
```

`path.resolve()` rakentaa absoluuttisen tiedostopolun yhdistämällä osia. Absoluuttinen polku toimii luotettavasti riippumatta siitä, mistä hakemistosta palvelin käynnistetään.

`import.meta.dirname` on ES-moduulien tapa saada nykyisen tiedoston hakemiston polku. Se vastaa Node.js:n vanhempaa `__dirname`-muuttujaa, jota käytettiin CommonJS-moduuleissa.

`"public"` on kansion nimi, josta staattisia tiedostoja tarjotaan.

Kun `express.static()` on rekisteröity, Express tarkistaa jokaisen saapuvan pyynnön kohdalla, löytyykö `public/`-kansiosta vastaava tiedosto. Jos selain pyytää `/index.html`, Express etsii tiedoston `public/index.html` ja lähettää sen. Juuripyyntö `/` etsii automaattisesti `public/index.html`. Jos tiedostoa ei löydy, pyyntö siirtyy seuraavaksi rekisteröityyn middlewareen tai reittiin.

---

## 4. Projektin työkalut

### tsx

TypeScript-koodi on käännettävä JavaScript-koodiksi ennen suorittamista, koska Node.js ei tunne TypeScript-syntaksia suoraan. Normaalisti käännös tehdään `tsc`-kääntäjällä, joka tuottaa `.js`-tiedostoja.

`tsx` on työkalu, joka yhdistää käännöksen ja suorituksen: se kääntää TypeScript-koodin muistissa ja suorittaa sen välittömästi ilman erillisiä `.js`-tiedostoja. Kehitysvaiheessa tämä nopeuttaa työnkulkua huomattavasti.

`tsx watch` -komento käynnistää palvelimen uudelleen automaattisesti aina, kun lähdekoodi muuttuu. Tämä tarkoittaa, että kehittäjän ei tarvitse sammuttaa ja käynnistää palvelinta käsin jokaisen muutoksen jälkeen.

### ES-moduulit

JavaScript-koodissa on kaksi tapaa jakaa koodi moduuleihin:

**CommonJS** (`require`/`module.exports`) on Node.js:n alkuperäinen moduulijärjestelmä:
```javascript
const express = require('express');
module.exports = jotain;
```

**ES-moduulit** (`import`/`export`) on JavaScriptin standardi, jota myös selaimet tukevat:
```typescript
import express from 'express';
export default jotain;
```

`package.json`:n `"type": "module"` -asetus kertoo Node.js:lle, että projekti käyttää ES-moduuleja. Ilman tätä asetusta Node.js tulkitsee `.js`-tiedostot CommonJS-moduuleiksi.

---

## 5. Sovelluksen rakentaminen vaiheittain

### Vaihe 1: Projektin alustaminen

Luodaan projektin kansio ja alustetaan npm-projekti:

```bash
npm init -y
```

`npm init` luo `package.json`-tiedoston, joka kuvaa projektin riippuvuudet ja skriptit. `-y`-lippu hyväksyy oletusarvot kaikkiin kysymyksiin.

Luodaan projektin kansiorakenne:

```
demo01/
├── public/
│   ├── img/
│   │   └── xamklogo.png
│   └── index.html
└── index.ts
```

`public/`-kansio sisältää kaikki staattiset tiedostot, jotka palvelin toimittaa selaimelle sellaisenaan.

### Vaihe 2: Riippuvuuksien asentaminen

```bash
npm install express
npm install -D tsx typescript @types/express @types/node
```

`npm install` lisää paketin projektin riippuvuuksiin ja tallentaa sen `node_modules/`-kansioon. `-D`-lippu (tai `--save-dev`) merkitsee paketin kehitysriippuvuudeksi: nämä paketit tarvitaan vain kehitysvaiheessa, eivät tuotantoympäristössä.

- `express` — web-sovelluskehys, jolla palvelin rakennetaan
- `tsx` — TypeScript-suoritusympäristö kehityskäyttöön
- `typescript` — TypeScript-kääntäjä
- `@types/express` — TypeScript-tyyppimäärittelyt Express-kirjastolle. Express on kirjoitettu JavaScriptillä, joten TypeScript tarvitsee erillisen tyypitystiedoston tietääkseen, mitä funktioita ja tyyppejä kirjasto tarjoaa.
- `@types/node` — TypeScript-tyyppimäärittelyt Node.js:n vakiokirjastolle (mm. `path`, `process`)

### Vaihe 3: package.json

Muokataan `package.json`:ää lisäämällä `type`-kenttä ja `scripts`:

```json
{
  "name": "demo01",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "start": "tsx index.ts",
    "dev": "tsx watch index.ts"
  },
  "dependencies": {
    "express": "^5.2.1"
  },
  "devDependencies": {
    "@types/express": "^5.0.6",
    "@types/node": "^25.2.3",
    "tsx": "^4.21.0",
    "typescript": "^5.9.3"
  }
}
```

`"type": "module"` aktivoi ES-moduulisyntaksin. Ilman tätä `import`-lauseet eivät toimi.

`scripts`-kenttä määrittelee komentoja, joita voi ajaa `npm run <nimi>` -komennolla:
- `npm run start` käynnistää palvelimen kerran
- `npm run dev` käynnistää palvelimen watch-tilassa, jolloin se käynnistyy uudelleen automaattisesti koodimuutosten jälkeen

### Vaihe 4: tsconfig.json

Luodaan TypeScript-konfiguraatiotiedosto `tsconfig.json`:

```json
{
  "compilerOptions": {
    "module": "preserve",
    "target": "esnext",
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

Keskeisimmät asetukset:
- `"module": "preserve"` — säilyttää `import`-lauseet sellaisinaan, jolloin tsx voi käsitellä ne
- `"target": "esnext"` — kääntää moderniin JavaScript-syntaksiin
- `"strict": true` — aktivoi tiukan tyyppitarkistuksen, joka estää yleisimmät virheet
- `"types": ["node"]` — lisää Node.js:n tyypit (`process`, `__dirname` jne.)
- `"skipLibCheck": true` — ohittaa kirjastotiedostojen tyyppitarkistuksen, mikä nopeuttaa käännöstä

### Vaihe 5: Staattinen etusivu (public/index.html)

Luodaan `public/index.html`:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Demo 1</title>
</head>
<body>
    <h1>Demo 1: Express-perusteita</h1>

    <ul>
        <li><a href="/heippa?nimi=Henri">Sano heippa (Henri)</a></li>
        <li><a href="/heippa?nimi=Jussi">Sano heippa (Jussi)</a></li>
        <li><a href="/moikka">Sano moikka</a></li>
    </ul>

    <img src="/img/xamklogo.png" alt="Xamk-logo" />
</body>
</html>
```

`public/index.html` on staattinen tiedosto, jonka Express toimittaa automaattisesti, kun selain pyytää juuriosoitetta `/`. Sivulla olevat linkit osoittavat palvelimen reiteille. Linkki `/heippa?nimi=Henri` on täydellinen esimerkki kyselyparametrien käytöstä: selain lähettää GET-pyynnön osoitteeseen, jossa `nimi=Henri` on kyselyparametri.

Kuva haetaan polulla `/img/xamklogo.png`. Express etsii tiedoston `public/img/xamklogo.png`.

### Vaihe 6: Pääohjelma (index.ts)

Luodaan `index.ts`:

```typescript
import express from 'express';
import path from 'path';

const app: express.Application = express();

const portti: number = Number(process.env.PORT) || 3001;

app.use(express.static(path.resolve(import.meta.dirname, "public")));

app.get("/heippa", (req: express.Request, res: express.Response): void => {

    let nimi: string = "";

    if (typeof req.query.nimi === "string") {
        nimi = req.query.nimi;
    } else {
        nimi = "tuntematon";
    }

    res.send(`<h1>Heippa, ${nimi}!</h1>`);

});

app.get("/moikka", (req: express.Request, res: express.Response): void => {
    res.send(`<h1>Moikka!</h1>`);
});

app.listen(portti, (): void => {
    console.log(`Palvelin käynnistyi osoitteeseen: http://localhost:${portti}`);
});
```

**Rivi riviltä:**

`import express from 'express'` tuo Express-kirjaston. `import path from 'path'` tuo Node.js:n `path`-moduulin tiedostopolkujen käsittelyyn.

`express.static()` rekisteröidään ennen reittejä. Järjestys on tärkeä: Express käsittelee pyynnöt rekisteröimisjärjestyksessä. Kun pyyntö saapuu, Express tarkistaa ensin `public/`-kansion. Jos tiedosto löytyy, se lähetetään ja käsittely päättyy. Jos ei löydy, Express jatkaa reittien tarkistamiseen.

`/heippa`-reitin käsittelijä tarkistaa `typeof req.query.nimi === "string"` ennen arvon käyttöä. Jos `nimi`-parametri on annettu URL:ssa, `req.query.nimi` on merkkijono. Jos parametria ei ole annettu lainkaan tai se on monimerkintäinen, se on muuta tyyppiä tai `undefined`. Oletusarvo `"tuntematon"` käytetään silloin, kun parametri puuttuu tai on väärää tyyppiä.

---

## 6. Muistilista

### Express-palvelimen rakenne

| Rakenne | Selitys |
|---------|---------|
| `express()` | Luo uuden Express-sovelluksen |
| `app.listen(portti, callback)` | Käynnistää HTTP-palvelimen, kutsuu callbackin kun valmis |
| `app.use(middleware)` | Rekisteröi middlewaren kaikkia saapuvia pyyntöjä varten |
| `app.get(polku, käsittelijä)` | Rekisteröi GET-reitin annetulle polulle |
| `res.send(sisältö)` | Lähettää merkkijono- tai HTML-vastauksen |
| `req.query.avain` | Lukee URL-kyselyparametrin arvon |
| `express.static(kansio)` | Middleware, joka tarjoaa tiedostoja kansiosta suoraan |

### HTTP-tilakoodit

| Tilakoodi | Milloin käytetään |
|-----------|------------------|
| 200 OK | Pyyntö onnistui. `res.send()`:n oletusarvo. |
| 404 Not Found | Pyydettyä resurssia ei löydy. Express palauttaa tämän automaattisesti, jos mikään reitti ei täsmää pyyntöön. |

---

## Sovelluksen käynnistys

Jos kloonasit projektin valmiina, asenna riippuvuudet ja käynnistä palvelin:

```bash
npm install
npm run dev
```

Palvelin käynnistyy osoitteeseen `http://localhost:3001`.
