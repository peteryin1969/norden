# assembly-model, version 1

One JSON file holds a product's 3D model and the motion of every assembly step. `mplay.js` plays it with no product code.
`bake.js` writes it from the running engine (`window.__bake.bake()`), with the edit layer applied. Unit: centimetres, y up.

```
{ format:"assembly-model", version:1, unit:"cm", up:"y", product, samples:120,
  render:{shadow,shadowType,tone,enc,fov,near,far},
  scenes:[ {bg?, nodes:[node…]} ],        // a product may use more than one scene (STORKLINTA: cabinet, drawer)
  geoms:[geom…], texs:[tex…], mats:[mat…],
  steps:[step…], parts:[part…], holes:[hole…], warn:[] }
```

**node** — `p` parent index (−1 = scene), `t` kind (`G` group, `M` mesh, `L` line segments, `l` line, `S` sprite, `A`/`D`/`H`/`Q` lights),
`g` geometry index, `m` material index (or list), `x` rest pose `[px,py,pz, qx,qy,qz,qw, sx,sy,sz]`, `h:1` hidden at rest,
`cs`/`rs` shadows, `ro` render order, `code` part number where the engine knew it. Nodes are listed parent before child.

**geom** — `{k:"box",a:[w,h,d]}`, `{k:"cyl",a:[rTop,rBottom,h,segments,…]}`, `{k:"edges",g:<geom>,a:<angle>}` (outline of another shape),
or `{k:"raw",pos,nor?,uv?,idx?,i32?,grp?}` with base64 Float32/Uint16 arrays. Boards and cylinders keep their real sizes, so they can be edited as sizes later.

**mat** — `k` three.js material type, `c` colour, `e` glow, `o` opacity, `tr` transparent, `sd` side, `map` texture index, `ord` creation order
(coplanar faces draw in this order), plus a few rarely used flags.

**step** — `id`, `title`, `label`, `scene`, `dur`, `parts:[[code,qty]…]` from the step data, and the motion:
- `nodes:{ "<node>": {p?,q?,s?,v?} }` — flat key lists `[sample, values…, sample, values…]`. `p` position, `q` quaternion, `s` scale are
  interpolated (straight line / slerp) between keys; `v` visibility is held. A node not listed stays at rest for the whole step.
- `mats:{ "<mat>": {c?,e?,o?,f?} }` — colour, glow, opacity and flags (1 transparent, 2 depth write, 4 visible), held until the next key.
- `cam:[sample, px,py,pz, qx,qy,qz,qw, distance …]` — the engine's camera every 10 samples.

Keys are the samples that straight interpolation needs to stay within 0.0002 cm / 0.00002 (quaternion) of all 121 samples of the step.

**part** — `{id:"cp<n>"|"gs:<name>"|"dp<n>", scene, node, code?, name?, group?, kind?:"group", steps:[…]}`: what a node is. `steps` are the
steps in which the part itself moves. **hole** — `{scene,node,steps}`.

Not in the file: 2D labels and captions, the wood-grain look (a display style), tap-to-pick and the voice layer.

## Edited files (medit.js, the data workshop)

Parts added in the workshop are ordinary nodes with ordinary keyframes, plus on the part entry: `made:1`, `step` (the step it is
fitted in), `approach` (offset it comes in from, in its parent's frame; `approachW` the same in world axes), `on` (node it is fixed
onto), `size` for imported meshes, `from` (the part it was copied from). A deleted part keeps its entry with `removed:1` and is
hidden everywhere. `log:[{at,text}]` records the edits. `step.parts` follows parts being added, removed, renumbered or moved to
another step.
