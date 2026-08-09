import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

type Manifest = {
  manifest_version?: number;
  name?: string;
  description?: string;
  version?: string;
  action?: { default_popup?: string };
  permissions?: unknown[];
  host_permissions?: unknown[];
  background?: unknown;
  content_scripts?: unknown;
  content_security_policy?: { extension_pages?: string };
};

const manifestPath = fileURLToPath(new URL("../public/manifest.json", import.meta.url));
const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as Manifest;

describe("Manifest V3 privacy contract", () => {
  it("exposes the popup through a cross-browser MV3 action", () => {
    expect(manifest.manifest_version).toBe(3);
    expect(manifest.name).toBe("Kitland Developer Tools");
    expect(manifest.description).not.toMatch(/Base64/i);
    expect(manifest.version).toMatch(/^\d+\.\d+\.\d+$/);
    expect(manifest.action?.default_popup).toBe("popup.html");
  });

  it("requests no extension or website permissions", () => {
    expect(manifest.permissions).toEqual([]);
    expect(manifest.host_permissions).toEqual([]);
    expect(manifest.background).toBeUndefined();
    expect(manifest.content_scripts).toBeUndefined();
  });

  it("allows executable code only from the packaged extension", () => {
    expect(manifest.content_security_policy?.extension_pages).toBe(
      "script-src 'self'; object-src 'self'",
    );
  });
});
