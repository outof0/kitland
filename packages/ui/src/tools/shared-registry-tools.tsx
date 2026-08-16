import { type ComponentType, useEffect, useState } from "react";
import type { RegexTesterHook } from "./RegexTesterTool";
import type { ToolCapabilities } from "../capabilities";

const LOADERS: Record<string, () => Promise<{ default: ComponentType }>> = {
  "password-generator": () =>
    import("./PasswordGeneratorTool").then((m) => ({ default: m.PasswordGeneratorTool })),
  "nanoid-generator": () =>
    import("./NanoidGeneratorTool").then((m) => ({ default: m.NanoidGeneratorTool })),
  "ulid-generator": () =>
    import("./UlidGeneratorTool").then((m) => ({ default: m.UlidGeneratorTool })),
  "objectid-generator": () =>
    import("./ObjectIdGeneratorTool").then((m) => ({ default: m.ObjectIdGeneratorTool })),
  "lorem-ipsum": () => import("./LoremIpsumTool").then((m) => ({ default: m.LoremIpsumTool })),
  "mock-data": () => import("./MockDataTool").then((m) => ({ default: m.MockDataTool })),
  "random-port": () => import("./RandomPortTool").then((m) => ({ default: m.RandomPortTool })),
  "random-number": () =>
    import("./RandomNumberTool").then((m) => ({ default: m.RandomNumberTool })),
  "http-status-codes": () =>
    import("./HttpStatusCodesTool").then((m) => ({ default: m.HttpStatusCodesTool })),
  "case-converter": () =>
    import("./CaseConverterTool").then((m) => ({ default: m.CaseConverterTool })),
  "sort-lines": () => import("./SortLinesTool").then((m) => ({ default: m.SortLinesTool })),
  "dedupe-lines": () => import("./DedupeLinesTool").then((m) => ({ default: m.DedupeLinesTool })),
  "text-reverser": () =>
    import("./TextReverserTool").then((m) => ({ default: m.TextReverserTool })),
  "json-escape": () => import("./JsonEscapeTool").then((m) => ({ default: m.JsonEscapeTool })),
  "json-to-yaml": () => import("./JsonToYamlTool").then((m) => ({ default: m.JsonToYamlTool })),
  "yaml-to-json": () => import("./YamlToJsonTool").then((m) => ({ default: m.YamlToJsonTool })),
  "json-to-csv": () => import("./JsonToCsvTool").then((m) => ({ default: m.JsonToCsvTool })),
  "json-to-toml": () => import("./JsonToTomlTool").then((m) => ({ default: m.JsonToTomlTool })),
  "json-to-typescript": () =>
    import("./JsonToTypescriptTool").then((m) => ({ default: m.JsonToTypescriptTool })),
  "json-to-js-const": () =>
    import("./JsonToJsConstTool").then((m) => ({ default: m.JsonToJsConstTool })),
  "html-to-jsx": () => import("./HtmlToJsxTool").then((m) => ({ default: m.HtmlToJsxTool })),
  "split-to-newlines": () =>
    import("./SplitToNewlinesTool").then((m) => ({ default: m.SplitToNewlinesTool })),
  "join-lines": () => import("./JoinLinesTool").then((m) => ({ default: m.JoinLinesTool })),
  "xml-formatter": () =>
    import("./XmlFormatterTool").then((m) => ({ default: m.XmlFormatterTool })),
  "sql-formatter": () =>
    import("./SqlFormatterTool").then((m) => ({ default: m.SqlFormatterTool })),
  "markdown-preview": () =>
    import("./MarkdownPreviewTool").then((m) => ({ default: m.MarkdownPreviewTool })),
  "uuid-id": () => import("./UuidIdTool").then((m) => ({ default: m.UuidIdTool })),
  "token-generator": () =>
    import("./TokenGeneratorTool").then((m) => ({ default: m.TokenGeneratorTool })),
  "sha-hash": () => import("./ShaHashTool").then((m) => ({ default: m.ShaHashTool })),
  "hmac-generator": () =>
    import("./HmacGeneratorTool").then((m) => ({ default: m.HmacGeneratorTool })),
  "aes-cipher": () => import("./AesCipherTool").then((m) => ({ default: m.AesCipherTool })),
  "bcrypt-hash": () => import("./BcryptHashTool").then((m) => ({ default: m.BcryptHashTool })),
  "jwt-decoder": () => import("./JwtDecoderTool").then((m) => ({ default: m.JwtDecoderTool })),
  "rsa-key-pair": () => import("./RsaKeyPairTool").then((m) => ({ default: m.RsaKeyPairTool })),
  "basic-auth-header": () =>
    import("./BasicAuthHeaderTool").then((m) => ({ default: m.BasicAuthHeaderTool })),
  "url-parser": () => import("./UrlParserTool").then((m) => ({ default: m.UrlParserTool })),
  "mime-types": () => import("./MimeTypesTool").then((m) => ({ default: m.MimeTypesTool })),
  "user-agent-parser": () =>
    import("./UserAgentParserTool").then((m) => ({ default: m.UserAgentParserTool })),
  "cron-parser": () => import("./CronParserTool").then((m) => ({ default: m.CronParserTool })),
  "ip-subnet-calculator": () =>
    import("./IpSubnetCalculatorTool").then((m) => ({ default: m.IpSubnetCalculatorTool })),
  "qr-code": () => import("./QrCodeTool").then((m) => ({ default: m.QrCodeTool })),
  "unix-timestamp": () =>
    import("./UnixTimestampTool").then((m) => ({ default: m.UnixTimestampTool })),
  "text-stats": () => import("./TextStatsTool").then((m) => ({ default: m.TextStatsTool })),
  "text-diff": () => import("./TextDiffTool").then((m) => ({ default: m.TextDiffTool })),
  "regex-tester": () => import("./RegexTesterTool").then((m) => ({ default: m.RegexTesterTool })),
  "number-base": () => import("./NumberBaseTool").then((m) => ({ default: m.NumberBaseTool })),
  temperature: () => import("./TemperatureTool").then((m) => ({ default: m.TemperatureTool })),
  "data-size": () => import("./DataSizeTool").then((m) => ({ default: m.DataSizeTool })),
  "color-converter": () =>
    import("./ColorConverterTool").then((m) => ({ default: m.ColorConverterTool })),
  "duration-formatter": () =>
    import("./DurationFormatterTool").then((m) => ({ default: m.DurationFormatterTool })),
  "timezone-converter": () =>
    import("./TimezoneConverterTool").then((m) => ({ default: m.TimezoneConverterTool })),
  "beautify-minify": () =>
    import("./BeautifyMinifyTool").then((m) => ({ default: m.BeautifyMinifyTool })),
  "curl-converter": () =>
    import("./CurlConverterTool").then((m) => ({ default: m.CurlConverterTool })),
  "json-diff": () => import("./JsonDiffTool").then((m) => ({ default: m.JsonDiffTool })),
  "json-formatter": () =>
    import("./JsonFormatterTool").then((m) => ({ default: m.JsonFormatterTool })),
  base64: () => import("./Base64Tool").then((m) => ({ default: m.Base64Tool })),
  "html-entities": () =>
    import("./encoding-tools").then((m) => ({
      default: (props: { initialInput?: string; capabilities?: ToolCapabilities }) => (
        <m.EncodingToolBySlug slug="html-entities" {...props} />
      ),
    })),
  "url-encode": () =>
    import("./encoding-tools").then((m) => ({
      default: (props: { initialInput?: string; capabilities?: ToolCapabilities }) => (
        <m.EncodingToolBySlug slug="url-encode" {...props} />
      ),
    })),
  "hex-text": () =>
    import("./encoding-tools").then((m) => ({
      default: (props: { initialInput?: string; capabilities?: ToolCapabilities }) => (
        <m.EncodingToolBySlug slug="hex-text" {...props} />
      ),
    })),
  "unicode-converter": () =>
    import("./encoding-tools").then((m) => ({
      default: (props: { initialInput?: string; capabilities?: ToolCapabilities }) => (
        <m.EncodingToolBySlug slug="unicode-converter" {...props} />
      ),
    })),
  "binary-text": () =>
    import("./encoding-tools").then((m) => ({
      default: (props: { initialInput?: string; capabilities?: ToolCapabilities }) => (
        <m.EncodingToolBySlug slug="binary-text" {...props} />
      ),
    })),
  "rot13-caesar": () =>
    import("./encoding-tools").then((m) => ({
      default: (props: { initialInput?: string; capabilities?: ToolCapabilities }) => (
        <m.EncodingToolBySlug slug="rot13-caesar" {...props} />
      ),
    })),
  "morse-code": () =>
    import("./encoding-tools").then((m) => ({
      default: (props: { initialInput?: string; capabilities?: ToolCapabilities }) => (
        <m.EncodingToolBySlug slug="morse-code" {...props} />
      ),
    })),
  "date-calculator": () =>
    import("./DateCalculatorTool").then((m) => ({ default: m.DateCalculatorTool })),
  "age-calculator": () =>
    import("./AgeCalculatorTool").then((m) => ({ default: m.AgeCalculatorTool })),
};

export type SharedRegistryToolSlug = keyof typeof LOADERS;

export function isSharedRegistryToolSlug(slug: string): slug is SharedRegistryToolSlug {
  return Object.hasOwn(LOADERS, slug);
}

export const SHARED_REGISTRY_TOOL_SLUGS = Object.keys(LOADERS) as SharedRegistryToolSlug[];

export function SharedRegistryTool({
  slug,
  initialInput,
  capabilities,
  useTester,
}: {
  readonly slug: string;
  readonly initialInput?: string;
  readonly capabilities?: ToolCapabilities;
  readonly useTester?: RegexTesterHook;
}) {
  const [Tool, setTool] = useState<ComponentType<{
    initialInput?: string;
    capabilities?: ToolCapabilities;
    useTester?: RegexTesterHook;
  }> | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = LOADERS[slug];
    if (!load) {
      setTool(null);
      return;
    }
    setTool(null);
    void load().then((module) => {
      if (!cancelled)
        setTool(
          () =>
            module.default as ComponentType<{
              initialInput?: string;
              capabilities?: ToolCapabilities;
              useTester?: RegexTesterHook;
            }>,
        );
    });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (!isSharedRegistryToolSlug(slug)) return null;
  if (!Tool) {
    return (
      <div
        className="flex min-h-[220px] items-center justify-center gap-2.5 text-xs text-on-muted"
        role="status"
      >
        <span className="loading-pulse" aria-hidden="true" />
        Loading tool…
      </div>
    );
  }
  return (
    <Tool
      {...(initialInput !== undefined ? { initialInput } : {})}
      {...(capabilities !== undefined ? { capabilities } : {})}
      {...(useTester !== undefined ? { useTester } : {})}
    />
  );
}
