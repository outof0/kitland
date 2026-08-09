import { execFile } from "node:child_process";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const packageRoot = fileURLToPath(new URL("../", import.meta.url));

async function main() {
  console.log("Verifying @kitland/mcp package...");

  // 1. Pack tarball
  const { stdout: packStdout } = await execFileAsync("npm", ["pack", "--json"], {
    cwd: packageRoot,
  });

  const packInfo = JSON.parse(packStdout);
  const tarballName = packInfo[0].filename;
  const tarballPath = join(packageRoot, tarballName);
  const files = packInfo[0].files.map((f) => f.path);

  console.log(`Packed ${tarballName} (${files.length} files)`);

  // 2. Validate file allowlist
  const disallowedPatterns = [
    /\.ts$/,
    /\.map$/,
    /^src\//,
    /^test\//,
    /^scripts\//,
    /tsconfig\.json/,
    /vitest\.config/,
  ];

  for (const file of files) {
    for (const pattern of disallowedPatterns) {
      if (pattern.test(file)) {
        throw new Error(`Package tarball contains forbidden file: "${file}"`);
      }
    }
  }

  // 3. Unpack in isolated temporary directory
  const tempDir = await mkdtemp(join(tmpdir(), "kitland-mcp-verify-"));
  try {
    await execFileAsync("tar", ["-xzf", tarballPath, "-C", tempDir]);
    const pkgJsonPath = join(tempDir, "package", "package.json");
    const pkgJson = JSON.parse(await readFile(pkgJsonPath, "utf8"));

    // Check no runtime workspace dependencies
    const runtimeDeps = {
      ...pkgJson.dependencies,
      ...pkgJson.peerDependencies,
    };
    for (const [name, version] of Object.entries(runtimeDeps)) {
      if (typeof version === "string" && version.startsWith("workspace:")) {
        throw new Error(
          `Package contains unbundled runtime workspace dependency: "${name}": "${version}"`,
        );
      }
    }

    // Check cli.js shebang
    const cliPath = join(tempDir, "package", "dist", "cli.js");
    const cliContent = await readFile(cliPath, "utf8");
    if (!cliContent.startsWith("#!/usr/bin/env node")) {
      throw new Error("dist/cli.js is missing the required #!/usr/bin/env node shebang.");
    }

    // 4. Test live stdio interaction with unpacked binary
    console.log("Testing standalone execution of unpacked binary...");
    const child = execFile("node", [cliPath], {
      cwd: tempDir,
      stdio: ["pipe", "pipe", "pipe"],
    });

    let stderrOutput = "";
    child.stderr.on("data", (chunk) => {
      stderrOutput += chunk.toString();
    });

    const responses = [];
    let stdoutBuffer = "";

    child.stdout.on("data", (chunk) => {
      stdoutBuffer += chunk.toString();
      const lines = stdoutBuffer.split("\n");
      stdoutBuffer = lines.pop() ?? "";
      for (const line of lines) {
        if (line.trim()) {
          try {
            responses.push(JSON.parse(line.trim()));
          } catch {
            throw new Error(`Stdout contained non-JSON-RPC output: "${line}"`);
          }
        }
      }
    });

    const send = (msg) => {
      child.stdin.write(JSON.stringify(msg) + "\n");
    };

    // Step 1: Initialize
    send({
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: {
        protocolVersion: "2025-11-25",
        capabilities: {},
        clientInfo: { name: "verify-client", version: "1.0.0" },
      },
    });

    await new Promise((resolve) => setTimeout(resolve, 300));

    // Step 2: notifications/initialized
    send({
      jsonrpc: "2.0",
      method: "notifications/initialized",
    });

    // Step 3: tools/list
    send({
      jsonrpc: "2.0",
      id: 2,
      method: "tools/list",
      params: {},
    });

    await new Promise((resolve) => setTimeout(resolve, 300));

    // Step 4: tools/call
    send({
      jsonrpc: "2.0",
      id: 3,
      method: "tools/call",
      params: {
        name: "kitland_base64_encode",
        arguments: { input: "Hello, Kitland MCP!" },
      },
    });

    await new Promise((resolve) => setTimeout(resolve, 400));

    child.stdin.end();
    await new Promise((resolve) => child.on("exit", resolve));

    // Check responses
    const initRes = responses.find((r) => r.id === 1);
    if (!initRes || !initRes.result || initRes.result.serverInfo.name !== "kitland-mcp") {
      throw new Error(
        `Initialize failed or returned unexpected response: ${JSON.stringify(initRes)}`,
      );
    }

    const listRes = responses.find((r) => r.id === 2);
    if (!listRes || !listRes.result || !Array.isArray(listRes.result.tools)) {
      throw new Error(`tools/list failed: ${JSON.stringify(listRes)}`);
    }
    const toolNames = listRes.result.tools.map((t) => t.name);
    if (
      !toolNames.includes("kitland_base64_encode") ||
      !toolNames.includes("kitland_base64_decode")
    ) {
      throw new Error(`tools/list missing expected tools: ${JSON.stringify(toolNames)}`);
    }

    const callRes = responses.find((r) => r.id === 3);
    if (
      !callRes ||
      !callRes.result ||
      callRes.result.structuredContent?.output !== "SGVsbG8sIEtpdGxhbmQgTUNQIQ=="
    ) {
      throw new Error(`tools/call base64_encode failed: ${JSON.stringify(callRes)}`);
    }

    if (stderrOutput.trim() !== "") {
      throw new Error(`Stderr was not silent: "${stderrOutput}"`);
    }

    console.log("Package verification passed successfully!");
  } finally {
    await rm(tarballPath, { force: true });
    await rm(tempDir, { force: true, recursive: true });
  }
}

main().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});
