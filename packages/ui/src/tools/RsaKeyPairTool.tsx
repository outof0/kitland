import { useCopyFeedback } from "../hooks/useCopyFeedback";
import { pem, validateRsaOptions } from "@kitland/core";
import { downloadText } from "../lib/clipboard";
import { Check, CircleCheck, Copy, Download, FileInput, Key } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import {
  FieldLabel,
  FormPanel,
  ResultCard,
  ResultHead,
  ResultPanel,
  RunButton,
  StatusBar,
  ToolHeader,
} from "../components/tool-form";

const BIT_OPTIONS: readonly (2048 | 3072 | 4096)[] = [2048, 3072, 4096];

/**
 * RSA Key Pair tool matching design.pen frame `Oi5nT` (RSA Key Pair).
 */
export function RsaKeyPairTool() {
  const [bits, setBits] = useState<2048 | 3072 | 4096>(2048);
  const [pub, setPub] = useState("");
  const [priv, setPriv] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const { isCopied, copy } = useCopyFeedback();

  const generate = useCallback(
    async (keyBits: number = bits) => {
      const v = validateRsaOptions(keyBits);
      if (!v.ok) {
        setError(v.error.message);
        return;
      }
      setBusy(true);
      setError(null);
      try {
        const c = globalThis.crypto?.subtle;
        if (!c) throw new Error("Web Crypto is unavailable.");
        const pair = await c.generateKey(
          {
            name: "RSA-OAEP",
            modulusLength: keyBits,
            publicExponent: new Uint8Array([1, 0, 1]),
            hash: "SHA-256",
          },
          true,
          ["encrypt", "decrypt"],
        );
        setPub(pem("PUBLIC KEY", await c.exportKey("spki", pair.publicKey)));
        setPriv(pem("PRIVATE KEY", await c.exportKey("pkcs8", pair.privateKey)));
      } catch {
        setError("RSA key generation is unavailable in this browser.");
      } finally {
        setBusy(false);
      }
    },
    [bits],
  );

  useEffect(() => {
    void generate(bits);
  }, [bits, generate]);

  const onDownloadPub = useCallback(() => {
    if (!pub) return;
    downloadText("public_key.pem", pub);
  }, [pub]);

  const onDownloadPriv = useCallback(() => {
    if (!priv) return;
    downloadText("private_key.pem", priv);
  }, [priv]);

  const onSample = useCallback(() => {
    setBits(2048);
  }, []);

  const statusLabel = busy ? "Generating" : error ? "Error" : pub ? "Generated" : "Ready";

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-4 font-ui">
      {/* Tool Header */}
      <ToolHeader
        icon={Key}
        title="RSA Key Pair"
        subtitle="Generate RSA key pairs"
        actions={
          <button
            type="button"
            onClick={onSample}
            className="flex h-[34px] cursor-pointer items-center gap-[7px] rounded-[8px] border border-outline bg-surface-low px-3 text-[13px] font-semibold text-on-surface transition-colors hover:bg-surface hover:border-outline-strong"
          >
            <FileInput className="size-[15px] text-on-muted" />
            <span>Sample</span>
          </button>
        }
      />

      {/* Main Workspace */}
      <div className="flex min-h-0 flex-1 flex-col gap-4 lg:flex-row">
        {/* Form Panel */}
        <FormPanel width={300}>
          <FieldLabel>KEY PARAMS</FieldLabel>

          {/* Bits */}
          <div className="box-border flex h-[32px] w-full shrink-0 flex-row items-center justify-between gap-2 rounded-[9px] border border-outline bg-surface px-3">
            <span className="text-[13px] font-normal text-on-muted">Modulus Size</span>
            <select
              aria-label="Modulus size"
              value={bits}
              onChange={(e) => setBits(Number(e.target.value) as 2048 | 3072 | 4096)}
              className="cursor-pointer bg-transparent text-right font-mono text-[12px] text-on-surface outline-none"
            >
              {BIT_OPTIONS.map((b) => (
                <option key={b} value={b} className="bg-surface text-on-surface">
                  {b} bits
                </option>
              ))}
            </select>
          </div>

          {/* Exponent */}
          <div className="box-border flex h-[32px] w-full shrink-0 flex-row items-center justify-between gap-2 rounded-[9px] border border-outline bg-surface px-3">
            <span className="text-[13px] font-normal text-on-muted">Exponent</span>
            <span className="font-mono text-[12px] text-on-surface">65537 (0x10001)</span>
          </div>

          {/* Format */}
          <div className="box-border flex h-[32px] w-full shrink-0 flex-row items-center justify-between gap-2 rounded-[9px] border border-outline bg-surface px-3">
            <span className="text-[13px] font-normal text-on-muted">Format</span>
            <span className="font-mono text-[12px] text-on-surface">PKCS#8 / SPKI</span>
          </div>

          {/* Run Action */}
          <RunButton onClick={() => void generate(bits)} disabled={busy}>
            {busy ? "Generating..." : "Generate Key Pair"}
          </RunButton>

          <p className="m-0 text-[11px] leading-relaxed text-on-faint">
            RSA-OAEP • SHA-256 • Keep the private key secret.
          </p>
        </FormPanel>

        {/* Result Panel */}
        <ResultPanel>
          <ResultHead
            title="Generated Key Pair"
            subtitle={`RSA-${bits} • PEM formatted`}
            onCopy={() => void copy("all", `${pub}\n\n${priv}`)}
            copied={isCopied("all")}
            filled
            copyLabel="Copy All"
          />

          {error ? (
            <ResultCard>
              <div className="font-mono text-[13px] text-error" role="alert">
                {error}
              </div>
            </ResultCard>
          ) : (
            <div className="flex flex-col gap-3">
              {/* Public Key Card */}
              <div className="flex flex-col gap-2 rounded-[12px] bg-bg-elevated p-3.5">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-on-muted">
                    Public Key (SPKI)
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={onDownloadPub}
                      className="flex h-[26px] cursor-pointer items-center gap-1 rounded-[5px] border border-outline bg-surface px-2 text-[11px] font-semibold text-on-surface transition-colors hover:bg-surface-low"
                    >
                      <Download className="size-3 text-on-muted" />
                      <span>.pem</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => void copy("pub", pub)}
                      aria-label={isCopied("pub") ? "Copied Public Key" : "Copy Public Key"}
                      title={isCopied("pub") ? "Copied Public Key" : "Copy Public Key"}
                      className={`size-[26px] cursor-pointer rounded-[6px] flex items-center justify-center transition-colors ${
                        isCopied("pub")
                          ? "bg-success-soft text-success border border-success/40"
                          : "text-on-muted hover:text-on-surface hover:bg-surface border border-transparent hover:border-outline"
                      }`}
                    >
                      {isCopied("pub") ? (
                        <Check className="size-3.5 text-success" aria-hidden="true" />
                      ) : (
                        <Copy className="size-3.5" aria-hidden="true" />
                      )}
                    </button>
                  </div>
                </div>
                <textarea
                  readOnly
                  value={pub}
                  rows={4}
                  className="w-full resize-none rounded-[8px] border border-outline bg-surface p-2 font-mono text-[11px] leading-snug text-on-surface outline-none"
                />
              </div>

              {/* Private Key Card */}
              <div className="flex flex-col gap-2 rounded-[12px] bg-bg-elevated p-3.5">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-on-muted">
                    Private Key (PKCS#8)
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={onDownloadPriv}
                      className="flex h-[26px] cursor-pointer items-center gap-1 rounded-[5px] border border-outline bg-surface px-2 text-[11px] font-semibold text-on-surface transition-colors hover:bg-surface-low"
                    >
                      <Download className="size-3 text-on-muted" />
                      <span>.pem</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => void copy("priv", priv)}
                      aria-label={isCopied("priv") ? "Copied Private Key" : "Copy Private Key"}
                      title={isCopied("priv") ? "Copied Private Key" : "Copy Private Key"}
                      className={`size-[26px] cursor-pointer rounded-[6px] flex items-center justify-center transition-colors ${
                        isCopied("priv")
                          ? "bg-success-soft text-success border border-success/40"
                          : "text-on-muted hover:text-on-surface hover:bg-surface border border-transparent hover:border-outline"
                      }`}
                    >
                      {isCopied("priv") ? (
                        <Check className="size-3.5 text-success" aria-hidden="true" />
                      ) : (
                        <Copy className="size-3.5" aria-hidden="true" />
                      )}
                    </button>
                  </div>
                </div>
                <textarea
                  readOnly
                  value={priv}
                  rows={6}
                  className="w-full resize-none rounded-[8px] border border-outline bg-surface p-2 font-mono text-[11px] leading-snug text-on-surface outline-none"
                />
              </div>
            </div>
          )}
        </ResultPanel>
      </div>

      {/* Status Bar */}
      <StatusBar
        label="RSA Key Pair status"
        chip={{ icon: CircleCheck, text: statusLabel }}
        stats={[`RSA-${bits}`, "PKCS#8 / SPKI", "Web Crypto"]}
        lang="RSA"
      />
    </div>
  );
}
