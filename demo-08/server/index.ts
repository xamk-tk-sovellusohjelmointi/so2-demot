import express, { type Application, type NextFunction, type Request, type Response } from 'express';
import path from 'path';
import apiOstoksetRouter from './routes/apiOstokset';
import apiAuthRouter from './routes/apiAuth';
import virhekasittelija, { Virhe } from './errors/virhekasittelija';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import { config } from "dotenv";
config();

const JWT_SALAISUUS = process.env.JWT_SALAISUUS;

const app: Application = express();
const port: number = Number(process.env.PORT) || 3008;

//app.use(cors({ origin: "http://localhost:3000"}));
app.use(express.json());

const tarkistaToken = (req: Request, res: Response, next: NextFunction) => {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
        return res.status(401).json();
    }
    try {
        const token: string | undefined = header.split(" ")[1];
        if (!token || !JWT_SALAISUUS) { return res.status(500).json() }
        jwt.verify(token, JWT_SALAISUUS, { algorithms: ["HS256"] });
    } catch {
        res.status(401).json();
    }

    next();
}

app.use(express.static(path.join(import.meta.dirname, "public")));

app.use("/api/auth", apiAuthRouter);

app.use("/api/ostokset", tarkistaToken, apiOstoksetRouter);

app.use((req: Request, res: Response, next: NextFunction) => {
    next(new Virhe(404, "Virheellinen reitti"));
});

app.use(virhekasittelija);

app.listen(port, () => {
    console.log(`Palvelin käynnistettiin osoitteeseen: http://localhost:${port}`);
});