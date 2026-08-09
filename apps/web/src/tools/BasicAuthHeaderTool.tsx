import { Button } from "@/components/ui/button";
import { decodeBasicAuth, encodeBasicAuth } from "@kitland/core";
import { Copy, LockKeyhole } from "lucide-react";
import { useState } from "react";
import { copyText } from "@/lib/clipboard";
export function BasicAuthHeaderTool() {
  const [user, setUser] = useState("kitland"),
    [password, setPassword] = useState("local-only"),
    [header, setHeader] = useState(""),
    [error, setError] = useState<string | null>(null),
    [copied, setCopied] = useState(false);
  const encode = () => {
    const r = encodeBasicAuth(user, password);
    if (r.ok) {
      setHeader(r.value);
      setError(null);
    } else setError(r.error.message);
  };
  const decode = () => {
    const r = decodeBasicAuth(header);
    if (r.ok) {
      setUser(r.value.username);
      setPassword(r.value.password);
      setError(null);
    } else setError(r.error.message);
  };
  return (
    <>
      <div className="tool-header">
        <div className="tool-header__icon">
          <LockKeyhole />
        </div>
        <div className="tool-header__texts">
          <h2 className="tool-header__title">Basic Auth Header</h2>
          <p className="tool-header__subtitle">
            Build or inspect a Basic Authorization header locally.
          </p>
        </div>
      </div>
      <output className={error ? "tool-feedback tool-feedback--error" : "tool-feedback"}>
        {error ?? ""}
      </output>
      <section className="grid flex-1 gap-4 lg:grid-cols-2">
        <div className="grid content-start gap-3 rounded-[14px] border border-[var(--outline)] bg-[var(--bg-elevated)] p-[18px]">
          <label>
            Username
            <input
              value={user}
              onChange={(e) => setUser(e.target.value)}
              className="mt-1 h-9 w-full rounded border border-[var(--outline)] bg-[var(--surface)] px-3"
            />
          </label>
          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 h-9 w-full rounded border border-[var(--outline)] bg-[var(--surface)] px-3"
            />
          </label>
          <Button onClick={encode}>Build Header</Button>
        </div>
        <section className="rounded-[14px] border border-[var(--outline)] bg-[var(--surface)] p-5">
          <div className="flex justify-between">
            <h3 className="m-0 text-base font-semibold">Authorization</h3>
            <Button
              size="sm"
              disabled={!header}
              onClick={() => void copyText(header).then((r) => setCopied(r.ok))}
            >
              <Copy />
              {copied ? "Copied" : "Copy"}
            </Button>
          </div>
          <textarea
            aria-label="Basic Authorization header"
            value={header}
            onChange={(e) => setHeader(e.target.value)}
            placeholder="Basic …"
            className="mt-3 min-h-28 w-full rounded-xl bg-[var(--bg-elevated)] p-3 font-mono text-xs"
          />
          <Button variant="ghost" className="mt-3" onClick={decode}>
            Decode Header
          </Button>
          <p className="text-xs text-amber-300">
            Basic Auth is Base64 encoding, not encryption. Use HTTPS.
          </p>
        </section>
      </section>
    </>
  );
}
