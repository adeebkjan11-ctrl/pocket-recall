import test from 'node:test';
import assert from 'node:assert/strict';
import childProcess from 'node:child_process';
import {EventEmitter} from 'node:events';
import {syncBuiltinESMExports} from 'node:module';
import {PassThrough, Writable} from 'node:stream';
import {setImmediate} from 'node:timers/promises';

test('Python worker failures clear readiness and allow a fresh worker', async t => {
  const children = [];
  t.mock.method(childProcess, 'spawn', () => {
    const child = new EventEmitter();
    child.stdout = new PassThrough();
    child.stderr = new PassThrough();
    child.stdin = new Writable({write(chunk, encoding, done) {
      const command = JSON.parse(chunk.toString());
      // Generation remains pending so the test can reproduce a worker crash.
      if (command.action !== 'generate') queueMicrotask(() => {
        child.stdout.write('POCKET_JSON:' + JSON.stringify({id:command.id,result:{}}) + '\n');
      });
      done();
    }});
    children.push(child);
    return child;
  });
  syncBuiltinESMExports();
  t.after(() => {
    for (const child of children) {
      child.emit('exit',0);
      child.stdin.destroy(); child.stdout.destroy(); child.stderr.destroy();
    }
    t.mock.restoreAll();
    syncBuiltinESMExports();
  });
  const engine = await import('../src/engine-python.js');
  await engine.prepareModel();
  assert.equal(engine.getStatus().phase,'ready');
  children[0].emit('exit',1);
  assert.equal(engine.getStatus().phase,'error');
  assert.equal(engine.getStatus().percentage,0);

  await engine.prepareModel();
  assert.equal(children.length,2);
  assert.equal(engine.getStatus().phase,'ready');
  // Buffered messages from the old process must not overwrite the new status.
  children[0].stdout.write('POCKET_JSON:{"progress":25}\n');
  assert.equal(engine.getStatus().phase,'ready');

  const generation = engine.generateCards('A sufficiently long passage of study notes.',3);
  const rejection = assert.rejects(generation,/Python worker exited/);
  await setImmediate();
  assert.equal(engine.getStatus().generating,true);
  children[1].emit('exit',1);
  await rejection;
  assert.equal(engine.getStatus().phase,'error');
  assert.equal(engine.getStatus().generating,false);
  await engine.prepareModel();
  assert.equal(children.length,3);
  assert.equal(engine.getStatus().phase,'ready');
});
