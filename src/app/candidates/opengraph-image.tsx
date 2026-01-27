import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt = "Candidates - dcbuilder.eth";
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
						"radial-gradient(circle at 50% 100%, #2e1a2e 0%, #0a0a0a 50%)",
				}}
			>
				<div style={{ fontSize: 80, marginBottom: 24 }}>🧑‍💻</div>
				<div
					style={{
						fontSize: 72,
						fontWeight: 700,
						color: "#ffffff",
						marginBottom: 16,
					}}
				>
					Candidates
				</div>
				<div style={{ fontSize: 32, color: "#a0a0a0" }}>
					dcbuilder.eth
				</div>
				<div
					style={{
						fontSize: 24,
						color: "#666",
						marginTop: 32,
						textAlign: "center",
						maxWidth: 700,
					}}
				>
					Talented builders looking for new opportunities
				</div>
			</div>
		),
		{ ...size }
	);
}
