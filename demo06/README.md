# Demo 6: Asiakassovelluksen yhdistäminen palvelinsovellukseen

Demo 6 keskittyy REST API -tyyppisten palvelinsovellusten käyttämiseen loppukäyttäjän asiakassovelluksella. Asiakassovellus liittyy fullstack-verkkosovellusten ohjelmoinnissa niin sanottuun frontend-päähän, jota voidaan myös ajatella verkkosovellusten julkisivuna, jonka kanssa oikeat ihmiskäyttäjät toimivat. Palvelimen päässä REST API -sovelluksen perustoiminto pysyy samana: palvelin kuuntelee sen tarjoamiin reitteihin tulevia pyyntöjä ja vastaa niihin ohjelmointinsa mukaisesti, mutta nyt puhtaan komentomuotoisen käytön sijaan palvelimelle luodaan käyttöliittymä Sovellusohjelmointi 1 -opintojaksolta tutuilla React-tekniikoilla. Tässä demossa asiakas- ja palvelinsovelluksina toteutetaan ostoslista-sovellus, jolla käyttäjä voi lisätä ja poistaa ostoksia, sekä merkitä niitä poimituksi.

## Oppimistavoitteet

Tämän demon jälkeen opiskelija:
- osaa yhdistää React-asiakassovelluksen palvelinsovellukseen,
- on tietoinen CORS-mekanismista, sen käyttötarkoituksesta ja käyttöönotosta,
- osaa rakentaa palvelinpyyntöjen lähettämisen toiminnon asiakassovellukseen fetch-rajapinnalla, ja
- kertaa MUI-komponenttikirjaston käyttöä asiakassovelluksen käyttöliittymän toteuttamiseen.

Aloitetaan opiskelu tutustumalla ensin käsitteellisellä tasolla asiakassovellusten liittämiseen palvelinsovellukseen ja HTTP-pyyntöjen tekemiseen ohjelmallisesti.

---

## 1. Asiakassovelluksen ja palvelimen välinen kommunikaatio

### Kertausta asiakassovelluksista

Tämän demon pääaiheena opiskellaan asiakassovelluksen liittämistä REST API -palvelinsovellukseen/verkkopalveluun \(web service\). Verkkopalveluissa ajatuksena oli, että palvelinsovellus tarjoaa standardoidun ja REST-käytänteiden mukaisen ohjelmointirajapinnan \(API\), jonka kanssa kommunikointiin voidaan luoda muita sovelluksia, jotka lähettävät automaattisesti muodostettuja HTTP-pyyntöjä palvelimelle. Näitä muita sovelluksia ovat yleensä loppukäyttäjille tarkoitetut **asiakassovellukset** \(client application\). Aiemmissa demoissa palvelinsovellusta testattiin Postman-sovelluksella, joka soveltuu hyvin REST API -tyyppisten web service -rajapintojen testaamiseen eri HTTP-pyynnöille, mutta tässä kaikki pyynnöt piti määritellä testeissä erikseen. Loppukäyttäjän näkökulmasta tämä ei ole toimiva tapa käyttää verkkosovellusta, vaan ihmiskäyttäjille luodaankin omat asiakassovellukset, joilla on graafinen käyttöliittymä. Käyttöliittymässä voidaan esimerkiksi kerätä käyttäjien antamaa tietoja, liittää ne ohjelmallisesti osaksi palvelimelle lähtevää HTTP-pyyntöä ja asiakassovellus hoitaa loput automaattisesti. Ihmiskäyttäjän ei tarvitse tehdä muuta kuin käyttää käyttöliittymää.

Tässä demossa toteutettu asiakassovellus on React-kirjastoon pohjautuva yhden sivun sovellus eli niin sanottu **SPA** (eli "Single Page Application"), joka suoritetaan käyttäjän selaimessa. Asiakassovellus hakee tietoja palvelimelta "kovakoodatuilla" HTTP-pyynnöillä ja päivittää näkymäänsä saamiensa tietojen pohjalta. React-sovelluksissa varsinaista selaimelle tulostettavaa sivua ei vaihdeta näkymien välillä, vaan selaimeen tulostetaan staattinen HTML-etusivu, jonka sisällä olevaa "root"-elementtiä käytetään kehyksenä Reactin luomien dynaamisten komponenttinäkymien näyttämiseen. React-sovellusten näkymien tilaa ohjataan JavaScriptilla tai opintojaksojen tapauksessa siihen pohjautuvalla TypeScriptilla.

### Kuinka asiakassovellus lähettää pyyntöjä palvelimelle?

Selaimen `fetch`-funktio on JavaScriptiin sisäänrakennettu tapa tehdä HTTP-pyyntöjä palvelimelle. `fetch`-funktiota käytetään muodostamaan HTTP-pyynnön rakenne, lähettämään se palvelimen johonkin reittiin ja takaisin palautetaan lupaus palvelimen tiedoista `Promise`-objektina. Opintojaksolla ei keskitytä tarkemmin lupausten eli `Promise`-objektien tekniseen toimintaan. Riittää, että ymmärtää kyseessä olevan viiveellinen toimenpide (johtuen erinäisistä teknisistä syistä kuten internet-yhteydestä asiakkaan ja palvelimen välillä sekä tietokoneiden omasta prosessoinnin kestosta, jne.). Tämän takia palvelimelle tehtäviä pyyntöjä pitää käsitellä asynkroonisesti `async`/`await` -komennoilla. **Eli yksinkertaisetusti: aina kun ohjelmoinnissa funktio palauttaa lupauksen (Promise) tiedosta, joudutaan tietoa odottamaan (await) käyttäen asynkroonisia toimintoja (async).** Tähän perustuu myös esimerkiksi Prisma-tietokantakyselyjen asynkroonisuus, sillä tietokanta voi olla laaja ja kyselyn suorittamiseen voi kulua suurissa tietokannoissa useita sekunteja ja jopa minuutteja.

Alla on yleistetty esimerkki React-asiakassovellukseen ohjelmoitavan fetch-pyynnön rakenteesta (GET ja POST -metodit). **Huomioi**, että tämä on vain yksi esimerkki ja pyynnön rakenne pitää suunnitella aina käyttötarkoituksen ja halutun toiminnallisuuden mukaan. Koska jokaista käyttötapausta ja esimerkkiä on mahdotonta ja epäkäytännöllistä käydä läpi opintojakson demoissa, kannattaa aiheeseen tutustua itsenäisesti lukemalla [virallisia dokumentaatioita](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch "https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch") ja [asiantuntija-artikkeleita](https://www.slingacademy.com/article/using-fetch-api-with-typescript-tutorial-examples/ "https://www.slingacademy.com/article/using-fetch-api-with-typescript-tutorial-examples/") aiheesta.

```typescript
// Asiakassovellukseen ohjelmoitava GET-pyyntö
const vastaus = await fetch("http://localhost:3006/api/ostokset");    // Muuttuja 'vastaus' on palvelimen REST API reitinkäsittelijän palauttama data asiakkaalle.
const data = await vastaus.json();                                    // Vastauksen sisältämä tieto pitää muuntaa JSON-muotoon ohjelmallista käsittelyä varten.

// Asiakassovellukseen ohjelmoitava POST-pyyntö
const vastaus = await fetch("http://localhost:3006/api/ostokset", {   // POST-pyyntöä varten fetch-kutsun toiseksi parametriksi on annettava pyynnössä lähetettävät tiedot eli pyynnön asetukset.
  method: "POST",                                                     // 'method' määrittää pyynnössä käytetyn HTTP-metodin. Tässä tehdään POST-pyyntö.
  headers: { "Content-Type": "application/json" },                    // Otsikkotietoihin liitetään tietoa pyynnössä tulevan tiedon tyypistä. Välitettäessä JSON-dataa sovellusten välillä 'Content-Type' on 'application/json'. Tämä on yleisin tiedon sisältömuoto, jolla asiakas ja palvelin keskustelevat.
  body: JSON.stringify({ tuote: "Maitoa", poimittu: false })          // Pyynnön a
});
```

`fetch`-metodi ottaa vastaan kaksi parametria. Ensimmäinen parametri on palvelimen REST API -reitin URL-osoite ja toinen parametri valinnainen asetukset-objekti. Yllä olevassa koodissa on esimerkit yksinkertaisten GET- ja POST-pyyntöjen tekemisestä `fetch`:llä. GET-pyynnössä asetuksia ei tarvitse määrittää. POST-, PUT- ja DELETE-pyynnöissä asetuksiin asetetaan:

- `method`, eli pyynnön metodi;
- tarvittaessa `headers`, eli pyynnön otsikkotiedot; ja
- `body`, eli pyynnön varsinainen tietosisältö.

>[!tip]
Kiinnitä huomiota siihen, että `fetch`-komennon asetukset ovat JSON-objektimuodossa, jossa yksittäiset kentät voivat sisältää lisää JSON-objekteja. Tämä on ihan normaalia JSON-notaatiossa, ja kannattaakin käyttää hieman aikaa lukeakseen ja harjoitellakseen esimerkkejä JSON-muotoisen objektien kirjoittamisesta, jotta osaa lukea niitä. Yllä olevan esimerkin asetukset-JSON-objektissa on esim. `headers`-kenttä, jonka arvo on toinen JSON-objekti. Samoin `body`-osassa palautettavat tiedot ovat yleensä oma JSON-objektinsa kuten vaikkapa `{ tuote: "Maitoa", poimittu: false }`.

### CORS-mekanismi

**CORS** (Cross-Origin Resource Sharing) on selaimen suojamekanismi, joka estää verkkosivua tekemästä pyyntöjä eri alkuperään (origin) kuin mistä sivu ladattiin. Alkuperä muodostuu protokollasta, domainista ja portista.

Tässä demossa palvelin toimii osoitteessa `http://localhost:3006` ja asiakassovelluksen Vite-kehityspalvelin osoitteessa `http://localhost:3000`. Portit eroavat, joten selain tulkitsee pyynnöt eri alkuperien välisiksi ja estää ne oletuksena.

Palvelimella CORS-ongelma ratkaistaan `cors`-kirjastolla, joka lisää vastauksiin tarvittavat HTTP-otsikot. Näin palvelin kertoo selaimelle, mistä alkuperistä pyynnöt sallitaan.

| Termi | Selitys |
|---|---|
| Origin | Protokolla + domain + portti, esim. `http://localhost:3000` |
| Same-origin | Pyyntö samaan alkuperään kuin sivu ladattiin |
| Cross-origin | Pyyntö eri alkuperään kuin sivu ladattiin |
| CORS-otsikot | Palvelimen vastauksen HTTP-otsikot, jotka kertovat sallitut alkuperät |

### Vite-kehitystyökalu

**Vite** on moderni kehitystyökalu, joka tarjoaa nopean kehityspalvelimen ja tuotantobuildin React-sovelluksille. Vite käynnistää oman kehityspalvelimen (oletuksena portti 5173), joka tarjoilee asiakassovelluksen selaimeen. Demossa kehityspalvelimen portti asetetaan arvoon `3000`.

Kehityksen aikana ajetaan kahta palvelinta samanaikaisesti:
1. Express-palvelin (portti 3006) tarjoaa REST API:n
2. Vite-kehityspalvelin (portti 3000) tarjoilee React-asiakassovelluksen

Voit ajaa kahta kehityspalvelinta samanaikaisesti VS Codessa luomalla kummallekin oman Terminal-instanssin. VS Codessa voi olla auki samanaikaisesti useita terminaaleja, jotka voivat pyörittää eri prosesseja samanaikaisesti. Kun tehdään paikallista verkkosovelluskehitystä, kehityspalvelinten tulee olla omissa porteissaan, koska kaksi eri prosessia ei voi kuunnella samaa porttia.

### MUI-komponenttikirjasto

**MUI** (Material UI) on React-komponenttikirjasto, joka tarjoaa valmiita käyttöliittymäkomponentteja Googlen Material Design -tyylillä. MUI:n avulla voidaan rakentaa siisti käyttöliittymä nopeasti ilman manuaalista CSS-tyylittelyä. MUI-kirjaston käyttöä opiskeltiin Sovellusohjelmointi 1 -opintojaksolla, eikä siihen paneuduta syvällisemmin tässä demossa. Voit lukea MUI-kirjaston käytöstä sen [virallisesta dokumentaatiosta](https://mui.com/material-ui/getting-started/ "https://mui.com/material-ui/getting-started/").

### Demosovellus – Ostoslista

Tässä demossa rakennetaan asiakassovellus uudelle ostoslista-palvelimelle. Palvelimen REST API:a hyödynnetään asiakassovelluksesta `fetch`-pyynnöillä. Asiakassovellus toteutetaan React-sovelluksena Vite-kehitystyökalulla ja MUI-komponenttikirjastolla.

Nyt palvelinsovellus toteutetaan täysin uutena sovelluksena, mutta aiempien demojen käsitteet esim. Prisman käytöstä ja virhekäsittelijästä pysyvät samoina.

Asiakassovelluksessa käytettävät REST API -reitit:

| Metodi | Reitti | Kuvaus |
|---|---|---|
| GET | `/api/ostokset` | Hakee kaikki ostokset |
| POST | `/api/ostokset` | Lisää uuden ostoksen |
| DELETE | `/api/ostokset/:id` | Poistaa ostoksen id:n perusteella |

---

## 2. Ostoslista-sovelluksen rakentuminen vaihe vaiheelta

Ostoslista-sovelluksen palvelimen ja asiakkaan ohjeistukset löytyvät omista README-tiedostoista vastaavien alikansioiden alta (server ja client).

[palvelinsovelluksen rakentaminen](./server/README.md)

---

### Vaihe 2: Asiakassovelluksen luominen Vitellä

Asiakassovellus luodaan palvelimen juurikansioon `client`-alikansion alle Vite-kehitystyökalulla.

> **Huomio:** Erillinen Vite-projektin alustusohje löytyy tiedostosta `client/VITE_ALUSTUS.md`. Siinä käydään läpi Vite 8:n asennus ja oletusten siivous yksityiskohtaisemmin.

Suoritetaan palvelimen juurikansiossa:

```bash
npm create vite@latest client -- --template react-swc-ts
```

Komento luo `client`-kansion, johon Vite generoi React + TypeScript + SWC -pohjan. Siirrytään kansioon ja asennetaan riippuvuudet:

```bash
cd client
npm install
```

**Siistitään Viten oletuspohja.** Poistetaan tarpeettomat tiedostot:

```bash
rm src/App.css src/index.css src/assets/react.svg public/vite.svg
```

**Muokataan `src/main.tsx`** poistamalla CSS-tuonti:

```typescript
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
```

**Muokataan `src/App.tsx`** yksinkertaiseen testinäkymään:

```typescript
const App = () => {
  return <h1>Ostoslista</h1>;
};

export default App;
```

> **Huomio:** React-komponentteja ei tarvitse tyypittää `React.FC`-tyypillä. Nykyisten käytäntöjen mukaan komponenttifunktioille ei lisätä erillistä tyyppiä, koska TypeScript päättelee palautusarvon automaattisesti. Tyypitys kohdistetaan yksittäisiin osiin, kuten tilamuuttujiin (`useState<Tyyppi>`) ja propseihin (`interface Props { ... }`).

**Muokataan `vite.config.ts`:**

```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
  },
});
```

Portti asetetaan arvoon `3000`, jotta se ei mene päällekkäin Express-palvelimen portin `3006` kanssa.

**Käynnistetään Vite-kehityspalvelin** uudessa VS Coden terminaalissa:

```bash
cd client
npm run dev
```

Selaimessa osoitteessa `http://localhost:3000` pitäisi näkyä teksti "Ostoslista".

---

### Vaihe 3: Ensimmäinen API-kutsu ja CORS-virhe

Tehdään ensimmäinen API-kutsu asiakassovelluksesta palvelimelle. Muokataan `src/App.tsx`:

```typescript
import { useEffect, useState } from "react";

const App = () => {
  const [data, setData] = useState<string>("Ladataan...");

  useEffect(() => {
    fetch("http://localhost:3006/api/ostokset")
      .then((res) => res.json())
      .then((json) => setData(JSON.stringify(json)))
      .catch((err) => setData("Virhe: " + err.message));
  }, []);

  return <h1>{data}</h1>;
};

export default App;
```

Selaimessa näkyy nyt virheilmoitus. Avataan selaimen kehittäjätyökalut (F12) ja tarkistetaan Console-välilehti. Siellä on CORS-virhe:

```
Access to fetch at 'http://localhost:3006/api/ostokset' from origin 'http://localhost:3000' 
has been blocked by CORS policy
```

Virhe johtuu siitä, että asiakassovellus (portti 3000) yrittää hakea dataa eri alkuperästä (portti 3006). Selain estää tämän oletuksena.

**Korjataan CORS palvelimella.** Muokataan `index.ts` lisäämällä `cors`-middleware:

```typescript
import express from "express";
import path from "path";
import cors from "cors";
import apiOstoksetRouter from "./routes/apiOstokset";
import virhekasittelija from "./errors/virhekasittelija";

const app: express.Application = express();

const portti: number = Number(process.env.PORT) || 3006;

app.use(cors({ origin: "http://localhost:3000" }));

app.use(
  (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    setTimeout(() => next(), 1000);
  }
);

app.use(express.static(path.resolve(__dirname, "public")));

app.use("/api/ostokset", apiOstoksetRouter);

app.use(virhekasittelija);

app.use(
  (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    if (!res.headersSent) {
      res.status(404).json({ viesti: "Virheellinen reitti" });
    }
    next();
  }
);

app.listen(portti, () => {
  console.log(`Palvelin käynnistyi osoitteeseen: http://localhost:${portti}`);
});
```

`cors({ origin: "http://localhost:3000" })` sallii pyynnöt vain Vite-kehityspalvelimen osoitteesta. Palvelin lisää vastauksiin `Access-Control-Allow-Origin`-otsikon, jonka perusteella selain päästää vastauksen läpi.

CORS-middleware asetetaan ennen muita middlewareja, jotta se koskee kaikkia reittejä.

Palvelimen uudelleenkäynnistyksen jälkeen selaimessa pitäisi nyt näkyä `[]` (tyhjä taulukko tietokannasta).

---

### Vaihe 4: MUI-komponenttikirjaston asennus

Asennetaan MUI ja sen vaatimat fontit `client`-kansiossa:

```bash
cd client
npm install @mui/material @emotion/react @emotion/styled @mui/icons-material @fontsource/roboto
```

| Paketti | Tarkoitus |
|---|---|
| `@mui/material` | MUI:n pääkomponentit |
| `@emotion/react` | MUI:n tyylityskirjasto |
| `@emotion/styled` | MUI:n tyylityskirjasto |
| `@mui/icons-material` | MUI:n ikonikirjasto |
| `@fontsource/roboto` | Material Designin Roboto-fontti |

Tuodaan Roboto-fontti `src/main.tsx`-tiedostossa:

```typescript
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "@fontsource/roboto/300.css";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
```

---

### Vaihe 5: App.tsx:n toteutus

Rakennetaan varsinainen ostoslistanäkymä. Toteutetaan `src/App.tsx` kokonaan uudelleen.

**Määritellään tietotyypit:**

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
```

`Ostos` vastaa palvelimen tietokantamallia. `ApiData` kokoaa kaikki API-kutsun tilaan liittyvät arvot yhteen: listan ostokset, mahdollisen virheen ja tiedon siitä, onko haku suoritettu.

---

**Toteutetaan komponentti kokonaisuudessaan:**

```typescript
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Backdrop,
  Button,
  CircularProgress,
  Container,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";

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

const App = () => {
  const lomakeRef = useRef<HTMLFormElement>(null);

  const [apiData, setApiData] = useState<ApiData>({
    ostokset: [],
    virhe: "",
    haettu: false,
  });

  const apiKutsu = async (
    metodi?: string,
    ostos?: Ostos,
    id?: number
  ): Promise<void> => {
    setApiData({
      ...apiData,
      haettu: false,
    });

    const url = id
      ? `http://localhost:3006/api/ostokset/${id}`
      : `http://localhost:3006/api/ostokset`;

    let asetukset: RequestInit = {
      method: metodi || "GET",
    };

    if (metodi === "POST") {
      asetukset = {
        ...asetukset,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(ostos),
      };
    }

    try {
      const vastaus = await fetch(url, asetukset);

      if (vastaus.status === 200) {
        setApiData({
          ...apiData,
          ostokset: await vastaus.json(),
          haettu: true,
        });
      } else {
        let virheteksti = "";

        switch (vastaus.status) {
          case 400:
            virheteksti = "Virhe pyynnön tiedoissa";
            break;
          default:
            virheteksti = "Palvelimella tapahtui odottamaton virhe";
            break;
        }

        setApiData({
          ...apiData,
          virhe: virheteksti,
          haettu: true,
        });
      }
    } catch (e: any) {
      setApiData({
        ...apiData,
        virhe: "Palvelimeen ei saada yhteyttä",
        haettu: true,
      });
    }
  };

  const lisaaTuote = (e: React.FormEvent) => {
    e.preventDefault();

    const lomake = lomakeRef.current;
    if (!lomake) return;

    const tuoteKentta = lomake.elements.namedItem(
      "uusiTuote"
    ) as HTMLInputElement;

    apiKutsu("POST", {
      id: 0,
      tuote: tuoteKentta.value,
      poimittu: false,
    });
  };

  const poistaTuote = (ostos: Ostos) => {
    apiKutsu("DELETE", undefined, ostos.id);
  };

  useEffect(() => {
    apiKutsu();
  }, []);

  return (
    <Container>
      <Typography variant="h5">Demo 6: Asiakassovelluksen toteutus</Typography>

      <Typography variant="h6" sx={{ marginBottom: 2, marginTop: 2 }}>
        Ostoslista
      </Typography>

      {Boolean(apiData.virhe) ? (
        <Alert severity="error">{apiData.virhe}</Alert>
      ) : apiData.haettu ? (
        <Stack
          component="form"
          onSubmit={lisaaTuote}
          ref={lomakeRef}
          spacing={2}
        >
          <List>
            {apiData.ostokset.map((ostos: Ostos, idx: number) => {
              return (
                <ListItem
                  key={idx}
                  secondaryAction={
                    <IconButton
                      edge="end"
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

          <TextField
            name="uusiTuote"
            fullWidth={true}
            placeholder="Kirjoita tähän uusi tuote..."
          />

          <Button type="submit" variant="contained" size="large" fullWidth>
            Lisää tuote ostoslistaan
          </Button>
        </Stack>
      ) : (
        <Backdrop open={true}>
          <CircularProgress color="inherit" />
        </Backdrop>
      )}
    </Container>
  );
};

export default App;
```

**Koodin selitys osissa:**

**`apiKutsu`-funktio** on yleiskäyttöinen funktio kaikille API-pyynnöille. Se ottaa parametreina HTTP-metodin, mahdollisen ostoksen ja mahdollisen id:n.

1. Asetetaan `haettu: false`, jolloin näytetään latausindikaattori
2. Rakennetaan URL parametrien perusteella
3. Rakennetaan `fetch`-asetukset: metodi ja POST-pyynnöissä headerit sekä body
4. Suoritetaan `fetch` ja käsitellään vastaus
5. Jos status on 200, päivitetään ostoslista vastauksesta
6. Jos status on jotain muuta, asetetaan virheviesti
7. Jos `fetch` itsessään epäonnistuu (palvelin ei vastaa), asetetaan yhteysvirhe

**`RequestInit`** on selaimen sisäänrakennettu tyyppi `fetch`-funktion asetuksille. Aiemmassa koodissa käytettiin `any`-tyyppiä, mutta `RequestInit` on tarkempi ja turvallisempi vaihtoehto.

**`useEffect`** suorittaa API-kutsun komponentin latautuessa. Tyhjä riippuvuustaulukko `[]` tarkoittaa, että kutsu tehdään vain kerran.

**`useRef`** viittaa lomakkeeseen, josta tuotteen nimi luetaan. Lomakkeen kentät luetaan `elements.namedItem()`-metodilla.

**Näkymän kolme tilaa:**
1. **Virhe:** `Alert`-komponentti punaisella virheilmoituksella
2. **Data haettu:** lomake ja ostoslista
3. **Ladataan:** `Backdrop` + `CircularProgress` -latausindikaattori

---

### Projektin lopullinen rakenne

```
demo06/
├── index.ts                    # Express-palvelimen pääohjelma
├── package.json
├── tsconfig.json
├── prisma.config.ts            # Prisma 7:n asetustiedosto
├── .env                        # Ympäristömuuttujat (DATABASE_URL)
├── lib/
│   └── prisma.ts               # PrismaClient-instanssin alustus
├── routes/
│   └── apiOstokset.ts          # Ostoslistan REST API -reitit
├── errors/
│   └── virhekasittelija.ts     # Virhekäsittelijä-middleware
├── prisma/
│   ├── schema.prisma           # Tietokantamalli
│   ├── data.db                 # SQLite-tietokanta (generoitu)
│   └── migrations/             # Migraatiotiedostot (generoitu)
├── generated/
│   └── prisma/                 # Generoitu Prisma Client (generoitu)
└── client/                     # React-asiakassovellus
    ├── src/
    │   ├── App.tsx             # Ostoslista-komponentti
    │   ├── main.tsx            # Sovelluksen käynnistys
    │   └── vite-env.d.ts       # Vite-tyyppimääritykset
    ├── index.html
    ├── vite.config.ts
    ├── package.json
    └── tsconfig.json
```

---

## 3. Demo 6: muistilista

### fetch-asetukset

| Asetus | Tyyppi | Käyttö |
|---|---|---|
| `method` | `string` | HTTP-metodi: `"GET"`, `"POST"`, `"PUT"`, `"DELETE"` |
| `headers` | `object` | Pyynnön otsikot, esim. `{ "Content-Type": "application/json" }` |
| `body` | `string` | Pyynnön runko, esim. `JSON.stringify(data)` |

### CORS-asetukset (cors-paketti)

| Asetus | Esimerkki | Selitys |
|---|---|---|
| `origin` | `"http://localhost:3000"` | Sallittu alkuperä (merkkijono) |
| `origin` | `["http://localhost:3000", "http://example.com"]` | Useita sallittuja alkuperiä (taulukko) |
| `origin` | `"*"` | Kaikki alkuperät sallittu (ei suositella tuotannossa) |

### Prisma 7 vs. Prisma 5/6

| Asia | Prisma 5/6 | Prisma 7 |
|---|---|---|
| Generator | `prisma-client-js` | `prisma-client` |
| Client-sijainti | `node_modules/.prisma/client` | Projektikansio (`generated/prisma/`) |
| Import | `from "@prisma/client"` | `from "./generated/prisma/client"` |
| Alustus | `new PrismaClient()` | `new PrismaClient({ adapter })` |
| Tietokannan URL | `schema.prisma` | `.env` + `prisma.config.ts` |
| Asetustiedosto | Ei tarvita | `prisma.config.ts` (pakollinen) |
| Ajuriadapteri | Ei tarvita | Pakollinen (esim. `@prisma/adapter-better-sqlite3`) |
| Suoritusympäristö | ts-node | tsx (suositus) |

### MUI-komponentit tässä demossa

| Komponentti | Käyttö |
|---|---|
| `Container` | Sivun pääkehys |
| `Typography` | Otsikot |
| `List`, `ListItem`, `ListItemText` | Ostoslistan renderöinti |
| `TextField` | Tuotteen nimen syöttökenttä |
| `Button` | Lisäyspainike |
| `IconButton` + `DeleteIcon` | Poistopainike |
| `Alert` | Virhenäkymä |
| `Backdrop` + `CircularProgress` | Latausindikaattori |
| `Stack` | Lomake-elementtien asettelu |

---

## Sovelluksen käynnistys

**1. Asenna palvelimen riippuvuudet:**

```bash
cd demo06
npm install
```

**2. Alusta tietokanta ja generoi Prisma Client:**

```bash
npx prisma migrate dev --name init
npx prisma generate
```

**3. Asenna asiakassovelluksen riippuvuudet:**

```bash
cd client
npm install
```

**4. Käynnistä Express-palvelin** (ensimmäisessä terminaalissa):

```bash
cd demo06
npm run dev
```

Palvelin käynnistyy osoitteeseen `http://localhost:3006`.

**5. Käynnistä Vite-kehityspalvelin** (toisessa terminaalissa):

```bash
cd demo06/client
npm run dev
```

Asiakassovellus avautuu osoitteeseen `http://localhost:3000`.
