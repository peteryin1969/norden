# Assembly assistant sources

- `products/<slug>/`: one product. `steps.json` (steps from the manual), `cells.json` (parts grid), `cab.js` (3D model and pose sequence), `build.py` (crops manual images, reconciles parts, writes the page).
- `shared/voice.js`: conversational voice mode. `shared/shim.js`: API access for the standalone site. `shared/site.py`: assembles the site, including the product picker.
- `tts/` at the site root: Piper voice `zh_CN-huayan-medium` (MIT-licensed Piper, voice from rhasspy/piper-voices via sherpa-onnx releases), ONNX Runtime Web and piper_phonemize.

Manual page renders are not kept here; build.py expects them under `hi/p-NN.png`.
- `shared/focuskit.js` + `shared/kit.py`: the part kit for products on the cabinet engine (STORKLINTA, BILLY corner, BILLY OXBERG): spoken part name to on-screen highlight, one number per part, tap-to-pick, part-card 3D models. Each product supplies `fk.js` (aliases, extra targets). NORDEN keeps its own version in `products/norden/cab.js`.
- `shared/mkfaq.py` + `shared/faqs.py`: build each product's `faq.json` from `steps.json`, `cells.json` and the part descriptions, plus hand-written general questions from the safety section.
- `est_min` in each `steps.json` is an estimate of minutes per unit, used only for the timed check-ins.

