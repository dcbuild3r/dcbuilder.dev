import { ImageResponse } from "next/og";
import { db, candidates, candidateRedirects } from "@/db";
import { eq } from "drizzle-orm";

export const runtime = "nodejs";

export const alt = "Candidate";
export const size = {
	width: 1200,
	height: 630,
};
export const contentType = "image/png";

interface Props {
	params: Promise<{ id: string }>;
}

async function getCandidate(id: string) {
	let [candidate] = await db
		.select()
		.from(candidates)
		.where(eq(candidates.id, id))
		.limit(1);

	// Check for redirect if not found
	if (!candidate) {
		const [redirectEntry] = await db
			.select()
			.from(candidateRedirects)
			.where(eq(candidateRedirects.oldId, id))
			.limit(1);

		if (redirectEntry) {
			[candidate] = await db
				.select()
				.from(candidates)
				.where(eq(candidates.id, redirectEntry.newId))
				.limit(1);
		}
	}

	return candidate;
}

export default async function Image({ params }: Props) {
	const { id } = await params;
	const candidate = await getCandidate(id);

	const name = candidate?.name || "Candidate";
	const title = candidate?.title || "";
	const skills = candidate?.skills?.slice(0, 5) || [];
	const image = candidate?.image;

	return new ImageResponse(
		(
			<div
				style={{
					height: "100%",
					width: "100%",
					display: "flex",
					flexDirection: "column",
					justifyContent: "space-between",
					backgroundColor: "#0a0a0a",
					backgroundImage:
						"radial-gradient(circle at 80% 20%, #2e1a2e 0%, #0a0a0a 40%)",
					padding: 60,
				}}
			>
				{/* Top: Site branding */}
				<div style={{ display: "flex", alignItems: "center", gap: 16 }}>
					<div
						style={{
							width: 48,
							height: 48,
							borderRadius: "50%",
							overflow: "hidden",
							display: "flex",
						}}
					>
						<img
							src="https://pub-a22f31a467534add843b6cf22cf4f443.r2.dev/dcbuilder.png"
							alt="dcbuilder"
							width={48}
							height={48}
							style={{ objectFit: "cover" }}
						/>
					</div>
					<div style={{ display: "flex", flexDirection: "column" }}>
						<span style={{ color: "#ffffff", fontSize: 20, fontWeight: 600 }}>
							dcbuilder.eth
						</span>
						<span style={{ color: "#666", fontSize: 16 }}>Candidates</span>
					</div>
				</div>

				{/* Middle: Candidate info */}
				<div
					style={{
						display: "flex",
						alignItems: "center",
						gap: 40,
					}}
				>
					{/* Candidate image */}
					{image ? (
						<div
							style={{
								width: 180,
								height: 180,
								borderRadius: "50%",
								overflow: "hidden",
								display: "flex",
								border: "4px solid #333",
								flexShrink: 0,
							}}
						>
							<img
								src={image}
								alt={name}
								width={180}
								height={180}
								style={{ objectFit: "cover" }}
							/>
						</div>
					) : (
						<div
							style={{
								width: 180,
								height: 180,
								borderRadius: "50%",
								backgroundColor: "#1a1a2e",
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								fontSize: 72,
								flexShrink: 0,
							}}
						>
							👤
						</div>
					)}

					{/* Name and title */}
					<div
						style={{
							display: "flex",
							flexDirection: "column",
							gap: 12,
						}}
					>
						<div
							style={{
								fontSize: name.length > 20 ? 48 : 56,
								fontWeight: 700,
								color: "#ffffff",
								lineHeight: 1.1,
							}}
						>
							{name}
						</div>
						{title && (
							<div
								style={{
									fontSize: 28,
									color: "#a855f7",
									lineHeight: 1.2,
									maxWidth: 700,
								}}
							>
								{title}
							</div>
						)}
					</div>
				</div>

				{/* Bottom: Skills */}
				<div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
					{skills.map((skill) => (
						<div
							key={skill}
							style={{
								padding: "8px 20px",
								borderRadius: 20,
								backgroundColor: "#1a1a2e",
								color: "#888",
								fontSize: 18,
							}}
						>
							{skill}
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
