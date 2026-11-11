# Demo 9: Ajopäiväkirja MySQL-tietokannalla (Express ja Prisma v7 + MySQL/MariaDB)

Tämä kansio on kopio aloituspohjasta [`Starter-Using-Prisma`](../Starter-Using-Prisma/README.md). Ainoa ero on tietokanta: SQLite-tiedoston `dev.db` sijaan Prisma käyttää erillistä MySQL-palvelinta. Sovelluskoodi (`index.ts`, `prisma/seed.ts`, tietomalli `Ajo`) on muuten sama.

Ohjeet on kirjoitettu ensisijaisesti Windows 11:lle ja XAMPPille. Linux- ja macOS-ohjeet ovat lopussa luvussa [4](#4-linux-ja-macos).

> **Huomio:** XAMPP asentaa nykyään MySQL:n sijaan MariaDB-palvelimen, joka on MySQL-yhteensopiva. XAMPPin ohjauspaneeli ja ohjeet puhuvat silti MySQL:stä. Prisma käyttää molemmille samaa `mysql`-providera ja samaa `@prisma/adapter-mariadb`-adapteria.

---

## 1. Projektin sisältö

```text
Final-Using-MySQL/
├── errors/
│   └── virhekasittelija.ts    # Virhe-luokka ja virheenkäsittelijä
├── generated/prisma/          # npx prisma generate -komennon tuottama Prisma Client (ei versionhallinnassa)
├── lib/
│   └── prisma.ts              # PrismaClient-olio ja MySQL-yhteys
├── prisma/
│   ├── migrations/            # Syntyy, kun ajat npx prisma migrate dev (luku 3)
│   ├── schema.prisma          # Tietomalli (Ajo), provider = "mysql"
│   └── seed.ts                # Esimerkkidata tietokantaan
├── public/
│   └── index.html             # Etusivu
├── routes/
│   └── apiAjot.ts             # REST API -reitit osoitteessa /api/ajot
├── .env                       # DATABASE_URL (ei versionhallinnassa)
├── .env.example               # Mallitiedosto .env-tiedostolle
├── index.ts                   # Express-palvelin, API-reitit ja virheenkäsittely
├── package.json
├── prisma7.config.ts          # Prisman asetukset ja seed-komento (ennallaan)
└── tsconfig.json
```

Aloituspohjan `dev.db` ja SQLite-migraatiot on poistettu, koska ne eivät toimi MySQL:n kanssa.

---

## 2. Prisma v7:n vaihtaminen SQLitesta MySQL:ään

Nämä muutokset on jo tehty tähän projektiin. Ne ovat samat, jos teet vaihdon itse aloituspohjaan.

**1. Vaihda ajuriadapteri.** Poista SQLite-adapteri tyyppeineen ja asenna MySQL/MariaDB-adapteri:

```bash
npm uninstall @prisma/adapter-better-sqlite3 @types/better-sqlite3
npm install --save-exact @prisma/adapter-mariadb@7.10.0
```

Poista lisäksi `package.json`-tiedoston `allowScripts`-kohdasta rivi `"better-sqlite3@12.11.1": true`, koska pakettia ei enää käytetä.

**2. Vaihda tietokannan tyyppi** tiedostossa `prisma/schema.prisma`:

```prisma
datasource db {
  provider = "mysql"
}
```

**3. Vaihda yhteysosoite** tiedostossa `.env`. Osoitteen muoto on `mysql://KÄYTTÄJÄ:SALASANA@PALVELIN:PORTTI/TIETOKANTA`. XAMPPin oletuksilla (käyttäjä `root`, ei salasanaa, portti `3306`) se on:

```bash
DATABASE_URL="mysql://root@localhost:3306/ajopaivakirja"
```

Jos käyttäjällä on salasana, se tulee kaksoispisteen jälkeen: `mysql://root:salasana@localhost:3306/ajopaivakirja`.

**4. Vaihda adapteri** tiedostossa `lib/prisma.ts`:

```typescript
import "dotenv/config";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "../generated/prisma/client";

const connectionString = `${process.env.DATABASE_URL}`;

const adapter = new PrismaMariaDb(connectionString);
const prisma = new PrismaClient({ adapter });

export { prisma };
```

`PrismaMariaDb` hyväksyy saman `mysql://`-osoitteen kuin Prisman komentorivityökalu, joten molemmat lukevat yhteystiedot samasta `DATABASE_URL`-muuttujasta. Prisman virallinen pikaopas antaa adapterille vaihtoehtoisesti erilliset kentät (`host`, `user`, `password`, `database`).

**5. Poista SQLite-tiedostot.** Poista kansio `prisma/migrations` ja tiedosto `dev.db`. Vanhat migraatiot on kirjoitettu SQLiten kirjoitustyylillä, ja `migration_lock.toml` lukitsee ne SQLiteen. Uusi migraatio luodaan MySQL:lle luvussa 3.

**6. Generoi Prisma Client uudelleen:**

```bash
npx prisma generate
```

`prisma7.config.ts` pysyy ennallaan, koska se lukee osoitteen jo `DATABASE_URL`-muuttujasta.

---

## 3. MySQL-palvelin XAMPPilla (Windows 11)

**1. Asenna XAMPP.** Lataa Windows-asennusohjelma osoitteesta [apachefriends.org](https://www.apachefriends.org/). Komponenteista tarvitaan vähintään **Apache**, **MySQL** ja **phpMyAdmin**. Hyväksy oletuskansio `C:\xampp`.

**2. Käynnistä palvelimet.** Avaa **XAMPP Control Panel** ja paina **Start**-painiketta riveillä **Apache** ja **MySQL**. Apache tarvitaan phpMyAdminia varten. Jos Windowsin palomuuri kysyy lupaa, salli yhteydet.

**3. Avaa phpMyAdmin.** Paina MySQL-rivin **Admin**-painiketta tai avaa selaimessa <http://localhost/phpmyadmin>. XAMPPin oletuksilla kirjautumista ei kysytä, koska `root`-käyttäjällä ei ole salasanaa.

**4. Luo tietokanta.** Valitse ylävalikosta **Databases** (suomeksi **Tietokannat**). Kirjoita nimeksi `ajopaivakirja`, valitse merkistöksi `utf8mb4_unicode_ci` ja paina **Create** (**Luo**). Tietokanta jää tyhjäksi. Taulun luo Prisma seuraavassa vaiheessa.

**5. Tarkista `.env`.** Oletusasennuksessa luvun 2 osoite `mysql://root@localhost:3306/ajopaivakirja` toimii sellaisenaan. Jos olet antanut `root`-käyttäjälle salasanan tai vaihtanut porttia, päivitä osoite vastaamaan niitä.

**6. Luo Ajo-taulu migraatiolla:**

```bash
npx prisma migrate dev --name init
```

Komento luo kansioon `prisma/migrations/<aikaleima>_init/` tiedoston `migration.sql` ja ajaa sen tietokantaan:

```sql
-- CreateTable
CREATE TABLE `Ajo` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `reitti` VARCHAR(191) NOT NULL,
    `km` INTEGER NOT NULL,
    `ajaja` VARCHAR(191) NOT NULL,
    `pvm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Päivitä phpMyAdmin (F5). Tietokannassa `ajopaivakirja` on nyt taulut `Ajo` ja `_prisma_migrations`. Jälkimmäiseen Prisma kirjaa ajetut migraatiot.

> **Huomio:** `migrate dev` luo vertailua varten väliaikaisen varjotietokannan (shadow database) ja poistaa sen lopuksi. Käyttäjällä pitää siksi olla oikeus luoda ja poistaa tietokantoja. XAMPPin `root`-käyttäjällä se on valmiiksi.

**7. Täytä tietokanta:**

```bash
npx prisma db seed
```

```bash
Tietokantaan lisättiin 5 ajoa.
🌱  The seed command has been executed.
```

Rivit näkyvät phpMyAdminissa, kun valitset taulun `Ajo` ja välilehden **Browse** (**Selaa**).

**8. Käynnistä sovellus** komennolla `npm run dev`. MySQL:n pitää olla käynnissä XAMPPissa aina, kun sovellus käyttää tietokantaa.

### Yleisimmät virheet

| Virheilmoitus | Syy |
|---|---|
| `pool timeout: failed to retrieve a connection from pool` | MySQL ei ole käynnissä, tai portti on väärä. Käynnistä MySQL XAMPPin ohjauspaneelista. |
| `Access denied for user 'root'@'localhost'` | Käyttäjä tai salasana on väärä `DATABASE_URL`-osoitteessa. |
| MySQL ei käynnisty XAMPPissa | Portti `3306` on toisen ohjelman (esim. erikseen asennetun MySQL:n) käytössä. Sammuta se ohjelma tai vaihda XAMPPin portti (MySQL-rivin **Config** → `my.ini`) ja `DATABASE_URL`. |

> **Huomio:** XAMPPin oletusasetukset, kuten salasanaton `root`, on tarkoitettu vain omalle kehityskoneelle. XAMPPia ei ole tarkoitettu tuotantokäyttöön.

---

## 4. Linux ja macOS

Prisman puolella kaikki on samoin kuin luvussa 2. Ainoastaan MySQL-palvelimen asennus ja käyttäjät hoidetaan eri tavalla. Alla ovat vaiheet pääpiirteissään. Selvitä tarkat komennot oman käyttöjärjestelmäsi ja jakelusi ohjeista (lähteet luvun lopussa).

### Linux

1. **Selvitä, mikä palvelin jakelullesi on tarjolla.** Monen jakelun omassa paketinhallinnassa on MariaDB, osassa MySQL, ja jossain se voi olla jo asennettuna. Jos jakelusi paketteja ei ole tai ne ovat liian vanhoja, MySQL ja MariaDB tarjoavat omat pakettivarastonsa yleisimmille jakeluille. Kumpi tahansa käy.
2. **Asenna palvelin ja käynnistä se palveluna.** Halutessasi määritä se käynnistymään automaattisesti koneen käynnistyessä.
3. **Suojaa asennus ja selvitä root-käyttäjän kirjautumistapa.** MariaDB:n `root`-käyttäjä kirjautuu Linuxissa oletuksena käyttöjärjestelmän root-tunnuksilla (unix_socket), ei salasanalla. Node-sovellus ei siksi pääse sisään `root`-käyttäjänä ilman lisämäärityksiä.
4. **Luo sovellukselle oma käyttäjä salasanoineen.** Anna käyttäjälle kaikki oikeudet tietokantaan `ajopaivakirja` sekä oikeus luoda ja poistaa varjotietokanta, jota `migrate dev` tarvitsee (Prisman shadow database -ohje).
5. **Luo tietokanta `ajopaivakirja`** merkistöllä `utf8mb4` haluamallasi SQL-asiakasohjelmalla tai graafisella työkalulla.
6. **Päivitä `.env`** omalla käyttäjälläsi ja salasanallasi, esim. `mysql://KÄYTTÄJÄ:SALASANA@localhost:3306/ajopaivakirja`, ja jatka luvun 3 vaiheesta 6.

### macOS

1. **Asenna MySQL tai MariaDB.** MySQL:llä on macOS:lle virallinen asennusohjelma. Asennusohjelma pyytää asettamaan `root`-käyttäjän salasanan, joten ota se talteen.
2. **Käynnistä palvelin.** MySQL:n virallinen asennus lisää Järjestelmäasetuksiin MySQL-paneelin, josta palvelimen voi käynnistää, pysäyttää ja asettaa käynnistymään automaattisesti.
3. **Luo tietokanta `ajopaivakirja`** merkistöllä `utf8mb4`. Halutessasi luo sovellukselle oma käyttäjä kuten Linux-ohjeen vaiheessa 4.
4. **Päivitä `.env`** käyttäjällä ja salasanalla, esim. `mysql://root:SALASANA@localhost:3306/ajopaivakirja`, ja jatka luvun 3 vaiheesta 6.

### Lähteet

- Prisma: [Quickstart: Prisma ORM with MySQL](https://www.prisma.io/docs/prisma-orm/quickstart/mysql), [MySQL/MariaDB](https://www.prisma.io/docs/orm/overview/databases/mysql), [Shadow database](https://www.prisma.io/docs/orm/prisma-migrate/understanding-prisma-migrate/shadow-database)
- XAMPP: [Windows FAQ](https://www.apachefriends.org/faq_windows.html)
- MySQL: [Installing MySQL on Linux](https://dev.mysql.com/doc/refman/8.4/en/linux-installation.html), [Installing MySQL on macOS](https://dev.mysql.com/doc/refman/8.4/en/macos-installation.html), [Postinstallation Setup and Testing](https://dev.mysql.com/doc/refman/8.4/en/postinstallation.html)
- MariaDB: [Install and Upgrade MariaDB](https://mariadb.com/docs/server/server-management/install-and-upgrade-mariadb), [Authentication from MariaDB 10.4](https://mariadb.com/docs/server/security/user-account-management/authentication-from-mariadb-10-4)
