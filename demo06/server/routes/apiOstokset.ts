import express from "express";
import { prisma } from "../lib/prisma";
import { Virhe } from "../errors/virhekasittelija";

const apiOstoksetRouter: express.Router = express.Router();
apiOstoksetRouter.use(express.json());

// Haetaan kaikki ostokset
apiOstoksetRouter.get(
  "/",
  async (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    try {
      res.json(await prisma.ostos.findMany());
    } catch (e: any) {
      next(new Virhe());
    }
  }
);

// Lisätään uusi ostos
apiOstoksetRouter.post(
  "/",
  async (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    if (req.body.tuote?.length > 0) {
      try {
        await prisma.ostos.create({
          data: {
            tuote: req.body.tuote,
            poimittu: Boolean(req.body.poimittu),
          },
        });

        res.json(await prisma.ostos.findMany());
      } catch (e: any) {
        next(new Virhe());
      }
    } else {
      next(new Virhe(400, "Virheellinen pyynnön body"));
    }
  }
);

// Poistetaan ostos ja palautetaan päivitetty lista
apiOstoksetRouter.delete(
  "/:id",
  async (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    if (
      (await prisma.ostos.count({
        where: { id: Number(req.params.id) },
      })) === 1
    ) {
      try {
        await prisma.ostos.delete({
          where: { id: Number(req.params.id) },
        });

        res.json(await prisma.ostos.findMany());
      } catch (e: any) {
        next(new Virhe());
      }
    } else {
      next(new Virhe(400, "Virheellinen id"));
    }
  }
);

export default apiOstoksetRouter;
