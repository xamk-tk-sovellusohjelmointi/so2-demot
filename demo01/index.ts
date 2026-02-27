import express from 'express';
import path from 'path';

const app: express.Application = express();

const portti: number = Number(process.env.PORT) || 3001;

app.use(express.static(path.resolve(import.meta.dirname, "public")));

/*
app.get("/", (req: express.Request, res: express.Response): void => {
    res.send("<h1>Heippa maailma, Henri kävi täällä!</h1>");
});
*/

app.get("/heippa", (req: express.Request, res: express.Response): void => {

    let nimi: string = "";

    if (typeof req.query.nimi === "string") {
        nimi = req.query.nimi;
    } else {
        nimi = "tuntematon";
    }

    res.send(`<h1>Heippa, ${nimi}!</h1>`);

});

app.get("/moikka", (req: express.Request, res: express.Response): void => {
    res.send(`<h1>Moikka!</h1>`);
});

app.listen(portti, (): void => {
    console.log(`Palvelin käynnistyi osoitteeseen: http://localhost:${portti}`);
});