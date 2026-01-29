import { ImageResponse } from "next/og";
import { formatBlogDate, getPostBySlug } from "@/lib/blog";

export const runtime = "nodejs";

export const alt = "Blog post";
export const size = {
	width: 1200,
	height: 630,
};
export const contentType = "image/png";

interface Props {
	params: Promise<{ slug: string }>;
}

export default async function Image({ params }: Props) {
	const { slug } = await params;
	const post = getPostBySlug(slug);

	const title = post?.title || "Blog Post";
	const date = post?.date ? formatBlogDate(post.date) : "";

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
						"radial-gradient(circle at 80% 20%, #1a1a2e 0%, #0a0a0a 40%)",
					padding: 60,
				}}
			>
				{/* Top: Author info */}
				<div style={{ display: "flex", alignItems: "center", gap: 16 }}>
					<div
						style={{
							width: 56,
							height: 56,
							borderRadius: "50%",
							overflow: "hidden",
							display: "flex",
						}}
					>
					<img
							src="https://pub-a22f31a467534add843b6cf22cf4f443.r2.dev/dcbuilder.png"
							alt="dcbuilder"
							width={56}
							height={56}
							style={{ objectFit: "cover" }}
						/>
					</div>
					<div style={{ display: "flex", flexDirection: "column" }}>
						<span style={{ color: "#ffffff", fontSize: 24, fontWeight: 600 }}>
							dcbuilder.eth
						</span>
						<span style={{ color: "#666", fontSize: 18 }}>dcbuilder.dev</span>
					</div>
				</div>

				{/* Middle: Title */}
				<div
					style={{
						display: "flex",
						flexDirection: "column",
						gap: 16,
					}}
				>
					<div
						style={{
							fontSize: title.length > 50 ? 48 : 56,
							fontWeight: 700,
							color: "#ffffff",
							lineHeight: 1.2,
							maxWidth: 1000,
						}}
					>
						{title}
					</div>
					{date && (
						<div style={{ fontSize: 24, color: "#666" }}>
							{date}
						</div>
					)}
				</div>

				{/* Bottom: Blog badge */}
				<div style={{ display: "flex" }}>
					<div
						style={{
							padding: "10px 24px",
							borderRadius: 24,
							backgroundColor: "#1a1a2e",
							color: "#888",
							fontSize: 20,
						}}
					>
						Blog
					</div>
				</div>
			</div>
		),
		{
			...size,
		}
	);
}
