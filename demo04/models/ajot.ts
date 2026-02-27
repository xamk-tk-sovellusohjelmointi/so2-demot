export interface Ajo {
    id: number;
    reitti: string;
    km: number;
    ajaja: string;
    pvm: string;
}

const ajot: Ajo[] = [
    {
        id: 1,
        reitti: "Mikkeli-Juva-Mikkeli",
        km: 126,
        ajaja: "A12",
        pvm: new Date("2025-03-04").toLocaleDateString("fi-FI")
    },
    {
        id: 2,
        reitti: "Savonlinna-Juva-Pieksämäki",
        km: 128,
        ajaja: "B47",
        pvm: new Date("2025-03-07").toLocaleDateString("fi-FI")
    },
    {
        id: 3,
        reitti: "Hirvensalmi-Mäntyharju",
        km: 38,
        ajaja: "C91",
        pvm: new Date("2025-03-10").toLocaleDateString("fi-FI")
    },
    {
        id: 4,
        reitti: "Mikkeli-Pieksämäki",
        km: 55,
        ajaja: "A12",
        pvm: new Date("2025-03-13").toLocaleDateString("fi-FI")
    },
    {
        id: 5,
        reitti: "Juva-Savonlinna",
        km: 76,
        ajaja: "D03",
        pvm: new Date("2025-03-17").toLocaleDateString("fi-FI")
    },
    {
        id: 6,
        reitti: "Mäntyharju-Mikkeli-Juva",
        km: 102,
        ajaja: "B47",
        pvm: new Date("2025-03-20").toLocaleDateString("fi-FI")
    },
    {
        id: 7,
        reitti: "Pieksämäki-Haukivuori-Mikkeli",
        km: 68,
        ajaja: "C91",
        pvm: new Date("2025-03-24").toLocaleDateString("fi-FI")
    },
    {
        id: 8,
        reitti: "Savonlinna-Kerimäki-Punkaharju",
        km: 42,
        ajaja: "E55",
        pvm: new Date("2025-03-27").toLocaleDateString("fi-FI")
    },
    {
        id: 9,
        reitti: "Mikkeli-Ristiina-Mikkeli",
        km: 60,
        ajaja: "D03",
        pvm: new Date("2025-04-01").toLocaleDateString("fi-FI")
    },
    {
        id: 10,
        reitti: "Juva-Joroinen-Varkaus",
        km: 89,
        ajaja: "A12",
        pvm: new Date("2025-04-03").toLocaleDateString("fi-FI")
    }
];

export default ajot;
