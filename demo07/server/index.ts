import express from 'express';
import path from 'path';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import apiOstoksetRouter from './routes/apiOstokset';
import virhekasittelija from './errors/virhekasittelija';

const app: express.Application = express();

const portti: number = Number(process.env.PORT) || 3007;

// Sallitaan CORS asiakassovelluksille (Vite-kehityspalvelin portissa 3000)
app.use(cors({ origin: 'http://localhost:3000' }));

// JWT-autorisoinnin middleware — tarkistaa jokaisen pyynnön tokenin
app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
        // Poimitaan Authorization-headerista token (muoto: "Bearer <token>")
        const token: string = req.headers.authorization!.split(' ')[1]!;

        // Varmennetaan token salaisen avaimen avulla
        jwt.verify(token, 'SalausLause_25');

        // Jos token on oikea, päästetään pyyntö eteenpäin
        next();
    } catch (_e) {
        // Token puuttuu tai on väärä → 401 Unauthorized
        res.status(401).json({ viesti: 'Virheellinen token' });
    }
});

app.use((_req: express.Request, _res: express.Response, next: express.NextFunction) => {
    setTimeout(() => next(), 500);
});

app.use(express.static(path.resolve(import.meta.dirname, 'public')));

app.use('/api/ostokset', apiOstoksetRouter);

app.use(virhekasittelija);

app.listen(portti, (): void => {
    console.log(`Palvelin käynnistettiin osoitteeseen http://localhost:${portti}`);
});
