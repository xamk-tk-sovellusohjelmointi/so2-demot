import express, { type Request, type Response, type Router } from 'express';
import { Virhe } from '../errors/virhekasittelija';
import { prisma } from '../lib/prisma';

const apiAjotRouter: Router = express.Router();

apiAjotRouter.use(express.json());

apiAjotRouter.delete("/:id", async (req: Request, res: Response) => {

    const valinta = await prisma.ajo.count({
        where: { id: Number(req.params.id) }
    }) === 1;

    if (!valinta) {
        throw new Virhe(404, "Ajoa ei löytynyt");
    }

    await prisma.ajo.delete({
        where: {
            id: Number(req.params.id)
        }
    });

    res.json(await prisma.ajo.findMany());

});


apiAjotRouter.put("/:id", async (req: Request, res: Response) => {

    const valinta = await prisma.ajo.count({
        where: { id: Number(req.params.id) }
    }) === 1;

    if (!valinta) {
        throw new Virhe(404, "Ajoa ei löytynyt");
    }

    const hyvaksyttyBody = req.body.reitti?.length > 0
        && req.body.ajaja?.length > 0
        && Number.isInteger(req.body.km) && req.body.km > 0
        && !isNaN(Date.parse(req.body.pvm));

    if (!hyvaksyttyBody) {
        throw new Virhe(400, "Virheellinen pyynnön body");
    }

    await prisma.ajo.update({
        where: {
            id: Number(req.params.id)
        },
        data: {
            reitti: req.body.reitti,
            km: req.body.km,
            ajaja: req.body.ajaja,
            pvm: new Date(req.body.pvm)
        }
    });

    res.json(await prisma.ajo.findMany());

});

apiAjotRouter.post("/", async (req: Request, res: Response) => {

    const hyvaksyttyBody = req.body.reitti?.length > 0
        && req.body.ajaja?.length > 0
        && Number.isInteger(req.body.km) && req.body.km > 0
        && !isNaN(Date.parse(req.body.pvm));

    if (!hyvaksyttyBody) {
        throw new Virhe(400, "Virheellinen pyynnön body");
    }

    await prisma.ajo.create({
        data: {
            reitti: req.body.reitti,
            km: req.body.km,
            ajaja: req.body.ajaja,
            pvm: new Date(req.body.pvm)
        }
    });

    res.json(await prisma.ajo.findMany());

});

apiAjotRouter.get("/:id", async (req: Request, res: Response) => {

    const valinta = await prisma.ajo.count({
        where: { id: Number(req.params.id) }
    }) === 1;

    if (!valinta) {
        throw new Virhe(404, "Ajoa ei löytynyt");
    }

    res.json(await prisma.ajo.findUnique({
        where: {
            id: Number(req.params.id)
        }
    }));

});

apiAjotRouter.get("/", async (req: Request, res: Response) => {

    res.json(await prisma.ajo.findMany());

});

export default apiAjotRouter;
