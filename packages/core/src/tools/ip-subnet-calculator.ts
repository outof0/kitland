import { err, ok, type ToolResult } from "../result";

export const IP_SUBNET_MAX_INPUT_CHARS = 64;

export type Ipv4Subnet = {
  cidr: string;
  networkCidr: string;
  ipAddress: string;
  prefixLength: number;
  networkAddress: string;
  broadcastAddress: string;
  subnetMask: string;
  wildcardMask: string;
  firstHost: string;
  lastHost: string;
  totalAddresses: string;
  usableHosts: string;
};

/** Calculate the full IPv4 network range for strict dotted-decimal CIDR input. */
export function calculateIpv4Subnet(source: string): ToolResult<Ipv4Subnet> {
  if (source.length > IP_SUBNET_MAX_INPUT_CHARS)
    return err("INPUT_TOO_LARGE", "The CIDR value exceeds the allowed size.");
  const [ipSource, prefixSource, extra] = source.trim().split("/");
  if (!ipSource || !prefixSource || extra !== undefined)
    return err("INVALID_CIDR", "Enter an IPv4 address and prefix, for example 192.168.1.42/24.");
  if (!/^\d+$/.test(prefixSource))
    return err("INVALID_PREFIX", "The prefix length must be a whole number from 0 to 32.");
  const prefixLength = Number(prefixSource);
  if (!Number.isInteger(prefixLength) || prefixLength < 0 || prefixLength > 32)
    return err("INVALID_PREFIX", "The prefix length must be a whole number from 0 to 32.");
  const address = parseIpv4(ipSource);
  if (!address.ok) return address;

  const mask = prefixLength === 0 ? 0 : (0xffffffff << (32 - prefixLength)) >>> 0;
  const network = (address.value & mask) >>> 0;
  const broadcast = (network | (~mask >>> 0)) >>> 0;
  const total = 2 ** (32 - prefixLength);
  const firstHost = prefixLength >= 31 ? network : (network + 1) >>> 0;
  const lastHost = prefixLength >= 31 ? broadcast : (broadcast - 1) >>> 0;
  const usable = prefixLength === 32 ? 1 : prefixLength === 31 ? 2 : total - 2;
  const ipAddress = formatIpv4(address.value);
  const networkAddress = formatIpv4(network);

  return ok({
    cidr: ipAddress + "/" + prefixLength,
    networkCidr: networkAddress + "/" + prefixLength,
    ipAddress,
    prefixLength,
    networkAddress,
    broadcastAddress: formatIpv4(broadcast),
    subnetMask: formatIpv4(mask),
    wildcardMask: formatIpv4(~mask >>> 0),
    firstHost: formatIpv4(firstHost),
    lastHost: formatIpv4(lastHost),
    totalAddresses: String(total),
    usableHosts: String(usable),
  });
}

function parseIpv4(source: string): ToolResult<number> {
  const parts = source.split(".");
  if (parts.length !== 4) return err("INVALID_IP", "Use four dotted decimal octets.");
  let value = 0;
  for (const part of parts) {
    if (!/^(0|[1-9]\d{0,2})$/.test(part))
      return err("INVALID_IP", "Each IPv4 octet must be a decimal value from 0 to 255.");
    const octet = Number(part);
    if (octet > 255)
      return err("INVALID_IP", "Each IPv4 octet must be a decimal value from 0 to 255.");
    value = (value << 8) | octet;
  }
  return ok(value >>> 0);
}

function formatIpv4(value: number): string {
  return [value >>> 24, (value >>> 16) & 255, (value >>> 8) & 255, value & 255].join(".");
}
