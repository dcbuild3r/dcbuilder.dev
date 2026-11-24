// The hero figure: a loss surface and the gradient-descent path across it.
// Pure geometry and drawing. The canvas (site) and SVG (social card) pens live with their callers.

export interface Pen {
	line(
		x1: number,
		y1: number,
		x2: number,
		y2: number,
		width: number,
		color: string,
		alpha: number,
	): void;
	dot(x: number, y: number, r: number, color: string, alpha: number): void;
	text(s: string, x: number, y: number, size: number, color: string): void;
}

export const LABEL_FONT =
	"'Berkeley Mono', 'JetBrains Mono', ui-monospace, monospace";
export const REST_ROT = 0.55;

type Rgb = readonly [number, number, number];

const toLinear = (c: number) =>
	c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
const toSrgb = (c: number) =>
	Math.round(
		255 *
			Math.min(
				1,
				Math.max(
					0,
					c <= 0.0031308 ? c * 12.92 : 1.055 * c ** (1 / 2.4) - 0.055,
				),
			),
	);
const rgb = (hex: string): Rgb => [
	toLinear(Number.parseInt(hex.slice(1, 3), 16) / 255),
	toLinear(Number.parseInt(hex.slice(3, 5), 16) / 255),
	toLinear(Number.parseInt(hex.slice(5, 7), 16) / 255),
];
// Colours mix in linear light, which is what keeps the yellow band from going muddy.
const mix = (a: Rgb, b: Rgb, t: number): Rgb => [
	a[0] + (b[0] - a[0]) * t,
	a[1] + (b[1] - a[1]) * t,
	a[2] + (b[2] - a[2]) * t,
];
const css = (c: Rgb) => `rgb(${toSrgb(c[0])},${toSrgb(c[1])},${toSrgb(c[2])})`;

const GREEN = rgb("#28d75f");
const YELLOW = rgb("#f4ca4f");
const RED = rgb("#ff4d3d");
const CYAN = rgb("#18e8ff");
const VIOLET = rgb("#9b7cff");
const WHITE = rgb("#f4f3ee");

export const STEPS = 18;
export const LEARNING_RATE = 0.18;
const THETA2 = 0.3;
const THETA3 = -0.35;

export const loss = (a: number, b: number, c: number) =>
	0.32 * (a - 0.35) ** 2 +
	0.14 * (b + 0.35) ** 2 +
	0.06 * (c - 0.15) ** 2 +
	0.1 * Math.sin(1.6 * a + b) +
	0.06 * Math.cos(1.2 * b - c);
const dLossDa = (a: number, b: number) =>
	0.64 * (a - 0.35) + 0.16 * Math.cos(1.6 * a + b);

function buildSurface() {
	const world: number[] = [];
	const add = (a: number, b: number) =>
		world.push(a * 1.32, loss(a, b, THETA3) * 1.28 - 1.15, b * 1.32) / 3 - 1;
	const at = (i: number, of: number, min: number, max: number) =>
		min + ((max - min) * i) / of;

	// Grid polylines as [first point, point count].
	const lines: [number, number][] = [];
	for (let x = 0; x <= 42; x += 3) {
		lines.push([world.length / 3, 31]);
		for (let z = 0; z <= 30; z++)
			add(at(x, 42, -2.4, 2.2), at(z, 30, -1.5, 1.45));
	}
	for (let z = 0; z <= 30; z += 3) {
		lines.push([world.length / 3, 43]);
		for (let x = 0; x <= 42; x++)
			add(at(x, 42, -2.4, 2.2), at(z, 30, -1.5, 1.45));
	}

	let minY = Number.POSITIVE_INFINITY;
	let maxY = Number.NEGATIVE_INFINITY;
	for (let i = 1; i < world.length; i += 3) {
		minY = Math.min(minY, world[i]);
		maxY = Math.max(maxY, world[i]);
	}

	const path = world.length / 3;
	const losses: number[] = [];
	let theta = -2.05;
	for (let i = 0; i < STEPS; i++) {
		add(theta, THETA2);
		losses.push(loss(theta, THETA2, THETA3));
		theta -= LEARNING_RATE * dLossDa(theta, THETA2);
	}
	// The point under the start of the path, where the dashed riser begins.
	const base =
		world.push(world[path * 3], minY - 0.35, world[path * 3 + 2]) / 3 - 1;

	const heat = (y: number) => {
		const t = (y - minY) / (maxY - minY);
		return t < 0.5
			? mix(GREEN, YELLOW, t / 0.5)
			: mix(YELLOW, RED, (t - 0.5) / 0.5);
	};
	const y = (i: number) => world[i * 3 + 1];
	// Colour of the segment from point i to i + 1, and of point i itself.
	const segmentHeat = Array.from({ length: world.length / 3 - 1 }, (_, i) =>
		heat((y(i) + y(i + 1)) / 2),
	);
	const riserHeat = Array.from({ length: 13 }, (_, i) =>
		css(heat(y(base) + (y(path) - y(base)) * ((i + 0.02) / 13))),
	);

	return {
		world: Float64Array.from(world),
		lines,
		path,
		base,
		losses,
		segmentHeat,
		segmentColor: segmentHeat.map(css),
		pointColor: Array.from({ length: world.length / 3 }, (_, i) =>
			css(heat(y(i))),
		),
		riserHeat,
	};
}

export const SURFACE = buildSurface();
const S = SURFACE;
const screen = new Float64Array((S.world.length / 3) * 2);

// Camera at (0.2, 7, 8.8) looking at the origin, orthographic.
const cam = (() => {
	const l = Math.hypot(0.2, 7, 8.8);
	const z = [0.2 / l, 7 / l, 8.8 / l];
	const xl = Math.hypot(z[2], z[0]);
	const x = [z[2] / xl, 0, -z[0] / xl];
	return {
		x,
		y: [
			z[1] * x[2] - z[2] * x[1],
			z[2] * x[0] - z[0] * x[2],
			z[0] * x[1] - z[1] * x[0],
		],
	};
})();
const TILT_X = -0.68;
const TILT_Z = -0.08;

/** Projects every point into `screen`, centred on (cx, cy). The projection is affine, so points between two projected points can be interpolated on screen. */
function project(rot: number, ppu: number, cx: number, cy: number) {
	const cosX = Math.cos(TILT_X);
	const sinX = Math.sin(TILT_X);
	const cosY = Math.cos(rot);
	const sinY = Math.sin(rot);
	const cosZ = Math.cos(TILT_Z);
	const sinZ = Math.sin(TILT_Z);
	let x0 = Number.POSITIVE_INFINITY;
	let x1 = Number.NEGATIVE_INFINITY;
	let y0 = Number.POSITIVE_INFINITY;
	let y1 = Number.NEGATIVE_INFINITY;
	for (let i = 0, o = 0; i < S.world.length; i += 3, o += 2) {
		const px = S.world[i] * cosZ - S.world[i + 1] * sinZ;
		const py = S.world[i] * sinZ + S.world[i + 1] * cosZ;
		const rx = px * cosY + S.world[i + 2] * sinY;
		const pz = -px * sinY + S.world[i + 2] * cosY;
		const ry = py * cosX - pz * sinX;
		const rz = py * sinX + pz * cosX;
		const sx = (rx * cam.x[0] + ry * cam.x[1] + rz * cam.x[2]) * ppu;
		const sy = -(rx * cam.y[0] + ry * cam.y[1] + rz * cam.y[2]) * ppu;
		screen[o] = sx;
		screen[o + 1] = sy;
		x0 = Math.min(x0, sx);
		x1 = Math.max(x1, sx);
		y0 = Math.min(y0, sy);
		y1 = Math.max(y1, sy);
	}
	const dx = cx - (x0 + x1) / 2;
	const dy = cy - (y0 + y1) / 2;
	for (let o = 0; o < screen.length; o += 2) {
		screen[o] += dx;
		screen[o + 1] += dy;
	}
}

const X = (i: number) => screen[i * 2];
const Y = (i: number) => screen[i * 2 + 1];
const segment = (
	pen: Pen,
	i: number,
	width: number,
	color: string,
	alpha: number,
) => pen.line(X(i), Y(i), X(i + 1), Y(i + 1), width, color, alpha);

function drawGrid(pen: Pen, width: number) {
	for (const [first, count] of S.lines)
		for (let i = first; i < first + count - 1; i++)
			segment(pen, i, width, S.segmentColor[i], 0.86);
}

// Monospace advance, so label clamping needs no text measurement.
const textWidth = (s: string, size: number) => s.length * size * 0.6;

export type HeroView = {
	w: number;
	h: number;
	rot: number;
	/** Milliseconds driving the travelling highlight, or null for a still frame. */
	t: number | null;
};

export function drawHero(pen: Pen, { w, h, rot, t }: HeroView) {
	const compact = w < 520;
	project(
		rot,
		Math.min(h / 8.6, w / 7.8),
		w * (compact ? 0.5 : 0.54),
		h * 0.47,
	);
	drawGrid(pen, 1.15);

	const p = S.path;
	const last = STEPS - 1;
	for (let i = 0; i < 13; i++) {
		const a = i / 13;
		const b = a + 0.04;
		const lerp = (from: number, to: number, k: number) =>
			from + (to - from) * k;
		pen.line(
			lerp(X(S.base), X(p), a),
			lerp(Y(S.base), Y(p), a),
			lerp(X(S.base), X(p), b),
			lerp(Y(S.base), Y(p), b),
			1.25,
			S.riserHeat[i],
			0.9,
		);
	}
	for (let i = 0; i < last; i++)
		segment(pen, p + i, 2.8, S.segmentColor[p + i], 0.95);

	const active = t === null ? -1 : Math.floor(t * 0.004) % STEPS;
	if (t !== null) {
		const head = (t * 0.00036) % 1;
		for (let i = 0; i < last; i++) {
			const progress = i / (last - 1);
			const gap = Math.abs(progress - head);
			const pulse = Math.max(0, 1 - Math.min(gap, 1 - gap) / 0.22);
			const age = active - i;
			const glow = Math.max(pulse, age >= 0 && age < 5 ? 0.85 - age * 0.12 : 0);
			if (glow > 0.02)
				segment(
					pen,
					p + i,
					4.8,
					css(mix(mix(CYAN, VIOLET, progress), WHITE, glow * 0.65)),
					glow,
				);
		}
	}
	for (let i = 0; i < STEPS; i++) {
		const end = i === 0 || i === last;
		if (i === active) pen.dot(X(p + i), Y(p + i), 7.4, css(WHITE), 1);
		else {
			const passed = t === null || active >= i || (active < 3 && i > last - 3);
			const color =
				i === 0 ? css(RED) : i === last ? css(GREEN) : S.pointColor[p + i];
			pen.dot(X(p + i), Y(p + i), end ? 5.9 : 4.4, color, passed ? 0.88 : 0.24);
		}
	}

	const size = compact ? 12 : 14;
	const label = (
		s: string,
		at: number,
		dx: number,
		dy: number,
		color: string,
	) =>
		pen.text(
			s,
			Math.max(8, Math.min(w - textWidth(s, size) - 8, X(at) + dx)),
			Math.max(8, Math.min(h - 56, Y(at) + dy)),
			size,
			color,
		);
	label(
		"WHERE YOU ARE",
		p,
		compact ? -58 : -118,
		compact ? -42 : -56,
		"#ff6f54",
	);
	label(
		"ALL YOU NEED IS CONVERGENCE",
		p + Math.floor(STEPS * 0.36),
		compact ? -42 : -230,
		compact ? -48 : -72,
		"#e9c15f",
	);
	label(
		"WHERE YOU WANT TO BE",
		p + last,
		compact ? -118 : 34,
		compact ? -26 : 12,
		"#91f27f",
	);
}

/** The still figure for the home social card. */
export function drawCard(pen: Pen, { w, h }: { w: number; h: number }) {
	project(REST_ROT, 84, w * 0.56, h * 0.5);
	drawGrid(pen, 1.4);
	const p = S.path;
	const last = STEPS - 1;
	for (let i = 0; i < last; i++)
		segment(pen, p + i, 4, css(mix(S.segmentHeat[p + i], WHITE, 0.35)), 1);
	for (let i = 0; i < STEPS; i++) {
		const end = i === 0 || i === last;
		const color =
			i === 0 ? css(RED) : i === last ? css(WHITE) : S.pointColor[p + i];
		pen.dot(X(p + i), Y(p + i), end ? 9 : 5, color, 1);
	}
	pen.text("WHERE YOU ARE", X(p) - 70, Y(p) - 44, 17, "#ff6f54");
	pen.text(
		"WHERE YOU WANT TO BE",
		X(p + last) - 96,
		Y(p + last) + 26,
		17,
		"#91f27f",
	);
}
