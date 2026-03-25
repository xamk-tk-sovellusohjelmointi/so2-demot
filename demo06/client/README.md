# Vite 8: React-projektin alustusohje

Tämä ohje kattaa Vite 8 -kehitystyökalun käytön React + TypeScript -projektin luomiseen. Ohje on tarkoitettu käytettäväksi yhdessä Demo 6:n pääohjeistuksen kanssa.

---

## 1. Vaatimukset

Vite 8 vaatii Node.js-version **20.19+** tai **22.12+**. Tarkistetaan asennettu versio:

```bash
node --version
```

Jos versio on liian vanha, päivitetään Node.js osoitteesta https://nodejs.org.

---

## 2. Vite-projektin luominen

Vite-projekti luodaan `npm create vite@latest`-komennolla. Komento lataa Viten scaffolding-työkalun, joka luo projektipohjan valitun template-mallin perusteella.

Suoritetaan palvelinsovelluksen juurikansiossa (`demo06`):

```bash
npm create vite@latest client -- --template react-swc-ts
```

| Osa | Selitys |
|---|---|
| `npm create vite@latest` | Lataa ja suorittaa Viten projektigeneraattorin |
| `client` | Projektikansion nimi |
| `--` | Erottaa npm:n parametrit Viten parametreista |
| `--template react-swc-ts` | Käyttää React + TypeScript + SWC -mallia |

Vite tarjoaa useita template-malleja React-projektille:

| Template | Kuvaus |
|---|---|
| `react-ts` | React + TypeScript (käyttää Oxc-kääntäjää Vite 8:ssa) |
| `react-swc-ts` | React + TypeScript + SWC-kääntäjä |
| `react` | React + JavaScript |
| `react-swc` | React + JavaScript + SWC |

**SWC** (Speedy Web Compiler) on Rust-pohjainen JavaScript/TypeScript-kääntäjä, joka nopeuttaa kehityspalvelimen toimintaa. Vite 8:ssa myös tavallinen `react-ts`-template on nopea, koska Vite 8 käyttää Rolldown-bundleria ja Oxc-kääntäjää. Molemmat vaihtoehdot toimivat hyvin.

---

## 3. Riippuvuuksien asennus

Siirrytään luotuun kansioon ja asennetaan riippuvuudet:

```bash
cd client
npm install
```

---

## 4. Oletusten siivous

Viten luoma oletuspohja sisältää esimerkkikoodia ja tiedostoja, joita ei tarvita. Siistitään projekti.

**Poistetaan tarpeettomat tiedostot:**

```bash
rm src/App.css src/index.css src/assets/react.svg public/vite.svg
```

| Tiedosto | Miksi poistetaan |
|---|---|
| `src/App.css` | MUI hoitaa tyylityksen |
| `src/index.css` | MUI hoitaa globaalit tyylit |
| `src/assets/react.svg` | Oletuslogi, ei tarvita |
| `public/vite.svg` | Oletusikoni, ei tarvita |

**Muokataan `src/main.tsx`:**

Poistetaan oletustyylien tuonti. Tiedoston alkuperäinen sisältö viittaa `index.css`-tiedostoon, joka poistettiin.

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

**Muokataan `src/App.tsx`:**

Korvataan oletussisältö tyhjällä komponentilla:

```typescript
const App = () => {
  return <h1>Tervetuloa</h1>;
};

export default App;
```

---

## 5. vite.config.ts

Viten asetustiedosto sijaitsee projektin juuressa. Oletusasetukset ovat:

```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";

export default defineConfig({
  plugins: [react()],
});
```

Muokataan asetuksia lisäämällä kehityspalvelimen portti:

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

`server.port` asettaa Viten kehityspalvelimen portin. Oletusportti on `5173`. Demossa käytetään porttia `3000`, jotta se on helppo muistaa ja erottaa Express-palvelimen portista `3006`.

---

## 6. Kehityspalvelimen käynnistys

Käynnistetään Viten kehityspalvelin:

```bash
npm run dev
```

Terminaaliin tulostuu:

```
VITE v8.x.x  ready in xxx ms

  ➜  Local:   http://localhost:3000/
  ➜  Network: use --host to expose
  ➜  press h + enter to show help
```

Selaimessa osoitteessa `http://localhost:3000` näkyy nyt sovellus.

---

## 7. Projektin rakenne siivouksen jälkeen

```
client/
├── node_modules/
├── public/                 # Staattiset tiedostot
├── src/
│   ├── App.tsx             # Pääkomponentti
│   ├── main.tsx            # Sovelluksen käynnistys
│   └── vite-env.d.ts       # Vite-tyyppimääritykset
├── index.html              # HTML-pohja (Viten sisääntulopiste)
├── vite.config.ts          # Viten asetukset
├── tsconfig.json           # TypeScript-asetukset
├── tsconfig.app.json       # Sovelluskoodin TS-asetukset
├── tsconfig.node.json      # Vite-konfiguraation TS-asetukset
├── eslint.config.js        # ESLint-asetukset
└── package.json
```

`index.html` on Vite-projektin sisääntulopiste. Toisin kuin perinteisissä React-projekteissa, `index.html` on projektin juuressa (ei `public`-kansiossa). Vite käsittelee tiedoston ja lataa `src/main.tsx`-tiedoston `<script>`-tagilla.

---

## 8. Vite 8:n keskeiset ominaisuudet

| Ominaisuus | Kuvaus |
|---|---|
| **Rolldown-bundleri** | Rust-pohjainen bundleri, joka korvaa esbuild + Rollup -yhdistelmän |
| **HMR** (Hot Module Replacement) | Koodimuutokset päivittyvät selaimeen ilman sivulatausta |
| **ESM-pohjainen kehitys** | Selain lataa moduulit suoraan ES-moduuleina kehityksessä |
| **Nopea tuotantobuild** | Rolldown tuottaa optimoidun tuotantobuildin |
| **TypeScript-tuki** | Sisäänrakennettu tuki TypeScriptille |
| **tsconfig paths -tuki** | Vite 8 tukee TypeScriptin polkualiasten resolvointia |

---

## 9. Hyödylliset komennot

| Komento | Kuvaus |
|---|---|
| `npm run dev` | Käynnistää kehityspalvelimen |
| `npm run build` | Luo tuotantobuildin `dist/`-kansioon |
| `npm run preview` | Esikatselu tuotantobuildista |
| `npm run lint` | Suorittaa ESLint-tarkistuksen |
