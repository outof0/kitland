import { describe, expect, it } from "vitest";
import { calculateIpv4Subnet } from "./ip-subnet-calculator";

describe("IPv4 subnet calculator", () => {
  it("calculates a common /24 subnet", () => {
    expect(calculateIpv4Subnet("192.168.1.42/24")).toEqual({
      ok: true,
      value: {
        cidr: "192.168.1.42/24",
        networkCidr: "192.168.1.0/24",
        ipAddress: "192.168.1.42",
        prefixLength: 24,
        networkAddress: "192.168.1.0",
        broadcastAddress: "192.168.1.255",
        subnetMask: "255.255.255.0",
        wildcardMask: "0.0.0.255",
        firstHost: "192.168.1.1",
        lastHost: "192.168.1.254",
        totalAddresses: "256",
        usableHosts: "254",
      },
    });
  });

  it("supports point-to-point and host routes", () => {
    expect(calculateIpv4Subnet("10.0.0.1/31")).toMatchObject({
      ok: true,
      value: { networkAddress: "10.0.0.0", broadcastAddress: "10.0.0.1", usableHosts: "2" },
    });
    expect(calculateIpv4Subnet("10.0.0.1/32")).toMatchObject({
      ok: true,
      value: { networkAddress: "10.0.0.1", firstHost: "10.0.0.1", usableHosts: "1" },
    });
  });

  it("rejects invalid CIDR input", () => {
    expect(calculateIpv4Subnet("192.168.001.1/24")).toMatchObject({
      ok: false,
      error: { code: "INVALID_IP" },
    });
    expect(calculateIpv4Subnet("192.168.1.1/33")).toMatchObject({
      ok: false,
      error: { code: "INVALID_PREFIX" },
    });
  });
});
