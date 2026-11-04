// Safelight — founded and principally authored by Anthony Reimche.
// Copyright (C) 2026 Anthony Reimche. Licensed under the GNU GPL v3 with an
// attribution-preservation term (GPL v3 §7b) — see LICENSE. This notice must
// be preserved in derived versions.

// The colour grading wheels' block of the develop program. Until Safelight 3.2.0
// it was core's own; its GLSL is core's, moved as written. It runs at the
// develop program's colour-grading anchor, between Vibrance & Saturation and
// Sharpening. Line 1 grades every pixel, as core did for a version 1 photo;
// lines 2 and 3 skip the block while the wheels are neutral, so it clips
// nothing it doesn't grade. The uniforms keep core's names (an official
// extension's stage may), and their values come from the photo's
// `colorGrading` params.

import type { ColorGradingParams, Line, ProcessingStageContribution, UniformDeclaration } from "./safelight";

export const STAGE_ID = "safelight.color-grading.grade";

const float = (key: string): UniformDeclaration => ({ key, glslType: "float", default: 0 });

const CG_UNIFORMS = [
  "uCGShadowHue",
  "uCGShadowSat",
  "uCGShadowLuma",
  "uCGMidHue",
  "uCGMidSat",
  "uCGMidLuma",
  "uCGHighHue",
  "uCGHighSat",
  "uCGHighLuma",
  "uCGGlobalHue",
  "uCGGlobalSat",
  "uCGGlobalLuma",
  "uCGShadowRange",
  "uCGHighlightRange",
].map(float);

const CG_HELPERS = `// Convert hue+sat to a neutral-axis RGB color offset (equilateral triangle projection).
// The three cosines are 120° apart so they always sum to zero — no net luminance shift.
vec3 cgWheelRGB(float hueDeg, float satPct) {
  if (satPct < 0.001) return vec3(0.0);
  float rad = hueDeg * 3.14159265358979 / 180.0;
  float s = satPct / 100.0 * 0.15; // max ±15% per channel at full saturation
  return vec3(
    cos(rad),
    cos(rad - 2.09439510239320), // 2π/3
    cos(rad - 4.18879020478640)  // 4π/3
  ) * s;
}

vec3 applyColorGrading(vec3 c) {
  float l = luma(c);
  // Shadow weight: peaks at black, falls off toward midtones.
  float shRange = max(uCGShadowRange, 0.05);
  float hiRange = max(uCGHighlightRange, 0.05);
  float shadowW    = 1.0 - smoothstep(0.0, shRange, l);
  shadowW          = shadowW * shadowW;
  float highlightW = smoothstep(1.0 - hiRange, 1.0, l);
  highlightW       = highlightW * highlightW;
  float midW       = clamp(1.0 - shadowW - highlightW, 0.0, 1.0);

  vec3 shColor  = cgWheelRGB(uCGShadowHue,  uCGShadowSat);
  vec3 midColor = cgWheelRGB(uCGMidHue,     uCGMidSat);
  vec3 hiColor  = cgWheelRGB(uCGHighHue,    uCGHighSat);
  vec3 glColor  = cgWheelRGB(uCGGlobalHue,  uCGGlobalSat);

  vec3 colorOffset = shadowW    * shColor
                   + midW       * midColor
                   + highlightW * hiColor
                   + glColor;  // global applied uniformly
  // Strip any net luminance the (weight-blended) offset introduced. cgWheelRGB is
  // luma-neutral per range, but the per-pixel weighting is not, so without this the
  // tint lifts/drops tones and washes out contrast/detail. Removing the luma term
  // keeps the change purely chromatic — color shifts, tonal structure is untouched.
  colorOffset -= vec3(luma(colorOffset));
  c += colorOffset;

  // Per-range luminance adjustments, scaled so ±100 → ±0.25 exposure-equivalent.
  float lumaAdj = shadowW    * (uCGShadowLuma / 100.0) * 0.25
                + midW       * (uCGMidLuma    / 100.0) * 0.25
                + highlightW * (uCGHighLuma   / 100.0) * 0.25
                + (uCGGlobalLuma / 100.0) * 0.25;
  c += vec3(lumaAdj);

  return clamp(c, 0.0, 1.0);
}`;

/** True when the wheels change nothing: every range's colour offset (the
 *  shader drops saturation below 0.001) and luma lift are zero. */
export function isNeutralColorGrading(cg: ColorGradingParams): boolean {
  return [cg.shadows, cg.midtones, cg.highlights, cg.global].every((r) => r.sat < 0.001 && r.luma === 0);
}

const values = (cg: ColorGradingParams) => ({
  uCGShadowHue: cg.shadows.hue,
  uCGShadowSat: cg.shadows.sat,
  uCGShadowLuma: cg.shadows.luma,
  uCGMidHue: cg.midtones.hue,
  uCGMidSat: cg.midtones.sat,
  uCGMidLuma: cg.midtones.luma,
  uCGHighHue: cg.highlights.hue,
  uCGHighSat: cg.highlights.sat,
  uCGHighLuma: cg.highlights.luma,
  uCGGlobalHue: cg.global.hue,
  uCGGlobalSat: cg.global.sat,
  uCGGlobalLuma: cg.global.luma,
  uCGShadowRange: cg.shadowRange / 100,
  uCGHighlightRange: cg.highlightRange / 100,
});

/** The stage of release line `line`. */
export function colorGradingStage(line: Line): ProcessingStageContribution {
  const base = { id: STAGE_ID, name: "Colour Grading", phase: "display-adjust", anchor: "color-grading" } as const;
  if (line === 1) {
    return {
      ...base,
      glsl: "c = applyColorGrading(c);",
      helpers: CG_HELPERS,
      uniforms: CG_UNIFORMS,
      derive: ({ colorGrading }) => values(colorGrading),
    };
  }
  return {
    ...base,
    glsl: "if (uColorGradingActive) c = applyColorGrading(clamp(c, 0.0, 1.0));",
    helpers: CG_HELPERS,
    uniforms: [...CG_UNIFORMS, { key: "uColorGradingActive", glslType: "bool", default: false }],
    derive: ({ colorGrading }) => ({ ...values(colorGrading), uColorGradingActive: !isNeutralColorGrading(colorGrading) }),
  };
}
