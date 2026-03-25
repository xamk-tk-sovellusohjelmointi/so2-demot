# Vite-projektin alustusohje (React + TypeScript)

Tämä ohje kattaa React-asiakassovelluksen alustamisen Vite-kehitystyökalulla. Ohje on kirjoitettu Vite 8:lle ja React 19:lle (maaliskuu 2026).

---

## 1. Esitiedot

Tarvittavat työkalut:

| Työkalu | Vähimmäisversio |
|---|---|
| Node.js | 20.19 |
| npm | 10+ |

Tarkista asennettu Node.js-versio:

```bash
node --version
```

---

## 2. Vite-projektin luominen

Siirrytään palvelinprojektin juurikansioon (esim. `demo07`) ja ajetaan Viten luontikomento:

```bash
npm create vite@latest client -- --template react-swc-ts
```

Komennon osat:

| Osa | Merkitys |
|---|---|
| `npm create vite@latest` | Käyttää uusinta `create-vite`-työkalua |
| `client` | Projektikansion nimi |
| `--` | Erottaa npm:n ja create-viten argumentit |
| `--template react-swc-ts` | Valitsee React + TypeScript + SWC -pohjan |

**SWC** (Speedy Web Compiler) on Rust-pohjainen JavaScript/TypeScript-kääntäjä. Se on huomattavasti nopeampi kuin Babel ja on Vite-projekteissa suositeltu vaihtoehto.

Komento luo `client`-kansion, jossa on valmis projektipohja.

---

## 3. Riippuvuuksien asentaminen

Siirrytään `client`-kansioon ja asennetaan riippuvuudet:

```bash
cd client
npm install
```

### MUI-kirjaston asentaminen

Demossa käytetään MUI (Material UI) -komponenttikirjastoa. Asennetaan se:

```bash
npm install @mui/material @emotion/react @emotion/styled @mui/icons-material @fontsource/roboto
```

| Paketti | Tarkoitus |
|---|---|
| `@mui/material` | MUI-peruskomponentit (Button, TextField, List...) |
| `@emotion/react` | CSS-in-JS -tyylitys (MUI:n riippuvuus) |
| `@emotion/styled` | Styled components (MUI:n riippuvuus) |
| `@mui/icons-material` | MUI-ikonit (esim. DeleteIcon) |
| `@fontsource/roboto` | Roboto-fontti (MUI:n oletusfontti) |

---

## 4. Vite-konfiguraation muokkaaminen

Avataan `client/vite.config.ts` ja muokataan kehityspalvelimen portti:

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

`server.port` asettaa Vite-kehityspalvelimen portin. Oletusportti on 5173, mutta kurssilla käytetään porttia 3000, joka on määritetty myös palvelimen CORS-asetuksissa sallituksi lähteeksi.

---

## 5. Oletuspohjan siivoaminen

Viten oletuspohja sisältää esimerkkikoodia ja -tyylejä, joita ei tarvita. Poistetaan tai tyhjennetään seuraavat:

**Poistetaan turhat tiedostot:**

```bash
rm src/App.css
rm src/index.css
rm src/assets/react.svg
rm public/vite.svg
```

**Tyhjennetään `src/App.tsx`** ja korvataan demon omalla koodilla (katso pää-README:n vaihe 10).

**Muokataan `src/main.tsx`** importtaamaan Roboto-fontti MUI:ta varten:

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

Poistetaan CSS-importit (`import './index.css'` ja `import './App.css'`) ja lisätään tilalle Roboto-fontin importit. MUI käyttää Roboto-fonttia oletuksena.

---

## 6. Kehityspalvelimen käynnistys

Käynnistetään Vite-kehityspalvelin:

```bash
npm run dev
```

Sovellus aukeaa osoitteessa `http://localhost:3000`.

> **Huomio:** Kehityksen aikana ajetaan kahta palvelinta samanaikaisesti kahdessa erillisessä terminaalissa: Express-palvelinta (portti 3007) ja Vite-kehityspalvelinta (portti 3000).

---

## 7. Projektirakenteen katsaus

Vite-projektin luonnin ja siivoamisen jälkeen `client`-kansion rakenne:

```
client/
├── public/                   # Staattiset tiedostot
├── src/
│   ├── App.tsx               # Pääkomponentti
│   └── main.tsx              # Sovelluksen käynnistyspiste
├── index.html                # HTML-pohja (Viten entry point)
├── vite.config.ts            # Vite-konfiguraatio
├── tsconfig.json             # TypeScript-pääasetukset
├── tsconfig.app.json         # Sovelluskoodin TS-asetukset
├── tsconfig.node.json        # Node-tiedostojen TS-asetukset (vite.config.ts)
├── eslint.config.js          # ESLint-asetukset
└── package.json              # Riippuvuudet ja skriptit
```

| Tiedosto | Rooli |
|---|---|
| `index.html` | Viten entry point. Sisältää `<div id="root">` -elementin ja `<script>`-viittauksen `main.tsx`-tiedostoon |
| `vite.config.ts` | Viten konfiguraatio (pluginit, portti, proxy-asetukset) |
| `tsconfig.json` | Viittaa `tsconfig.app.json`- ja `tsconfig.node.json`-tiedostoihin |
| `tsconfig.app.json` | TypeScript-asetukset sovelluskoodille (`src/`-kansio) |
| `tsconfig.node.json` | TypeScript-asetukset konfiguraatiotiedostoille |

---

## 8. Hyödyllisiä komentoja

| Komento | Toiminto |
|---|---|
| `npm run dev` | Käynnistää kehityspalvelimen (HMR) |
| `npm run build` | Rakentaa tuotantoversion `dist/`-kansioon |
| `npm run preview` | Esikatselu tuotantoversiosta |
| `npm run lint` | Ajaa ESLint-tarkistukset |
