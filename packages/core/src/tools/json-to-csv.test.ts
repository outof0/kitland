import { describe, expect, it } from "vitest";
import { jsonToCsv, JSON_TO_CSV_MAX_INPUT_CHARS } from "./json-to-csv";

describe("jsonToCsv", () => {
  it("converts Unicode records with stable union headers and nested JSON cells", () => {
    expect(jsonToCsv('[{"name":"café 🍵","active":true},{"active":false,"meta":{"v":2}}]')).toEqual(
      {
        ok: true,
        value: 'name,active,meta\r\ncafé 🍵,true,\r\n,false,"{""v"":2}"\r\n',
      },
    );
  });

  it("quotes RFC 4180 cells and protects spreadsheet formulas by default", () => {
    expect(jsonToCsv('{"note":"a, b\\nnext","formula":"=1+1"}')).toEqual({
      ok: true,
      value: 'note,formula\r\n"a, b\nnext",\'=1+1\r\n',
    });
    expect(jsonToCsv('{"formula":"=1+1"}', { escapeFormulae: false })).toEqual({
      ok: true,
      value: "formula\r\n=1+1\r\n",
    });
  });

  it("rejects malformed, unsupported and oversized inputs", () => {
    expect(jsonToCsv("[")).toMatchObject({ ok: false, error: { code: "INVALID_JSON" } });
    expect(jsonToCsv("[1, 2]")).toMatchObject({ ok: false, error: { code: "INVALID_RECORDS" } });
    expect(jsonToCsv(" ")).toMatchObject({ ok: false, error: { code: "EMPTY_INPUT" } });
    expect(jsonToCsv("0".repeat(JSON_TO_CSV_MAX_INPUT_CHARS + 1))).toMatchObject({
      ok: false,
      error: { code: "INPUT_TOO_LARGE" },
    });
  });
});
