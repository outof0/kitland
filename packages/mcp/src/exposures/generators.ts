import {
  generateLoremIpsum,
  generateMockData,
  generateNanoid,
  generateObjectId,
  generateRandomNumbers,
  generateRandomPorts,
  generateUlid,
  generateUuidV4,
  NANOID_DEFAULT_ALPHABET,
  ok,
  validateQrPayload,
  type LoremUnit,
  type MockDataRecord,
  type PortProtocol,
  type PortRange,
  type QrCodeValidation,
  type RandomNumberResult,
  type RandomPortResult,
  type ToolResult,
} from "@kitland/core";
import {
  buildAdvertisedOutputSchema,
  DEFAULT_MCP_LIMITS,
  DEFAULT_MCP_SAFETY,
  type McpExposure,
} from "../contracts.ts";
import { createMcpError, type McpErrorPayload } from "../errors.ts";

function mapError(code: string, _message: string): McpErrorPayload {
  if (code === "INPUT_TOO_LARGE") {
    return createMcpError("INPUT_TOO_LARGE", "Input text exceeds the maximum allowed size.");
  }
  return createMcpError(
    "INVALID_INPUT",
    "The operation could not be completed. Check the input format.",
  );
}

function getRandomBytes(length: number): Uint8Array {
  const bytes = new Uint8Array(length);
  globalThis.crypto.getRandomValues(bytes);
  return bytes;
}

function getRandomUint32(): number {
  const bytes = new Uint8Array(4);
  globalThis.crypto.getRandomValues(bytes);
  return ((bytes[0]! << 24) | (bytes[1]! << 16) | (bytes[2]! << 8) | bytes[3]!) >>> 0;
}

// ---------------------------------------------------------------------------
// UUID / ID
// ---------------------------------------------------------------------------

type UuidGenerateInput = {
  readonly uppercase?: boolean;
};

type UuidGenerateOutput = {
  readonly uuid: string;
  readonly version: string;
};

const UUID_GENERATE_INPUT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    uppercase: { type: "boolean", description: "Whether to return uppercase UUID." },
  },
} as const;

const UUID_GENERATE_SUCCESS_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["uuid", "version"],
  properties: {
    uuid: { type: "string", description: "Generated canonical UUID v4." },
    version: { type: "string" },
  },
} as const;

export const kitlandUuidGenerateExposure: McpExposure<UuidGenerateInput, UuidGenerateOutput> = {
  mcpName: "kitland_uuid_generate",
  operationId: "uuid_generate",
  contractVersion: 1,
  registryToolId: "uuid-id",
  title: "UUID Generator",
  description: "Generate cryptographically random RFC 4122 Version 4 UUIDs.",
  inputSchema: UUID_GENERATE_INPUT_SCHEMA,
  outputSchema: buildAdvertisedOutputSchema(UUID_GENERATE_SUCCESS_SCHEMA),
  successSchema: UUID_GENERATE_SUCCESS_SCHEMA,
  limits: DEFAULT_MCP_LIMITS,
  safety: DEFAULT_MCP_SAFETY,
  invoke: (args: UuidGenerateInput): ToolResult<UuidGenerateOutput> => {
    const res = generateUuidV4(getRandomBytes);
    if (!res.ok) return res;
    const uuid = args.uppercase ? res.value.toUpperCase() : res.value;
    return ok({ uuid, version: "v4" });
  },
  mapCoreError: mapError,
};

// ---------------------------------------------------------------------------
// NanoID Generator
// ---------------------------------------------------------------------------

type NanoidGenerateInput = {
  readonly length?: number;
  readonly alphabet?: string;
};

type NanoidGenerateOutput = {
  readonly id: string;
  readonly length: number;
};

const NANOID_GENERATE_INPUT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    length: { type: "integer", minimum: 1, maximum: 256, description: "ID length (default 21)." },
    alphabet: { type: "string", description: "Custom alphabet characters (default URL-safe)." },
  },
} as const;

const NANOID_GENERATE_SUCCESS_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["id", "length"],
  properties: {
    id: { type: "string", description: "Generated NanoID string." },
    length: { type: "integer" },
  },
} as const;

export const kitlandNanoidGenerateExposure: McpExposure<NanoidGenerateInput, NanoidGenerateOutput> =
  {
    mcpName: "kitland_nanoid_generate",
    operationId: "nanoid_generate",
    contractVersion: 1,
    registryToolId: "nanoid-generator",
    title: "NanoID Generator",
    description: "Generate compact, secure URL-friendly unique IDs.",
    inputSchema: NANOID_GENERATE_INPUT_SCHEMA,
    outputSchema: buildAdvertisedOutputSchema(NANOID_GENERATE_SUCCESS_SCHEMA),
    successSchema: NANOID_GENERATE_SUCCESS_SCHEMA,
    limits: DEFAULT_MCP_LIMITS,
    safety: DEFAULT_MCP_SAFETY,
    invoke: (args: NanoidGenerateInput): ToolResult<NanoidGenerateOutput> => {
      const length = args.length ?? 21;
      const alphabet = args.alphabet ?? NANOID_DEFAULT_ALPHABET;
      const res = generateNanoid({ length, alphabet }, getRandomBytes);
      if (!res.ok) return res;
      return ok({ id: res.value, length });
    },
    mapCoreError: mapError,
  };

// ---------------------------------------------------------------------------
// ULID Generator
// ---------------------------------------------------------------------------

type UlidGenerateInput = {
  readonly timestamp?: number;
};

type UlidGenerateOutput = {
  readonly ulid: string;
  readonly timestamp: number;
};

const ULID_GENERATE_INPUT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    timestamp: {
      type: "integer",
      minimum: 0,
      maximum: 281474976710655,
      description: "Unix epoch millisecond timestamp (default Date.now()).",
    },
  },
} as const;

const ULID_GENERATE_SUCCESS_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["ulid", "timestamp"],
  properties: {
    ulid: { type: "string", description: "26-character Crockford Base32 ULID." },
    timestamp: { type: "integer" },
  },
} as const;

export const kitlandUlidGenerateExposure: McpExposure<UlidGenerateInput, UlidGenerateOutput> = {
  mcpName: "kitland_ulid_generate",
  operationId: "ulid_generate",
  contractVersion: 1,
  registryToolId: "ulid-generator",
  title: "ULID Generator",
  description:
    "Generate 128-bit sortable Universally Unique Lexicographically Sortable Identifiers.",
  inputSchema: ULID_GENERATE_INPUT_SCHEMA,
  outputSchema: buildAdvertisedOutputSchema(ULID_GENERATE_SUCCESS_SCHEMA),
  successSchema: ULID_GENERATE_SUCCESS_SCHEMA,
  limits: DEFAULT_MCP_LIMITS,
  safety: DEFAULT_MCP_SAFETY,
  invoke: (args: UlidGenerateInput): ToolResult<UlidGenerateOutput> => {
    const timestamp = args.timestamp ?? Date.now();
    const res = generateUlid(timestamp, getRandomBytes);
    if (!res.ok) return res;
    return ok({ ulid: res.value, timestamp });
  },
  mapCoreError: mapError,
};

// ---------------------------------------------------------------------------
// ObjectID Generator
// ---------------------------------------------------------------------------

type ObjectIdGenerateInput = {
  readonly timestampSeconds?: number;
};

type ObjectIdGenerateOutput = {
  readonly id: string;
  readonly timestamp: string;
  readonly counter: number;
};

const OBJECTID_GENERATE_INPUT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    timestampSeconds: {
      type: "integer",
      minimum: 0,
      maximum: 4294967295,
      description: "Unix epoch second timestamp (default current second).",
    },
  },
} as const;

const OBJECTID_GENERATE_SUCCESS_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["id", "timestamp", "counter"],
  properties: {
    id: { type: "string", description: "24-character hexadecimal MongoDB ObjectID." },
    timestamp: { type: "string", description: "ISO timestamp." },
    counter: { type: "integer" },
  },
} as const;

export const kitlandObjectIdGenerateExposure: McpExposure<
  ObjectIdGenerateInput,
  ObjectIdGenerateOutput
> = {
  mcpName: "kitland_objectid_generate",
  operationId: "objectid_generate",
  contractVersion: 1,
  registryToolId: "objectid-generator",
  title: "ObjectID Generator",
  description: "Generate 12-byte MongoDB-compatible ObjectID hexadecimal identifiers.",
  inputSchema: OBJECTID_GENERATE_INPUT_SCHEMA,
  outputSchema: buildAdvertisedOutputSchema(OBJECTID_GENERATE_SUCCESS_SCHEMA),
  successSchema: OBJECTID_GENERATE_SUCCESS_SCHEMA,
  limits: DEFAULT_MCP_LIMITS,
  safety: DEFAULT_MCP_SAFETY,
  invoke: (args: ObjectIdGenerateInput): ToolResult<ObjectIdGenerateOutput> => {
    const ts = args.timestampSeconds ?? Math.floor(Date.now() / 1000);
    const counter = getRandomUint32() & 0xffffff;
    const res = generateObjectId(ts, counter, getRandomBytes);
    if (!res.ok) return res;
    return ok({
      id: res.value.value,
      timestamp: res.value.timestamp.toISOString(),
      counter: res.value.counter,
    });
  },
  mapCoreError: mapError,
};

// ---------------------------------------------------------------------------
// Mock Data Generator
// ---------------------------------------------------------------------------

type MockDataGenerateInput = {
  readonly count?: number;
  readonly includeId?: boolean;
  readonly includeName?: boolean;
  readonly includeEmail?: boolean;
  readonly includeRole?: boolean;
};

type MockDataGenerateOutput = {
  readonly records: readonly MockDataRecord[];
  readonly count: number;
};

const MOCK_DATA_GENERATE_INPUT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    count: {
      type: "integer",
      minimum: 1,
      maximum: 1000,
      description: "Number of rows (default 5).",
    },
    includeId: { type: "boolean", description: "Include unique ID field (default true)." },
    includeName: { type: "boolean", description: "Include full name field (default true)." },
    includeEmail: { type: "boolean", description: "Include email address field (default true)." },
    includeRole: { type: "boolean", description: "Include role field (default true)." },
  },
} as const;

const MOCK_DATA_GENERATE_SUCCESS_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["records", "count"],
  properties: {
    records: {
      type: "array",
      items: { type: "object", additionalProperties: { type: "string" } },
    },
    count: { type: "integer" },
  },
} as const;

export const kitlandMockDataGenerateExposure: McpExposure<
  MockDataGenerateInput,
  MockDataGenerateOutput
> = {
  mcpName: "kitland_mock_data_generate",
  operationId: "mock_data_generate",
  contractVersion: 1,
  registryToolId: "mock-data",
  title: "Mock Data Generator",
  description: "Generate structured fixture records locally for mock API data and testing.",
  inputSchema: MOCK_DATA_GENERATE_INPUT_SCHEMA,
  outputSchema: buildAdvertisedOutputSchema(MOCK_DATA_GENERATE_SUCCESS_SCHEMA),
  successSchema: MOCK_DATA_GENERATE_SUCCESS_SCHEMA,
  limits: DEFAULT_MCP_LIMITS,
  safety: DEFAULT_MCP_SAFETY,
  invoke: (args: MockDataGenerateInput): ToolResult<MockDataGenerateOutput> => {
    const count = args.count ?? 5;
    const res = generateMockData(
      {
        count,
        includeId: args.includeId ?? true,
        includeName: args.includeName ?? true,
        includeEmail: args.includeEmail ?? true,
        includeRole: args.includeRole ?? true,
      },
      getRandomBytes,
    );
    if (!res.ok) return res;
    return ok({ records: res.value, count });
  },
  mapCoreError: mapError,
};

// ---------------------------------------------------------------------------
// QR Code Validator
// ---------------------------------------------------------------------------

type QrCodeInput = {
  readonly payload: string;
};

const QR_CODE_INPUT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["payload"],
  properties: {
    payload: { type: "string", description: "Payload text or URL to validate for QR encoding." },
  },
} as const;

const QR_CODE_SUCCESS_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["input", "length", "isValid"],
  properties: {
    input: { type: "string" },
    length: { type: "integer" },
    isValid: { type: "boolean" },
  },
} as const;

type QrCodeOutput = QrCodeValidation & { isValid: boolean };

export const kitlandQrCodeValidateExposure: McpExposure<QrCodeInput, QrCodeOutput> = {
  mcpName: "kitland_qr_code_validate",
  operationId: "qr_code_validate",
  contractVersion: 1,
  registryToolId: "qr-code",
  title: "QR Code Payload Validator",
  description: "Validate QR code payload length and text viability.",
  inputSchema: QR_CODE_INPUT_SCHEMA,
  outputSchema: buildAdvertisedOutputSchema(QR_CODE_SUCCESS_SCHEMA),
  successSchema: QR_CODE_SUCCESS_SCHEMA,
  limits: DEFAULT_MCP_LIMITS,
  safety: DEFAULT_MCP_SAFETY,
  invoke: (args: QrCodeInput): ToolResult<QrCodeOutput> => {
    const res = validateQrPayload(args.payload);
    if (!res.ok) return res;
    return ok({ input: res.value.input, length: res.value.length, isValid: true });
  },
  mapCoreError: mapError,
};

// ---------------------------------------------------------------------------
// Lorem Ipsum Generator
// ---------------------------------------------------------------------------

type LoremIpsumInput = {
  readonly amount?: number;
  readonly unit?: "paragraphs" | "words" | "bytes" | "list-items";
  readonly startWithClassic?: boolean;
};

type LoremIpsumOutput = {
  readonly output: string;
  readonly amount: number;
  readonly unit: string;
};

const LOREM_IPSUM_INPUT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    amount: { type: "integer", minimum: 1, maximum: 10000, description: "Quantity (default 1)." },
    unit: {
      type: "string",
      enum: ["paragraphs", "words", "bytes", "list-items"],
      description: "Unit of generation (default 'paragraphs').",
    },
    startWithClassic: {
      type: "boolean",
      description: "Start with classic 'Lorem ipsum...' opening (default true).",
    },
  },
} as const;

const LOREM_IPSUM_SUCCESS_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["output", "amount", "unit"],
  properties: {
    output: { type: "string", description: "Generated placeholder text." },
    amount: { type: "integer" },
    unit: { type: "string" },
  },
} as const;

export const kitlandLoremIpsumGenerateExposure: McpExposure<LoremIpsumInput, LoremIpsumOutput> = {
  mcpName: "kitland_lorem_ipsum_generate",
  operationId: "lorem_ipsum_generate",
  contractVersion: 1,
  registryToolId: "lorem-ipsum",
  title: "Lorem Ipsum Generator",
  description: "Generate deterministic placeholder text by paragraphs, words, or list items.",
  inputSchema: LOREM_IPSUM_INPUT_SCHEMA,
  outputSchema: buildAdvertisedOutputSchema(LOREM_IPSUM_SUCCESS_SCHEMA),
  successSchema: LOREM_IPSUM_SUCCESS_SCHEMA,
  limits: DEFAULT_MCP_LIMITS,
  safety: DEFAULT_MCP_SAFETY,
  invoke: (args: LoremIpsumInput): ToolResult<LoremIpsumOutput> => {
    const amount = args.amount ?? 1;
    const unit: LoremUnit = args.unit ?? "paragraphs";
    const res = generateLoremIpsum({
      amount,
      unit,
      startWithClassic: args.startWithClassic ?? true,
    });
    if (!res.ok) return res;
    return ok({ output: res.value, amount, unit });
  },
  mapCoreError: mapError,
};

// ---------------------------------------------------------------------------
// Random Port Generator
// ---------------------------------------------------------------------------

type RandomPortInput = {
  readonly count?: number;
  readonly range?: "dynamic" | "ephemeral" | "custom";
  readonly protocol?: "tcp" | "udp";
  readonly min?: number;
  readonly max?: number;
};

const RANDOM_PORT_INPUT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    count: {
      type: "integer",
      minimum: 1,
      maximum: 100,
      description: "Number of ports (default 1).",
    },
    range: {
      type: "string",
      enum: ["dynamic", "ephemeral", "custom"],
      description: "Port range: 'dynamic' (1024-65535), 'ephemeral' (49152-65535), 'custom'.",
    },
    protocol: { type: "string", enum: ["tcp", "udp"], description: "Protocol (default 'tcp')." },
    min: { type: "integer", minimum: 1, maximum: 65535, description: "Custom range min." },
    max: { type: "integer", minimum: 1, maximum: 65535, description: "Custom range max." },
  },
} as const;

const RANDOM_PORT_SUCCESS_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["ports", "protocol", "min", "max"],
  properties: {
    ports: { type: "array", items: { type: "integer" } },
    protocol: { type: "string", enum: ["tcp", "udp"] },
    min: { type: "integer" },
    max: { type: "integer" },
  },
} as const;

export const kitlandRandomPortGenerateExposure: McpExposure<RandomPortInput, RandomPortResult> = {
  mcpName: "kitland_random_port_generate",
  operationId: "random_port_generate",
  contractVersion: 1,
  registryToolId: "random-port",
  title: "Random Port Generator",
  description: "Pick unique random TCP or UDP port numbers from secure entropy.",
  inputSchema: RANDOM_PORT_INPUT_SCHEMA,
  outputSchema: buildAdvertisedOutputSchema(RANDOM_PORT_SUCCESS_SCHEMA),
  successSchema: RANDOM_PORT_SUCCESS_SCHEMA,
  limits: DEFAULT_MCP_LIMITS,
  safety: DEFAULT_MCP_SAFETY,
  invoke: (args: RandomPortInput): ToolResult<RandomPortResult> => {
    const range: PortRange = args.range ?? "dynamic";
    const protocol: PortProtocol = args.protocol ?? "tcp";
    const count = args.count ?? 1;
    return generateRandomPorts(
      {
        range,
        protocol,
        count,
        ...(args.min !== undefined ? { min: args.min } : {}),
        ...(args.max !== undefined ? { max: args.max } : {}),
      },
      getRandomUint32,
    );
  },
  mapCoreError: mapError,
};

// ---------------------------------------------------------------------------
// Random Number Generator
// ---------------------------------------------------------------------------

type RandomNumberInput = {
  readonly from?: number;
  readonly to?: number;
  readonly count?: number;
  readonly decimals?: number;
};

const RANDOM_NUMBER_INPUT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    from: { type: "number", description: "Range minimum (default 0)." },
    to: { type: "number", description: "Range maximum (default 100)." },
    count: {
      type: "integer",
      minimum: 1,
      maximum: 100,
      description: "Count of values (default 1).",
    },
    decimals: {
      type: "integer",
      minimum: 0,
      maximum: 6,
      description: "Decimal places (0 for integers, default 0).",
    },
  },
} as const;

const RANDOM_NUMBER_SUCCESS_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["values", "decimals"],
  properties: {
    values: { type: "array", items: { type: "number" } },
    decimals: { type: "integer" },
  },
} as const;

export const kitlandRandomNumberGenerateExposure: McpExposure<
  RandomNumberInput,
  RandomNumberResult
> = {
  mcpName: "kitland_random_number_generate",
  operationId: "random_number_generate",
  contractVersion: 1,
  registryToolId: "random-number",
  title: "Random Number Generator",
  description: "Generate cryptographically secure random numbers within a bounded range.",
  inputSchema: RANDOM_NUMBER_INPUT_SCHEMA,
  outputSchema: buildAdvertisedOutputSchema(RANDOM_NUMBER_SUCCESS_SCHEMA),
  successSchema: RANDOM_NUMBER_SUCCESS_SCHEMA,
  limits: DEFAULT_MCP_LIMITS,
  safety: DEFAULT_MCP_SAFETY,
  invoke: (args: RandomNumberInput): ToolResult<RandomNumberResult> => {
    return generateRandomNumbers(
      {
        from: args.from ?? 0,
        to: args.to ?? 100,
        count: args.count ?? 1,
        decimals: args.decimals ?? 0,
      },
      getRandomUint32,
    );
  },
  mapCoreError: mapError,
};

export const GENERATOR_EXPOSURES = [
  kitlandUuidGenerateExposure,
  kitlandNanoidGenerateExposure,
  kitlandUlidGenerateExposure,
  kitlandObjectIdGenerateExposure,
  kitlandMockDataGenerateExposure,
  kitlandQrCodeValidateExposure,
  kitlandLoremIpsumGenerateExposure,
  kitlandRandomPortGenerateExposure,
  kitlandRandomNumberGenerateExposure,
] as const;
