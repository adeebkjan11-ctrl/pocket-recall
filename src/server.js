import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {randomBytes, timingSafeEqual} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
import {prepareModel, getStatus, generateCards, stopGeneration, shutdown} from './engine.js';
import {validateInput} from './cards.js';
const root = fileURLToPath(new URL('../public/', import.meta.url));
const files = new Map([['/', ['index.html', 'text/html']], ['/app.js', ['app.js', 'text/javascript']], ['/style.css', ['style.css', 'text/css']]]);
export function createApp() {
  const token = randomBytes(24).toString('hex');
  let busy = false;
  return http.createServer(async (req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'; img-src 'self' data:; object-src 'none'; base-uri 'none'; frame-ancestors 'none'");
    const json = (status, data) => { res.writeHead(status, {'Content-Type': 'application/json'}); res.end(JSON.stringify(data)); };
    const port = req.socket.localPort;
    if (![ `127.0.0.1:${port}`, `localhost:${port}` ].includes(req.headers.host)) return json(403, {error: 'Local requests only.'});
    const isApi = req.url?.startsWith('/api/');
    if (isApi && req.headers.origin && ![`http://127.0.0.1:${port}`, `http://localhost:${port}`].includes(req.headers.origin)) return json(403, {error: 'Origin not allowed.'});
    if (isApi && req.headers['sec-fetch-site'] === 'cross-site') return json(403, {error: 'Cross-site requests are blocked.'});
    try {
      if (req.method === 'GET' && req.url === '/api/session') return json(200, {token});
      if (req.method === 'GET' && req.url === '/api/status') return json(200, {...getStatus(), busy});
      if (req.method === 'GET' && files.has(req.url)) {
        const [file, type] = files.get(req.url), bytes = await readFile(resolve(root, file));
        res.writeHead(200, {'Content-Type': `${type}; charset=utf-8`}); return res.end(bytes);
      }
      if (req.method !== 'POST' || !['/api/prepare', '/api/generate', '/api/stop'].includes(req.url)) return json(404, {error: 'Not found.'});
      const supplied = Buffer.from(req.headers['x-session-token'] ?? '');
      if (supplied.length !== token.length || !timingSafeEqual(supplied, Buffer.from(token))) return json(403, {error: 'Refresh this page to reconnect.'});
      const mediaType = req.headers['content-type']?.split(';',1)[0].trim().toLowerCase();
      if (mediaType !== 'application/json') return json(415, {error: 'Expected JSON.'});
      const chunks = []; let size = 0;
      for await (const chunk of req) {
        size += chunk.length;
        if (size > 16000) return json(413, {error: 'Notes are too large.'});
        chunks.push(chunk);
      }
      let input;
      try { input = JSON.parse(Buffer.concat(chunks).toString('utf8')); }
      catch { return json(400, {error: 'Invalid JSON.'}); }
      if (req.url === '/api/stop') {
        if (getStatus().generating) console.log('[Pocket Recall] Stop requested.');
        await stopGeneration(); return json(200, {stopped: true});
      }
      if (busy) return json(409, {error: 'A local task is already running. Please wait.'});
      let validated;
      if (req.url === '/api/generate') {
        try { validated = validateInput(input); }
        catch (error) { return json(400, {error: error.message}); }
      }
      busy = true;
      try {
        const needsModel = getStatus().phase !== 'ready';
        if (needsModel) console.log('[Pocket Recall] Loading local AI model... First use may download it.');
        await prepareModel();
        if (needsModel) console.log('[Pocket Recall] Model ready.');
        if (req.url === '/api/prepare') return json(200, getStatus());
        console.log(`[Pocket Recall] Thinking... generating ${validated.count} flashcards locally.`);
        const result = await generateCards(validated.notes, validated.count);
        console.log(`[Pocket Recall] Done: ${result.cards.length} flashcards in ${result.seconds}s.`);
        return json(200, result);
      } catch (error) {
        console.error('[Pocket Recall] AI task could not finish. Check the app for details.');
        throw error;
      } finally { busy = false; }
    } catch (error) { json(500, {error: error.message || 'The local model could not run.'}); }
  });
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.PORT || 8787), app = createApp();
  app.listen(port, '127.0.0.1', () => console.log(`Pocket Recall: http://127.0.0.1:${port}`));
  app.on('error', error => {console.error(error.message); process.exit(1);});
  for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, async () => {
    const deadline = setTimeout(() => process.exit(1), 5000); app.close();
    await shutdown().catch(() => {}); clearTimeout(deadline); process.exit(0);
  });
}
