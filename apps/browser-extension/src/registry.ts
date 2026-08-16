import {
  getToolBySlug,
  listToolsByPlatform,
  supportsToolPlatform,
  type RegistryTool,
  type ToolSlug,
} from "@kitland/tools";
import { createElement, lazy, type ComponentType, type LazyExoticComponent } from "react";
import type { RegexTesterToolProps } from "@kitland/ui/tools/RegexTesterTool";
import { useRegexTester } from "./hooks/useRegexTester";

type ToolRendererModule = { readonly default: ComponentType };
type ToolRendererLoader = () => Promise<ToolRendererModule>;
export type ToolRenderer = LazyExoticComponent<ComponentType>;

export type ToolRegistration = {
  readonly tool: RegistryTool;
  readonly load: ToolRendererLoader;
};

function fromNamed<T extends Record<string, unknown>, K extends keyof T & string>(
  loadModule: () => Promise<T>,
  exportName: K,
): ToolRendererLoader {
  return async () => {
    const module = await loadModule();
    const Tool = module[exportName];
    if (typeof Tool !== "function") {
      throw new Error(`Shared tool export "${exportName}" is not a component.`);
    }
    return { default: Tool as ComponentType };
  };
}

function fromEncoding(slug: string): ToolRendererLoader {
  return async () => {
    const { EncodingToolBySlug } = await import("@kitland/ui/tools/encoding-tools");
    return { default: () => createElement(EncodingToolBySlug, { slug }) };
  };
}

/**
 * Same shape as the web ToolWorkspace registry: one lazy React renderer per
 * registry slug. Host wrappers exist only when the extension must inject a
 * worker. Everything else is the shared @kitland/ui tool — not a second
 * mount API or GenericTransform fallback.
 */
const TOOL_RENDERER_LOADERS = {
  base64: () => import("./tools/base64/adapter"),
  "beautify-minify": fromNamed(
    () => import("@kitland/ui/tools/BeautifyMinifyTool"),
    "BeautifyMinifyTool",
  ),
  "curl-converter": fromNamed(
    () => import("@kitland/ui/tools/CurlConverterTool"),
    "CurlConverterTool",
  ),
  "json-diff": fromNamed(() => import("@kitland/ui/tools/JsonDiffTool"), "JsonDiffTool"),
  "json-formatter": fromNamed(
    () => import("@kitland/ui/tools/JsonFormatterTool"),
    "JsonFormatterTool",
  ),
  "html-entities": fromEncoding("html-entities"),
  "url-encode": fromEncoding("url-encode"),
  "hex-text": fromEncoding("hex-text"),
  "unicode-converter": fromEncoding("unicode-converter"),
  "binary-text": fromEncoding("binary-text"),
  "rot13-caesar": fromEncoding("rot13-caesar"),
  "morse-code": fromEncoding("morse-code"),
  "json-to-yaml": fromNamed(() => import("@kitland/ui/tools/JsonToYamlTool"), "JsonToYamlTool"),
  "yaml-to-json": fromNamed(() => import("@kitland/ui/tools/YamlToJsonTool"), "YamlToJsonTool"),
  "json-to-csv": fromNamed(() => import("@kitland/ui/tools/JsonToCsvTool"), "JsonToCsvTool"),
  "json-to-toml": fromNamed(() => import("@kitland/ui/tools/JsonToTomlTool"), "JsonToTomlTool"),
  "xml-formatter": fromNamed(
    () => import("@kitland/ui/tools/XmlFormatterTool"),
    "XmlFormatterTool",
  ),
  "sql-formatter": fromNamed(
    () => import("@kitland/ui/tools/SqlFormatterTool"),
    "SqlFormatterTool",
  ),
  "markdown-preview": fromNamed(
    () => import("@kitland/ui/tools/MarkdownPreviewTool"),
    "MarkdownPreviewTool",
  ),
  "uuid-id": fromNamed(() => import("@kitland/ui/tools/UuidIdTool"), "UuidIdTool"),
  "sha-hash": fromNamed(() => import("@kitland/ui/tools/ShaHashTool"), "ShaHashTool"),
  "hmac-generator": fromNamed(
    () => import("@kitland/ui/tools/HmacGeneratorTool"),
    "HmacGeneratorTool",
  ),
  "aes-cipher": fromNamed(() => import("@kitland/ui/tools/AesCipherTool"), "AesCipherTool"),
  "bcrypt-hash": fromNamed(() => import("@kitland/ui/tools/BcryptHashTool"), "BcryptHashTool"),
  "jwt-decoder": fromNamed(() => import("@kitland/ui/tools/JwtDecoderTool"), "JwtDecoderTool"),
  "token-generator": fromNamed(
    () => import("@kitland/ui/tools/TokenGeneratorTool"),
    "TokenGeneratorTool",
  ),
  "rsa-key-pair": fromNamed(() => import("@kitland/ui/tools/RsaKeyPairTool"), "RsaKeyPairTool"),
  "url-parser": fromNamed(() => import("@kitland/ui/tools/UrlParserTool"), "UrlParserTool"),
  "http-status-codes": fromNamed(
    () => import("@kitland/ui/tools/HttpStatusCodesTool"),
    "HttpStatusCodesTool",
  ),
  "mime-types": fromNamed(() => import("@kitland/ui/tools/MimeTypesTool"), "MimeTypesTool"),
  "user-agent-parser": fromNamed(
    () => import("@kitland/ui/tools/UserAgentParserTool"),
    "UserAgentParserTool",
  ),
  "basic-auth-header": fromNamed(
    () => import("@kitland/ui/tools/BasicAuthHeaderTool"),
    "BasicAuthHeaderTool",
  ),
  "cron-parser": fromNamed(() => import("@kitland/ui/tools/CronParserTool"), "CronParserTool"),
  "ip-subnet-calculator": fromNamed(
    () => import("@kitland/ui/tools/IpSubnetCalculatorTool"),
    "IpSubnetCalculatorTool",
  ),
  "password-generator": fromNamed(
    () => import("@kitland/ui/tools/PasswordGeneratorTool"),
    "PasswordGeneratorTool",
  ),
  "nanoid-generator": fromNamed(
    () => import("@kitland/ui/tools/NanoidGeneratorTool"),
    "NanoidGeneratorTool",
  ),
  "ulid-generator": fromNamed(
    () => import("@kitland/ui/tools/UlidGeneratorTool"),
    "UlidGeneratorTool",
  ),
  "objectid-generator": fromNamed(
    () => import("@kitland/ui/tools/ObjectIdGeneratorTool"),
    "ObjectIdGeneratorTool",
  ),
  "mock-data": fromNamed(() => import("@kitland/ui/tools/MockDataTool"), "MockDataTool"),
  "qr-code": fromNamed(() => import("@kitland/ui/tools/QrCodeTool"), "QrCodeTool"),
  "unix-timestamp": fromNamed(
    () => import("@kitland/ui/tools/UnixTimestampTool"),
    "UnixTimestampTool",
  ),
  "case-converter": fromNamed(
    () => import("@kitland/ui/tools/CaseConverterTool"),
    "CaseConverterTool",
  ),
  "sort-lines": fromNamed(() => import("@kitland/ui/tools/SortLinesTool"), "SortLinesTool"),
  "dedupe-lines": fromNamed(() => import("@kitland/ui/tools/DedupeLinesTool"), "DedupeLinesTool"),
  "text-reverser": fromNamed(
    () => import("@kitland/ui/tools/TextReverserTool"),
    "TextReverserTool",
  ),
  "text-stats": fromNamed(() => import("@kitland/ui/tools/TextStatsTool"), "TextStatsTool"),
  "text-diff": fromNamed(() => import("@kitland/ui/tools/TextDiffTool"), "TextDiffTool"),
  "regex-tester": () => {
    const useTester = useRegexTester;
    return import("@kitland/ui/tools/RegexTesterTool").then(({ RegexTesterTool }) => ({
      default: (props: { readonly initialInput?: string }) =>
        createElement(RegexTesterTool as ComponentType<RegexTesterToolProps>, {
          ...props,
          useTester,
        }),
    }));
  },
  "lorem-ipsum": fromNamed(() => import("@kitland/ui/tools/LoremIpsumTool"), "LoremIpsumTool"),
  "random-port": fromNamed(() => import("@kitland/ui/tools/RandomPortTool"), "RandomPortTool"),
  "random-number": fromNamed(
    () => import("@kitland/ui/tools/RandomNumberTool"),
    "RandomNumberTool",
  ),
  "json-escape": fromNamed(() => import("@kitland/ui/tools/JsonEscapeTool"), "JsonEscapeTool"),
  "split-to-newlines": fromNamed(
    () => import("@kitland/ui/tools/SplitToNewlinesTool"),
    "SplitToNewlinesTool",
  ),
  "join-lines": fromNamed(() => import("@kitland/ui/tools/JoinLinesTool"), "JoinLinesTool"),
  "json-to-typescript": fromNamed(
    () => import("@kitland/ui/tools/JsonToTypescriptTool"),
    "JsonToTypescriptTool",
  ),
  "json-to-js-const": fromNamed(
    () => import("@kitland/ui/tools/JsonToJsConstTool"),
    "JsonToJsConstTool",
  ),
  "html-to-jsx": fromNamed(() => import("@kitland/ui/tools/HtmlToJsxTool"), "HtmlToJsxTool"),
  "number-base": fromNamed(() => import("@kitland/ui/tools/NumberBaseTool"), "NumberBaseTool"),
  temperature: fromNamed(() => import("@kitland/ui/tools/TemperatureTool"), "TemperatureTool"),
  "data-size": fromNamed(() => import("@kitland/ui/tools/DataSizeTool"), "DataSizeTool"),
  "color-converter": fromNamed(
    () => import("@kitland/ui/tools/ColorConverterTool"),
    "ColorConverterTool",
  ),
  "duration-formatter": fromNamed(
    () => import("@kitland/ui/tools/DurationFormatterTool"),
    "DurationFormatterTool",
  ),
  "timezone-converter": fromNamed(
    () => import("@kitland/ui/tools/TimezoneConverterTool"),
    "TimezoneConverterTool",
  ),
  "date-calculator": fromNamed(
    () => import("@kitland/ui/tools/DateCalculatorTool"),
    "DateCalculatorTool",
  ),
  "age-calculator": fromNamed(
    () => import("@kitland/ui/tools/AgeCalculatorTool"),
    "AgeCalculatorTool",
  ),
} as const satisfies Record<string, ToolRendererLoader>;

assertRendererRegistryComplete();

const registrations: ToolRegistration[] = Object.entries(TOOL_RENDERER_LOADERS).map(
  ([slug, load]) => register(slug as ToolSlug, load),
);

export const TOOL_REGISTRATIONS: readonly ToolRegistration[] = registrations;

const bySlug = new Map<string, ToolRegistration>(
  TOOL_REGISTRATIONS.map((registration) => [registration.tool.slug, registration]),
);

const rendererCache = new Map<string, ToolRenderer>();

export function getToolRegistration(slug: string): ToolRegistration | undefined {
  return bySlug.get(slug);
}

export function getToolRenderer(slug: string): ToolRenderer | undefined {
  const registration = bySlug.get(slug);
  if (!registration) return undefined;

  const cached = rendererCache.get(slug);
  if (cached) return cached;

  const renderer = lazy(registration.load);
  rendererCache.set(slug, renderer);
  return renderer;
}

function register(slug: ToolSlug, load: ToolRendererLoader): ToolRegistration {
  const tool = getToolBySlug(slug);
  if (!tool) throw new Error(`Browser extension renderer has no registry entry for "${slug}".`);
  if (!supportsToolPlatform(slug, "browser-extension")) {
    throw new Error(`Browser extension renderer exposes non-available registry tool "${slug}".`);
  }
  return Object.freeze({ tool, load });
}

function assertRendererRegistryComplete(): void {
  const expected = listToolsByPlatform("browser-extension").map((tool) => tool.slug);
  const registered = Object.keys(TOOL_RENDERER_LOADERS);
  const unique = new Set(registered);
  const complete =
    unique.size === registered.length &&
    expected.length === registered.length &&
    expected.every((slug) => unique.has(slug));

  if (!complete) {
    throw new Error(
      `Browser extension registry mismatch: expected [${expected.join(", ")}], received [${registered.join(", ")}].`,
    );
  }
}
