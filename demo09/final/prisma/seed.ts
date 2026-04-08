import { prisma } from "../lib/prisma";

async function seed(): Promise<void> {

    await prisma.ajo.createMany({
        data: [
            { reitti: "Mikkeli-Juva-Mikkeli", km: 126, ajaja: "A12" },
            { reitti: "Mikkeli-Jyväskylä", km: 230, ajaja: "B07" },
            { reitti: "Mikkeli-Ristiina-Mikkeli", km: 40, ajaja: "A12" },
            { reitti: "Juva-Savonlinna-Juva", km: 120, ajaja: "C03" },
            { reitti: "Mikkeli-Pieksämäki", km: 73, ajaja: "B07" },
        ],
    });

    console.log("Seed valmis: 5 ajoa lisätty tietokantaan.");
}

seed()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error("Seed epäonnistui:", e);
        await prisma.$disconnect();
        process.exit(1);
    });