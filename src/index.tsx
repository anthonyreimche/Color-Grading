// Safelight — founded and principally authored by Anthony Reimche.
// Copyright (C) 2026 Anthony Reimche. Licensed under the GNU GPL v3 with an
// attribution-preservation term (GPL v3 §7b) — see LICENSE. This notice must
// be preserved in derived versions.

// Registers the Develop "Color Grading" panel and the wheels' stage of this
// release's line. It was core's built-in `core.color-grading` until Safelight
// 3.2.0 and keeps that panel id, so saved layouts keep it where it was.

import { ColorGradingPanel } from "./ColorGradingPanel";
import { initRuntime } from "./rt";
import type { Line, SafelightAPI } from "./safelight";
import { colorGradingStage } from "./stages";
import { colorGradingCss } from "./styles";

export const PANEL_ID = "core.color-grading";
export const STYLESHEET_ID = "safelight.color-grading.styles";

/** The release line: this release's major version (vite.config.ts). */
export const LINE = __SAFELIGHT_LINE__ as Line;

export function activate(host: SafelightAPI): void {
  initRuntime(host);
  host.registerStylesheet({ id: STYLESHEET_ID, css: colorGradingCss(host.ui.tokens) });
  host.registerProcessingStage(colorGradingStage(LINE));
  host.registerPanel({
    id: PANEL_ID,
    title: "Color Grading",
    component: ColorGradingPanel,
    defaultDock: { module: "develop", direction: "right", order: 7, width: 280, height: 200 },
    onReset: () => void host.stores.useDevelopStore.getState().resetParams(["colorGrading"], "Reset Color Grading"),
  });
}
