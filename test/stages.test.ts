// The stage each release line registers. Its text is pinned with the hashes
// Safelight's own tests hold for its copy of it
// (src/rendering/webgl/essential-stages.test.ts in the app): a change here
// fails until the app's copy changes the same way, so the program a line
// builds stays the one the app froze for that line's process version.

import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import type { ColorGradingParams, Line, ProcessingStageContribution } from "../src/safelight";
import { STAGE_ID, colorGradingStage, isNeutralColorGrading } from "../src/stages";

const LINE_HASHES: Record<Line, string> = {
  1: "fe57ac4e2f95c76228f7c8b2dc34522000a507b29693c0f24cafc7461270c088",
  2: "cd8629296f5c91ae176fc11b0da2ff5e43854680124613dfabba0a6e0b5bceec",
  3: "cd8629296f5c91ae176fc11b0da2ff5e43854680124613dfabba0a6e0b5bceec",
};

/** What a line's hash covers, as the app's stageText writes it. */
const stageText = (s: ProcessingStageContribution): string =>
  JSON.stringify([s.id, s.phase, s.priority ?? null, s.anchor ?? null, s.glsl, s.helpers ?? null, s.uniforms, s.textures ?? null]);

const sha256 = (text: string): string => createHash("sha256").update(text).digest("hex");

const NEUTRAL: ColorGradingParams = {
  shadows: { hue: 0, sat: 0, luma: 0 },
  midtones: { hue: 0, sat: 0, luma: 0 },
  highlights: { hue: 0, sat: 0, luma: 0 },
  global: { hue: 0, sat: 0, luma: 0 },
  shadowRange: 50,
  highlightRange: 50,
};

const GRADED: ColorGradingParams = {
  shadows: { hue: 210, sat: 30, luma: -10 },
  midtones: { hue: 40, sat: 5, luma: 0 },
  highlights: { hue: 50, sat: 20, luma: 8 },
  global: { hue: 0, sat: 0, luma: -3 },
  shadowRange: 35,
  highlightRange: 70,
};

const GRADED_VALUES = {
  uCGShadowHue: 210,
  uCGShadowSat: 30,
  uCGShadowLuma: -10,
  uCGMidHue: 40,
  uCGMidSat: 5,
  uCGMidLuma: 0,
  uCGHighHue: 50,
  uCGHighSat: 20,
  uCGHighLuma: 8,
  uCGGlobalHue: 0,
  uCGGlobalSat: 0,
  uCGGlobalLuma: -3,
  uCGShadowRange: 0.35,
  uCGHighlightRange: 0.7,
};

describe("colorGradingStage", () => {
  it.each([1, 2, 3] as const)("registers line %i's text as the app froze it", (line) => {
    expect(sha256(stageText(colorGradingStage(line)))).toBe(LINE_HASHES[line]);
  });

  it("runs at the colour-grading anchor", () => {
    expect(colorGradingStage(3)).toMatchObject({ id: STAGE_ID, phase: "display-adjust", anchor: "color-grading" });
  });

  it("grades every pixel on line 1, and only while in use from line 2", () => {
    expect(colorGradingStage(1).glsl).toBe("c = applyColorGrading(c);");
    for (const line of [2, 3] as const) {
      expect(colorGradingStage(line).glsl).toBe("if (uColorGradingActive) c = applyColorGrading(clamp(c, 0.0, 1.0));");
    }
  });

  it("takes line 1's uniforms from the photo's wheels and ranges", () => {
    expect(colorGradingStage(1).derive?.({ colorGrading: GRADED })).toEqual(GRADED_VALUES);
  });

  it("adds whether the wheels do anything from line 2", () => {
    const stage = colorGradingStage(3);
    expect(stage.derive?.({ colorGrading: GRADED })).toEqual({ ...GRADED_VALUES, uColorGradingActive: true });
    expect(stage.derive?.({ colorGrading: NEUTRAL })).toMatchObject({ uColorGradingActive: false });
  });

  it.each([1, 3] as const)("derives a value for every uniform line %i declares, and nothing else", (line) => {
    const stage = colorGradingStage(line);
    expect(Object.keys(stage.derive?.({ colorGrading: GRADED }) ?? {}).sort()).toEqual(
      stage.uniforms.map((u) => u.key).sort(),
    );
  });
});

describe("dormantWhen", () => {
  it("is off on line 1, which grades every pixel and clips what it passes", () => {
    expect(colorGradingStage(1).dormantWhen).toBeUndefined();
  });

  it.each([2, 3] as const)("lets line %i sleep while the wheels are neutral", (line) => {
    expect(colorGradingStage(line).dormantWhen).toEqual({ uColorGradingActive: false });
  });

  it.each([2, 3] as const)("names a bool uniform line %i declares, and no array", (line) => {
    const stage = colorGradingStage(line);
    const rule = stage.dormantWhen ?? {};
    expect(Object.keys(rule)).not.toEqual([]);
    for (const key of Object.keys(rule)) {
      const uniform = stage.uniforms.find((u) => u.key === key);
      expect(uniform?.glslType).toBe("bool");
      expect(uniform).not.toHaveProperty("length");
    }
  });

  // The rule holds for what the stage derives from an untouched photo, however
  // its ranges are set, and for no wheel that does anything.
  it.each([2, 3] as const)("holds for neutral wheels on line %i, whatever the ranges", (line) => {
    const stage = colorGradingStage(line);
    const rule = stage.dormantWhen ?? {};
    expect(Object.keys(rule)).not.toEqual([]);
    for (const wheels of [NEUTRAL, { ...NEUTRAL, shadowRange: 10, highlightRange: 90 }]) {
      expect(stage.derive?.({ colorGrading: wheels })).toMatchObject(rule);
    }
  });

  it.each([
    ["shadows", { ...NEUTRAL, shadows: { hue: 210, sat: 30, luma: 0 } }],
    ["midtones", { ...NEUTRAL, midtones: { hue: 40, sat: 5, luma: 0 } }],
    ["highlights", { ...NEUTRAL, highlights: { hue: 50, sat: 20, luma: 0 } }],
    ["global", { ...NEUTRAL, global: { hue: 0, sat: 1, luma: 0 } }],
    ["shadows luma alone", { ...NEUTRAL, shadows: { hue: 0, sat: 0, luma: -10 } }],
    ["global luma alone", { ...NEUTRAL, global: { hue: 0, sat: 0, luma: 3 } }],
  ] as const)("breaks for a moved %s wheel", (_, wheels) => {
    const rule = colorGradingStage(3).dormantWhen ?? {};
    const derived: Record<string, unknown> = colorGradingStage(3).derive?.({ colorGrading: wheels }) ?? {};
    expect(Object.entries(rule).every(([key, value]) => derived[key] === value)).toBe(false);
  });
});

describe("isNeutralColorGrading", () => {
  it("sees neutral grading only when every wheel offset and luma lift is zero", () => {
    expect(isNeutralColorGrading(NEUTRAL)).toBe(true);
    expect(isNeutralColorGrading({ ...NEUTRAL, shadowRange: 10, highlights: { hue: 40, sat: 0, luma: 0 } })).toBe(true);
    expect(isNeutralColorGrading({ ...NEUTRAL, midtones: { hue: 40, sat: 5, luma: 0 } })).toBe(false);
    expect(isNeutralColorGrading({ ...NEUTRAL, global: { hue: 0, sat: 0, luma: -3 } })).toBe(false);
  });
});
