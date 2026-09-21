# Verification and submission status

Verified on 21 September 2026 in a Linux x64 test environment: Node.js 24.19.0, Python 3.12.14, `@qvac/sdk` 0.19.1, `tetherto-qvac-sdk` 0.19.1, and local Chromium 153.0.8010.0. Inference ran on the test machine's CPU, with no cloud AI API. This is not a benchmark or screenshot of the user's laptop.

| Check | Result |
|---|---|
| Node/Python dependency installation | Passed |
| QVAC ≥0.19.0 declared | Both SDKs pinned to 0.19.1 |
| Actual SDK `loadModel` / `completion` calls | Present in JavaScript; installed exports verified |
| Official Python `load_model` / `completion` | Exercised by smoke and browser runs |
| Input/output validation and HTTP boundary tests | 3 tests passed |
| Model SHA-256 | Matches pinned model descriptor |
| Real Python smoke inference | 3 cards in 2.9 seconds |
| Real browser-to-HTTP inference | 3 cards in 3.1 seconds |
| Screenshot answers supported by source | All three are exact excerpts of the submitted notes |
| Try sample, generation, answer reveal, recall marking | Passed in the browser |
| Markdown export | Passed; actual download retained as `sample-cards.md` |
| Desktop/mobile layout | No horizontal overflow at 1440px / 390px |
| Browser JavaScript errors | None |
| Genuine working-app screenshot | `pocket-recall-working.png` |
| Public source and MIT license | Available in the target public repository |
| At least three Git commits | Four originals in bundle; at least five verified public commits before final updates |
| Authorship | Original Codex identity preserved; GitHub publication account association verified |
| X post tagging @qvac | Draft ready; user will post it |
| Final submission with actual X URL | User action remains |

## Current evidence

- `test-results-current.txt`: real output from the three validation and HTTP tests.
- `python-inference-current.txt`: final real QVAC smoke output after the prompt refinement.
- `browser-inference-current.json`: input notes, actual generation response, timing, browser version, capture timestamp, and interaction/layout checks.
- `pocket-recall-working.png`: unchanged PNG captured from the running app after real generation and an answer reveal.
- `sample-cards.md`: actual browser export including a recall mark.
- `AUTHORSHIP.md` and `../pocket-recall-history.bundle`: original-history preservation, public commit mapping, and recovery instructions.

The screenshot test launched `npm run start:python` on loopback, clicked the app's own sample and generation controls, waited for a successful `/api/generate` response, and then captured the page. It did not inject fixture cards, edit the rendered answers, or replace SDK inference.

The cloud browser could not open the app (`net::ERR_BLOCKED_BY_CLIENT`). A Chromium process running in the same test environment as the app completed the workflow over loopback. The app's network binding and request protections were unchanged.

## Model and quality check

Qwen3 0.6B Q4_0, 382,156,480 bytes. Expected and observed SHA-256:

`33bcc57074ec7b6eada5a90651ee546ec0c2b271002c22baf9f1b2dd1e8f75cb`

The matching model from the earlier work was reused after hashing, then loaded by the real SDK. No model weights are published.

An initial current-session run described an API as a protocol. Its actual output is retained in `http-inference-before-prompt-fix.json`. The sample now explicitly identifies an API as an interface, and the prompt asks for answers copied from the notes. The final smoke and browser outputs use accurate excerpts. This refinement reduces the observed problem but is not a semantic accuracy guarantee for arbitrary notes.

## Preserved earlier evidence

`http-inference-check.json` and `inference-check.txt` preserve the original HTTP run and JavaScript Unix-socket failure. `test-results.txt` and `python-inference-check.txt` were refreshed in the first published evidence update. Its screenshot, browser receipt, capture helper, and export remain available through `VERIFICATION.md`. The exact original versions remain in the unchanged Git bundle. The Python route is the tested execution path.

## GitHub access and remaining steps

The GitHub plugin returned the connected account, public repository metadata, push permission, repository contents, and commit/account associations. Terminal Git could read the public repository but could not authenticate a push. A non-fast-forward update was rejected while newer remote commits appeared; that newer history was fetched and preserved without a force-push.

The exact four original commits remain Codex-authored in the bundle. The public import commits have new hashes and are associated by GitHub with `adeebkjan11-ctrl`, with explicit original-author and Codex co-author credit. This meets the numeric three-commit check. If a competition requires original human-authored development commits specifically, account-associated import commits alone do not prove that additional condition.

Remaining: publish the prepared X post with @qvac and the screenshot, then submit the public repository URL and the real X post URL. The user asked to perform that posting themselves.
