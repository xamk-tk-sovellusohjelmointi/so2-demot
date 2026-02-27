import express from 'express';
import ajot, { type Ajo } from '../models/ajot';
import { Virhe } from '../errors/virhekasittelija';

const apiAjopaivakirjaRouter: express.Router = express.Router();
apiAjopaivakirjaRouter.use(express.json());

// Poistetaan ajo
apiAjopaivakirjaRouter.delete("/:id", (req: express.Request, res: express.Response) => {

    const index = ajot.findIndex((ajo) => ajo.id === Number(req.params.id));

    if (index === -1) {
        throw new Virhe(404, "Ajoa ei löytynyt");
    }

    ajot.splice(index, 1);
    res.json(ajot);
});

// Muokataan ajoa
apiAjopaivakirjaRouter.put("/:id", (req: express.Request, res: express.Response) => {

    const index = ajot.findIndex((ajo) => ajo.id === Number(req.params.id));

    if (index === -1) {
        throw new Virhe(404, "Ajoa ei löydy");
    }

    if (!req.body.reitti || !req.body.km || !req.body.ajaja) {
        throw new Virhe(400, "Virheellinen pyynnön body");
    }

    const muokattuAjo: Ajo = {
        id: Number(req.params.id),
        reitti: req.body.reitti,
        km: Number(req.body.km),
        ajaja: req.body.ajaja,
        pvm: new Date().toLocaleDateString("fi-FI")
    };

    ajot[index] = muokattuAjo;
    res.json(ajot);
});

// Lisätään uusi ajo
apiAjopaivakirjaRouter.post("/", (req: express.Request, res: express.Response) => {

    if (!req.body.reitti || !req.body.km || !req.body.ajaja) {
        throw new Virhe(400, "Virheellinen pyynnön body");
    }

    const id = ajot.length === 0
        ? 1
        : Math.max(...ajot.map(ajo => ajo.id)) + 1;

    const uusiAjo: Ajo = {
        id,
        reitti: req.body.reitti,
        km: Number(req.body.km),
        ajaja: req.body.ajaja,
        pvm: new Date().toLocaleDateString("fi-FI")
    };

    ajot.push(uusiAjo);
    res.status(201).json(ajot);
});

// Haetaan yksi ajo
apiAjopaivakirjaRouter.get("/:id", (req: express.Request, res: express.Response) => {

    const id = Number(req.params.id);
    const ajo = ajot.find(ajo => ajo.id === id);

    if (!ajo) {
        throw new Virhe(404, "Ajoa ei löytynyt");
    }

    res.json(ajo);
});

// Haetaan kaikki ajot
apiAjopaivakirjaRouter.get("/", (req: express.Request, res: express.Response) => {
    res.json(ajot);
});

export default apiAjopaivakirjaRouter;
