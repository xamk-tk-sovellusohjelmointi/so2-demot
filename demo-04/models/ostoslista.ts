import { readFile, writeFile } from 'fs/promises';
import path from 'path';

export interface Ostos {
    id: number;
    tuote: string;
    poimittu: boolean;
}

class Ostoslista {

    private ostokset: Ostos[] = [];
    private tiedosto: string[] = [import.meta.dirname, "ostokset.json"];

    constructor() {

        readFile(path.join(...this.tiedosto), "utf8")
            .then((data: string) => {
                this.ostokset = JSON.parse(data);
            })
            .catch((e: any) => {
                throw e;
            });

    }

    public haeKaikki = (): Ostos[] => {

        try {
            return this.ostokset;
        } catch (e: any) {
            throw e;
        }

    }

    public haeYksi = (id: number): Ostos | undefined => {

        try {
            return this.ostokset.find((ostos: Ostos) => ostos.id === id);
        } catch (e: any) {
            throw e;
        }

    }

    public lisaa = async (uusiOstos: Ostos): Promise<void> => {

        try {
            const edellinenId = this.ostokset.length > 0
                ? Math.max(...this.ostokset.map((ostos) => ostos.id))
                : 0;

            this.ostokset = [
                ...this.ostokset,
                {
                    id: edellinenId + 1,
                    tuote: uusiOstos.tuote,
                    poimittu: uusiOstos.poimittu
                }
            ];

            await this.tallenna();

        } catch (e: any) {
            throw e;
        }
    }

    public muokkaa = async (muokattuOstos: Ostos): Promise<void> => {

        try {

            this.ostokset = this.ostokset.filter((ostos: Ostos) => ostos.id !== muokattuOstos.id);

            this.ostokset = [
                ...this.ostokset,
                {
                    id: muokattuOstos.id,
                    tuote: muokattuOstos.tuote,
                    poimittu: muokattuOstos.poimittu
                }
            ].sort((a: Ostos, b: Ostos) => a.id - b.id);

            await this.tallenna();

        } catch (e: any) {
            throw e;
        }

    }

    public poista = async (id: number): Promise<void> => {

        try {

            this.ostokset = this.ostokset.filter((ostos: Ostos) => ostos.id !== id);

            await this.tallenna();

        } catch (e: any) {
            throw e;
        }

    }

    private tallenna = async (): Promise<void> => {

        try {
            await writeFile(path.resolve(...this.tiedosto), JSON.stringify(this.ostokset, null, 2), "utf8");
        } catch (e: any) {
            throw e;
        }
    }
}

export default Ostoslista;