import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt = "News | dcbuilder.eth";
export const size = {
	width: 1200,
	height: 630,
};
export const contentType = "image/png";

export default async function Image() {
	return new ImageResponse(
		(
			<div
				style={{
					height: "100%",
					width: "100%",
					display: "flex",
					flexDirection: "column",
					alignItems: "center",
					justifyContent: "center",
					backgroundColor: "#0a0a0a",
					backgroundImage:
						"radial-gradient(circle at 50% 100%, #2a1a2e 0%, #0a0a0a 55%)",
				}}
			>
				<div style={{ fontSize: 100, marginBottom: 32 }}>📰</div>

				<div
					style={{
						fontSize: 84,
						fontWeight: 700,
						color: "#ffffff",
						marginBottom: 18,
						textAlign: "center",
					}}
				>
					News | dcbuilder.eth
				</div>

				<div
					style={{
						fontSize: 36,
						color: "#ddd",
						textAlign: "center",
						maxWidth: 900,
						lineHeight: 1.25,
					}}
				>
					Curated links, blog posts, and portfolio announcements
				</div>
			</div>
		),
		{ ...size }
	);
}

