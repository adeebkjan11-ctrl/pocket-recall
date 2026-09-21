// Official Python SDK transport: local loopback TCP to the same QVAC worker.
import {spawn} from 'node:child_process';
import {createRequire} from 'node:module';
import {createInterface} from 'node:readline';
import {fileURLToPath} from 'node:url';
import {dirname, join} from 'node:path';
import {chmodSync, statSync} from 'node:fs';
import {makePrompt, parseCards} from './cards.js';
const require = createRequire(import.meta.url);
const sdkDir = dirname(require.resolve('@qvac/sdk/package'));
const runtime = createRequire(join(sdkDir,'package.json'))('bare-runtime');
export const modelName = 'Qwen3 0.6B · Q4_0';
let child, loading, ready = false, active = false, serial = 0;
let progress = {phase:'idle', percentage:0};
const pending = new Map();
export function getStatus() { return {...progress, model:modelName, sdk:'0.19.1', generating:active, transport:'Python TCP'}; }
function startWorker() {
  if (child) return;
  const binary = runtime('bare');
  if (process.platform !== 'win32') chmodSync(binary,statSync(binary).mode | 0o100);
  const executable = process.env.QVAC_PYTHON || (process.platform === 'win32' ? 'python' : 'python3');
  child = spawn(executable,[fileURLToPath(new URL('./python-worker.py',import.meta.url)),sdkDir,binary],{stdio:['pipe','pipe','pipe']});
  const startedChild = child;
  let diagnostic = '';
  child.stderr.on('data',chunk => { diagnostic = (diagnostic+chunk.toString()).slice(-3000); });
  const fail = message => {
    if (child !== startedChild) return;
    ready = false; active = false; child = undefined;
    progress = {phase:'error',percentage:0};
    for (const {reject,timer} of pending.values()) {clearTimeout(timer); reject(new Error(message));}
    pending.clear();
  };
  child.on('error',e => fail(`Python worker could not start: ${e.message}. Install requirements.txt and activate its environment.`));
  child.on('exit',code => fail(code ? `Python worker exited (${code}): ${diagnostic}` : 'Python worker closed.'));
  child.stdin.on('error',() => {});
  createInterface({input:child.stdout}).on('line',line => {
    if (child !== startedChild) return; // Ignore buffered frames from an exited worker.
    if (!line.startsWith('POCKET_JSON:')) return; // Native library diagnostics are not protocol frames.
    let event; try {event = JSON.parse(line.slice(12));} catch {return;}
    if (event.progress) {progress = {phase:'downloading',percentage:event.progress}; return;}
    const wait = pending.get(event.id); if (!wait) return;
    pending.delete(event.id); clearTimeout(wait.timer);
    if (event.error) wait.reject(new Error(event.error)); else wait.resolve(event.result);
  });
}
function request(action,payload={}) {
  startWorker();
  const id = ++serial;
  return new Promise((resolve,reject) => {
    const timer = setTimeout(() => {pending.delete(id); reject(new Error('Local QVAC task timed out. Restart the app.')); child?.kill();},600000);
    pending.set(id,{resolve,reject,timer});
    child.stdin.write(JSON.stringify({id,action,...payload})+'\n');
  });
}
export async function prepareModel() {
  if (ready) return;
  if (loading) return loading;
  progress = {phase:'loading',percentage:0};
  loading = request('prepare').then(() => {ready = true; progress = {phase:'ready',percentage:100};})
    .catch(e => {progress = {phase:'error',percentage:0}; throw e;}).finally(() => {loading = undefined;});
  return loading;
}
export async function generateCards(notes,count) {
  await prepareModel(); active = true; const started = performance.now();
  try {
    const output = await request('generate',{prompt:makePrompt(notes,count)});
    return {cards:parseCards(output.text,count),seconds:Number(((performance.now()-started)/1000).toFixed(1)),model:modelName,sdk:'0.19.1',tokensPerSecond:output.tokensPerSecond,transport:'Python TCP'};
  } finally {active = false;}
}
export async function stopGeneration() {if (child && active) await request('stop');}
export async function shutdown() {
  if (!child) return;
  await stopGeneration();
  const current = child;
  try {await request('shutdown');} finally {current.stdin.end();}
}
