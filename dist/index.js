//#region src/rt.ts
var e, t;
function n(n) {
	t = n, e = n.react;
}
//#endregion
//#region src/styles.ts
var r = "safelight-color-grading", i = {
	wheels: `${r}-wheels`,
	wheel: `${r}-wheel`,
	wheelLabel: `${r}-wheel-label`,
	values: `${r}-values`,
	value: `${r}-value`,
	hue: `${r}-hue`,
	sat: `${r}-sat`,
	slash: `${r}-slash`,
	luma: `${r}-luma`,
	ranges: `${r}-ranges`
};
function a(e) {
	return `
:where(.${i.wheels}) { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); column-gap: 0.5rem; row-gap: 0.75rem; }
:where(.${i.wheel}) { display: flex; flex-direction: column; align-items: center; gap: 0.25rem; }
:where(.${i.wheelLabel}) { font-size: 10px; color: ${e.textMuted}; }
:where(.${i.values}) { display: flex; align-items: center; justify-content: center; font-size: 9px; font-variant-numeric: tabular-nums; color: ${e.textMuted}; }
:where(.${i.value}) { border-radius: 0.25rem; background-color: transparent; text-align: center; color: ${e.textSecondary}; outline: none; }
:where(.${i.value}:focus) { background-color: ${e.surface2}; }
:where(.${i.hue}) { width: 1.75rem; }
:where(.${i.sat}) { width: 1.5rem; }
:where(.${i.slash}) { margin-inline: 0.125rem; }
:where(.${i.luma}) { width: 100%; }
:where(.${i.ranges}) { margin-top: 0.75rem; border-top: 1px solid ${e.borderSubtle}; padding-top: 0.75rem; }
:where(.${i.ranges} > :not(:last-child)) { margin-block: 0 0.125rem; }
html.sl-larger-text .${i.values} { font-size: 11px !important; }
html.sl-larger-text .${i.wheelLabel} { font-size: 12px !important; }
`;
}
//#endregion
//#region src/ColorGradingPanel.tsx
function o(e, t, n) {
	return n < 0 && (n += 1), n > 1 && --n, n < 1 / 6 ? e + (t - e) * 6 * n : n < 1 / 2 ? t : n < 2 / 3 ? e + (t - e) * (2 / 3 - n) * 6 : e;
}
function s(e, t, n) {
	if (t === 0) {
		let e = Math.round(n * 255);
		return [
			e,
			e,
			e
		];
	}
	let r = n < .5 ? n * (1 + t) : n + t - n * t, i = 2 * n - r;
	return [
		Math.round(o(i, r, e + 1 / 3) * 255),
		Math.round(o(i, r, e) * 255),
		Math.round(o(i, r, e - 1 / 3) * 255)
	];
}
var c = 112, l = c / 2 - 3, u = .25;
function d({ label: n, range: r, lightness: a, onChange: o, onCommit: d }) {
	let { Slider: f } = t.components, p = e.useRef(null), m = e.useRef(null), h = e.useRef(1), g = e.useRef(!1), _ = e.useRef(null);
	e.useEffect(() => {
		let e = p.current;
		if (!e) return;
		let t = window.devicePixelRatio || 1;
		h.current = t;
		let n = Math.round(c * t), r = l * t;
		e.width = n, e.height = n;
		let i = document.createElement("canvas");
		i.width = n, i.height = n;
		let o = i.getContext("2d"), u = o.createImageData(n, n), d = n / 2, f = n / 2;
		for (let e = 0; e < n; e++) for (let t = 0; t < n; t++) {
			let i = t - d, o = e - f, c = Math.sqrt(i * i + o * o);
			if (c > r + 1) continue;
			let l = (Math.atan2(o, i) * 180 / Math.PI + 360) % 360, p = Math.min(c / r, 1), [m, h, g] = s(l / 360, p, a), _ = Math.min(Math.max(r - c + 1, 0), 1), v = (e * n + t) * 4;
			u.data[v] = m, u.data[v + 1] = h, u.data[v + 2] = g, u.data[v + 3] = Math.round(_ * 255);
		}
		o.putImageData(u, 0, 0), m.current = i;
		let g = e.getContext("2d");
		g.clearRect(0, 0, n, n), g.drawImage(i, 0, 0);
	}, [a]), e.useEffect(() => {
		let e = p.current;
		if (!e || !m.current) return;
		let t = e.getContext("2d");
		if (!t) return;
		let n = h.current, i = Math.round(c * n);
		t.clearRect(0, 0, i, i), t.drawImage(m.current, 0, 0), t.save(), t.setTransform(n, 0, 0, n, 0, 0);
		let a = c / 2, o = c / 2;
		t.beginPath(), t.arc(a, o, l, 0, 2 * Math.PI), t.strokeStyle = "rgba(0,0,0,0.4)", t.lineWidth = 1, t.stroke();
		let s = r.hue * Math.PI / 180, u = a + r.sat / 100 * l * Math.cos(s), d = o + r.sat / 100 * l * Math.sin(s);
		t.beginPath(), t.arc(u, d, 5, 0, 2 * Math.PI), t.fillStyle = "white", t.fill(), t.beginPath(), t.arc(u, d, 3, 0, 2 * Math.PI), t.fillStyle = "rgba(0,0,0,0.6)", t.fill(), t.restore();
	}, [r.hue, r.sat]);
	let v = (e) => {
		let t = e.currentTarget.getBoundingClientRect();
		return {
			rx: (e.clientX - t.left) * (c / t.width) - c / 2,
			ry: (e.clientY - t.top) * (c / t.height) - c / 2
		};
	}, y = () => {
		let e = r.sat / 100 * l, t = r.hue * Math.PI / 180;
		return {
			vx: Math.cos(t) * e,
			vy: Math.sin(t) * e
		};
	}, b = (e, t) => {
		let n = Math.sqrt(e * e + t * t);
		o({
			hue: (Math.atan2(t, e) * 180 / Math.PI + 360) % 360,
			sat: Math.min(n / l, 1) * 100
		});
	}, x = (e) => {
		if (e.currentTarget.setPointerCapture(e.pointerId), g.current = !0, e.detail > 1) return;
		let { rx: t, ry: n } = v(e), { vx: r, vy: i } = y();
		_.current = {
			rx: t,
			ry: n,
			vx: r,
			vy: i,
			shift: e.shiftKey
		}, e.shiftKey ? b(r, i) : b(t, n);
	}, S = (e) => {
		if (!g.current || !_.current) return;
		let t = _.current, { rx: n, ry: r } = v(e);
		if (e.shiftKey !== t.shift) {
			let i = y();
			t.rx = n, t.ry = r, t.vx = i.vx, t.vy = i.vy, t.shift = e.shiftKey;
		}
		e.shiftKey ? b(t.vx + (n - t.rx) * u, t.vy + (r - t.ry) * u) : b(n, r);
	}, C = (e) => {
		g.current && (g.current = !1, _.current = null, !(e.detail > 1) && d(n));
	}, w = () => {
		o({
			hue: 0,
			sat: 0
		}), d(n);
	}, [T, E] = e.useState(null), [D, O] = e.useState(null);
	return /* @__PURE__ */ e.createElement("div", { className: i.wheel }, /* @__PURE__ */ e.createElement("span", { className: i.wheelLabel }, n), /* @__PURE__ */ e.createElement("canvas", {
		ref: p,
		width: c,
		height: c,
		style: {
			width: c,
			height: c,
			borderRadius: "50%",
			cursor: "crosshair"
		},
		onPointerDown: x,
		onPointerMove: S,
		onPointerUp: C,
		onPointerCancel: C,
		onDoubleClick: w,
		title: `${n} colour wheel — drag to set hue & saturation, hold Shift for precise control, double-click to reset`
	}), /* @__PURE__ */ e.createElement("div", { className: i.values }, /* @__PURE__ */ e.createElement("input", {
		type: "text",
		inputMode: "decimal",
		value: T ?? String(Math.round(r.hue)),
		onFocus: () => E(String(Math.round(r.hue))),
		onChange: (e) => {
			E(e.target.value);
			let t = Number(e.target.value);
			e.target.value.trim() !== "" && Number.isFinite(t) && o({ hue: (t % 360 + 360) % 360 });
		},
		onBlur: () => {
			E(null), d(n);
		},
		className: `${i.value} ${i.hue}`
	}), /* @__PURE__ */ e.createElement("span", null, "°"), /* @__PURE__ */ e.createElement("span", { className: i.slash }, "/"), /* @__PURE__ */ e.createElement("input", {
		type: "text",
		inputMode: "decimal",
		value: D ?? String(Math.round(r.sat)),
		onFocus: () => O(String(Math.round(r.sat))),
		onChange: (e) => {
			O(e.target.value);
			let t = Number(e.target.value);
			e.target.value.trim() !== "" && Number.isFinite(t) && o({ sat: Math.max(0, Math.min(100, t)) });
		},
		onBlur: () => {
			O(null), d(n);
		},
		className: `${i.value} ${i.sat}`
	})), /* @__PURE__ */ e.createElement("div", { className: i.luma }, /* @__PURE__ */ e.createElement(f, {
		label: "",
		compact: !0,
		value: r.luma,
		min: -100,
		max: 100,
		step: 1,
		defaultValue: 0,
		onChange: (e) => o({ luma: e }),
		onCommit: () => d(n)
	})));
}
function f() {
	let { Panel: n, Slider: r } = t.components, a = t.stores.useDevelopStore, o = a((e) => e.params), s = a((e) => e.setParam), c = a((e) => e.commitEdit), l = o.colorGrading, u = e.useCallback((e, t) => {
		s("colorGrading", {
			...l,
			[e]: {
				...l[e],
				...t
			}
		});
	}, [l, s]), f = e.useCallback((e) => c(`Colour Grading – ${e}`), [c]);
	return /* @__PURE__ */ e.createElement(n, {
		title: "Colour Grading",
		defaultOpen: !1
	}, /* @__PURE__ */ e.createElement("div", { className: i.wheels }, /* @__PURE__ */ e.createElement(d, {
		label: "Shadows",
		lightness: .35,
		range: l.shadows,
		onChange: (e) => u("shadows", e),
		onCommit: f
	}), /* @__PURE__ */ e.createElement(d, {
		label: "Midtones",
		lightness: .5,
		range: l.midtones,
		onChange: (e) => u("midtones", e),
		onCommit: f
	}), /* @__PURE__ */ e.createElement(d, {
		label: "Highlights",
		lightness: .65,
		range: l.highlights,
		onChange: (e) => u("highlights", e),
		onCommit: f
	}), /* @__PURE__ */ e.createElement(d, {
		label: "Global",
		lightness: .5,
		range: l.global,
		onChange: (e) => u("global", e),
		onCommit: f
	})), /* @__PURE__ */ e.createElement("div", { className: i.ranges }, /* @__PURE__ */ e.createElement(r, {
		label: "Shadow Range",
		value: l.shadowRange,
		min: 0,
		max: 100,
		step: 1,
		defaultValue: 50,
		onChange: (e) => s("colorGrading", {
			...l,
			shadowRange: e
		}),
		onCommit: () => c("Colour Grading – Shadow Range")
	}), /* @__PURE__ */ e.createElement(r, {
		label: "Highlight Range",
		value: l.highlightRange,
		min: 0,
		max: 100,
		step: 1,
		defaultValue: 50,
		onChange: (e) => s("colorGrading", {
			...l,
			highlightRange: e
		}),
		onCommit: () => c("Colour Grading – Highlight Range")
	})));
}
//#endregion
//#region src/stages.ts
var p = "safelight.color-grading.grade", m = [
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
	"uCGHighlightRange"
].map((e) => ({
	key: e,
	glslType: "float",
	default: 0
})), h = "// Convert hue+sat to a neutral-axis RGB color offset (equilateral triangle projection).\n// The three cosines are 120° apart so they always sum to zero — no net luminance shift.\nvec3 cgWheelRGB(float hueDeg, float satPct) {\n  if (satPct < 0.001) return vec3(0.0);\n  float rad = hueDeg * 3.14159265358979 / 180.0;\n  float s = satPct / 100.0 * 0.15; // max ±15% per channel at full saturation\n  return vec3(\n    cos(rad),\n    cos(rad - 2.09439510239320), // 2π/3\n    cos(rad - 4.18879020478640)  // 4π/3\n  ) * s;\n}\n\nvec3 applyColorGrading(vec3 c) {\n  float l = luma(c);\n  // Shadow weight: peaks at black, falls off toward midtones.\n  float shRange = max(uCGShadowRange, 0.05);\n  float hiRange = max(uCGHighlightRange, 0.05);\n  float shadowW    = 1.0 - smoothstep(0.0, shRange, l);\n  shadowW          = shadowW * shadowW;\n  float highlightW = smoothstep(1.0 - hiRange, 1.0, l);\n  highlightW       = highlightW * highlightW;\n  float midW       = clamp(1.0 - shadowW - highlightW, 0.0, 1.0);\n\n  vec3 shColor  = cgWheelRGB(uCGShadowHue,  uCGShadowSat);\n  vec3 midColor = cgWheelRGB(uCGMidHue,     uCGMidSat);\n  vec3 hiColor  = cgWheelRGB(uCGHighHue,    uCGHighSat);\n  vec3 glColor  = cgWheelRGB(uCGGlobalHue,  uCGGlobalSat);\n\n  vec3 colorOffset = shadowW    * shColor\n                   + midW       * midColor\n                   + highlightW * hiColor\n                   + glColor;  // global applied uniformly\n  // Strip any net luminance the (weight-blended) offset introduced. cgWheelRGB is\n  // luma-neutral per range, but the per-pixel weighting is not, so without this the\n  // tint lifts/drops tones and washes out contrast/detail. Removing the luma term\n  // keeps the change purely chromatic — color shifts, tonal structure is untouched.\n  colorOffset -= vec3(luma(colorOffset));\n  c += colorOffset;\n\n  // Per-range luminance adjustments, scaled so ±100 → ±0.25 exposure-equivalent.\n  float lumaAdj = shadowW    * (uCGShadowLuma / 100.0) * 0.25\n                + midW       * (uCGMidLuma    / 100.0) * 0.25\n                + highlightW * (uCGHighLuma   / 100.0) * 0.25\n                + (uCGGlobalLuma / 100.0) * 0.25;\n  c += vec3(lumaAdj);\n\n  return clamp(c, 0.0, 1.0);\n}";
function g(e) {
	return [
		e.shadows,
		e.midtones,
		e.highlights,
		e.global
	].every((e) => e.sat < .001 && e.luma === 0);
}
var _ = (e) => ({
	uCGShadowHue: e.shadows.hue,
	uCGShadowSat: e.shadows.sat,
	uCGShadowLuma: e.shadows.luma,
	uCGMidHue: e.midtones.hue,
	uCGMidSat: e.midtones.sat,
	uCGMidLuma: e.midtones.luma,
	uCGHighHue: e.highlights.hue,
	uCGHighSat: e.highlights.sat,
	uCGHighLuma: e.highlights.luma,
	uCGGlobalHue: e.global.hue,
	uCGGlobalSat: e.global.sat,
	uCGGlobalLuma: e.global.luma,
	uCGShadowRange: e.shadowRange / 100,
	uCGHighlightRange: e.highlightRange / 100
});
function v(e) {
	let t = {
		id: p,
		name: "Colour Grading",
		phase: "display-adjust",
		anchor: "color-grading"
	};
	return e === 1 ? {
		...t,
		glsl: "c = applyColorGrading(c);",
		helpers: h,
		uniforms: m,
		derive: ({ colorGrading: e }) => _(e)
	} : {
		...t,
		glsl: "if (uColorGradingActive) c = applyColorGrading(clamp(c, 0.0, 1.0));",
		helpers: h,
		uniforms: [...m, {
			key: "uColorGradingActive",
			glslType: "bool",
			default: !1
		}],
		derive: ({ colorGrading: e }) => ({
			..._(e),
			uColorGradingActive: !g(e)
		})
	};
}
//#endregion
//#region src/index.tsx
var y = "core.color-grading", b = "safelight.color-grading.styles", x = 3;
function S(e) {
	n(e), e.registerStylesheet({
		id: b,
		css: a(e.ui.tokens)
	}), e.registerProcessingStage(v(3)), e.registerPanel({
		id: y,
		title: "Colour Grading",
		component: f,
		defaultDock: {
			module: "develop",
			direction: "right",
			order: 7,
			width: 280,
			height: 200
		},
		onReset: () => void e.stores.useDevelopStore.getState().resetParams(["colorGrading"], "Reset Colour Grading")
	});
}
//#endregion
export { x as LINE, y as PANEL_ID, b as STYLESHEET_ID, S as activate };

//# sourceMappingURL=index.js.map