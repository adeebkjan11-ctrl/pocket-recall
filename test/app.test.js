import test from 'node:test';
import assert from 'node:assert/strict';
import {once} from 'node:events';
import http from 'node:http';
import {validateInput, parseCards} from '../src/cards.js';
import {createApp} from '../src/server.js';

test('input limits reject malformed and oversized notes before inference', () => {
  for (const v of [null, {}, {notes: 12}, {notes:'short'}, {notes:'a'.repeat(2201)}, {notes:'a'.repeat(40),count:100}]) assert.throws(() => validateInput(v));
  assert.equal(validateInput({notes:'a'.repeat(40),count:3}).count,3);
});
test('model output validation accepts wrapped JSON and rejects incomplete cards', () => {
  const cards = [{question:'What is HTML?',answer:'Page structure.'},{question:'What is CSS?',answer:'Page appearance.'},{question:'What is JS?',answer:'Interaction.'}];
  assert.deepEqual(parseCards('<think>ignored</think>\n```json\n'+JSON.stringify(cards)+'\n```',3),cards);
  for (const value of ['nonsense','[]','[{}]',JSON.stringify(cards.slice(0,2)),JSON.stringify([...cards.slice(0,2),{question:'?',answer:''}])]) assert.throws(() => parseCards(value,3));
});
test('model output preserves literal thinking tags inside card text', () => {
  const cards = [
    {question:'What encloses the reasoning?',answer:'<think>reasoning</think> encloses the reasoning.'},
    {question:'What opens the block?',answer:'The opening tag is <think>.'},
    {question:'What closes the block?',answer:'The closing tag is </think>.'}
  ];
  assert.deepEqual(parseCards(JSON.stringify(cards),3),cards);
  const wrapped = '<think>Draft [discarded]</think>\n<think>Check again.</think>\n```json\n' + JSON.stringify(cards) + '\n```';
  assert.deepEqual(parseCards(wrapped,3),cards);
});
test('local HTTP boundary blocks hostile origins, missing tokens and invalid input', async t => {
  const server = createApp(); server.listen(0,'127.0.0.1'); await once(server,'listening');
  t.after(() => new Promise(resolve => {server.close(resolve); server.closeAllConnections();}));
  const base = `http://127.0.0.1:${server.address().port}`;
  assert.equal((await fetch(base)).status,200);
  const crossSiteStatus = path => new Promise((resolve,reject) => {
    const req = http.get(base+path,{headers:{'Sec-Fetch-Site':'cross-site'}},res => {res.resume(); resolve(res.statusCode);});
    req.on('error',reject);
  });
  assert.equal(await crossSiteStatus('/'),200);
  assert.equal(await crossSiteStatus('/api/status'),403);
  assert.equal((await fetch(base+'/api/session',{headers:{Origin:'https://evil.example'}})).status,403);
  const badHostStatus = await new Promise((resolve,reject) => {
    const req = http.get(base+'/api/session',{headers:{Host:'evil.example'}},res => {res.resume(); resolve(res.statusCode);});
    req.on('error',reject);
  });
  assert.equal(badHostStatus,403);
  assert.equal((await fetch(base+'/api/generate',{method:'POST'})).status,403);
  const {token} = await (await fetch(base+'/api/session')).json();
  const headers = {'Content-Type':'application/json','X-Session-Token':token};
  assert.equal((await fetch(base+'/api/generate',{method:'POST',headers,body:'{broken'})).status,400);
  assert.equal((await fetch(base+'/api/generate',{method:'POST',headers,body:JSON.stringify({notes:'short'})})).status,400);
  assert.equal((await fetch(base+'/api/generate',{method:'POST',headers,body:JSON.stringify({notes:'a'.repeat(17000)})})).status,413);
  assert.equal((await fetch(base+'/api/status')).status,200);
});
test('JSON API accepts media type parameters and rejects non-JSON types', async t => {
  const server = createApp(); server.listen(0,'127.0.0.1'); await once(server,'listening');
  t.after(() => new Promise(resolve => {server.close(resolve); server.closeAllConnections();}));
  const base = `http://127.0.0.1:${server.address().port}`;
  const {token} = await (await fetch(base+'/api/session')).json();
  for (const type of ['application/json', 'application/json; charset=utf-8', 'Application/JSON; Charset=UTF-8']) {
    const response = await fetch(base+'/api/stop',{
      method:'POST',headers:{'Content-Type':type,'X-Session-Token':token},body:'{}'
    });
    assert.equal(response.status,200,type);
    assert.deepEqual(await response.json(),{stopped:true});
  }
  for (const type of ['text/plain', 'application/jsonp', 'application/json-invalid']) {
    const response = await fetch(base+'/api/stop',{
      method:'POST',headers:{'Content-Type':type,'X-Session-Token':token},body:'{}'
    });
    assert.equal(response.status,415,type);
    await response.json();
  }
});
