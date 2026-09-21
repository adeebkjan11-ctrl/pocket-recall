const $ = id => document.getElementById(id);
const notes = $('notes');
let token, result, working = false, ratings = [];
const sample = 'HTTP is a protocol used to request and deliver web resources. A browser sends a request and a server returns a response. HTML gives a web page its structure. CSS controls its appearance. JavaScript adds interaction. An API lets software systems communicate through defined requests and responses. AJAX lets a web page exchange data with a server without reloading the entire page.';
function error(message) { $('error').textContent = message; $('error').hidden = false; }
function countChars() { $('counter').textContent = `${notes.value.length.toLocaleString()} / 2,200`; }
function setWorking(value) {
  working = value;
  for (const id of ['generate', 'prepare', 'sample', 'count', 'notes', 'file']) $(id).disabled = value;
  $('loading').hidden = !value; $('empty').hidden = value || Boolean(result);
  $('results').hidden = value || !result; $('export').hidden = value || !result;
  if (!value) $('stop').hidden = true;
}
async function post(path, data = {}) {
  if (!token) { const r = await fetch('/api/session'); if (!r.ok) throw new Error('Cannot connect to local app.'); token = (await r.json()).token; }
  const response = await fetch(path, {method: 'POST', headers: {'Content-Type': 'application/json', 'X-Session-Token': token}, body: JSON.stringify(data)});
  const value = await response.json();
  if (!response.ok) { if (response.status === 403) token = undefined; throw new Error(value.error || 'The local request failed.'); }
  return value;
}
async function status() {
  try {
    const response = await fetch('/api/status'); if (!response.ok) throw new Error('Not connected');
    const s = await response.json();
    $('engine-label').textContent = {idle:'Not loaded',loading:'Loading',downloading:'Downloading',ready:'Ready locally',error:'Needs attention'}[s.phase] || s.phase;
    $('progress').hidden = s.phase !== 'downloading'; $('progress').value = s.percentage || 0;
    if (s.phase === 'downloading') $('engine-message').textContent = `Downloading model: ${Math.round(s.percentage || 0)}%. Internet is needed for setup.`;
    if (s.phase === 'ready') $('engine-message').textContent = 'Model loaded on this device. Your notes are never sent to a cloud AI service.';
    if (s.phase === 'error') $('engine-message').textContent = 'Model could not start. See the error below or the README troubleshooting steps.';
    $('prepare').hidden = s.phase === 'ready'; $('stop').hidden = !working || !s.generating;
    if (working) $('loading-text').textContent = s.phase === 'ready' ? 'Writing your cards on this device. This can take a minute on a CPU…' : 'Preparing the model. The first download may take a few minutes…';
  } catch { $('engine-label').textContent = 'Disconnected'; }
}
function updateSummary() {
  const known = ratings.filter(r => r === 'known').length, again = ratings.filter(r => r === 'again').length;
  $('review-summary').textContent = `${known} remembered · ${again} to practice · ${ratings.length-known-again} to review`;
}
function renderCards() {
  $('cards').replaceChildren(); ratings = result.cards.map(() => null);
  $('session-count').textContent = `${result.cards.length} CARDS · ACTIVE RECALL`;
  $('timing').textContent = `${result.seconds}s · generated locally`;
  result.cards.forEach((card, index) => {
    const article = document.createElement('article'); article.className = 'card';
    const number = document.createElement('span'); number.className = 'card-number'; number.textContent = `QUESTION ${String(index+1).padStart(2,'0')}`;
    const title = document.createElement('h3'); title.textContent = card.question;
    const details = document.createElement('details'), summary = document.createElement('summary'); summary.textContent = 'Reveal answer';
    const answer = document.createElement('p'); answer.textContent = card.answer;
    const rating = document.createElement('div'); rating.className = 'rating';
    for (const [label,value] of [['Practice again','again'],['Got it ✓','known']]) {
      const button = document.createElement('button'); button.textContent = label; button.setAttribute('aria-pressed','false');
      button.onclick = () => { ratings[index] = value; for (const b of rating.children) b.setAttribute('aria-pressed',String(b === button)); updateSummary(); };
      rating.append(button);
    }
    details.append(summary,answer,rating); article.append(number,title,details); $('cards').append(article);
  }); updateSummary();
}
notes.addEventListener('input',countChars);
$('sample').onclick = () => {notes.value = sample; countChars();};
$('file').onchange = async e => {
  const file = e.target.files[0]; if (!file) return;
  try {
    if (file.size > 16000) throw new Error('Choose a short text file of at most 2,200 characters.');
    const text = await file.text(); if (text.length > 2200) throw new Error('This file exceeds 2,200 characters. Paste a shorter excerpt.');
    notes.value = text; countChars(); $('error').hidden = true;
  } catch (e) {error(e.message);} e.target.value = '';
};
$('prepare').onclick = async () => {
  $('error').hidden = true; setWorking(true);
  try {await post('/api/prepare');} catch (e) {error(e.message);} finally {setWorking(false); await status();}
};
$('generate').onclick = async () => {
  $('error').hidden = true;
  if (notes.value.trim().length < 40) return error('Add at least 40 characters of notes, or try the sample.');
  setWorking(true);
  try {result = await post('/api/generate',{notes:notes.value,count:Number($('count').value)}); renderCards();}
  catch (e) {error(e.message);} finally {setWorking(false); await status();}
};
$('stop').onclick = async () => {try {await post('/api/stop');} catch (e) {error(e.message);}};
$('export').onclick = () => {
  const content = '# Pocket Recall\n\n' + result.cards.map((c,i) => `## ${i+1}. ${c.question}\n\n${c.answer}\n\nReview: ${ratings[i] || 'not reviewed'}`).join('\n\n') + `\n\nGenerated locally with QVAC ${result.sdk}. Check answers against your notes.\n`;
  const url = URL.createObjectURL(new Blob([content],{type:'text/markdown;charset=utf-8'}));
  const a = document.createElement('a'); a.href = url; a.download = 'pocket-recall-cards.md'; a.click(); setTimeout(() => URL.revokeObjectURL(url),1000);
};
await status(); setInterval(status,2000);
