import { createHash } from 'crypto';

const hash = createHash('SHA256').update('passu123').digest('hex');

console.log(hash);
