# EKET 35×25×35 — experiment: assembled 3D file + manual → step-by-step model

For testing only.

- 3D source: **IKEA 3D Assembly Dataset**, `EKET_70332124_35x25x35.glb`, © Inter IKEA Systems B.V. 2021,
  https://github.com/IKEA/IKEA3DAssemblyDataset — licensed **CC BY-NC-SA 4.0** (attribution, non-commercial, share-alike).
- `model.json` is an adaptation of that file (geometry welded, normals/textures dropped, parts recoloured, assembly steps added)
  and is shared under the same licence, CC BY-NC-SA 4.0. Not for commercial use.
- Step order and directions were laid out by reading the assembly instruction AA-1914763-5 from the same dataset; they have not
  been confirmed by a person. Part descriptions in Chinese are ours, not the maker's names.
- Made with `src/exp/glb2model.js`. View: `app/model.html?src=../exp/eket/model.json`.
