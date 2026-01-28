import { defineConfig } from "@playwright/test";

const PORT = process.env.PORT ? Number(process.env.PORT) : 3001;

export default defineConfig({
	testDir: "./tests",
	timeout: 30_000,
	expect: {
		timeout: 10_000,
	},
	use: {
		baseURL: `http://127.0.0.1:${PORT}`,
		headless: true,
		trace: "on-first-retry",
	},
	webServer: {
		command: `bun dev -- --hostname 127.0.0.1 --port ${PORT}`,
		url: `http://127.0.0.1:${PORT}`,
		reuseExistingServer: false,
		timeout: 120_000,
	},
});
