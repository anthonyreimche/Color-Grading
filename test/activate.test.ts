// What activate() registers: the Colour Grading panel under core's old panel id,
// title, dock spot and reset (so saved layouts keep it), the stylesheet, and the
// wheels' stage of this release's line.

import { describe, expect, it } from "vitest";
import { ColorGradingPanel } from "../src/ColorGradingPanel";
import { LINE, PANEL_ID, STYLESHEET_ID, activate } from "../src/index";
import type { ProcessingStageContribution } from "../src/safelight";
import { colorGradingStage } from "../src/stages";
import manifest from "../safelight.json";
import { DEFAULT_GRADING, fakeApi } from "./support/fake-api";

const text = ({ derive: _, ...rest }: ProcessingStageContribution) => rest;

describe("activate", () => {
  it("registers the Colour Grading panel, as core's core.color-grading did", () => {
    const rig = fakeApi();
    activate(rig.api);
    expect(rig.panels).toEqual([
      {
        id: "core.color-grading",
        title: "Colour Grading",
        component: ColorGradingPanel,
        defaultDock: { module: "develop", direction: "right", order: 7, width: 280, height: 200 },
        onReset: expect.any(Function),
      },
    ]);
    expect(PANEL_ID).toBe("core.color-grading");
  });

  it("resets the grading as one step from the dock header", () => {
    const rig = fakeApi({ ...DEFAULT_GRADING, shadowRange: 20 });
    activate(rig.api);
    rig.panels[0].onReset?.();
    expect(rig.calls).toEqual([{ resetParams: ["colorGrading"], label: "Reset Colour Grading" }]);
    expect(rig.develop.getState().params.colorGrading).toEqual(DEFAULT_GRADING);
  });

  it("registers the stage of the line its major version names", () => {
    const rig = fakeApi();
    activate(rig.api);
    expect(LINE).toBe(Number(manifest.version.split(".")[0]));
    expect(rig.stages.map(text)).toEqual([text(colorGradingStage(LINE))]);
    expect(typeof rig.stages[0].derive).toBe("function");
  });

  it("is a line 3 release", () => {
    expect(LINE).toBe(3);
  });

  it("registers its stylesheet once, in the theme's colours", () => {
    const rig = fakeApi();
    activate(rig.api);
    expect(rig.stylesheets.map((s) => s.id)).toEqual([STYLESHEET_ID]);
    expect(rig.stylesheets[0].css).toContain("var(--color-border-subtle)");
  });
});
