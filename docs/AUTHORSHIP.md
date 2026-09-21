# Authorship and history

Pocket Recall was developed with Codex assistance. Git author metadata identifies the account that recorded a commit; it does not establish that the account holder wrote every line unaided.

## Original development history

The unchanged `pocket-recall-history.bundle` contains four original commits. All four are authored and committed by **Codex <codex@openai.com>**. They are not attributed to the repository owner's GitHub account.

| Original commit | Work | GitHub import commit |
|---|---|---|
| `01a85f55b58fc903325197742950af16a4995db7` | QVAC engine and real-inference smoke test | `88b16f4ea6a0cd546cced11923967fea576f26be` |
| `74fce1fd4a836c8c2134807deccf36380d85bb6b` | Local server and study interface | `bbb66b0098582eb821715c13ac46dcbf0a7b8802` |
| `5b17a9c7bbbd2c585a1ccd31544acd2e6ae85633` | Documentation and validation/HTTP tests | `35b7cde4c5ff826df4b69fcab711bc7840724686` |
| `64fc08f69592f295416b491602b288e47a3576b7` | Official Python SDK transport and real inference | `572de76543bc3b7b5bf1314557c0dd8265f16964` |

The public repository has a separate publication history. GitHub's commit API verifies that the four import commits above, and initial MIT-license commit `456a2c09d3781f54547f921e665ece6827f1a7e6`, are associated with **adeebkjan11-ctrl**. The import messages retain `Original-Commit`, `Original-Author`, and `Co-authored-by: Codex` metadata. This account association is not a cryptographic signature.

Direct terminal push failed with `fatal: could not read Username for 'https://github.com': terminal prompts disabled`. The authenticated GitHub connection supports publication. Its commit creation interface does not expose original author/date fields, so the original hashes were preserved in the bundle instead of relabeling them. The imported file tree was compared with the original final tree and matched byte for byte before the final evidence/documentation changes.

A remote branch update occurred during publication. A non-forced update was rejected with `Update is not a fast forward`. The newer remote work was fetched and retained; no force-push was used.

## Recover the exact original commits

```sh
git clone pocket-recall-history.bundle pocket-recall-original
cd pocket-recall-original
git log --format=fuller
```

## Three-commit requirement

Both the original bundle (four substantive commits) and the public publication history (at least five commits before final evidence updates) exceed three commits. If a submission requires three commits specifically authored by the entrant during development, the original Codex-authored commits do not establish that condition. The entrant should confirm the organizer's interpretation; this project makes no claim of unaided human authorship.
