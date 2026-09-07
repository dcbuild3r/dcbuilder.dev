type Advisory = {
  severity?: string;
  title?: string;
  url?: string;
};

type AuditReport = Record<string, Advisory[]>;

const audit = Bun.spawn(["bun", "audit", "--json"], {
  stdout: "pipe",
  stderr: "inherit",
});

const output = await new Response(audit.stdout).text();
await audit.exited;
const jsonStart = output.indexOf("{");

if (jsonStart < 0) {
  console.error("[audit] Bun did not return a valid dependency report.");
  process.exit(1);
}

const report = JSON.parse(output.slice(jsonStart)) as AuditReport;
const critical = Object.entries(report).flatMap(([dependency, advisories]) =>
  advisories
    .filter((advisory) => advisory.severity === "critical")
    .map((advisory) => ({ dependency, ...advisory })),
);

if (critical.length > 0) {
  console.error(`[audit] Found ${critical.length} critical dependency advisories:`);
  for (const advisory of critical) {
    console.error(`- ${advisory.dependency}: ${advisory.title ?? advisory.url ?? "unknown advisory"}`);
  }
  process.exit(1);
}

const advisoryCount = Object.values(report).reduce(
  (total, advisories) => total + advisories.length,
  0,
);
console.log(`[audit] No critical advisories (${advisoryCount} lower-severity advisories tracked).`);
