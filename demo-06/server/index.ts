import express, { type Application, type NextFunction, type Request, type Response } from 'express';
import path from 'path';
import apiOstoksetRouter from './routes/apiOstokset';
import virhekasittelija, { Virhe } from './errors/virhekasittelija';
import cors from 'cors';

const app: Application = express();

const port: number = Number(process.env.PORT) || 3006;

app.use(cors({ origin: "http://localhost:3000" }));

app.use((req: Request, res: Response, next: NextFunction) => {
    setTimeout(() => next(), 1000);
});

app.use(express.static(path.join(import.meta.dirname, "public")));

app.use("/api/ostokset", apiOstoksetRouter);

app.use((req: Request, res: Response, next: NextFunction) => {
    next(new Virhe(404, "Virheellinen reitti"))
});

app.use(virhekasittelija);

app.listen(port, () => {
    console.log(`Palvelin käynnistettiin osoitteeseen: http://localhost:${port}`);
});