# Assembly assistant sources

- `products/<slug>/`: one product. `steps.json` (steps from the manual), `cells.json` (parts grid), `cab.js` (3D model and pose sequence), `build.py` (crops manual images, reconciles parts, writes the page).
- `shared/voice.js`: conversational voice mode. `shared/shim.js`: API access for the standalone site. `shared/site.py`: assembles the site, including the product picker.
- `tts/` at the site root: Piper voice `zh_CN-huayan-medium` (MIT-licensed Piper, voice from rhasspy/piper-voices via sherpa-onnx releases), ONNX Runtime Web and piper_phonemize.

Manual page renders are not kept here; build.py expects them under `hi/p-NN.png`.
