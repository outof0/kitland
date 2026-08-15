import { defineTool } from "../define-tool";
import type { ToolDefinition } from "../types";

const multiHostTransformPlatforms = Object.freeze({
  web: {
    status: "available" as const,
    capabilities: ["transform-text", "clipboard-write"] as const,
  },
  "browser-extension": {
    status: "available" as const,
    capabilities: ["transform-text", "clipboard-write"] as const,
  },
  "vscode-extension": {
    status: "available" as const,
    capabilities: ["transform-text", "clipboard-write", "active-editor"] as const,
  },
});

const multiHostGeneratePlatforms = Object.freeze({
  web: {
    status: "available" as const,
    capabilities: ["generate-value", "clipboard-write"] as const,
  },
  "browser-extension": {
    status: "available" as const,
    capabilities: ["generate-value", "clipboard-write"] as const,
  },
  "vscode-extension": {
    status: "available" as const,
    capabilities: ["generate-value", "clipboard-write", "active-editor"] as const,
  },
});

export const uuidIdTool = defineTool({
  id: "uuid-id",
  slug: "uuid-id",
  name: "UUID / ID",
  shortName: "UUID / ID",
  family: "generators",
  pattern: "generate",
  status: "available",
  releaseStage: "release-ready",
  releasePlatforms: ["web", "browser-extension", "vscode-extension"],
  description: "Generate UUIDs and format identifiers locally with secure entropy.",
  keywords: ["uuid", "id", "identifier", "random"],
  designFrame: "UUID / ID (TSKpr)",
  platforms: multiHostGeneratePlatforms,
} as const);

export const nanoidGeneratorTool = defineTool({
  id: "nanoid-generator",
  slug: "nanoid-generator",
  name: "NanoID Generator",
  shortName: "NanoID",
  family: "generators",
  pattern: "generate",
  status: "available",
  releaseStage: "release-ready",
  releasePlatforms: ["web", "browser-extension", "vscode-extension"],
  description: "Generate compact custom-alphabet NanoID-style identifiers locally.",
  keywords: ["nanoid", "id", "random", "generate"],
  designFrame: "NanoID Generator (h4DC8)",
  platforms: multiHostTransformPlatforms,
} as const);

export const ulidGeneratorTool = defineTool({
  id: "ulid-generator",
  slug: "ulid-generator",
  name: "ULID Generator",
  shortName: "ULID",
  family: "generators",
  pattern: "generate",
  status: "available",
  releaseStage: "release-ready",
  releasePlatforms: ["web", "browser-extension", "vscode-extension"],
  description: "Generate universally unique, lexicographically sortable ULID identifiers locally.",
  keywords: ["ulid", "id", "generate"],
  designFrame: "ULID Generator (CnASb)",
  platforms: multiHostTransformPlatforms,
} as const);

export const objectidGeneratorTool = defineTool({
  id: "objectid-generator",
  slug: "objectid-generator",
  name: "ObjectID Generator",
  shortName: "ObjectID",
  family: "generators",
  pattern: "generate",
  status: "available",
  releaseStage: "release-ready",
  releasePlatforms: ["web", "browser-extension", "vscode-extension"],
  description: "Generate MongoDB-compatible ObjectID values locally.",
  keywords: ["objectid", "mongodb", "id", "generate"],
  designFrame: "ObjectID Generator (Rl1Bm)",
  platforms: multiHostTransformPlatforms,
} as const);

export const mockDataTool = defineTool({
  id: "mock-data",
  slug: "mock-data",
  name: "Mock Data",
  shortName: "Mock Data",
  family: "generators",
  pattern: "generate",
  status: "available",
  releaseStage: "release-ready",
  releasePlatforms: ["web", "browser-extension", "vscode-extension"],
  description: "Generate realistic JSON and CSV mock data fixture records locally.",
  keywords: ["mock", "fixture", "data", "generate"],
  designFrame: "Mock Data (nmkdk)",
  platforms: multiHostTransformPlatforms,
} as const);

export const qrCodeTool = defineTool({
  id: "qr-code",
  slug: "qr-code",
  name: "QR Code",
  shortName: "QR Code",
  family: "generators",
  pattern: "generate",
  status: "available",
  releaseStage: "release-ready",
  releasePlatforms: ["web", "browser-extension", "vscode-extension"],
  description: "Generate customizable, downloadable QR codes locally from text or URLs.",
  keywords: ["qr", "code", "generate", "url"],
  designFrame: "QR Code (ryifn)",
  platforms: multiHostTransformPlatforms,
} as const);

export const loremIpsumTool = defineTool({
  id: "lorem-ipsum",
  slug: "lorem-ipsum",
  name: "Lorem Ipsum",
  shortName: "Lorem Ipsum",
  family: "generators",
  pattern: "generate",
  status: "available",
  releaseStage: "release-ready",
  releasePlatforms: ["web", "browser-extension", "vscode-extension"],
  description: "Generate deterministic lorem ipsum content locally.",
  keywords: ["lorem", "ipsum", "placeholder", "text"],
  designFrame: "Lorem Ipsum (J65Q8)",
  platforms: {
    web: {
      status: "available",
      capabilities: ["generate-value", "clipboard-write", "file-export"],
    },
    "browser-extension": {
      status: "available",
      capabilities: ["generate-value", "clipboard-write", "file-export"],
    },
    "vscode-extension": {
      status: "available",
      capabilities: ["generate-value", "clipboard-write", "file-export", "active-editor"],
    },
  },
} as const);

export const randomPortTool = defineTool({
  id: "random-port",
  slug: "random-port",
  name: "Random Port",
  shortName: "Random Port",
  family: "generators",
  pattern: "generate",
  status: "available",
  releaseStage: "release-ready",
  releasePlatforms: ["web", "browser-extension", "vscode-extension"],
  description: "Generate valid random TCP/UDP port numbers locally.",
  keywords: ["random", "port", "network", "tcp", "udp"],
  designFrame: "Random Port (yahX9)",
  platforms: {
    web: {
      status: "available",
      capabilities: ["generate-value", "clipboard-write", "file-export"],
    },
    "browser-extension": {
      status: "available",
      capabilities: ["generate-value", "clipboard-write", "file-export"],
    },
    "vscode-extension": {
      status: "available",
      capabilities: ["generate-value", "clipboard-write", "file-export", "active-editor"],
    },
  },
} as const);

export const randomNumberTool = defineTool({
  id: "random-number",
  slug: "random-number",
  name: "Random Number",
  shortName: "Random Number",
  family: "generators",
  pattern: "generate",
  status: "available",
  releaseStage: "release-ready",
  releasePlatforms: ["web", "browser-extension", "vscode-extension"],
  description: "Generate cryptographically secure random numbers locally.",
  keywords: ["random", "number", "secure", "integer"],
  designFrame: "Random Number (a1wdtS)",
  platforms: {
    web: {
      status: "available",
      capabilities: ["generate-value", "clipboard-write", "file-export"],
    },
    "browser-extension": {
      status: "available",
      capabilities: ["generate-value", "clipboard-write", "file-export"],
    },
    "vscode-extension": {
      status: "available",
      capabilities: ["generate-value", "clipboard-write", "file-export", "active-editor"],
    },
  },
} as const);

export const generatorTools = [
  uuidIdTool,
  nanoidGeneratorTool,
  ulidGeneratorTool,
  objectidGeneratorTool,
  mockDataTool,
  qrCodeTool,
  loremIpsumTool,
  randomPortTool,
  randomNumberTool,
] as const satisfies readonly ToolDefinition[];
