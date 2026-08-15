import { calculateIpv4Subnet } from "@kitland/core";
import { Network } from "lucide-react";
import { useMemo, useState } from "react";
import { useCopyFeedback } from "../hooks/useCopyFeedback";
import {
  FieldLabel,
  FormPanel,
  NoteText,
  ResultHead,
  ResultPanel,
  ResultRow,
  RunButton,
  SampleAction,
  StatusBar,
  ToolHeader,
  ValueInput,
} from "../components/tool-form";

const SAMPLE = "192.168.1.42/24";

export function IpSubnetCalculatorTool() {
  const [cidr, setCidr] = useState(SAMPLE);
  const { isCopied, copy } = useCopyFeedback();

  const result = useMemo(() => calculateIpv4Subnet(cidr), [cidr]);
  const errorMessage = result.ok ? null : result.error.message;

  const info = result.ok
    ? (() => {
        const prefix = Number(result.value.networkCidr.split("/")[1]);
        const totalHosts =
          prefix >= 31 ? Number(result.value.usableHosts) : Number(result.value.usableHosts) + 2;
        const kind = classifyAddress(result.value.networkAddress);
        return {
          prefix,
          totalHosts,
          kind,
          kindLabel: kindLabel(kind),
          binary: result.value.ipAddress
            .split(".")
            .map((octet) => Number(octet).toString(2).padStart(8, "0"))
            .join(" "),
        };
      })()
    : null;

  const rows =
    result.ok && info
      ? [
          { label: "Network", value: result.value.networkCidr },
          { label: "Broadcast", value: result.value.broadcastAddress },
          { label: "Usable Range", value: `${result.value.firstHost} – ${result.value.lastHost}` },
          { label: "Netmask", value: `${result.value.subnetMask} /${info.prefix}` },
          { label: "Total Hosts", value: info.totalHosts.toLocaleString() },
          { label: "Classifier", value: info.kindLabel },
        ]
      : null;

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-4 font-ui">
      <ToolHeader
        icon={Network}
        title="IP Subnet Calculator"
        subtitle="Calculate IPv4 network ranges, masks, broadcasts, and usable host counts locally."
        actions={<SampleAction onClick={() => setCidr(SAMPLE)} />}
      />

      {!result.ok && (
        <div
          role="alert"
          className="bg-danger-soft border border-danger/40 rounded-[10px] px-3.5 py-2 text-[12px] text-danger"
        >
          {errorMessage}
        </div>
      )}

      <div className="flex min-h-0 flex-1 flex-col gap-4 lg:flex-row">
        <FormPanel width={340}>
          <FieldLabel>CIDR Notation</FieldLabel>
          <div className="flex flex-col gap-1.5 rounded-[10px] bg-surface p-3">
            <ValueInput
              value={cidr}
              onChange={setCidr}
              ariaLabel="IP address with CIDR"
              placeholder="192.168.1.42/24"
            />
            <span className="text-[11px] text-on-muted">IPv4 CIDR or IPv6</span>
          </div>
          <div className="flex-1" />
          <RunButton onClick={() => setCidr(cidr.trim() || SAMPLE)}>Calculate</RunButton>
          <NoteText>
            192.168.x is a private IP range (RFC 1918). Everything is computed locally — nothing is
            sent anywhere.
          </NoteText>
        </FormPanel>

        <ResultPanel>
          {result.ok && rows && info ? (
            <>
              <ResultHead
                title={`${result.value.networkAddress} / ${info.prefix}`}
                subtitle={`${info.kind} • IPv4 • ${Number(result.value.usableHosts).toLocaleString()}`}
                onCopy={() => void copy("net", result.value.networkCidr)}
                copied={isCopied("net")}
                filled
              />
              <div className="flex flex-col gap-2 rounded-[12px] bg-bg-elevated p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="min-w-0 break-all font-mono text-[24px] font-bold text-on-surface">
                    {result.value.ipAddress}
                  </span>
                  <span className="shrink-0 rounded-full bg-primary-soft px-2.5 py-1 text-[11px] font-semibold text-primary">
                    HOST
                  </span>
                </div>
                <span className="break-all font-mono text-[11px] text-on-faint">{info.binary}</span>
                <span className="font-mono text-[11px] text-on-faint">
                  network {info.prefix} bits
                </span>
              </div>
              <div className="flex flex-col gap-2">
                {rows.map((row) => (
                  <ResultRow key={row.label} label={row.label} value={row.value} />
                ))}
              </div>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center text-[13px] text-danger">
              {errorMessage ?? "Enter a valid CIDR."}
            </div>
          )}
        </ResultPanel>
      </div>

      <StatusBar
        label="IP subnet status"
        chip={{ icon: Network, text: result.ok ? "Calculated" : "Invalid" }}
        stats={
          result.ok
            ? [`${result.value.networkCidr}`, `${Number(result.value.usableHosts)} hosts`, "IPv4"]
            : ["Invalid CIDR"]
        }
        lang="IP"
      />
    </div>
  );
}

function classifyAddress(networkAddress: string): "private" | "loopback" | "link-local" | "public" {
  const octets = networkAddress.split(".").map(Number);
  const [a, b = 0] = octets;
  if (a === 10) return "private";
  if (a === 172 && b >= 16 && b <= 31) return "private";
  if (a === 192 && b === 168) return "private";
  if (a === 127) return "loopback";
  if (a === 169 && b === 254) return "link-local";
  return "public";
}

function kindLabel(kind: "private" | "loopback" | "link-local" | "public"): string {
  switch (kind) {
    case "private":
      return "Private (RFC 1918)";
    case "loopback":
      return "Loopback (127.0.0.0/8)";
    case "link-local":
      return "Link-local (169.254.0.0/16)";
    default:
      return "Public";
  }
}
