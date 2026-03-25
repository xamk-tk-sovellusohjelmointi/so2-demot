# Demo 6: REST-rajapinnan testaus Postmanilla

Postman on työkalu HTTP-pyyntöjen lähettämiseen ja vastausten tarkasteluun. Sen avulla voidaan testata palvelimen REST-rajapintaa ilman selainta tai erillistä käyttöliittymää.

Käynnistä palvelin ensin:

```bash
npm run dev
```

Palvelin käynnistyy osoitteeseen `http://localhost:3006`.

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

## GET /api/ostokset — Kaikkien ostoksien haku

Hakee kaikki tietokantaan tallennetut ostokset taulukossa.

| Asetus | Arvo |
|--------|------|
| Metodi | GET |
| URL | `http://localhost:3006/api/ostokset` |
| Body | — (ei tarvita) |

Onnistunut vastaus: HTTP 200, taulukko ostoksista. Jos tietokanta on tyhjä, palautuu tyhjä taulukko `[]`.

---

## GET /api/ostokset/:id — Yksittäisen ostoksen haku

Hakee yhden ostoksen sen `id`-tunnuksella. Tunniste kirjoitetaan suoraan URL-osoitteeseen.

| Asetus | Arvo |
|--------|------|
| Metodi | GET |
| URL | `http://localhost:3006/api/ostokset/1` |
| Body | — (ei tarvita) |

Onnistunut vastaus: HTTP 200, yksittäinen ostos-objekti.

Jos annettua tunnistetta vastaavaa ostosta ei löydy: HTTP 404, `{ "viesti": "Ostosta ei löytynyt" }`.

---

## POST /api/ostokset — Uuden ostoksen lisääminen

Lisää uuden ostoksen tietokantaan. Pyynnön rungossa lähetetään vain `tuote`-kenttä — `id` asetetaan automaattisesti ja `poimittu` on oletuksena `false`.

| Asetus | Arvo |
|--------|------|
| Metodi | POST |
| URL | `http://localhost:3006/api/ostokset` |
| Body-tyyppi | raw → JSON |

Body-sisältö:

```json
{
    "tuote": "Maito"
}
```

`tuote`-kenttä on pakollinen. Jos se puuttuu, palvelin palauttaa HTTP 400, `{ "viesti": "Virheellinen pyynnön body" }`.

Onnistunut vastaus: HTTP 201, päivitetty lista kaikista ostoksista (mukaan lukien uusi ostos).

---

## PUT /api/ostokset/:id — Ostoksen päivittäminen

Päivittää olemassa olevan ostoksen `tuote`- ja/tai `poimittu`-kentän. Päivitettävän ostoksen tunniste kirjoitetaan URL-osoitteeseen. Vähintään yksi kentistä on annettava.

| Asetus | Arvo |
|--------|------|
| Metodi | PUT |
| URL | `http://localhost:3006/api/ostokset/1` |
| Body-tyyppi | raw → JSON |

Body-sisältö (molemmat kentät tai vain toinen):

```json
{
    "tuote": "Rasvaton maito",
    "poimittu": true
}
```

Mahdolliset virhevastaukset:
- HTTP 404 — annettua tunnistetta ei löydy tietokannasta
- HTTP 400 — pyynnön rungosta puuttuu molemmat kentät

Onnistunut vastaus: HTTP 200, päivitetty ostos-objekti.

---

## DELETE /api/ostokset/:id — Ostoksen poistaminen

Poistaa ostoksen tietokannasta. Poistettavan ostoksen tunniste kirjoitetaan URL-osoitteeseen.

| Asetus | Arvo |
|--------|------|
| Metodi | DELETE |
| URL | `http://localhost:3006/api/ostokset/1` |
| Body | — (ei tarvita) |

Jos annettua tunnistetta vastaavaa ostosta ei löydy: HTTP 404, `{ "viesti": "Ostosta ei löytynyt" }`.

Onnistunut vastaus: HTTP 200, päivitetty lista kaikista jäljelle jääneistä ostoksista.
