# Demo 3: REST API

Kolmannessa demossa rakennetaan ostoslista, jota käytetään kokonaan toisen ohjelman kautta. Palvelimella on lista ostettavia tuotteita, joita voi hakea, lisätä, muokata ja poistaa HTTP-pyynnöillä. Muutokset tallentuvat levylle, joten lista säilyy myös palvelimen uudelleenkäynnistyksen yli. Demossa pyyntöjä lähetetään Postman-sovelluksella, mutta samalla tavalla niitä voisi lähettää esimerkiksi React-sovellus tai mikä tahansa muu ohjelma, joka lähettää HTTP-pyyntöjä.

Demossa 2 rajapinnasta pystyi vain lukemaan valmiiksi olemassa olevaa käyttäjädataa GET-pyynnöillä. Tässä demossa mukaan tulevat myös tiedon lisääminen (POST), muokkaaminen (PUT) ja poistaminen (DELETE). REST-rajapinnassa resursseihin viitataan osoitteilla, ja niille tehtävä toiminto ilmaistaan HTTP-metodilla. Tällaista rajapintaa kutsutaan REST API:ksi.

## Sisällysluettelo

- [1 Node-projektin alustus ja määritykset](#1-node-projektin-alustus-ja-määritykset)
  - [1.1 package.json ja projektin perustiedot](#11-packagejson-ja-projektin-perustiedot)
  - [1.2 tsconfig.json ja TypeScript-asetukset](#12-tsconfigjson-ja-typescript-asetukset)
- [2 Riippuvuuksien asennus](#2-riippuvuuksien-asennus)
- [3 Express-palvelimen luonti ja käynnistys](#3-express-palvelimen-luonti-ja-käynnistys)
- [4 Staattisten tiedostojen tarjoilu](#4-staattisten-tiedostojen-tarjoilu)
- [5 Ostoslistan malli ja tiedon tallennus](#5-ostoslistan-malli-ja-tiedon-tallennus)
- [6 Reittien rakentaminen](#6-reittien-rakentaminen)
  - [6.1 Router ja JSON-pyyntöjen jäsentäminen](#61-router-ja-json-pyyntöjen-jäsentäminen)
  - [6.2 GET-reitit](#62-get-reitit)
  - [6.3 POST-reitti ja uuden ostoksen lisääminen](#63-post-reitti-ja-uuden-ostoksen-lisääminen)
  - [6.4 PUT-reitti ja ostoksen muokkaaminen](#64-put-reitti-ja-ostoksen-muokkaaminen)
  - [6.5 DELETE-reitti ja ostoksen poistaminen](#65-delete-reitti-ja-ostoksen-poistaminen)
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

Palvelin käynnistyy oletuksena osoitteeseen `http://localhost:3003`.

## 1 Node-projektin alustus ja määritykset

Projektin juuresta löytyvät samat määritystiedostot kuin demoissa 1 ja 2, eli `package.json`, `tsconfig.json` ja `.nvmrc`. Sisältö on lähes identtinen aiempiin demoihin verrattuna, joten tässä käydään läpi vain oleellisimmat kohdat. Tiedostot on käyty tarkemmin läpi [demo 1:n README:ssä](../demo-01/README.md#1-node-projektin-alustus-ja-määritykset). Myös `.nvmrc` on samanlainen, ja se lukitsee projektin Node-version 24:ään `nvm use` -komennolla.

> [!TIP]
> Myös tämä demo on versiolukittu Node 24 -versioon ja `package.json`:ssa (sekä `package-lock.json`:ssa) määriteltyihin riippuvuusversioihin, samoin kuin demot 1 ja 2.

### 1.1 package.json ja projektin perustiedot

```json
{
  "name": "demo-03",
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

- `"main"`-kenttä määrittää sovelluksen käynnistystiedostoksi `index.ts`.
- `"type": "module"` määrittää, että projektin tiedostot tulkitaan ES-moduuleina (`import`/`export`).
- `"engines": { "node": "^24.0.0" }` määrittää projektin vaatiman Node-version.
- `"scripts"`-kohdan `dev` käynnistää kehityspalvelimen, ja `typecheck` tarkistaa koodin tyypit ilman että mitään käännetään levylle.

### 1.2 tsconfig.json ja TypeScript-asetukset

Tämän demon koodin kannalta oleellisia asetuksia on kaksi:

- `"strict": true` kytkee päälle TypeScriptin tiukimmat tyyppitarkistukset, muun muassa sen, että `undefined`-arvot pitää huomioida tyypeissä erikseen.
- `"verbatimModuleSyntax": true` vaatii merkitsemään pelkkää tyypitystä varten tuodut asiat `type`-avainsanalla, kuten luvun [3](#3-express-palvelimen-luonti-ja-käynnistys) tuontiriveillä näkyy.

## 2 Riippuvuuksien asennus

Riippuvuudet asennetaan komennolla

```bash
npm ci
```

`npm ci` asentaa täsmälleen ne versiot, jotka on kirjattu `package-lock.json`-tiedostoon, joten kaikilla kurssilaisilla on käytössä samat riippuvuudet. Komentojen `npm ci` ja `npm install` ero on selitetty tarkemmin [demo 1:n luvussa 2.1](../demo-01/README.md#21-npm-ci-vs-npm-install).

Paketit ovat samat kuin demoissa 1 ja 2:

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

Jokaisen paketin käyttötarkoitus on käyty läpi [demo 1:n luvussa 2.2](../demo-01/README.md#22-projektin-riippuvuudet). Tässä demossa `@types/node`-paketista tarvitaan myös `fs`-moduulin tyypit, koska ostoslista tallennetaan tiedostoon luvussa [5](#5-ostoslistan-malli-ja-tiedon-tallennus).

## 3 Express-palvelimen luonti ja käynnistys

Määritykset ovat nyt kunnossa, joten seuraavaksi kirjoitetaan itse palvelin. Palvelin määritellään ja käynnistetään `index.ts`-tiedostossa.

```ts
import express, { type Application, type Request, type Response} from 'express';
import path from 'path';
import apiOstoksetRouter from './routes/apiOstokset';

const app: Application = express();

const port: number = Number(process.env.PORT) || 3003;

app.use(express.static(path.join(import.meta.dirname, "public")));

app.use("/api/ostokset", apiOstoksetRouter);

app.listen(port, () => {
    console.log(`Palvelin käynnistettiin osoitteeseen: http://localhost:${port}`);
});
```

Nämä toimivat samalla tavalla kuin demoissa 1 ja 2 (ks. [demo 1, luku 3](../demo-01/README.md#3-express-palvelimen-luonti-ja-käynnistys)):

- Express-sovelluksen luonti
- porttinumeron määritys `Number(process.env.PORT) || 3003`
- palvelimen käynnistäminen `app.listen`-metodilla

Erona aiempiin demoihin on porttinumero, joka on tässä demossa 3003.

Uutta on kolmas tuontirivi ja sitä seuraava `app.use("/api/ostokset", apiOstoksetRouter)` -kutsu. Aiemmissa demoissa kaikki reitit kirjoitettiin suoraan `index.ts`-tiedostoon `app.get(...)`-kutsuina. Tässä demossa reitit on koottu omaan tiedostoonsa [`routes/apiOstokset.ts`](./routes/apiOstokset.ts) `Router`-oliona, joka tuodaan `index.ts`:ään ja liitetään sovellukseen etuliitteellä `/api/ostokset`. Tähän palataan tarkemmin luvussa [6](#6-reittien-rakentaminen).

## 4 Staattisten tiedostojen tarjoilu

Palvelin on nyt pystyssä, ja seuraavaksi sille annetaan tarjoiltavaksi `public`-kansion sisältö. Luvun 3 koodissa näkyvä rivi `app.use(express.static(path.join(import.meta.dirname, "public")))` ja sen taustalla oleva `import.meta.dirname`-ratkaisu ovat identtiset aiempiin demoihin verrattuna ([demo 1, luku 4](../demo-01/README.md#4-staattisten-tiedostojen-tarjoilu)).

`public`-kansiossa on pelkkä [`index.html`](./public/index.html). Sivulla kuvaillaan sanallisesti, mitä rajapinta tekee ja miten sitä testataan Postmanilla.

```html
<p class="pt-3">Tämä on demo REST API -palvelinsovelluksesta, jonka tarkoituksena on keskustella
    toisen sovelluksen kanssa json-muodossa. REST API on rajapinta, joka mahdollistaa palvelimella sijaitsevien tietojen
    lukemisen, lisäämisen, muokkaamisen ja poiston asiakassovelluksella.</p>

<p>Testaa demon toiminnallisuutta Postman-sovelluksella. Luo Postman-sovelluksella GET-, POST-, PUT- ja DELETE-pyyntöjä
    url-osoitteeseen <i>http://localhost:3003/api/ostokset</i> testataksesi REST API:n toimintaa. </p>
```

## 5 Ostoslistan malli ja tiedon tallennus

Demossa 2 käyttäjädata eriytettiin omaan tiedostoonsa `models/kayttajat.ts` pelkkänä taulukkona ja rajapintana. Tässä demossa data eriytetään samalla periaatteella omaan tiedostoonsa [`models/ostoslista.ts`](./models/ostoslista.ts). Dataa pitää tässä demossa myös muuttaa ja tallentaa pysyvästi, joten taulukon ja rajapinnan rinnalle tarvitaan luokka. Luokka kokoaa datan ja siihen liittyvät toiminnot yhteen.

```ts
export interface Ostos {
    id: number;
    tuote: string;
    poimittu: boolean;
}
```

`Ostos`-rajapinta määrittää, millainen rakenne yhdellä ostoslistan tuotteella on, samaan tapaan kuin demon 2 `Kayttaja`-rajapinta. `poimittu` ilmaisee, onko tuote merkitty poimituksi listalta.

```ts
class Ostoslista {

    private ostokset: Ostos[] = [];
    private tiedosto: string[] = [import.meta.dirname, "ostokset.json"];

    constructor() {
        readFile(path.join(...this.tiedosto), "utf8")
            .then((data: string) => {
                this.ostokset = JSON.parse(data);
            })
            .catch((e: any) => {
                throw e;
            });
    }
    // ...
}
```

Luokka pitää ostosten listan muistissa `private ostokset: Ostos[]` -taulukossa. `private`-määre estää taulukkoon pääsyn luokan ulkopuolelta suoraan, eli muut tiedostot voivat muokata listaa vain luokan tarjoamien julkisten metodien kautta. Konstruktorissa luetaan tiedosto [`ostokset.json`](./models/ostokset.json) ja tallennetaan sen sisältö taulukkoon.

> [!NOTE]
> Konstruktori ei voi olla `async`-funktio, joten tiedoston lukeminen käynnistetään konstruktorissa `.then()`-ketjulla. Lista on käytettävissä heti, kun lukeminen on valmistunut.

Luokan metodit on kirjoitettu nuolifunktioina luokan ominaisuuksiksi, esimerkiksi `public haeKaikki = (): Ostos[] => {...}`. Nuolifunktiossa `this` viittaa aina siihen olioon, jossa metodi on määritelty, myös silloin kun metodi välitetään eteenpäin callback-funktiona.

```ts
public lisaa = async (uusiOstos: Ostos): Promise<void> => {
    try {
        const edellinenId = this.ostokset.length > 0
            ? Math.max(...this.ostokset.map((ostos) => ostos.id))
            : 0;

        this.ostokset = [
            ...this.ostokset,
            {
                id: edellinenId + 1,
                tuote: uusiOstos.tuote,
                poimittu: uusiOstos.poimittu
            }
        ];

        await this.tallenna();
    } catch (e: any) {
        throw e;
    }
}
```

Uuden id:n arvo lasketaan hakemalla nykyisen listan suurin id (`Math.max`) ja kasvattamalla sitä yhdellä. Jos lista on tyhjä, lähtöarvona käytetään nollaa. Listan päivitys tehdään hajotusoperaattorilla (`...this.ostokset`), eli vanhan sisällön ja uuden alkion pohjalta muodostetaan kokonaan uusi taulukko. Sama periaate on tullut tutuksi Reactin `useState`-päivityksissä aiemmilla kursseilla.

`muokkaa`- ja `poista`-metodit toimivat samalla periaatteella. `poista` suodattaa (`filter`) listalta pois ostoksen, jonka id täsmää annettuun. `muokkaa` suodattaa vanhan version pois ja lisää tilalle päivitetyn, minkä jälkeen lista järjestetään id:n mukaan (`sort`).

```ts
private tallenna = async (): Promise<void> => {
    try {
        await writeFile(path.resolve(...this.tiedosto), JSON.stringify(this.ostokset, null, 2), "utf8");
    } catch (e: any) {
        throw e;
    }
}
```

Kaikki muokkaavat metodit (`lisaa`, `muokkaa`, `poista`) kutsuvat lopuksi `tallenna`-metodia, joka kirjoittaa koko listan takaisin `ostokset.json`-tiedostoon `JSON.stringify`-funktiolla. Funktion kolmas argumentti (`2`) muotoilee JSON-tiedoston sisennettynä, jotta tiedosto pysyy helppolukuisena. `tallenna` on `private`, koska tallennus on luokan sisäinen toteutustapa ja sitä kutsutaan vain luokan omista metodeista.

Kaikissa metodeissa virheet otetaan kiinni `catch (e: any)` -lohkolla ja heitetään sellaisenaan uudelleen `throw e`-kutsulla. Reitin `async`-käsittelijä päästää virheen Expressille asti, ja Express palauttaa asiakkaalle 500-vastauksen (ks. luku [6.3](#63-post-reitti-ja-uuden-ostoksen-lisääminen)).

## 6 Reittien rakentaminen

Ostoslista ja sen toiminnot ovat nyt valmiina, joten seuraavaksi ne avataan rajapinnaksi HTTP-pyynnöille. Reitit kirjoitetaan tiedostoon [`routes/apiOstokset.ts`](./routes/apiOstokset.ts), ja niitä tulee kaikkiaan viisi.

| Metodi | Osoite | Toiminto |
|---|---|---|
| GET | `/api/ostokset` | Hae kaikki ostokset |
| GET | `/api/ostokset/:id` | Hae yksi ostos id:n perusteella |
| POST | `/api/ostokset` | Lisää uusi ostos |
| PUT | `/api/ostokset/:id` | Muokkaa olemassa olevaa ostosta |
| DELETE | `/api/ostokset/:id` | Poista ostos |

### 6.1 Router ja JSON-pyyntöjen jäsentäminen

```ts
import express, { type Request, type Response, type Router } from 'express';
import Ostoslista, { type Ostos } from '../models/ostoslista';

const ostoslista: Ostoslista = new Ostoslista();

const apiOstoksetRouter: Router = express.Router();

apiOstoksetRouter.use(express.json());
```

Demoissa 1 ja 2 reitit kirjoitettiin suoraan pääsovelluksen (`app`) metodeina. Tässä demossa reitit on koottu yhteen `express.Router()`-oliolla, joka toimii itsenäisenä, pienempänä reitistönä. Reitistö liitetään pääsovellukseen `index.ts`:ssä kutsulla `app.use("/api/ostokset", apiOstoksetRouter)` (ks. luku [3](#3-express-palvelimen-luonti-ja-käynnistys)). Sen ansiosta tässä tiedostossa määritelty reitti `"/"` vastaa osoitetta `/api/ostokset` ja reitti `"/:id"` osoitetta `/api/ostokset/:id`. Reittien eriyttäminen omaan tiedostoonsa pitää `index.ts`:n siistinä, ja useamman resurssin reitit pysyvät erillään toisistaan, jos sovellusta laajennetaan myöhemmin.

`apiOstoksetRouter.use(express.json())` on middleware, joka jäsentää saapuvan pyynnön JSON-muotoisen sisällön `req.body`-olioon. Demoissa 1 ja 2 tätä middlewarea ei tarvittu, koska kaikki pyynnöt olivat GET-pyyntöjä ilman omaa sisältöä. Tässä demossa POST- ja PUT-reitit vastaanottavat dataa pyynnön mukana, joten middleware on välttämätön. Se on liitetty vain tähän reitistöön, koska staattisten tiedostojen tarjoiluun sitä ei tarvita.

### 6.2 GET-reitit

```ts
apiOstoksetRouter.get("/", (req: Request, res: Response) => {
    res.json(ostoslista.haeKaikki());
});

apiOstoksetRouter.get("/:id", (req: Request, res: Response) => {
    res.json(ostoslista.haeYksi(Number(req.params.id)));
});
```

Molemmat GET-reitit vastaavat `res.json()`-metodilla samaan tapaan kuin demossa 2. Jälkimmäisessä reitissä `:id` on reittiparametri, jonka arvo luetaan `req.params.id`:sta ja muunnetaan numeroksi `Number()`-funktiolla, samaan tapaan kuin [demon 2 `/yhteystiedot/:id`-reitissä](../demo-02/README.md#63-get-yhteystiedotid-ja-reittiparametrit). Ero demoon 2 on se, että id:n perusteella tehty haku (`haeYksi`) on kirjoitettu `Ostoslista`-luokan sisään.

### 6.3 POST-reitti ja uuden ostoksen lisääminen

```ts
apiOstoksetRouter.post("/", async (req: Request, res: Response) => {

    let uusiOstos: Ostos = {
        id: 0,
        tuote: req.body.tuote,
        poimittu: req.body.poimittu
    }

    await ostoslista.lisaa(uusiOstos);

    res.json(ostoslista.haeKaikki());

});
```

POST-metodi on tarkoitettu uuden resurssin luomiseen. Reitti muodostaa uuden `Ostos`-olion `req.body`:sta, eli `express.json()`-middlewaren jäsentämästä pyynnön bodysta. `id`-kenttään kirjoitetaan väliaikaisesti 0, koska todellinen id lasketaan vasta `ostoslista.lisaa`-metodin sisällä (ks. luku [5](#5-ostoslistan-malli-ja-tiedon-tallennus)). Asiakassovelluksen lähettämään id-arvoon ei siis luoteta. Reitti palauttaa vastauksena koko päivitetyn listan (`ostoslista.haeKaikki()`).

> [!WARNING]
> Kaikki reitit, joissa kutsutaan `Ostoslista`-luokan muokkaavia metodeja (`lisaa`, `muokkaa`, `poista`), on kirjoitettu `async`-funktioina. Luokan metodit voivat epäonnistuessaan heittää virheen eteenpäin. Reitit on silti kirjoitettu ilman `try`/`catch`-lohkoa ja ilman `next(err)`-kutsua. Express 4:ssä tämä jättäisi pyynnön roikkumaan ilman vastausta. **Express 5:ssä** async-reittikäsittelijän palauttama hylätty Promise otetaan automaattisesti kiinni ja välitetään Expressin sisäiselle virheenkäsittelijälle, joka palauttaa asiakkaalle 500-virhevastauksen. Suuri osa verkosta löytyvistä Express-ohjeista on kirjoitettu Express 4:lle, jossa nämä reitit vaatisivat oman virheenkäsittelynsä.

### 6.4 PUT-reitti ja ostoksen muokkaaminen

```ts
apiOstoksetRouter.put("/:id", async (req: Request, res: Response) => {

    let muokattuOstos: Ostos = {
        id: Number(req.params.id),
        tuote: req.body.tuote,
        poimittu: req.body.poimittu
    }

    await ostoslista.muokkaa(muokattuOstos);

    res.json(ostoslista.haeKaikki());

});
```

PUT-metodi on tarkoitettu olemassa olevan resurssin korvaamiseen uudella sisällöllä. Reitti yhdistää molemmat aiemmin nähdyt tavat lukea tietoa pyynnöstä. Kohde valitaan osoitteen reittiparametrilla (`req.params.id`), ja uusi sisältö luetaan pyynnön bodysta (`req.body`). Ostoksen `id`-kenttä asetetaan suoraan reittiparametrista (`Number(req.params.id)`), joten päivityksen kohde määräytyy aina osoitteesta. `ostoslista.muokkaa`-metodi ottaa tämän ansiosta vastaan pelkän valmiin `Ostos`-olion (ks. luku [5](#5-ostoslistan-malli-ja-tiedon-tallennus)).

### 6.5 DELETE-reitti ja ostoksen poistaminen

```ts
apiOstoksetRouter.delete("/:id", async (req: Request, res: Response) => {

    await ostoslista.poista(Number(req.params.id));

    res.json(ostoslista.haeKaikki());

});
```

DELETE-metodi on tarkoitettu resurssin poistamiseen. Reitti on rakenteeltaan yksinkertaisin kaikista, koska se tarvitsee vain osoitteen reittiparametrin. Sen perusteella `Ostoslista`-luokan `poista`-metodi suodattaa tuotteen pois listalta.

## 7 Palvelimen käynnistäminen ja reittien testaaminen

Kun palvelin on käynnistetty yllä kuvatulla tavalla, samaan tapaan kuin demoissa 1 ja 2, terminaaliin tulostuu palvelimen oma lokiviesti:

```
Palvelin käynnistettiin osoitteeseen: http://localhost:3003
```

Demossa 2 GET-pyyntöjä pystyi testaamaan myös suoraan selaimen osoiterivillä, koska osoiteriviltä lähtee aina GET-pyyntö. POST-, PUT- ja DELETE-pyyntöjen testaamiseen tarvitaan [Postmanin](https://www.postman.com/) kaltainen työkalu, jolla voi muodostaa muitakin HTTP-pyyntöjä ja lähettää niiden mukana dataa.

GET-pyyntö tehdään Postmanissa samaan tapaan kuin demossa 2:

```
GET http://localhost:3003/api/ostokset
```

POST- ja PUT-pyynnöissä lähetettävä data kirjoitetaan Postmanissa pyynnön Body-välilehdelle:

- avaa pyynnön Body-välilehti
- valitse raw ja sen viereisestä pudotusvalikosta JSON
- kirjoita data kenttään JSON-muodossa

```
POST http://localhost:3003/api/ostokset
Body (raw, JSON): {"tuote": "Kahvia", "poimittu": false}

PUT http://localhost:3003/api/ostokset/1
Body (raw, JSON): {"tuote": "Kaurajuomaa", "poimittu": true}

DELETE http://localhost:3003/api/ostokset/1
```

> [!TIP]
> Kun Body-välilehdellä valitsee raw + JSON, Postman asettaa pyynnön `Content-Type: application/json` -otsikon automaattisesti. Otsikko on välttämätön, jotta `apiOstoksetRouter.use(express.json())` -middleware jäsentää pyynnön bodyn `req.body`-olioon.

Jokainen listaa muuttava pyyntö tallentaa muutoksen myös levylle [`ostokset.json`](./models/ostokset.json)-tiedostoon, joten muutokset säilyvät palvelimen uudelleenkäynnistyksen yli. Demoissa 1 ja 2 data oli pelkästään muistissa.

Koska `tsx watch` seuraa tiedostomuutoksia, koodiin tehdyt muutokset näkyvät palvelimen vastauksissa heti tallennuksen jälkeen ilman, että palvelinta tarvitsee itse käynnistää uudelleen. Palvelimen voi sammuttaa painamalla `Ctrl+C` samassa terminaalissa.

Koodin tyypit voi tarkistaa myös erikseen, ilman palvelimen käynnistämistä, komennolla

```bash
npm run typecheck
```

## 8 Lopuksi

Demossa laajennettiin demon 2 lukurajapinta täydeksi REST-rajapinnaksi, jossa dataa voi myös lisätä, muokata ja poistaa. Läpikäytyjä asioita:

- datan ja sen käsittelyn kokoaminen `Ostoslista`-luokaksi
- tiedon pysyvä tallentaminen `ostokset.json`-tiedostoon
- reittien eriyttäminen omaan `Router`-tiedostoonsa
- POST-, PUT- ja DELETE-reittien rakentaminen ja pyynnön bodyn lukeminen
- Express 5:n automaattinen async-virheiden välitys

Myöhemmissä demoissa tietoa tallennetaan järeämmin kuin tekstitiedostoon, mutta samat REST-periaatteet ja Expressin reititystapa pätevät silloinkin.
