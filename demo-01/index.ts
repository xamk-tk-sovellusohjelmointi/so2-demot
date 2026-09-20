import express, { type Application, type Request, type Response } from 'express';
import path from 'path';

const app: Application = express();

const port: number = Number(process.env.PORT) || 3001;

app.use(express.static(path.join(import.meta.dirname, "public")));

app.get("/heippa", (req: Request, res: Response) => {

    let nimi: string = "";

    if (typeof req.query.nimi === "string") {
        nimi = req.query.nimi;
    } else {
        nimi = "tuntematon";
    }

    res.send(`<h1>Heippa ${nimi}!</h1>`);

});

app.get("/moikka", (req: Request, res: Response) => {
    res.send("<h1>Moikka!</h1>")
});

app.listen(port, () => {
    console.log(`Palvelin käynnistettiin osoitteeseen: http://localhost:${port}`);
});