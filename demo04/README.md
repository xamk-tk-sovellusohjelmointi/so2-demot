# Demo 4: REST API ja virhekäsittelijä

## 1. Virheiden käsittely REST API:ssa

### Miksi virheiden käsittely on tärkeää

REST API vastaanottaa pyyntöjä eri asiakassovelluksilta, joista osa voi olla virheellisiä. Pyyntö voi kohdistua resurssiin, jota ei ole olemassa, tai pyynnön body voi puuttua kokonaan tai olla muodoltaan virheellinen. Palvelimen on kyettävä tunnistamaan nämä tilanteet ja vastaamaan asianmukaisella HTTP-tilakoodilla sekä selkeällä virheilmoituksella.

### Kaksi tapaa käsitellä virheitä Expressissa

**Suora käsittely jokaisessa reitissä** tarkoittaa, että reitti tarkistaa virhetilanteet itse ja lähettää virhevastauksen suoraan:

```typescript
router.get("/:id", (req, res) => {
    const ajo = ajot.find(a => a.id === Number(req.params.id));
    if (!ajo) {
        return res.status(404).json({ viesti: "Ajoa ei löytynyt" });
    }
    res.json(ajo);
});
```

Tämä toimii yksinkertaisissa sovelluksissa, mutta johtaa toistuvaan koodiin, kun samoja virhetilanteita käsitellään useissa eri reiteissä. Jos virhevastauksen muoto haluaa muuttaa, muutos on tehtävä jokaiseen reittiin erikseen.

**Erillinen virhekäsittelijä** tarkoittaa, että reitti heittää virheobjektin, jonka Express välittää erilliselle virhekäsittelymiddlewarelle. Reitin ei tarvitse tietää, miten virhe muotoillaan ja lähetetään:

```typescript
router.get("/:id", (req, res) => {
    const ajo = ajot.find(a => a.id === Number(req.params.id));
    if (!ajo) {
        throw new Virhe(404, "Ajoa ei löytynyt");
    }
    res.json(ajo);
});
```

Tässä lähestymistavassa virheen muotoilu ja lähettäminen on keskitetty yhteen paikkaan. Muutos virhevastauksen rakenteeseen täytyy tehdä vain yhteen tiedostoon.

### Express-virhekäsittelijämiddleware

Express tunnistaa virhekäsittelijämiddlewaren neljän parametrin perusteella. Tavallisella middlewarella on kolme parametria (`req`, `res`, `next`), virhekäsittelijällä on neljä, ja ensimmäisenä tulee `err`, joka sisältää heitetyn virheobjektin:

```typescript
const virhekasittelija = (err: Virhe, _req: express.Request, res: express.Response, _next: express.NextFunction): void => {
    res.status(err.status).json({ viesti: err.viesti });
}
```

Virhekäsittelijä rekisteröidään pääohjelmassa viimeisenä kaikkien reittien jälkeen:

```typescript
app.use("/api/ajopaivakirja", apiAjopaivakirjaRouter);
app.use(virhekasittelija); // Aina viimeisenä
```

### Express 5 ja automaattinen virheiden välitys

Demo käyttää Express 5:tä, jossa sekä synkronisissa että asynkronisissa käsittelijöissä heitetyt virheet välitetään automaattisesti virhekäsittelijälle. Express 4:ssä asynkronisten käsittelijöiden virheet piti välittää manuaalisesti `next(err)`-kutsulla, koska Express ei voinut pyydystää niitä automaattisesti.

### Demosovelluksen aihe

Demosovellus on ajopäiväkirjan REST API, joka on toiminnaltaan identtinen demo 3:n kanssa. Ainoa ero on virheenkäsittelytapa: demo 3:ssa virheet käsitellään suoraan jokaisessa reitissä, demo 4:ssä ne heitetään `Virhe`-luokan ilmentymänä ja käsitellään keskitetysti virhekäsittelijässä.

Sovelluksen tunnistaa REST API -sovellukseksi samoista piirteistä kuin demo 3: se tarjoaa resursseja URI-osoitteissa, käyttää HTTP-metodeja semanttisesti, viestii JSON-muodossa ja on tilaton.

Sovelluksen rajapintapolut:

| Metodi | Polku | Toiminto |
|--------|-------|----------|
| GET    | /api/ajopaivakirja       | Palauttaa kaikki ajot |
| GET    | /api/ajopaivakirja/:id   | Palauttaa yhden ajon id:n perusteella |
| POST   | /api/ajopaivakirja       | Lisää uuden ajon |
| PUT    | /api/ajopaivakirja/:id   | Korvaa olemassa olevan ajon tiedot |
| DELETE | /api/ajopaivakirja/:id   | Poistaa ajon |

---

## 2. Demosovelluksen rakentuminen vaihe vaiheelta

Demosovelluksen rakentaminen alkaa samoilla perusvaiheilla kuin demo 3:ssa. Tässä luvussa käydään nuo vaiheet lyhyesti läpi ja syvennytään tarkemmin demo 4:n lisäämiin uusiin rakenteisiin: `Virhe`-luokkaan, `virhekasittelija`-middlewareen ja niiden kytkemiseen reitteihin.

### Vaihe 1: Projektin alustaminen

```bash
mkdir demo04
cd demo04
npm init -y
```

`npm init -y` luo `package.json`-tiedoston oletusarvoilla. Se on Node.js-projektin pakollinen perustiedosto.

### Vaihe 2: Riippuvuuksien asentaminen

```bash
npm install express
npm install --save-dev tsx typescript @types/express @types/node
```

Riippuvuudet ovat samat kuin demo 3:ssa:

- `express` on palvelinkirjasto HTTP-pyyntöjen käsittelyyn.
- `tsx` mahdollistaa TypeScript-tiedostojen suoran suorittamisen ilman erillistä käännösvaihetta.
- `typescript` on TypeScript-kääntäjä.
- `@types/express` ja `@types/node` ovat TypeScript-tyyppimäärittelyt Express- ja Node.js-kirjastoille.

### Vaihe 3: TypeScript-konfiguraatio

Luodaan projektin juureen `tsconfig.json`:

```json
{
  "compilerOptions": {
    "module": "preserve",
    "target": "esnext",
    "lib": ["esnext"],
    "types": ["node"],
    "strict": true,
    "resolveJsonModule": true,
    "esModuleInterop": true,
    "sourceMap": true,
    "skipLibCheck": true
  }
}
```

Asetukset ovat samat kuin demo 3:ssa. `"strict": true` aktivoi tiukimmat tyyppitarkistukset ja `"esModuleInterop": true` mahdollistaa CommonJS-pakettien tuonnin ES-moduulisyntaksilla.

### Vaihe 4: Käynnistysskriptit ja moduulimuoto

Lisätään `package.json`:iin `"type": "module"` ja `scripts`-kenttä:

```json
{
  "name": "demo04",
  "type": "module",
  "scripts": {
    "start": "tsx index.ts",
    "dev": "tsx watch index.ts"
  }
}
```

`"type": "module"` kertoo Node.js:lle, että projekti käyttää ES-moduulisyntaksia. `"dev"` käynnistää palvelimen kehitysmoodissa, jolloin se käynnistyy automaattisesti uudelleen tiedostomuutosten yhteydessä.

### Vaihe 5: Tietomallin luominen (models/ajot.ts)

Luodaan `models/`-kansio ja sinne `ajot.ts`. Tiedoston sisältö on identtinen demo 3:n kanssa.

```typescript
// models/ajot.ts

export interface Ajo {
    id: number;
    reitti: string;
    km: number;
    ajaja: string;
    pvm: string;
}

const ajot: Ajo[] = [
    {
        id: 1,
        reitti: "Mikkeli-Juva-Mikkeli",
        km: 126,
        ajaja: "A12",
        pvm: new Date("2025-03-04").toLocaleDateString("fi-FI")
    },
    // ...lisää ajoja
];

export default ajot;
```

`interface Ajo` määrittelee yksittäisen ajon tietorakenteen. `export default ajot` tekee taulukosta tuotavan muissa tiedostoissa. `export interface` tekee tyypistä tuotavan named importina.

### Vaihe 6: Virhekäsittelijän luominen (errors/virhekasittelija.ts)

Tämä vaihe on demo 4:n keskeinen lisäys demo 3:een nähden. Luodaan `errors/`-kansio ja sinne `virhekasittelija.ts`. Tiedosto sisältää kaksi erillistä asiaa: `Virhe`-luokan ja `virhekasittelija`-middlewarefunktion.

**`Virhe`-luokka**

```typescript
export class Virhe extends Error {
    status: number;
    viesti: string;

    constructor(status?: number, viesti?: string) {
        super(viesti);
        this.status = status || 500;
        this.viesti = viesti || "Palvelimella tapahtui odottamaton virhe";
    }
}
```

`Virhe` laajentaa JavaScriptin sisäänrakennettua `Error`-luokkaa. `extends Error` tarkoittaa, että `Virhe` on `Error`-luokan aliluokka, joka perii kaikki `Error`:n ominaisuudet ja lisää niihin omat kenttänsä.

`constructor` on metodi, joka suoritetaan aina, kun `new Virhe(...)` luodaan. Se ottaa vastaan kaksi valinnaista parametria, jotka on merkitty `?`-merkillä:

- `status?: number` on HTTP-tilakoodi. Jos sitä ei anneta, `status || 500` asettaa oletusarvoksi 500.
- `viesti?: string` on asiakkaalle palautettava virheilmoitus. Jos sitä ei anneta, käytetään oletustekstiä.

`super(viesti)` kutsuu `Error`-luokan omaa konstruktoria, mikä on pakollista aliluokassa, jossa `super()`-kutsu on tehtävä ennen muita operaatioita.

Kun reitissä heitetään virhe, se tapahtuu seuraavasti:

```typescript
throw new Virhe(404, "Ajoa ei löytynyt");
```

`throw` lopettaa käsittelijäfunktion suorituksen välittömästi ja siirtää heitetyn virheobjektin Expressille, joka välittää sen eteenpäin virhekäsittelijälle.

**`virhekasittelija`-funktio**

```typescript
const virhekasittelija = (err: Virhe, _req: express.Request, res: express.Response, _next: express.NextFunction): void => {
    res.status(err.status).json({ viesti: err.viesti });
}

export default virhekasittelija;
```

Express tunnistaa virhekäsittelijän juuri neljän parametrin perusteella. Järjestys on kiinteä: `err`, `req`, `res`, `next`. Parametrit `_req` ja `_next` on kirjoitettu alaviiva-etuliitteellä `_`, koska niitä ei käytetä funktion sisällä. Tämä on yleinen TypeScriptin käytäntö käyttämättömille mutta pakollisille parametreille, ja se poistaa käyttämättömästä muuttujasta kertovan varoituksen.

`err`-parametri on reitistä heitetty `Virhe`-ilmentymä. Funktio lukee siitä `status`- ja `viesti`-kentät ja lähettää ne HTTP-vastauksena.

`export default virhekasittelija` vie funktion oletusvientinä, jotta se voidaan tuoda `index.ts`:ssä. `Virhe`-luokka on viety nimettynä vientinä (`export class Virhe`), joten se tuodaan aaltosulkeilla: `import { Virhe } from '../errors/virhekasittelija'`.

### Vaihe 7: Reitinkäsittelijät (routes/apiAjopaivakirja.ts)

Luodaan `routes/`-kansio ja sinne `apiAjopaivakirja.ts`. Tiedoston rakenne on sama kuin demo 3:ssa, mutta virheilmoitukset lähetetään heittämällä `Virhe`-luokan ilmentymä suoran `res.status().json()`-kutsun sijasta.

**Tiedoston alkuosa**

```typescript
import express from 'express';
import ajot, { type Ajo } from '../models/ajot';
import { Virhe } from '../errors/virhekasittelija';

const apiAjopaivakirjaRouter: express.Router = express.Router();
apiAjopaivakirjaRouter.use(express.json());
```

`Virhe` tuodaan nimettynä importina `{ Virhe }`, koska se on viety nimetyllä `export class`-lauseella eikä oletusvientinä.

`express.json()` rekisteröidään reitittimelle middlewareksi, jotta `req.body` on käytettävissä POST- ja PUT-pyynnöissä.

**GET / : kaikkien ajojen haku**

```typescript
apiAjopaivakirjaRouter.get("/", (req: express.Request, res: express.Response) => {
    res.json(ajot);
});
```

Tässä reitissä ei ole virhetilanteita, joten se on identtinen demo 3:n kanssa.

**GET /:id : yksittäisen ajon haku**

```typescript
apiAjopaivakirjaRouter.get("/:id", (req: express.Request, res: express.Response) => {
    const id = Number(req.params.id);
    const ajo = ajot.find(ajo => ajo.id === id);

    if (!ajo) {
        throw new Virhe(404, "Ajoa ei löytynyt");
    }

    res.json(ajo);
});
```

Demo 3:ssa vastaava virhekohta oli `return res.status(404).json({ viesti: "Ajoa ei löytynyt" })`. Demo 4:ssä `return`-lausetta ei tarvita, koska `throw` lopettaa funktion suorituksen välittömästi. Express 5 välittää heitetyn virheen automaattisesti virhekäsittelijälle.

**POST / : uuden ajon lisääminen**

```typescript
apiAjopaivakirjaRouter.post("/", (req: express.Request, res: express.Response) => {
    if (!req.body.reitti || !req.body.km || !req.body.ajaja) {
        throw new Virhe(400, "Virheellinen pyynnön body");
    }

    const id = ajot.length === 0
        ? 1
        : Math.max(...ajot.map(ajo => ajo.id)) + 1;

    const uusiAjo: Ajo = {
        id,
        reitti: req.body.reitti,
        km: Number(req.body.km),
        ajaja: req.body.ajaja,
        pvm: new Date().toLocaleDateString("fi-FI")
    };

    ajot.push(uusiAjo);
    res.status(201).json(ajot);
});
```

Validointivirhe heitetään tilakoodilla 400 (virheellinen pyyntö eli bad request). Logiikka on muuten identtinen demo 3:n kanssa: id lasketaan suurimmasta olemassa olevasta id:stä kasvattamalla sitä yhdellä, ja uusi ajo lisätään taulukon loppuun `push()`-metodilla.

**PUT /:id : olemassa olevan ajon muokkaaminen**

```typescript
apiAjopaivakirjaRouter.put("/:id", (req: express.Request, res: express.Response) => {
    const index = ajot.findIndex(ajo => ajo.id === Number(req.params.id));

    if (index === -1) {
        throw new Virhe(404, "Ajoa ei löydy");
    }

    if (!req.body.reitti || !req.body.km || !req.body.ajaja) {
        throw new Virhe(400, "Virheellinen pyynnön body");
    }

    const muokattuAjo: Ajo = {
        id: Number(req.params.id),
        reitti: req.body.reitti,
        km: Number(req.body.km),
        ajaja: req.body.ajaja,
        pvm: new Date().toLocaleDateString("fi-FI")
    };

    ajot[index] = muokattuAjo;
    res.json(ajot);
});
```

`findIndex()` palauttaa alkion indeksin tai `-1`, jos alkiota ei löydy. Indeksiä tarvitaan, jotta muokattu ajo voidaan korvata suoraan taulukon tiettyyn sijaintiin: `ajot[index] = muokattuAjo`.

Jos ajoa ei löydy, index on -1 ja virheenä heitetään 404-status, eli resurssia ei löytynyt. Jos taas pyynnön body on virheellinen, heitetään 400-status, eli virheellinen pyyntö.

**DELETE /:id : ajon poistaminen**

```typescript
apiAjopaivakirjaRouter.delete("/:id", (req: express.Request, res: express.Response) => {
    const index = ajot.findIndex(ajo => ajo.id === Number(req.params.id));

    if (index === -1) {
        throw new Virhe(404, "Ajoa ei löytynyt");
    }

    ajot.splice(index, 1);
    res.json(ajot);
});
```

`splice(index, 1)` poistaa yhden alkion tietystä kohtaa taulukosta. Muut alkiot siirtyvät automaattisesti täyttämään poistetun alkion paikan.

**Reitittimen vienti**

```typescript
export default apiAjopaivakirjaRouter;
```

### Vaihe 8: Pääohjelma (index.ts)

Luodaan projektin juureen `index.ts`. Se on rakenteeltaan sama kuin demo 3:ssa, mutta sisältää kaksi lisäystä: `virhekasittelija`-tuonnin ja sen rekisteröinnin.

```typescript
import express from 'express';
import path from 'path';
import apiAjopaivakirjaRouter from './routes/apiAjopaivakirja';
import virhekasittelija from './errors/virhekasittelija';

const app: express.Application = express();

const portti: number = Number(process.env.PORT) || 3004;

app.use(express.static(path.resolve(import.meta.dirname, "public")));
app.use("/api/ajopaivakirja", apiAjopaivakirjaRouter);
app.use(virhekasittelija);

app.listen(portti, (): void => {
    console.log(`Palvelin käynnistettiin osoitteeseen http://localhost:${portti}`);
});
```

`import virhekasittelija from './errors/virhekasittelija'` tuo virhekäsittelijäfunktion. Funktio on viety oletusvientinä, joten se tuodaan ilman aaltosulkeita.

`app.use(virhekasittelija)` rekisteröi virhekäsittelijän. Se on sijoitettava kaikkien reittien jälkeen, koska Express käy middlewaret läpi rekisteröintijärjestyksessä. Jos virhekäsittelijä olisi ennen reittejä, se ei saisi virheitä käsiteltäväkseen.

### Vaihe 9: Staattinen etusivu (public/index.html)

Luodaan `public/`-kansio ja sinne `index.html`. `express.static()`-middleware tarjoaa kansion tiedostot automaattisesti HTTP-vastauksina, joten selain saa `index.html`-tiedoston pyytäessään juuriosoitetta `http://localhost:3004`.

### Projektin lopullinen rakenne

```
demo04/
├── index.ts                     # Palvelimen käynnistys ja kokoonpano
├── package.json                 # Projektin metatiedot ja riippuvuudet
├── package-lock.json            # Pakettien tarkat versiot (npm:n hallinnoima)
├── tsconfig.json                # TypeScript-kääntäjän asetukset
├── errors/
│   └── virhekasittelija.ts      # Virhe-luokka ja virhekäsittelijämiddleware
├── models/
│   └── ajot.ts                  # Tietomalli ja muistitietokanta
├── routes/
│   └── apiAjopaivakirja.ts      # REST API -päätepisteet
├── public/
│   └── index.html               # Staattinen etusivu
└── node_modules/                # Asennetut paketit (npm:n hallinnoima, ei versionhallintaan)
```

---

## 3. Virhekäsittelyn tekniikat: muistilista

### `Virhe`-luokka

`Virhe` on mukautettu virheluokka, joka laajentaa JavaScriptin sisäänrakennettua `Error`-luokkaa. Se yhdistää HTTP-tilakoodin ja virheviestin yhteen objektiin.

```typescript
export class Virhe extends Error {
    status: number;
    viesti: string;

    constructor(status?: number, viesti?: string) {
        super(viesti);
        this.status = status || 500;
        this.viesti = viesti || "Palvelimella tapahtui odottamaton virhe";
    }
}
```

| Kenttä | Tyyppi | Käyttötarkoitus |
|--------|--------|-----------------|
| `status` | `number` | HTTP-tilakoodi (esim. 404, 400, 500). Oletusarvo 500. |
| `viesti` | `string` | Asiakkaalle palautettava virheilmoitus. Oletustekstinä on yleinen palvelimen virhe, jos erillistä viestiä ei anneta. |

---

### `virhekasittelija`-middleware

```typescript
const virhekasittelija = (err: Virhe, _req: express.Request, res: express.Response, _next: express.NextFunction): void => {
    res.status(err.status).json({ viesti: err.viesti });
}
```

Express tunnistaa virhekäsittelijän neljän parametrin perusteella. Vaikka `_req` ja `_next` eivät ole funktion sisällä käytössä, ne on oltava mukana. Alaviiva-etuliite `_` ilmaisee TypeScriptille, että parametri on tarkoituksella käyttämätön.

---

### Virheen heittäminen reitissä

```typescript
// 404 Not Found: resurssia ei löydy
throw new Virhe(404, "Ajoa ei löytynyt");

// 400 Bad Request: pyynnön body puuttuu tai on virheellinen
throw new Virhe(400, "Virheellinen pyynnön body");

// 500 Internal Server Error: oletusarvo, jos parametreja ei anneta
throw new Virhe();
```

`throw` lopettaa käsittelijäfunktion suorituksen välittömästi. `return`-lausetta ei tarvita `throw`:n jälkeen.

---

### Virhekäsittelijän rekisteröinti

```typescript
app.use("/api/ajopaivakirja", apiAjopaivakirjaRouter);
app.use(virhekasittelija); // Aina viimeisenä, kaikkien reittien jälkeen
```

Järjestys on tärkeä. Virhekäsittelijä rekisteröidään aina viimeisenä, jotta se voi vastaanottaa kaikista reiteistä heitettyjä virheitä.

---

### Demo 3 vs Demo 4: virhekäsittelyn ero

| Tilanne | Demo 3 | Demo 4 |
|---------|--------|--------|
| Resurssia ei löydy | `return res.status(404).json({ viesti: "..." })` | `throw new Virhe(404, "...")` |
| Virheellinen body | `return res.status(400).json({ viesti: "..." })` | `throw new Virhe(400, "...")` |
| Virheen muotoilu | Jokaisessa reitissä erikseen | Keskitetysti virhekäsittelijässä |
| `return` | Tarvitaan estämään suorituksen jatkuminen | Ei tarvita, `throw` lopettaa suorituksen |

---

### HTTP-tilakoodien muistilista

| Tilakoodi | Milloin käytetään |
|-----------|------------------|
| 200 OK | Pyyntö onnistui. Oletusarvo, kun `res.json()` kutsutaan ilman `status()`-kutsua. |
| 201 Created | POST-pyyntö onnistui ja uusi resurssi luotiin. |
| 400 Bad Request | Pyynnön body puuttuu, on virheellisessä muodossa tai sisältää kelvottomia arvoja. |
| 404 Not Found | Pyydettyä resurssia ei löydy. |
| 500 Internal Server Error | Odottamaton palvelinvirhe. `Virhe`-luokan oletusarvo, jos tilakoodia ei anneta. |

---

## Sovelluksen käynnistys

Jos kloonasit projektin valmiina, asenna riippuvuudet ja käynnistä palvelin:

```bash
npm install
npm run dev
```

Palvelin käynnistyy osoitteeseen `http://localhost:3004`.
