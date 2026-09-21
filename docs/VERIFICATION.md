# Verification and remaining work

Environment: Linux x64, Node.js v24.19.0. SDK: @qvac/sdk 0.19.1.

| Check | Actual result |
|---|---|
| Dependency installation | Passed |
| SDK exports `loadModel` and `completion` | Verified from installed package |
| Input and generated-card validation | Passed |
| HTTP Host/Origin, token and body limits | Passed |
| Browser JavaScript syntax | Passed |
| Real QVAC model loading | Blocked by `listen EPERM` on required Unix socket |
| Real completion output | Not reached |
| Screenshot of successful AI generation | Not captured |
| Public GitHub publication | Not completed |
| X post tagging @qvac | Not posted; browser access permission was declined |

`test-results.txt` contains actual test output. `inference-check.txt` contains the actual failed smoke-test output. No output from another model, hand-written cards, mocks, or screenshots is substituted for QVAC inference.

## Before submitting

1. Run `npm ci`, `npm test`, and `npm run smoke` on a supported laptop.
2. Resolve any actual runtime or generation errors. Verify the cards are accurate against the sample notes.
3. Start `npm start`, generate cards through the UI, reveal an answer, and capture a genuine screenshot or recording.
4. Publish the source, README, MIT license, and evidence to the intended GitHub repository while preserving existing content. Confirm public visibility and the commit-author requirement.
5. Publish the X draft only once its claims are true, attach the evidence, and copy the actual post URL.
6. Submit the verified public repository URL and the actual X post URL.

The draft currently does not satisfy the requirement that the app has been demonstrated working.
