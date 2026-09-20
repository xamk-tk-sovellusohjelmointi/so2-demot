import { type ErrorRequestHandler } from 'express';

export class Virhe extends Error {
    status: number
    viesti: string
    constructor(status: number = 500, viesti: string = "Palvelimella tapahtui odottamaton virhe") {
        super(viesti);
        this.status = status;
        this.viesti = viesti;
    }
}

const virhekasittelija: ErrorRequestHandler = (err, req, res, next) => {

    if (err instanceof Virhe) {
        res.status(err.status).json({ virhe: err.viesti });
    } else {
        console.log(err);
        res.status(500).json({ virhe: "Palvelimella tapahtui odottamaton virhe" });
    }
}

export default virhekasittelija;