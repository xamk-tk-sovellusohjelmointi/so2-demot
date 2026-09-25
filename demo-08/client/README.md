# Demo 8: Käyttäjänhallinta (asiakassovellus)

Sovellus avautuu selaimessa kirjautumislomakkeeseen. Käyttäjä kirjoittaa käyttäjätunnuksen ja salasanan, ja oikeilla tunnuksilla näkymä vaihtuu ostoslistaksi. Lista toimii tämän jälkeen samalla tavalla kuin demossa 7. Palvelimelta saatu token tallennetaan selaimen muistiin, joten kirjautuminen säilyy myös sivun uudelleenlatauksen yli. Jos tokenia ei ole tai palvelin hylkää sen, sovellus palaa kirjautumislomakkeeseen.

Demo jakautuu kahteen kansioon. `server`-kansion Express-palvelin, käyttäjätaulu ja kirjautumisreitti käydään läpi [palvelinsovelluksen README:ssä](../server/README.md). Tämä README käsittelee `client`-kansion React-sovellusta.

Vite-projektin alustus ja näkymän Material UI -komponentit on käyty läpi [demo 6:n asiakassovelluksen README:ssä](../../demo-06/client/README.md), ja rajapintakutsujen rakenne [demo 7:n asiakassovelluksen README:ssä](../../demo-07/client/README.md). Tässä demossa keskitytään kahteen uuteen asiaan, eli sovelluksen jakamiseen kahteen näkymään ja tokenin hakemiseen kirjautumalla.

## Sisällysluettelo

- [1 Projektin rakenne ja riippuvuudet](#1-projektin-rakenne-ja-riippuvuudet)
- [2 Sovelluksen jakautuminen kahteen näkymään](#2-sovelluksen-jakautuminen-kahteen-näkymään)
  - [2.1 Reititys BrowserRouterilla](#21-reititys-browserrouterilla)
  - [2.2 Token App-komponentin tilassa](#22-token-app-komponentin-tilassa)
- [3 Login-komponentti ja kirjautuminen](#3-login-komponentti-ja-kirjautuminen)
- [4 Ostoslista-komponentti ja token pyynnöissä](#4-ostoslista-komponentti-ja-token-pyynnöissä)
- [5 Datan kulku sovelluksen ja palvelimen välillä](#5-datan-kulku-sovelluksen-ja-palvelimen-välillä)
  - [5.1 Kirjautuminen](#51-kirjautuminen)
  - [5.2 Ostoslistan pyynnöt](#52-ostoslistan-pyynnöt)
  - [5.3 Kelpaamaton token ja paluu kirjautumiseen](#53-kelpaamaton-token-ja-paluu-kirjautumiseen)
  - [5.4 Pyyntöjen seuraaminen kehittäjätyökaluilla](#54-pyyntöjen-seuraaminen-kehittäjätyökaluilla)
- [6 Sovelluksen käynnistäminen ja testaaminen](#6-sovelluksen-käynnistäminen-ja-testaaminen)
- [7 Lopuksi](#7-lopuksi)

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
> Asiakassovellus hakee kaiken datansa demon palvelimelta, joten myös `server`-kansion palvelimen pitää olla käynnissä omassa Terminal-välilehdessään. Palvelimen asennus- ja käynnistysohjeet ovat [palvelinsovelluksen README:ssä](../server/README.md). Ilman käynnissä olevaa palvelinta kirjautumislomakkeeseen tulee ilmoitus "Palvelimeen ei saatu yhteyttä".

Kirjautumislomakkeen testitunnukset ovat `TestUser` ja `passu123`. Käyttäjä tulee demon mukana palvelimen tietokannassa, ks. [palvelinsovelluksen luku 3](../server/README.md#3-käyttäjät-tietokannassa).

## 1 Projektin rakenne ja riippuvuudet

Projekti on sama Vite-pohjainen React-projekti kuin demoissa 6 ja 7. Riippuvuuksista uusi on `react-router`, jolla sovellus jaetaan kahteen näkymään (luku [2](#2-sovelluksen-jakautuminen-kahteen-näkymään)).

```json
"dependencies": {
  "@emotion/react": "^11.14.0",
  "@emotion/styled": "^11.14.1",
  "@fontsource/roboto": "^5.3.0",
  "@mui/icons-material": "^9.4.0",
  "@mui/material": "^9.4.0",
  "react": "^19.2.8",
  "react-dom": "^19.2.8",
  "react-router": "^8.4.0"
}
```

Paketti lisättiin projektiin komennolla `npm install react-router`. Muut paketit ovat samat kuin demossa 6, ja ne on lueteltu [demo 6:n luvussa 2](../../demo-06/client/README.md#2-riippuvuuksien-asennus).

Sovelluskoodi on jaettu tässä demossa kolmeen tiedostoon:

- [`src/App.tsx`](./src/App.tsx) sisältää reitityksen ja tokenin tilamuuttujan (luku [2](#2-sovelluksen-jakautuminen-kahteen-näkymään))
- [`src/components/Login.tsx`](./src/components/Login.tsx) sisältää kirjautumislomakkeen (luku [3](#3-login-komponentti-ja-kirjautuminen))
- [`src/components/Ostoslista.tsx`](./src/components/Ostoslista.tsx) sisältää demosta 7 tutun ostoslistan (luku [4](#4-ostoslista-komponentti-ja-token-pyynnöissä))

Rajapinnan osoite on edelleen suhteellinen, ja pyynnöt kulkevat Viten kehityspalvelimen kautta palvelimelle. Välitys määritetään tiedostossa [`vite.config.ts`](./vite.config.ts), jossa kohdeportti on tässä demossa 3008. Tarkempi selitys löytyy [demo 7:n asiakassovelluksen luvusta 2](../../demo-07/client/README.md#2-rajapinnan-osoite-ja-viten-proxy).

Riippuvuusversiot on lukittu `package-lock.json`-tiedostoon, ja koko demo ajetaan Node 24 -versiolla, joka on määritetty palvelinprojektin `.nvmrc`-tiedostossa.

## 2 Sovelluksen jakautuminen kahteen näkymään

Demoissa 6 ja 7 kaikki toiminta oli yhdessä `App`-komponentissa. Kirjautuminen tuo sovellukseen toisen näkymän, joten näkymät erotetaan omiksi komponenteikseen ja niiden välillä liikutaan reitityksen avulla.

### 2.1 Reititys BrowserRouterilla

Reititys otetaan käyttöön sovelluksen käynnistyspisteessä [`src/main.tsx`](./src/main.tsx).

```tsx
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
```

`BrowserRouter` seuraa selaimen osoiterivin polkua ja tarjoaa reititystoiminnot sisällään oleville komponenteille. Näkymät määritellään [`src/App.tsx`](./src/App.tsx)-tiedostossa.

```tsx
const App = () => {
  const [token, setToken] = useState<string>(
    String(localStorage.getItem("token")),
  );

  return (
    <Container>
      <Typography variant="h5" component="h1" sx={{ marginBottom: 3 }}>
        Demo 8: Käyttäjähallinta
      </Typography>

      <Typography variant="h6" component="h2" sx={{ marginBottom: 3 }}>
        Ostoslista
      </Typography>

      <Routes>
        <Route path="/" element={<Ostoslista token={token} />} />
        <Route path="/login" element={<Login setToken={setToken} />} />
      </Routes>
    </Container>
  );
};
```

- `Routes` valitsee sisällään olevista `Route`-määrityksistä sen, jonka `path` täsmää osoiterivin polkuun.
- `element`-attribuutissa annetaan komponentti, joka tulostetaan kyseisessä polussa.
- Osoitteessa `http://localhost:3000` tulostuu `Ostoslista` ja osoitteessa `http://localhost:3000/login` tulostuu `Login`.

Otsikot ovat `Routes`-elementin ulkopuolella, joten ne näkyvät molemmissa näkymissä. Kirjautumislomake piirtyy niiden päälle tummalle taustalle (luku [3](#3-login-komponentti-ja-kirjautuminen)).

Näkymästä toiseen siirrytään `useNavigate`-funktiolla, jota käytetään molemmissa komponenteissa.

```tsx
const navigate: NavigateFunction = useNavigate();
```

`navigate("/login")`-kutsu vaihtaa näkymän ja päivittää osoiterivin polun. Sivua ei ladata selaimessa uudelleen, joten komponenttien tila säilyy ja vaihto tapahtuu heti.

### 2.2 Token App-komponentin tilassa

Token tarvitaan molemmissa näkymissä, joten se pidetään niiden yhteisessä yläkomponentissa. `Login` saa päivitysfunktion ja `Ostoslista` saa arvon.

```tsx
const [token, setToken] = useState<string>(
  String(localStorage.getItem("token")),
);
```

`localStorage` on selaimen oma tallennustila, johon kirjoitetut arvot säilyvät myös sivun sulkemisen jälkeen. `getItem` palauttaa tallennetun merkkijonon tai arvon `null` silloin, kun avainta ei ole. `String()` muuttaa arvon merkkijonoksi, jolloin tilamuuttujan tyyppi pysyy merkkijonona myös ensimmäisellä käyttökerralla.

Tyhjästä tallennustilasta muodostuu tällöin merkkijono `"null"`, joka lähtee ensimmäisen pyynnön mukana. Palvelin hylkää sen koodilla `401`, jonka jälkeen sovellus siirtyy kirjautumislomakkeeseen (luku [5.3](#53-kelpaamaton-token-ja-paluu-kirjautumiseen)).

> [!TIP]
> Kokeile harjoituksena tarkistaa tallennetun tokenin olemassaolo jo `App`-komponentissa ja ohjata käyttäjä kirjautumislomakkeeseen ennen ensimmäistä pyyntöä. Silloin turhaa pyyntöä ei lähetettäisi lainkaan.

## 3 Login-komponentti ja kirjautuminen

Kirjautumislomake on omassa komponentissaan [`src/components/Login.tsx`](./src/components/Login.tsx). Komponentti saa yläkomponentilta yhden propsin.

```tsx
interface Props {
  setToken: Dispatch<SetStateAction<string>>;
}
```

`Dispatch<SetStateAction<string>>` on `useState`-parin päivitysfunktion tyyppi, ja se tuodaan `react`-paketista. Tyyppi kirjoitetaan tässä itse, koska propsin tyyppiä ei voi päätellä komponentin sisältä.

Lomakkeen kentät kootaan yhteen tilamuuttujaan, ja virheilmoituksella on oma tilamuuttujansa.

```tsx
const [lomakeTiedot, setLomakeTiedot] = useState<LomakeTiedot>({
  kayttajatunnus: "",
  salasana: "",
});

const [virhe, setVirhe] = useState<string>("");
```

Kentät päivittävät tilaa `onChange`-käsittelijässä samalla `...edellinen`-rakenteella, joka on selitetty [demo 6:n luvussa 4.2](../../demo-06/client/README.md#42-tilamuuttujat). Salasanakentässä on määritys `type="password"`, joka peittää kirjoitetut merkit.

Lomakkeen lähetys käsitellään `kirjaudu`-funktiossa.

```tsx
const kirjaudu = async (e: SubmitEvent): Promise<void> => {
  e.preventDefault();

  setVirhe("");

  if (!lomakeTiedot.kayttajatunnus || !lomakeTiedot.salasana) {
    setVirhe("Anna käyttäjätunnus ja salasana");
    return;
  }

  try {
    const yhteys = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        kayttajatunnus: lomakeTiedot.kayttajatunnus,
        salasana: lomakeTiedot.salasana,
      }),
    });

    if (yhteys.ok) {
      let { token } = await yhteys.json();

      props.setToken(token);

      localStorage.setItem("token", token);

      navigate("/");
    } else {
```

Funktio etenee vaiheittain:

- `e.preventDefault()` estää selaimen oletustoiminnon, jossa lomakkeen lähetys lataisi sivun uudelleen.
- Vanha virheilmoitus tyhjennetään heti, jotta edellisen yrityksen viesti ei jää näkyviin.
- Tyhjät kentät tarkistetaan selaimessa ennen pyynnön lähettämistä. Puutteellisista tiedoista tulee ilmoitus "Anna käyttäjätunnus ja salasana" eikä palvelimelle lähetetä mitään.
- Pyyntö on POST-pyyntö, jonka bodyssa lähtevät tunnukset. Otsake `Content-Type: application/json` määrittää sisällön muodon palvelimen `express.json()`-middlewarelle.
- Onnistuneesta vastauksesta puretaan `token`-kenttä. Arvo asetetaan yläkomponentin tilaan, tallennetaan selaimen muistiin avaimella `token` ja lopuksi siirrytään ostoslistan näkymään.

Virheellisistä tunnuksista näytetään viesti, joka valitaan vastauksen tilakoodin perusteella.

```tsx
switch (yhteys.status) {
  case 400:
    virheViesti = "Virhe pyynnön tiedoissa";
    break;
  case 401:
    virheViesti = "Käyttäjää ei löydy";
    break;
  default:
    virheViesti = "Palvelimella tapahtui odottamaton virhe";
    break;
}
```

Palvelin vastaa väärään käyttäjätunnukseen ja väärään salasanaan samalla koodilla `401`, joten lomakkeeseen tulee kummassakin tapauksessa sama ilmoitus (ks. [palvelinsovelluksen luku 4](../server/README.md#4-kirjautumisreitti)). Jos palvelin ei ole käynnissä, `catch`-lohko asettaa viestin "Palvelimeen ei saatu yhteyttä".

Lomake on piirretty `Backdrop`-komponentin päälle, jolloin muu näkymä jää sen alle tummennettuna. Kentät, painike ja ilmoitukset ovat Material UI:n komponentteja samaan tapaan kuin ostoslistassa (ks. [demo 6:n luku 4.6](../../demo-06/client/README.md#46-näkymän-rakenne)). Lomakkeen alareunassa on teksti, jossa demon testitunnukset näkyvät valmiina.

## 4 Ostoslista-komponentti ja token pyynnöissä

Ostoslista on siirretty omaan tiedostoonsa [`src/components/Ostoslista.tsx`](./src/components/Ostoslista.tsx). Sisältö on sama kuin demon 7 `App`-komponentissa, eli tilamuuttujat, `apiKutsu`-funktio ja näkymä säilyivät (ks. [demo 7:n asiakassovelluksen luku 3](../../demo-07/client/README.md#3-apptsx-rakenne-ja-toiminta)). Otsikot ja `Container` jäivät `App`-komponenttiin, joten tämä komponentti tulostaa vain listan, lomakkeen ja latausanimaation.

Kaksi kohtaa muuttui. Ensimmäinen on tokenin lähde.

```tsx
interface Props {
  token: string;
}

let asetukset: RequestInit = {
  method: metodi,
  headers: {
    Authorization: `Bearer ${props.token}`,
  },
};
```

Demossa 7 token oli kirjoitettu kiinteänä merkkijonona koodiin. Nyt arvo tulee propsina yläkomponentista ja liitetään otsakkeeseen merkkijonon sisään `${}`-upotuksella. `Bearer`-etuliite ja sen perässä oleva välilyönti pysyvät samoina, koska palvelin erottaa tokenin niiden jälkeen.

Toinen muutos on virhekoodin `401` käsittely.

```tsx
case 401:
  navigate("/login");
  break;
```

Demossa 7 tästä näytettiin ilmoitus "Virheellinen token". Nyt käyttäjä ohjataan kirjautumislomakkeeseen, josta saa uuden tokenin. Näytettävä virheviesti jää tyhjäksi, joten punaista ilmoitusta ei tule näkyviin ennen näkymän vaihtumista. Muut virhekoodit ja yhteyden katkeaminen käsitellään samalla tavalla kuin demossa 7.

## 5 Datan kulku sovelluksen ja palvelimen välillä

Sovellus lähettää palvelimelle kahdenlaisia pyyntöjä. Kirjautumispyyntö hakee tokenin, ja ostoslistan pyynnöt käyttävät sitä. Palvelimen puoli on kuvattu [palvelinsovelluksen luvuissa 4](../server/README.md#4-kirjautumisreitti) ja [5](../server/README.md#5-token-tarkistus-ostoslistan-reiteillä).

### 5.1 Kirjautuminen

Lomakkeen lähetys etenee näin:

1. `kirjaudu` lähettää POST-pyynnön osoitteeseen `/api/auth/login`, ja bodyssa ovat annetut tunnukset.

```json
{ "kayttajatunnus": "TestUser", "salasana": "passu123" }
```

2. Selain lähettää pyynnön osoitteeseen `http://localhost:3000/api/auth/login`, josta Viten kehityspalvelin välittää sen porttiin 3008.
3. Palvelin hakee käyttäjän tietokannasta ja vertaa annetun salasanan tiivistettä tallennettuun arvoon (ks. [palvelinsovelluksen luku 3.2](../server/README.md#32-salasanan-tiiviste-ja-luosalasanamjs)).
4. Onnistuneen tarkistuksen vastauksessa on token.

```json
{ "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." }
```

5. Token asetetaan `App`-komponentin tilaan ja tallennetaan selaimen muistiin. Näkymä vaihtuu ostoslistaksi.

Salasana kulkee pyynnön bodyssa sellaisenaan, ja vain palvelimella siitä lasketaan tiiviste. Paikallisessa kehityksessä liikenne kulkee omalla koneella, mutta julkaistussa sovelluksessa yhteys suojataan HTTPS-protokollalla, jolloin kirjautumistietoja ei voi lukea matkan varrelta.

### 5.2 Ostoslistan pyynnöt

`Ostoslista`-komponentin pyynnöt toimivat kuten demossa 7. Jokaisen pyynnön mukana lähtee `Authorization`-otsake, jossa on kirjautumisessa saatu token. Palvelin tarkistaa tokenin ennen kuin pyyntö etenee ostoslistan reiteille.

- Sivun avautuessa lähtee GET-pyyntö, jonka vastaus on koko ostoslista.
- Tuotteen lisääminen lähettää POST-pyynnön ja poistaminen DELETE-pyynnön.
- Molempien vastauksena tulee päivitetty lista, joka korvaa näkymän sisällön.

Pyyntöjen sisältö ja vaiheet on käyty läpi [demo 7:n asiakassovelluksen luvussa 4](../../demo-07/client/README.md#4-datan-kulku-sovelluksen-ja-palvelimen-välillä).

### 5.3 Kelpaamaton token ja paluu kirjautumiseen

Palvelin vastaa koodilla `401` kaikkiin ostoslistan pyyntöihin, joiden token puuttuu tai ei kelpaa. Sovellus siirtyy tällöin kirjautumislomakkeeseen. Näin käy kolmessa tilanteessa:

- Sovellus avataan ensimmäistä kertaa, jolloin selaimen muistissa ei ole tokenia ja otsakkeessa lähtee merkkijono `"null"` (luku [2.2](#22-token-app-komponentin-tilassa)).
- Palvelimen `.env`-tiedoston `JWT_SALAISUUS` on vaihdettu tokenin muodostamisen jälkeen, jolloin vanhan tokenin allekirjoitus ei enää täsmää.
- Tallennettua tokenia on muokattu selaimen muistissa.

Kirjautumisen jälkeen tallennettu token säilyy selaimen muistissa, joten sovellus aukeaa seuraavalla kerralla suoraan ostoslistaan. Uloskirjautumista varten tässä demossa ei ole painiketta, ja tokenin saa poistettua kehittäjätyökalujen Application-välilehden Local Storage -osiosta.

### 5.4 Pyyntöjen seuraaminen kehittäjätyökaluilla

Kirjautumisen kulku näkyy selaimen kehittäjätyökaluissa:

- Avaa työkalut F12-näppäimellä ja valitse Network-välilehti.
- Kirjaudu sisään. Listaan ilmestyy `login`-pyyntö, jonka Payload-osiossa näkyvät lähetetyt tunnukset ja Response-välilehdellä palvelimen palauttama token.
- Kirjautumisen jälkeen listaan tulee `ostokset`-pyyntö, jonka Request Headers -osiossa on `Authorization`-otsake samalla tokenilla.
- Application-välilehden Local Storage -osiossa näkyy avain `token` ja sen arvo.

Ensimmäisellä avauskerralla listassa näkyy myös `ostokset`-pyyntö, jonka tilakoodi on `401`. Se on tokenittoman sovelluksen ensimmäinen pyyntö ennen siirtymistä kirjautumislomakkeeseen.

## 6 Sovelluksen käynnistäminen ja testaaminen

Käynnistä ensin palvelin `server`-kansiossa ja sen jälkeen asiakassovellus `client`-kansiossa dokumentin alussa kuvatulla tavalla. Avaa selaimessa osoite `http://localhost:3000`. Kokeiltavia asioita on kuusi:

- Sivun avaaminen. Näkymään tulee kirjautumislomake.
- Väärät tunnukset. Kirjoita salasanaksi jotain muuta kuin `passu123`. Lomakkeeseen tulee punainen ilmoitus "Käyttäjää ei löydy".
- Tyhjä lomake. Paina Kirjaudu-painiketta ilman tietoja. Ilmoitus tulee suoraan selaimesta, eikä Network-välilehdelle ilmesty uutta pyyntöä.
- Kirjautuminen tunnuksilla `TestUser` ja `passu123`. Näkymä vaihtuu ostoslistaksi, ja listalla näkyvät tietokannan rivit.
- Tuotteen lisääminen ja poistaminen. Lista päivittyy palvelimen vastauksesta samalla tavalla kuin demossa 7.
- Sivun lataaminen uudelleen. Ostoslista pysyy näkyvissä, koska token luettiin selaimen muistista.

Kirjautumisen palautumisen voi kokeilla poistamalla `token`-avaimen kehittäjätyökalujen Local Storage -osiosta ja lataamalla sivun uudelleen. Sovellus palaa kirjautumislomakkeeseen.

Rajapintaa voi testata myös ilman asiakassovellusta Postmanilla, mikä on käyty läpi [palvelinsovelluksen luvussa 6.2](../server/README.md#62-kirjautuminen-ja-rajapinnan-testaaminen-postmanilla).

## 7 Lopuksi

Ostoslistan toiminta säilyi demosta 7, ja uutta oli kirjautuminen. Asiakassovellukseen tuli kolme muutosta:

- sovellus jaettiin kahteen näkymään, joiden välillä liikutaan `react-router`-paketin reitityksellä
- token haetaan palvelimelta kirjautumislomakkeella ja tallennetaan selaimen muistiin
- ostoslistan pyynnön virhekoodi `401` ohjaa käyttäjän takaisin kirjautumiseen

Token on nyt sovelluksen tilassa, josta se annetaan propsina sitä tarvitsevalle komponentille. Kahden näkymän sovelluksessa tämä riittää. Jos näkymiä ja komponentteja olisi enemmän, tokenin kuljettaminen propseina muuttuisi työlääksi, ja tilan jakamiseen käytettäisiin Reactin Context-rakennetta tai erillistä tilakirjastoa.

Kirjautuminen on nyt toteutettu päästä päähän lomakkeesta tietokantaan asti. Seuraava askel olisi liittää käyttäjän tunniste tokeniin palvelimella, jolloin jokaisella käyttäjällä voisi olla oma ostoslistansa. Palvelinpuolen toteutus on kuvattu [palvelinsovelluksen README:ssä](../server/README.md).
