import { loadModel, completion, unloadModel, cancel, QWEN3_600M_INST_Q4 } from '@qvac/sdk';
import { resolve } from 'node:path';
import { makePrompt, parseCards } from './cards.js';
export const modelName = 'Qwen3 0.6B · Q4_0';
let modelId, loading, active;
let progress = {phase: 'idle', percentage: 0};
export function getStatus() { return {...progress, model: modelName, sdk: '0.19.1', generating: Boolean(active)}; }
export async function prepareModel() {
  if (modelId) return modelId;
  if (loading) return loading;
  progress = {phase: 'loading', percentage: 0};
  loading = loadModel({
    modelSrc: process.env.QVAC_MODEL_PATH ? resolve(process.env.QVAC_MODEL_PATH) : QWEN3_600M_INST_Q4,
    modelType: 'llm', modelConfig: {ctx_size: 4096, device: 'cpu'},
    onProgress(p) { progress = {phase: 'downloading', percentage: p.percentage, downloaded: p.downloaded, total: p.total}; }
  }).then(id => {
    modelId = id; progress = {phase: 'ready', percentage: 100}; return id;
  }).catch(error => {
    progress = {phase: 'error', percentage: 0}; throw error;
  }).finally(() => { loading = undefined; });
  return loading;
}
export async function generateCards(notes, count) {
  const id = await prepareModel(), started = performance.now();
  const run = completion({modelId: id, history: [{role: 'user', content: makePrompt(notes, count)}],
    generationParams: {temp: 0.2, predict: 1000}, captureThinking: true, stream: true});
  active = run;
  const timer = setTimeout(() => { cancel({requestId: run.requestId}).catch(() => {}); }, 180000);
  try {
    const result = await run.final;
    if (result.stopReason === 'cancelled') throw new Error('Generation was stopped.');
    return {cards: parseCards(result.contentText, count), seconds: Number(((performance.now()-started)/1000).toFixed(1)),
      model: modelName, sdk: '0.19.1', tokensPerSecond: result.stats?.tokensPerSecond ?? null};
  } finally { clearTimeout(timer); active = undefined; }
}
export async function stopGeneration() { if (active) await cancel({requestId: active.requestId}); }
export async function shutdown() { await stopGeneration(); if (modelId) await unloadModel({modelId, clearStorage: false}); }
