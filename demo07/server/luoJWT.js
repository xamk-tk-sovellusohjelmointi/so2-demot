import jwt from 'jsonwebtoken';

const token = jwt.sign({}, 'SalausLause_25');

console.log(token);
