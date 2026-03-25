import express from 'express';
import path from 'path';
import cors from 'cors';
import apiOstoksetRouter from './routes/apiOstokset';
import virhekasittelija from './errors/virhekasittelija';

const app: express.Application = express();

const portti: number = Number(process.env.PORT) || 3006;

// Sallitaan CORS asiakassovelluksiin
app.use(cors({ origin: 'http://localhost:3000' }));

app.use((_req: express.Request, _res: express.Response, next: express.NextFunction) => {
    setTimeout(() => next(), 500);
});

app.use(express.static(path.resolve(import.meta.dirname, 'public')));

app.use('/api/ostokset', apiOstoksetRouter);

app.use(virhekasittelija);

app.listen(portti, (): void => {
    console.log(`Palvelin käynnistettiin osoitteeseen http://localhost:${portti}`);
});
