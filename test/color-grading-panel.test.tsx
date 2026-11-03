// The panel draws core's Panel, closed by default, with four wheels and the two
// blend-range sliders over the photo's grading, as core's Color Grading panel
// did. Every edit writes the whole grading back; each gesture's end is one
// undoable step named after its wheel or slider.

import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { ColorGradingPanel } from "../src/ColorGradingPanel";
import { React, initRuntime } from "../src/rt";
import { cls } from "../src/styles";
import { DEFAULT_GRADING, fakeApi, stubCanvas } from "./support/fake-api";

const GRADED = { ...DEFAULT_GRADING, shadows: { hue: 210, sat: 30, luma: -10 } };

let restoreCanvas: () => void;
beforeEach(() => {
  restoreCanvas = stubCanvas();
});
afterEach(() => {
  cleanup();
  restoreCanvas();
});

function setup() {
  const rig = fakeApi(GRADED);
  initRuntime(rig.api);
  const view = render(<ColorGradingPanel />);
  return { rig, view };
}

const wheel = (label: string) => screen.getByTitle(new RegExp(`^${label} colour wheel`));

describe("ColorGradingPanel", () => {
  it("is core's Color Grading panel, closed by default", () => {
    const { rig } = setup();
    expect(rig.panelProps()).toEqual({ title: "Color Grading", defaultOpen: false });
  });

  it("draws the four wheels, labelled, with their hue and saturation", () => {
    const { view } = setup();
    expect([...view.container.querySelectorAll(`.${cls.wheelLabel}`)].map((e) => e.textContent)).toEqual([
      "Shadows",
      "Midtones",
      "Highlights",
      "Global",
    ]);
    const shadows = wheel("Shadows").parentElement!;
    expect([...shadows.querySelectorAll("input")].map((i) => i.value)).toEqual(["210", "30"]);
  });

  it("gives each wheel a luma slider, then the two range sliders", () => {
    const { rig, view } = setup();
    const sliders = rig.sliders(view.container);
    expect(sliders.map(({ label, value, min, max, defaultValue, compact }) => ({ label, value, min, max, defaultValue, compact }))).toEqual([
      { label: "", value: -10, min: -100, max: 100, defaultValue: 0, compact: true },
      { label: "", value: 0, min: -100, max: 100, defaultValue: 0, compact: true },
      { label: "", value: 0, min: -100, max: 100, defaultValue: 0, compact: true },
      { label: "", value: 0, min: -100, max: 100, defaultValue: 0, compact: true },
      { label: "Shadow Range", value: 50, min: 0, max: 100, defaultValue: 50, compact: undefined },
      { label: "Highlight Range", value: 50, min: 0, max: 100, defaultValue: 50, compact: undefined },
    ]);
  });

  it("writes a wheel's luma into its range and commits under the wheel's name", () => {
    const { rig, view } = setup();
    const midLuma = rig.sliders(view.container)[1];
    act(() => {
      midLuma.onChange(12);
      midLuma.onCommit?.();
    });
    expect(rig.calls).toEqual([
      { setParam: "colorGrading", value: { ...GRADED, midtones: { hue: 0, sat: 0, luma: 12 } } },
      { commitEdit: "Color Grading – Midtones" },
    ]);
  });

  it("writes a blend range and commits under its own name", () => {
    const { rig, view } = setup();
    const range = rig.sliders(view.container)[5];
    act(() => {
      range.onChange(70);
      range.onCommit?.();
    });
    expect(rig.calls).toEqual([
      { setParam: "colorGrading", value: { ...GRADED, highlightRange: 70 } },
      { commitEdit: "Color Grading – Highlight Range" },
    ]);
  });

  it("takes a typed hue, wrapped into 0-360, and commits when the field loses focus", () => {
    const { rig } = setup();
    const [hue] = wheel("Global").parentElement!.querySelectorAll("input");
    fireEvent.focus(hue);
    fireEvent.change(hue, { target: { value: "-30" } });
    fireEvent.blur(hue);
    expect(rig.calls).toEqual([
      { setParam: "colorGrading", value: { ...GRADED, global: { hue: 330, sat: 0, luma: 0 } } },
      { commitEdit: "Color Grading – Global" },
    ]);
  });

  it("caps a typed saturation at 100, and ignores an empty field", () => {
    const { rig } = setup();
    const [, sat] = wheel("Highlights").parentElement!.querySelectorAll("input");
    fireEvent.focus(sat);
    fireEvent.change(sat, { target: { value: "" } });
    fireEvent.change(sat, { target: { value: "140" } });
    expect(rig.calls).toEqual([
      { setParam: "colorGrading", value: { ...GRADED, highlights: { hue: 0, sat: 100, luma: 0 } } },
    ]);
  });

  it("resets a wheel's hue and saturation on double-click, keeping its luma", () => {
    const { rig } = setup();
    fireEvent.doubleClick(wheel("Shadows"));
    expect(rig.calls).toEqual([
      { setParam: "colorGrading", value: { ...GRADED, shadows: { hue: 0, sat: 0, luma: -10 } } },
      { commitEdit: "Color Grading – Shadows" },
    ]);
  });
});
