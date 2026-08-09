import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  clearPersistedToolInput,
  getStorageKindForTool,
  isCryptoSecurityTool,
  readPersistedToolInput,
  writePersistedToolInput,
} from "./tool-input-storage";

describe("tool-input-storage", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.restoreAllMocks();
  });

  it("correctly identifies security/crypto tools as sessionStorage", () => {
    expect(isCryptoSecurityTool("jwt-decoder")).toBe(true);
    expect(isCryptoSecurityTool("aes-cipher")).toBe(true);
    expect(isCryptoSecurityTool("rsa-key-pair")).toBe(true);
    expect(isCryptoSecurityTool("bcrypt-hash")).toBe(true);
    expect(isCryptoSecurityTool("password-generator")).toBe(true);

    expect(getStorageKindForTool("jwt-decoder")).toBe("session");
    expect(getStorageKindForTool("aes-cipher")).toBe("session");
  });

  it("correctly identifies standard tools as localStorage", () => {
    expect(isCryptoSecurityTool("json-formatter")).toBe(false);
    expect(isCryptoSecurityTool("base64")).toBe(false);
    expect(isCryptoSecurityTool("url-encode")).toBe(false);
    expect(isCryptoSecurityTool("sql-formatter")).toBe(false);
    expect(isCryptoSecurityTool("case-converter")).toBe(false);

    expect(getStorageKindForTool("json-formatter")).toBe("local");
    expect(getStorageKindForTool("base64")).toBe("local");
  });

  it("writes and reads tool input from localStorage for standard tools", () => {
    writePersistedToolInput("json-formatter", '{"hello": "world"}');
    expect(localStorage.getItem("kitland:input:json-formatter")).toBe('{"hello": "world"}');
    expect(sessionStorage.getItem("kitland:input:json-formatter")).toBeNull();

    const read = readPersistedToolInput("json-formatter");
    expect(read).toBe('{"hello": "world"}');
  });

  it("writes and reads tool input from sessionStorage for crypto tools", () => {
    writePersistedToolInput("jwt-decoder", "eyJhbGciOiJIUzI1NiJ9...");
    expect(sessionStorage.getItem("kitland:input:jwt-decoder")).toBe("eyJhbGciOiJIUzI1NiJ9...");
    expect(localStorage.getItem("kitland:input:jwt-decoder")).toBeNull();

    const read = readPersistedToolInput("jwt-decoder");
    expect(read).toBe("eyJhbGciOiJIUzI1NiJ9...");
  });

  it("clears storage when input is empty string or clear is called", () => {
    writePersistedToolInput("base64", "some-data");
    expect(readPersistedToolInput("base64")).toBe("some-data");

    // Setting empty string deletes key
    writePersistedToolInput("base64", "");
    expect(readPersistedToolInput("base64")).toBeNull();

    // Calling clearPersistedToolInput explicitly
    writePersistedToolInput("base64", "new-data");
    clearPersistedToolInput("base64");
    expect(readPersistedToolInput("base64")).toBeNull();
  });

  it("handles storage exceptions gracefully without crashing", () => {
    vi.spyOn(window.localStorage, "getItem").mockImplementation(() => {
      throw new Error("Storage blocked");
    });
    vi.spyOn(window.localStorage, "setItem").mockImplementation(() => {
      throw new Error("Quota exceeded");
    });

    expect(() => writePersistedToolInput("json-formatter", "data")).not.toThrow();
    expect(readPersistedToolInput("json-formatter")).toBeNull();
  });
});
