# Platform engine, entry A, stages 1-3

- `mkpkg.py` assembles a client package per product (process doc section 3): `package.json`, `parts.csv`, `hardware.csv`, `dimensions.csv`, `safety.json`, the manual. Only data we actually hold; gaps stay empty so stage 1 reports them. The four IKEA products are internal test material only.
- `engine/engine.py <package> <out> [auto.json]` runs stage 1 (data package), stage 2 (steps and parts: reconciliation, open questions with suggested answers, `answers.json`) and stage 3 (animation review from `auto.json`, client sign-off `signoff.json`). Each stage gives 通过 / 退回补充 / 待客户确认; stages 2-3 run as 预审 while an earlier stage has not passed.
- `engine/stage3.js <site> <slug> <out> [three.js]` renders start/middle/end frames of every step and runs `window.__audit` (from `shared/audit.js`, built into each assistant page): parts present, fasteners on a hole, nothing floating, boards before fasteners, labels once with numbers, parts in view.
- `portal.py` writes the client portal to `site/platform/`: each stage's checks with what to fix, the questions and the storyboard, with answers and sign-offs exported as JSON.
- Not yet: the independent AI review in stage 3 (needs an AI service call), and reading parts pages from vector PDFs.

- `simpkg.py` + `simprint.js`: a complete, simulated package built from NORDEN (`norden-sim`) for walking the stages end to end: re-typeset manual PDF with a text layer, estimated panel sizes and hardware specs, a dummy authorization, OBJ model exported from the animation, FAQ, terms and step times, plus simulated client answers and sign-off. Everything is marked 模拟 and is not IKEA data.
