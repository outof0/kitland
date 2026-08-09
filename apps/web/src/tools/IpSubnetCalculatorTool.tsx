import { Button } from "@/components/ui/button";
import { calculateIpv4Subnet } from "@kitland/core";
import { Copy, FileInput, Network, RotateCcw } from "lucide-react";
import { useMemo, useState } from "react";
import { copyText } from "@/lib/clipboard";

const SAMPLE = "192.168.1.42/24";

export function IpSubnetCalculatorTool() {
  const [cidr, setCidr] = useState(SAMPLE);
  const [copied, setCopied] = useState(false);
  const result = useMemo(() => calculateIpv4Subnet(cidr), [cidr]);

  async function copyNetwork() {
    if (!result.ok || !(await copyText(result.value.networkCidr)).ok) return;
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1_600);
  }

  return (
    <>
      <div className="tool-header">
        <div className="tool-header__icon">
          <Network />
        </div>
        <div className="tool-header__texts">
          <h2 className="tool-header__title">IP Subnet Calculator</h2>
          <p className="tool-header__subtitle">
            Calculate an IPv4 network, mask, range, and usable hosts locally.
          </p>
        </div>
        <div className="tool-header__actions">
          <Button variant="ghost" size="sm" className="tool-btn" onClick={() => setCidr(SAMPLE)}>
            <FileInput /> Sample
          </Button>
          <Button variant="ghost" size="sm" className="tool-btn" onClick={() => setCidr("")}>
            <RotateCcw /> Clear
          </Button>
        </div>
      </div>
      <output className={result.ok ? "tool-feedback" : "tool-feedback tool-feedback--error"}>
        {result.ok ? "CIDR calculation runs only in this browser." : result.error.message}
      </output>
      <section className="grid flex-1 gap-4 lg:grid-cols-[minmax(18rem,0.8fr)_minmax(22rem,1.2fr)]">
        <section className="grid content-start gap-3 rounded-[14px] border border-[var(--outline)] bg-[var(--bg-elevated)] p-[18px]">
          <label htmlFor="ipv4-cidr" className="grid gap-2 text-sm font-medium">
            IPv4 CIDR
            <input
              id="ipv4-cidr"
              value={cidr}
              onChange={(event) => setCidr(event.target.value)}
              placeholder="192.168.1.42/24"
              className="h-9 rounded-lg border border-input bg-transparent px-2.5 font-mono text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              spellCheck={false}
            />
          </label>
          <p className="m-0 text-xs leading-5 text-[var(--on-muted)]">
            IPv4 only. Prefixes /31 and /32 follow modern point-to-point and host-route semantics.
          </p>
        </section>
        <section className="grid content-start gap-3 rounded-[14px] border border-[var(--outline)] bg-[var(--surface)] p-[18px]">
          <div className="flex items-center justify-between gap-3">
            <h3 className="m-0 text-sm font-semibold">
              {result.ok ? result.value.networkCidr : "Network details"}
            </h3>
            <Button size="sm" disabled={!result.ok} onClick={() => void copyNetwork()}>
              <Copy /> {copied ? "Copied" : "Copy"}
            </Button>
          </div>
          <dl className="grid gap-px overflow-hidden rounded-xl border border-[var(--outline)] bg-[var(--outline)] sm:grid-cols-2">
            {result.ok
              ? [
                  ["IP address", result.value.ipAddress],
                  ["Subnet mask", result.value.subnetMask],
                  ["Network", result.value.networkAddress],
                  ["Broadcast", result.value.broadcastAddress],
                  ["First host", result.value.firstHost],
                  ["Last host", result.value.lastHost],
                  ["Wildcard mask", result.value.wildcardMask],
                  ["Usable hosts", result.value.usableHosts],
                ].map(([label, value]) => (
                  <div key={label} className="bg-[var(--surface)] p-3">
                    <dt className="text-xs text-[var(--on-muted)]">{label}</dt>
                    <dd className="mt-1 ml-0 font-mono text-xs break-all">{value}</dd>
                  </div>
                ))
              : null}
          </dl>
        </section>
      </section>
    </>
  );
}
