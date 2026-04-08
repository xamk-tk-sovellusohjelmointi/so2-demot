import express from 'express';
import { prisma } from '../lib/prisma';
import { Virhe } from '../errors/virhekasittelija';

const apiAjopaivakirjaRouter: express.Router = express.Router();
apiAjopaivakirjaRouter.use(express.json());

// Haetaan kaikki ajot
apiAjopaivakirjaRouter.get("/", async (_req: express.Request, res: express.Response) => {
    const ajot = await prisma.ajo.findMany();
    res.json(ajot);
});

// Haetaan yksi ajo
apiAjopaivakirjaRouter.get("/:id", async (req: express.Request, res: express.Response) => {
    const ajo = await prisma.ajo.findUnique({ where: { id: Number(req.params.id) } });
    if (!ajo) throw new Virhe(404, "Ajoa ei löytynyt");
    res.json(ajo);
});

// Lisätään uusi ajo
apiAjopaivakirjaRouter.post("/", async (req: express.Request, res: express.Response) => {
    if (!req.body.reitti || !req.body.km || !req.body.ajaja) throw new Virhe(400, "Virheellinen pyynnön body");
    const uusiAjo = await prisma.ajo.create({
        data: {
            reitti: req.body.reitti,
            km: Number(req.body.km),
            ajaja: req.body.ajaja,
        },
    });
    res.status(201).json(uusiAjo);
});

// Muokataan ajoa
apiAjopaivakirjaRouter.put("/:id", async (req: express.Request, res: express.Response) => {
    const ajo = await prisma.ajo.findUnique({ where: { id: Number(req.params.id) } });
    if (!ajo) throw new Virhe(404, "Ajoa ei löydy");
    if (!req.body.reitti || !req.body.km || !req.body.ajaja) throw new Virhe(400, "Virheellinen pyynnön body");
    const paivitettyAjo = await prisma.ajo.update({
        where: { id: Number(req.params.id) },
        data: {
            reitti: req.body.reitti,
            km: Number(req.body.km),
            ajaja: req.body.ajaja,
        },
    });
    res.json(paivitettyAjo);
});

// Poistetaan ajo
apiAjopaivakirjaRouter.delete("/:id", async (req: express.Request, res: express.Response) => {
    const ajo = await prisma.ajo.findUnique({ where: { id: Number(req.params.id) } });
    if (!ajo) throw new Virhe(404, "Ajoa ei löytynyt");
    await prisma.ajo.delete({ where: { id: Number(req.params.id) } });
    res.json(ajo);
});

export default apiAjopaivakirjaRouter;
