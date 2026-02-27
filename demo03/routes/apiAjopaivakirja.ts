import express from 'express';
import ajot, { type Ajo } from '../models/ajot';

const apiAjopaivakirjaRouter: express.Router = express.Router();
apiAjopaivakirjaRouter.use(express.json());

// Haetaan kaikki ajot
apiAjopaivakirjaRouter.get("/", (req: express.Request, res: express.Response) => {
    
    res.json(ajot);
});

// Haetaan yksi ajo
apiAjopaivakirjaRouter.get("/:id", (req: express.Request, res: express.Response) => {

    const id = Number(req.params.id);

    const ajo = ajot.find(ajo => ajo.id === id);

    if (!ajo) {
        return res.status(404).json({ viesti: "Ajoa ei löytynyt" });
    }

    res.json(ajo);
});

// Lisätään uusi ajo
apiAjopaivakirjaRouter.post("/", (req: express.Request, res: express.Response) => {

    const id = ajot.length === 0
        ? 1
        : Math.max(...ajot.map(ajo => ajo.id)) + 1;

    if (!req.body.reitti || !req.body.km || !req.body.ajaja) {
        return res.status(400).json({ viesti: "Virheellinen pyynnön body" });
    }

    let uusiAjo: Ajo = {
        id,
        reitti: req.body.reitti,
        km: Number(req.body.km),
        ajaja: req.body.ajaja,
        pvm: String(new Date().toLocaleDateString("fi-FI"))
    }

    ajot.push(uusiAjo);

    res.status(201).json(ajot);
});

// Päivitetään ajo
apiAjopaivakirjaRouter.put("/:id", async (req: express.Request, res: express.Response) => {

    let muokattuAjo: Ajo = {
        id: Number(req.params.id),
        reitti: req.body.reitti,
        km: Number(req.body.km),
        ajaja: req.body.ajaja,
        pvm: String(new Date().toLocaleDateString("fi-FI"))
    }

    const index = ajot.findIndex((ajo) => {
         ajo.id === muokattuAjo.id
    });

    if (index === -1) {
        return res.status(404).json({ viesti: "Ajoa ei löydy" });
    }

    if (!muokattuAjo.reitti || !muokattuAjo.km || !muokattuAjo.ajaja) {
        return res.status(400).json({ viesti: "Virheellinen pyynnön body" });
    }

    ajot[index] = muokattuAjo;

    res.json(ajot);
});

// Poistetaan ajo
apiAjopaivakirjaRouter.delete("/:id", async (req: express.Request, res: express.Response) => {

    const index = ajot.findIndex((ajo) => {
        ajo.id === Number(req.params.id)
    });

    if (index === -1) {
        return res.status(404).json({ viesti: "Ajoa ei löytynyt" });
    }

    ajot.splice(index, 1);

    res.json(ajot);
});

export default apiAjopaivakirjaRouter;