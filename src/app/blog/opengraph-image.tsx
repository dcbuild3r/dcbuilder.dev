import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt = "Blog | dcbuilder.eth";
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
						"radial-gradient(circle at 50% 0%, #1a1a2e 0%, #0a0a0a 50%)",
				}}
			>
				{/* Icon */}
				<div
					style={{
						fontSize: 100,
						marginBottom: 32,
					}}
				>
					📝
				</div>

				{/* Title */}
				<div
					style={{
						fontSize: 84,
						fontWeight: 700,
						color: "#ffffff",
						marginBottom: 20,
					}}
				>
					Blog | dcbuilder.eth
				</div>

				{/* Description */}
				<div
					style={{
						fontSize: 36,
						color: "#ddd",
						marginTop: 36,
						textAlign: "center",
						maxWidth: 800,
					}}
				>
					Thoughts on cryptography, distributed systems, and building the future
				</div>
			</div>
		),
		{
			...size,
		}
	);
}
