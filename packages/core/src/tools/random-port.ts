import { err, ok, type ToolResult } from "../result";

export const RANDOM_PORT_MAX_COUNT = 100;
export type SecureRandomUint32 = () => number;
export type PortProtocol = "tcp" | "udp";
export type PortRange = "dynamic" | "ephemeral" | "custom";
export type RandomPortOptions = {
  range?: PortRange;
  protocol?: PortProtocol;
  count?: number;
  min?: number;
  max?: number;
};
export type RandomPortResult = {
  ports: number[];
  protocol: PortProtocol;
  min: number;
  max: number;
};

const RANGE_LIMITS: Record<Exclude<PortRange, "custom">, readonly [number, number]> = {
  dynamic: [1024, 65535],
  ephemeral: [49152, 65535],
};

/**
 * Pick unique TCP/UDP port numbers from an explicit range using injected secure
 * entropy. A number being generated does not mean it is free on the host.
 */
export function generateRandomPorts(
  options: RandomPortOptions,
  randomUint32: SecureRandomUint32,
): ToolResult<RandomPortResult> {
  const range = options.range ?? "dynamic";
  const protocol = options.protocol ?? "tcp";
  const count = options.count ?? 1;
  if (protocol !== "tcp" && protocol !== "udp") {
    return err("INVALID_PROTOCOL", "Protocol must be TCP or UDP.");
  }
  if (!Number.isInteger(count) || count < 1 || count > RANDOM_PORT_MAX_COUNT) {
    return err("INVALID_COUNT", `Count must be a whole number from 1 to ${RANDOM_PORT_MAX_COUNT}.`);
  }

  const limits = resolveRange(range, options.min, options.max);
  if (!limits.ok) return limits;
  const [min, max] = limits.value;
  if (count > max - min + 1) {
    return err("RANGE_TOO_SMALL", "The selected range cannot provide that many unique ports.");
  }

  const ports = new Set<number>();
  const maxAttempts = count * 64;
  for (let attempts = 0; ports.size < count && attempts < maxAttempts; attempts++) {
    const candidate = randomIntInclusive(min, max, randomUint32);
    if (!candidate.ok) return candidate;
    ports.add(candidate.value);
  }
  if (ports.size !== count) {
    return err(
      "ENTROPY_EXHAUSTED",
      "Secure randomness did not yield enough distinct port values. Try again.",
    );
  }

  return ok({ ports: [...ports], protocol, min, max });
}

function resolveRange(
  range: PortRange,
  min: number | undefined,
  max: number | undefined,
): ToolResult<readonly [number, number]> {
  if (range === "dynamic" || range === "ephemeral") return ok(RANGE_LIMITS[range]);
  if (range !== "custom")
    return err("INVALID_RANGE", "Choose dynamic, ephemeral, or custom range.");
  if (
    typeof min !== "number" ||
    typeof max !== "number" ||
    !Number.isInteger(min) ||
    !Number.isInteger(max) ||
    min < 1 ||
    max > 65535 ||
    min > max
  ) {
    return err(
      "INVALID_RANGE",
      "Custom ports must be whole numbers from 1 to 65,535 with a valid minimum and maximum.",
    );
  }
  return ok([min, max]);
}

function randomIntInclusive(
  min: number,
  max: number,
  randomUint32: SecureRandomUint32,
): ToolResult<number> {
  const size = max - min + 1;
  const limit = 0x1_0000_0000 - (0x1_0000_0000 % size);
  for (let attempts = 0; attempts < 32; attempts++) {
    let value: number;
    try {
      value = randomUint32();
    } catch {
      return err(
        "ENTROPY_UNAVAILABLE",
        "Secure random number generation is unavailable. Try a modern secure environment.",
      );
    }
    if (!Number.isInteger(value) || value < 0 || value > 0xffff_ffff) {
      return err("INVALID_ENTROPY", "The random source must provide an unsigned 32-bit integer.");
    }
    if (value < limit) return ok(min + (value % size));
  }
  return err(
    "ENTROPY_EXHAUSTED",
    "Secure randomness repeatedly fell outside the unbiased sampling range. Try again.",
  );
}
