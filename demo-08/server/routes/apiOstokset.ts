import express, { type Request, type Response, type Router } from 'express';
import { Virhe } from '../errors/virhekasittelija';
import { prisma } from '../lib/prisma';

const apiOstoksetRouter: Router = express.Router();

apiOstoksetRouter.use(express.json());

apiOstoksetRouter.delete("/:id", async (req: Request, res: Response) => {

    const valinta = await prisma.ostos.count({
        where: { id: Number(req.params.id) }
    }) === 1;

    if (!valinta) {
        throw new Virhe(404, "Ostosta ei löytynyt");
    }

    await prisma.ostos.delete({
        where: {
            id: Number(req.params.id)
        }
    });

    res.json(await prisma.ostos.findMany());

});


apiOstoksetRouter.put("/:id", async (req: Request, res: Response) => {

    const valinta = await prisma.ostos.count({
        where: { id: Number(req.params.id) }
    }) === 1;

    if (!valinta) {
        throw new Virhe(404, "Ostosta ei löytynyt");
    }

    const hyvaksyttyBody = req.body.tuote?.length > 0 && (req.body.poimittu === true || req.body.poimittu === false);

    if (!hyvaksyttyBody) {
        throw new Virhe(400, "Virheellinen pyynnön body");
    }

    await prisma.ostos.update({
        where: {
            id: Number(req.params.id)
        },
        data: {
            tuote: req.body.tuote,
            poimittu: req.body.poimittu
        }
    });

    res.json(await prisma.ostos.findMany());

});

apiOstoksetRouter.post("/", async (req: Request, res: Response) => {

    const hyvaksyttyBody = req.body.tuote?.length > 0 && (req.body.poimittu === true || req.body.poimittu === false);

    if (!hyvaksyttyBody) {
        throw new Virhe(400, "Virheellinen pyynnön body");
    }

    await prisma.ostos.create({
        data: {
            tuote: req.body.tuote,
            poimittu: req.body.poimittu
        }
    });

    res.json(await prisma.ostos.findMany());

});

apiOstoksetRouter.get("/:id", async (req: Request, res: Response) => {

    const valinta = await prisma.ostos.count({
        where: { id: Number(req.params.id) }
    }) === 1;

    if (!valinta) {
        throw new Virhe(404, "Ostosta ei löytynyt");
    }

    res.json(await prisma.ostos.findUnique({
        where: {
            id: Number(req.params.id)
        }
    }));

});

apiOstoksetRouter.get("/", async (req: Request, res: Response) => {

    res.json(await prisma.ostos.findMany());

});

export default apiOstoksetRouter;