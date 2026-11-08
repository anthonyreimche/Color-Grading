// The Colour Grading stage on the real renderer (run via `npm run test:gpu`):
// with the wheels neutral it leaves the frame as it would be without the stage,
// and the live view leaves it out; move a wheel, or only a luma lift, and it is
// back in and the frame changes. Line 1 grades every pixel and declares no rule.

import { DEFAULT_DEVELOP_PARAMS, proveDormancy } from "./dormancy-rig";
import { STAGE_ID, colorGradingStage } from "@ext/stages";

const WHEELS = DEFAULT_DEVELOP_PARAMS.colorGrading;

proveDormancy("safelight.color-grading", (line) => [colorGradingStage(line)], {
  title: "Colour Grading",
  stageId: STAGE_ID,
  lines: [2, 3],
  // The ranges only weight the wheels, which are neutral.
  rests: { "its ranges are moved": { colorGrading: { ...WHEELS, shadowRange: 10, highlightRange: 90 } } },
  moves: {
    "a shadows wheel": { colorGrading: { ...WHEELS, shadows: { hue: 210, sat: 30, luma: 0 } } },
    "a highlights wheel": { colorGrading: { ...WHEELS, highlights: { hue: 50, sat: 40, luma: 0 } } },
    "a luma lift alone": { colorGrading: { ...WHEELS, global: { hue: 0, sat: 0, luma: -30 } } },
  },
});
