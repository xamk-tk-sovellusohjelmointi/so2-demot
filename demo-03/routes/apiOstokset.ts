import express, { type Request, type Response, type Router } from 'express';
import Ostoslista, { type Ostos } from '../models/ostoslista';

const ostoslista: Ostoslista = new Ostoslista();

const apiOstoksetRouter: Router = express.Router();

apiOstoksetRouter.use(express.json());

apiOstoksetRouter.delete("/:id", async (req: Request, res: Response) => {

    await ostoslista.poista(Number(req.params.id));

    res.json(ostoslista.haeKaikki());

});


apiOstoksetRouter.put("/:id", async (req: Request, res: Response) => {

    let muokattuOstos: Ostos = {
        id: Number(req.params.id),
        tuote: req.body.tuote,
        poimittu: req.body.poimittu
    }

    await ostoslista.muokkaa(muokattuOstos);

    res.json(ostoslista.haeKaikki());

});

apiOstoksetRouter.post("/", async (req: Request, res: Response) => {

    let uusiOstos: Ostos = {
        id: 0,
        tuote: req.body.tuote,
        poimittu: req.body.poimittu
    }

    await ostoslista.lisaa(uusiOstos);

    res.json(ostoslista.haeKaikki());

});

apiOstoksetRouter.get("/:id", (req: Request, res: Response) => {

    res.json(ostoslista.haeYksi(Number(req.params.id)));

});

apiOstoksetRouter.get("/", (req: Request, res: Response) => {

    res.json(ostoslista.haeKaikki());

});

export default apiOstoksetRouter;