// Luo JWT-tokenin, jonka voi liittää asiakassovelluksen Authorization-headeriin.
// Aja tämä tiedosto ja kopioi tulostus client/src/App.tsx:n pyynnön header-tietoihin ('Auhtorization': 'Bearer tulostettu-token-tähän').
import { config } from "dotenv";
import jwt from "jsonwebtoken";

config();

const JWT_SALAISUUS = process.env.JWT_SALAISUUS;

if (!JWT_SALAISUUS) {
    throw new Error("JWT_SALAISUUS puuttuu tiedostosta server/.env");
}

// Tokenin muodostaminen
const token = jwt.sign({}, JWT_SALAISUUS, { algorithm: "HS256" });

console.log(token);
