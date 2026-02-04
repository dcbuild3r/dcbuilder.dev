import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt = "Jobs | dcbuilder.eth";
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
						"radial-gradient(circle at 50% 100%, #1a2e1a 0%, #0a0a0a 50%)",
				}}
			>
				<div style={{ fontSize: 100, marginBottom: 32 }}>💼</div>
				<div
					style={{
						fontSize: 84,
						fontWeight: 700,
						color: "#ffffff",
						marginBottom: 20,
					}}
				>
					Jobs | dcbuilder.eth
				</div>
				<div
					style={{
						fontSize: 36,
						color: "#ddd",
						marginTop: 36,
						textAlign: "center",
						maxWidth: 800,
					}}
				>
					Opportunities at portfolio companies and crypto network
				</div>
			</div>
		),
		{ ...size }
	);
}
