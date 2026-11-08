// Safelight — founded and principally authored by Anthony Reimche.
// Copyright (C) 2026 Anthony Reimche. Licensed under the GNU GPL v3 with an
// attribution-preservation term (GPL v3 §7b) — see LICENSE. This notice must
// be preserved in derived versions.

// The slice of Safelight's extension API this extension touches, mirrored from
// the app's src/extensions/types.ts, src/catalog/types.ts,
// src/state/develop-store.ts, src/extensions/ui-kit.tsx and
// src/ui/components/{Panel,Slider}.tsx. Extensions are standalone bundles, so
// the host's source is not on the type path; React types come from
// @types/react (dev only).

import type { ComponentType, ReactNode } from "react";

/** A release line: the process version its stage text was written for, and
 *  the extension's major version. */
export type Line = 1 | 2 | 3;

export interface StoreApi<T> {
  (): T;
  <U>(selector: (state: T) => U): U;
  getState(): T;
  setState(partial: Partial<T> | ((s: T) => Partial<T>)): void;
  subscribe(listener: (state: T, prev: T) => void): () => void;
}

/** One wheel: hue in degrees, saturation and luma from 0 / -100 to 100. */
export interface ColorGradingRange {
  hue: number;
  sat: number;
  luma: number;
}

export interface ColorGradingParams {
  shadows: ColorGradingRange;
  midtones: ColorGradingRange;
  highlights: ColorGradingRange;
  global: ColorGradingRange;
  /** How far up the tones the shadows wheel reaches, 0-100. */
  shadowRange: number;
  /** How far down the tones the highlights wheel reaches, 0-100. */
  highlightRange: number;
}

/** The develop params this extension reads. Core's carry many more fields. */
export interface DevelopParams {
  colorGrading: ColorGradingParams;
}

export interface DevelopStoreState {
  params: DevelopParams;
  setParam<K extends keyof DevelopParams>(key: K, value: DevelopParams[K]): void;
  /** End a gesture: one undoable history step under `label`. */
  commitEdit(label: string): Promise<void>;
  /** Put `keys` back to their defaults as one undoable step under `label`. */
  resetParams(keys: (keyof DevelopParams)[], label: string): Promise<void>;
}

export interface PanelDockDefault {
  module: "library" | "develop";
  direction: "left" | "right" | "bottom";
  order?: number;
  width?: number;
  height?: number;
}

export interface PanelContribution {
  /** Globally unique, e.g. "core.color-grading" or "my-ext.fancy-curves". */
  id: string;
  title: string;
  component: ComponentType;
  defaultDock?: PanelDockDefault;
  /** Right-clicking the panel's dock header offers "Reset to defaults". */
  onReset?: () => void;
}

export type GlslType = "float" | "int" | "bool" | "vec2" | "vec3" | "vec4";

export interface UniformDeclaration {
  key: string;
  glslType: GlslType;
  default: number | number[] | boolean;
  range?: { min: number; max: number; step?: number };
  label?: string;
}

export type StageValue = number | boolean | number[];

export interface ProcessingStageContribution {
  id: string;
  name: string;
  phase: "display-adjust";
  priority?: number;
  /** Where in the develop program the block runs (official stages only). */
  anchor?: "color-grading";
  /** The stage's block in the develop program; `c` is the display colour. */
  glsl: string;
  /** Functions the block calls, declared ahead of main(). */
  helpers?: string;
  uniforms: UniformDeclaration[];
  /** Uniform values at which the stage changes nothing: while every one holds,
   *  the live view leaves the stage out of its program (Safelight 3.2.1). */
  dormantWhen?: Readonly<Record<string, number | boolean>>;
  /** Textures the block samples (none here; part of a line's text). */
  textures?: { key: string; kind: "photo" }[];
  /** The uniforms' values for a photo, from its params (official extensions
   *  only). */
  derive?(params: DevelopParams): Record<string, StageValue>;
}

export interface StylesheetContribution {
  id: string;
  css: string;
}

/** The theme's CSS variables as `var(--color-…)` strings. */
export interface UiTokens {
  readonly surface2: string;
  readonly borderSubtle: string;
  readonly textSecondary: string;
  readonly textMuted: string;
}

export interface PanelProps {
  title: string;
  defaultOpen?: boolean;
  children: ReactNode;
}

export interface SliderProps {
  label: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  /** Double-clicking the track resets to this. */
  defaultValue?: number;
  /** Narrow label and value, for tight columns. */
  compact?: boolean;
  onChange(value: number): void;
  onCommit?(): void;
}

export interface SafelightAPI {
  version: 1;
  extensionId: string;
  react: typeof import("react");
  registerPanel(c: PanelContribution): void;
  registerProcessingStage(c: ProcessingStageContribution): void;
  registerStylesheet(c: StylesheetContribution): void;
  components: {
    /** Core's collapsible panel; inside a dock panel of the same title it
     *  draws its content only. */
    Panel: ComponentType<PanelProps>;
    Slider: ComponentType<SliderProps>;
  };
  stores: {
    useDevelopStore: StoreApi<DevelopStoreState>;
  };
  ui: { tokens: UiTokens };
}

export interface ExtensionModule {
  activate(api: SafelightAPI): void;
  deactivate?(): void;
}
