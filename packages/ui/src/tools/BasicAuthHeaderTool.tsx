import { useCopyFeedback } from "../hooks/useCopyFeedback";
import { encodeBasicAuth } from "@kitland/core";
import { LOCAL_ONLY_CAPABILITIES, type ToolCapabilities } from "../capabilities";
import { CircleCheck, FileInput, Shield } from "lucide-react";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import {
  FieldLabel,
  FormPanel,
  ResultCard,
  ResultHead,
  ResultPanel,
  ResultRow,
  Segmented,
  StatusBar,
  ToolHeader,
} from "../components/tool-form";

const SAMPLE_USER = "admin";
const SAMPLE_PASS = "sup3rS3cret";
const PREFIXES = ["Basic", "Bearer", "Digest"] as const;
type AuthPrefix = (typeof PREFIXES)[number];

export type BasicAuthHeaderToolProps = {
  readonly initialInput?: string;
  readonly capabilities?: ToolCapabilities;
};

/**
 * Basic Auth Header tool.
 */
export function BasicAuthHeaderTool({
  initialInput,
  capabilities: _capabilities = LOCAL_ONLY_CAPABILITIES,
}: BasicAuthHeaderToolProps = {}) {
  void _capabilities;
  const userId = useId();
  const passId = useId();
  const [user, setUser] = useState(SAMPLE_USER);
  const [password, setPassword] = useState(initialInput ?? SAMPLE_PASS);

  const lastInitialInputRef = useRef(initialInput);
  useEffect(() => {
    if (
      initialInput !== undefined &&
      initialInput !== "" &&
      initialInput !== lastInitialInputRef.current
    ) {
      lastInitialInputRef.current = initialInput;
      setPassword(initialInput);
    }
  }, [initialInput]);
  const [prefix, setPrefix] = useState<AuthPrefix>("Basic");
  const [header, setHeader] = useState("");
  const [error, setError] = useState<string | null>(null);
  const { isCopied, copy } = useCopyFeedback();

  useEffect(() => {
    if (!user && !password) {
      setHeader("");
      setError(null);
      return;
    }
    const r = encodeBasicAuth(user, password);
    if (r.ok) {
      if (prefix === "Basic") {
        setHeader(r.value);
      } else {
        const rawBase64 = r.value.replace(/^Basic\s+/, "");
        setHeader(`${prefix} ${rawBase64}`);
      }
      setError(null);
    } else {
      setError(r.error.message);
    }
  }, [user, password, prefix]);

  const onSample = useCallback(() => {
    setUser(SAMPLE_USER);
    setPassword(SAMPLE_PASS);
    setPrefix("Basic");
  }, []);

  const fullHeaderString = header ? `Authorization: ${header}` : "";
  const headerLength = fullHeaderString ? fullHeaderString.length : 0;
  const statusLabel = error ? "Error" : header ? "Encoded" : "Ready";

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-4 font-ui">
      {/* Tool Header */}
      <ToolHeader
        icon={Shield}
        title="Basic Auth Header"
        subtitle="Build Basic Auth headers — use only over HTTPS"
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
        <FormPanel width={320}>
          <FieldLabel>CREDENTIALS</FieldLabel>

          {/* Username */}
          <div className="box-border flex h-[36px] w-full shrink-0 flex-row items-center justify-between gap-2 rounded-[9px] border border-outline bg-surface px-3 transition-all focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/30">
            <label
              htmlFor={userId}
              className="shrink-0 cursor-pointer text-[13px] font-normal text-on-muted"
            >
              Username
            </label>
            <input
              id={userId}
              type="text"
              value={user}
              onChange={(e) => setUser(e.target.value)}
              placeholder="admin"
              spellCheck={false}
              className="w-full bg-transparent text-right font-mono text-[12px] text-on-surface outline-none placeholder:text-on-faint"
            />
          </div>

          {/* Password */}
          <div className="box-border flex h-[36px] w-full shrink-0 flex-row items-center justify-between gap-2 rounded-[9px] border border-outline bg-surface px-3 transition-all focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/30">
            <label
              htmlFor={passId}
              className="shrink-0 cursor-pointer text-[13px] font-normal text-on-muted"
            >
              Password
            </label>
            <input
              id={passId}
              type="text"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="password"
              spellCheck={false}
              className="w-full bg-transparent text-right font-mono text-[12px] text-on-surface outline-none placeholder:text-on-faint"
            />
          </div>

          <FieldLabel>PREFIX</FieldLabel>
          <Segmented
            value={prefix}
            onChange={(v) => setPrefix(v as AuthPrefix)}
            boxed
            options={PREFIXES.map((p) => ({ value: p, label: p }))}
          />

          <p className="m-0 text-[11px] leading-relaxed text-on-faint">
            Builds an RFC 7617 HTTP Authorization header value.
          </p>
        </FormPanel>

        {/* Result Panel */}
        <ResultPanel>
          <ResultHead
            title="Authorization Header"
            subtitle={`${prefix} • ${headerLength} chars`}
            onCopy={() => void copy("header", fullHeaderString)}
            copied={isCopied("header")}
          />

          <ResultCard>
            {error ? (
              <div className="font-mono text-[13px] text-error" role="alert">
                {error}
              </div>
            ) : fullHeaderString ? (
              <code className="select-all break-all font-mono text-[16px] font-semibold leading-relaxed text-on-surface lg:text-[18px]">
                {fullHeaderString}
              </code>
            ) : (
              <div className="font-mono text-[13px] italic text-on-faint">
                Enter username and password to generate header.
              </div>
            )}
            <div className="select-none font-mono text-[12px] text-on-faint">
              Base64 encoded • Standard RFC 7617 scheme
            </div>
          </ResultCard>

          {/* Details Rows */}
          <div className="flex flex-col gap-2 pt-1">
            <ResultRow label="RAW VALUE" value={header || "—"} />
            <ResultRow label="ENCODE OF" value={user || password ? `${user}:${password}` : "—"} />
            <ResultRow label="LENGTH" value={`${headerLength} chars`} />
          </div>
        </ResultPanel>
      </div>

      {/* Status Bar */}
      <StatusBar
        label="Basic Auth status"
        chip={{ icon: CircleCheck, text: statusLabel }}
        stats={[
          prefix,
          `${user.length + password.length} chars creds`,
          `${headerLength} chars header`,
        ]}
        lang="BASIC"
      />
    </div>
  );
}
