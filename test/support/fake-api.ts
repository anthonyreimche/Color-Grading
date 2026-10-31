// A stand-in Safelight API over real React and zustand. The develop store holds
// the grading params the way core's does and records every write. Core's Panel
// draws its children; core's Slider is replaced by a stub that keeps the props
// it was last rendered with, so a test can drive a drag and its commit the way
// the real one would.

import * as React from "react";
import { create } from "zustand";
import type {
  ColorGradingParams,
  DevelopParams,
  DevelopStoreState,
  PanelContribution,
  PanelProps,
  ProcessingStageContribution,
  SafelightAPI,
  SliderProps,
  StoreApi,
  StylesheetContribution,
  UiTokens,
} from "../../src/safelight";

export type DevelopCall =
  | { setParam: keyof DevelopParams; value: ColorGradingParams }
  | { commitEdit: string }
  | { resetParams: (keyof DevelopParams)[]; label: string };

export const DEFAULT_GRADING: ColorGradingParams = {
  shadows: { hue: 0, sat: 0, luma: 0 },
  midtones: { hue: 0, sat: 0, luma: 0 },
  highlights: { hue: 0, sat: 0, luma: 0 },
  global: { hue: 0, sat: 0, luma: 0 },
  shadowRange: 50,
  highlightRange: 50,
};

export const TOKENS: UiTokens = {
  surface2: "var(--color-surface-2)",
  borderSubtle: "var(--color-border-subtle)",
  textSecondary: "var(--color-text-secondary)",
  textMuted: "var(--color-text-muted)",
};

export interface Rig {
  api: SafelightAPI;
  develop: StoreApi<DevelopStoreState>;
  /** Every develop store write, in order. */
  calls: DevelopCall[];
  panels: PanelContribution[];
  stages: ProcessingStageContribution[];
  stylesheets: StylesheetContribution[];
  /** The props core's Panel was last rendered with. */
  panelProps(): Omit<PanelProps, "children">;
  /** The latest props of each slider drawn in `root`, in document order. */
  sliders(root: ParentNode): SliderProps[];
}

export function fakeApi(colorGrading: ColorGradingParams = DEFAULT_GRADING): Rig {
  const calls: DevelopCall[] = [];
  const panels: PanelContribution[] = [];
  const stages: ProcessingStageContribution[] = [];
  const stylesheets: StylesheetContribution[] = [];
  let lastPanel: Omit<PanelProps, "children"> | null = null;
  const sliderProps = new Map<number, SliderProps>();
  let nextSlider = 0;

  const develop: StoreApi<DevelopStoreState> = create<DevelopStoreState>()((set) => ({
    params: { colorGrading },
    setParam: (key, value) => {
      calls.push({ setParam: key, value });
      set((s) => ({ params: { ...s.params, [key]: value } }));
    },
    commitEdit: async (label) => {
      calls.push({ commitEdit: label });
    },
    resetParams: async (keys, label) => {
      calls.push({ resetParams: keys, label });
      set({ params: { colorGrading: DEFAULT_GRADING } });
    },
  }));

  function Panel({ children, ...props }: PanelProps) {
    lastPanel = props;
    return React.createElement("section", { "aria-label": props.title }, children);
  }

  function Slider(props: SliderProps) {
    const id = React.useRef(nextSlider++).current;
    sliderProps.set(id, props);
    return React.createElement("div", { "data-slider": id }, `${props.label} ${props.value}`);
  }

  const api: SafelightAPI = {
    version: 1,
    extensionId: "safelight.color-grading",
    react: React,
    registerPanel: (c) => void panels.push(c),
    registerProcessingStage: (c) => void stages.push(c),
    registerStylesheet: (c) => void stylesheets.push(c),
    components: { Panel, Slider },
    stores: { useDevelopStore: develop },
    ui: { tokens: TOKENS },
  };

  return {
    api,
    develop,
    calls,
    panels,
    stages,
    stylesheets,
    panelProps: () => {
      if (!lastPanel) throw new Error("Panel has not rendered");
      return lastPanel;
    },
    sliders: (root) =>
      [...root.querySelectorAll("[data-slider]")].map((el) => {
        const props = sliderProps.get(Number(el.getAttribute("data-slider")));
        if (!props) throw new Error("a slider without props");
        return props;
      }),
  };
}

/** A 2D context that draws nothing: jsdom has no canvas, and the wheels paint
 *  theirs as they mount. */
export function stubCanvas(): () => void {
  const original = HTMLCanvasElement.prototype.getContext;
  const noop = () => {};
  const ctx = {
    createImageData: (w: number, h: number) => ({ data: new Uint8ClampedArray(w * h * 4), width: w, height: h }),
    putImageData: noop,
    clearRect: noop,
    drawImage: noop,
    save: noop,
    restore: noop,
    setTransform: noop,
    beginPath: noop,
    arc: noop,
    stroke: noop,
    fill: noop,
  };
  HTMLCanvasElement.prototype.getContext = (() => ctx) as unknown as typeof original;
  return () => {
    HTMLCanvasElement.prototype.getContext = original;
  };
}
