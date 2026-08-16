import { spawn } from "node:child_process";
import { readFile, readdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const packageRoot = fileURLToPath(new URL("../", import.meta.url));

describe("Process Boundary & Stdio Discipline", () => {
  it("uses a static regex worker entry rather than evaluating generated code", async () => {
    const exposurePath = fileURLToPath(new URL("../src/exposures/text-regex.ts", import.meta.url));
    const workerPath = fileURLToPath(new URL("../src/regex-worker.ts", import.meta.url));
    const [exposureSource, workerSource] = await Promise.all([
      readFile(exposurePath, "utf8"),
      readFile(workerPath, "utf8"),
    ]);

    expect(exposureSource).toContain("new Worker(workerEntry");
    expect(exposureSource).not.toContain("eval: true");
    expect(workerSource).toContain("import { testRegex");
  });

  it("interacts strictly via JSON-RPC on stdout and keeps stderr silent", async () => {
    const cliPath = fileURLToPath(new URL("../dist/cli.js", import.meta.url));
    const child = spawn("node", [cliPath], {
      cwd: packageRoot,
      stdio: ["pipe", "pipe", "pipe"],
    });

    let stderrData = "";
    child.stderr.on("data", (chunk) => {
      stderrData += chunk.toString();
    });

    const messages: unknown[] = [];
    let stdoutBuffer = "";

    child.stdout.on("data", (chunk) => {
      stdoutBuffer += chunk.toString();
      const lines = stdoutBuffer.split("\n");
      stdoutBuffer = lines.pop() ?? "";
      for (const line of lines) {
        if (line.trim()) {
          messages.push(JSON.parse(line.trim()));
        }
      }
    });

    const send = (msg: unknown) => {
      child.stdin.write(JSON.stringify(msg) + "\n");
    };

    // 1. Initialize
    send({
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: {
        protocolVersion: "2025-11-25",
        capabilities: {},
        clientInfo: { name: "test-client", version: "1.0.0" },
      },
    });

    await new Promise((r) => setTimeout(r, 200));

    // 2. notifications/initialized
    send({
      jsonrpc: "2.0",
      method: "notifications/initialized",
    });

    // 3. tools/list
    send({
      jsonrpc: "2.0",
      id: 2,
      method: "tools/list",
      params: {},
    });

    await new Promise((r) => setTimeout(r, 200));

    // 4. tools/call
    send({
      jsonrpc: "2.0",
      id: 3,
      method: "tools/call",
      params: {
        name: "kitland_base64_encode",
        arguments: { input: "Discipline Test" },
      },
    });

    await new Promise((r) => setTimeout(r, 200));

    child.stdin.end();

    await new Promise<void>((resolve) => {
      child.on("exit", (code) => {
        expect(code).toBe(0);
        resolve();
      });
    });

    expect(stderrData).toBe("");
    expect(messages.length).toBeGreaterThanOrEqual(3);

    // Ensure no unexpected files were created in packages/mcp
    const dirEntries = await readdir(packageRoot);
    expect(dirEntries).not.toContain("temp");
    expect(dirEntries).not.toContain("cache");
  });
});
