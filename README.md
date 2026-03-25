# Sovellusohjelmointi 2 — demot

Tämä repositorio sisältää Sovellusohjelmointi 2 -opintojakson demoprojektit. Opintojaksolla rakennetaan palvelinpuolen web-sovelluksia Node.js:llä, Express-sovelluskehyksellä ja TypeScriptillä. Demoissa edetään vaiheittain yksinkertaisesta HTTP-palvelimesta aina tietokantapohjaiseen REST-rajapintaan.

---

## Demo 1 — Express-perusteet

Ensimmäisessä demossa pystytetään yksinkertainen Express-palvelin ja tutustutaan HTTP-pyyntöjen ja -vastausten perusteisiin. Demo kattaa staattisten tiedostojen tarjoamisen `express.static()`-middlewarella, GET-reittien rekisteröinnin sekä URL-kyselyparametrien lukemisen `req.query`-objektista.

## Demo 2 — Web Service ja JSON-rajapinta

Toisessa demossa siirrytään HTML-sivujen tarjoamisesta koneiden väliseen tiedonsiirtoon. Palvelin palauttaa dataa JSON-muodossa eri reiteiltä. Demo esittelee TypeScript-rajapintojen (`interface`) käytön, tietomallin erottamisen omaan tiedostoonsa, datan muuntamisen `map()`-metodilla, arkaluonteisten kenttien piilottamisen vastauksista sekä URL-reittiparametrien käytön `req.params`-objektin kautta.

## Demo 3 — REST API

Kolmannessa demossa rakennetaan täysimittainen REST-rajapinta ajopäiväkirjasovellukselle. Rajapinta toteuttaa kaikki neljä perustoimintoa: tietojen hakeminen (GET), lisääminen (POST), päivittäminen (PUT) ja poistaminen (DELETE). Data tallennetaan palvelimen muistissa olevaan taulukkoon. Demo esittelee HTTP-tilakoodien oikean käytön ja pyyntörungon (`req.body`) lukemisen.

## Demo 4 — Virhekäsittelijä

Neljäs demo jatkaa demo 3:n REST-rajapintaa lisäämällä keskitetyn virhekäsittelyn. Reiteissä ei enää käsitellä virheitä suoraan, vaan heitetään `Virhe`-luokan ilmentymiä, jotka Express välittää erilliselle virhekäsittelijämiddlewarelle. Tämä selkeyttää reittikoodia ja keskittää virhevastausten muotoilun yhteen paikkaan.

## Demo 5 — Prisma ORM ja SQLite-tietokanta

Viidennessä demossa muistitaulukko korvataan pysyvällä SQLite-tietokannalla Prisma ORM:n avulla. Demo esittelee ORM:n käsitteen, Prisman keskeisimmät tietokantametodit (`findMany`, `findUnique`, `create`, `update`, `delete`) sekä asynkronisen ohjelmoinnin (`async/await`), jota tietokantakutsut edellyttävät. Express 5:n automaattinen virheenpropagaatio `async`-reiteistä poistaa tarpeen erillisille `try/catch`-lohkoille.

## Demo 6 — React-asiakassovellus ja REST API

Kuudennessa demossa palvelinsovellukseen liitetään React-asiakassovellus. Palvelimen puolella otetaan käyttöön CORS-middleware (`cors`-paketti), joka sallii selainsovelluksen pyynnöt eri originista. Asiakassovellus on rakennettu Reactilla ja Vitellä, ja se käyttää MUI-komponenttikirjastoa käyttöliittymän rakentamiseen. Demo esittelee asiakas-palvelin -arkkitehtuurin perustan ja asynkronisen tiedonhaun `fetch`-rajapinnalla.

## Demo 7 — JWT-autorisointi

Seitsemännessä demossa palvelinsovellukseen lisätään JWT-pohjainen (JSON Web Token) autorisointi. CORS suojaa vain selainpyyntöjä, mutta JWT toimii kaikilla asiakkailla — myös Postmanilla ja komentorivityökaluilla. Demo esittelee JWT:n rakenteen (header, payload, signature), tokenin luomisen `jsonwebtoken`-kirjastolla sekä middleware-funktion, joka tarkistaa jokaisen pyynnön yhteydessä, että mukana on oikea token.
