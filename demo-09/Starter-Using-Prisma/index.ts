import express, { type Application } from 'express';
import path from 'path';

const app: Application = express();

const port: number = Number(process.env.PORT) || 3009;

app.use(express.static(path.join(import.meta.dirname, "public")));

app.listen(port, () => {
    console.log(`Palvelin käynnistettiin osoitteeseen: http://localhost:${port}`);
});
