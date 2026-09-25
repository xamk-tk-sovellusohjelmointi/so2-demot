# Demo 7: JWT-autorisointi (asiakassovellus)

Ostoslista näyttää käyttäjälle samalta kuin demossa 6. Selaimessa avataan osoite `http://localhost:3000`, ja näkymässä on lista tuotteista, tekstikenttä uuden tuotteen lisäämiseen ja roskakorikuvake jokaisen rivin kohdalla. Ero on siinä, mitä jokaisen pyynnön mukana lähtee. Sovellus liittää pyyntöihinsä tokenin, jota ilman palvelin ei palauta dataa. Jos token puuttuu tai on väärä, lista jää tyhjäksi ja sen yläpuolelle tulee punainen ilmoitus "Virheellinen token".

Demo jakautuu kahteen kansioon. `server`-kansion Express-palvelin, token-tarkistus ja REST API käydään läpi [palvelinsovelluksen README:ssä](../server/README.md). Tämä README käsittelee `client`-kansion React-sovellusta.

Vite-projektin alustus, mallipohjan rakenne ja näkymän Material UI -komponentit on käyty läpi [demo 6:n asiakassovelluksen README:ssä](../../demo-06/client/README.md). Tässä demossa keskitytään siihen, miten sovellus lähettää pyynnöt palvelimelle ja mitä pyynnön mukana kulkee.

## Sisällysluettelo

- [1 Projektin rakenne ja riippuvuudet](#1-projektin-rakenne-ja-riippuvuudet)
- [2 Rajapinnan osoite ja Viten proxy](#2-rajapinnan-osoite-ja-viten-proxy)
- [3 App.tsx rakenne ja toiminta](#3-apptsx-rakenne-ja-toiminta)
  - [3.1 Tyypit ja tilamuuttujat](#31-tyypit-ja-tilamuuttujat)
  - [3.2 Token pyynnön otsakkeissa](#32-token-pyynnön-otsakkeissa)
  - [3.3 Vastauksen käsittely ja virheilmoitukset](#33-vastauksen-käsittely-ja-virheilmoitukset)
  - [3.4 Käyttäjän toiminnot ja näkymä](#34-käyttäjän-toiminnot-ja-näkymä)
- [4 Datan kulku sovelluksen ja palvelimen välillä](#4-datan-kulku-sovelluksen-ja-palvelimen-välillä)
  - [4.1 Listan hakeminen sivun avautuessa](#41-listan-hakeminen-sivun-avautuessa)
  - [4.2 Tuotteen lisääminen](#42-tuotteen-lisääminen)
  - [4.3 Tuotteen poistaminen](#43-tuotteen-poistaminen)
  - [4.4 Pyyntöjen seuraaminen kehittäjätyökaluilla](#44-pyyntöjen-seuraaminen-kehittäjätyökaluilla)
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

> [!WARNING]
> Palvelinprojektin `.env`-tiedoston `JWT_SALAISUUS` pitää olla `SuuriSalaisuus123!!!`, koska tämän sovelluksen koodiin on tallennettu kyseisellä salaisuudella muodostettu token (luku [3.2](#32-token-pyynnön-otsakkeissa)). Muulla arvolla jokainen pyyntö vastataan koodilla `401`.

## 1 Projektin rakenne ja riippuvuudet

Projekti on sama Vite-pohjainen React-projekti kuin demossa 6. Uusia paketteja ei tarvita, koska tokenin lähettämiseen riittää selaimen oma `fetch`-funktio. Riippuvuudet ja Material UI:n asennus on lueteltu [demo 6:n luvussa 2](../../demo-06/client/README.md#2-riippuvuuksien-asennus), ja mallipohjaan tehdyt muutokset [demo 6:n luvussa 3](../../demo-06/client/README.md#3-oletusprojektiin-tehdyt-muutokset).

Kansiossa on neljä tiedostoa, joihin tässä demossa koskettiin:

- [`index.html`](./index.html) on sovelluksen ainoa HTML-sivu, jonka otsikoksi on vaihdettu `Demo 7`
- [`src/main.tsx`](./src/main.tsx) käynnistää Reactin ja tuo Roboto-fontin
- [`src/App.tsx`](./src/App.tsx) sisältää koko sovelluslogiikan (luku [3](#3-apptsx-rakenne-ja-toiminta))
- [`vite.config.ts`](./vite.config.ts) määrittää kehityspalvelimen portin ja pyyntöjen välityksen (luku [2](#2-rajapinnan-osoite-ja-viten-proxy))

`package.json`-tiedostossa on neljä skriptiä. `npm run dev` käynnistää kehityspalvelimen, `npm run build` kääntää sovelluksen `dist`-kansioon, `npm run preview` näyttää käännetyn version paikallisesti ja `npm run lint` ajaa oxlint-tarkistuksen.

Riippuvuusversiot on lukittu `package-lock.json`-tiedostoon, ja koko demo ajetaan Node 24 -versiolla, joka on määritetty palvelinprojektin `.nvmrc`-tiedostossa.

## 2 Rajapinnan osoite ja Viten proxy

Demossa 6 rajapinnan osoite kirjoitettiin `App.tsx`-tiedostoon kokonaisena (`http://localhost:3006/api/ostokset`), ja selain lähetti pyynnöt suoraan palvelimen porttiin. Tässä demossa osoite on suhteellinen.

```tsx
const API_URL = "/api/ostokset";
```

Pyyntö lähtee siihen osoitteeseen, josta sivu itse on ladattu, eli `http://localhost:3000/api/ostokset`. Viten kehityspalvelin välittää `/api`-alkuiset pyynnöt eteenpäin Express-palvelimelle. Välitys määritetään tiedostossa [`vite.config.ts`](./vite.config.ts).

```ts
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      "/api": {
        target: "http://localhost:3007",
        changeOrigin: true
      }
    }
  }
})
```

- `port` asettaa kehityspalvelimen portiksi 3000. Viten oletusportti on 5173.
- `proxy`-olion avain `"/api"` on osoitteen alku, jolla välitettävät pyynnöt tunnistetaan.
- `target` on osoite, johon pyyntö välitetään. Portti 3007 on sama, jota demon Express-palvelin kuuntelee.
- `changeOrigin` muuttaa välitettävän pyynnön `Host`-otsakkeen kohdeosoitteen mukaiseksi.

Selaimen kannalta pyyntö ja vastaus pysyvät samassa alkuperässä, joten palvelimen CORS-otsakkeita ei tarvita. Demossa 6 käytetty `cors`-middleware on tämän takia kommentoitu pois palvelimelta (ks. [palvelinsovelluksen luku 6](../server/README.md#6-asiakassovelluksen-pyynnöt-ja-viten-proxy)).

> [!NOTE]
> Kehittäjätyökalujen Network-välilehdellä pyynnön osoitteena näkyy `http://localhost:3000/api/ostokset`, koska selaimen lähettämä pyyntö menee Viten kehityspalvelimelle. Välitys portista 3000 porttiin 3007 tapahtuu palvelinohjelmien välillä, eikä se näy selaimelle mitenkään.

> [!WARNING]
> Välitys on Viten kehityspalvelimen ominaisuus. `npm run build` -komennolla käännetyssä sovelluksessa sitä ei ole, jolloin suhteellinen osoite `/api/ostokset` osoittaa siihen palvelimeen, joka tarjoilee käännetyt tiedostot. Julkaistussa sovelluksessa sivu ja rajapinta tarjoillaan tämän takia usein samasta osoitteesta.

## 3 App.tsx rakenne ja toiminta

Sovelluksen koko logiikka on tiedostossa [`src/App.tsx`](./src/App.tsx). Rakenne on sama kuin demossa 6, eli yksi komponentti hakee listan rajapinnasta ja lähettää muutokset palvelimelle. Tiedosto on käyty läpi kokonaisuudessaan [demo 6:n luvussa 4](../../demo-06/client/README.md#4-apptsx-rakenne-ja-toiminta), ja tässä keskitytään muuttuneisiin kohtiin.

### 3.1 Tyypit ja tilamuuttujat

Tiedoston alussa määritellään tyypit, joilla rajapinnan dataa käsitellään.

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
```

`Ostos` vastaa palvelimen tietomallin yhtä riviä (ks. [demo 5:n luku 3.2](../../demo-05/README.md#32-tietomalli-schemaprisma-tiedostossa)). Rajapinnasta saapuva JSON on asiakassovelluksen kannalta tyypittämätöntä dataa, joten vastaava tyyppi kirjoitetaan tänne itse.

`ApiData` kokoaa yhteen olioon kolme rajapintaan liittyvää tietoa:

- `ostokset` on rajapinnasta haettu lista
- `virhe` on käyttäjälle näytettävä virheilmoitus
- `haettu` on tosi silloin, kun pyyntö on valmis

Komponentin tilamuuttujat ovat `uusiTuote` tekstikentän sisällölle ja `apiData` rajapinnan tilalle. Olion sisältävän tilan päivitys on selitetty [demo 6:n luvussa 4.2](../../demo-06/client/README.md#42-tilamuuttujat).

### 3.2 Token pyynnön otsakkeissa

Kaikki rajapintakutsut tehdään yhdellä `apiKutsu`-funktiolla. Pyynnön asetuksiin lisätään tässä demossa `Authorization`-otsake.

```tsx
let asetukset: RequestInit = {
  method: metodi,
  headers: {
    Authorization:
      "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3ODk5MTU0MDR9.bkwKknYk10BEbds5vq34kVu4ps2q9950Ub9gOtf-G4o",
  },
};
```

`RequestInit` on `fetch`-funktion asetusolion tyyppi. `headers`-olioon kirjoitetut kentät lähtevät pyynnön mukana HTTP-otsakkeina. `Bearer`-etuliite ja sen perässä oleva välilyönti kuuluvat otsakkeen arvoon, ja palvelin erottaa varsinaisen tokenin vasta etuliitteen jälkeen (ks. [palvelinsovelluksen luku 5.2](../server/README.md#52-tarkistatoken-middleware)).

Otsake asetetaan ennen metodikohtaisia lisäyksiä, joten se lähtee mukaan jokaisessa pyynnössä metodista riippumatta. Palvelimen tarkistus koskee kaikkia pyyntöjä, myös listan hakemista (ks. [palvelinsovelluksen luku 5.3](../server/README.md#53-middlewarejen-järjestys-ja-palvelimen-etusivu)).

POST-pyynnössä asetuksiin lisätään otsake JSON-sisällölle sekä lähetettävä data.

```tsx
if (metodi === "POST") {
  asetukset = {
    ...asetukset,
    headers: {
      ...asetukset.headers,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(ostos),
  };
}
```

Kolme pistettä kopioi aiemmin määritetyn olion sisällön uuteen olioon, jonka perään kirjoitetut kentät lisätään tai korvataan. Sisempi `...asetukset.headers` kopioi vanhat otsakkeet, joten `Authorization` säilyy mukana. Ilman sitä uusi `headers`-olio korvaisi vanhan ja token jäisi POST-pyynnöstä pois. Demossa 6 otsakkeita oli vain yksi, joten siellä riitti suora sijoitus `asetukset.headers = {...}` (ks. [demo 6:n luku 4.3](../../demo-06/client/README.md#43-apikutsu-ja-fetch)).

`JSON.stringify` muuttaa olion JSON-merkkijonoksi, jonka palvelimen `express.json()`-middleware jäsentää takaisin olioksi.

> [!WARNING]
> Token on kirjoitettu suoraan lähdekoodiin vain demoa varten. Selaimeen ladattu JavaScript on kenen tahansa luettavissa kehittäjätyökaluilla, joten tällä tavalla jaettu token ei pysy salassa. Oikeassa sovelluksessa token haetaan palvelimelta kirjautumisen yhteydessä, mihin tutustutaan demossa 8. Uuden tokenin voi muodostaa palvelinprojektin skriptillä (ks. [palvelinsovelluksen luku 5.4](../server/README.md#54-tokenin-luominen-luojwtmjs-skriptillä)).

### 3.3 Vastauksen käsittely ja virheilmoitukset

Vastaus käsitellään kolmessa haarassa samalla tavalla kuin demossa 6. Onnistuneesta vastauksesta jäsennetään lista, virhekoodista valitaan käyttäjälle näytettävä viesti ja `catch`-lohko suoritetaan silloin, kun vastausta ei saada lainkaan. Uutta on virheviestin valinnassa oleva `case 401`.

```tsx
let virheViesti: string = "";

switch (yhteys.status) {
  case 400:
    virheViesti = "Virhe pyynnön tiedoissa";
    break;
  case 401:
    virheViesti = "Virheellinen token";
    break;
  default:
    virheViesti = "Palvelimella tapahtui odottamaton virhe";
    break;
}
```

Viestit vastaavat palvelimen tilakoodeja:

- `400` tulee reitiltä silloin, kun pyynnön body ei kelpaa, esimerkiksi tyhjällä tuotteen nimellä
- `401` tulee token-tarkistuksesta silloin, kun `Authorization`-otsake puuttuu tai token ei kelpaa
- muut virhekoodit, kuten olemattoman rivin poistamisesta tuleva `404`, näkyvät oletusviestinä
- `catch`-lohkon viesti "Palvelimeen ei saada yhteyttä" tulee silloin, kun palvelin ei ole käynnissä

Palvelin lähettää 401-vastauksen tyhjänä ilman viestiä, joten sovellus muodostaa näytettävän tekstin itse tilakoodin perusteella. Sama koskee muitakin virheitä, koska palvelimen vastauksen `virhe`-kenttää ei tässä sovelluksessa lueta.

### 3.4 Käyttäjän toiminnot ja näkymä

Käyttäjän toiminnot kutsuvat samaa `apiKutsu`-funktiota eri argumenteilla:

- `useEffect` hakee listan kerran sivun avautuessa, ks. [demo 6:n luku 4.4](../../demo-06/client/README.md#44-listan-hakeminen-sivun-avautuessa)
- `lisaaTuote` lähettää lomakkeen sisällön POST-pyynnöllä, ks. [demo 6:n luku 4.5](../../demo-06/client/README.md#45-lisääminen-ja-poistaminen)
- `poistaTuote` lähettää DELETE-pyynnön rivin id:llä

Näkymä on koottu Material UI -komponenteista, ja sen rakenne on selitetty [demo 6:n luvussa 4.6](../../demo-06/client/README.md#46-näkymän-rakenne). Tähän demoon on vaihdettu vain otsikon teksti `Demo 7: JWT-autorisointi`.

> [!NOTE]
> Latausanimaatio toimii kuten demossa 6, mutta se välähtää näkyviin vain hetkeksi. Palvelimelta on poistettu demon 6 sekunnin viive, ja paikallinen pyyntö valmistuu muutamassa millisekunnissa (ks. [palvelinsovelluksen luku 5](../server/README.md#5-jwt-autorisointi-palvelimella)).

## 4 Datan kulku sovelluksen ja palvelimen välillä

Sovelluksen näkymä muodostuu aina palvelimen viimeisimmästä vastauksesta. Tässä luvussa seurataan, mitä selaimen ja palvelimen välillä liikkuu kussakin toiminnossa. Rajapinnan reitit on lueteltu [palvelinsovelluksen luvussa 3](../server/README.md#3-tietokanta-reitit-ja-virheenkäsittely).

### 4.1 Listan hakeminen sivun avautuessa

Ensimmäinen pyyntö lähtee heti, kun komponentti on renderöity ensimmäisen kerran. Vaiheet ovat:

1. `useEffect` kutsuu `apiKutsu`-funktiota ilman argumentteja, jolloin metodiksi tulee oletusarvo `GET` ja osoitteeksi `API_URL`.
2. `haettu`-kenttä asetetaan arvoon `false`, joka tuo latausanimaation näkyviin.
3. Selain lähettää pyynnön osoitteeseen `http://localhost:3000/api/ostokset` ja liittää mukaan `Authorization`-otsakkeen.
4. Viten kehityspalvelin välittää pyynnön osoitteeseen `http://localhost:3007/api/ostokset`.
5. Palvelimen token-tarkistus hyväksyy tokenin ja päästää pyynnön reitille.
6. Reitti hakee rivit tietokannasta ja vastaa JSON-taulukolla.

```json
[
  { "id": 1, "tuote": "Leipää", "poimittu": false },
  { "id": 2, "tuote": "Kahvia", "poimittu": false },
  { "id": 10, "tuote": "Maitoa", "poimittu": false }
]
```

7. `yhteys.ok` on tosi, joten vastaus jäsennetään `Ostos[]`-taulukoksi ja sijoitetaan `ostokset`-kenttään. Samalla `haettu` saa arvon `true`, latausanimaatio katoaa ja React muodostaa listan uudelleen.

`id`-arvot eivät ole välttämättä peräkkäisiä, koska poistetun rivin numeroa ei anneta uudelleen. Sovellus käyttää arvoa sellaisenaan listan `key`-attribuutissa ja poistopyynnön osoitteessa.

### 4.2 Tuotteen lisääminen

Lomakkeen lähetys kutsuu `lisaaTuote`-funktiota, joka muodostaa lähetettävän olion ja antaa sen `apiKutsu`-funktiolle. Pyynnön mukana lähtee body.

```json
{ "id": 0, "tuote": "Kaurajuomaa", "poimittu": false }
```

- `id`-kentän arvo `0` lähtee mukana, mutta palvelimen reitti lukee bodysta vain kentät `tuote` ja `poimittu`. Uuden rivin `id` muodostuu tietokannassa.
- `poimittu` lähtee arvolla `false`, koska uutta tuotetta ei ole vielä poimittu. Sovelluksen näkymässä kenttää ei käytetä mihinkään.
- Palvelin vastaa koko ostoslistalla, jossa uusi rivi on mukana. Vastaus korvaa `ostokset`-kentän, joten erillistä GET-pyyntöä ei tarvita.

Tyhjänä lähetetty lomake päätyy palvelimelle tyhjänä merkkijonona. Myös pelkkiä välilyöntejä sisältävä kenttä lähtee tyhjänä, koska `trim()` poistaa ne. Palvelin vastaa tällöin koodilla `400` ja viestillä `{"virhe":"Virheellinen pyynnön body"}`, josta sovellus näyttää oman ilmoituksensa "Virhe pyynnön tiedoissa".

### 4.3 Tuotteen poistaminen

Roskakoripainike kutsuu `poistaTuote`-funktiota, joka välittää rivin id:n eteenpäin.

```tsx
const poistaTuote = (ostos: Ostos) => {
  apiKutsu("DELETE", undefined, ostos.id);
};
```

Toisen parametrin arvo `undefined` jättää bodyn pois, koska poistettava rivi määräytyy osoitteesta. Pyyntö menee osoitteeseen `/api/ostokset/10`, jos rivin id on 10. Palvelin poistaa rivin ja vastaa koko listalla ilman poistettua riviä, jonka jälkeen näkymä muodostuu uudelleen vastauksesta.

Olemattoman rivin poistoon palvelin vastaa koodilla `404`, jolloin näkymään tulee ilmoitus "Palvelimella tapahtui odottamaton virhe". Näin käy esimerkiksi silloin, kun sama sivu on auki kahdessa välilehdessä ja rivi on jo poistettu toisesta.

### 4.4 Pyyntöjen seuraaminen kehittäjätyökaluilla

Pyynnöt ja vastaukset saa näkyviin selaimen kehittäjätyökaluista:

- Avaa työkalut F12-näppäimellä ja valitse Network-välilehti.
- Lataa sivu uudelleen. Listaan ilmestyy kaksi `ostokset`-nimistä pyyntöä, koska `StrictMode` suorittaa `useEffect`-kutsun kehitystilassa kahteen kertaan (ks. [demo 6:n luku 1.2](../../demo-06/client/README.md#12-miten-viten-react-sovellus-toimii)).
- Valitse pyyntö listasta. Headers-välilehden Request Headers -osiossa näkyy lähetetty `Authorization`-otsake, ja Response-välilehdellä on palvelimen palauttama JSON.
- Lisää tai poista tuote. Listaan ilmestyy uusi POST- tai DELETE-pyyntö, jonka vastauksena on koko ostoslista.

## 5 Sovelluksen käynnistäminen ja testaaminen

Käynnistä ensin palvelin `server`-kansiossa ja sen jälkeen asiakassovellus `client`-kansiossa dokumentin alussa kuvatulla tavalla. Avaa selaimessa osoite `http://localhost:3000`. Kokeiltavia asioita on viisi:

- Sivun avaaminen. Listalla näkyvät tietokannan rivit.
- Tuotteen lisääminen ja poistaminen. Lista päivittyy kummassakin tapauksessa palvelimen vastauksesta.
- Tyhjä lisäys. Paina lisäysnappia ilman tekstiä, jolloin listan yläpuolelle tulee punainen ilmoitus.
- Tokenin rikkominen. Muuta `App.tsx`-tiedostossa olevan tokenin viimeinen merkki toiseksi ja tallenna tiedosto. Näkymä päivittyy heti, lista tyhjenee ja ilmoitukseksi tulee "Virheellinen token". Palauta merkki kokeilun jälkeen.
- Palvelimen sammuttaminen. Sammuta palvelin `Ctrl+C`:llä sen omassa Terminal-välilehdessä ja paina lisäysnappia. Ilmoitukseksi tulee "Palvelimeen ei saada yhteyttä".

> [!TIP]
> Kokeile harjoituksena poistaa koko `headers`-osa `asetukset`-oliosta ja tallentaa tiedosto. Sivun lataamisen jälkeen jokainen pyyntö vastataan koodilla `401`, koska palvelin vaatii `Authorization`-otsakkeen kaikilta pyynnöiltä. Otsakkeen puuttuminen näkyy Network-välilehden Request Headers -osiossa. Palauta otsakkeet kokeilun jälkeen.

Rajapintaa voi testata myös ilman asiakassovellusta Postmanilla, mikä on käyty läpi [palvelinsovelluksen luvussa 7.3](../server/README.md#73-rajapinnan-testaaminen-postmanilla).

## 6 Lopuksi

Asiakassovelluksen näkymä ja sovelluslogiikka säilyivät demosta 6. Muutoksia tuli kolmeen kohtaan:

- Jokaiseen pyyntöön liitetään `Authorization`-otsake, jossa token kulkee `Bearer`-etuliitteen perässä.
- Rajapinnan osoite on suhteellinen, ja pyynnöt kulkevat Viten kehityspalvelimen kautta Express-palvelimelle.
- Virheviesteihin lisättiin tilakoodi `401` omalla ilmoituksellaan.

Datan kulku on jokaisessa toiminnossa samanlainen. Käyttäjän toiminto kutsuu `apiKutsu`-funktiota, pyyntö lähtee tokenin kanssa palvelimelle ja vastauksena tuleva koko ostoslista korvaa sovelluksen tilan. Näkymä muodostetaan aina tästä tilasta, joten selaimen näyttämä lista vastaa tietokannan sisältöä viimeisimmän vastauksen mukaisena.

Token on tässä demossa kiinteä merkkijono sovelluksen koodissa, eikä pyynnön lähettäjää tunnisteta mitenkään. Demossa 8 siirrytään käyttäjänhallintaan, jossa token haetaan palvelimelta kirjautumisen yhteydessä. Palvelinpuolen toteutus on kuvattu [palvelinsovelluksen README:ssä](../server/README.md).
