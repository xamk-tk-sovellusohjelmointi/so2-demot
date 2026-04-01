import express from 'express';
import { createHash } from 'crypto';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma.ts';
import { Virhe } from '../errors/virhekasittelija.ts';

const apiAuthRouter: express.Router = express.Router();
apiAuthRouter.use(express.json());

// POST /api/auth/login — tarkistaa tunnukset ja palauttaa JWT-tokenin
apiAuthRouter.post('/login', async (req: express.Request, res: express.Response) => {
    const kayttaja = await prisma.kayttaja.findFirst({
        where: { kayttajatunnus: req.body.kayttajatunnus as string },
    });

    if (!kayttaja) throw new Virhe(401, 'Virheellinen käyttäjätunnus tai salasana');

    const hash = createHash('SHA256').update(req.body.salasana as string).digest('hex');

    if (hash !== kayttaja.salasana) throw new Virhe(401, 'Virheellinen käyttäjätunnus tai salasana');

    const token = jwt.sign({ id: kayttaja.id }, 'ToinenSalausLause_25');

    res.json({ token });
});

export default apiAuthRouter;
