/**
 * Remaining multi-host tools (inspect / generate / diff / crypto) as string I/O specs.
 * Specialty adapters (base64, curl-converter, json-toolbox) stay outside this map.
 */
import { err, ok, type ToolResult } from "./result";
import type { HostRuntime } from "./host-runtime";
import type { HostTransformSpec } from "./host-types";
import { runUrlTransform, type UrlEncodingScope } from "./tools/url-encode";
import { runJsonEscape } from "./tools/json-escape";
import { renderMarkdown } from "./tools/markdown-preview";
import { parseUnixTimestamp } from "./tools/unix-timestamp";
import { hashSha256 } from "./tools/sha-hash";
import { signHmacSha256 } from "./tools/hmac-generator";
import { decryptAesGcm, encryptAesGcm } from "./tools/aes-cipher";
import { validateBcryptRequest } from "./tools/bcrypt-hash";
import { decodeBasicAuth, encodeBasicAuth } from "./tools/basic-auth-header";
import { inspectJwt } from "./tools/jwt-decoder";
import { parseUrl } from "./tools/url-parser";
import { findHttpStatuses } from "./tools/http-status-codes";
import { lookupMimeTypes } from "./tools/mime-types";
import { parseUserAgent } from "./tools/user-agent-parser";
import { getNextCronRuns, parseCronExpression } from "./tools/cron-parser";
import { calculateIpv4Subnet } from "./tools/ip-subnet-calculator";
import { getTextStats } from "./tools/text-stats";
import { testRegex } from "./tools/regex-tester";
import { addDaysToIsoDate, diffIsoDates } from "./tools/date-calculator";
import { calculateAge } from "./tools/age-calculator";
import { diffJson } from "./tools/json-diff";
import { diffText } from "./tools/text-diff";
import { generateToken, type TokenFormat } from "./tools/token-generator";
import { validateRsaOptions } from "./tools/rsa-key-pair";
import { generateUuidV4 } from "./tools/uuid-id";
import { generateLoremIpsum, type LoremUnit } from "./tools/lorem-ipsum";
import { generatePassword } from "./tools/password-generator";
import { generateNanoid, NANOID_DEFAULT_ALPHABET } from "./tools/nanoid-generator";
import { generateUlid } from "./tools/ulid-generator";
import { generateObjectId } from "./tools/objectid-generator";
import { generateMockData } from "./tools/mock-data";
import { generateRandomPorts, type PortRange } from "./tools/random-port";
import { generateRandomNumbers } from "./tools/random-number";
import { validateQrPayload } from "./tools/qr-code";

function json(value: unknown): string {
  return JSON.stringify(value, null, 2);
}

function hex(bytes: Uint8Array): string {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

function dual(
  slug: string,
  label: string,
  maxInputChars: number,
  secondaryLabel: string,
  secondaryMax: number,
  run: (
    input: string,
    secondary: string,
    optionId: string,
    runtime: HostRuntime,
  ) => ToolResult<string> | Promise<ToolResult<string>>,
  options: readonly { id: string; label: string }[] = [{ id: "default", label: "Default" }],
  optionLabel = "Mode",
): HostTransformSpec {
  return {
    slug,
    maxInputChars,
    operations: [{ id: "run", label, actionLabel: label }],
    options,
    optionLabel,
    defaultOperationId: "run",
    defaultOptionId: options[0]?.id ?? "default",
    secondaryInput: { label: secondaryLabel, maxChars: secondaryMax },
    transform: (request, runtime) => {
      if (request.operationId !== "run") return err("INVALID_OPERATION", `Choose ${label}.`);
      return run(request.input, request.secondaryInput ?? "", request.optionId, runtime);
    },
  };
}

function generate(
  slug: string,
  label: string,
  run: (optionId: string, runtime: HostRuntime) => ToolResult<string> | Promise<ToolResult<string>>,
  options: readonly { id: string; label: string }[],
  optionLabel: string,
  defaultOptionId: string,
): HostTransformSpec {
  return {
    slug,
    maxInputChars: 0,
    operations: [{ id: "generate", label, actionLabel: label }],
    options,
    optionLabel,
    defaultOperationId: "generate",
    defaultOptionId,
    allowEmptyInput: true,
    transform: (request, runtime) => {
      if (request.operationId !== "generate") return err("INVALID_OPERATION", `Choose ${label}.`);
      return run(request.optionId, runtime);
    },
  };
}

function inspect(
  slug: string,
  label: string,
  maxInputChars: number,
  run: (input: string, optionId: string) => ToolResult<string>,
  options: readonly { id: string; label: string }[] = [{ id: "default", label: "Default" }],
): HostTransformSpec {
  return {
    slug,
    maxInputChars,
    operations: [{ id: "inspect", label, actionLabel: label }],
    options,
    optionLabel: "Mode",
    defaultOperationId: "inspect",
    defaultOptionId: options[0]?.id ?? "default",
    transform: (request) => {
      if (request.operationId !== "inspect") return err("INVALID_OPERATION", `Choose ${label}.`);
      return run(request.input, request.optionId);
    },
  };
}

export const HOST_EXTRA_TOOL_SPECS: readonly HostTransformSpec[] = [
  // --- remaining transforms ---
  {
    slug: "url-encode",
    maxInputChars: 2_000_000,
    operations: [
      { id: "encode", label: "Encode", actionLabel: "Encode" },
      { id: "decode", label: "Decode", actionLabel: "Decode" },
    ],
    options: [
      { id: "component", label: "Component" },
      { id: "url", label: "Full URL" },
    ],
    optionLabel: "Scope",
    defaultOperationId: "encode",
    defaultOptionId: "component",
    transform: (request) => {
      if (request.operationId !== "encode" && request.operationId !== "decode") {
        return err("INVALID_OPERATION", "Choose Encode or Decode.");
      }
      return runUrlTransform(request.operationId, request.input, {
        scope: request.optionId as UrlEncodingScope,
      });
    },
  },
  {
    slug: "json-escape",
    maxInputChars: 2_000_000,
    operations: [
      { id: "encode", label: "Escape", actionLabel: "Escape" },
      { id: "decode", label: "Unescape", actionLabel: "Unescape" },
    ],
    options: [{ id: "default", label: "Default" }],
    optionLabel: "Mode",
    defaultOperationId: "encode",
    defaultOptionId: "default",
    transform: (request) => {
      if (request.operationId !== "encode" && request.operationId !== "decode") {
        return err("INVALID_OPERATION", "Choose Escape or Unescape.");
      }
      return runJsonEscape(request.operationId, request.input);
    },
  },
  {
    slug: "markdown-preview",
    maxInputChars: 500_000,
    operations: [{ id: "render", label: "Render", actionLabel: "Render" }],
    options: [{ id: "html", label: "Safe HTML" }],
    optionLabel: "Output",
    defaultOperationId: "render",
    defaultOptionId: "html",
    transform: (request) => {
      const result = renderMarkdown(request.input);
      if (!result.ok) return result;
      return ok(
        `${result.value.html}\n\n<!-- headings: ${result.value.headings}, words: ${result.value.words}, lines: ${result.value.lines} -->`,
      );
    },
  },
  {
    slug: "unix-timestamp",
    maxInputChars: 32,
    operations: [{ id: "parse", label: "Parse", actionLabel: "Parse" }],
    options: [{ id: "default", label: "Auto unit" }],
    optionLabel: "Mode",
    defaultOperationId: "parse",
    defaultOptionId: "default",
    transform: (request) => {
      const result = parseUnixTimestamp(request.input);
      return result.ok ? ok(json(result.value)) : result;
    },
  },
  {
    slug: "sha-hash",
    maxInputChars: 2_000_000,
    operations: [{ id: "hash", label: "Hash", actionLabel: "Hash SHA-256" }],
    options: [
      { id: "hex", label: "Hex" },
      { id: "base64", label: "Base64" },
      { id: "base64url", label: "Base64URL" },
    ],
    optionLabel: "Encoding",
    defaultOperationId: "hash",
    defaultOptionId: "hex",
    transform: async (request, runtime) => {
      const encoding =
        request.optionId === "base64" || request.optionId === "base64url"
          ? request.optionId
          : "hex";
      const result = await hashSha256(request.input, runtime.sha256.bind(runtime), { encoding });
      return result.ok ? ok(result.value.digest) : result;
    },
  },
  dual(
    "hmac-generator",
    "Sign",
    2_000_000,
    "Secret key",
    2_000_000,
    async (message, secret, _optionId, runtime) => {
      const result = await signHmacSha256(secret, message, runtime.hmacSha256);
      return result.ok ? ok(result.value.digest) : result;
    },
  ),
  {
    slug: "aes-cipher",
    maxInputChars: 2_000_000,
    operations: [
      { id: "encrypt", label: "Encrypt", actionLabel: "Encrypt" },
      { id: "decrypt", label: "Decrypt", actionLabel: "Decrypt" },
    ],
    options: [{ id: "gcm", label: "AES-256-GCM" }],
    optionLabel: "Mode",
    defaultOperationId: "encrypt",
    defaultOptionId: "gcm",
    secondaryInput: {
      label: "Key (64 hex chars) [and 24-hex nonce on next line for encrypt]",
      maxChars: 200,
    },
    transform: async (request, runtime) => {
      const lines = (request.secondaryInput ?? "").split("\n").map((l) => l.trim());
      const key = lines[0] ?? "";
      if (request.operationId === "encrypt") {
        const nonce = lines[1] ?? hex(runtime.randomBytes(12));
        return encryptAesGcm(key, nonce, request.input, runtime.aes);
      }
      if (request.operationId === "decrypt") {
        return decryptAesGcm(key, request.input, runtime.aes);
      }
      return err("INVALID_OPERATION", "Choose Encrypt or Decrypt.");
    },
  },
  {
    slug: "bcrypt-hash",
    maxInputChars: 72,
    operations: [
      { id: "hash", label: "Hash", actionLabel: "Hash password" },
      { id: "verify", label: "Verify", actionLabel: "Verify hash" },
    ],
    options: [
      { id: "10", label: "Cost 10" },
      { id: "12", label: "Cost 12" },
      { id: "8", label: "Cost 8" },
    ],
    optionLabel: "Cost",
    defaultOperationId: "hash",
    defaultOptionId: "10",
    secondaryInput: { label: "bcrypt hash (verify only)", maxChars: 200 },
    transform: async (request, runtime) => {
      const cost = Number(request.optionId);
      if (request.operationId === "hash") {
        const valid = validateBcryptRequest(request.input, cost);
        if (!valid.ok) return valid;
        if (!runtime.bcryptHash) {
          return err("UNSUPPORTED", "bcrypt is unavailable in this host runtime.");
        }
        try {
          return ok(await runtime.bcryptHash(request.input, cost));
        } catch {
          return err("HASH_FAILED", "bcrypt could not hash this password.");
        }
      }
      if (request.operationId === "verify") {
        if (!runtime.bcryptCompare) {
          return err("UNSUPPORTED", "bcrypt is unavailable in this host runtime.");
        }
        const hash = (request.secondaryInput ?? "").trim();
        if (!hash) return err("HASH_REQUIRED", "Enter a bcrypt hash to verify against.");
        try {
          const match = await runtime.bcryptCompare(request.input, hash);
          return ok(match ? "Match" : "No match");
        } catch {
          return err("VERIFY_FAILED", "bcrypt could not verify this hash.");
        }
      }
      return err("INVALID_OPERATION", "Choose Hash or Verify.");
    },
  },
  {
    slug: "basic-auth-header",
    maxInputChars: 100_000,
    operations: [
      { id: "encode", label: "Encode", actionLabel: "Encode" },
      { id: "decode", label: "Decode", actionLabel: "Decode" },
    ],
    options: [{ id: "default", label: "Default" }],
    optionLabel: "Mode",
    defaultOperationId: "encode",
    defaultOptionId: "default",
    secondaryInput: { label: "Password (encode) or unused (decode)", maxChars: 100_000 },
    transform: (request) => {
      if (request.operationId === "encode") {
        return encodeBasicAuth(request.input, request.secondaryInput ?? "");
      }
      if (request.operationId === "decode") {
        const result = decodeBasicAuth(request.input);
        return result.ok ? ok(json(result.value)) : result;
      }
      return err("INVALID_OPERATION", "Choose Encode or Decode.");
    },
  },

  // --- inspect ---
  inspect("jwt-decoder", "Decode", 100_000, (input) => {
    const result = inspectJwt(input);
    if (!result.ok) return result;
    return ok(
      json({
        header: result.value.header,
        payload: result.value.payload,
        signature: result.value.signature,
        expiresAt: result.value.expiresAt?.toISOString() ?? null,
        issuedAt: result.value.issuedAt?.toISOString() ?? null,
        note: "Signature is not verified.",
      }),
    );
  }),
  inspect("url-parser", "Parse", 100_000, (input) => {
    const result = parseUrl(input);
    return result.ok ? ok(json(result.value)) : result;
  }),
  inspect("http-status-codes", "Lookup", 32, (input) => {
    const matches = findHttpStatuses(input);
    if (matches.length === 0) return err("NOT_FOUND", "No HTTP status matched that query.");
    return ok(json(matches));
  }),
  inspect("mime-types", "Lookup", 256, (input) => {
    const result = lookupMimeTypes(input);
    return result.ok ? ok(json(result.value)) : result;
  }),
  inspect("user-agent-parser", "Parse", 10_000, (input) => {
    const result = parseUserAgent(input);
    return result.ok ? ok(json(result.value)) : result;
  }),
  {
    slug: "cron-parser",
    maxInputChars: 500,
    operations: [{ id: "inspect", label: "Parse", actionLabel: "Parse" }],
    options: [{ id: "default", label: "Default" }],
    optionLabel: "Mode",
    defaultOperationId: "inspect",
    defaultOptionId: "default",
    transform: (request, runtime) => {
      if (request.operationId !== "inspect") return err("INVALID_OPERATION", "Choose Parse.");
      const parsed = parseCronExpression(request.input);
      if (!parsed.ok) return parsed;
      const next = getNextCronRuns(parsed.value, new Date(runtime.now()), 5);
      return ok(
        json({
          expression: parsed.value.expression,
          description: parsed.value.description,
          nextRuns: next.ok ? next.value.map((d) => d.toISOString()) : [],
        }),
      );
    },
  },
  inspect("ip-subnet-calculator", "Calculate", 64, (input) => {
    const result = calculateIpv4Subnet(input);
    return result.ok ? ok(json(result.value)) : result;
  }),
  inspect("text-stats", "Measure", 2_000_000, (input) => {
    const result = getTextStats(input);
    return result.ok ? ok(json(result.value)) : result;
  }),
  dual("regex-tester", "Test", 100_000, "Regular expression pattern", 5_000, (input, pattern) => {
    const result = testRegex(pattern, input, { flags: "g" });
    return result.ok ? ok(json(result.value)) : result;
  }),
  {
    slug: "date-calculator",
    maxInputChars: 32,
    operations: [
      { id: "diff", label: "Difference", actionLabel: "Diff dates" },
      { id: "add", label: "Add days", actionLabel: "Add days" },
    ],
    options: [{ id: "default", label: "ISO dates" }],
    optionLabel: "Mode",
    defaultOperationId: "diff",
    defaultOptionId: "default",
    secondaryInput: { label: "To date (diff) or day offset (add)", maxChars: 32 },
    transform: (request) => {
      const secondary = (request.secondaryInput ?? "").trim();
      if (request.operationId === "diff") {
        const result = diffIsoDates(request.input, secondary);
        return result.ok ? ok(json(result.value)) : result;
      }
      if (request.operationId === "add") {
        const result = addDaysToIsoDate(request.input, secondary);
        return result.ok ? ok(json(result.value)) : result;
      }
      return err("INVALID_OPERATION", "Choose Difference or Add days.");
    },
  },
  dual(
    "age-calculator",
    "Calculate",
    32,
    "Reference date (YYYY-MM-DD)",
    32,
    (birth, reference, _optionId, runtime) => {
      const ref = reference || new Date(runtime.now()).toISOString().slice(0, 10);
      const result = calculateAge(birth, ref);
      return result.ok ? ok(json(result.value)) : result;
    },
  ),

  // --- diff ---
  dual("json-diff", "Compare", 1_000_000, "Changed (B)", 1_000_000, (left, right) => {
    const result = diffJson(left, right);
    return result.ok ? ok(json(result.value)) : result;
  }),
  dual("text-diff", "Compare", 500_000, "Changed (B)", 500_000, (left, right) => {
    const result = diffText(left, right);
    return result.ok ? ok(json(result.value)) : result;
  }),

  // --- generate ---
  generate(
    "uuid-id",
    "Generate",
    (_optionId, runtime) => generateUuidV4(runtime.randomBytes),
    [{ id: "v4", label: "UUID v4" }],
    "Version",
    "v4",
  ),
  generate(
    "token-generator",
    "Generate",
    (optionId, runtime) => {
      const [lengthRaw, format] = optionId.split(":");
      return generateToken(
        Number(lengthRaw),
        (format as TokenFormat) || "hex",
        runtime.randomBytes,
      );
    },
    [
      { id: "32:hex", label: "32 hex" },
      { id: "64:hex", label: "64 hex" },
      { id: "32:base64url", label: "32 base64url" },
      { id: "64:base64url", label: "64 base64url" },
    ],
    "Length / format",
    "32:hex",
  ),
  generate(
    "lorem-ipsum",
    "Generate",
    (optionId) => {
      const [amountRaw, unit] = optionId.split(":");
      return generateLoremIpsum({
        amount: Number(amountRaw),
        unit: (unit as LoremUnit) || "paragraphs",
      });
    },
    [
      { id: "1:paragraphs", label: "1 paragraph" },
      { id: "3:paragraphs", label: "3 paragraphs" },
      { id: "50:words", label: "50 words" },
      { id: "5:list-items", label: "5 list items" },
    ],
    "Amount",
    "1:paragraphs",
  ),
  generate(
    "password-generator",
    "Generate",
    (optionId, runtime) => {
      const length = Number(optionId) || 16;
      return generatePassword(
        {
          length,
          lowercase: true,
          uppercase: true,
          numbers: true,
          symbols: true,
          excludeAmbiguous: true,
        },
        runtime.randomBytes,
      );
    },
    [
      { id: "12", label: "12 chars" },
      { id: "16", label: "16 chars" },
      { id: "24", label: "24 chars" },
      { id: "32", label: "32 chars" },
    ],
    "Length",
    "16",
  ),
  generate(
    "nanoid-generator",
    "Generate",
    (optionId, runtime) =>
      generateNanoid(
        { length: Number(optionId) || 21, alphabet: NANOID_DEFAULT_ALPHABET },
        runtime.randomBytes,
      ),
    [
      { id: "12", label: "12" },
      { id: "21", label: "21" },
      { id: "32", label: "32" },
    ],
    "Length",
    "21",
  ),
  generate(
    "ulid-generator",
    "Generate",
    (_optionId, runtime) => generateUlid(runtime.now(), runtime.randomBytes),
    [{ id: "now", label: "Now" }],
    "Timestamp",
    "now",
  ),
  generate(
    "objectid-generator",
    "Generate",
    (_optionId, runtime) => {
      const result = generateObjectId(
        Math.floor(runtime.now() / 1000),
        runtime.randomUint32() & 0xffffff,
        runtime.randomBytes,
      );
      return result.ok ? ok(result.value.value) : result;
    },
    [{ id: "now", label: "Now" }],
    "Timestamp",
    "now",
  ),
  generate(
    "mock-data",
    "Generate",
    (optionId, runtime) => {
      const count = Number(optionId) || 5;
      const result = generateMockData(
        {
          count,
          includeId: true,
          includeName: true,
          includeEmail: true,
          includeRole: true,
        },
        runtime.randomBytes,
      );
      return result.ok ? ok(json(result.value)) : result;
    },
    [
      { id: "5", label: "5 rows" },
      { id: "20", label: "20 rows" },
      { id: "50", label: "50 rows" },
    ],
    "Rows",
    "5",
  ),
  generate(
    "random-port",
    "Generate",
    (optionId, runtime) => {
      const [range, countRaw] = optionId.split(":");
      const result = generateRandomPorts(
        {
          range: (range as PortRange) || "dynamic",
          count: Number(countRaw) || 1,
        },
        runtime.randomUint32,
      );
      return result.ok ? ok(result.value.ports.join("\n")) : result;
    },
    [
      { id: "dynamic:1", label: "1 dynamic" },
      { id: "dynamic:5", label: "5 dynamic" },
      { id: "ephemeral:1", label: "1 ephemeral" },
    ],
    "Range",
    "dynamic:1",
  ),
  generate(
    "random-number",
    "Generate",
    (optionId, runtime) => {
      const [from, to, countRaw] = optionId.split(":").map(Number);
      const result = generateRandomNumbers(
        { from: from ?? 0, to: to ?? 100, count: countRaw || 1, decimals: 0 },
        runtime.randomUint32,
      );
      return result.ok ? ok(result.value.values.join("\n")) : result;
    },
    [
      { id: "0:100:1", label: "0–100 ×1" },
      { id: "0:100:5", label: "0–100 ×5" },
      { id: "1:1000:1", label: "1–1000 ×1" },
    ],
    "Range",
    "0:100:1",
  ),
  generate(
    "rsa-key-pair",
    "Generate",
    async (optionId, runtime) => {
      const modulus = Number(optionId) || 2048;
      const valid = validateRsaOptions(modulus);
      if (!valid.ok) return valid;
      if (!runtime.generateRsaPem) {
        return err("UNSUPPORTED", "RSA generation is unavailable in this host runtime.");
      }
      try {
        const keys = await runtime.generateRsaPem(modulus);
        return ok(`${keys.publicKey}\n\n${keys.privateKey}`);
      } catch {
        return err("GENERATE_FAILED", "RSA key pair generation failed.");
      }
    },
    [
      { id: "2048", label: "2048-bit" },
      { id: "4096", label: "4096-bit" },
    ],
    "Modulus",
    "2048",
  ),
  {
    slug: "qr-code",
    maxInputChars: 2_953,
    operations: [{ id: "validate", label: "Validate", actionLabel: "Validate payload" }],
    options: [{ id: "default", label: "Payload only" }],
    optionLabel: "Mode",
    defaultOperationId: "validate",
    defaultOptionId: "default",
    transform: (request) => {
      const result = validateQrPayload(request.input);
      if (!result.ok) return result;
      return ok(
        `Payload valid (${result.value.length} characters).\nQR image rendering remains web-only; hosts expose validation only.`,
      );
    },
  },
];
