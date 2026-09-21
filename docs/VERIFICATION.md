# Verification and remaining work

Environment: Linux x64, Node.js v24.19.0, Python 3.12. SDKs: @qvac/sdk 0.19.1 and tetherto-qvac-sdk 0.19.1.

| Check | Actual result |
|---|---|
| Dependency installation | Passed |
| SDK exports `loadModel` and `completion` | Verified from installed package |
| Input and generated-card validation | Passed |
| HTTP Host/Origin, token and body limits | Passed |
| Browser JavaScript syntax | Passed |
| JavaScript worker transport | Blocked by `listen EPERM` on required Unix socket |
| Official Python TCP worker transport | Passed |
| Model SHA-256 | Matches the SDK registry descriptor |
| Real QVAC model loading, Python backend | Passed, Qwen3 0.6B Q4_0 on CPU |
| Real completion output | Passed: three cards in 2.5 seconds in smoke test |
| Full local HTTP generation | Passed: three cards in 2.7 seconds; five in 3.2 seconds |
| Screenshot of successful AI generation | Not captured |
| Public GitHub publication | Not completed |
| X post tagging @qvac | Not posted; browser access permission was declined |

`test-results.txt` contains actual unit/HTTP boundary test output. `inference-check.txt` preserves the failed JavaScript smoke attempt. `python-inference-check.txt` contains successful real-inference output. `http-inference-check.json` contains the actual source notes and generated cards from the running app's HTTP endpoint. No output from another model, hand-written cards, mocks, or screenshots is substituted for QVAC inference.

The model was downloaded over HTTPS from the pinned revision in `scripts/download-model.py`, then loaded as a local GGUF because the SDK's native network transports were unavailable here. Expected and observed SHA-256:

`33bcc57074ec7b6eada5a90651ee546ec0c2b271002c22baf9f1b2dd1e8f75cb`

Inference ran on this machine's CPU, with no cloud AI API. This does not benchmark the user's laptop. HTTP behavior and inference were exercised together; the cloud browser could not access the loopback app (`ERR_BLOCKED_BY_CLIENT`), so UI interactions and screenshots remain unverified. The small model may rephrase inaccurately; one three-card run described an API as a protocol, so review answers against the notes.

## Before submitting

1. Follow the tested Python setup in the README and run `npm test` and `npm run smoke:python` on the target laptop. The JavaScript-only route can be tested with `npm run smoke` on a host that permits Unix-socket IPC.
2. Resolve any actual runtime or generation errors. Verify the cards are accurate against the sample notes.
3. Start `npm run start:python`, generate cards through the UI, reveal an answer, and capture a genuine screenshot or recording.
4. Publish the source, README, MIT license, and evidence to the intended GitHub repository while preserving existing content. Confirm public visibility and the commit-author requirement.
5. Publish the X draft only once its claims are true, attach the evidence, and copy the actual post URL.
6. Submit the verified public repository URL and the actual X post URL.

Real local AI generation is demonstrated in the saved logs. The complete submission still needs a working-app screenshot, verified public publication, and an actual X post URL.
