# Demo 4: REST-rajapinnan testaus Postmanilla

Postman on työkalu HTTP-pyyntöjen lähettämiseen ja vastausten tarkasteluun. Sen avulla voidaan testata palvelimen REST-rajapintaa ilman selainta tai erillistä käyttöliittymää.

Käynnistä palvelin ensin:

```bash
npm run dev
```

Palvelin käynnistyy osoitteeseen `http://localhost:3004`.

> **Huom:** Demo 4 tallentaa ajot palvelimen muistissa olevaan taulukkoon. Tiedot häviävät, kun palvelin käynnistetään uudelleen.

---

## Yleiset asetukset

Jokaiselle pyynnölle määritetään Postmanissa kaksi asiaa:

- **Metodi** (GET, POST, PUT, DELETE) — valitaan pudotusvalikosta URL-kentän vasemmalta puolelta
- **URL** — kirjoitetaan osoitekenttään

POST- ja PUT-pyynnöissä, joissa lähetetään dataa palvelimelle, tarvitaan lisäksi:

- **Body-välilehti** → valitaan `raw` ja oikeaan laitaan muodoksi `JSON`
- **Sisältö** — kirjoitetaan JSON-objekti, jossa on pyynnön tiedot

`raw + JSON` -asetus on tärkeä, koska se asettaa pyynnön `Content-Type`-otsakkeen arvoksi `application/json`. Ilman tätä Express ei osaa jäsentää pyynnön runkoa oikein, ja `req.body` on tyhjä objekti.

---

## GET /api/ajopaivakirja — Kaikkien ajojen haku

Hakee kaikki muistissa olevat ajot taulukossa.

| Asetus | Arvo |
|--------|------|
| Metodi | GET |
| URL | `http://localhost:3004/api/ajopaivakirja` |
| Body | — (ei tarvita) |

Onnistunut vastaus: HTTP 200, taulukko ajoista. Jos taulukkoon ei ole lisätty ajoja, palautuu tyhjä taulukko `[]`.

[KUVA TÄHÄN]

---

## GET /api/ajopaivakirja/:id — Yksittäisen ajon haku

Hakee yhden ajon sen `id`-tunnuksella. Tunniste kirjoitetaan suoraan URL-osoitteeseen.

| Asetus | Arvo |
|--------|------|
| Metodi | GET |
| URL | `http://localhost:3004/api/ajopaivakirja/1` |
| Body | — (ei tarvita) |

Onnistunut vastaus: HTTP 200, yksittäinen ajo-objekti.

Jos annettua tunnistetta vastaavaa ajoa ei löydy: HTTP 404, `{ "viesti": "Ajoa ei löytynyt" }`.

[KUVA TÄHÄN]

---

## POST /api/ajopaivakirja — Uuden ajon lisääminen

Lisää uuden ajon muistitaulukkoon. Pyynnön rungossa lähetetään JSON-objekti, joka sisältää ajon tiedot. `id` lasketaan automaattisesti olemassa olevien ajojen perusteella ja `pvm` asetetaan lisäyshetkeksi, joten niitä ei anneta.

| Asetus | Arvo |
|--------|------|
| Metodi | POST |
| URL | `http://localhost:3004/api/ajopaivakirja` |
| Body-tyyppi | raw → JSON |

Body-sisältö:

```json
{
    "reitti": "Mikkeli-Juva-Mikkeli",
    "km": 86,
    "ajaja": "A12"
}
```

Kaikki kolme kenttää (`reitti`, `km`, `ajaja`) ovat pakollisia. Jos jokin puuttuu, palvelin palauttaa HTTP 400, `{ "viesti": "Virheellinen pyynnön body" }`.

Onnistunut vastaus: HTTP 201, **koko ajot-taulukko** lisäyksen jälkeen.

[KUVA TÄHÄN]

---

## PUT /api/ajopaivakirja/:id — Ajon tietojen päivittäminen

Korvaa olemassa olevan ajon kaikki tiedot pyynnön rungon arvoilla. Päivitettävän ajon tunniste kirjoitetaan URL-osoitteeseen.

| Asetus | Arvo |
|--------|------|
| Metodi | PUT |
| URL | `http://localhost:3004/api/ajopaivakirja/1` |
| Body-tyyppi | raw → JSON |

Body-sisältö:

```json
{
    "reitti": "Mikkeli-Ristiina-Mikkeli",
    "km": 40,
    "ajaja": "B07"
}
```

Kaikki kolme kenttää ovat pakollisia samoin kuin POST-pyynnössä.

Mahdolliset virhevastaukset:
- HTTP 404 — annettua tunnistetta ei löydy taulukosta
- HTTP 400 — pyynnön rungosta puuttuu pakollinen kenttä

Onnistunut vastaus: HTTP 200, **koko ajot-taulukko** päivityksen jälkeen.

[KUVA TÄHÄN]

---

## DELETE /api/ajopaivakirja/:id — Ajon poistaminen

Poistaa ajon muistitaulukosta. Poistettavan ajon tunniste kirjoitetaan URL-osoitteeseen.

| Asetus | Arvo |
|--------|------|
| Metodi | DELETE |
| URL | `http://localhost:3004/api/ajopaivakirja/1` |
| Body | — (ei tarvita) |

Jos annettua tunnistetta vastaavaa ajoa ei löydy: HTTP 404, `{ "viesti": "Ajoa ei löytynyt" }`.

Onnistunut vastaus: HTTP 200, **koko ajot-taulukko** poiston jälkeen.

[KUVA TÄHÄN]
