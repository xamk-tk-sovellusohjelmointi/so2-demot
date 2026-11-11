# Demo 1: Express-perusteita – referenssi

## Reitit

Palvelin kuuntelee oletuksena porttia 3001 (<http://localhost:3001>), ellei ympäristömuuttujaa `PORT` ole asetettu.

| Metodi | Polku | Pyynnön runko | Vastaus | Huomiot |
|---|---|---|---|---|
| GET | `/` | – | `public/index.html` | `express.static` jakaa tiedoston. Sivulla on linkit reitteihin `/heippa` ja `/moikka`. |
| GET | `/img/xamklogo.png` | – | Kuvatiedosto `public/img/xamklogo.png` | `express.static` jakaa tiedoston. |
| GET | `/heippa` | – | HTML: `<h1>Heippa <nimi>!</h1>` | Kyselyparametri `nimi` (esim. `/heippa?nimi=Matti`). Jos parametri puuttuu tai ei ole merkkijono, nimenä käytetään `tuntematon`. Tyhjä arvo (`/heippa?nimi=`) tuottaa tyhjän nimen. |
| GET | `/moikka` | – | HTML: `<h1>Moikka!</h1>` | – |

Muihin polkuihin Express vastaa tilakoodilla 404 ja HTML-sivulla, jossa lukee `Cannot GET <polku>`.

## Tekniikat

### Ydinmalli: reitti, joka vastaa selaimelle

```typescript
app.get("/moikka", (req: Request, res: Response) => {
    res.send("<h1>Moikka!</h1>")
});
```

### Express-sovelluksen luominen ja käynnistäminen

```typescript
import express, { type Application } from 'express';

const app: Application = express();

const port: number = Number(process.env.PORT) || 3001;

app.listen(port, () => {
    console.log(`Palvelin käynnistettiin osoitteeseen: http://localhost:${port}`);
});
```

### Tyyppien tuonti `type`-sanalla (`verbatimModuleSyntax`)

```typescript
import express, { type Application, type Request, type Response } from 'express';
```

### Kyselyparametrin lukeminen

```typescript
app.get("/heippa", (req: Request, res: Response) => {

    let nimi: string = "";

    if (typeof req.query.nimi === "string") {
        nimi = req.query.nimi;
    } else {
        nimi = "tuntematon";
    }

    res.send(`<h1>Heippa ${nimi}!</h1>`);

});
```

### Staattiset tiedostot `public`-kansiosta

```typescript
import path from 'path';

app.use(express.static(path.join(import.meta.dirname, "public")));
```

### Lukittujen pakettien asennus ja projektin komennot

```bash
npm ci               # asentaa package-lock.json-tiedoston versiot
npm run dev          # tsx watch ./index.ts, käynnistyy uudelleen tallennettaessa
npm run typecheck    # tsc --noEmit, tarkistaa tyypit luomatta tiedostoja
```
