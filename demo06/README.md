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
[asiakassovelluksen rakentaminen](./client/README.md)


Asiakassovellus avautuu osoitteeseen `http://localhost:3000`.
