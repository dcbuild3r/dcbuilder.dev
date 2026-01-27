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
						width: 200,
						height: 200,
						borderRadius: "50%",
						overflow: "hidden",
						border: "4px solid #333",
						marginBottom: 32,
						display: "flex",
					}}
				>
					{/* eslint-disable-next-line @next/next/no-img-element */}
					<img
						src="https://dcbuilder.dev/images/dcbuilder.png"
						alt="dcbuilder"
						width={200}
						height={200}
						style={{ objectFit: "cover" }}
					/>
				</div>

				{/* Title */}
				<div
					style={{
						fontSize: 64,
						fontWeight: 700,
						color: "#ffffff",
						marginBottom: 16,
					}}
				>
					dcbuilder.eth
				</div>

				{/* Subtitle */}
				<div
					style={{
						fontSize: 28,
						color: "#a0a0a0",
						textAlign: "center",
						maxWidth: 800,
					}}
				>
					Research • Engineering • Angel Investing
				</div>

				{/* Topics */}
				<div
					style={{
						display: "flex",
						gap: 16,
						marginTop: 32,
					}}
				>
					{["Cryptography", "Distributed Systems", "AI"].map((topic) => (
						<div
							key={topic}
							style={{
								padding: "8px 20px",
								borderRadius: 20,
								backgroundColor: "#1a1a2e",
								color: "#888",
								fontSize: 18,
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
