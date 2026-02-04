import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt = "dcbuilder.eth - Research, Engineering, Angel Investing";
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
						"radial-gradient(circle at 25% 25%, #1a1a2e 0%, #0a0a0a 50%)",
				}}
			>
				{/* Profile Image Circle */}
				<div
					style={{
						width: 240,
						height: 240,
						borderRadius: "50%",
						overflow: "hidden",
						border: "4px solid #333",
						marginBottom: 36,
						display: "flex",
					}}
				>
					<img
						src="https://pub-a22f31a467534add843b6cf22cf4f443.r2.dev/dcbuilder.png"
						alt="dcbuilder"
						width={240}
						height={240}
						style={{ objectFit: "cover" }}
					/>
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
					dcbuilder.eth
				</div>

				{/* Subtitle */}
				<div
					style={{
						fontSize: 38,
						color: "#ddd",
						textAlign: "center",
						maxWidth: 900,
					}}
				>
					Research • Engineering • Angel Investing
				</div>

				{/* Topics */}
				<div
					style={{
						display: "flex",
						gap: 18,
						marginTop: 36,
					}}
				>
					{["Cryptography", "Distributed Systems", "AI"].map((topic) => (
						<div
							key={topic}
							style={{
								padding: "16px 36px",
								borderRadius: 32,
								backgroundColor: "#1a1a2e",
								color: "#ddd",
								fontSize: 32,
							}}
						>
							{topic}
						</div>
					))}
				</div>
			</div>
		),
		{
			...size,
		}
	);
}
