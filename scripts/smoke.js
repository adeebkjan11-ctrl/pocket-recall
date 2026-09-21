import {prepareModel, getStatus, generateCards, shutdown} from '../src/engine.js';
const interval = setInterval(() => console.log(JSON.stringify(getStatus())), 10000);
const timeout = setTimeout(() => { console.error('Model setup exceeded 10 minutes.'); process.exit(1); }, 600000);
const notes = 'HTTP is a protocol used to request and deliver web resources. A browser sends a request and a server returns a response. HTML gives a web page its structure. CSS controls its appearance. JavaScript adds interaction. An API lets software systems communicate through defined requests and responses.';
try {
  await prepareModel();
  const result = await generateCards(notes, 3);
  console.log(JSON.stringify({test: 'REAL_QVAC_INFERENCE', ...result}, null, 2));
  await shutdown(); clearInterval(interval); clearTimeout(timeout); process.exit(0);
} catch (error) {
  console.error(error); clearInterval(interval); clearTimeout(timeout);
  await shutdown().catch(() => {}); process.exit(1);
}
