# Demo 8: Käyttäjänhallinta (palvelinsovellus)

Demossa 7 token oli kirjoitettu valmiiksi asiakassovelluksen koodiin, joten ostoslista aukesi kenelle tahansa sivun avaajalle. Tässä demossa käyttäjä kirjautuu itse. Selaimessa avautuu lomake, johon kirjoitetaan käyttäjätunnus ja salasana. Oikeilla tunnuksilla palvelin palauttaa tokenin, jolla ostoslista aukeaa, ja väärillä tunnuksilla lomakkeeseen tulee ilmoitus virheellisistä tiedoista.

Demo jakautuu kahteen kansioon:

- `server` sisältää Express-palvelimen, käyttäjätaulun ja REST API -rajapinnan.
- `client` sisältää Vitellä rakennetun React-sovelluksen, jossa on kirjautumislomake ja ostoslista.

Tämä README käsittelee `server`-kansion palvelinsovellusta. React-asiakassovellus käydään läpi erikseen `client`-kansion omassa dokumentaatiossa. Palvelimelle tuli kolme uutta asiaa:

- käyttäjät omana tauluna tietokannassa
- kirjautumisreitti, joka tarkistaa salasanan ja palauttaa tokenin
- token-tarkistus rajattuna vain ostoslistan reitteihin

## Sisällysluettelo

- [1 Projektin rakenne ja määritystiedostot](#1-projektin-rakenne-ja-määritystiedostot)
- [2 Riippuvuuksien asennus](#2-riippuvuuksien-asennus)
- [3 Käyttäjät tietokannassa](#3-käyttäjät-tietokannassa)
  - [3.1 Kayttaja-malli ja migraatio](#31-kayttaja-malli-ja-migraatio)
  - [3.2 Salasanan tiiviste ja luoSalasana.mjs](#32-salasanan-tiiviste-ja-luosalasanamjs)
- [4 Kirjautumisreitti](#4-kirjautumisreitti)
- [5 Token-tarkistus ostoslistan reiteillä](#5-token-tarkistus-ostoslistan-reiteillä)
- [6 Käynnistäminen ja testaaminen](#6-käynnistäminen-ja-testaaminen)
  - [6.1 Palvelimen ja asiakassovelluksen käynnistäminen](#61-palvelimen-ja-asiakassovelluksen-käynnistäminen)
  - [6.2 Kirjautuminen ja rajapinnan testaaminen Postmanilla](#62-kirjautuminen-ja-rajapinnan-testaaminen-postmanilla)
- [7 Lopuksi](#7-lopuksi)

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

`JWT_SALAISUUS` voi tässä demossa olla mikä tahansa merkkijono, koska asiakassovellus hakee tokenin kirjautumalla. Arvon pitää kuitenkin olla olemassa, tai kirjautuminen vastaa koodilla `500`.

Muodosta Prisma Client tietomallin pohjalta komennolla

```bash
npx prisma generate --config prisma7.config.ts
```

ja käynnistä palvelin kehitystilassa komennolla

```bash
npm run dev
```

Palvelin käynnistyy oletuksena osoitteeseen `http://localhost:3008`. Palvelimen saa sammutettua Terminalissa `Ctrl+C`-näppäinyhdistelmällä ja käynnistettyä uudelleen samalla `npm run dev` -komennolla. Asiakassovellus käynnistetään erikseen `client`-kansiossa, ks. luku [6.1](#61-palvelimen-ja-asiakassovelluksen-käynnistäminen).

> [!WARNING]
> `.env`-tiedosto ja `generated/prisma`-kansio on merkitty `.gitignore`-tiedostossa versionhallinnan ulkopuolelle. Kloonatussa projektissa niitä ei siis ole valmiina, ja yllä olevat kaksi lisävaihetta pitää tehdä itse ennen `npm run dev` -komennon ajamista, tai palvelin ei käynnisty. Perustelut löytyvät [demo 5:n luvuista 3.1](../../demo-05/README.md#31-ympäristömuuttujat-ja-env) ja [3.4](../../demo-05/README.md#34-prisma-client-ja-tietokantayhteys).

## 1 Projektin rakenne ja määritystiedostot

Palvelimen määritystiedostot ovat samat kuin demossa 7. `tsconfig.json` on sisällöltään muuttumaton, ja keskeiset asetukset on käyty läpi [demo 5:n luvussa 1.2](../../demo-05/README.md#12-tsconfigjson-ja-typescript-asetukset). `package.json`:iin on vaihtunut projektin nimi, ja palvelin ajetaan edelleen `dev`-skriptillä (`tsx watch ./index.ts`), joka käynnistää palvelimen uudelleen aina tiedoston tallennuksen jälkeen.

Yhden rivin mittaisessa `.nvmrc`-tiedostossa on arvo `24`, jolla `nvm use` -komento valitsee projektiin Node-version 24. Demo on versiolukittu Node 24 -versioon ja `package.json`:ssa sekä `package-lock.json`:ssa määriteltyihin riippuvuusversioihin.

Demossa 7 tutuiksi tulleet tiedostot siirtyvät tähän demoon muuttumattomina:

- [`lib/prisma.ts`](./lib/prisma.ts) muodostaa tietokantayhteyden, ks. [demo 5:n luku 3.4](../../demo-05/README.md#34-prisma-client-ja-tietokantayhteys)
- [`prisma7.config.ts`](./prisma7.config.ts) on Prisman komentorivityökalun asetustiedosto, ks. [demo 5:n luku 3.3](../../demo-05/README.md#33-prisman-asetustiedosto-ja-tietokannan-migraatiot)
- [`errors/virhekasittelija.ts`](./errors/virhekasittelija.ts) sisältää `Virhe`-luokan ja virheenkäsittelijä-middlewaren, ks. [demo 4:n luku 6](../../demo-04/README.md#6-virheenkäsittelyn-perusta)
- [`routes/apiOstokset.ts`](./routes/apiOstokset.ts) sisältää ostoslistan viisi reittiä, ks. [demo 5:n luku 6](../../demo-05/README.md#6-reittien-rakentaminen-prisma-clientilla)

Uutta on kirjautumisen reittitiedosto [`routes/apiAuth.ts`](./routes/apiAuth.ts) (luku [4](#4-kirjautumisreitti)) sekä apuskripti [`luoSalasana.mjs`](./luoSalasana.mjs) (luku [3.2](#32-salasanan-tiiviste-ja-luosalasanamjs)).

## 2 Riippuvuuksien asennus

Riippuvuudet asennetaan `server`-kansiossa `npm ci` -komennolla, joka asentaa täsmälleen `package-lock.json`-tiedostoon kirjatut versiot. Ero `npm install` -komentoon on selitetty [demo 1:n luvussa 2.1](../../demo-01/README.md#21-npm-ci-vs-npm-install).

Uusia paketteja ei tässä demossa tarvita. Paketit ovat samat kuin demossa 7, ja ne on lueteltu [demo 7:n luvussa 2](../../demo-07/server/README.md#2-riippuvuuksien-asennus). Salasanan tiivisteen laskentaan käytetään Noden omaa `crypto`-moduulia, joka tulee Noden mukana ilman erillistä asennusta.

```ts
import crypto from 'crypto';
```

## 3 Käyttäjät tietokannassa

Kirjautuminen tarvitsee jotain, mihin annettuja tunnuksia verrataan. Tietokantaan lisätään tätä varten oma taulu käyttäjille.

### 3.1 Kayttaja-malli ja migraatio

Tiedostoon [`prisma/schema.prisma`](./prisma/schema.prisma) on kirjoitettu `Ostos`-mallin rinnalle toinen malli.

```prisma
model Kayttaja {
  id             Int    @id @default(autoincrement())
  kayttajatunnus String
  salasana       String
}
```

Rakenne noudattaa samaa periaatetta kuin `Ostos`-malli (ks. [demo 5:n luku 3.2](../../demo-05/README.md#32-tietomalli-schemaprisma-tiedostossa)). `id` on tietokannan muodostama juokseva numero, ja kaksi muuta kenttää ovat merkkijonoja. `salasana`-kenttään tallennetaan salasanasta laskettu tiiviste (luku [3.2](#32-salasanan-tiiviste-ja-luosalasanamjs)).

`kayttajatunnus`-kenttää ei ole merkitty yksilölliseksi `@unique`-määrityksellä, joten tietokanta hyväksyy kaksi riviä samalla tunnuksella. Käyttäjä haetaan tämän takia `findFirst`-metodilla (luku [4](#4-kirjautumisreitti)).

Molemmat taulut luodaan samassa migraatiossa [`prisma/migrations/20260920191159_init`](./prisma/migrations/20260920191159_init/migration.sql).

```sql
-- CreateTable
CREATE TABLE "Kayttaja" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "kayttajatunnus" TEXT NOT NULL,
    "salasana" TEXT NOT NULL
);
```

Migraatiot ja niiden muodostaminen on käyty läpi [demo 5:n luvussa 3.3](../../demo-05/README.md#33-prisman-asetustiedosto-ja-tietokannan-migraatiot). `dev.db`-tiedosto tulee demon mukana, ja migraatio on ajettu siihen valmiiksi. Tietokannassa on neljä ostosriviä ja yksi käyttäjä, jonka tunnus on `TestUser`.

### 3.2 Salasanan tiiviste ja luoSalasana.mjs

Salasanoja ei tallenneta tietokantaan selkokielisenä. Tietokantaan kirjoitetaan salasanasta laskettu tiiviste, josta alkuperäistä salasanaa ei saa laskettua takaisin. Tiivisteen muodostamiseen on oma skripti [`luoSalasana.mjs`](./luoSalasana.mjs).

```js
import crypto from 'crypto';

const hash = crypto.createHash("SHA256").update("passu123").digest("hex");

console.log(hash);
```

Laskenta tehdään kolmessa osassa:

- `createHash("SHA256")` valitsee käytettävän algoritmin.
- `update("passu123")` syöttää laskentaan salasanan.
- `digest("hex")` palauttaa tuloksen heksamerkkijonona.

Samasta salasanasta muodostuu aina sama tiiviste, joten kirjautumisessa riittää laskea annetusta salasanasta tiiviste ja verrata sitä tallennettuun arvoon (luku [4](#4-kirjautumisreitti)). Tietokannan `TestUser`-käyttäjän salasana on `passu123`, ja sen tiiviste on tallennettu `salasana`-kenttään.

Uuden käyttäjän salasanan tiivisteen saa vaihtamalla skriptiin oman salasanan ja ajamalla sen `server`-kansiossa.

```bash
node luoSalasana.mjs
```

Skripti on kirjoitettu JavaScriptillä (`.mjs`), joten sen voi ajaa suoraan Nodella ilman `tsx`-työkalua. Tulostettu tiiviste ja haluttu käyttäjätunnus lisätään `Kayttaja`-tauluun jollain SQLite-tietokantaa käsittelevällä työkalulla, koska demossa ei ole reittiä käyttäjien luomiseen.

> [!WARNING]
> SHA-256 on yleiskäyttöinen tiivistealgoritmi, joka on suunniteltu nopeaksi. Nopeus tekee siitä huonon valinnan salasanoille, koska tiivisteitä voi kokeilla suuria määriä sekunnissa. Oikeassa sovelluksessa käytetään salasanoille tarkoitettua algoritmia, kuten bcryptiä tai argon2:ta. Ne ovat tarkoituksella hitaita ja lisäävät jokaiseen salasanaan satunnaisen suolan, jolloin kahdesta samasta salasanasta muodostuu eri tiiviste. Tässä demossa käytetään SHA-256:ta, koska se tulee Noden mukana ja pitää esimerkin lyhyenä.

## 4 Kirjautumisreitti

Käyttäjät ovat nyt tietokannassa, joten seuraavaksi rakennetaan reitti, jolla tunnukset tarkistetaan. Koko reitti on tiedostossa [`routes/apiAuth.ts`](./routes/apiAuth.ts).

```ts
apiAuthRouter.post("/login", async (req: Request, res: Response) => {

    const { kayttajatunnus, salasana } = req.body ?? {};

    if (typeof kayttajatunnus !== "string" || typeof salasana !== "string") {
        throw new Virhe(400, "Virheellinen pyyntö");
    }

    const kayttaja = await prisma.kayttaja.findFirst({
        where: {
            kayttajatunnus: kayttajatunnus
        }
    });

    const hash = crypto.createHash("SHA256").update(salasana).digest("hex");

    if (kayttaja && hash === kayttaja.salasana) {
        if (!JWT_SALAISUUS) { return res.status(500).json() }
        const token = jwt.sign({}, JWT_SALAISUUS);
        res.json({ token });
    } else {
        throw new Virhe(401, "Virheellinen käyttäjätunnus tai salasana");
    }
});
```

Reitti etenee vaiheittain:

- `req.body ?? {}` antaa tyhjän olion silloin, kun pyynnössä ei ole bodyä lainkaan. Kenttien purkaminen onnistuu tällöinkin ilman virhettä.
- `typeof`-tarkistus varmistaa, että molemmat kentät ovat merkkijonoja. Puuttuvasta tai väärän tyyppisestä kentästä heitetään `Virhe(400, "Virheellinen pyyntö")`, jonka virheenkäsittelijä muuttaa vastaukseksi.
- `findFirst` hakee ensimmäisen rivin, jonka `kayttajatunnus` täsmää annettuun. Tuntemattomalla tunnuksella palautuu `null`.
- Annetusta salasanasta lasketaan sama tiiviste kuin luvussa [3.2](#32-salasanan-tiiviste-ja-luosalasanamjs), ja sitä verrataan tietokannan `salasana`-kentän arvoon.
- Tunnistautuminen onnistuu, kun käyttäjä löytyi ja tiivisteet täsmäävät. Vastauksena palautetaan JSON-olio, jossa on yksi kenttä.

```json
{ "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." }
```

Token muodostetaan `jwt.sign`-funktiolla samaan tapaan kuin demon 7 erillisessä skriptissä (ks. [demo 7:n luku 5.4](../../demo-07/server/README.md#54-tokenin-luominen-luojwtmjs-skriptillä)). Allekirjoitusalgoritmiksi tulee oletuksena HS256, joka on sama algoritmi, jonka token-tarkistus hyväksyy (luku [5](#5-token-tarkistus-ostoslistan-reiteillä)). Voimassaoloaikaa ei tälläkään kertaa aseteta, joten token kelpaa niin kauan kuin `JWT_SALAISUUS` pysyy samana.

Virheellisistä tunnuksista vastataan koodilla `401` ja viestillä "Virheellinen käyttäjätunnus tai salasana". Sama vastaus tulee sekä tuntemattomasta käyttäjätunnuksesta että väärästä salasanasta, joten vastauksesta ei selviä, kumpi oli väärin. Käyttäjätunnusten olemassaoloa ei näin voi kartoittaa kokeilemalla.

Reititin liitetään palvelimeen tiedostossa [`index.ts`](./index.ts) osoitteeseen `/api/auth`, joten reitin koko osoite on `POST /api/auth/login`. Reitittimessä on oma `express.json()`-middleware pyynnön bodyn jäsentämiseen samaan tapaan kuin ostoslistan reitittimessä (ks. [demo 3:n luku 6.1](../../demo-03/README.md#61-router-ja-json-pyyntöjen-jäsentäminen)).

> [!NOTE]
> Tokenin sisältöosaan annetaan tyhjä olio `{}`, joten tokenista ei selviä, kuka kirjautui. Palvelin voi tarkistaa, että pyynnön lähettäjä on joskus kirjautunut oikeilla tunnuksilla, mutta ostoslistan rivit ovat kaikille kirjautuneille samat. Tokenin rakenne on käyty läpi [demo 7:n luvussa 5.1](../../demo-07/server/README.md#51-mikä-jwt-token-on).

> [!TIP]
> Kokeile harjoituksena lisätä käyttäjän tunniste tokenin sisältöön muodossa `jwt.sign({ id: kayttaja.id }, JWT_SALAISUUS)`. Tarkistuksessa `jwt.verify` palauttaa tokenin sisältöosan, josta arvon saa luettua talteen. Tämän jälkeen reiteissä olisi käytettävissä tieto siitä, kuka pyynnön lähetti, ja ostoslistan rivit voisi sitoa käyttäjään.

## 5 Token-tarkistus ostoslistan reiteillä

Demossa 7 tarkistus rekisteröitiin `app.use(tarkistaToken)` -rivillä koko sovellukselle, jolloin myös palvelimen etusivu vaati tokenin (ks. [demo 7:n luku 5.3](../../demo-07/server/README.md#53-middlewarejen-järjestys-ja-palvelimen-etusivu)). Nyt sama tarkistus liitetään vain ostoslistan reitteihin.

```ts
app.use(express.static(path.join(import.meta.dirname, "public")));

app.use("/api/auth", apiAuthRouter);

app.use("/api/ostokset", tarkistaToken, apiOstoksetRouter);
```

`app.use`-metodille voidaan antaa osoitteen jälkeen useita middlewareja, jotka suoritetaan osoitteeseen tulevalle pyynnölle kirjoitusjärjestyksessä. Osoitteeseen `/api/ostokset` tuleva pyyntö menee ensin `tarkistaToken`-funktiolle ja etenee reitittimelle vasta sen jälkeen.

Palvelin jakautuu näin kolmeen osaan:

- `public`-kansion etusivu aukeaa selaimessa ilman tokenia
- `POST /api/auth/login` on avoin, koska token haetaan sieltä
- `/api/ostokset`-reitit vaativat kelvollisen tokenin

Tarkistusfunktio lukee `Authorization`-otsakkeen ja tarkistaa allekirjoituksen samalla tavalla kuin demossa 7 (ks. [demo 7:n luku 5.2](../../demo-07/server/README.md#52-tarkistatoken-middleware)).

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
    } catch {
        res.status(401).json();
    }

    next();
}
```

Pyynnölle käy kolmella tavalla:

- Puuttuvasta tai väärän muotoisesta otsakkeesta vastataan koodilla `401`, ja käsittely päättyy siihen.
- Kelvollisella tokenilla suoritus jatkuu `next()`-kutsuun, ja pyyntö etenee ostoslistan reiteille.
- Virheellisestä tokenista `jwt.verify` heittää virheen, joka otetaan kiinni `catch`-lohkossa. Vastauskoodi on tällöin `401`.

Tuntemattomien reittien käsittely ja virheenkäsittelijän rekisteröinti ovat tiedoston lopussa samassa järjestyksessä kuin aiemmissa demoissa (ks. [demo 4:n luku 6.3](../../demo-04/README.md#63-tuntemattomat-reitit-ja-middlewarejen-järjestys)).

> [!NOTE]
> Osan rajapinnasta jättäminen avoimeksi on kirjautumisen kanssa välttämätöntä. Tokenia ei voi vaatia siltä reitiltä, jolta token haetaan. Julkisiksi jätetyistä reiteistä palautetaan tämän takia vain sellaista tietoa, jonka saa näyttää kirjautumattomalle käyttäjälle.

## 6 Käynnistäminen ja testaaminen

### 6.1 Palvelimen ja asiakassovelluksen käynnistäminen

Sovelluksen kokonaisuus vaatii kaksi käynnissä olevaa kehityspalvelinta, joten VS Codessa avataan kaksi Terminal-välilehteä.

Ensimmäisessä välilehdessä käynnistetään palvelin `server`-kansiossa dokumentin alussa kuvatulla tavalla. Terminaaliin tulostuu lokiviesti:

```
Palvelin käynnistettiin osoitteeseen: http://localhost:3008
```

Toisessa välilehdessä siirrytään `client`-kansioon. Asiakassovelluksen riippuvuudet asennetaan ja Viten kehityspalvelin käynnistetään samoilla `npm ci` ja `npm run dev` -komennoilla kuin palvelinprojektissa. Selaimessa avataan osoite `http://localhost:3000`, jossa näkymään tulee kirjautumislomake. Testitunnukset ovat `TestUser` ja `passu123`. Kumpikin kehityspalvelin sammutetaan omassa välilehdessään `Ctrl+C`-näppäinyhdistelmällä.

Asiakassovellus lähettää pyyntönsä suhteellisella osoitteella Viten kehityspalvelimen kautta portin 3008 palvelimelle, mikä on käyty läpi [demo 7:n luvussa 6](../../demo-07/server/README.md#6-asiakassovelluksen-pyynnöt-ja-viten-proxy). Välityksen kohdeportin pitää vastata palvelimen porttia, joka on tässä demossa 3008.

> [!NOTE]
> Asiakassovellus tallentaa saamansa tokenin selaimen muistiin, joten kirjautuminen säilyy myös sivun uudelleenlatauksen yli. Jos `.env`-tiedoston `JWT_SALAISUUS` vaihdetaan palvelimen käynnistysten välillä, vanha token ei enää kelpaa ja sovellus palaa kirjautumislomakkeeseen.

### 6.2 Kirjautuminen ja rajapinnan testaaminen Postmanilla

Rajapintaa testataan Postmanilla samaan tapaan kuin demoissa 3-7. Kirjautuminen tehdään POST-pyynnöllä, ja pyynnön mukana lähetetään tunnukset.

```
POST http://localhost:3008/api/auth/login
Body (raw, JSON): {"kayttajatunnus": "TestUser", "salasana": "passu123"}
```

Vastauksena tulee olio, jossa on token. Kopioi tokenin arvo lainausmerkkien välistä, koska sitä tarvitaan seuraavissa pyynnöissä.

```json
{ "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." }
```

Ostoslistan reitit testataan liittämällä token pyyntöön. Pyyntö muodostetaan näin:

- Valitse metodi pudotusvalikosta.
- Kirjoita osoitteeksi `http://localhost:3008/api/ostokset`.
- Lisää Headers-välilehdelle avain `Authorization` ja sen arvoksi `Bearer <token>`.
- POST- ja PUT-pyynnöissä valitse Body-välilehdeltä raw ja JSON, ja kirjoita pyynnön sisältö.

Ostoslistan reittien toiminta on muuten sama kuin demossa 7 (ks. [demo 7:n luku 7.3](../../demo-07/server/README.md#73-rajapinnan-testaaminen-postmanilla)). Kirjautumisen ja tarkistuksen kokeilemiseen riittää neljä pyyntöä:

- Väärä salasana kirjautumisessa palauttaa koodin `401` ja vastauksen `{"virhe":"Virheellinen käyttäjätunnus tai salasana"}`. Sama vastaus tulee tuntemattomalla käyttäjätunnuksella.
- Puuttuva `salasana`-kenttä kirjautumisen bodyssa palauttaa koodin `400` ja vastauksen `{"virhe":"Virheellinen pyyntö"}`.
- GET-pyyntö osoitteeseen `http://localhost:3008/api/ostokset` ilman `Authorization`-otsaketta palauttaa koodin `401` ja tyhjän vastauksen.
- Sama pyyntö kelvollisella tokenilla palauttaa ostoslistan rivit JSON-taulukkona.

Palvelimen oma etusivu aukeaa nyt selaimessa osoitteessa `http://localhost:3008` ilman tokenia, koska tarkistus koskee vain ostoslistan reittejä (luku [5](#5-token-tarkistus-ostoslistan-reiteillä)). Sivulla on lyhyt kuvaus demon aiheesta.

## 7 Lopuksi

Ostoslistan reitit ja tietokantakutsut säilyivät demosta 7, ja uutta oli kirjautuminen. Palvelimelle tuli kolme osaa:

- `Kayttaja`-taulu, jossa salasana on tallennettu tiivisteenä
- kirjautumisreitti, joka vertaa annetun salasanan tiivistettä tallennettuun ja palauttaa onnistumisesta tokenin
- token-tarkistus rajattuna vain ostoslistan reitteihin

Demoissa 7 ja 8 on rakennettu kaksi eri asiaa. Demon 7 tarkistus vastasi kysymykseen, onko pyynnön lähettäjällä oikeus käyttää rajapintaa. Tässä demossa lisättiin sen eteen vaihe, jossa käyttäjä todistaa henkilöllisyytensä tunnuksilla ja saa vastineeksi tokenin. Tokenin sisältö on toistaiseksi tyhjä, joten seuraava askel olisi liittää käyttäjän tunniste tokeniin ja sitoa tietokannan rivit käyttäjään. Asiakassovelluksen toteutus jatkuu `client`-kansion dokumentaatiossa.
