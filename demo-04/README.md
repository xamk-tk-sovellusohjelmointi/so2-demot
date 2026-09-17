# Demo 4: REST API:n virheenkäsittely

Demossa 3 rakennettu ostoslistan rajapinta osasi jo hakea, lisätä, muokata ja poistaa ostoksia, mutta se luotti siihen, että asiakassovellus lähettää aina järkevän pyynnön. Jos joku kutsuisi PUT-reittiä tuotenimen kanssa, joka on tyhjä merkkijono, tai pyytäisi poistamaan ostoksen, jota ei ole olemassa, palvelin olisi joko vastannut harhaanjohtavasti onnistuneesti tai kaatunut kokonaan. Neljännessä demossa samaan rajapintaan lisätään kunnollinen virheenkäsittely, jossa pyynnöt validoidaan ennen kuin niitä yritetään tallentaa ostokset.json-tiedostoon, ja virhetilanteista muodostetaan asiakassovellukselle selkeä, yhdenmukainen virhevastaus oikealla HTTP-tilakoodilla.

Demo hyödyntää suoraan sitä Express 5:n ominaisuutta, joka nostettiin esiin [demo 3:n varoituksessa](../demo-03/README.md#63-post-reitti-ja-uuden-ostoksen-lisääminen). Async-reittikäsittelijän sisällä heitetty virhe välittyy automaattisesti Expressin virheenkäsittelymiddlewarelle, eikä sitä tarvitse itse ottaa kiinni `try`/`catch`-lohkolla joka reitissä erikseen.

## Sisällysluettelo

- [1 Node-projektin alustus ja määritykset](#1-node-projektin-alustus-ja-määritykset)
  - [1.1 package.json ja projektin perustiedot](#11-packagejson-ja-projektin-perustiedot)
  - [1.2 tsconfig.json ja TypeScript-asetukset](#12-tsconfigjson-ja-typescript-asetukset)
- [2 Riippuvuuksien asennus](#2-riippuvuuksien-asennus)
  - [2.1 npm ci vs. npm install](#21-npm-ci-vs-npm-install)
  - [2.2 Projektin riippuvuudet](#22-projektin-riippuvuudet)
- [3 Express-palvelimen luonti ja käynnistys](#3-express-palvelimen-luonti-ja-käynnistys)
- [4 Staattisten tiedostojen tarjoilu](#4-staattisten-tiedostojen-tarjoilu)
- [5 Ostoslistan malli ja tiedon tallennus](#5-ostoslistan-malli-ja-tiedon-tallennus)
- [6 Virheenkäsittelyn perusta](#6-virheenkäsittelyn-perusta)
  - [6.1 Virhe-luokka](#61-virhe-luokka)
  - [6.2 Virhekäsittelijä-middleware](#62-virhekäsittelijä-middleware)
  - [6.3 Tuntemattomat reitit ja middlewarejen järjestys](#63-tuntemattomat-reitit-ja-middlewarejen-järjestys)
- [7 Reittien rakentaminen ja pyyntöjen validointi](#7-reittien-rakentaminen-ja-pyyntöjen-validointi)
  - [7.1 Olemassaolon tarkistus ennen muokkausta ja poistoa](#71-olemassaolon-tarkistus-ennen-muokkausta-ja-poistoa)
  - [7.2 Pyynnön rungon validointi](#72-pyynnön-rungon-validointi)
- [8 Palvelimen käynnistäminen ja reittien testaaminen](#8-palvelimen-käynnistäminen-ja-reittien-testaaminen)
- [9 Lopuksi](#9-lopuksi)

**Projektin asentaminen ja käynnistäminen**

Kun olet kloonannut demon omalle koneellesi, siirry VS Coden Terminalissa demon kansioon ja asenna riippuvuudet komennolla

```bash
npm ci
```

ja käynnistä palvelin kehitystilassa komennolla

```bash
npm run dev
```

Palvelin käynnistyy oletuksena osoitteeseen `http://localhost:3004`.

## 1 Node-projektin alustus ja määritykset

Projektin juuresta löytyvät samat määritystiedostot kuin edellisissä demoissa: `package.json`, `tsconfig.json` ja `.nvmrc`. Sisältö ja tarkoitus ovat identtiset, joten tässä kerrataan vain lyhyesti. Rivi riviltä -selitys löytyy [demo 1:n README:stä](../demo-01/README.md#1-node-projektin-alustus-ja-määritykset).

### 1.1 package.json ja projektin perustiedot

```json
{
  "name": "demo-04",
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

Rakenne on sama kuin edellisissä demoissa: `"type": "module"` määrittää projektin käyttävän ES-moduulisyntaksia, `"engines"` dokumentoi vaaditun Node-version, ja `"scripts"`-kohdan `dev`- ja `typecheck`-komennot käynnistävät kehityspalvelimen ja tarkistavat tyypit.

Projektista löytyy myös tiedosto `.nvmrc`, jonka sisältönä on pelkkä numero `24`. Tiedosto ohjaa Node Version Manageria (nvm) käyttämään projektissa Node-versiota 24, kun komento `nvm use` suoritetaan projektin juuressa.

> [!TIP]
> Myös tämä demo on versiolukittu Node 24 -versioon ja `package.json`:ssa (sekä `package-lock.json`:ssa) määriteltyihin riippuvuusversioihin, samoin kuin aiemmat demot.

### 1.2 tsconfig.json ja TypeScript-asetukset

`tsconfig.json` on sisällöltään sama kuin edellisissä demoissa. Kertauksena kaksi asetusta. `"strict": true` kytkee päälle TypeScriptin tiukimmat tyyppitarkistukset. Lisäksi `"verbatimModuleSyntax": true` vaatii merkitsemään pelkkää tyypitystä varten tuodut asiat `type`-avainsanalla, kuten `index.ts`:n tuontirivillä nähdään luvussa [3](#3-express-palvelimen-luonti-ja-käynnistys).

## 2 Riippuvuuksien asennus

### 2.1 npm ci vs. npm install

Riippuvuudet asennetaan komennolla

```bash
npm ci
```

`npm ci` poistaa ensin olemassa olevan `node_modules`-kansion kokonaan ja asentaa sitten täsmälleen ne versiot, jotka on kirjattu `package-lock.json`-tiedostoon, koskematta lock-tiedostoon. `npm install` sen sijaan lukee `package.json`:n ja voi samalla päivittää `package-lock.json`-tiedostoa, jos riippuvuuksista löytyy `package.json`:n salliman versiovälin sisällä uudempia versioita. Tämä takaa, että jokainen kurssilainen ajaa koodia täsmälleen samoilla riippuvuusversioilla, eivätkä mahdolliset versioerot aiheuta yllättäviä virheitä.

### 2.2 Projektin riippuvuudet

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

Riippuvuudet ovat samat kuin aiemmissa demoissa: `express` palvelinkehyksenä, `@types/express` ja `@types/node` sen ja Node:n tyyppimäärittelyinä, `tsx` TypeScript-tiedostojen ajamiseen ilman erillistä käännösvaihetta, ja `typescript` tyyppitarkistuksiin `typecheck`-skriptissä. Koko virheenkäsittely rakennetaan Expressin omien ominaisuuksien päälle, eikä tähän demoon ole tuotu mitään uutta pakettia sitä varten.

## 3 Express-palvelimen luonti ja käynnistys

```ts
import express, { type Application, type NextFunction, type Request, type Response} from 'express';
import path from 'path';
import apiOstoksetRouter from './routes/apiOstokset';
import virhekasittelija, { Virhe } from './errors/virhekasittelija';

const app: Application = express();

const port: number = Number(process.env.PORT) || 3004;

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

Express-sovelluksen luonti, portin laskeminen ja palvelimen käynnistys `app.listen`-metodilla toimivat täsmälleen kuten aiemmissa demoissa, ks. [demo 1:n luku 3](../demo-01/README.md#3-express-palvelimen-luonti-ja-käynnistys). Staattisten tiedostojen tarjoilu ja `apiOstoksetRouter`:n liittäminen ovat myös samat kuin demossa 3.

Uutta ovat tiedoston loppuun lisätyt kaksi `app.use()`-kutsua. Ensimmäinen rekisteröi middlewaren, joka suoritetaan aina, kun mikään aiemmin määritelty reitti ei ole vastannut pyyntöön, ja toinen rekisteröi itse virheenkäsittelijän. Molemmat liittyvät suoraan demon aiheeseen, ja niitä käsitellään kokonaisuudessaan luvussa [6](#6-virheenkäsittelyn-perusta), sen jälkeen kun luvussa [5](#5-ostoslistan-malli-ja-tiedon-tallennus) on ensin kerrattu ostoslistan malli.

> [!NOTE]
> Middlewarejen rekisteröintijärjestyksellä on väliä, koska Express käy `app.use()`- ja reittikutsut läpi siinä järjestyksessä kuin ne on kirjoitettu koodiin. Tämän takia tuntemattomien reittien käsittelijä ja varsinainen virheenkäsittelijä on kirjoitettu viimeisenä, vasta staattisten tiedostojen ja API-reittien jälkeen.

## 4 Staattisten tiedostojen tarjoilu

```ts
app.use(express.static(path.join(import.meta.dirname, "public")));
```

Rivi on identtinen aiempiin demoihin verrattuna, ks. [demo 1:n selitys](../demo-01/README.md#4-staattisten-tiedostojen-tarjoilu). `public`-kansion [`index.html`](./public/index.html) kuvailee demon 3 tapaan sanallisesti rajapinnan käytön, mutta kannustaa tällä kertaa myös kokeilemaan tahallisesti virheellisiä pyyntöjä:

```html
<p>Testaa demon toiminnallisuutta Postman-sovelluksella. Luo Postman-sovelluksella erilaisia GET-, POST-, PUT-
    ja DELETE-pyyntöjä url-osoitteeseen <i>http://localhost:3004/api/ostokset</i>. Kokeile tahallisesti käyttää virheellisiä
    tietoja syötteinä, virhellisiä reittejä jne.</p>
```

## 5 Ostoslistan malli ja tiedon tallennus

[`models/ostoslista.ts`](./models/ostoslista.ts) on rakenteeltaan täysin identtinen demoon 3 verrattuna: sama `Ostos`-rajapinta, samat julkiset ja yksityiset nuolifunktiometodit, sama tapa tallentaa lista `tallenna`-metodilla `ostokset.json`-tiedostoon, ja sama tapa heittää virheet sellaisenaan (`throw e`) ilman että niitä käärittäisiin uuteen `Error`-olioon. Rakenteen kokonaisselitys, mukaan lukien perustelu sille, miksi metodit on kirjoitettu nuolifunktioina ja miksi virheet heitetään sellaisenaan, löytyy [demo 3:n luvusta 5](../demo-03/README.md#5-ostoslistan-malli-ja-tiedon-tallennus).

## 6 Virheenkäsittelyn perusta

### 6.1 Virhe-luokka

Virheiden käsittelyn ydin on omassa tiedostossaan [`errors/virhekasittelija.ts`](./errors/virhekasittelija.ts):

```ts
export class Virhe extends Error {
    status: number
    viesti: string
    constructor(status: number = 500, viesti: string = "Palvelimella tapahtui odottamaton virhe") {
        super(viesti);
        this.status = status;
        this.viesti = viesti;
    }
}
```

`Virhe` on oma luokka, joka laajentaa (`extends`) JavaScriptin sisäänrakennettua `Error`-luokkaa. Tämä on tavallinen tapa mallintaa sovelluskohtaisia virhetilanteita. `Virhe`-olio on edelleen kelvollinen `Error`, joten sen voi heittää (`throw`) ja se toimii kaikkialla, missä tavallinenkin `Error` toimisi, mutta siihen voi lisätä sovelluksen kannalta oleellista tietoa, tässä tapauksessa HTTP-tilakoodin (`status`).

Konstruktorin molemmilla parametreilla on oletusarvo (`status: number = 500`, `viesti: string = "..."`), joten `Virhe`-olion voi luoda myös antamatta parametreja ollenkaan (`new Virhe()`), jolloin syntyy yleinen 500-virhe. `super(viesti)`-kutsu välittää viestin `Error`-emoluokan konstruktorille, joka tallentaa sen `message`-kenttään. `this.viesti = viesti` tallentaa saman tekstin lisäksi omaan `viesti`-kenttään, jota virhekäsittelijä (luku [6.2](#62-virhekäsittelijä-middleware)) lukee suoraan `message`-kentän sijaan.

Reiteissä (luku [7](#7-reittien-rakentaminen-ja-pyyntöjen-validointi)) virhe luodaan ja heitetään yhdellä rivillä, esimerkiksi:

```ts
throw new Virhe(404, "Ostosta ei löytynyt");
```

### 6.2 Virhekäsittelijä-middleware

```ts
import { type ErrorRequestHandler } from 'express';

const virhekasittelija: ErrorRequestHandler = (err, req, res, next) => {

    if (err instanceof Virhe) {
        res.status(err.status).json({ virhe: err.viesti });
    } else {
        console.log(err);
        res.status(500).json({ virhe: "Palvelimella tapahtui odottamaton virhe" });
    }
}

export default virhekasittelija;
```

`virhekasittelija` on tyypitetty Expressin omalla `ErrorRequestHandler`-tyypillä, joka poikkeaa tavallisen middlewaren ja reittikäsittelijän tyypeistä juuri parametrien määrän osalta, sillä funktiolla on neljä parametria (`err`, `req`, `res`, `next`) tavallisen kolmen (`req`, `res`, `next`) sijaan.

> [!WARNING]
> Express päättelee, onko rekisteröity funktio tavallinen middleware vai virheenkäsittelijä, funktion parametrien lukumäärän perusteella. Neljän parametrin funktio (`err, req, res, next`) käsitellään virheenkäsittelijänä, joka suoritetaan vain, kun joku aiemmista middlewareista tai reiteistä kutsuu `next(virhe)`-kutsua tai heittää virheen. Jos funktioon kirjoittaisi vahingossa vain kolme parametria, Express tulkitsisi sen tavalliseksi middlewareksi, eikä se koskaan saisi virheitä käsiteltäväkseen.

Funktion sisällä tarkistetaan `err instanceof Virhe`. `instanceof`-tarkistuksen jälkeen `err`-parametrin tyyppi on tarkentunut, joten if-lohkon sisällä `err`:llä on käytettävissä `Virhe`-luokan kentät `status` ja `viesti`, ja käsittelijä voi muodostaa vastauksen niiden perusteella suoraan asiakassovellukselle. Jos ehto on epätosi, kyseessä on jokin muu, tunnistamaton virhe, esimerkiksi ohjelmointivirhe tai tiedostojärjestelmän odottamaton poikkeus. Tällaisessa tapauksessa virhe kirjoitetaan palvelimen omaan lokiin (`console.log(err)`) jatkokehitystä varten, mutta asiakassovellukselle palautetaan aina sama yleisluontoinen viesti ja tilakoodi 500.

> [!WARNING]
> Tunnistamattoman virheen yksityiskohtia (esim. virheviestiä tai pinojälkeä) ei koskaan palauteta suoraan asiakassovellukselle. Sisäiset virheviestit voivat paljastaa tietoa palvelimen toteutuksesta, tiedostopoluista tai muista yksityiskohdista, joita ulkopuolisen ei tarvitse tietää. Tämän takia vastauksessa käytetään aina samaa, ennalta kirjoitettua viestiä.

### 6.3 Tuntemattomat reitit ja middlewarejen järjestys

`index.ts`:n loppuun kirjoitetut kaksi `app.use()`-kutsua liittävät virheenkäsittelyn osaksi pyynnön käsittelyketjua:

```ts
app.use((req: Request, res: Response, next: NextFunction) => {
    next(new Virhe(404, "Virheellinen reitti"))
});

app.use(virhekasittelija);
```

Ensimmäinen middleware suoritetaan aina, kun pyyntö on edennyt tähän asti, eli kun `express.static` ei löytänyt vastaavaa tiedostoa ja `apiOstoksetRouter` ei löytänyt vastaavaa reittiä. Käytännössä tämä tarkoittaa mitä tahansa osoitetta, jota sovelluksessa ei ole olemassa. Middleware muodostaa uuden `Virhe(404, "Virheellinen reitti")` -olion ja välittää sen eteenpäin `next(virhe)`-kutsulla. `next()`-funktiolle annettu argumentti on erikoistapaus. Kun `next()`-funktiota kutsutaan argumentin kanssa, Express ohittaa kaikki jäljellä olevat tavalliset middlewaret ja siirtyy suoraan seuraavaan virheenkäsittelijään, tässä tapauksessa `virhekasittelijä`än.

Molemmat middlewaret on rekisteröity vasta `apiOstoksetRouter`:n jälkeen, koska Express käy middlewaret ja reitit läpi rekisteröintijärjestyksessä. Jos tuntemattomien reittien käsittelijä olisi rekisteröity ennen `apiOstoksetRouter`:ia, se veisi jokaisen pyynnön, eikä mikään pyyntö koskaan edes yrittäisi täsmätä varsinaisiin API-reitteihin.

## 7 Reittien rakentaminen ja pyyntöjen validointi

[`routes/apiOstokset.ts`](./routes/apiOstokset.ts) sisältää samat viisi reittiä kuin demossa 3 (GET kaikille ja yhdelle ostokselle, POST, PUT, DELETE), samalla `Router`-rakenteella ja `express.json()`-middlewarella. Rakenteen perusteet on selitetty [demo 3:n luvussa 6](../demo-03/README.md#6-reittien-rakentaminen). Tässä demossa jokaiseen reittiin, joka voi kohdistua olemattomaan ostokseen tai vastaanottaa virheellistä dataa, on lisätty tarkistus ennen kuin mallin metodeja kutsutaan.

### 7.1 Olemassaolon tarkistus ennen muokkausta ja poistoa

```ts
apiOstoksetRouter.delete("/:id", async (req: Request, res: Response) => {

    const haettu = await ostoslista.haeYksi(Number(req.params.id));

    if (!haettu) {
        throw new Virhe(404, "Ostosta ei löytynyt");
    }

    await ostoslista.poista(Number(req.params.id));

    res.json(ostoslista.haeKaikki());

});
```

Demossa 3 DELETE-reitti poisti annetulla id:llä olevan ostoksen suoraan, riippumatta siitä oliko sellaista ostosta olemassa, koska `filter`-metodi ei tee mitään, jos yhtään täsmäävää alkiota ei löydy, joten pyyntö vain vastasi onnistuneesti muuttumattomalla listalla. Tässä demossa ostos haetaan ensin `haeYksi`-metodilla, ja jos tulos on `undefined` (eli totuusarvoltaan epätosi, `!haettu`), heitetään `Virhe(404, "Ostosta ei löytynyt")` ennen kuin poistoa yritetäänkään. Samaa kuviota käytetään PUT-reitissä ja GET `/:id`-reitissä, jossa id:n perusteella kohdistuva toiminto tarkistaa aina ensin, että kohde on olemassa.

Koska reitti on kirjoitettu `async`-funktiona ja `throw` suoritetaan funktion sisällä, virhe päätyy hylätyksi Promiseksi täsmälleen [demo 3:n varoituksessa](../demo-03/README.md#63-post-reitti-ja-uuden-ostoksen-lisääminen) kuvatulla tavalla. Express 5 ottaa sen automaattisesti kiinni ja välittää luvussa [6.3](#63-tuntemattomat-reitit-ja-middlewarejen-järjestys) rekisteröidylle `virhekasittelijä`lle, joka muodostaa asiakkaalle 404-vastauksen. Reitissä riittää siis heittää oikeanlainen `Virhe`-olio, eikä omaa `try`/`catch`-lohkoa tai `next(err)`-kutsua tarvita lainkaan.

> [!TIP]
> GET `/:id`-reitti kutsuu `haeYksi`-metodia kahdesti: ensin olemassaolon tarkistukseen, ja lopuksi vielä uudelleen vastauksen muodostamiseen (`res.json(ostoslista.haeYksi(...))`). Koska metodi palauttaa saman tuloksen molemmilla kerroilla, `haettu`-muuttujan arvon voisi käyttää suoraan myös vastauksessa ilman toista kutsua.

### 7.2 Pyynnön rungon validointi

```ts
apiOstoksetRouter.post("/", async (req: Request, res: Response) => {

    const hyvaksyttyBody = req.body.tuote?.length > 0 && (req.body.poimittu === true || req.body.poimittu === false);

    if (!hyvaksyttyBody) {
        throw new Virhe(400, "Virheellinen pyynnön body");
    }

    const uusiOstos: Ostos = {
        id: 0,
        tuote: req.body.tuote,
        poimittu: req.body.poimittu
    }

    await ostoslista.lisaa(uusiOstos);

    res.json(ostoslista.haeKaikki());

});
```

POST- ja PUT-reitit vastaanottavat dataa pyynnön rungossa (`req.body`), ja koska `req.body`:n sisältö tulee aina asiakassovelluksesta, siihen ei voi luottaa sellaisenaan. `hyvaksyttyBody`-muuttuja kokoaa validoinnin yhdeksi totuusarvoksi kahdella ehdolla:

- `req.body.tuote?.length > 0` tarkistaa, että `tuote`-kenttä on olemassa ja sisältää vähintään yhden merkin. `?.`-operaattori (optional chaining) estää virheen tilanteessa, jossa `req.body.tuote` on `undefined`, sillä jos `tuote` puuttuu kokonaan, `req.body.tuote?.length` palautuu `undefined`:ksi kaatumatta, ja `undefined > 0` on `false`.
- `(req.body.poimittu === true || req.body.poimittu === false)` tarkistaa, että `poimittu`-kenttä on nimenomaan Boolean-arvo, ei esimerkiksi merkkijono `"true"` tai puuttuva arvo. `req.body` tulee JSON:sta jäsenneltynä oliona, jonka kenttien tyyppiä ei voida taata käännösaikaisesti, joten kenttä on tarkistettava ajossa täsmäarvovertailulla.

Jos jompikumpi ehto ei täyty, heitetään `Virhe(400, "Virheellinen pyynnön body")`. HTTP-tilakoodi 400 (Bad Request) ilmaisee asiakassovellukselle, että vika on nimenomaan pyynnössä itsessään, toisin kuin 404-koodi, joka ilmaisee pyynnön kohteen puuttumisen. Vasta validoinnin läpäisseestä datasta muodostetaan `uusiOstos`-olio ja kutsutaan mallin `lisaa`-metodia. PUT-reitissä täsmälleen sama `hyvaksyttyBody`-tarkistus suoritetaan ennen `muokkaa`-metodin kutsumista.

> [!NOTE]
> Validointi tarkistaa vain, että kentät ovat olemassa ja oikean tyyppisiä, ei esimerkiksi sitä, onko tuotenimi mielekäs tai järkevän pituinen. Kattavampi validointi rakentuu samalle periaatteelle: kokoaa halutut ehdot yhdeksi totuusarvoksi ja heittää `Virhe`n, jos ehdot eivät täyty.

## 8 Palvelimen käynnistäminen ja reittien testaaminen

Kun palvelin on käynnistetty yllä kuvatulla tavalla, terminaaliin tulostuu tuttu lokiviesti:

```
Palvelin käynnistettiin osoitteeseen: http://localhost:3004
```

Onnistuneiden pyyntöjen lisäksi tätä demoa kannattaa testata nimenomaan virheellisillä pyynnöillä, jotta virheenkäsittely pääsee näkymään käytännössä. Pyynnöt tehdään Postmanissa samaan tapaan kuin demossa 3, mutta seuraavat neljä esimerkkiä on tarkoituksella muodostettu virheitä laukaisevaksi.

Olemattoman ostoksen hakeminen (404):

```
GET http://localhost:3004/api/ostokset/999
```

Puuttuva tuotenimi (400):

```
POST http://localhost:3004/api/ostokset
Body (raw, JSON): {"poimittu": false}
```

Virheellinen `poimittu`-kentän tyyppi (400):

```
POST http://localhost:3004/api/ostokset
Body (raw, JSON): {"tuote": "Kahvia", "poimittu": "kylla"}
```

Kokonaan olematon reitti (404):

```
GET http://localhost:3004/api/tuntematon
```

> [!TIP]
> Postman näyttää vastauksen HTTP-tilakoodin (esim. `404 Not Found` tai `400 Bad Request`) suoraan Send-painikkeen vierellä vastauspaneelin yläreunassa, JSON-muotoisen virhevastauksen sisällön lisäksi.

Onnistuneet pyynnöt (oikeamuotoinen `tuote` ja `poimittu`, olemassa oleva id) toimivat samoin kuin [demo 3:n testausesimerkeissä](../demo-03/README.md#7-palvelimen-käynnistäminen-ja-reittien-testaaminen).

## 9 Lopuksi

Demossa lisättiin demon 3 REST-rajapintaan kunnollinen virheenkäsittely: omaan luokkaan (`Virhe`) mallinnetut, tunnistettavat virhetilanteet, keskitetty virheenkäsittelymiddleware, tuntemattomien reittien käsittely, ja pyyntöjen validointi ennen tiedon tallentamista. Samalla nähtiin käytännössä, miten Express 5:n automaattinen async-virheiden välitys, jota demo 3 vain sivusi, tekee reittien koodista yksinkertaisempaa, koska reitissä riittää heittää `Virhe`, eikä joka reittiin tarvitse kirjoittaa omaa virheenkäsittelyä.

Myöhemmissä demoissa tallennus tapahtuu todennäköisesti tekstitiedoston sijaan tietokantaan, mutta samat periaatteet, validointi ennen tallennusta ja virheiden välittäminen keskitetylle käsittelijälle, pätevät silloinkin.
