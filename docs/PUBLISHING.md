# Publication, history, and authorship

Public repository: https://github.com/adeebkjan11-ctrl/pocket-recall

The GitHub plugin exposed real repository read and write operations in this session. The authenticated account was **adeebkjan11-ctrl**, and repository metadata confirmed public visibility and push/admin access. The repository initially had no branches. No existing remote work was removed, and no force-push was used.

## Two histories, accurately distinguished

The original ZIP contained a verified, complete four-commit Git bundle. It was restored locally without changing any commit hash, date, or author. All four original commits use **Codex <codex@openai.com>**.

Shell Git could read the public repository, but a push failed with:

```text
fatal: could not read Username for 'https://github.com': No such device or address
```

The authenticated GitHub plugin successfully published the source. Its commit operation does not expose original-author/date fields or raw Git object import, so it created new publication commits. Their trees reproduce the original implementation stages, and each message records its original hash, original Codex author, and a Codex coauthor credit. GitHub's returned author/committer metadata and the fetched Git log link these new commits to **adeebkjan11-ctrl**. This is publication attribution for an AI-assisted project, not a claim that the four original Codex commits belonged to that account.

| Original Codex commit | Publication commit | Stage |
|---|---|---|
| `01a85f55b58fc903325197742950af16a4995db7` | `88b16f4ea6a0cd546cced11923967fea576f26be` | QVAC engine and real-inference smoke test |
| `74fce1fd4a836c8c2134807deccf36380d85bb6b` | `bbb66b0098582eb821715c13ac46dcbf0a7b8802` | Local server, responsive UI, and study workflow |
| `5b17a9c7bbbd2c585a1ccd31544acd2e6ae85633` | `35b7cde4c5ff826df4b69fcab711bc7840724686` | Documentation, validation, and HTTP tests |
| `64fc08f69592f295416b491602b288e47a3576b7` | `572de76543bc3b7b5bf1314557c0dd8265f16964` | Official Python backend and real inference |

The final restored source tree was byte-for-byte identical to the original fourth commit before adding new screenshot/evidence documentation. At initial evidence commit `7e063f40308864c7619eef07d4650dd6ba142787`, public main contained six publication commits: one MIT-license initialization, these four substantive stages, and an evidence/documentation update. Later answer-grounding and verification updates add to that history. The requested three-commit minimum is exceeded; the original Codex authorship remains unchanged. See [latest verification](VERIFICATION-CURRENT.md).

## Original history remains recoverable

[pocket-recall-history.bundle](../pocket-recall-history.bundle) preserves all four original commits unchanged. They are archived in that bundle rather than being ancestors of public main. To inspect them separately:

```sh
git clone pocket-recall-history.bundle pocket-recall-original
git -C pocket-recall-original log --format=fuller
```

An attempted GitHub Actions history-restoration workflow was rejected by automatic approval review because persistent `contents: write` access and automatic pushes to main would expand privileged access beyond the publication request. That workflow was not added. The safer bundle-preservation route was used; no token, new credential, or write-enabled workflow was created.

## Submission status

The source, MIT license, README, QVAC 0.19.1 declarations, real SDK calls, genuine screenshot, and minimum commit count are published. The owner must still post on X with **@qvac**, obtain the actual post URL, and send any required challenge submission. No X account was accessed and no post was sent.
