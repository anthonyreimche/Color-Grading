# Color Grading for Safelight

The Develop **Color Grading** panel: four colour wheels and two blend ranges.

- **Wheels:** Shadows, Midtones, Highlights and Global. Drag on a wheel to
  set its hue and saturation (hold Shift for fine control), or type them in
  the fields under it. Double-click a wheel to clear its colour. The slider
  under each wheel lifts or lowers that range's brightness.
- **Shadow Range** and **Highlight Range** set how far into the midtones the
  shadows and highlights wheels reach.

The tint never shifts brightness on its own: only the luma sliders do. Each
gesture is one Undo step. Right-click the panel's header and choose
**Reset to defaults** to clear all of it as one step.

Until Safelight 3.2.0 this panel was built in. It keeps the built-in panel's
id (`core.color-grading`), so layouts saved before then keep it where it was,
and photos keep their grading. While the extension is off or uninstalled,
those photos show without it; Develop says so and offers to bring it back.

## Release lines

A release's major version is its line: the process version its grading was
written for. Line 1 runs on every pixel and clips the result to the
displayable range, as Safelight's first process version did. Lines 2 and 3
skip neutral wheels, so a photo with no grading passes through untouched. The
installed release draws every photo with its line, so picking a 1.x release
in the Extensions store brings back the first look for all photos.

To build another line, set `version` in both `safelight.json` and
`package.json` to that major version; `vite.config.ts` reads the line from it.

## Development

```bash
npm install
npm run typecheck
npm run build    # dist/index.js, the file Safelight loads
npm test         # vitest; the bundle checks read dist/, so build first
npm run check    # all three, in that order
```

`test/stages.test.ts` pins each line's stage text with the same hashes as
Safelight's own copy (`src/rendering/webgl/essential-stages.test.ts` in the
app). Change both together.
