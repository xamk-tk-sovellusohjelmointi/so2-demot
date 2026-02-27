# Demo 3: REST API

## 1. REST ja REST-rajapinnat

### REST:n arkkitehtuuriperusteet

REST (Representational State Transfer) on sovelluksen arkkitehtuurimalli. REST ei ole protokolla eikä standardi, vaan joukko periaatteita, joita HTTP-protokollan päälle rakennettava hajautettu sovellus voi noudattaa. REST-arkkitehtuurin keskeisimmät periaatteet ovat seuraavat:

- **Asiakas-palvelin-arkkitehtuuri.** Asiakassovellus ja palvelin ovat erillisiä kokonaisuuksia, jotka kommunikoivat rajapinnan kautta. Kumpikaan osapuoli ei tiedä toisen sisäisestä toteutuksesta.

- **Tilattomuus.** Jokainen pyyntö on itsenäinen. Palvelin ei säilytä tietoa asiakkaan tilasta pyyntöjen välillä, vaan kaikki pyynnön käsittelyyn tarvittava tieto on sisällyttävä pyyntöön itseensä.

- **Yhtenäinen rajapinta.** Resurssit tunnistetaan URI-osoitteilla, ja niitä käsitellään HTTP-metodien avulla. Sama resurssi voidaan esittää eri muodoissa, kuten JSON tai XML.

- **Kerrostettu järjestelmä.** Asiakassovellus ei välttämättä tiedä, kommunikoiko se suoraan palvelimen vai välityspalvelimen kanssa.

### REST API

REST API (Application Programming Interface) on sovelluksen rajapinta, joka toteuttaa REST-arkkitehtuurin periaatteet HTTP-protokollan päällä. REST API:n kautta asiakassovellus voi lukea, lisätä, muokata ja poistaa palvelimella sijaitsevia resursseja.

Resursseja käsitellään HTTP-metodeilla, joilla on vakiintuneet semanttiset merkitykset:

| Metodi | Tarkoitus |
|--------|-----------|
| GET    | Resurssin tai resurssien lukeminen |
| POST   | Uuden resurssin luominen |
| PUT    | Olemassa olevan resurssin korvaaminen kokonaan |
| DELETE | Resurssin poistaminen |

REST API palauttaa vastauksensa HTTP-tilakoodeilla, jotka kertovat pyynnön onnistumisesta tai epäonnistumisesta:

| Tilakoodi | Merkitys |
|-----------|----------|
| 200 OK | Pyyntö onnistui |
| 201 Created | Uusi resurssi luotiin onnistuneesti |
| 400 Bad Request | Pyyntö on muodoltaan tai sisällöltään virheellinen |
| 404 Not Found | Pyydettyä resurssia ei löydy |
| 500 Internal Server Error | Palvelimella tapahtui odottamaton virhe |

Tiedonsiirtomuotona REST API:t käyttävät yleensä JSON:ia (JavaScript Object Notation), joka on tekstipohjainen, rakenteinen tietomuoto.

### Demosovelluksen aihe

Demosovellus on ajopäiväkirjan REST API. Se tallentaa tietoja tehdyistä ajoista ja tarjoaa HTTP-rajapinnan näiden tietojen lukemiseen, lisäämiseen, muokkaamiseen ja poistamiseen.

Sovelluksen tunnistaa REST API -sovellukseksi seuraavista piirteistä:

1. Sovellus tarjoaa resurssin URI-osoitteessa `/api/ajopaivakirja`.
2. Resursseja käsitellään HTTP-metodeilla GET, POST, PUT ja DELETE.
3. Sovellus viestii asiakkaan kanssa JSON-muodossa.
4. Sovellus on tilaton, eli jokainen pyyntö käsitellään erikseen ilman, että palvelin muistaa edellisiä pyyntöjä.
5. Sovellus palauttaa asianmukaiset HTTP-tilakoodit sen mukaan, onnistuiko pyyntö vai ei.

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

Tässä luvussa käydään läpi, miten demosovelluksen kaltainen Express-pohjainen REST API rakennetaan tyhjästä kansiosta alkaen. Jokainen vaihe on kuvattu niin, että sen tarkoitus ja tehdyt valinnat käyvät ilmi selitystekstistä.

### Vaihe 1: Projektin alustaminen

Luodaan projektille tyhjä kansio ja siirrytään siihen terminaalissa:

```bash
# Kansio voidaan luoda myös CLI-komentona, mutta sen voi luoda myös perinteisesti.
mkdir demo03
# cd (change directory) siirtyy kansioon. Voidaan myös avata terminaali suoraan kyseisessä kansiossa.
cd demo03
```

Kansion sisällä alustetaan Node.js-projekti:

```bash
npm init -y
```

`npm init` luo projektin juureen `package.json`-tiedoston, joka on Node.js-projektin pakollinen perustiedosto. Se kuvaa projektin nimen, version, käynnistysskriptit ja riippuvuudet. Lippu `-y` hyväksyy kaikki oletusarvot ilman interaktiivisia kysymyksiä, joten tiedosto luodaan heti oletussisällöllä.

`npm init`:n tuottama `package.json` näyttää aluksi tältä:

```json
{
  "name": "demo03",
  "version": "1.0.0",
  "description": "",
  "main": "index.ts",
  "scripts": {
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "keywords": [],
  "author": "",
  "license": "ISC"
}
```

Tiedostoa täydennetään myöhemmissä vaiheissa.

### Vaihe 2: Riippuvuuksien asentaminen

Node.js-projektin ulkoiset kirjastot asennetaan `npm install` -komennolla. Express-pohjainen TypeScript-palvelin tarvitsee kahdenlaisia paketteja: ajonaikaisia riippuvuuksia ja kehitysriippuvuuksia.

**Ajonaikaiset riippuvuudet** asennetaan ilman lisäkomentoja:

```bash
npm install express
```

- `express` on palvelinkirjasto, joka tarjoaa valmiit työkalut HTTP-pyyntöjen vastaanottamiseen ja vastausten lähettämiseen. Ilman Expressiä HTTP-palvelin pitäisi rakentaa Node.js:n perusmoduuleilla, mikä on huomattavasti monimutkaisempaa.

**Kehitysriippuvuudet** asennetaan `--save-dev`-lisäkomennolla:

```bash
npm install --save-dev tsx typescript @types/express @types/node
```

1. `typescript` on TypeScript-kääntäjä. Se tarvitaan, jotta TypeScript-syntaksi voidaan tarkistaa ja kääntää JavaScript-koodiksi.

2. `tsx` on työkalu, joka mahdollistaa TypeScript-tiedostojen suorittamisen suoraan ilman erillistä käännösvaihetta. Sen avulla TypeScript-tiedostot kuten `index.ts` voidaan suorittaa Node.js-suoritusympäristössä samaan tapaan kuin tavallinen JavaScript-tiedosto.

3. `@types/express` sisältää Express-kirjaston TypeScript-tyyppimäärittelyt. Ilman niitä TypeScript ei tiedä, millaisia parametreja ja palautusarvoja Expressin funktioilla on, eikä pysty tarkistamaan niiden oikeellisuutta.

4. `@types/node` sisältää Node.js:n perusmoduulien TypeScript-tyyppimäärittelyt. Ne kattavat esimerkiksi `process.env`- ja `import.meta`-rakenteet, joita käytetään demosovelluksessa.

`--save-dev`-lisäkomento merkitsee paketit kehitysriippuvuuksiksi `package.json`:iin `devDependencies`-kentän alle. Ajonaikaiset riippuvuudet päätyvät `dependencies`-kenttään. Tämä erottelu on tärkeä, koska tuotantoympäristöön asennettaessa kehitysriippuvuuksia ei tarvita.

Asennuksen jälkeen npm on luonut `node_modules/`-kansion, johon kaikki paketit on ladattu, sekä `package-lock.json`-tiedoston, joka lukitsee asennettujen pakettien tarkat versiot toistettavien asennusten varmistamiseksi.

### Vaihe 3: TypeScript-konfiguraatio

Luodaan projektin juureen `tsconfig.json`-tiedosto. Se kertoo TypeScript-kääntäjälle, millä asetuksilla koodi tarkistetaan ja käännetään. Tiedosto luodaan manuaalisesti tai komennolla:

```bash
npx tsc --init
```

Demosovelluksen kannalta olennaiset asetukset ovat:

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

1. `"target": "esnext"` kertoo kääntäjälle, että tuotettu JavaScript voi käyttää uusimpia JavaScript-ominaisuuksia. Koska koodi ajetaan Node.js:ssä eikä vanhassa selaimessa, tämä on turvallinen valinta.

2. `"module": "preserve"` tarkoittaa, että kääntäjä säilyttää alkuperäisen moduulisyntaksin muuttamattomana. Se sopii yhteen `tsx`-työkalun ja ES-moduulien kanssa.

3. `"types": ["node"]` kertoo, että Node.js:n tyyppimäärittelyt otetaan käyttöön globaalisti. Tämä mahdollistaa esimerkiksi `process.env`-muuttujan käytön ilman erillistä tuontia.

4. `"strict": true` aktivoi TypeScriptin tiukimmat tyyppitarkistukset. Se sisältää muun muassa `strictNullChecks`-tarkistuksen, joka pakottaa huomioimaan, voiko arvo olla `null` tai `undefined`.

5. `"esModuleInterop": true` mahdollistaa CommonJS-muotoisten pakettien tuonnin ES-moduulisyntaksilla. Express on sisäisesti CommonJS-paketti, joten tämä asetus on tarpeen, jotta `import express from 'express'` toimii oikein.

6. `"resolveJsonModule": true` mahdollistaa JSON-tiedostojen tuonnin suoraan TypeScript-koodiin.

7. `"skipLibCheck": true` ohittaa tyyppimäärittelytiedostojen tyyppitarkistukset, mikä nopeuttaa käännöstä ja välttää joidenkin ulkoisten kirjastojen aiheuttamia käännösvirheitä.

### Vaihe 4: Käynnistysskriptit ja moduulimuoto

`package.json`:iin lisätään kaksi asiaa: `"type": "module"` ja `scripts`-kenttä.

```json
{
  "type": "module",
  "scripts": {
    "start": "tsx index.ts",
    "dev": "tsx watch index.ts"
  }
}
```

**`"type": "module"`** kertoo Node.js:lle, että projekti käyttää ES-moduulisyntaksia. Tämä tarkoittaa, että tiedostoissa käytetään `import`- ja `export`-lauseita eikä CommonJS:n `require()`- ja `module.exports`-rakenteita. Ilman tätä asetusta Node.js tulkitsee `.js`-tiedostot (joita on asennetuissa Node-paketeissa kuten `express`) CommonJS-moduuleiksi, mikä voi johtaa syntaksivirheisiin.

**`scripts`-kenttä** määrittelee komentoja, joita voidaan ajaa `npm run <nimi>`-komennolla:

- `"start": "tsx index.ts"` käynnistää palvelimen ajamalla `index.ts`-tiedoston `tsx`-työkalulla. Skriptiä käytetään palvelimen käynnistämiseen ja se ajetaan komennolla `npm start`.
- `"dev": "tsx watch index.ts"` käynnistää palvelimen kehitysmoodissa. `watch`-lisäkomento asettaa `tsx`:n tarkkailemaan tiedostomuutoksia ja käynnistämään palvelimen automaattisesti uudelleen aina kun lähdekoodi muuttuu. Skripti ajetaan komennolla `npm run dev`.

### Vaihe 5: Tietomallin luominen (models/ajot.ts)

Luodaan projektin juureen `models/`-kansio ja sinne tiedosto `ajot.ts`. Kansiorakenne ei ole teknisesti pakollinen, vaan tapa pitää koodi jäsenneltynä: tietomalli sijoitetaan eri paikkaan kuin reitityslogiikka. Tiedosto koostuu tyyppirajapinnasta ja tietojoukosta.

**TypeScript-rajapinta `Ajo`**

```typescript
export interface Ajo {
    id: number;
    reitti: string;
    km: number;
    ajaja: string;
    pvm: string;
}
```

`interface` on TypeScriptin rakenne, jolla määritellään objektin muoto. Tässä se kertoo, että jokaisen `Ajo`-tyyppisen objektin on sisällettävä tasan nämä kentät näillä tyypeillä:

- `id: number` on ajon yksilöivä tunniste. Se on numero, koska sitä käytetään laskutoimituksissa uutta id:tä generoidessa.
- `reitti: string` on vapaamuotoinen tekstikenttä.
- `km: number` on ajettu kilomäärä tallennettuna numerona.
- `ajaja: string` on ajajan tunnistekoodi.
- `pvm: string` on päivämäärä merkkijonona. Päivämäärä voisi olla myös `Date`-tyyppi, mutta merkkijonona se siirtyy JSON-vastaukseen suoraan luettavassa muodossa ilman erillisiä muunnoksia.

`export`-avainsana rajapinnan edessä tekee tyypistä käytettävissä muissa tiedostoissa. Reitinkäsittelytiedosto tuo sen tuontilauseella `import { type Ajo } from '../models/ajot'`.

**Tietojoukko `ajot`**

```typescript
const ajot: Ajo[] = [
    {
        id: 1,
        reitti: "Mikkeli-Juva-Mikkeli",
        km: 126,
        ajaja: "A12",
        pvm: new Date("2025-03-04").toLocaleDateString("fi-FI")
    },
    // ...lisää alkioita
];

export default ajot;
```

`ajot` on taulukko, jonka jokainen alkio on `Ajo`-tyypin mukainen objekti. Merkintä `Ajo[]` tarkoittaa taulukkoa, jonka jokainen alkio on `Ajo`-tyyppinen. Taulukko on määritelty `const`-avainsanalla, mikä tarkoittaa, että muuttujan viittaus pysyy samana. Taulukon sisältöä voidaan silti muuttaa JavaScriptin `push()`- ja `splice()`-metodeilla, koska ne eivät korvaa taulukkoa uudella vaan muokkaavat sen sisältöä.

`new Date("2025-03-04").toLocaleDateString("fi-FI")` muuntaa ISO-muotoisen päivämäärämerkkijonon suomalaiseksi päivämäärätekstiksi, esimerkiksi `"4.3.2025"`. `new Date()` luo JavaScript-päivämääräobjektin ja `toLocaleDateString("fi-FI")` muotoilee sen suomalaiseen esitysmuotoon.

`export default ajot` vie taulukon tiedoston oletusvientinä, jotta se voidaan tuoda muissa tiedostoissa komennolla `import ajot from '../models/ajot'`.

Koska taulukko on tavallinen muistissa sijaitseva muuttuja eikä tietokanta, sen sisältö nollautuu aina palvelimen käynnistyessä uudelleen. Tietokannan käyttöön perehdytään myöhemmissä demoissa.

### Vaihe 6: Reitinkäsittelijät (routes/apiAjopaivakirja.ts)

Luodaan `routes/`-kansio ja sinne tiedosto `apiAjopaivakirja.ts`. Tähän tiedostoon kootaan kaikki ajopäiväkirjaresurssin HTTP-päätepisteet (API endpoints).

**Tiedoston alkuosa: tuonnit ja reitittimen luominen**

```typescript
import express from 'express';
import ajot, { type Ajo } from '../models/ajot';

const apiAjopaivakirjaRouter: express.Router = express.Router();
apiAjopaivakirjaRouter.use(express.json());
```

`import express from 'express'` tuo Express-kirjaston käyttöön. `import ajot, { type Ajo } from '../models/ajot'` tuo sekä taulukon (`ajot`) että tyypin (`Ajo`) mallitiedostosta `ajot.ts`. `type`-avainsana tuonnissa kertoo TypeScriptille, että `Ajo` on pelkkä tyyppi eikä ajonaikainen arvo, mikä on hyvä käytäntö (ja tarvitaan tietyillä tsconfig-asetuksilla).

`express.Router()` luo uuden reitittimen. Reititin on itsenäinen reittien kokoelma, joka liitetään myöhemmin pääsovellukseen tiettyyn polkuun. Tämä pitää koodin jäsenneltynä: jokainen resurssialue saa oman reitittimensa omaan tiedostoonsa, ja `index.ts` kokoaa ne yhteen. Vaihtoehto olisi kirjoittaa kaikki reitit suoraan `index.ts`:ään, mutta se johtaisi nopeasti hankalasti hallittavaan tiedostoon.

`apiAjopaivakirjaRouter.use(express.json())` ottaa käyttöön JSON-jäsentäjän tälle reitittimelle. `express.json()` on middleware, joka lukee pyynnön bodyn ja muuntaa JSON-tekstin JavaScript-objektiksi, jolloin se on käytettävissä `req.body`-ominaisuuden kautta. Ilman tätä `req.body` on `undefined` kaikissa POST- ja PUT-pyynnöissä.

**GET / : kaikkien ajojen haku**

```typescript
apiAjopaivakirjaRouter.get("/", (req: express.Request, res: express.Response) => {
    res.json(ajot);
});
```

Tämä reitti vastaa pyyntöihin, jotka tulevat reitittimen juuripolkuun. Koska reititin liitetään myöhemmin polkuun `/api/ajopaivakirja`, tämä reitti vastaa pyyntöihin `GET /api/ajopaivakirja`. `res.json(ajot)` lähettää koko `ajot`-taulukon JSON-muodossa vastauksena. Express asettaa automaattisesti `Content-Type: application/json` -vastausotsikon.

**GET /:id : yksittäisen ajon haku**

```typescript
apiAjopaivakirjaRouter.get("/:id", (req: express.Request, res: express.Response) => {
    const id = Number(req.params.id);
    const ajo = ajot.find(ajo => ajo.id === id);

    if (!ajo) {
        return res.status(404).json({ viesti: "Ajoa ei löytynyt" });
    }

    res.json(ajo);
});
```

`:id` polun osana tarkoittaa dynaamista parametria. Kun pyyntö tulee osoitteeseen `/api/ajopaivakirja/5`, Express tallentaa arvon `"5"` `req.params.id`-kenttään. Arvo on aina merkkijono, joten se muunnetaan numeroksi `Number()`-funktiolla ennen vertailua, koska ajot-taulukon `id`-kenttä on tyyppiä `number`.

`ajot.find()` käy taulukon läpi alkio kerrallaan ja palauttaa ensimmäisen alkion, jonka `id`-kenttä täsmää haettuun `id`-arvoon. Jos vastaavaa alkiota ei löydy, `find()` palauttaa `undefined`. Tämä tarkistetaan `if (!ajo)`-lauseella, ja jos ajoa ei löydy, vastataan tilakoodilla 404 sekä viestiobjektilla. `return`-avainsana on tärkeä: se lopettaa käsittelijäfunktion suorituksen, jotta vastauksen lähettäminen ei jatku `res.json(ajo)`:lla.

Jos ajo löytyi, se palautetaan JSON-objektina vastauksena käyttäjän pyyntöön.

**POST / : uuden ajon lisääminen**

```typescript
apiAjopaivakirjaRouter.post("/", (req: express.Request, res: express.Response) => {
    if (!req.body.reitti || !req.body.km || !req.body.ajaja) {
        return res.status(400).json({ viesti: "Virheellinen pyynnön body" });
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

POST-reitti vastaanottaa uuden ajon tiedot pyynnön bodyssä JSON-muodossa. Asiakkaan on siis lähetettävä pyyntö, jonka bodyssa on JSON-objekti kentillä `reitti`, `km` ja `ajaja`.

Ensimmäisenä tarkistetaan, että kaikki pakolliset kentät on lähetetty. Jos jokin kenttä puuttuu tai on tyhjä arvo, palautetaan tilakoodi 400 virheviestin kera. Tämä on tärkeä vaihe, sillä ilman syötteen tarkistamista tietokantaan voisi päätyä puutteellisia tietueita.

`id`-arvon laskemiseen käytetään ehdollista lauseketta. Jos taulukko on tyhjä (`ajot.length === 0`), ensimmäisen ajon id on 1. Muussa tapauksessa `ajot.map(ajo => ajo.id)` muodostaa ajot-taulukosta pelkät id-arvot uudeksi taulukoksi. `Math.max(...)`-kutsu hajottaa taulukon yksittäisiksi argumenteiksi spread-operaattorilla `...` ja palauttaa niistä suurimman. Tähän lisätään 1, jolloin uusi id on aina suurempi kuin mikään olemassa oleva id.

Tarkistuksen ja id:n muodostamisen jälkeen uuden ajon tiedot sijoitetaan apumuuttujaan `uusiAjo` perustuen pyynnössä annettuun id-reittiparametriin ja pyynnön bodyn tietoihin. Koska kaikki pyynnön bodyn arvot ovat merkkijonoja, ne tulee tarvittaessa muuntaa oikeaksi TypeScript-tyypiksi `Ajo`-tyypin mukaisesti. Jos pyynnössä lähetetty tieto on vääränlaista tyyppiä muunnettavaksi (esim. km ei ole numeerinen arvo), arvoksi voi tulla esim. NaN (Not a Number). Tässä demosovelluksessa tiedon oikeellisuutta ei tarkisteta, eli ajoihin voisi päätyä ajoja ilman oikeaa kilometrimäärää tms. Ainoa tarkistus on tiedon olemassaolo. Oikeassa tuotantosovelluksessa tiedon validoinnin pitäisi olla kattavampi.

`ajot.push(uusiAjo)` lisää uuden ajon taulukon loppuun. Vastaukseksi lähetetään tilakoodi 201 (Created) koko päivitetyn taulukon kera. Tilakoodi 201 on semanttisesti oikea valinta POST-pyynnölle, joka luo uuden resurssin, toisin kuin 200, joka tarkoittaa yleistä onnistumista.

**PUT /:id : olemassa olevan ajon muokkaaminen**

```typescript
apiAjopaivakirjaRouter.put("/:id", (req: express.Request, res: express.Response) => {
    const index = ajot.findIndex(ajo => ajo.id === Number(req.params.id));

    if (index === -1) {
        return res.status(404).json({ viesti: "Ajoa ei löydy" });
    }

    if (!req.body.reitti || !req.body.km || !req.body.ajaja) {
        return res.status(400).json({ viesti: "Virheellinen pyynnön body" });
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

PUT-pyynnössä korvataan koko olemassa oleva tietue uudella. Ensin etsitään muokattavan ajon indeksi taulukossa `findIndex()`-metodilla, joka palauttaa alkion numeerisen sijainnin taulukossa tai `-1`, jos alkiota ei löydy.

`find()`:n ja `findIndex()`:n välinen ero on seuraava: `find()` palauttaa itse alkion, kun taas `findIndex()` palauttaa alkion sijainnin taulukossa. Muokkausoperaatiossa tarvitaan sijaintia, koska se mahdollistaa alkion korvaamisen suoraan taulukkoon: `ajot[index] = muokattuAjo`. Taulukkosijainnin perusteella tehty korvaus on tehokas tapa päivittää yksittäinen alkio.

Päivämäärä asetetaan automaattisesti palvelimen nykyiseen hetkeen `new Date().toLocaleDateString("fi-FI")`:lla. Tällöin asiakkaan ei tarvitse lähettää päivämäärää, ja se päivittyy aina muokkaushetken perusteella.

**DELETE /:id : ajon poistaminen**

```typescript
apiAjopaivakirjaRouter.delete("/:id", (req: express.Request, res: express.Response) => {
    const index = ajot.findIndex(ajo => ajo.id === Number(req.params.id));

    if (index === -1) {
        return res.status(404).json({ viesti: "Ajoa ei löytynyt" });
    }

    ajot.splice(index, 1);
    res.json(ajot);
});
```

DELETE-reitissä etsitään ensin poistettavan ajon indeksi samalla tavalla kuin PUT-reitissä. `ajot.splice(index, 1)` poistaa taulukosta yhden alkion kohdasta `index`. `splice()`-metodin ensimmäinen argumentti on aloitusindeksi ja toinen on poistettavien alkioiden lukumäärä. Muut alkiot siirtyvät automaattisesti täyttämään poistetun alkion paikan.

**Reitittimen vienti**

```typescript
export default apiAjopaivakirjaRouter;
```

Tiedoston lopussa reititin viedään oletusvientiä, jotta se voidaan tuoda `index.ts`-tiedostossa ja ottaa käyttöön pääsovellukseen.

### Vaihe 7: Pääohjelma (index.ts)

Luodaan projektin juureen `index.ts`, joka on sovelluksen käynnistyspiste. Se kokoaa yhteen kaikki osat ja käynnistää palvelimen.

```typescript
import express from 'express';
import path from 'path';
import apiAjopaivakirjaRouter from './routes/apiAjopaivakirja';

const app: express.Application = express();

const portti: number = Number(process.env.PORT) || 3003;

app.use(express.static(path.resolve(import.meta.dirname, "public")));
app.use("/api/ajopaivakirja", apiAjopaivakirjaRouter);

app.listen(portti, (): void => {
    console.log(`Palvelin käynnistettiin osoitteeseen http://localhost:${portti}`);
});
```

**Tuonnit**

`import express from 'express'` tuo Express-kirjaston. `import path from 'path'` tuo Node.js:n `path`-moduulin, jota käytetään tiedostopolkujen muodostamiseen käyttöjärjestelmästä riippumattomalla tavalla. `import apiAjopaivakirjaRouter from './routes/apiAjopaivakirja'` tuo reitittimen aiemmin luodusta tiedostosta.

**Sovelluksen luominen**

```typescript
const app: express.Application = express();
```

`express()` luo uuden Express-sovelluksen ja palauttaa sen. Muuttuja `app` on tästä eteenpäin sovelluksen ydin, johon kaikki middleware ja reitittimet liitetään `app.use()`-kutsuilla.

**Portin määrittely**

```typescript
const portti: number = Number(process.env.PORT) || 3003;
```

`process.env.PORT` lukee `PORT`-ympäristömuuttujan arvon (jos sellainen on). Ympäristömuuttujat ovat käyttöjärjestelmätasolla asetettavia arvoja, joilla sovelluksen toimintaa voidaan konfiguroida ilman koodimuutoksia. Tuotantoympäristöissä, kuten pilvipalveluissa, palvelu asettaa portin usein ympäristömuuttujana. `Number()`-muunnos tarvitaan, koska ympäristömuuttujat ovat aina merkkijonoja. Jos ympäristömuuttujaa ei ole, `process.env.PORT` on `undefined` ja `||`-operaattori valitsee oletusarvon 3003.

**Middleware-rekisteröinnit**

```typescript
app.use(express.static(path.resolve(import.meta.dirname, "public")));
app.use("/api/ajopaivakirja", apiAjopaivakirjaRouter);
```

`app.use()` ottaa käyttöön/rekisteröi middlewaren tai reitittimen sovelluksessa. Rekisteröinnit käsitellään järjestyksessä, joten pyyntö käy ensin staattisten tiedostojen kansion läpi ja päätyy sen jälkeen reitittimelle.

`express.static()` tarjoaa `public/`-kansion tiedostot suoraan HTTP-vastauksina. `path.resolve()` muodostaa absoluuttisen polun tiedostojärjestelmässä yhdistämällä nykisen sijainnin `import.meta.dirname` ja kansion nimen `"public"`. `import.meta.dirname` on ES-moduulisyntaksin tapa viitata nykyisen tiedoston hakemistoon. Se korvaa CommonJS:ssä käytetyn `__dirname`-muuttujan, joka ei ole käytettävissä ES-moduuleissa.

`app.use("/api/ajopaivakirja", apiAjopaivakirjaRouter)` liittää reitittimen polkuun `/api/ajopaivakirja`. Tämä tarkoittaa, että kaikki pyynnöt, joiden polku alkaa `/api/ajopaivakirja`, ohjataan reitittimelle käsiteltäväksi. Reitittimen sisäiset polut, kuten `/` ja `/:id`, ovat tämän etuliitteen suhteellisia polkuja.

Eli jos halutaan kutsua ajojen käsittelyn reittejä, pitää hakea osoitetta `http://localhost:3003/api/ajopaivakirja/...` eikä vain `http://localhost:3003/`.

**Palvelimen käynnistys**

```typescript
app.listen(portti, (): void => {
    console.log(`Palvelin käynnistettiin osoitteeseen http://localhost:${portti}`);
});
```

`app.listen()` käynnistää HTTP-palvelimen ja asettaa sen kuuntelemaan yhteyksiä annettuun porttiin. Toinen argumentti on callback-funktio, joka suoritetaan, kun palvelin on valmis vastaanottamaan pyyntöjä. Funktio tulostaa konsolin lokiin osoitteen, josta palvelin on tavoitettavissa.

### Vaihe 8: Staattinen etusivu (public/index.html)

Luodaan `public/`-kansio ja sinne `index.html`. Koska `express.static()` on rekisteröity pääohjelmassa, Express tarjoaa automaattisesti kaikkia `public/`-kansion tiedostoja HTTP-vastauksina. Selain saa `index.html`-tiedoston, kun se tekee GET-pyynnön palvelimen juuriosoitteeseen `http://localhost:3003`.

Tämä etusivu on informatiivinen: sen tarkoitus on kertoa sovelluksen toiminnasta ja siitä, miten rajapintaa testataan esimerkiksi Postman-sovelluksella. Varsinainen REST API -toiminnallisuus ei edellytä etusivua lainkaan.

### Projektin lopullinen rakenne

```
demo03/
├── index.ts                     # Palvelimen käynnistys ja kokoonpano
├── package.json                 # Projektin metatiedot ja riippuvuudet
├── package-lock.json            # Pakettien tarkat versiot (npm:n hallinnoima)
├── tsconfig.json                # TypeScript-kääntäjän asetukset
├── models/
│   └── ajot.ts                  # Tietomalli (interface) ja muistitietokanta
├── routes/
│   └── apiAjopaivakirja.ts      # REST API -päätepisteet
├── public/
│   └── index.html               # Staattinen etusivu
└── node_modules/                # Asennetut paketit (npm:n hallinnoima, ei versionhallintaan)
```

---

## 3. REST API- ja Express-tekniikat

Tässä luvussa esitellään demosovelluksessa käytetyt tekniset ratkaisut lyhyine esimerkkeineen ja käyttötarkoituksineen.

---

### `express()`

Luo uuden Express-sovelluksen. Tämä on koko palvelimen perusta, ja se suoritetaan aina ensimmäisenä.

```typescript
const app: express.Application = express();
```

---

### `express.Router()`

Luo erillisen reitittimen, johon voidaan liittää reittejä. Reitittimen avulla sovelluksen reittejä voidaan jakaa omiin tiedostoihinsa, mikä pitää koodin jäsenneltynä.

```typescript
const router: express.Router = express.Router();
export default router;
```

---

### `app.use()`

Rekisteröi middlewaren tai reitittimen sovellukseen. Se voidaan kiinnittää tiettyyn polkuun tai jättää ilman polkua, jolloin se koskee kaikkia pyyntöjä.

```typescript
// Rekisteröidään reititin polkuun
app.use("/api/ajopaivakirja", apiAjopaivakirjaRouter);

// Rekisteröidään middleware globaalisti
app.use(express.json());
```

---

### `express.json()`

Middleware, joka jäsentää pyyntöjen bodyn JSON-muodosta JavaScript-objektiksi. Se täytyy ottaa käyttöön ennen reittejä, joissa käytetään `req.body`-ominaisuutta, muuten `req.body` on `undefined`.

```typescript
router.use(express.json());
```

---

### `express.static()`

Middleware, joka tarjoaa staattisia tiedostoja, kuten HTML-, CSS- ja JavaScript-tiedostoja, suoraan selaimelle. Kansion polku annetaan absoluuttisena polkuna.

```typescript
app.use(express.static(path.resolve(import.meta.dirname, "public")));
```

`import.meta.dirname` on ES-moduuleissa käytettävä tapa viitata nykyisen tiedoston hakemistoon. Se korvaa CommonJS:ssä käytetyn `__dirname`-muuttujan.

---

### Reittimäärittelyt: `.get()`, `.post()`, `.put()`, `.delete()`

Express-reitit määritellään HTTP-metodia vastaavalla metodilla. Jokaiselle reitille annetaan polku ja käsittelijäfunktio, joka saa parametreikseen pyyntö- (`req`) ja vastausobjektin (`res`).

```typescript
// Kaikki ajot
router.get("/", (req: express.Request, res: express.Response) => {
    res.json(ajot);
});

// Yksi ajo id:llä
router.get("/:id", (req: express.Request, res: express.Response) => {
    // ...
});

// Uusi ajo
router.post("/", (req: express.Request, res: express.Response) => {
    // ...
});

// Muokkaa ajoa
router.put("/:id", (req: express.Request, res: express.Response) => {
    // ...
});

// Poista ajo
router.delete("/:id", (req: express.Request, res: express.Response) => {
    // ...
});
```

---

### `req.params`

Sisältää reitin dynaamiset parametrit. Polun `:id` vastaa `req.params.id`-arvoa. Parametrien arvot ovat aina merkkijonoja, joten ne täytyy tarvittaessa muuntaa oikeaan tietotyyppiin.

```typescript
// Polku: GET /api/ajopaivakirja/5
const id = Number(req.params.id); // "5" -> 5
```

---

### `req.body`

Sisältää pyynnön bodyn tiedot JSON-muotoisesta pyynnöstä jäsennettynä. Käytettävissä vain, kun `express.json()`-middleware on rekisteröity.

```typescript
// POST-pyyntö lähettää bodyssa: { "reitti": "Mikkeli-Juva", "km": 126, "ajaja": "A12" }
const reitti: string = req.body.reitti;
const km: number = Number(req.body.km);
const ajaja: string = req.body.ajaja;
```

---

### `res.json()`

Lähettää vastauksen JSON-muodossa. Asettaa automaattisesti `Content-Type: application/json` -vastausotsikon. Käytetään kaikkiin onnistuneisiin vastauksiin, jotka palauttavat dataa.

```typescript
res.json(ajot);          // Palauttaa koko taulukon
res.json(ajo);           // Palauttaa yhden objektin
res.json({ viesti: "..." }); // Palauttaa viestiobjektin
```

---

### `res.status()`

Asettaa vastauksen HTTP-tilakoodin. Ketjutetaan yleensä `res.json()`-kutsun kanssa. Jos `status()`-kutsua ei käytetä, Express käyttää oletuksena tilakoodia 200.

```typescript
res.status(404).json({ viesti: "Ajoa ei löytynyt" });
res.status(400).json({ viesti: "Virheellinen pyynnön body" });
res.status(201).json(ajot);
```

---

### `app.listen()`

Käynnistää palvelimen kuuntelemaan yhteyksiä tietyssä portissa. Toisena argumenttina annettu callback-funktio suoritetaan, kun palvelin on käynnistynyt.

```typescript
app.listen(3003, (): void => {
    console.log("Palvelin käynnistettiin osoitteeseen http://localhost:3003");
});
```

---

### Taulukko-operaatiot resurssien hallinnassa

Demosovellus käyttää JavaScript-taulukon metodeja ajojen hallintaan muistissa. Tietokantakirjastoissa vastaavat operaatiot toteutetaan SQL-kyselyillä tai ORM-metodeilla, mutta logiikka on sama.

| Metodi | Käyttötarkoitus | Esimerkki |
|--------|----------------|-----------|
| `find()` | Etsii yhden alkion annetun ehdon perusteella. Palauttaa alkion tai `undefined` | `ajot.find(a => a.id === id)` |
| `findIndex()` | Etsii alkion indeksin annetun ehdon perusteella. Palauttaa alkion indeksin tai `-1` | `ajot.findIndex(a => a.id === id)` |
| `push()` | Lisää alkion taulukon loppuun | `ajot.push(uusiAjo)` |
| `splice()` | Poistaa yhden tai useamman alkion tietystä kohtaa | `ajot.splice(index, 1)` (poistaa vain yhden alkion) |
| `map()` | Muodostaa uuden taulukon jokaisesta alkiosta lasketulla arvolla. Voidaan jatkaa callbackilla, jossa uuden taulukon alkioille voidaan tehdä toimenpiteitä. | `ajot.map(a => a.id)` |

---

### HTTP-tilakoodien muistilista

| Tilakoodi | Milloin käytetään |
|-----------|------------------|
| 200 OK | Pyyntö onnistui. Oletusarvo, kun `res.json()` kutsutaan ilman `status()`-kutsua. |
| 201 Created | POST-pyyntö onnistui ja uusi resurssi luotiin. |
| 400 Bad Request | Pyynnön body puuttuu, on virheellisessä muodossa tai sisältää kelvottomia arvoja. |
| 404 Not Found | Pyydettyä resurssia ei löydy, esimerkiksi id:tä vastaavaa tietuetta ei ole olemassa. |
| 500 Internal Server Error | Palvelimella tapahtui odottamaton virhe, jota ei ole erikseen käsitelty. |
