import express, { type Application, type Request, type Response } from 'express';
import path from 'path';
import apiOstoksetRouter from './routes/apiOstokset';

const app: Application = express();

const port: number = Number(process.env.PORT) || 3003;

app.use(express.static(path.join(import.meta.dirname, "public")));

app.use("/api/ostokset", apiOstoksetRouter);

app.listen(port, () => {
    console.log(`Palvelin käynnistettiin osoitteeseen: http://localhost:${port}`);
});