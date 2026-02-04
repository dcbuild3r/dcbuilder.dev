import { ImageResponse } from "next/og";
import { getJobById } from "@/lib/data";

export const runtime = "nodejs";

export const alt = "Job";
export const size = {
	width: 1200,
	height: 630,
};
export const contentType = "image/png";

// Check if created within last 14 days
function isNew(createdAt: Date | string | null | undefined): boolean {
	if (!createdAt) return false;
	const date = new Date(createdAt);
	const now = new Date();
	const diffDays = (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24);
	return diffDays <= 14;
}

interface Props {
	params: Promise<{ id: string }>;
}

export default async function Image({ params }: Props) {
	const { id } = await params;
	const job = await getJobById(id);

	const title = job?.title || "Job Opening";
	const company = job?.company || "";
	const location = job?.location || "";
	const remote = job?.remote || "";
	const salary = job?.salary || "";
	const logo = job?.companyLogo;
	const allTags = job?.tags || [];
	const isHot = allTags.includes("hot");
	const isTop = allTags.includes("top");
	const isNewJob = isNew(job?.createdAt);
	// Filter out hot/top (shown as badges) and take first 4 tags as ordered in DB
	const tags = allTags
		.filter(tag => tag !== "hot" && tag !== "top")
		.slice(0, 4);

	const locationText = [location, remote].filter(Boolean).join(" • ");

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
						"radial-gradient(circle at 80% 20%, #1a2e1a 0%, #0a0a0a 40%)",
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
							<span style={{ color: "#ccc", fontSize: 34 }}>Jobs</span>
						</div>
					</div>
					{/* Right: Badges */}
					{(isHot || isTop || isNewJob) && (
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
							{isNewJob && (
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

				{/* Middle: Job info */}
				<div
					style={{
						display: "flex",
						alignItems: "center",
						gap: 48,
					}}
				>
					{/* Company logo */}
					{logo ? (
						<div
							style={{
								width: 200,
								height: 200,
								borderRadius: 28,
								overflow: "hidden",
								display: "flex",
								border: "3px solid #333",
								flexShrink: 0,
								backgroundColor: "#ffffff",
							}}
						>
							<img
								src={logo}
								alt={company}
								width={200}
								height={200}
								style={{ objectFit: "contain" }}
							/>
						</div>
					) : (
						<div
							style={{
								width: 200,
								height: 200,
								borderRadius: 28,
								backgroundColor: "#1a1a2e",
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								fontSize: 80,
								flexShrink: 0,
							}}
						>
							💼
						</div>
					)}

					{/* Job details */}
					<div
						style={{
							display: "flex",
							flexDirection: "column",
							gap: 14,
						}}
					>
						<div
							style={{
								fontSize: title.length > 30 ? 54 : 62,
								fontWeight: 700,
								color: "#ffffff",
								lineHeight: 1.1,
								maxWidth: 800,
							}}
						>
							{title}
						</div>
						{company && (
							<div
								style={{
									fontSize: 46,
									color: "#4ade80",
									lineHeight: 1.2,
								}}
							>
								{company}
							</div>
						)}
						<div style={{ display: "flex", gap: 36, marginTop: 8 }}>
							{locationText && (
								<div style={{ display: "flex", fontSize: 38, color: "#ddd" }}>
									<span>📍 {locationText}</span>
								</div>
							)}
							{salary && (
								<div style={{ display: "flex", fontSize: 38, color: "#ddd" }}>
									<span>💰 {salary}</span>
								</div>
							)}
						</div>
					</div>
				</div>

				{/* Bottom: Tags */}
				<div style={{ display: "flex", gap: 18, flexWrap: "wrap" }}>
					{tags.map((tag) => (
						<div
							key={tag}
							style={{
								padding: "16px 36px",
								borderRadius: 32,
								backgroundColor: "#1a2e1a",
								color: "#86efac",
								fontSize: 36,
							}}
						>
							{tag}
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
