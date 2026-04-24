const glob = new Bun.Glob("tests/*.test.ts");
const files = Array.from(glob.scanSync({ cwd: process.cwd() })).sort();

let failed = false;

for (const file of files) {
  console.log(`\n[test:unit] ${file}`);

  const testProcess = Bun.spawn(["bun", "test", file], {
    stdout: "inherit",
    stderr: "inherit",
    env: process.env,
  });

  const exitCode = await testProcess.exited;
  if (exitCode !== 0) {
    failed = true;
  }
}

process.exit(failed ? 1 : 0);

