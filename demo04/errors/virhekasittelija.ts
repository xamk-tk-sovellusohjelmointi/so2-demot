import express from 'express';

export class Virhe extends Error {
    status: number;
    viesti: string;
    constructor(status?: number, viesti?: string) {
        super(viesti);
        this.status = status || 500;
        this.viesti = viesti || "Palvelimella tapahtui odottamaton virhe";
    }
}

const virhekasittelija = (err: Virhe, _req: express.Request, res: express.Response, _next: express.NextFunction): void => {
    res.status(err.status).json({ viesti: err.viesti });
}

export default virhekasittelija;