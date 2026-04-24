import { ImageResponse } from "next/og";
import { getCandidateById } from "@/lib/data";
import { isNew } from "@/lib/shuffle";

export const runtime = "nodejs";

export const alt = "Candidate";
export const size = {
	width: 1200,
	height: 630,
};
export const contentType = "image/png";

const SKILLS_ROW_WIDTH = 1080;
const SKILL_GAP = 18;
const MAX_SKILLS = 5;
const SKILL_HORIZONTAL_PADDING = 72;
const ESTIMATED_SKILL_CHAR_WIDTH = 18;

function estimateSkillWidth(skill: string) {
	return SKILL_HORIZONTAL_PADDING + skill.length * ESTIMATED_SKILL_CHAR_WIDTH;
}

function selectOneLineSkills(skills: string[]) {
	const selected: string[] = [];
	let usedWidth = 0;

	for (const skill of skills) {
		const nextWidth =
			usedWidth + (selected.length > 0 ? SKILL_GAP : 0) + estimateSkillWidth(skill);

		if (nextWidth > SKILLS_ROW_WIDTH) {
			if (selected.length === 0) {
				selected.push(skill);
			}
			break;
		}

		selected.push(skill);
		usedWidth = nextWidth;

		if (selected.length >= MAX_SKILLS) {
			break;
		}
	}

	return selected;
}

interface Props {
	params: Promise<{ id: string }>;
}

export default async function Image({ params }: Props) {
	const { id } = await params;
	const candidate = await getCandidateById(id);

	const name = candidate?.name || "Candidate";
	const title = candidate?.title || "";
	const allSkills = candidate?.skills || [];
	const isHot = allSkills.some(s => s.toLowerCase() === "hot");
	const isTop = allSkills.some(s => s.toLowerCase() === "top");
	const isNewCandidate = isNew(candidate?.createdAt);
	const skills = selectOneLineSkills(
		allSkills.filter(s => s.toLowerCase() !== "hot" && s.toLowerCase() !== "top")
	);
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
				{/* Top: Site branding + Badges */}
				<div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
					{/* Left: Branding */}
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
					{/* Right: Badges */}
					{(isHot || isTop || isNewCandidate) && (
						<div style={{ display: "flex", gap: 12 }}>
							{isHot && (
								<div
									style={{
										display: "flex",
										padding: "12px 24px",
										borderRadius: 28,
										background: "linear-gradient(to right, #f97316, #f59e0b)",
										color: "#ffffff",
										fontSize: 32,
										fontWeight: 700,
									}}
								>
									<span>🔥 HOT</span>
								</div>
							)}
							{isTop && (
								<div
									style={{
										display: "flex",
										padding: "12px 24px",
										borderRadius: 28,
										background: "linear-gradient(to right, #8b5cf6, #a855f7)",
										color: "#ffffff",
										fontSize: 32,
										fontWeight: 700,
									}}
								>
									<span>⭐ TOP</span>
								</div>
							)}
							{isNewCandidate && (
								<div
									style={{
										display: "flex",
										padding: "12px 24px",
										borderRadius: 28,
										backgroundColor: "#e0f2fe",
										color: "#0369a1",
										fontSize: 32,
										fontWeight: 700,
									}}
								>
									<span>NEW</span>
								</div>
							)}
						</div>
					)}
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
						{/* Name */}
						<div
							style={{
								fontSize: name.length > 25 ? 54 : name.length > 20 ? 62 : 74,
								fontWeight: 700,
								color: "#ffffff",
								lineHeight: 1.1,
								maxWidth: 700,
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
				<div
					style={{
						display: "flex",
						gap: SKILL_GAP,
						flexWrap: "nowrap",
						overflow: "hidden",
						width: SKILLS_ROW_WIDTH,
					}}
				>
					{skills.map((skill) => (
						<div
							key={skill}
							style={{
								padding: "16px 36px",
								borderRadius: 32,
								backgroundColor: "#1a1a2e",
								color: "#ddd",
								fontSize: 36,
								flexShrink: 0,
								whiteSpace: "nowrap",
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
