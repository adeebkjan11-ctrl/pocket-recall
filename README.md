# Pocket Recall

A small, original study app that turns a short passage of notes into recall cards using **QVAC on your laptop**. The browser talks only to a Node process on the same computer. That process calls the QVAC SDK; there is no cloud AI endpoint or API key.

**Verified on 21 September 2026:** the latest Python-backend browser run generated three accurate cards in **3.1 seconds on CPU**. Answer reveal, recall marking, Markdown export, and desktop/mobile layout checks passed. The prompt now asks for answer sentences copied from the notes. These timings describe the test machine. See [latest verification](docs/VERIFICATION-CURRENT.md), [earlier verification](docs/VERIFICATION.md), and [publication/authorship](docs/PUBLISHING.md).

![Pocket Recall displaying three real QVAC-generated cards and Ready locally](docs/pocket-recall-working.png)

[Download the latest genuine screenshot](docs/pocket-recall-working.png) · [Latest browser receipt](docs/browser-inference-current.json) · [Cards exported from this run](docs/sample-cards.md)

The [earlier screenshot and receipt](docs/VERIFICATION.md) remain available as part of the published history.

## Install

Requires Node.js **22.17+**, npm **10.9+**, and a supported desktop OS. Use a normal laptop/desktop environment that permits local worker IPC. Aim for at least 4 GB RAM and 5 GB free disk for dependencies, model, and cache. See [QVAC system requirements](https://docs.qvac.tether.io/system-requirements/) for platform details; Windows needs the required Vulkan runtime even for CPU use.

### Recommended: tested Python backend

Clone the public repository, then install from its project folder:

```sh
git clone https://github.com/adeebkjan11-ctrl/pocket-recall.git
cd pocket-recall
```

The same app can use QVAC's official **Python 0.19.1 SDK**, which connects to the local worker over loopback TCP. This is the backend verified in the included real-inference evidence. It requires Python 3.10+ in addition to Node. It uses the same local model and UI:

```sh
npm ci
python -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
python scripts/download-model.py
npm run start:python
```

On Windows PowerShell, you can run the same setup without activating the environment:

```powershell
npm ci
py -3 -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe scripts/download-model.py
$env:QVAC_PYTHON = (Resolve-Path .\.venv\Scripts\python.exe).Path
npm run start:python
```

Alternatively activate with `.venv\Scripts\Activate.ps1` if your current shell policy permits it. Do not weaken shell policies just to activate an environment.

`download-model.py` is an optional setup helper: it downloads the pinned model from HTTPS and verifies its SHA-256 before use. The SDK still loads and runs the model. Without this helper or `QVAC_MODEL_PATH`, the Python backend uses the SDK's normal first-run model download. The helper is useful when the model registry's peer-to-peer transport is unavailable. Both methods transfer model weights, not study notes.

### Alternative: JavaScript backend

The original JavaScript SDK adapter remains available:

```sh
npm ci
npm start
```

It calls QVAC's actual `loadModel` and `completion` functions. Its worker requires Unix-socket IPC on Linux; that transport failed with `listen EPERM` in the earlier development session, so the published screenshot verifies the Python route. The Python API spells the model-loading function `load_model` and also calls the real `completion` function.

Open **http://127.0.0.1:8787** in a browser on the **same computer**. This is a local app, not a website to deploy to a cloud server. A phone opening a server on someone else's computer would not count as on-device inference, so this version deliberately listens only on loopback.

## Use

1. Click **Download & prepare model**. The SDK downloads and caches Qwen3 0.6B Q4_0 (about 382 MB). Setup needs internet and can take several minutes.
2. Paste 40–2,200 characters of notes, import a short `.txt`/`.md` file, or choose **Try sample**.
3. Choose three or five cards and click **Make my study cards**.
4. Try to recall the answer before expanding **Reveal answer**. Mark each card **Got it** or **Practice again**.
5. Export the cards and review marks as Markdown. Refreshing the page clears the study session; notes are not saved automatically.

The prompt asks the model to copy answer sentences from the notes, reducing unsupported rewording. This is not a semantic accuracy guarantee. The small model may still produce unsupported answers or malformed output. The app rejects incomplete card sets instead of manufacturing a result. Check generated answers against the notes. CPU generation may take a minute or more; generation is cancelled after three minutes. The Stop button appears only while inference is active, not during model download.

## SDK and model

- Declared and installed dependency: **`@qvac/sdk` 0.19.1**, pinned in `package.json` and the lockfile; this satisfies **QVAC ≥0.19.0**.
- `src/engine-node.js` imports and calls **`loadModel`** and **`completion`** from that SDK.
- `requirements.txt` pins **`tetherto-qvac-sdk==0.19.1`**; `src/python-worker.py` calls its real **`load_model`** and **`completion`** functions. `src/engine.js` selects the requested backend.
- It also calls `cancel` and `unloadModel` for lifecycle management.
- The SDK's `QWEN3_600M_INST_Q4` descriptor selects the model. CPU inference uses a 4,096-token context.
- The application code is MIT licensed. QVAC and downloaded model weights retain their own licenses; the app does not redistribute weights.

Already have the matching GGUF? Set an absolute local path before starting:

```sh
# macOS/Linux
QVAC_MODEL_PATH=/absolute/path/Qwen3-0.6B-Q4_0.gguf npm start
```

```powershell
# PowerShell
$env:QVAC_MODEL_PATH = 'C:\Models\Qwen3-0.6B-Q4_0.gguf'
npm start
```

Using a different model is possible but not validated. The model label currently describes Qwen3 0.6B.

## Data flow and privacy

`Browser on your laptop → 127.0.0.1 Node process → local QVAC worker → local model`

Notes are held in memory and submitted only to the local process. No application analytics, external fonts, CDNs, cloud AI calls, or automatic uploads are present. The SDK downloads model assets during setup; it may use network services for model discovery and downloads. This is not a claim that the SDK makes zero network connections. The app does not log prompts. Exported files are saved only when requested.

The HTTP server restricts Host and Origin, checks a per-process session token on POST requests, restricts request sizes, and serves only three allowlisted frontend files. Model text is rendered with `textContent`, never interpreted as HTML. These protections are not intended to defend against other malicious software already running on the same computer.

## Verify

```sh
npm test       # Validation and HTTP boundary tests; no model download
npm run smoke # Real loadModel + completion; no mocks; downloads model if needed
npm run smoke:python # Same study-card check through the Python SDK
```

A successful smoke run prints `REAL_QVAC_INFERENCE` with three generated cards and exits 0. A failure prints the real SDK error and exits nonzero. `docs/python-inference-check.txt` records a successful real inference run; `docs/inference-check.txt` records the earlier JavaScript transport failure. The unit tests alone do **not** prove that inference works.

The latest screenshot was captured from Chromium running alongside the real Node/Python/QVAC processes on loopback. The browser clicked **Try sample** and **Make my study cards**, waited for real generation, revealed an answer, marked it remembered, and exported Markdown. All three answers in this run are exact excerpts of the notes. No mock responses, injected fixture cards, cloud AI, or image generation were used. The latest smoke run took 2.9 seconds; [the latest evidence](docs/VERIFICATION-CURRENT.md) records the input, output, and checks.

To capture your own screenshot, follow those steps in the browser. For optional automated evidence, stop any existing Pocket Recall process, keep the Python virtual environment active, and run:

```sh
npm install --no-save --package-lock=false playwright
npx playwright install chromium
node scripts/capture-evidence.mjs
```

The helper launches `npm run start:python`, verifies the UI and export, and writes evidence to `docs/`. Playwright is optional development tooling, not an application dependency. An existing Chromium executable can be selected with `CHROMIUM_EXECUTABLE`.

## Troubleshooting

- **`listen EPERM` with a `.sock` path:** use the included Python transport above if local TCP is permitted, or a normal desktop terminal where the JavaScript SDK's worker can run. Do not disable security controls or replace QVAC with a cloud service.
- **Download stalls:** check access to QVAC's model registry, available disk space, and your network. A pre-downloaded matching local GGUF can be selected with `QVAC_MODEL_PATH`.
- **Worker or Vulkan errors:** follow QVAC's documented OS/runtime requirements.
- **Invalid cards:** shorten the notes and try three cards. The app does not silently truncate or synthesize missing answers.
- **Port in use:** use `PORT=8788 npm start` on macOS/Linux, or set `$env:PORT='8788'` in PowerShell before `npm start`.

## Publication and authorship

Public repository: [adeebkjan11-ctrl/pocket-recall](https://github.com/adeebkjan11-ctrl/pocket-recall). The repository was empty before publication; no existing remote work was removed and no force-push was used.

The public commit history contains the four substantive implementation stages, an MIT-license initialization, evidence/documentation updates, and the answer-grounding refinement. GitHub associates the publication commits with **adeebkjan11-ctrl**; their messages explicitly credit **Codex** as a coauthor. This is an AI-assisted project.

The ZIP's **four original commits still have `Codex <codex@openai.com>` authorship** and their exact hashes are preserved in [pocket-recall-history.bundle](pocket-recall-history.bundle). The publication commits have new hashes; the original commits are archived in the bundle rather than ancestors of public `main`. See the [hash mapping and access details](docs/PUBLISHING.md).

Restore the original development history separately:

```sh
git clone pocket-recall-history.bundle pocket-recall-original
git -C pocket-recall-original log --oneline
```

The source, working-app screenshot, SDK declaration, MIT license, and at-least-three-commit count are complete. The [X post draft](docs/X-POST-DRAFT.md) tags **@qvac** and is ready for the owner to post with the screenshot. **No X post has been sent, and no actual X post URL or final challenge submission exists from this work.**

## Structure

- `src/engine.js`: backend selection; `engine-node.js` and `engine-python.js` manage QVAC lifecycle.
- `src/python-worker.py`: official Python SDK adapter, local TCP only.
- `src/cards.js`: prompt and strict card validation.
- `src/server.js`: same-device HTTP interface.
- `public/`: original responsive UI; no framework/build step.
- `scripts/smoke.js`: real inference check.
- `scripts/capture-evidence.mjs`: optional browser evidence capture using real QVAC.
- `test/app.test.js`: validation and local HTTP security checks.
- `docs/`: evidence, remaining steps, and an X draft.

References: [SDK quickstart](https://docs.qvac.tether.io/js-ts-sdk/), [text generation](https://docs.qvac.tether.io/ai-capabilities/text-generation/), [SDK source](https://github.com/tetherto/qvac). Documentation informed API calls; the application is not a fork or copy of the examples app.
