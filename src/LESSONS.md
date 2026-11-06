# Lessons from NORDEN and STORKLINTA

The checklist below is also in the assembly-manual-animator skill.

## Model
- Start from real product dimensions when the person can supply a dimension drawing and photos. Manual line drawings alone give wrong proportions.
- Split hinges into two halves. Rotate each leaf about the knuckle.
- Frames with gate legs need set-back rails so the legs nest beside the posts.
- A rail ends at the face of the post it joins. It must not pass into it.
- Move large parts into place first. Fasten only after they stop.
- Drawers must sit between rails and clear the block and top rail.

## Holes and fasteners
- Every fastener needs a hole on both parts, on the right face, at the landing coordinates.
- Show target holes as a dark hole with an orange ring, enlarged slightly for display.
- Heads seat flush. Check each head and tip against the material by coordinates.
- Screws turn clockwise seen from the head. Tools in world space must allow for an inverted frame.
- Hammers: claw hammer in a hand, wrist pivot, face on the part, placed by hand first, then tapped home.

## Labels and navigation
- Labels point at a visible area. Sets follow the item being installed.
- Show repeated sub-assemblies once. Previous and next skip the copies.
- In continuous play the next step waits for both the animation and the narration.
- Drag rotates, wheel zooms at the cursor, right drag or two fingers pans. Reset on step change.

## Voice
- A Claude Artifact page has no microphone. Full voice chat needs a standalone site.
- Android system speech goes silent after speech recognition. Use the in-page Piper voice through Web Audio.
- Listen and speak in turns: stop the mic before speaking, wait 1 second after, filter echo.
- Merge speech split by a pause: wait 1.5 seconds before sending, except for short commands.
- Accept homophones (部, 布 and 不 for 步) and phrases such as 回到第三步.
- Short commands run locally with no key. Everything else goes to Claude.
- Red orb only when the mic is really live. Spoken interruption listens for set words only.
- Streaming tool loops must keep thinking blocks as they are. Version shim.js in the script URL so caches do not hide fixes.

## Materials
- Sample real colours from photos, keep stave contrast low, use long narrow staves, soft shadows and pale edge lines. Do not publish IKEA photos.

## Debugging with a person
- Ask for a screenshot and read it closely. Show live status on screen.
- Use small experiments, such as a test tone, before changing code. Do not guess repeatedly.
- Read error text before giving a cause. "请再试一次" was a failed API call, not the AI misunderstanding.
