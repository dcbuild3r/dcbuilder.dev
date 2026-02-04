import { ImageResponse } from "next/og";
import { getCandidateById } from "@/lib/data";

export const runtime = "nodejs";

export const alt = "Candidate";
export const size = {
	width: 1200,
	height: 630,
};
export const contentType = "image/png";

// Skill priority for OG images - lower index = higher priority
// Most relevant/recognizable skills should appear first
const skillPriority: string[] = [
	// Special tags
	"hot", "top",
	// Core blockchain languages
	"Solidity", "Rust", "Cairo", "Move",
	// Blockchain-specific
	"EVM", "ZKP", "Protocol", "DeFi", "MEV", "Cryptography",
	// Core programming languages
	"TypeScript", "Python", "JavaScript", "Go", "Java", "C", "C++",
	// Technical domains
	"AI", "ML", "Security", "Research", "Infrastructure",
	// Development roles
	"Full Stack", "Frontend", "Backend", "Mobile",
	// Frameworks & tools
	"React", "Node.js", "Reth", "Alloy", "Anchor",
];

function sortSkillsByRelevance(skills: string[]): string[] {
	return [...skills].sort((a, b) => {
		const aIndex = skillPriority.findIndex(
			(s) => s.toLowerCase() === a.toLowerCase()
		);
		const bIndex = skillPriority.findIndex(
			(s) => s.toLowerCase() === b.toLowerCase()
		);
		// If both are in priority list, sort by priority
		if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
		// If only a is in priority list, a comes first
		if (aIndex !== -1) return -1;
		// If only b is in priority list, b comes first
		if (bIndex !== -1) return 1;
		// If neither is in priority list, maintain original order
		return 0;
	});
}

interface Props {
	params: Promise<{ id: string }>;
}

export default async function Image({ params }: Props) {
	const { id } = await params;
	const candidate = await getCandidateById(id);

	const name = candidate?.name || "Candidate";
	const title = candidate?.title || "";
	const rawSkills = candidate?.skills || [];
	const skills = sortSkillsByRelevance(rawSkills).slice(0, 5);
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
				<div style={{ display: "flex", alignItems: "center", gap: 24 }}>
					<div
						style={{
							width: 88,
							height: 88,
							borderRadius: "50%",
							overflow: "hidden",
							display: "flex",
						}}
					>
						<img
							src="https://pub-a22f31a467534add843b6cf22cf4f443.r2.dev/dcbuilder.png"
							alt="dcbuilder"
							width={88}
							height={88}
							style={{ objectFit: "cover" }}
						/>
					</div>
					<div style={{ display: "flex", flexDirection: "column" }}>
						<span style={{ color: "#ffffff", fontSize: 42, fontWeight: 600 }}>
							dcbuilder.eth
						</span>
						<span style={{ color: "#ccc", fontSize: 34 }}>Candidates</span>
					</div>
				</div>

				{/* Middle: Candidate info */}
				<div
					style={{
						display: "flex",
						alignItems: "center",
						gap: 48,
					}}
				>
					{/* Candidate image */}
					{image ? (
						<div
							style={{
								width: 240,
								height: 240,
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
								width={240}
								height={240}
								style={{ objectFit: "cover" }}
							/>
						</div>
					) : (
						<div
							style={{
								width: 240,
								height: 240,
								borderRadius: "50%",
								backgroundColor: "#1a1a2e",
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								fontSize: 96,
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
							gap: 16,
						}}
					>
						<div
							style={{
								fontSize: name.length > 20 ? 62 : 74,
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
									fontSize: 42,
									color: "#c084fc",
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
				<div style={{ display: "flex", gap: 18, flexWrap: "wrap" }}>
					{skills.map((skill) => (
						<div
							key={skill}
							style={{
								padding: "16px 36px",
								borderRadius: 32,
								backgroundColor: "#1a1a2e",
								color: "#ddd",
								fontSize: 36,
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
