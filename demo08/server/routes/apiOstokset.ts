import express from 'express';
import { prisma } from '../lib/prisma.ts';
import { Virhe } from '../errors/virhekasittelija.ts';

const apiOstoksetRouter: express.Router = express.Router();
apiOstoksetRouter.use(express.json());

// Haetaan kaikki ostokset
apiOstoksetRouter.get('/', async (_req: express.Request, res: express.Response) => {
    const ostokset = await prisma.ostos.findMany();
    res.json(ostokset);
});

// Haetaan yksittäinen ostos
apiOstoksetRouter.get('/:id', async (req: express.Request, res: express.Response) => {
    const ostos = await prisma.ostos.findUnique({ where: { id: Number(req.params['id']) } });
    if (!ostos) throw new Virhe(404, 'Ostosta ei löytynyt');
    res.json(ostos);
});

// Lisätään uusi ostos
apiOstoksetRouter.post('/', async (req: express.Request, res: express.Response) => {
    if (!req.body.tuote) throw new Virhe(400, 'Virheellinen pyynnön body');
    await prisma.ostos.create({
        data: {
            tuote: req.body.tuote as string,
            poimittu: false,
        },
    });
    const ostokset = await prisma.ostos.findMany();
    res.status(201).json(ostokset);
});

// Päivitetään ostos
apiOstoksetRouter.put('/:id', async (req: express.Request, res: express.Response) => {
    const ostos = await prisma.ostos.findUnique({ where: { id: Number(req.params['id']) } });
    if (!ostos) throw new Virhe(404, 'Ostosta ei löydy');
    if (req.body.tuote === undefined && req.body.poimittu === undefined) throw new Virhe(400, 'Virheellinen pyynnön body');
    const paivitettyOstos = await prisma.ostos.update({
        where: { id: Number(req.params['id']) },
        data: {
            tuote: req.body.tuote ?? ostos.tuote,
            poimittu: req.body.poimittu ?? ostos.poimittu,
        },
    });
    res.json(paivitettyOstos);
});

// Poistetaan ostos ja palautetaan päivitetty lista
apiOstoksetRouter.delete('/:id', async (req: express.Request, res: express.Response) => {
    const ostos = await prisma.ostos.findUnique({ where: { id: Number(req.params['id']) } });
    if (!ostos) throw new Virhe(404, 'Ostosta ei löytynyt');
    await prisma.ostos.delete({ where: { id: Number(req.params['id']) } });
    const ostokset = await prisma.ostos.findMany();
    res.json(ostokset);
});

export default apiOstoksetRouter;
