# Demo 7: Asiakassovellus (client)

Tämä on demon 7 React-asiakassovellus, joka kommunikoi Express-palvelimen kanssa JWT-autorisoiduilla API-kutsuilla. Sovellus on ostoslista, johon voidaan lisätä ja poistaa tuotteita.

Vite-projektin alustaminen tyhjästä on kuvattu erillisessä ohjeessa: **[Vite-asennus.md](./Vite-asennus.md)**.

---

## Mikä muuttuu demo 6:sta?

Demossa 6 asiakassovellus teki API-kutsuja ilman tunnistautumista. Demossa 7 palvelin vaatii **JWT-tokenin** jokaisessa pyynnössä. Asiakassovelluksen näkökulmasta tämä tarkoittaa kahta muutosta:

1. Jokaiseen fetch-kutsuun lisätään `Authorization`-header
2. Virhekäsittelyyn lisätään `401 Unauthorized` -statuskoodin tunnistus

Muu sovelluslogiikka (tuotteiden listaus, lisäys, poisto) pysyy samana.

---

## Projektin käynnistys

Palvelimen (`demo07/`) tulee olla käynnissä portissa 3007 ennen asiakassovellusta.

```bash
cd client
npm install
npm run dev
```

Sovellus aukeaa osoitteessa `http://localhost:3000`. Kehityksen aikana käytetään kahta erillistä terminaalia: toista palvelimelle, toista asiakassovellukselle.

---

## Tyyppimäärittelyt

`App.tsx`-tiedoston alussa määritellään kolme TypeScript-interfacea:

```typescript
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

interface FetchAsetukset {
  method: string;
  headers?: Record<string, string>;
  body?: string;
}
```

**`Ostos`** vastaa palvelimen Prisma-mallia. Jokainen ostos sisältää `id`-tunnisteen, `tuote`-nimen ja `poimittu`-tilan (onko tuote poimittu ostoslistalta).

**`ApiData`** on sovelluksen tilamuuttujan tyyppi. Se sisältää kolme kenttää: `ostokset` on taulukko palvelimelta haetuista ostoksista, `virhe` on virheilmoitus (tyhjä merkkijono, jos virhettä ei ole) ja `haettu` kertoo, onko API-kutsu valmistunut. `haettu`-kenttää käytetään latausanimaation näyttämiseen.

**`FetchAsetukset`** tyypittää `fetch()`-funktiolle annettavan asetukset-objektin. Demossa 6 tämä tyypitettiin `any`-tyypillä, mutta tarkempi tyypitys on parempi käytäntö. `Record<string, string>` tarkoittaa objektia, jonka avaimet ja arvot ovat molemmat merkkijonoja.

---

## JWT-tokenin käyttö fetch-kutsuissa

### Token vakiona

```typescript
const TOKEN =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3NDIyMDMzNDh9.0OqTw4sohQE6UdVF8nRAAiMOwNK95mSwPOCbdgLjmgo";
```

Token on tallennettu moduulitason vakioon. Se on luotu palvelinprojektin `luoJWT.js`-skriptillä ja kopioitu tähän manuaalisesti.

> **Huomio:** Tämä on tietoturvariski. Token on näkyvissä asiakassovelluksen lähdekoodissa, joten kuka tahansa selaimen kehittäjätyökaluja osaava löytää sen. Demossa 8 toteutetaan turvallisempi ratkaisu, jossa token luodaan palvelimella kirjautumisen yhteydessä.

### Authorization-header

Jokaiseen fetch-kutsuun lisätään `Authorization`-header:

```typescript
let asetukset: FetchAsetukset = {
  method: metodi || "GET",
  headers: {
    Authorization: `Bearer ${TOKEN}`,
  },
};
```

**`Bearer`** on HTTP-standardin mukainen autentikaatiotyyppi. Se kertoo palvelimelle, että headerin arvo on JWT-token. Muoto on aina `"Bearer "` + token, välilyönnillä erotettuna. Palvelimen JWT-middleware lukee tämän headerin, erottaa tokenin `split(" ")[1]`-kutsulla ja tarkistaa allekirjoituksen.

### Headerin laajentaminen POST-kutsuissa

Kun lähetetään dataa palvelimelle (POST), headeriin lisätään `Content-Type`:

```typescript
if (metodi === "POST") {
  asetukset = {
    ...asetukset,
    headers: {
      ...asetukset.headers!,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(ostos),
  };
}
```

Spread-operaattori (`...`) kopioi olemassa olevat asetukset ja headerit, jolloin `Authorization`-header säilyy ja `Content-Type` lisätään rinnalle. `JSON.stringify()` muuttaa JavaScript-objektin JSON-merkkijonoksi, jotta palvelin voi lukea sen `express.json()`-middlewarella.

---

## fetch-funktio ja API-kutsut

### apiKutsu-funktio

Kaikki API-kutsut kulkevat yhden `apiKutsu`-funktion kautta:

```typescript
const apiKutsu = async (
  metodi?: string,
  ostos?: Ostos,
  id?: number
): Promise<void> => { ... };
```

Funktio on `async`, koska `fetch()` on asynkroninen operaatio, joka palauttaa `Promise`-objektin. `await`-avainsanalla odotetaan vastauksen saapumista ennen jatkamista.

Funktiota kutsutaan eri tavoin riippuen tilanteesta:

| Tilanne | Kutsu | HTTP-metodi | URL |
|---|---|---|---|
| Sivun lataus | `apiKutsu()` | GET | `/api/ostokset` |
| Tuotteen lisäys | `apiKutsu("POST", ostos)` | POST | `/api/ostokset` |
| Tuotteen poisto | `apiKutsu("DELETE", undefined, id)` | DELETE | `/api/ostokset/:id` |

### URL:n muodostaminen

```typescript
const url: string = id
  ? `http://localhost:3007/api/ostokset/${id}`
  : `http://localhost:3007/api/ostokset`;
```

Jos `id` on annettu (DELETE, PUT), se liitetään URL:n perään. Muuten käytetään perus-URL:ää.

### Vastauksen käsittely

```typescript
const yhteys = await fetch(url, asetukset);

if (yhteys.status === 200) {
  setApiData({
    ...apiData,
    ostokset: await yhteys.json(),
    haettu: true,
  });
}
```

`fetch()` palauttaa `Response`-objektin, josta luetaan `status`-koodi ja vastauksen sisältö. `yhteys.json()` parsii JSON-muotoisen vastauksen JavaScript-objektiksi. Tämäkin on asynkroninen operaatio, joten se vaatii `await`-avainsanan.

### Virhekäsittely

Virheitä käsitellään kahdella tasolla:

**HTTP-statuskoodit** (palvelin vastasi, mutta pyyntö epäonnistui):

```typescript
switch (yhteys.status) {
  case 400:
    virheteksti = "Virhe pyynnön tiedoissa";
    break;
  case 401:
    virheteksti = "Virheellinen token";
    break;
  default:
    virheteksti = "Palvelimella tapahtui odottamaton virhe";
    break;
}
```

**Verkkovirhe** (palvelimeen ei saada yhteyttä lainkaan):

```typescript
catch (e: any) {
  setApiData({
    ...apiData,
    virhe: "Palvelimeen ei saada yhteyttä",
    haettu: true,
  });
}
```

`try/catch` nappaa virheet, jotka syntyvät ennen HTTP-vastauksen saapumista: esimerkiksi palvelin ei ole käynnissä tai verkkoyhteydessä on ongelma. `401`-käsittely on uusi demossa 7 ja liittyy JWT-tokenin tarkistukseen.

---

## React-rakenne

### Tilamuuttuja (useState)

```typescript
const [apiData, setApiData] = useState<ApiData>({
  ostokset: [],
  virhe: "",
  haettu: false,
});
```

Koko API-vastaus hallitaan yhdellä tilamuuttujalla, jolla on kolme kenttää. Tämä yksinkertaistaa koodia verrattuna kolmen erillisen tilamuuttujan käyttöön. `haettu: false` on alkutila, jolloin näytetään latausanimaatio.

### Lomakeviittaus (useRef)

```typescript
const lomakeRef = useRef<HTMLFormElement>(null);
```

`useRef` luo viittauksen DOM-elementtiin. Lomakeviittauksella päästään käsiksi lomakkeen kenttien arvoihin ilman erillistä tilamuuttujaa jokaiselle kentälle. Arvo luetaan lomakkeesta: `lomakeRef.current?.uusiTuote.value`.

### Sivun lataus (useEffect)

```typescript
useEffect(() => {
  apiKutsu();
}, []);
```

`useEffect` tyhjällä riippuvuustaulukolla (`[]`) suoritetaan kerran komponentin liittyessä DOM:iin (mount). Se hakee ostoslistan palvelimelta heti, kun sivu avautuu.

### Ehdollinen renderöinti

Sovelluksessa on kolme eri näkymää, jotka valitaan ehdollisesti:

```
apiData.virhe on asetettu?
├── Kyllä → Virheilmoitus (Alert)
└── Ei
    └── apiData.haettu on true?
        ├── Kyllä → Ostoslista + lomake
        └── Ei → Latausanimaatio (Backdrop + CircularProgress)
```

Tämä toteutetaan JSX:ssä ternary-operaattorilla (`? :`). Ensin tarkistetaan virhe, sitten latauksen tila, ja vasta viimeisenä näytetään varsinainen sisältö.

---

## Käytetyt MUI-komponentit

| Komponentti | Rooli sovelluksessa |
|---|---|
| `Container` | Keskittää sisällön ja rajaa maksimileveyden |
| `Typography` | Otsikot (`h5`, `h6`) |
| `Alert` | Virheilmoituksen näyttäminen punaisella pohjalla |
| `List` / `ListItem` / `ListItemText` | Ostoslistan renderöinti |
| `IconButton` + `DeleteIcon` | Poistopainike jokaisen tuotteen rivillä |
| `TextField` | Tekstikenttä uuden tuotteen nimelle |
| `Button` | Lomakkeen lähetyspainike ("Lisää tuote ostoslistaan") |
| `Stack` | Pinoaa lapsikomponentit pystysuunnassa tasavälein (`spacing={2}`) |
| `Backdrop` + `CircularProgress` | Peittää sivun pyörivällä latausanimaatiolla |

`Stack` toimii samalla lomakkeena (`component="form"`), jolloin `onSubmit`-tapahtuma laukeaa enteriä painamalla tai painiketta klikkaamalla.

---

## Tiedostorakenne

```
client/src/
├── App.tsx        # Koko sovelluksen logiikka ja käyttöliittymä
└── main.tsx       # React-sovelluksen liittäminen DOM:iin + Roboto-fontti
```

Demossa 7 koko asiakassovellus on yhdessä `App.tsx`-tiedostossa. Demossa 8 sovellus jaetaan erillisiin komponentteihin (`Login.tsx`, `Ostoslista.tsx`), kun käyttäjänhallinta otetaan käyttöön.
