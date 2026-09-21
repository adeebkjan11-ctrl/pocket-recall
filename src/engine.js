const backend = process.env.QVAC_ENGINE === 'python' || process.argv.includes('--python')
  ? await import('./engine-python.js')
  : await import('./engine-node.js');
export const {modelName, getStatus, prepareModel, generateCards, stopGeneration, shutdown} = backend;
