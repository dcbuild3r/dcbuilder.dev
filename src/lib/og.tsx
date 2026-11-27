import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = "image/png";

export type OgBadge = "Hot" | "Featured" | "New";

export type OgSpec =
	| { kind: "site" }
	| { kind: "section"; eyebrow: string; title: string; description?: string }
	| { kind: "post"; title: string; description?: string; date: string; readingMinutes?: number }
	| {
			kind: "job";
			title: string;
			company: string;
			logoUrl?: string;
			meta: string[];
			tags: string[];
			badges: OgBadge[];
			affiliation: string;
	  }
	| {
			kind: "candidate";
			name: string;
			title: string;
			imageUrl?: string;
			meta: string[];
			skills: string[];
			badges: string[];
	  };

const ASSETS = join(process.cwd(), "src/assets/og");
const INK = "#0a0a0a";
const SOFT = "#404040";
const EYEBROW = "#5c5c5c";
const TEAL = "#2563eb";
const LINE = "#e5e5e5";
const NEUTRAL = { background: "#f5f5f5", color: INK };
const MONO = "'JetBrains Mono'";

const memo = new Map<string, Promise<Buffer>>();
function asset(name: string) {
	let hit = memo.get(name);
	if (!hit) {
		hit = readFile(join(ASSETS, name));
		memo.set(name, hit);
	}
	return hit;
}

async function pngDataUri(name: string) {
	return `data:image/png;base64,${(await asset(name)).toString("base64")}`;
}

const IMAGE_TYPES = ["image/png", "image/jpeg", "image/gif"];

// Satori cannot decode webp/svg and a failed remote fetch would 500 the card, so
// remote images are inlined here and dropped (initial tile) when unusable.
async function inlineImage(url?: string): Promise<string | undefined> {
	if (!url) return undefined;
	try {
		if (url.startsWith("data:")) return url;
		if (url.startsWith("/")) {
			if (url.includes("..")) return undefined;
			const buf = await readFile(join(process.cwd(), "public", url));
			const type = url.endsWith(".png") ? "image/png" : url.match(/\.jpe?g$/) ? "image/jpeg" : undefined;
			return type ? `data:${type};base64,${buf.toString("base64")}` : undefined;
		}
		const res = await fetch(url, { signal: AbortSignal.timeout(4000) });
		const type = res.headers.get("content-type")?.split(";")[0].trim() ?? "";
		if (!res.ok || !IMAGE_TYPES.includes(type)) return undefined;
		return `data:${type};base64,${Buffer.from(await res.arrayBuffer()).toString("base64")}`;
	} catch {
		return undefined;
	}
}

function fonts() {
	return Promise.all([
		asset("Inter-Regular.ttf"),
		asset("Inter-SemiBold.ttf"),
		asset("JetBrainsMono-Medium.ttf"),
	]).then(([regular, semi, mono]) => [
		{ name: "Inter", data: regular, weight: 400 as const, style: "normal" as const },
		{ name: "Inter", data: semi, weight: 600 as const, style: "normal" as const },
		{ name: "JetBrains Mono", data: mono, weight: 500 as const, style: "normal" as const },
	]);
}

const FRAME = {
	width: "100%",
	height: "100%",
	display: "flex",
	flexDirection: "column",
	justifyContent: "space-between",
	padding: 64,
	fontFamily: "Inter",
	color: INK,
} as const;

// White card with the rainbow base stripe.
// The stripe sits outside the padded frame: Satori resolves absolute offsets against the content box.
function Card({ style, children }: { style?: React.CSSProperties; children: React.ReactNode }) {
	return (
		<div style={{ position: "relative", width: "100%", height: "100%", display: "flex", background: "#ffffff", overflow: "hidden" }}>
			<div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 12, display: "flex" }}>
				{["#3b82f6", "#8b5cf6", "#ec4899", "#f97316", "#f59e0b"].map((c) => (
					<div key={c} style={{ flex: 1, background: c }} />
				))}
			</div>
			<div style={{ ...FRAME, ...style }}>{children}</div>
		</div>
	);
}

// Top row shared by every card but the site one: eyebrow left, section mark right.
function TopRow({ eyebrow, avatar, label }: { eyebrow: string; avatar: string; label: string }) {
	return (
		<div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 32 }}>
			<Eyebrow>{eyebrow}</Eyebrow>
			<Mark avatar={avatar} label={label} />
		</div>
	);
}

// Buckets keep long titles inside the 1072px column at the tight tracking used here.
function postTitleSize(len: number) {
	return len <= 28 ? 104 : len <= 44 ? 84 : len <= 70 ? 64 : 52;
}
function nameTitleSize(len: number) {
	return len <= 12 ? 92 : len <= 20 ? 76 : len <= 32 ? 60 : 48;
}

function Eyebrow({ children }: { children: string }) {
	return (
		<div
			style={{
				display: "flex",
				fontFamily: MONO,
				fontSize: 28,
				fontWeight: 500,
				textTransform: "uppercase",
				letterSpacing: "0.14em",
				whiteSpace: "nowrap",
				color: EYEBROW,
			}}
		>
			{children}
		</div>
	);
}

// Section mark: the avatar next to the section name.
function Mark({ avatar, label }: { avatar: string; label: string }) {
	return (
		<div style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 18 }}>
			{/* eslint-disable-next-line @next/next/no-img-element */}
			<img src={avatar} alt="" width={64} height={64} style={{ borderRadius: "50%", objectFit: "cover" }} />
			<div style={{ display: "flex", fontSize: 44, fontWeight: 600, lineHeight: 1, letterSpacing: "-0.035em" }}>{label}</div>
		</div>
	);
}

function Tile({ src, label, round }: { src?: string; label: string; round?: boolean }) {
	const base = { width: 168, height: 168, flexShrink: 0, display: "flex" } as const;
	if (src && round) {
		// eslint-disable-next-line @next/next/no-img-element
		return <img src={src} alt={label} width={168} height={168} style={{ ...base, borderRadius: 84, objectFit: "cover", border: `2px solid ${LINE}` }} />;
	}
	if (src) {
		return (
			<div style={{ ...base, boxSizing: "border-box", borderRadius: 32, border: `1px solid ${LINE}`, background: "#ffffff", padding: 16 }}>
				{/* eslint-disable-next-line @next/next/no-img-element */}
				<img src={src} alt={label} width={136} height={136} style={{ objectFit: "contain", borderRadius: 16 }} />
			</div>
		);
	}
	return (
		<div
			style={{
				...base,
				alignItems: "center",
				justifyContent: "center",
				borderRadius: round ? 84 : 32,
				background: "#f5f5f5",
				border: `1px solid ${LINE}`,
				fontSize: 80,
				fontWeight: 600,
				color: TEAL,
			}}
		>
			{(label.trim().charAt(0) || "?").toUpperCase()}
		</div>
	);
}

function EntityCard(props: {
	eyebrow: string;
	title: string;
	subtitle: string;
	tile: React.ReactNode;
	meta: string[];
	avatar: string;
	label: string;
}) {
	return (
		<Card>
			<TopRow eyebrow={props.eyebrow} avatar={props.avatar} label={props.label} />
			<div style={{ display: "flex", alignItems: "center", gap: 40 }}>
				{props.tile}
				<div style={{ display: "flex", flexDirection: "column", gap: 12, minWidth: 0, maxWidth: 864 }}>
					<div
						style={{
							display: "block",
							lineClamp: 2,
							fontSize: nameTitleSize(props.title.length),
							fontWeight: 600,
							lineHeight: 0.98,
							letterSpacing: "-0.055em",
						}}
					>
						{props.title}
					</div>
					{props.subtitle && (
						<div style={{ display: "block", lineClamp: 1, fontSize: 40, lineHeight: 1.2, color: TEAL }}>
							{props.subtitle}
						</div>
					)}
				</div>
			</div>
			<div style={{ display: "block", lineClamp: 2, minHeight: 48, fontFamily: MONO, fontSize: 36, lineHeight: 1.3, color: SOFT }}>
				{props.meta.join(" · ")}
			</div>
		</Card>
	);
}

function Headline({ title, description }: { title: string; description?: string }) {
	return (
		<div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
			<div
				style={{
					display: "block",
					lineClamp: 3,
					maxWidth: 1000,
					fontSize: postTitleSize(title.length),
					fontWeight: 600,
					lineHeight: 0.96,
					letterSpacing: "-0.06em",
				}}
			>
				{title}
			</div>
			{description && (
				<div style={{ display: "block", lineClamp: 2, maxWidth: 900, fontSize: 30, lineHeight: 1.35, color: SOFT }}>
					{description}
				</div>
			)}
		</div>
	);
}

async function build(spec: OgSpec) {
	const avatar = await pngDataUri("avatar.png");
	switch (spec.kind) {
		case "site": {
			const kaneki = await pngDataUri("kaneki.png");
			return (
				<Card style={{ flexDirection: "row", gap: 48 }}>
					<div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
						<div style={{ display: "flex", alignItems: "center", gap: 20 }}>
							{/* eslint-disable-next-line @next/next/no-img-element */}
							<img src={avatar} alt="" width={72} height={72} style={{ borderRadius: "50%", objectFit: "cover" }} />
							<div style={{ display: "flex", fontFamily: MONO, fontSize: 32, fontWeight: 500, color: EYEBROW }}>dcbuilder.dev</div>
						</div>
						<div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
							<div style={{ display: "flex", fontSize: 86, fontWeight: 600, lineHeight: 0.95, letterSpacing: "-0.055em" }}>
								dcbuilder.eth
							</div>
							<div style={{ display: "flex", gap: 12 }}>
								{["Research", "Engineering", "Angel Investing"].map((label) => (
									<div key={label} style={{ display: "flex", padding: "8px 20px", borderRadius: 999, fontSize: 26, fontWeight: 500, whiteSpace: "nowrap", ...NEUTRAL }}>
										{label}
									</div>
								))}
							</div>
						</div>
					</div>
					<div
						style={{
							flexShrink: 0,
							alignSelf: "center",
							display: "flex",
							boxSizing: "border-box",
							width: 470,
							height: 470,
							padding: 38,
							borderRadius: 235,
							border: `1px solid ${LINE}`,
							background: "#ffffff",
						}}
					>
						{/* eslint-disable-next-line @next/next/no-img-element */}
						<img src={kaneki} alt="" width={392} height={392} style={{ objectFit: "contain" }} />
					</div>
				</Card>
			);
		}
		case "section":
			return (
				<Card>
					<TopRow eyebrow={spec.eyebrow} avatar={avatar} label={spec.eyebrow} />
					<Headline title={spec.title} description={spec.description} />
				</Card>
			);
		case "post": {
			const date = [
				"Blog",
				spec.date,
				spec.readingMinutes ? `${spec.readingMinutes} min read` : "",
			].filter(Boolean).join(" · ");
			return (
				<Card>
					<TopRow eyebrow={date} avatar={avatar} label="Blog" />
					<Headline title={spec.title} description={spec.description} />
				</Card>
			);
		}
		case "job": {
			const logo = await inlineImage(spec.logoUrl);
			return (
				<EntityCard
					eyebrow={`Open role · ${spec.affiliation}`}
					title={spec.title}
					subtitle={spec.company}
					tile={<Tile src={logo} label={spec.company} />}
					meta={spec.meta}
					avatar={avatar}
					label="Jobs"
				/>
			);
		}
		case "candidate": {
			const photo = await inlineImage(spec.imageUrl);
			return (
				<EntityCard
					eyebrow="Candidate"
					title={spec.name}
					subtitle={spec.title}
					tile={<Tile src={photo} label={spec.name} round />}
					meta={spec.meta}
					avatar={avatar}
					label="Candidates"
				/>
			);
		}
	}
}

export async function renderOg(spec: OgSpec) {
	return new ImageResponse(await build(spec), { ...OG_SIZE, fonts: await fonts() });
}
