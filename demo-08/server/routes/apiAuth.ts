import express, { type Request, type Response } from 'express';
import { prisma } from '../lib/prisma';
import { Virhe } from '../errors/virhekasittelija';
import { config } from 'dotenv';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

config();

const JWT_SALAISUUS = process.env.JWT_SALAISUUS;

const apiAuthRouter: express.Router = express.Router();

apiAuthRouter.use(express.json());

apiAuthRouter.post("/login", async (req: Request, res: Response) => {

    const { kayttajatunnus, salasana } = req.body ?? {};

    if (typeof kayttajatunnus !== "string" || typeof salasana !== "string") {
        throw new Virhe(400, "Virheellinen pyyntö");
    }

    const kayttaja = await prisma.kayttaja.findFirst({
        where: {
            kayttajatunnus: kayttajatunnus
        }
    });

    const hash = crypto.createHash("SHA256").update(salasana).digest("hex");

    if (kayttaja && hash === kayttaja.salasana) {
        if (!JWT_SALAISUUS) { return res.status(500).json() }
        const token = jwt.sign({}, JWT_SALAISUUS);
        res.json({ token });
    } else {
        throw new Virhe(401, "Virheellinen käyttäjätunnus tai salasana");
    }
});

export default apiAuthRouter;
