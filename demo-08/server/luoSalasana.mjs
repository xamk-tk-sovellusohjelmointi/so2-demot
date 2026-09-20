// Enkryptaa salasanan, jonka voi liittää testikäyttäjän tietoihin tietokantaan
// Salasanoja ei säilytetä selkokielisenä tietokannassa
import crypto from 'crypto';

const hash = crypto.createHash("SHA256").update("passu123").digest("hex");

console.log(hash);