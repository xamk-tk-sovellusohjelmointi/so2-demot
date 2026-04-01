# Demo 8: Asiakassovellus (client)

Tämä on demon 8 React-asiakassovellus, joka kommunikoi Express-palvelimen kanssa JWT-autorisoiduilla API-kutsuilla. Sovelluksessa on kirjautumissivu ja ostoslistanäkymä, joiden välillä navigoidaan React Routerilla.

Vite-projektin alustaminen tyhjästä on kuvattu erillisessä ohjeessa: **[Vite-asennus.md](./Vite-asennus.md)**.

---

## Mikä muuttuu demo 7:stä?

Demossa 7 JWT-token oli kovakoodattu asiakassovelluksen lähdekoodiin. Demossa 8 token saadaan palvelimelta kirjautumisen yhteydessä. Tämä tuo mukanaan useita muutoksia:

| Ominaisuus | Demo 7 | Demo 8 |
|---|---|---|
| Token | Kovakoodattu vakio `TOKEN` | Palvelimelta kirjautumisen yhteydessä |
| Tokenin tallennus | Ei tarvetta | `localStorage` |
| Reititys | Ei (yksi näkymä) | React Router (`/` ja `/login`) |
| Komponentit | Kaikki `App.tsx`:ssä | `Login.tsx` ja `Ostoslista.tsx` erikseen |
| 401-käsittely | Virheilmoitus | Uudelleenohjaus kirjautumissivulle |

---

## Projektin käynnistys

Palvelimen (`demo08/server/`) tulee olla käynnissä portissa 3008 ennen asiakassovellusta.

```bash
cd client
npm install
npm run dev
```

Sovellus aukeaa osoitteessa `http://localhost:3000`. Kehityksen aikana käytetään kahta erillistä terminaalia: toista palvelimelle, toista asiakassovellukselle.

---

## Uudet riippuvuudet

Demossa 7 käytettyjen MUI-pakettien lisäksi asennetaan:

```bash
npm install react-router-dom
```

| Paketti | Tarkoitus |
|---|---|
| `react-router-dom` | Sivunvaihto (reititys) React-sovelluksessa ilman sivun uudelleenlatausta |

---

## Reititys (React Router)

### BrowserRouter

React Router otetaan käyttöön käärimällä `App`-komponentti `BrowserRouter`-komponenttiin `main.tsx`-tiedostossa:

```typescript
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';
import App from './App.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
```

`BrowserRouter` tarjoaa reititysympäristön kaikille lapsikomponenteille. Se käyttää selaimen History API:a URL:n hallintaan, jolloin sivunvaihto tapahtuu ilman koko sivun uudelleenlatausta.

### Reittien määrittely App.tsx:ssä

```typescript
import React, { useState } from 'react';
import { Container, Typography } from '@mui/material';
import { Route, Routes } from 'react-router-dom';
import Ostoslista from './components/Ostoslista.tsx';
import Login from './components/Login.tsx';

const App: React.FC = (): React.ReactElement => {
  const [token, setToken] = useState<string>(localStorage.getItem('token') ?? '');

  return (
    <Container>
      <Typography variant="h5">Demo 8: Käyttäjähallinta</Typography>
      <Typography variant="h6" sx={{ marginBottom: 2, marginTop: 2 }}>Ostoslista</Typography>

      <Routes>
        <Route path="/" element={<Ostoslista token={token} />} />
        <Route path="/login" element={<Login setToken={setToken} />} />
      </Routes>
    </Container>
  );
};

export default App;
```

**`Routes`** ja **`Route`** määrittelevät, mikä komponentti näytetään kullakin URL-polulla:

| Polku | Komponentti | Kuvaus |
|---|---|---|
| `/` | `Ostoslista` | Ostoslista (vaatii tokenin) |
| `/login` | `Login` | Kirjautumislomake |

**`token`-tilamuuttuja** alustetaan `localStorage`-arvosta. Näin token säilyy selaimen päivityksen yli. `?? ''` varmistaa, ettei arvo ole `null`, jos `localStorage` on tyhjä.

**Props-jako:** `Ostoslista` saa `token`-arvon luettavakseen, ja `Login` saa `setToken`-funktion, jolla se voi tallentaa uuden tokenin onnistuneen kirjautumisen jälkeen.

---

## Login-komponentti

Luodaan `src/components/Login.tsx`:

```typescript
import React, { useRef } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { Backdrop, Box, Button, Paper, Stack, TextField, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import type { NavigateFunction } from 'react-router-dom';

interface Props {
  setToken: Dispatch<SetStateAction<string>>;
}

const Login: React.FC<Props> = ({ setToken }: Props): React.ReactElement => {
  const navigate: NavigateFunction = useNavigate();
  const lomakeRef = useRef<HTMLFormElement>(null);

  const kirjaudu = async (e: React.SyntheticEvent): Promise<void> => {
    e.preventDefault();
    const lomake = lomakeRef.current;
    if (!lomake) return;

    const kayttajatunnus = (lomake.elements.namedItem('kayttajatunnus') as HTMLInputElement).value;
    const salasana = (lomake.elements.namedItem('salasana') as HTMLInputElement).value;

    if (!kayttajatunnus || !salasana) return;

    const yhteys = await fetch('http://localhost:3008/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kayttajatunnus, salasana }),
    });

    if (yhteys.status === 200) {
      const { token } = await yhteys.json() as { token: string };
      setToken(token);
      localStorage.setItem('token', token);
      void navigate('/');
    }
  };

  // ...JSX
};
```

### Kirjautumisen kulku

1. Käyttäjä täyttää lomakkeen ja painaa "Kirjaudu"
2. `kirjaudu`-funktio lähettää `POST`-pyynnön `/api/auth/login`-reitille
3. Jos palvelin palauttaa `200`, vastauksen `token`-kenttä tallennetaan:
   - React-tilaan (`setToken`) — komponentit päivittyvät välittömästi
   - `localStorage`-tallennustilaan — token säilyy selaimen päivityksen yli
4. `navigate('/')` ohjaa käyttäjän ostoslistanäkymään

### Tyyppien importit

```typescript
import React, { useRef } from 'react';
import type { Dispatch, SetStateAction } from 'react';
```

`Dispatch` ja `SetStateAction` ovat TypeScript-tyyppejä, jotka eivät sisällä ajonaikaista koodia. `verbatimModuleSyntax`-asetus edellyttää, että tällaiset importit merkitään `import type` -avainsanalla. Tämä koskee myös `NavigateFunction`-tyyppiä `react-router-dom`-paketista.

### Props-destrukturointi

```typescript
const Login: React.FC<Props> = ({ setToken }: Props): React.ReactElement => {
```

Props-objekti destrukturoidaan suoraan funktion parametrissa. Tämä on selkeämpää kuin `props.setToken`, koska tarvittavat propsit näkyvät suoraan funktion allekirjoituksessa.

---

## Ostoslista-komponentti

### Tyyppimäärittelyt

`src/components/Ostoslista.tsx`:n alussa määritellään kolme interfacea:

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

interface Props {
  token: string;
}
```

**`Ostos`** vastaa palvelimen Prisma-mallia. **`ApiData`** hallitsee sovelluksen tilaa: `ostokset` on taulukko, `virhe` on mahdollinen virheilmoitus ja `haettu` kertoo, onko API-kutsu valmistunut. **`Props`** ottaa vastaan `token`-merkkijonon, jota käytetään API-kutsujen `Authorization`-headerissa.

> **Huomio:** Demossa 7 käytettiin `fetchAsetukset`-interfacea (jossa `any`-tyyppi) fetch-asetusten tyypitykseen. Demossa 8 käytetään sen sijaan TypeScriptin sisäänrakennettua `RequestInit`-tyyppiä, joka on `fetch()`-funktion virallinen asetustyyppi.

### API-kutsu ja 401-uudelleenohjaus

```typescript
const apiKutsu = async (metodi?: string, ostos?: Ostos, id?: number): Promise<void> => {
    setApiData((prev) => ({ ...prev, haettu: false }));

    const url = id
      ? `http://localhost:3008/api/ostokset/${id}`
      : 'http://localhost:3008/api/ostokset';

    let asetukset: RequestInit = {
      method: metodi ?? 'GET',
      headers: { Authorization: `Bearer ${token}` },
    };

    // POST-kutsuissa lisätään Content-Type ja body
    if (metodi === 'POST') {
      asetukset = {
        ...asetukset,
        headers: {
          ...(asetukset.headers as Record<string, string>),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(ostos),
      };
    }

    try {
      const yhteys = await fetch(url, asetukset);

      if (yhteys.status === 200 || yhteys.status === 201) {
        const data: Ostos[] = await yhteys.json() as Ostos[];
        setApiData({ ostokset: data, virhe: '', haettu: true });
      } else {
        if (yhteys.status === 401) {
          void navigate('/login');
          return;
        }
        let virheteksti: string;
        switch (yhteys.status) {
          case 400: virheteksti = 'Virhe pyynnön tiedoissa'; break;
          default: virheteksti = 'Palvelimella tapahtui odottamaton virhe'; break;
        }
        setApiData((prev) => ({ ...prev, virhe: virheteksti, haettu: true }));
      }
    } catch {
      setApiData((prev) => ({ ...prev, virhe: 'Palvelimeen ei saada yhteyttä', haettu: true }));
    }
};
```

**Keskeiset erot demo 7:ään verrattuna:**

**401-uudelleenohjaus:** Demossa 7 `401`-virhe näytettiin virheilmoituksena ("Virheellinen token"). Demossa 8 käyttäjä ohjataan automaattisesti kirjautumissivulle `navigate('/login')`-kutsulla. Tämä on loogisempaa, koska käyttäjä voi kirjautua uudelleen.

**Token propsista:** Demossa 7 token oli kovakoodattu vakio. Demossa 8 se tulee `Props`-objektista, jonka `App`-komponentti välittää.

**`RequestInit`-tyyppi:** Selaimen standardityyppi fetch-asetuksille. Se on tarkempi ja ylläpidettävämpi kuin oma `fetchAsetukset`-interface.

**Funktionaalinen tilanpäivitys:** `setApiData((prev) => ({ ...prev, haettu: false }))` käyttää callback-muotoa, joka saa edellisen tilan parametrina. Tämä on turvallisempi kuin suora `setApiData({ ...apiData, ... })`, koska se varmistaa, ettei vanhentunut tila-arvo ylikirjoita rinnakkaista päivitystä.

---

## React-rakenne

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

### Sivun lataus (useEffect)

```typescript
useEffect(() => {
  void apiKutsu();
}, []);
```

Kun `Ostoslista`-komponentti liitetään DOM:iin, se hakee ostokset palvelimelta heti. Jos token on virheellinen tai puuttuu, palvelin palauttaa `401` ja käyttäjä ohjataan kirjautumissivulle.

### Lomakeviittaus (useRef)

```typescript
const lomakeRef = useRef<HTMLFormElement>(null);
```

`useRef` luo viittauksen lomakkeen DOM-elementtiin. Uuden tuotteen nimi luetaan lomakkeesta `namedItem`-metodilla:

```typescript
const uusiTuote = (lomake.elements.namedItem('uusiTuote') as HTMLInputElement).value;
```

---

## Käytetyt MUI-komponentit

| Komponentti | Rooli sovelluksessa |
|---|---|
| `Container` | Keskittää sisällön ja rajaa maksimileveyden (`App.tsx`) |
| `Typography` | Otsikot ja teksti |
| `Alert` | Virheilmoituksen näyttäminen punaisella pohjalla |
| `List` / `ListItem` / `ListItemText` | Ostoslistan renderöinti |
| `IconButton` + `DeleteIcon` | Poistopainike jokaisen tuotteen rivillä |
| `TextField` | Tekstikentät (uusi tuote, käyttäjätunnus, salasana) |
| `Button` | Lomakkeiden lähetyspainikkeet |
| `Stack` | Pinoaa lapsikomponentit pystysuunnassa tasavälein |
| `Backdrop` + `CircularProgress` | Peittää sivun pyörivällä latausanimaatiolla |
| `Paper` + `Box` | Kirjautumislomakkeen kehys ja asettelu |

---

## Tiedostorakenne

```
client/src/
├── components/
│   ├── Login.tsx          # Kirjautumislomake
│   └── Ostoslista.tsx     # Ostoslista ja tuotteiden hallinta
├── App.tsx                # Reititys ja token-tilan hallinta
└── main.tsx               # React-sovelluksen liittäminen DOM:iin + BrowserRouter
```

Demossa 7 koko asiakassovellus oli yhdessä `App.tsx`-tiedostossa. Demossa 8 sovellus on jaettu erillisiin komponentteihin: `App.tsx` vastaa reitityksestä ja token-tilasta, `Login.tsx` kirjautumisesta ja `Ostoslista.tsx` ostoslistan hallinnasta.
