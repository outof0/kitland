import { capabilitiesForWebTool } from "./tool-capabilities";
import { describe, expect, it } from "vitest";

describe("capabilitiesForWebTool", () => {
  it("enables file powers only when the registry web contract grants them", () => {
    // Base64 declares file-import / file-export / share-link on web.
    expect(capabilitiesForWebTool("base64")).toEqual({ fileOpen: true, fileSave: true });
    // URL Encode reuses the shared transform platform, which omits file powers.
    expect(capabilitiesForWebTool("url-encode")).toEqual({ fileOpen: false, fileSave: false });

    // JSON Formatter explicitly grants local import/export; it remains a
    // browser-only capability and does not imply an extension file permission.
    expect(capabilitiesForWebTool("json-formatter")).toEqual({
      fileOpen: true,
      fileSave: true,
    });
    // Text Diff / Regex / Text Stats omit file powers, so the web host must
    // not re-authorize file I/O the registry did not grant.
    expect(capabilitiesForWebTool("text-diff")).toEqual({ fileOpen: false, fileSave: false });
    expect(capabilitiesForWebTool("regex-tester")).toEqual({ fileOpen: false, fileSave: false });
    expect(capabilitiesForWebTool("text-stats")).toEqual({ fileOpen: false, fileSave: false });
    expect(capabilitiesForWebTool("yaml-to-json")).toEqual({ fileOpen: false, fileSave: false });
  });
});
