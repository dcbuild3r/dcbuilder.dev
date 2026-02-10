import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt = "About | dcbuilder.eth";
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
						"radial-gradient(circle at 50% 20%, #1a2636 0%, #0a0a0a 55%)",
				}}
			>
				<div
					style={{
						width: 220,
						height: 220,
						borderRadius: "50%",
						overflow: "hidden",
						border: "4px solid #2a2a2a",
						marginBottom: 32,
						display: "flex",
					}}
				>
					<img
						src="https://pub-a22f31a467534add843b6cf22cf4f443.r2.dev/dcbuilder.png"
						alt="dcbuilder"
						width={220}
						height={220}
						style={{ objectFit: "cover" }}
					/>
				</div>

				<div
					style={{
						fontSize: 84,
						fontWeight: 700,
						color: "#ffffff",
						marginBottom: 18,
						textAlign: "center",
					}}
				>
					About | dcbuilder.eth
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
					Affiliations, background, and what I am building toward
				</div>
			</div>
		),
		{ ...size }
	);
}

