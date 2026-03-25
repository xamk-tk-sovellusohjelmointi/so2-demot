# Demo 7: Asiakassovellus — JWT-autorisointi

## 1. Asiakassovelluksen rooli

Demo 7:n asiakassovellus on React-sovellus, joka kommunikoi Express-palvelimen kanssa JWT-autorisoinnin kautta. Toiminnallisesti sovellus on identtinen demo 6:n ostoslistasovelluksen kanssa, mutta jokainen palvelimelle lähtevä pyyntö sisältää nyt `Authorization`-headerin JWT-tokenilla.

Ilman oikeaa tokenia palvelin hylkää pyynnön statuskoodilla 401, ja käyttäjälle näytetään virheilmoitus.

Sovellus rakentuu seuraavista teknologioista:

| Teknologia          | Käyttötarkoitus                                |
|---------------------|------------------------------------------------|
| React 19            | Käyttöliittymäkomponentit ja tilan hallinta    |
| TypeScript          | Tyyppiturvallisuus                             |
| Vite 8              | Kehityspalvelin ja bundlaus                    |
| MUI (Material UI)   | Valmiit UI-komponentit                         |

---

## 2. Projektin rakenne

```
client/
├── public/
│   └── favicon.svg
├── src/
│   ├── App.tsx          ← sovelluksen pääkomponentti, kaikki logiikka tässä
│   ├── main.tsx         ← React-sovelluksen käynnistyspiste
│   ├── App.css          ← Vite-pohjan tyylit (ei käytössä omassa koodissa)
│   └── index.css        ← globaalit tyylit
├── index.html           ← HTML-pohja
├── vite.config.ts       ← Vite-konfiguraatio (portti 3000)
├── tsconfig.json        ← TypeScript-konfiguraatioviittaukset
├── tsconfig.app.json    ← TypeScript-asetukset sovelluskoodille
├── tsconfig.node.json   ← TypeScript-asetukset Node-ympäristölle (vite.config.ts)
└── eslint.config.js     ← ESLint-asetukset
```

---

## 3. Demosovelluksen rakentuminen vaihe vaiheelta

### Vaihe 1: Vite-projektin alustaminen

Luodaan uusi React + TypeScript -projekti Viten avulla:

```bash
mkdir demo07/client
cd demo07/client
npm create vite@latest . -- --template react-ts
```

Komento luo kansiorakenteen, `package.json`:n ja kaikki konfiguraatiotiedostot automaattisesti.

### Vaihe 2: MUI-pakettien asentaminen

Asennetaan Material UI ja sen riippuvuudet sekä Roboto-fontti:

```bash
npm install @mui/material @emotion/react @emotion/styled
npm install @mui/icons-material
npm install @fontsource/roboto
```

Asennuksen jälkeen `package.json`:n `dependencies`-osio näyttää tältä:

```json
{
  "dependencies": {
    "@emotion/react": "^11.x.x",
    "@emotion/styled": "^11.x.x",
    "@fontsource/roboto": "^5.x.x",
    "@mui/icons-material": "^7.x.x",
    "@mui/material": "^7.x.x",
    "react": "^19.x.x",
    "react-dom": "^19.x.x"
  }
}
```

### Vaihe 3: Vite-konfiguraatio (vite.config.ts)

Asetetaan kehityspalvelimelle kiinteä portti, jotta se täsmää palvelimen CORS-asetuksiin:

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000
  }
})
```

Palvelimen CORS-asetus sallii yhteydet osoitteesta `http://localhost:3000`, joten portin täytyy olla sama. Ilman kiinteää porttia Vite saattaa käynnistyä eri portissa.

### Vaihe 4: Käynnistyspiste (main.tsx)

Päivitetään `main.tsx` tuomaan Roboto-fontti ennen sovelluksen renderöintiä:

```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/roboto/300.css'
import '@fontsource/roboto/400.css'
import '@fontsource/roboto/500.css'
import '@fontsource/roboto/700.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

Roboto-fontti tuodaan `@fontsource/roboto`-paketista neljällä eri paksuudella (300, 400, 500, 700), joita MUI-komponentit käyttävät.

### Vaihe 5: Pääkomponentti (App.tsx)

Tämä on sovelluksen ainoa komponentti. Se sisältää kaiken logiikan: tilan hallinnan, API-kutsut ja käyttöliittymän.

#### 5.1 Tyypimäärittelyt ja JWT-token

```tsx
// Token, joka on generoitu luoJWT.js-ohjelmalla palvelimen salaisella avaimella.
// Oikeassa sovelluksessa token tulisi palvelimelta kirjautumisen jälkeen, ei koodiin kovakoodattuna.
const JWT_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';

interface Ostos {
  id: number
  tuote: string
  poimittu: boolean
}

interface ApiData {
  ostokset: Ostos[]
  virhe: string
  haettu: boolean
}
```

`JWT_TOKEN` on vakio, joka sisältää palvelimen `luoJWT.js`-ohjelmalla generoidun tokenin. Tämä on demomainen tapa — oikeassa sovelluksessa token saataisiin palvelimelta kirjautumisen yhteydessä.

#### 5.2 Tila ja refs

```tsx
const lomakeRef = useRef<HTMLFormElement>(null);
const [apiData, setApiData] = useState<ApiData>({
  ostokset: [],
  virhe: '',
  haettu: false,
});
```

- `lomakeRef` — viittaus lomake-elementtiin, jonka kautta luetaan tekstikentän arvo
- `apiData` — sovelluksen tila: lista ostoksista, mahdollinen virheteksti ja latauksen tila

#### 5.3 apiKutsu-funktio ja Authorization-header

Tässä on demo 7:n keskeisin muutos demo 6:een verrattuna:

```tsx
const apiKutsu = async (metodi?: string, ostos?: Ostos, id?: number): Promise<void> => {
  setApiData((prev) => ({ ...prev, haettu: false }));

  const url = id
    ? `http://localhost:3007/api/ostokset/${id}`
    : 'http://localhost:3007/api/ostokset';

  // Authorization-header lähetetään mukana jokaisessa pyynnössä
  let asetukset: RequestInit = {
    method: metodi ?? 'GET',
    headers: {
      Authorization: `Bearer ${JWT_TOKEN}`,
    },
  };

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
      let virheteksti: string;
      switch (yhteys.status) {
        case 400: virheteksti = 'Virhe pyynnön tiedoissa'; break;
        case 401: virheteksti = 'Virheellinen token'; break;
        default:  virheteksti = 'Palvelimella tapahtui odottamaton virhe'; break;
      }
      setApiData((prev) => ({ ...prev, virhe: virheteksti, haettu: true }));
    }
  } catch {
    setApiData((prev) => ({ ...prev, virhe: 'Palvelimeen ei saada yhteyttä', haettu: true }));
  }
};
```

**Demo 7:n muutokset demo 6:een verrattuna:**

1. **Authorization-header jokaisessa pyynnössä:**
   ```tsx
   headers: {
     Authorization: `Bearer ${JWT_TOKEN}`,
   }
   ```
   Header lähetetään jo perustasolla ennen kuin tarkistetaan, onko kyseessä POST. Näin se on mukana GET-, DELETE- ja POST-pyynnöissä automaattisesti.

2. **Spread-operaattori POST-pyynnössä:**
   ```tsx
   headers: {
     ...(asetukset.headers as Record<string, string>),
     'Content-Type': 'application/json',
   }
   ```
   POST-pyyntöön lisätään `Content-Type`, mutta olemassa oleva `Authorization` säilytetään spread-operaattorilla (`...`). Ilman spreadia Authorization ylikirjoittuisi.

3. **Uusi virheenkäsittely statuskoodille 401:**
   ```tsx
   case 401: virheteksti = 'Virheellinen token'; break;
   ```
   Jos palvelin hylkää pyynnön väärän tai puuttuvan tokenin takia, käyttäjälle näytetään selkeä virheilmoitus.

#### 5.4 Käyttöliittymä

```tsx
return (
  <Container>
    <Typography variant="h5">Demo 7: JWT-autorisointi</Typography>
    <Typography variant="h6" sx={{ marginBottom: 2, marginTop: 2 }}>Ostoslista</Typography>

    {apiData.virhe
      ? <Alert severity="error">{apiData.virhe}</Alert>
      : apiData.haettu
        ? <Stack component="form" onSubmit={lisaaTuote} ref={lomakeRef} spacing={2}>
            <List>
              {apiData.ostokset.map((ostos, idx) => (
                <ListItem
                  key={idx}
                  secondaryAction={
                    <IconButton edge="end" onClick={() => { poistaTuote(ostos); }}>
                      <DeleteIcon />
                    </IconButton>
                  }
                >
                  <ListItemText primary={ostos.tuote} />
                </ListItem>
              ))}
            </List>
            <TextField name="uusiTuote" fullWidth placeholder="Kirjoita tähän uusi tuote..." />
            <Button type="submit" variant="contained" size="large" fullWidth>
              Lisää tuote ostoslistaan
            </Button>
          </Stack>
        : <Backdrop open><CircularProgress color="inherit" /></Backdrop>
    }
  </Container>
);
```

Käyttöliittymä näyttää kolme eri tilaa:

| Tila                          | Mitä renderöidään             |
|-------------------------------|-------------------------------|
| `apiData.virhe` on asetettu   | Punainen `Alert`-ilmoitus     |
| `apiData.haettu === true`     | Ostoslista ja lomake          |
| `apiData.haettu === false`    | Latausympyrä (`Backdrop`)     |

---

## 4. Tokenin vaihtaminen

Sovellus käyttää `App.tsx`:n alussa määritettyä vakiota `JWT_TOKEN`. Jos token ei toimi (palvelin palauttaa 401), voidaan generoida uusi token palvelimen puolella:

```bash
# Palvelinkansion juuressa (server/)
node luoJWT.js
```

Kopioidaan tulostettu token `App.tsx`:n `JWT_TOKEN`-vakioon.

---

## 5. Sovelluksen käynnistäminen

Käynnistetään ensin Express-palvelin (`server/`-kansiossa):

```bash
npm run dev
```

Sitten React-asiakassovellus (`client/`-kansiossa):

```bash
npm run dev
```

Asiakassovellus käynnistyy osoitteeseen `http://localhost:3000` ja on valmis kommunikoimaan palvelimen kanssa osoitteessa `http://localhost:3007`.

---

## 6. Tokenin testaaminen

**Oikealla tokenilla:** Sovellus lataa ostoslistan normaalisti.

**Väärällä tokenilla:** Vaihdetaan `JWT_TOKEN`-vakion arvo virheelliseksi merkkijonoksi (esim. `'vaaratoken'`). Sovellus näyttää punaisen virheilmoituksen: *"Virheellinen token"*.

Tämä havainnollistaa, miten palvelin hylkää kaikki pyynnöt, joiden token ei täsmää palvelimen salaista avainta.
