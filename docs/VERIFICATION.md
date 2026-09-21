# Verification from the initial publication

This page preserves the first published browser run. See [the latest verification](VERIFICATION-CURRENT.md) for the later answer-grounding refinement, 3.1-second capture, fresh smoke output, and current submission status.

Verified on 21 September 2026. Environment: Linux x64, Node.js 24.19.0, Python 3.12.14; QVAC JavaScript and Python SDKs both **0.19.1**. The app used Qwen3 0.6B Q4_0 with a 4,096-token context on CPU.

| Check | Actual result |
|---|---|
| `npm ci` and Python requirements installation | Passed |
| QVAC ≥0.19.0 declaration | Both SDKs pinned to 0.19.1 |
| Real SDK calls in source | JavaScript `loadModel` / `completion`; Python `load_model` / `completion` |
| Input/output validation and HTTP boundaries | All 3 tests passed |
| Browser JavaScript syntax | Passed |
| Model SHA-256 | Matches the pinned descriptor |
| Fresh Python smoke test | 3 real cards in 4.0 seconds |
| `npm run start:python` with live browser generation | HTTP 200; 3 real cards in 2.7 seconds |
| Rendered questions and answers | Exactly matched the real HTTP completion response |
| Answer reveal and both review choices | Passed; 1 remembered, 1 to practice, 1 to review |
| Markdown download | Questions, answers, and review marks matched the session |
| Browser console errors | None |
| Browser requests | Only the local app origin; no external frontend requests |
| Mobile layout at 390 px | 390 px content width; no horizontal overflow |
| Genuine screenshot | Captured at 1440 × 1120, with generated cards and Ready locally |
| Public GitHub repository | Published; original remote was empty; no force-push |
| At least 3 public commits | Satisfied: 6 publication commits, including 4 substantive implementation stages |
| Commit authorship | Publication commits linked to adeebkjan11-ctrl and credit Codex; original 4 Codex commits preserved unchanged in the bundle |
| X post tagging @qvac | Draft ready; owner will post it |
| Actual X post URL and final submission | Still outstanding |

## Evidence

- [Working-app screenshot](pocket-recall-screenshot.png)
- [Browser verification receipt](browser-verification.json): source notes, actual generated cards, model/SDK, response time, browser version, and checked interactions.
- [Markdown exported through the browser](pocket-recall-cards.md)
- [Fresh real Python smoke output](python-inference-check.txt)
- [Fresh validation and HTTP test output](test-results.txt)
- [Earlier HTTP inference runs](http-inference-check.json), preserved from the input ZIP.
- [Earlier JavaScript transport failure](inference-check.txt), preserved rather than reported as a passing test.
- [Publication and exact history mapping](PUBLISHING.md)

The screenshot is an unedited browser capture of the running app. The browser clicked Try sample, prepared the model, generated cards through the actual local endpoint, revealed the first answer, marked cards, and exported the results. No mocked responses, substitute models, injected fixture cards, image generation, or cloud AI were used. The three captured answers are supported by the sample notes.

The model was reused from an existing local cache after verifying all 382,156,480 bytes against the pinned SHA-256:

`33bcc57074ec7b6eada5a90651ee546ec0c2b271002c22baf9f1b2dd1e8f75cb`

## Environment limits and recovery

The cloud browser could not reach the loopback app: `net::ERR_BLOCKED_BY_CLIENT`. The Playwright browser CDN returned HTTP 502 with `[Errno 111] Connection refused`. A Chromium binary from the npm package `@sparticuz/chromium` 153.0.0 was unpacked locally and used with Playwright 1.62.1. Chromium, Node, Python, QVAC, and the model ran on the same development machine. The app remained bound to `127.0.0.1`; no public tunnel or cloud inference service was introduced. Browser helpers are optional development tools and are not app dependencies.

The earlier JavaScript-only QVAC run failed on Unix-socket IPC (`listen EPERM`). That route was not reclassified as verified; the successful new run uses the official Python TCP adapter.

These timings describe this development machine. They are not a benchmark of the owner's laptop. A small model can still produce long, incomplete, or inaccurate answers on other inputs; the app validates the shape of the cards, and users should compare answers with their notes.

## Remaining submission steps

1. The owner posts the [X draft](X-POST-DRAFT.md), tagging **@qvac** and attaching the genuine screenshot.
2. Copy the actual published X post URL.
3. Submit that URL and the public repository URL wherever the challenge requires them. No final submission destination was supplied in this task.

No X post or challenge submission was sent by Codex.
