// Safelight — founded and principally authored by Anthony Reimche.
// Copyright (C) 2026 Anthony Reimche. Licensed under the GNU GPL v3 with an
// attribution-preservation term (GPL v3 §7b) — see LICENSE. This notice must
// be preserved in derived versions.

// The look core gave the Colour Grading panel with Tailwind utilities, as plain
// CSS (the app's Tailwind build never scans an extension). `:where()` drops
// every rule to zero specificity, so a stylesheet that restyles the panel or
// its inputs wins over them. The `html.sl-larger-text` rules repeat core's
// Accessibility rules for 9 px and 10 px text.

import type { UiTokens } from "./safelight";

const P = "safelight-color-grading";

export const cls = {
  wheels: `${P}-wheels`,
  wheel: `${P}-wheel`,
  wheelLabel: `${P}-wheel-label`,
  values: `${P}-values`,
  value: `${P}-value`,
  hue: `${P}-hue`,
  sat: `${P}-sat`,
  slash: `${P}-slash`,
  luma: `${P}-luma`,
  ranges: `${P}-ranges`,
} as const;

export function colorGradingCss(t: UiTokens): string {
  return `
:where(.${cls.wheels}) { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); column-gap: 0.5rem; row-gap: 0.75rem; }
:where(.${cls.wheel}) { display: flex; flex-direction: column; align-items: center; gap: 0.25rem; }
:where(.${cls.wheelLabel}) { font-size: 10px; color: ${t.textMuted}; }
:where(.${cls.values}) { display: flex; align-items: center; justify-content: center; font-size: 9px; font-variant-numeric: tabular-nums; color: ${t.textMuted}; }
:where(.${cls.value}) { border-radius: 0.25rem; background-color: transparent; text-align: center; color: ${t.textSecondary}; outline: none; }
:where(.${cls.value}:focus) { background-color: ${t.surface2}; }
:where(.${cls.hue}) { width: 1.75rem; }
:where(.${cls.sat}) { width: 1.5rem; }
:where(.${cls.slash}) { margin-inline: 0.125rem; }
:where(.${cls.luma}) { width: 100%; }
:where(.${cls.ranges}) { margin-top: 0.75rem; border-top: 1px solid ${t.borderSubtle}; padding-top: 0.75rem; }
:where(.${cls.ranges} > :not(:last-child)) { margin-block: 0 0.125rem; }
html.sl-larger-text .${cls.values} { font-size: 11px !important; }
html.sl-larger-text .${cls.wheelLabel} { font-size: 12px !important; }
`;
}
