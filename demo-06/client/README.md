# Demo 6: Ostoslistan asiakassovellus

Ostoslistaa on käytetty demoissa 3-5 Postmanilla kirjoittamalla pyynnöt käsin. Tässä demossa samalle rajapinnalle rakennetaan React-käyttöliittymä. Käyttäjä avaa selaimessa osoitteen `http://localhost:3000` ja näkee ostoslistan, tekstikentän uuden tuotteen lisäämiseen ja roskakorikuvakkeen jokaisen rivin kohdalla. Pyynnön ajan näkymän päällä pyörii latausanimaatio, ja virheestä tulee punainen ilmoitus listan yläpuolelle.

Demo jakautuu kahteen kansioon. `server`-kansion Express-palvelin ja sen REST API käydään läpi [palvelinsovelluksen README:ssä](../server/README.md). Tämä README käsittelee `client`-kansion React-sovellusta, joka on rakennettu Vite-työkalulla. Koko sovelluslogiikka on yhdessä komponentissa, joka hakee ja muokkaa ostoslistaa rajapinnan kautta.

## Sisällysluettelo

- [1 Vite-projektin alustus ja toiminta](#1-vite-projektin-alustus-ja-toiminta)
  - [1.1 Uuden projektin luominen Vitellä](#11-uuden-projektin-luominen-vitellä)
  - [1.2 Miten Viten React-sovellus toimii](#12-miten-viten-react-sovellus-toimii)
- [2 Riippuvuuksien asennus](#2-riippuvuuksien-asennus)
- [3 Oletusprojektiin tehdyt muutokset](#3-oletusprojektiin-tehdyt-muutokset)
  - [3.1 Poistetut tiedostot ja tyylit](#31-poistetut-tiedostot-ja-tyylit)
  - [3.2 Etusivu, kehityspalvelimen portti ja fontit](#32-etusivu-kehityspalvelimen-portti-ja-fontit)
- [4 App.tsx rakenne ja toiminta](#4-apptsx-rakenne-ja-toiminta)
  - [4.1 Tyypit ja rajapinnan osoite](#41-tyypit-ja-rajapinnan-osoite)
  - [4.2 Tilamuuttujat](#42-tilamuuttujat)
  - [4.3 apiKutsu ja fetch](#43-apikutsu-ja-fetch)
  - [4.4 Listan hakeminen sivun avautuessa](#44-listan-hakeminen-sivun-avautuessa)
  - [4.5 Lisääminen ja poistaminen](#45-lisääminen-ja-poistaminen)
  - [4.6 Näkymän rakenne](#46-näkymän-rakenne)
- [5 Sovelluksen käynnistäminen ja testaaminen](#5-sovelluksen-käynnistäminen-ja-testaaminen)
- [6 Lopuksi](#6-lopuksi)

**Projektin asentaminen ja käynnistäminen**

Kun olet kloonannut demon omalle koneellesi, siirry VS Coden Terminalissa demon `client`-kansioon ja asenna riippuvuudet komennolla

```bash
npm ci
```

`npm ci` asentaa täsmälleen `package-lock.json`-tiedostoon kirjatut versiot, joten kaikilla on käytössä samat riippuvuusversiot. Ero `npm install` -komentoon on selitetty [demo 1:n luvussa 2.1](../../demo-01/README.md#21-npm-ci-vs-npm-install).

Käynnistä Viten kehityspalvelin komennolla

```bash
npm run dev
```

Terminaaliin tulostuu painettava linkki osoitteeseen `http://localhost:3000`. Kehityspalvelin sammutetaan `Ctrl+C`-näppäinyhdistelmällä ja käynnistetään uudelleen samalla komennolla.

> [!WARNING]
> Asiakassovellus hakee kaiken datansa demon palvelimelta, joten myös `server`-kansion palvelimen pitää olla käynnissä omassa Terminal-välilehdessään. Palvelimen asennus- ja käynnistysohjeet ovat [palvelinsovelluksen README:ssä](../server/README.md). Ilman käynnissä olevaa palvelinta näkymään tulee ilmoitus "Palvelimeen ei saada yhteyttä".

## 1 Vite-projektin alustus ja toiminta

Vite on rakennustyökalu, jolla React-sovelluksia kehitetään ja julkaistaan. Kehitysvaiheessa Vite ajaa omaa kehityspalvelinta, joka tarjoilee sovelluksen tiedostot selaimelle ja päivittää näkymän heti tiedoston tallennuksen jälkeen. Julkaisua varten Vite kääntää sovelluksen staattisiksi HTML-, CSS- ja JavaScript-tiedostoiksi.

### 1.1 Uuden projektin luominen Vitellä

Tämän demon `client`-kansio on luotu Viten React-TypeScript -mallipohjasta. Vaiheet ovat samat kuin edellisen kurssin ensimmäisessä React-demossa, ja ne perustuvat [Viten dokumentaatioon](https://vite.dev/guide/). Avaa VS Code tyhjään kansioon ja suorita Terminalissa komento

```bash
npm create vite@latest . -- --template react-ts
```

Komento purettuna:

- `npm create vite@latest` luo uuden Vite-projektin uusimmalla saatavilla olevalla versiolla.
- `.` asettaa projektin nimeksi VS Codessa auki olevan kansion nimen. Pisteen tilalle voi kirjoittaa oman nimen, jolloin projekti tulee samannimiseen alikansioon.
- `-- --template react-ts` valitsee mallipohjan, jossa on valmiina React ja TypeScript.

Vite kysyy asennuksen aikana muutamia kysymyksiä, joihin voi vastata oletusarvoilla. Tämän jälkeen riippuvuudet asennetaan komennolla `npm install` ja kehityspalvelin käynnistetään komennolla `npm run dev`. Selaimeen avautuu mallipohjan esimerkkinäkymä.

> [!WARNING]
> `npm create vite@latest` asentaa aina uusimman version, joten itse luotu projekti voi poiketa demosta. Mallipohjan tiedostot ovat muuttuneet Viten versioiden välillä, joten omassa projektissa voi olla eri tiedostoja tai eri asetuksia. Demon versiot on lukittu `package-lock.json`-tiedostoon, ja koko demo ajetaan Node 24 -versiolla, joka on määritetty palvelinprojektin `.nvmrc`-tiedostossa.

### 1.2 Miten Viten React-sovellus toimii

Sovelluksen käynnistyminen selaimessa etenee kolmen tiedoston kautta. Projektin juuressa oleva [`index.html`](./index.html) on sovelluksen ainoa HTML-sivu:

```html
<body>
  <div id="root"></div>
  <script type="module" src="/src/main.tsx"></script>
</body>
```

Sivulla on yksi tyhjä `<div>`-elementti ja viittaus `src/main.tsx`-tiedostoon. Kaikki muu sisältö muodostetaan React-komponenteista tämän `<div>`-elementin sisään.

[`src/main.tsx`](./src/main.tsx) on sovelluksen käynnistyspiste:

```tsx
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
```

`createRoot` hakee `index.html`:n `root`-elementin ja liittää siihen Reactin juuren. `render`-metodille annetut komponentit tulostetaan tämän elementin sisään. Huutomerkki `getElementById`-kutsun perässä on TypeScriptin merkintä siitä, että arvo ei ole `null`.

[`src/App.tsx`](./src/App.tsx) sisältää sovelluksen komponentin, joka viedään `export default`-määrityksellä ja tuodaan `main.tsx`-tiedostoon. Tämän demon sovelluksessa `App` on ainoa komponentti, ja sen sisältö käydään läpi luvussa [4](#4-apptsx-rakenne-ja-toiminta).

Kehitysvaiheessa Viten kehityspalvelin tarjoilee nämä tiedostot selaimelle ja kääntää TypeScript- ja JSX-koodin selaimessa suoritettavaksi JavaScriptiksi. Tiedoston tallennus päivittää selainnäkymän automaattisesti ilman sivun uudelleenlatausta. Komennolla `npm run build` sovelluksesta muodostetaan `dist`-kansioon staattiset tiedostot, joita voi tarjoilla miltä tahansa palvelimelta.

> [!NOTE]
> `StrictMode` on Reactin kehitystilan apuväline, joka suorittaa komponentin ja sen `useEffect`-kutsut kahteen kertaan. Selaimen kehittäjätyökalujen Network-välilehdellä näkyy sen takia kaksi GET-pyyntöä sivun avaamisen yhteydessä. Valmiissa `npm run build` -käännöksessä pyyntö lähtee kertaalleen.

## 2 Riippuvuuksien asennus

Mallipohjan mukana tulevat React ja kehitystyökalut. Tämän demon näkymä on rakennettu Material UI -komponenttikirjastosta, jonka paketit on lisätty projektiin erikseen.

```json
"dependencies": {
  "@emotion/react": "^11.14.0",
  "@emotion/styled": "^11.14.1",
  "@fontsource/roboto": "^5.3.0",
  "@mui/icons-material": "^9.4.0",
  "@mui/material": "^9.4.0",
  "react": "^19.2.8",
  "react-dom": "^19.2.8"
},
"devDependencies": {
  "@types/node": "^24.13.3",
  "@types/react": "^19.2.18",
  "@types/react-dom": "^19.2.7",
  "@vitejs/plugin-react": "^6.1.1",
  "oxlint": "^1.81.0",
  "typescript": "~6.0.2",
  "vite": "^8.3.0"
}
```

- `react` ja `react-dom` ovat Reactin peruskirjastot, joista jälkimmäinen sisältää selainpuolen renderöinnin.
- `@mui/material` on Material UI -komponenttikirjasto, josta näkymä kootaan.
- `@emotion/react` ja `@emotion/styled` ovat tyylikirjastot, joita Material UI vaatii toimiakseen.
- `@mui/icons-material` sisältää valmiit kuvakkeet, joista tässä sovelluksessa käytetään roskakoria.
- `@fontsource/roboto` sisältää Roboto-fontin, jota Material UI käyttää oletuksena.
- `vite` ja `@vitejs/plugin-react` ovat kehityspalvelin ja sen React-tuki.
- `typescript` sekä `@types/react`, `@types/react-dom` ja `@types/node` ovat kääntäjä ja tyyppimäärittelyt.
- `oxlint` on koodin tarkistin, joka ajetaan komennolla `npm run lint`.

Material UI:n paketit asennetaan [MUI:n asennusohjeen](https://mui.com/material-ui/getting-started/installation/) mukaisesti komennolla

```bash
npm install @mui/material @emotion/react @emotion/styled @mui/icons-material @fontsource/roboto
```

Ohje siihen, miten projektiin sopivat paketit ylipäätään valitaan, löytyy [demo 1:n luvusta 2.2](../../demo-01/README.md#22-projektin-riippuvuudet). Kaikki tämän demon versiot on lukittu `package-lock.json`-tiedostoon.

## 3 Oletusprojektiin tehdyt muutokset

Mallipohja luo toimivan esimerkkisovelluksen, jossa on valmis näkymä ja siihen liittyvät tyyli- ja kuvatiedostot. Demossa esimerkkisovellus on purettu pois ja tilalle on kirjoitettu ostoslista.

### 3.1 Poistetut tiedostot ja tyylit

Mallipohjasta on poistettu kolme asiaa:

- tyylitiedostot `src/App.css` ja `src/index.css`
- mallipohjan kuvatiedostot `src/assets`- ja `public`-kansioista
- `App.tsx`-tiedoston oletussisältö, jonka tilalle on kirjoitettu ostoslistan komponentti

Tyylitiedostojen tuonnit on poistettu samalla `main.tsx`- ja `App.tsx`-tiedostoista. Omia CSS-tiedostoja ei tässä demossa tarvita, koska tyylit tulevat Material UI:n komponenteilta (luku [4.6](#46-näkymän-rakenne)).

> [!NOTE]
> `index.html`-tiedostossa on edelleen mallipohjan viittaus kuvakkeeseen `/favicon.svg`, jota `public`-kansiossa ei ole. Selain hakee kuvakkeen turhaan, mikä ei vaikuta sovelluksen toimintaan. Oman kuvakkeen saa näkyviin lisäämällä `public`-kansioon samannimisen tiedoston.

### 3.2 Etusivu, kehityspalvelimen portti ja fontit

`index.html`-tiedostoon on vaihdettu sivun otsikko `Demo 6`, joka näkyy selaimen välilehdessä. Muuten tiedosto on mallipohjan mukainen.

Kehityspalvelimen portti on asetettu tiedostossa [`vite.config.ts`](./vite.config.ts):

```ts
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000
  }
})
```

Viten oletusportti on 5173. Tässä demossa portiksi on asetettu 3000, koska palvelimen CORS-asetuksessa sallittu osoite on `http://localhost:3000` (ks. [palvelinsovelluksen luku 4.1](../server/README.md#41-cors-ja-pyynnöt-toisesta-osoitteesta)). Jos porttia muuttaa, sama muutos tehdään myös palvelimen asetukseen.

`main.tsx`-tiedostoon on lisätty fontin tuonnit:

```tsx
import "@fontsource/roboto/300.css";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";
```

Rivit tuovat Roboto-fontin neljä eri lihavuutta projektin omista riippuvuuksista, joten fonttia ei haeta ulkoiselta palvelimelta. Material UI käyttää Robotoa oletusfonttina. Ilman näitä rivejä selain korvaisi sen omalla oletusfontillaan.

Määritystiedostot ovat mallipohjan mukaisia:

- `tsconfig.json` viittaa kahteen muuhun TypeScript-määritykseen.
- `tsconfig.app.json` koskee `src`-kansion koodia.
- `tsconfig.node.json` koskee tiedostoa `vite.config.ts`.
- `.oxlintrc.json` sisältää oxlintin tarkistussäännöt.

Yksittäisiin asetuksiin voi perehtyä [TypeScriptin dokumentaatiossa](https://www.typescriptlang.org/tsconfig/).

## 4 App.tsx rakenne ja toiminta

Kaikki sovelluksen toiminta on tiedostossa [`src/App.tsx`](./src/App.tsx). Komponentti hakee ostoslistan rajapinnasta, näyttää sen listana ja lähettää lisäykset ja poistot palvelimelle. Käydään tiedosto läpi osissa siinä järjestyksessä, jossa se on kirjoitettu.

### 4.1 Tyypit ja rajapinnan osoite

Tiedoston alussa määritellään tyypit ja rajapinnan osoite:

```tsx
interface Ostos {
  id: number;
  tuote: string;
  poimittu: boolean;
}

interface ApiData {
  ostokset: Ostos[];
  virhe: string;
  haettu: boolean;
}

type Metodi = "GET" | "POST" | "PUT" | "DELETE";

const API_URL = "http://localhost:3006/api/ostokset";
```

`Ostos` kuvaa yhden ostoslistan rivin. Kentät ovat samat kuin palvelimen tietomallissa (ks. [demo 5:n luku 3.2](../../demo-05/README.md#32-tietomalli-schemaprisma-tiedostossa)). Rajapinnasta saapuva JSON on asiakassovelluksen kannalta tyypittämätöntä dataa, joten vastaava tyyppi kirjoitetaan tänne itse.

`ApiData` kokoaa yhteen olioon kolme rajapintaan liittyvää tietoa:

- `ostokset` on rajapinnasta haettu lista.
- `virhe` on käyttäjälle näytettävä virheilmoitus.
- `haettu` on tosi silloin, kun pyyntö on valmis.

`Metodi` rajaa käytettävät HTTP-metodit neljään sallittuun arvoon. Kirjoitusvirhe metodin nimessä näkyy virheilmoituksena jo tiedoston tallennuksen yhteydessä.

`API_URL` on rajapinnan osoite. Arvo on sama koko sovelluksen ajan, joten se määritellään komponentin ulkopuolella vakioksi. Osoite on eri portissa kuin asiakassovellus itse, joten vastauksen lukeminen onnistuu vain palvelimen CORS-otsakkeiden ansiosta (ks. [palvelinsovelluksen luku 4.1](../server/README.md#41-cors-ja-pyynnöt-toisesta-osoitteesta)).

### 4.2 Tilamuuttujat

Komponentissa on kaksi tilamuuttujaa:

```tsx
const [uusiTuote, setUusiTuote] = useState<string>("");

const [apiData, setApiData] = useState<ApiData>({
  ostokset: [],
  virhe: "",
  haettu: false,
});
```

`uusiTuote` seuraa tekstikentän sisältöä. `apiData` sisältää rajapintaan liittyvän tilan yhtenä oliona. Alkuarvossa lista on tyhjä ja `haettu` on `false`, joten ensimmäinen näkymä on tyhjä lista latausanimaation alla.

Kun tila on olio, päivityksessä annetaan aina koko olio uudelleen:

```tsx
setApiData((edellinen) => ({
  ...edellinen,
  haettu: false,
}));
```

`setApiData`-kutsulle annetaan funktio, joka saa parametrina edellisen tilan. Kolme pistettä (`...edellinen`) kopioi olion muut kentät sellaisenaan, ja niiden perään kirjoitetut kentät korvataan uusilla arvoilla. Näin yhden kentän päivitys jättää muut kentät ennalleen. Tätä samaa rakennetta käytetään kaikissa `setApiData`-kutsuissa.

### 4.3 apiKutsu ja fetch

Kaikki rajapintakutsut tehdään yhdellä funktiolla. Alkuosassa muodostetaan pyyntö:

```tsx
const apiKutsu = async (
  metodi: Metodi = "GET",
  ostos?: Ostos,
  id?: number,
): Promise<void> => {
  setApiData((edellinen) => ({
    ...edellinen,
    haettu: false,
  }));

  let url = id !== undefined ? `${API_URL}/${id}` : API_URL;

  let asetukset: RequestInit = { method: metodi };

  if (metodi === "POST") {
    asetukset.headers = { "Content-Type": "application/json" };
    asetukset.body = JSON.stringify(ostos);
  }
```

- Parametreista `metodi` saa oletusarvon `"GET"`. Kysymysmerkki `ostos`- ja `id`-parametrien perässä tekee niistä valinnaisia, koska GET-pyyntö ei tarvitse kumpaakaan.
- Ensimmäinen `setApiData`-kutsu asettaa `haettu`-kentän arvoon `false`, joka tuo latausanimaation näkyviin heti pyynnön alkaessa.
- Osoitteeseen liitetään `/:id` vain silloin, kun `id` on annettu. Vertailu tehdään `undefined`-arvoon, koska pelkkä totuusarvotarkistus jättäisi arvon `0` pois.
- `RequestInit` on selaimen `fetch`-funktion asetusolion tyyppi. Alkuarvoksi asetetaan pyynnön metodi.
- POST-pyynnön mukana lähetetään dataa, joten asetuksiin lisätään `Content-Type: application/json` -otsake ja body. `JSON.stringify` muuttaa olion JSON-merkkijonoksi, jonka palvelimen `express.json()`-middleware jäsentää takaisin olioksi (ks. [demo 3:n luku 6.1](../../demo-03/README.md#61-router-ja-json-pyyntöjen-jäsentäminen)).
- DELETE-pyynnössä ei lähetetä dataa, koska poistettava rivi määräytyy osoitteen id:stä.

Loppuosassa lähetetään pyyntö ja käsitellään vastaus:

```tsx
  try {
    const yhteys = await fetch(url, asetukset);

    if (yhteys.ok) {
      const ostokset: Ostos[] = await yhteys.json();

      setApiData((edellinen) => ({
        ...edellinen,
        ostokset,
        haettu: true,
      }));
    } else {
      let virheViesti: string = "";

      switch (yhteys.status) {
        case 400:
          virheViesti = "Virhe pyynnön tiedoissa";
          break;
        default:
          virheViesti = "Palvelimella tapahtui odottamaton virhe";
          break;
      }

      setApiData((edellinen) => ({
        ...edellinen,
        virhe: virheViesti,
        haettu: true,
      }));
    }
  } catch {
    setApiData((edellinen) => ({
      ...edellinen,
      virhe: "Palvelimeen ei saada yhteyttä",
      haettu: true,
    }));
  }
};
```

`fetch` on selaimen oma funktio HTTP-pyyntöjen lähettämiseen. Se palauttaa Promisen, ja `await`-avainsana keskeyttää funktion suorituksen siihen asti, kunnes vastaus on saapunut. Funktion määrittelyssä oleva `async` tekee `await`-avainsanan käytön mahdolliseksi.

Vastaus käsitellään kolmessa haarassa:

- `yhteys.ok` on tosi, kun statuskoodi on välillä 200-299. Vastauksen JSON jäsennetään `yhteys.json()`-kutsulla ja sijoitetaan `ostokset`-kenttään. Palvelin vastaa jokaiseen muokkaavaan pyyntöön koko ostoslistalla, joten sama käsittely riittää GET-, POST- ja DELETE-pyynnöille (ks. [palvelinsovelluksen luku 5](../server/README.md#5-virheenkäsittely-ja-reitit)).
- `else`-haara suoritetaan, kun palvelin vastaa virhekoodilla. `switch`-rakenteessa valitaan käyttäjälle näytettävä viesti statuskoodin perusteella.
- `catch`-lohko suoritetaan, kun pyyntö ei saa vastausta lainkaan. Näin käy esimerkiksi silloin, kun palvelin ei ole käynnissä tai kun selain estää vastauksen lukemisen CORS-otsakkeiden puuttuessa.

Tyyppimerkintä `const ostokset: Ostos[]` on tarpeellinen, koska `json()`-metodin palautusarvo on tyypitön. Merkinnällä varmistetaan, että arvoa käsitellään ostoslistana muualla koodissa.

Jokaisessa haarassa `haettu` asetetaan takaisin arvoon `true`, joka poistaa latausanimaation näkyvistä. Ilman tätä animaatio jäisi pyörimään virheen jälkeen.

> [!TIP]
> Kaksi kokeilua tähän funktioon:
>
> - Virheilmoitus jää näkyviin sen jälkeen, kun se on kerran asetettu, koska `virhe`-kenttää ei tyhjennetä onnistuneessa haarassa. Lisää onnistuneeseen `setApiData`-kutsuun kenttä `virhe: ""` ja seuraa, miten ilmoitus katoaa seuraavan onnistuneen pyynnön jälkeen.
> - Palvelin lähettää virhevastauksen mukana oman viestinsä JSON-muodossa. Lue se `else`-haarassa `await yhteys.json()` -kutsulla ja näytä vastauksen `virhe`-kenttä käyttäjälle.

### 4.4 Listan hakeminen sivun avautuessa

Ensimmäinen haku lähtee heti, kun komponentti on renderöity ensimmäisen kerran:

```tsx
useEffect(() => {
  apiKutsu();
}, []);
```

`useEffect` suorittaa annetun funktion renderöinnin jälkeen. Toisena argumenttina annettu tyhjä taulukko rajaa suorituksen yhteen kertaan, koska taulukossa ei ole yhtään arvoa, jonka muuttuminen käynnistäisi funktion uudelleen. Ilman tyhjää taulukkoa haku lähtisi joka renderöinnillä, ja jokainen vastaus aiheuttaisi uuden tilapäivityksen ja renderöinnin.

`apiKutsu()` kutsutaan ilman argumentteja, joten oletusarvoilla lähtee GET-pyyntö koko listalle. Kehitystilassa pyyntö lähtee kahdesti `StrictMode`-tilan takia (luku [1.2](#12-miten-viten-react-sovellus-toimii)).

### 4.5 Lisääminen ja poistaminen

Lomakkeen lähetys käsitellään omassa funktiossaan:

```tsx
const lisaaTuote = (e: SubmitEvent<HTMLFormElement>) => {
  e.preventDefault();

  const tuote = uusiTuote.trim();

  apiKutsu("POST", {
    id: 0,
    tuote,
    poimittu: false,
  });

  setUusiTuote("");
};
```

- `e.preventDefault()` estää selaimen oletustoiminnon, jossa lomakkeen lähetys lataisi sivun uudelleen.
- `SubmitEvent<HTMLFormElement>` on Reactin tyyppi lomakkeen lähetystapahtumalle, ja se tuodaan `react`-paketista `type`-avainsanalla. Erikseen määritellyn funktion parametrille tyyppi kirjoitetaan itse, koska päättely onnistuu vain suoraan JSX:ään kirjoitetussa nuolifunktiossa.
- `trim()` poistaa tyhjät merkit tuotteen nimen alusta ja lopusta. Pelkkiä välilyöntejä sisältävä kenttä lähtee palvelimelle tyhjänä merkkijonona, jonka palvelin hylkää statuskoodilla 400.
- Oliossa lähetetään myös `id: 0`, jota palvelin ei käytä, koska uuden rivin id muodostuu tietokannassa (ks. [palvelinsovelluksen luku 5](../server/README.md#5-virheenkäsittely-ja-reitit)).
- `apiKutsu`-kutsua ei odoteta `await`-avainsanalla, joten tekstikenttä tyhjenee heti pyynnön lähdettyä.

Poisto on lyhyempi:

```tsx
const poistaTuote = (ostos: Ostos) => {
  apiKutsu("DELETE", undefined, ostos.id);
};
```

Poistossa ei lähetetä dataa, joten toisen parametrin arvoksi annetaan `undefined` ja kolmanteen kirjoitetaan poistettavan rivin id. Pyyntö menee tällöin osoitteeseen `/api/ostokset/:id`.

> [!TIP]
> Rajapinnassa on myös PUT-reitti, jolla ostoksen `poimittu`-tilaa voi muuttaa. Tämä sovellus käyttää vain GET-, POST- ja DELETE-reittejä, eikä `poimittu`-kenttää näytetä näkymässä. Harjoituksena voi lisätä jokaiselle riville valintaruudun, joka lähettää PUT-pyynnön `apiKutsu`-funktiolla ja kääntää `poimittu`-arvon.

### 4.6 Näkymän rakenne

Näkymä on koottu Material UI -komponenteista, jotka tuodaan `@mui/material`-paketista. Komponenttien mukana tulevat valmiit tyylit.

```tsx
<CssBaseline />
<Container>
  <Typography variant="h5" component="h1" sx={{ marginBottom: 3 }}>
    Demo 6: Ostoslistan asiakassovelluksen toteutus
  </Typography>
```

- `CssBaseline` yhdenmukaistaa selainten oletustyylit.
- `Container` rajaa sisällön keskitettyyn palstaan.
- `Typography` tulostaa tekstin Material UI:n typografiatyyleillä. `variant` valitsee ulkoasun ja `component` määrittää käytettävän HTML-elementin, joten otsikko voi olla ulkoasultaan h5-kokoinen ja silti dokumentin `h1`.
- `sx`-attribuutilla annetaan yksittäiselle komponentille lisätyylejä.

Virheilmoitus tulostetaan ehdollisesti:

```tsx
{apiData.virhe && (
  <Alert severity="error" sx={{ marginBottom: 2 }}>
    {apiData.virhe}
  </Alert>
)}
```

Tyhjä merkkijono on falsy, joten `Alert`-komponentti tulostuu vain silloin, kun `virhe`-kentässä on tekstiä.

Ostoslista muodostetaan `map`-metodilla:

```tsx
<List>
  {apiData.ostokset.map((ostos: Ostos) => {
    return (
      <ListItem
        key={ostos.id}
        secondaryAction={
          <IconButton
            edge="end"
            aria-label={`Poista ${ostos.tuote}`}
            onClick={() => poistaTuote(ostos)}
          >
            <DeleteIcon />
          </IconButton>
        }
      >
        <ListItemText primary={ostos.tuote} />
      </ListItem>
    );
  })}
</List>
```

- Jokaisesta ostoksesta muodostuu yksi `ListItem`, jonka sisällä `ListItemText` tulostaa tuotteen nimen.
- `key`-attribuutin arvona käytetään tietokannan `id`-kenttää. React tarvitsee listan alkioille yksilöivän avaimen näkymän päivittämiseen.
- `secondaryAction` sijoittaa rivin oikeaan reunaan painikkeen, jossa on `@mui/icons-material`-paketista tuotu roskakorikuvake `DeleteIcon`.
- `onClick`-käsittelijä kirjoitetaan nuolifunktioksi, koska `poistaTuote` tarvitsee argumentin. Pelkkä `onClick={poistaTuote(ostos)}` suorittaisi funktion heti renderöinnin yhteydessä.
- `aria-label` antaa kuvakepainikkeelle tekstivastineen ruudunlukijoille, koska painikkeessa ei ole näkyvää tekstiä.

Lisäyslomake on `Stack`-komponentin sisällä:

```tsx
<Stack component="form" onSubmit={lisaaTuote} spacing={2}>
  <TextField
    label="Uusi tuote"
    name="uusiTuote"
    value={uusiTuote}
    onChange={(e) => setUusiTuote(e.target.value)}
    fullWidth
  />

  <Button type="submit" variant="contained" size="large" fullWidth>
    Lisää tuote ostoslistaan
  </Button>
</Stack>
```

- `Stack` asettelee lapsikomponentit allekkain `spacing`-määrityksen mukaisin väleillä. `component="form"` muodostaa siitä HTML:n `<form>`-elementin, jolle voidaan antaa `onSubmit`-käsittelijä.
- `TextField` on ohjattu kenttä, jonka `value` tulee `uusiTuote`-tilamuuttujasta ja `onChange` päivittää sen.
- `Button` on tyypiltään `submit`, joten lomake lähtee sekä painikkeesta että kentässä painetusta Enter-näppäimestä.

Latausanimaatio on näkymän päällimmäisenä:

```tsx
<Backdrop
  open={!apiData.haettu}
  sx={{ color: "#fff", zIndex: (theme) => theme.zIndex.drawer + 1 }}
>
  <CircularProgress color="inherit" />
</Backdrop>
```

`Backdrop` peittää näkymän tummalla kerroksella silloin, kun `open` on tosi. Ehtona on `!apiData.haettu`, joten kerros näkyy pyynnön ollessa kesken ja estää samalla painikkeiden käytön. Kerroksen sisällä on pyörivä `CircularProgress`-animaatio. `zIndex`-arvo lasketaan Material UI:n teemasta, jotta kerros piirtyy muiden komponenttien päälle.

> [!NOTE]
> Palvelimeen on lisätty sekunnin viive jokaiseen pyyntöön, jotta latausanimaatio näkyy paikallisessa kehitysympäristössä (ks. [palvelinsovelluksen luku 4.2](../server/README.md#42-keinotekoinen-viive-vastauksiin)).

## 5 Sovelluksen käynnistäminen ja testaaminen

Käynnistä ensin palvelin `server`-kansiossa ja sen jälkeen asiakassovellus `client`-kansiossa dokumentin alussa kuvatulla tavalla. Avaa selaimessa osoite `http://localhost:3000`. Kokeiltavia asioita on viisi:

- Sivun avaaminen. Latausanimaatio näkyy noin sekunnin ajan, jonka jälkeen listalla ovat tietokannan rivit.
- Tuotteen lisääminen ja poistaminen. Kirjoita nimi tekstikenttään ja paina lisäysnappia. Poista rivi roskakorikuvakkeesta. Lista päivittyy kummassakin tapauksessa palvelimen vastauksesta.
- Tyhjä lisäys. Paina lisäysnappia ilman tekstiä. Palvelin vastaa statuskoodilla 400, ja listan yläpuolelle tulee punainen ilmoitus.
- Pyyntöjen seuraaminen. Avaa kehittäjätyökalut F12-näppäimellä ja valitse Network-välilehti. Lataa sivu uudelleen, jolloin listassa näkyy kaksi GET-pyyntöä (luku [1.2](#12-miten-viten-react-sovellus-toimii)) ja jokaisen pyynnön kesto on noin sekunti.
- Palvelimen sammuttaminen. Sammuta palvelin `Ctrl+C`:llä sen omassa Terminal-välilehdessä ja paina lisäysnappia. Ilmoitukseksi tulee "Palvelimeen ei saada yhteyttä".

Kokeile lopuksi muuttaa jotain tekstiä `App.tsx`-tiedostossa ja tallentaa tiedosto. Selainnäkymä päivittyy heti ilman sivun uudelleenlatausta.

Rajapintaa voi testata edelleen myös Postmanilla, mikä on käyty läpi [palvelinsovelluksen luvussa 6.3](../server/README.md#63-rajapinnan-testaaminen-postmanilla). Komennolla `npm run build` sovellus käännetään `dist`-kansioon ja komennolla `npm run preview` käännettyä versiota voi tarkastella paikallisesti.

## 6 Lopuksi

Demossa rakennettiin React-käyttöliittymä demojen 3-5 ostoslistarajapinnalle. Kolme asiaa toistuu kaikissa rajapintaa käyttävissä sovelluksissa:

- Kaikki rajapintakutsut tehdään yhdellä funktiolla, jolle annetaan metodi ja tarvittavat tiedot.
- Tila jaetaan varsinaiseen dataan, virheilmoitukseen ja tietoon siitä, onko pyyntö kesken.
- Käyttäjälle näytettävä viesti valitaan vastauksen statuskoodin perusteella, ja yhteyden katkeaminen käsitellään erikseen.

Näkymä koottiin Material UI:n valmiista komponenteista, joten omia CSS-tyylejä ei kirjoitettu lainkaan. Sovellus on kokonaan erillinen projekti palvelimesta, ja ainoa yhteys niiden välillä on HTTP-rajapinta osoitteessa `http://localhost:3006/api/ostokset`. Palvelinpuolen toteutus on kuvattu [palvelinsovelluksen README:ssä](../server/README.md).
