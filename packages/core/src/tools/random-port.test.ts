import { describe, expect, it } from "vitest";
import { generateRandomPorts, RANDOM_PORT_MAX_COUNT, type PortRange } from "./random-port";

function sequence(...values: number[]): () => number {
  let index = 0;
  return () => values[index++] ?? 0;
}

describe("generateRandomPorts", () => {
  it("uses deterministic injected entropy within the dynamic TCP range", () => {
    expect(generateRandomPorts({ count: 3 }, sequence(0, 1, 2))).toEqual({
      ok: true,
      value: { ports: [1024, 1025, 1026], protocol: "tcp", min: 1024, max: 65535 },
    });
  });

  it("supports the IANA ephemeral range and UDP metadata", () => {
    const result = generateRandomPorts(
      { range: "ephemeral", protocol: "udp", count: 1 },
      sequence(0),
    );
    expect(result).toEqual({
      ok: true,
      value: { ports: [49152], protocol: "udp", min: 49152, max: 65535 },
    });
  });

  it("rejection-samples instead of using modulo-biased entropy", () => {
    const result = generateRandomPorts(
      { range: "custom", min: 1, max: 10 },
      sequence(0xffff_ffff, 0),
    );
    expect(result).toEqual({ ok: true, value: { ports: [1], protocol: "tcp", min: 1, max: 10 } });
  });

  it("rejects invalid bounds, count, and entropy", () => {
    expect(generateRandomPorts({ count: RANDOM_PORT_MAX_COUNT + 1 }, sequence(0))).toMatchObject({
      ok: false,
      error: { code: "INVALID_COUNT" },
    });
    expect(generateRandomPorts({ range: "custom", min: 0, max: 2 }, sequence(0))).toMatchObject({
      ok: false,
      error: { code: "INVALID_RANGE" },
    });
    expect(generateRandomPorts({ range: "bad" as PortRange }, sequence(0))).toMatchObject({
      ok: false,
      error: { code: "INVALID_RANGE" },
    });
    expect(generateRandomPorts({}, () => -1)).toMatchObject({
      ok: false,
      error: { code: "INVALID_ENTROPY" },
    });
  });
});
