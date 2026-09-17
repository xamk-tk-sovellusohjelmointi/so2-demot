import express, { type Request, type Response, type Router } from 'express';
import Ostoslista, { type Ostos } from '../models/ostoslista';
import { Virhe } from '../errors/virhekasittelija';

const ostoslista: Ostoslista = new Ostoslista();

const apiOstoksetRouter: Router = express.Router();

apiOstoksetRouter.use(express.json());

apiOstoksetRouter.delete("/:id", async (req: Request, res: Response) => {

    const haettu = await ostoslista.haeYksi(Number(req.params.id));

    if (!haettu) {
        throw new Virhe(404, "Ostosta ei löytynyt");
    }

    await ostoslista.poista(Number(req.params.id));

    res.json(ostoslista.haeKaikki());

});


apiOstoksetRouter.put("/:id", async (req: Request, res: Response) => {

    const haettu = await ostoslista.haeYksi(Number(req.params.id));

    if (!haettu) {
        throw new Virhe(404, "Ostosta ei löytynyt");
    }

    const hyvaksyttyBody = req.body.tuote?.length > 0 && (req.body.poimittu === true || req.body.poimittu === false);

    if (!hyvaksyttyBody) {
        throw new Virhe(400, "Virheellinen pyynnön body");
    }

    const muokattuOstos: Ostos = {
        id: Number(req.params.id),
        tuote: req.body.tuote,
        poimittu: req.body.poimittu
    }

    await ostoslista.muokkaa(muokattuOstos);

    res.json(ostoslista.haeKaikki());

});

apiOstoksetRouter.post("/", async (req: Request, res: Response) => {

    const hyvaksyttyBody = req.body.tuote?.length > 0 && (req.body.poimittu === true || req.body.poimittu === false);

    if (!hyvaksyttyBody) {
        throw new Virhe(400, "Virheellinen pyynnön body");
    }

    const uusiOstos: Ostos = {
        id: 0,
        tuote: req.body.tuote,
        poimittu: req.body.poimittu
    }

    await ostoslista.lisaa(uusiOstos);

    res.json(ostoslista.haeKaikki());

});

apiOstoksetRouter.get("/:id", async (req: Request, res: Response) => {

    const haettu = await ostoslista.haeYksi(Number(req.params.id));

    if (!haettu) {
        throw new Virhe(404, "Ostosta ei löytynyt");
    }

    res.json(ostoslista.haeYksi(Number(req.params.id)));

});

apiOstoksetRouter.get("/", (req: Request, res: Response) => {

    res.json(ostoslista.haeKaikki());

});

export default apiOstoksetRouter;