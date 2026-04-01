import express from 'express';
import path from 'path';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import apiAuthRouter from './routes/apiAuth.ts';
import apiOstoksetRouter from './routes/apiOstokset.ts';
import virhekasittelija from './errors/virhekasittelija.ts';

const app: express.Application = express();

const portti: number = Number(process.env.PORT) || 3008;

// JWT-tarkistus middlewarena — käytetään vain suojatuissa reiteissä
const checkToken = (req: express.Request, res: express.Response, next: express.NextFunction): void => {
    try {
        const token: string = req.headers.authorization!.split(' ')[1]!;
        jwt.verify(token, 'ToinenSalausLause_25');
        next();
    } catch (_e) {
        res.status(401).json({ viesti: 'Virheellinen tai puuttuva token' });
    }
};

// Sallitaan CORS asiakassovellukselle (Vite-kehityspalvelin portissa 3000)
app.use(cors({ origin: 'http://localhost:3000' }));

// Simuloidaan verkkoviivettä kehitystä varten
app.use((_req: express.Request, _res: express.Response, next: express.NextFunction) => {
    setTimeout(() => next(), 500);
});

app.use(express.static(path.resolve(import.meta.dirname, 'public')));

// Kirjautumisreitti — ei vaadi tokenia
app.use('/api/auth', apiAuthRouter);

// Ostoslistareitti — vaatii tokenin (checkToken-middleware ennen reittikäsittelijää)
app.use('/api/ostokset', checkToken, apiOstoksetRouter);

app.use(virhekasittelija);

// 404-käsittelijä — tuntematon reitti
app.use((_req: express.Request, res: express.Response, next: express.NextFunction): void => {
    if (!res.headersSent) {
        res.status(404).json({ viesti: 'Virheellinen reitti' });
    }
    next();
});

app.listen(portti, (): void => {
    console.log(`Palvelin käynnistettiin osoitteeseen http://localhost:${portti}`);
});
