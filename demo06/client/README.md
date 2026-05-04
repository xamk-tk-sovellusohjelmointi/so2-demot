# Demo 6: Asiakassovellus

Tässä ohjeessa rakennetaan React-asiakassovellus palvelinsovelluksen ostoslista-API:lle. Sovellus näyttää ostoslistan ja ostoksia voidaan lisätä, poistaa ja merkitä poimituksi.

---

## 2. Asiakassovelluksen rakentaminen vaihe vaiheelta

### Vaihe 1: Vite-projektin luominen

Samoin kuin palvelinsovellus, asiakassovellus luodaan kokonaan omaan kansioonsa projektin juuren `demo06/` alle. Luodaan uusi kansio nimellä `client` ja avataan se VS Codessa uudessa terminaalissa. Sen jälkeen alustetaan Vite-projekti, joka luo kehityspalvelimen, tarvittavat työkalut ja React-asiakassovelluksen pohjan käyttäen TypeScript-kieltä.

```bash
# Tämä komento suoritetaan client-kansion alla
npm create vite@latest . -- --template react-ts

# Voit myös ohittaa manuaalisen client-kansion luonnin alla olevalla komennolla, joka luo client-kansion samalla kuin Vite-projekti alustetaan
npm create vite@latest client -- --template react-ts
```

| Osa                      | Selitys                                                               |
| ------------------------ | --------------------------------------------------------------------- |
| `npm create vite@latest` | Lataa ja suorittaa Viten projektigeneraattorin                        |
| `client`                 | Luotavan kansion nimi (`.`-merkki luo projektin nykyiseen sijaintiin) |
| `--`                     | Erottaa npm:n parametrit Viten parametreista                          |
| `--template react-ts`    | React + TypeScript -pohja                                             |
Vite kysyy asennuksen aikana kysymyksiä projektin alustukseen liittyen. Mennään oletusvalinnoilla painamalla Enteriä. Kun Vite kysyy, asennetaanko ja käynnistetäänkö projekti (npm install & npm run dev), valitaan kyllä.

### Vaihe 2: Oletusten siivous

Viten luoma oletuspohja sisältää esimerkkikoodia ja tyylejä, joita ei tarvita. Poistetaan tarpeettomat tiedostot. Tiedostot voi poistaa VS Coden käyttöliittymässä painamalla kyseistä tiedostoa hiiren oikealla ja valitsemalla 'delete' tai terminaalista remove (rm) -komennolla:

```bash
rm src/App.css src/index.css src/assets/react.svg src/assets/vite.svg src/assets/hero.png public/vite.svg
```

| Tiedosto               | Selitys                                                                            |
| ---------------------- | ---------------------------------------------------------------------------------- |
| `src/App.css`          | Viten oletustyylit, joita ei tarvita. Tyylitys hoidetaan myöhemmin MUI-kirjastolla |
| `src/index.css`        | Viten oletustyylit, joita ei tarvita. Tyylitys hoidetaan myöhemmin MUI-kirjastolla |
| `src/assets/react.svg` | Oletuslogo, ei tarvita                                                             |
| `src/assets/vite.svg`  | Oletuslogo, ei tarvita                                                             |
| `src/assets/hero.png`  | Oletuskuva, ei tarvita                                                             |
| `public/vite.svg`      | Oletusikoni, ei tarvita                                                            |

Muokataan `src/main.tsx` poistamalla CSS-tuonti:

```tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
```

Muokataan `src/App.tsx` yksinkertaiseen testinäkymään, eli poistetaan kaikki ylimääräinen ja jätetään pelkkä funktiokomponentti `App` ja sen vienti:

```tsx
const App = () => {
  return <h1>Ostoslista</h1>;
};

export default App;
```

### Vaihe 3: Kehityspalvelimen portti ja käynnistys

Muokataan `vite.config.ts` asettamalla kehityspalvelimen portti:

```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
  },
});
```

Portti asetetaan arvoon `3000`, jotta se ei mene päällekkäin Express-palvelimen portin `3006` kanssa.

Käynnistetään Vite-kehityspalvelin:

```bash
npm run dev
```

Selaimessa osoitteessa `http://localhost:3000` pitäisi näkyä teksti "Ostoslista".

>[!tip]
>Kehitystyön aikana ajetaan kahta palvelinta samanaikaisesti: Express-palvelinta (`http://localhost:3006`) ja Vite-kehityspalvelinta (`http://localhost:3000`). Molemmat tarvitsevat oman terminaalin VS Codessa.

### Vaihe 4: MUI-komponenttikirjaston asennus

Käyttöliittymän rakentamiseen käytetään MUI-komponenttikirjastoa (Material UI). Asennetaan MUI ja sen tarvitsemat paketit `client`-kansiossa:

```bash
npm install @mui/material @emotion/react @emotion/styled @mui/icons-material @fontsource/roboto
```

Tuodaan Roboto-fontti `src/main.tsx`-tiedostoon:

```tsx
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

### Vaihe 5: Käyttöliittymän luuranko MUI-komponenteilla

Rakennetaan sovelluksen perusnäkymän runko MUI-komponenteilla. Ei toteuteta vielä ostosten hakua tai tulostusta palvelimelta. Muokataan `src/App.tsx`:

```tsx
import { useState } from "react";
import {
  Alert,
  Backdrop,
  Button,
  CircularProgress,
  Container,
  List,
  ListItem,
  ListItemText,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

interface ApiData {
  ostokset: any;
  virhe: string;
  haettu: boolean;
}

const App = () => {
  const [apiData, setApiData] = useState<ApiData>({
    ostokset: [],
    virhe: "",
    haettu: false,
  });

  return (
    <Container>
    
		<Typography
			variant="h5"
		>
	      Demo 6: Asiakassovelluksen toteutus
		</Typography>
		
		<Typography
			variant="h6"
			sx={{ marginBottom: 2, marginTop: 2 }}
		>		
			Ostoslista
		</Typography>

      {apiData.virhe ? (
        <Alert severity="error">{apiData.virhe}</Alert>
      ) : apiData.haettu ? (
        <Stack spacing={2}>
          <Typography>Data haettu onnistuneesti.</Typography>
          {apiData.ostokset}
        </Stack>
      ) : (
	      <Backdrop open>
		      <CircularProgress color="inherit" />
	      </Backdrop>
      )}
    </Container>
  );
};

export default App;
```

Yllä olevassa koodissa luotiin uusi tietotyyppi TypeScript-interfacena nimeltä `ApiData`. Tämä kuvaa asiakassovelluksen ja palvelimen välisen kommunikaation tilaa.

| Avain      | Selitys                                                                                                                                                                                                                                                                               |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ostokset` | Palvelimen palauttama tieto ostoksista vastauksena asiakassovelluksen tekemään HTTP-pyyntöön (GET, POST, PUT, DELETE).                                                                                                                                                                |
| `virhe`    | Virheellisissä pyynnöissä palvelin palauttaa asiakkaalle epäonnistuneen HTTP-statuksen (esim. 400). Tällaisissa tilanteissa asiakassovellus määrittää virheilmoituksen `apiData`-tilamuuttujan `virhe`-kenttään, joka voidaan näyttää sovelluksen käyttöliittymässä loppukäyttäjälle. |
| `haettu`   | Haettu kuvaa tietoa siitä, onko palvelimen ostoslistan tietojen haku valmis vai kesken. Keskeneräisessä tilassa sovellus näyttää latausruudun käyttäjälle Backdrop-komponentissa.                                                                                                     |
Yllä oleva koodi toimii käyttöliittymän runkona. Loppukäyttäjälle näytetään MUI:n Container-komponentti, joka asettelee sen sisällä olevat muut komponentit automaattisesti MUI:n asettelujen ja tyylien mukaisesti. Typography-komponenteilla voidaan näyttää käyttöliittymässä tekstisisältöä, esim. tässä sovelluksen pääotsikko ja alaotsikko.

Tämän jälkeen `apiData`:n tietoja (joita vielä ei ole sen tarkemmin määritetty) käytetään ehdolliseen tulostukseen. Ehdollinen tulostus on tässä rakennettu ternary-operaationa, jonka rakenne menee:

`(tarkista ehto) ? (suoritetaan, jos ehto on tosi) : (suoritetaan, jos ehto on epätosi)`

Operaatioita voidaan myös ketjuttaa, eli toden/epätoden tilanteen sisältö voi aloittaa uuden ternary-operaation:

`(tarkista ehto1) ? (suoritetaan, jos ehto1 on tosi) : (suoritetaan, jos ehto1 on epätosi ja tarkista ehto2) ? (suoritetaan, jos ehto2 on tosi) : (suoritetaan, jos ehto2 epätosi)`

Loogisesti yllä olevan koodi seuraa alla olevaa järjestystä:

1. Ensin tehdään tarkistus API-pyynnön mahdollisista virheistä (`apiData.virhe`).
	1. Jos virhe on, näytetään käyttäjälle MUI Alert-komponentilla muotoiltu virhe, jonka varsinainen tulostettu sisältö löytyy `apiData`:n `virhe`-kentästä.
2. Jos virhettä ei ole, tarkistetaan onko `apiData`:n `haettu` `true/false`.
	1. Jos haettu on `true`, tiedetään että palvelimen ostosten tiedot on haettu ja ne voidaan näyttää. Tässä tulostetaan vielä tyhjä array ja annetaan onnistuneen haun ilmoitus.
	2. Jos haettu on `false`, tiedetään että palvelimelta ostosten tietojen haku on kesken (asynkrooninen funktio, jossa voi kestää hetken). Tulostetaan siis animoitu latauskuvake tummennetun taustan päällä (Backdrop + CircularProgress).

Selaimessa näkyy nyt latausikoni, koska `haettu` on `false` eikä dataa haeta vielä mistään.

### Vaihe 6: Ensimmäinen API-kutsu ja CORS-virhe

API-kutsu tarkoittaa siis samaa asiaa kuin HTTP-pyynnön tekeminen palvelimelle, jota on aiemmissa demoissa tehty suoraan manuaalisesti Postmanilla. Tehdään ensimmäinen API-kutsu palvelimelle kaikkien ostosten hakemiseksi. Lisätään `useEffect`-importti ja haetaan data:

```tsx
import { useEffect, useState } from "react";
```

Lisätään `App`-komponenttiin API-kutsun funktio, jolla palvelinpyynnön lähettäminen suoritetaan (lue kommenteista komentojen roolit):

```tsx
// Luodaan uusi tietotyyppi Ostos-tietojen käsittelylle asiakassovelluksessa.
// Tietotyypin rakenne vastaa palvelimen SQLite-tietokannassa olevan Ostos-taulun tietoja
interface Ostos {
	id: number;
	tuote: string;
	poimittu: boolean;
}

interface ApiData {
	ostokset: Ostos[]; // Vaihdetaan any-tyyppi Ostos-objektien taulukkoon (array)
	virhe: string;
	haettu: boolean;
}

const App = () => {
	const [apiData, setApiData] = useState<ApiData>({
	ostokset: [],
	virhe: "",
	haettu: false,
	});
	
	// Runko kaikille asiakkaan API-kutsuille. Tätä voidaan rakentaa lisää seuraavissa vaiheissa eri HTTP-pyynnöille. Tässä vaiheessa toteutetaan pelkkä GET-pyyntö kaikille ostoksille eli ns. perustilanne.
	const apiKutsu = async () => {
		// Ennen tietojen hakua, varmistetaan, että apiData.haettu on false
		setApiData((data) => ({...data, haettu: false }));
		
		try {
			// Yritetään yhdistää palvelimen REST API -reittiin kaikkien ostosten hakuun
			const yhteys = await fetch("http://localhost:3006/api/ostokset");
			
			// Jos yhteyden statuskoodi on 200 eli OK, voidaan jatkaa
			if (yhteys.status === 200) {
			// Onnistunut haku palauttaa kaikki ostokset JSON-muodossa, jotka sijoitetaan data-vakioon.
			const data: Ostos[] = await yhteys.json();
			
			setApiData({
				ostokset: data,
				virhe: "",
				haettu: true
			});
			
			} else {
				// Jos yhteyden statuskoodi oli muuta kuin 200 (todennäköisesti epäonnistunut), käsitellään virheet.
				let virheteksti: string;
				
				// Tarkistetaan yhteyden statuskoodin vaihtoehdot
				switch (yhteys.status) {
					case 400: // Tilanne, jossa pyynnön tiedoissa on virhe
						virheteksti = "Virhe pyynnön tiedoissa";
						break;
					default: // Muu odottamaton virhe (yleensä 500)
						virheteksti = "Palvelimella tapahtui odottamaton virhe";
						break;
				}
				
				// Päivitetään apiData-tilamuuttujan virheviesti ja kerrotaan samalla, että hakua on yritetty (latausanimaation sulkeminen)
				setApiData((data) => {
					...data,
					virhe: virheteksti,
					haettu: true
				});
				
			}
		} catch { // Jos try-lohkoa ei suoriteta, on todennäköisesti koko yhteys palvelimeen rikki
		
			setApiData((data) => {
				...data,
				virhe: "Palvelimeen ei saada yhteyttä",
				haettu: true
			});
			
		}
	};
	
	// useEffect-suoritetaan komponentin päivityksessä, eli oletuksena suoritetaan ostosten haku sovelluksen käynnistyksen yhteydessä.
	useEffect(() => {
	  apiKutsu();
	}, []);
	
	return (...);
```

`fetch()` on selaimen sisäänrakennettu funktio HTTP-pyyntöjen tekemiseen. Se on asynkroninen, joten sitä käytetään `async`/`await`-syntaksilla. `useEffect` suorittaa funktion komponentin ensimmäisen renderöinnin jälkeen. Tyhjä taulukko `[]` toisena parametrina tarkoittaa, että efekti suoritetaan vain kerran käynnistyksen yhteydessä.

Samalla luotiin tietotyyppi Ostos-tiedoille, joita palvelin lähettää vastauksena onnistuneisiin pyyntöihin. Muokataan aiemmat koodit tarvittavilta osin.

API-kutsu on nyt kunnossa, mutta yhteys ei silti vielä toimi. Avataan selaimen kehittäjätyökalut (F12) ja tarkistetaan Console-välilehti. Konsolissa näkyy CORS-virhe:

```
Access to fetch at 'http://localhost:3006/api/ostokset' from origin 'http://localhost:3000'
has been blocked by CORS policy
```

Virhe johtuu siitä, että asiakassovellus (`http://localhost:3000`) yrittää hakea dataa eri alkuperästä (`http://localhost:3006`). Selain estää tämän oletuksena. Tätä kutsutaan CORS-suojaukseksi (Cross-Origin Resource Sharing).

Ongelma korjataan palvelimen puolella lisäämällä CORS-middleware. **[LINKKI: PALVELIN.md — Vaihe 14: CORS-tuki]**

Kun palvelimelle on lisätty CORS-tuki ja palvelin on käynnistetty uudelleen, ladataan asiakassovelluksen sivu uudelleen ja sivun pitäisi päivittyä nyt normaalisti ja näyttää jotain tietoa ostoksista.

### Vaihe 7: Ostosten tulostaminen listaan

Muokataan käyttöliittymä näyttämään ostokset listana. Korvataan `Stack`-lohkon sisältö:

```tsx
{apiData.virhe ? (
  <Alert severity="error">{apiData.virhe}</Alert>
) : apiData.haettu ? (
  <Stack spacing={2}>
    <List>
      {apiData.ostokset.map((ostos: Ostos, idx: number) => (
        <ListItem key={idx}>
          <ListItemText primary={ostos.tuote} />
        </ListItem>
      ))}
    </List>
  </Stack>
) : (
  <Backdrop open={true}>
    <CircularProgress color="inherit" />
  </Backdrop>
)}
```

`map()` käy läpi ostokset ja luo jokaiselle `ListItem`-elementin. `key`-propsin avulla React tunnistaa yksittäiset listaelementit.

Tässä vaiheessa selaimessa näkyy lista palvelimelle aiemmin Postmanilla lisätyistä ostoksista (tai tyhjä lista, jos tietokanta on tyhjä).

### Vaihe 8: Ostoksen lisääminen (POST)

Seuraavaksi luodaan toiminnallisuus uusien ostosten lisäämiselle ostoslistaan. Tätä varten tarvitaan tekstin syöttökenttä ja painike lisäys-pyynnön muodostamiseen ja lähettämiseen. Pyynnön rakenne ja sisältö pitää muotoilla osaksi aiemmin aloitettua `apiKutsu`-funktiota.

Lisätään tekstikenttä ja painike uuden ostoksen lisäämiselle. Tuodaan samalla `useRef`, jolla voidaan viitata suoraan käyttöliittymään luotavan syöttökentän arvoon ilman tarvetta erilliselle tilamuuttujalle:

```typescript
import { useEffect, useRef, useState } from "react";
```

Lisätään `App`-komponenttiin `useRef` lomakkeen käsittelyä varten:

```typescript
const lomakeRef = useRef<HTMLFormElement>(null);
```

`useRef` luo viittauksen DOM-elementtiin. Sen avulla päästään käsiksi lomakkeen kenttien arvoihin ilman erillistä tilamuuttujaa jokaiselle kentälle.

Seuraavaksi muokataan `apiKutsu`-funktiota:

```tsx
// Koska samaa funktiota käytetään muodostamaan eri HTTP-pyynnöt, joudumme käsittelemään kutsun yhteydessä annettuja tietoja, jotka vaikuttavat pyynnön sisältöön. Eli luodaan apiKutsu-funktiolle muutama uusi parametri eri tilanteita varten:
const apiKutsu = async (
	metodi?: string, // fetch on oletuksena GET, mutta uuden ostoksen lisääminen tarvitsee POST-pyynnön. Koska metodi voi siis vaihtua, luodaan funktioon parametri metodia varten, joka on vaihtoehtoinen (?-merkki)
	ostos?: Ostos, // Koska palvelimelle lähetetään Ostos-objektin muotoinen tieto, joka lisätään palvelimen tietokantaan, tarvitaan sen välittämiseen parametri
	id?: number
) => {
	setApiData((data) => ({ ...data, haettu: false }));

	// Luodaan HTTP-pyynnön asetuksille uusi muuttuja.
	// Asetuksissa voidaan muun muassa määrittää pyynnön metodi.
	// Koska samalla apiKutsu-funktiolla käsitellään kaikki pyynnöt eri CRUD-operaatioille, luodaan asetuksiin metodin kenttä.
	// Method on oletuksena "GET", jos apiKutsun yhteydessä ei erikseen anneta muuta metodia.
	let asetukset: RequestInit = {
    method: metodi || "GET",
  };

	// Jos apiKutsu kutsutaan argumentilla "POST"
	if (metodi === "POST") {
		
		// Muokataan pyynnön asetuksia. Metodi on jo annettu POST:na.
		// Tietosisällön tyyppi pitää vielä määrittää (Content-Type)
		// Tiedot välitetään JSON-muodossa, jolloin tyyppi on "application/json"
		asetukset = {
		  ...asetukset,
		  headers: {
			"Content-Type": "application/json",
		  },
		  body: JSON.stringify(ostos), // Lisätään pyynnön bodyyn JSON-merkkijonoksi muotoiltu Ostos-objekti.
		};
	}

	try {
	const vastaus = await fetch("http://localhost:3006/api/ostokset", asetukset);
	
	if (vastaus.status === 200) {
	  const data: Ostos[] = await vastaus.json();
	  setApiData({ ostokset: data, virhe: "", haettu: true });
	} else {
	  let virheteksti: string;
	  switch (vastaus.status) {
		case 400:
		  virheteksti = "Virhe pyynnön tiedoissa";
		  break;
		default:
		  virheteksti = "Palvelimella tapahtui odottamaton virhe";
		  break;
	  }
	  setApiData((data) => ({ ...data, virhe: virheteksti, haettu: true }));
	}
	} catch {
	setApiData((data) => ({
	  ...data,
	  virhe: "Palvelimeen ei saada yhteyttä",
	  haettu: true,
	}));
	}
};
```

Funktio ottaa kolme valinnaista parametria:

| Parametri | Tarkoitus                                                            |
| --------- | -------------------------------------------------------------------- |
| `metodi`  | HTTP-metodi (GET, POST, DELETE). Oletuksena GET.                     |
| `ostos`   | Lähetettävä data (POST)                                              |
| `id`      | Ostoksen id URL:ssa (DELETE, GET /:id). `id` otetaan käyttöön kohta. |

POST-pyynnöissä `fetch`-kutsuun lisätään `Content-Type`-header, joka kertoo palvelimelle bodyn olevan JSON-muodossa. `JSON.stringify()` muuttaa JavaScript-objektin JSON-merkkijonoksi.

`RequestInit` on selaimen sisäänrakennettu tyyppi `fetch`-funktion asetuksille.

Nyt kun `apiKutsu`-funktio on valmisteltu lähettämään palvelimelle POST-pyyntö uuden ostoksen lisäämiselle, pitää varsinainen uuden ostoksen lisääminen toteuttaa asiakassovellukseen. Lisätään ostoksen lisäysfunktio:

```typescript
const lisaaTuote = (e: React.SubmitEvent): void => {
  e.preventDefault(); // Estetään näkymän päivittyminen, joka on oletus lomakkeen lähetyksessä (submit).
  const lomake = lomakeRef.current; // Tehdään viittaus lomakkeeseen
  if (!lomake) return; // Jos lomaketta ei ole, lopetetaan funktion suoritus tähän

	// Valitaan lomakkeesta elementti, jonka name/id on "uusiTuote"
	const tuoteKentta = lomake.elements.namedItem("uusiTuote");
	const uusiTuote = tuoteKentta.value;

	// Suoritetaan POST-pyynnön apiKutsu uuden ostoksen lisäämiselle.
	// Palvelin määrittää ostoksen todellisen id:n tietokantaan.
	// Tuote on varsinaisesti ainut tieto, joka määritetään käyttäjän toimesta.
	// Poimittu on oletuksena false, koska se on juuri lisätty listaan
	apiKutsu("POST", {
	id: 0,
	tuote: uusiTuote,
	poimittu: false,
	});
};
```

`e.preventDefault()` estää lomakkeen oletustoiminnon (sivun uudelleenlataus). `namedItem("uusiTuote")` hakee lomakkeesta kentän `name`-attribuutin perusteella.

Muokataan käyttöliittymän `Stack`-komponentti lomakkeeksi ja lisätään tekstikenttä sekä painike:

```typescript
<Stack
  component="form"
  onSubmit={lisaaTuote}
  ref={lomakeRef}
  spacing={2}
>
  <List>
    {apiData.ostokset.map((ostos: Ostos, idx: number) => (
      <ListItem key={idx}>
        <ListItemText primary={ostos.tuote} />
      </ListItem>
    ))}
  </List>

  <TextField
    name="uusiTuote"
    fullWidth
    placeholder="Kirjoita tähän uusi tuote..."
  />

  <Button type="submit" variant="contained" size="large" fullWidth>
    Lisää tuote ostoslistaan
  </Button>
</Stack>
```

`Stack` saa `component="form"`-propin, joka tekee siitä HTML-lomakkeen. `spacing={2}` lisää 16px välin elementtien väliin. `TextField`-komponentilla on `name`-attribuutti, jota käytetään `namedItem()`-kutsussa. `Button`-komponentin `type="submit"` laukaisee lomakkeen `onSubmit`-tapahtuman.

Testataan: kirjoita tekstikenttään tuotteen nimi ja paina painiketta. Tuotteen pitäisi ilmestyä listaan.

### Vaihe 9: Ostoksen poistaminen (DELETE)

Lisätään jokaiselle ostokselle poistopainike. Tuodaan tarvittavat komponentit:

```typescript
import DeleteIcon from "@mui/icons-material/Delete";
```

Lisätään `IconButton` olemassa olevaan MUI-importtiin:

```typescript
import {
  // ... aiemmat importit
  IconButton,
} from "@mui/material";
```

Lisätään poistofunktio `App`-komponenttiin:

```typescript
const poistaTuote = (ostos: Ostos): void => {
  apiKutsu("DELETE", undefined, ostos.id);
};
```

`apiKutsu` saa metodiksi `"DELETE"` ja id:ksi poistettavan ostoksen id:n. Dataa ei tarvitse lähettää, joten `ostos` on `undefined`.

Ostoksen poistaminen palvelimelta vaatii kutsun lähettämisen osoitteeseen, jota on tarkennettu reittiparametrilla `api/ostokset/:id`. Sen takia `apiKutsu`-funktiota on muokattava yhteyden `url`-tiedon osalta:

```tsx
const apiKutsu = async (
    metodi?: string,
    ostos?: Ostos,
    id?: number,
  ) => {

    setApiData((data) => ({ ...data, haettu: false }));

	// Määritetään uusi vakio url, jolle annetaan jompi kumpi url-merkkijonoista riippuen siitä, annettiinko apiKutsu-funktion yhteydessä id-tieto (vain poisto)
	// Tämä tehdään ehdollisena sijoituksena ternary-operaatiolla
    const url = id
      ? `http://localhost:3006/api/ostokset/${id}`
      : "http://localhost:3006/api/ostokset";

    let asetukset: RequestInit = { method: metodi ?? "GET" };

    if (metodi === "POST") {
      asetukset = {
        ...asetukset,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(ostos),
      };
    }

    try {
      const yhteys = await fetch(url, asetukset);

      if (yhteys.status === 200) {
      
        const data: Ostos[] = await yhteys.json();
        setApiData({ ostokset: data, virhe: "", haettu: true });
      } else {

        let virheteksti: string;

        switch (yhteys.status) {
          case 400:
            virheteksti = "Virhe pyynnön tiedoissa";
            break;
          default:
            virheteksti = "Palvelimella tapahtui odottamaton virhe";
            break;
        }

        setApiData((data) => ({ ...data, virhe: virheteksti, haettu: true }));
      }
    } catch {

      setApiData((data) => ({
        ...data,
        virhe: "Palvelimeen ei saada yhteyttä",
        haettu: true,
      }));
    }
  };
```

Muokataan `ListItem`-komponenttia lisäämällä poistopainike:

```typescript
<ListItem
  key={idx}
  secondaryAction={
    <IconButton
      edge="end"
      onClick={() => {
        poistaTuote(ostos);
      }}
    >
      <DeleteIcon />
    </IconButton>
  }
>
  <ListItemText primary={ostos.tuote} />
</ListItem>
```

`secondaryAction` sijoittaa painikkeen listaelementin oikeaan reunaan. `IconButton` renderöi roskakorikuvakkeen painikkeena.

### Vaihe 11: Valmis App.tsx

Tässä vaiheessa `src/App.tsx` kokonaisuudessaan:

```tsx
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
  
function App() {
  const lomakeRef = useRef<HTMLFormElement>(null);
  const [apiData, setApiData] = useState<ApiData>({
    ostokset: [],
    virhe: "",
    haettu: false,
  });
  
  const poistaTuote = (ostos: Ostos): void => {
    apiKutsu("DELETE", undefined, ostos.id);
  };
  
  const lisaaTuote = (e: React.SubmitEvent): void => {
  
    e.preventDefault();
  
    const lomake = lomakeRef.current;
  
    if (!lomake) return;
    const tuoteKentta = lomake.elements.namedItem("uusiTuote") as HTMLInputElement;
    const uusiTuote = tuoteKentta.value;
    apiKutsu("POST", {
      id: 0,
      tuote: uusiTuote,
      poimittu: false
    });
  };
  
  const apiKutsu = async (
    metodi?: string,
    ostos?: Ostos,
    id?: number,
  ) => {
    setApiData((data) => ({ ...data, haettu: false }));
  
    const url = id
      ? `http://localhost:3006/api/ostokset/${id}`
      : "http://localhost:3006/api/ostokset";
  
    let asetukset: RequestInit = { method: metodi ?? "GET" };
  
    if (metodi === "POST") {
      asetukset = {
        ...asetukset,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(ostos),
      };
    }
  
    try {
      const yhteys = await fetch(url, asetukset);
  
      if (yhteys.status === 200) {
        const data: Ostos[] = await yhteys.json();
        setApiData({ ostokset: data, virhe: "", haettu: true });
      } else {
        let virheteksti: string;
        switch (yhteys.status) {
          case 400:
            virheteksti = "Virhe pyynnön tiedoissa";
            break;
          default:
            virheteksti = "Palvelimella tapahtui odottamaton virhe";
            break;
        }
        setApiData((data) => ({ ...data, virhe: virheteksti, haettu: true }));
      }
    } catch {
      setApiData((data) => ({
        ...data,
        virhe: "Palvelimeen ei saada yhteyttä",
        haettu: true,
      }));
    }
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
  
      {apiData.virhe ? (
        <Alert severity="error">{apiData.virhe}</Alert>
      ) : apiData.haettu ? (
        <Stack
          component="form"
          onSubmit={lisaaTuote}
          ref={lomakeRef}
          spacing={2}
        >
          <List>
            {apiData.ostokset.map((ostos: Ostos, idx: number) => (
              <ListItem
                key={idx}
                secondaryAction={
                  <IconButton
                    edge="end"
                    onClick={() => {
                      poistaTuote(ostos);
                    }}
                  >
                    <DeleteIcon />
                  </IconButton>
                }
              >
                <ListItemText primary={ostos.tuote} />
              </ListItem>
            ))}
          </List>

          <TextField
            name="uusiTuote"
            fullWidth
            placeholder="Kirjoita tähän uusi tuote..."
          />

          <Button type="submit" variant="contained" size="large" fullWidth>
            Lisää tuote ostoslistaan
          </Button>
        </Stack>
      ) : (
        <Backdrop open>
          <CircularProgress color="inherit" />
        </Backdrop>
      )}
    </Container>
  );
};
  
export default App;
```

### Projektin lopullinen rakenne

```
demo06/
├── server/                              # Palvelinsovellus
│   └── ...
└── client/                              # Asiakassovellus
    ├── public/                          # Staattiset tiedostot
    ├── src/
    │   ├── App.tsx                      # Pääkomponentti (ostoslista)
    │   ├── main.tsx                     # Sovelluksen käynnistys ja fonttien lataus
    │   └── vite-env.d.ts               # Vite-tyyppimääritykset
    ├── index.html                       # HTML-pohja
    ├── vite.config.ts                   # Vite-asetukset (portti 3000)
    ├── tsconfig.json                    # TypeScript-asetukset
    ├── tsconfig.app.json                # Sovelluskoodin TS-asetukset
    ├── tsconfig.node.json               # Vite-konfiguraation TS-asetukset
    ├── eslint.config.js                 # ESLint-asetukset
    └── package.json                     # Riippuvuudet
```

---

## 3. Asiakassovellus: muistilista

### fetch-funktion käyttö

| Osa                                               | Selitys                                              |
| ------------------------------------------------- | ---------------------------------------------------- |
| `fetch(url)`                                      | GET-pyyntö oletusasetuksilla                         |
| `fetch(url, { method: "POST" })`                  | HTTP-metodi asetetaan asetuksissa                    |
| `headers: { "Content-Type": "application/json" }` | Kertoo palvelimelle bodyn olevan JSON-muodossa       |
| `body: JSON.stringify(data)`                      | Muuttaa objektin JSON-merkkijonoksi                  |
| `vastaus.status`                                  | HTTP-statuskoodi (200, 400, 500...)                  |
| `vastaus.json()`                                  | Parsii vastauksen JSON:sta objektiksi (asynkroninen) |

---

## Sovelluksen käynnistys

Jos haluat käynnistää kloonatun demosovelluksen sellaisenaan, toimi seuraavasti.

**1. Siirry `client`-kansioon ja asenna riippuvuudet:**

```bash
cd client
npm install
```

**2. Käynnistä kehityspalvelin:**

```bash
npm run dev
```

Asiakassovellus käynnistyy osoitteeseen `http://localhost:3000`.

> **Huomio:** Palvelinsovelluksen (`http://localhost:3006`) pitää olla käynnissä toisessa terminaalissa, jotta API-kutsut toimivat.