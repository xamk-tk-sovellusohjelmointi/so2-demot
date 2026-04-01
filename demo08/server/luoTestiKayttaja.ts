// Lisää testikäyttäjän tietokantaan.
// Aja komennolla: tsx luoTestiKayttaja.ts
import { createHash } from 'crypto';
import { prisma } from './lib/prisma.ts';

const hash = createHash('SHA256').update('passu123').digest('hex');

await prisma.kayttaja.upsert({
    where: { kayttajatunnus: 'juuseri' },
    update: { salasana: hash },
    create: { kayttajatunnus: 'juuseri', salasana: hash },
});

console.log('Testikäyttäjä luotu: juuseri / passu123');

await prisma.$disconnect();
