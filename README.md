# Pocket Recall

A small, original study app that turns a short passage of notes into recall cards using **QVAC on your laptop**. The browser talks only to a Node process on the same computer. That process calls the QVAC SDK; there is no cloud AI endpoint or API key.

**Verification status:** real QVAC inference passes through the included Python SDK backend. The three-card smoke run took 2.5 seconds on CPU. Validation and local HTTP tests pass too. The JavaScript-only backend is included but could not be run in this environment because its Unix socket is blocked. Screenshot capture and public publication remain incomplete. See [verification](docs/VERIFICATION.md).

## Install

Requires Node.js **22.17+**, npm **10.9+**, and a supported desktop OS. Use a normal laptop/desktop environment that permits local worker IPC. Aim for at least 4 GB RAM and 5 GB free disk for dependencies, model, and cache. See [QVAC system requirements](https://docs.qvac.tether.io/system-requirements/) for platform details; Windows needs the required Vulkan runtime even for CPU use.

From the project folder:

```sh
npm ci
npm start
```

### Tested Python transport

The same app can use QVAC's official **Python 0.19.1 SDK**, which connects to the local worker over loopback TCP. This is the backend verified in the included real-inference evidence. It requires Python 3.10+ in addition to Node. It uses the same local model and UI:

```sh
npm ci
python -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
python scripts/download-model.py
npm run start:python
```

On Windows PowerShell, replace the activation command with `.venv\Scripts\Activate.ps1`. If activation is unavailable, set `QVAC_PYTHON` to the virtual environment's Python executable. Do not weaken shell security policies just to activate an environment.

`download-model.py` is an optional setup helper: it downloads the pinned model from HTTPS and verifies its SHA-256 before use. The SDK still loads and runs the model. Without this helper or `QVAC_MODEL_PATH`, the Python backend uses the SDK's normal first-run model download. The helper is useful when the model registry's peer-to-peer transport is unavailable. Both methods transfer model weights, not study notes.

Open **http://127.0.0.1:8787** in a browser on the **same computer**. This is a local app, not a website to deploy to a cloud server. A phone opening a server on someone else's computer would not count as on-device inference, so this version deliberately listens only on loopback.

## Use

1. Click **Download & prepare model**. The SDK downloads and caches Qwen3 0.6B Q4_0 (about 382 MB). Setup needs internet and can take several minutes.
2. Paste 40–2,200 characters of notes, import a short `.txt`/`.md` file, or choose **Try sample**.
3. Choose three or five cards and click **Make my study cards**.
4. Try to recall the answer before expanding **Reveal answer**. Mark each card **Got it** or **Practice again**.
5. Export the cards and review marks as Markdown. Refreshing the page clears the study session; notes are not saved automatically.

The small model may produce unsupported answers or malformed output. The app rejects incomplete card sets instead of manufacturing a result. Check generated answers against the notes. CPU generation may take a minute or more; generation is cancelled after three minutes. The Stop button appears only while inference is active, not during model download.

## SDK and model

- Declared and installed dependency: **`@qvac/sdk` 0.19.1**, pinned in `package.json` and the lockfile.
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

For genuine screenshot evidence: run the app on your laptop, use **Try sample**, generate cards, reveal one answer, and take a screenshot showing the cards and **Ready locally**. Do not present the empty-state UI or fixture data as an inference demonstration. A working-app screenshot has not been captured in this environment.

## Troubleshooting

- **`listen EPERM` with a `.sock` path:** use the included Python transport above if local TCP is permitted, or a normal desktop terminal where the JavaScript SDK's worker can run. Do not disable security controls or replace QVAC with a cloud service.
- **Download stalls:** check access to QVAC's model registry, available disk space, and your network. A pre-downloaded matching local GGUF can be selected with `QVAC_MODEL_PATH`.
- **Worker or Vulkan errors:** follow QVAC's documented OS/runtime requirements.
- **Invalid cards:** shorten the notes and try three cards. The app does not silently truncate or synthesize missing answers.
- **Port in use:** use `PORT=8788 npm start` on macOS/Linux, or set `$env:PORT='8788'` in PowerShell before `npm start`.

## Publishing status

Intended repository: [adeebkjan11-ctrl/pocket-recall](https://github.com/adeebkjan11-ctrl/pocket-recall), supplied by the user. Its contents and visibility have not been verified, and no push was completed. At least three local commits preserve the implementation work. They use the development environment's **Codex** author identity, not a verified GitHub user identity.

The downloadable bundle includes `pocket-recall-history.bundle`. To recover the repository with its history:

```sh
git clone pocket-recall-history.bundle pocket-recall-work
cd pocket-recall-work
git remote set-url origin https://github.com/adeebkjan11-ctrl/pocket-recall.git
git fetch origin
```

Inspect existing remote branches before publishing. If the remote is empty, `git push -u origin main` publishes the commits. If it already has work, preserve it and merge or open a pull request; do not force-push. Confirm the account/author requirements with the challenge before submitting—do not misrepresent AI-assisted authorship.

## Structure

- `src/engine.js`: backend selection; `engine-node.js` and `engine-python.js` manage QVAC lifecycle.
- `src/python-worker.py`: official Python SDK adapter, local TCP only.
- `src/cards.js`: prompt and strict card validation.
- `src/server.js`: same-device HTTP interface.
- `public/`: original responsive UI; no framework/build step.
- `scripts/smoke.js`: real inference check.
- `test/app.test.js`: validation and local HTTP security checks.
- `docs/`: evidence, remaining steps, and an X draft.

References: [SDK quickstart](https://docs.qvac.tether.io/js-ts-sdk/), [text generation](https://docs.qvac.tether.io/ai-capabilities/text-generation/), [SDK source](https://github.com/tetherto/qvac). Documentation informed API calls; the application is not a fork or copy of the examples app.
