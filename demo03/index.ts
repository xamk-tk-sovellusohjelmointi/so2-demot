import express from 'express';
import path from 'path';
import apiAjopaivakirjaRouter from './routes/apiAjopaivakirja';

const app: express.Application = express();

const portti: number = Number(process.env.PORT) || 3003;

app.use(express.static(path.resolve(import.meta.dirname, "public")));

app.use("/api/ajopaivakirja", apiAjopaivakirjaRouter);

app.listen(portti, (): void => {
    console.log(`Palvelin käynnistettiin osoitteeseen http://localhost:${portti}`);
});