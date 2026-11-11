import { prisma } from "../lib/prisma";

const ajot = [
    { reitti: "Mikkeli - Kouvola", km: 98, ajaja: "Matti Meikäläinen", pvm: new Date("2026-11-02") },
    { reitti: "Kouvola - Kotka", km: 53, ajaja: "Maija Meikäläinen", pvm: new Date("2026-11-03") },
    { reitti: "Kotka - Helsinki", km: 132, ajaja: "Matti Meikäläinen", pvm: new Date("2026-11-04") },
    { reitti: "Helsinki - Mikkeli", km: 230, ajaja: "Maija Meikäläinen", pvm: new Date("2026-11-05") },
    { reitti: "Mikkeli - Savonlinna", km: 101, ajaja: "Teppo Testaaja", pvm: new Date("2026-11-06") },
];

const main = async () => {
    await prisma.ajo.deleteMany();
    await prisma.ajo.createMany({ data: ajot });
    console.log(`Tietokantaan lisättiin ${ajot.length} ajoa.`);
};

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
