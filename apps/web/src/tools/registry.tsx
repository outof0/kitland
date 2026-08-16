import { isWebAvailableToolSlug, listWebAvailableTools } from "@/lib/release-scope";
import { capabilitiesForWebTool } from "@/lib/tool-capabilities";
import { dispatchToolModeNavigation } from "@/lib/tool-mode-navigation";
import type { AvailableToolSlug } from "@kitland/tools";
import { lazy, useMemo, type ComponentType, type LazyExoticComponent } from "react";

type ToolRendererModule = { readonly default: ComponentType };
type ToolRendererLoader = () => Promise<ToolRendererModule>;
export type ToolRenderer = LazyExoticComponent<ComponentType>;

function fromNamed<T extends Record<string, unknown>, K extends keyof T & string>(
  slug: string,
  loadModule: () => Promise<T>,
  exportName: K,
): ToolRendererLoader {
  return async () => {
    const module = await loadModule();
    const Tool = module[exportName] as ComponentType<{
      capabilities?: unknown;
      onModeNavigate?: (nextSlug: string) => void;
    }>;
    if (typeof Tool !== "function") {
      throw new Error(`Shared tool export "${exportName}" is not a component.`);
    }
    return {
      default: (props: Record<string, unknown>) => (
        <Tool
          capabilities={capabilitiesForWebTool(slug)}
          onModeNavigate={(nextSlug: string) => {
            dispatchToolModeNavigation(nextSlug);
          }}
          {...props}
        />
      ),
    };
  };
}

function fromEncoding(slug: string): ToolRendererLoader {
  return async () => {
    const [{ EncodingToolBySlug }, { useEncodingTextTransform }] = await Promise.all([
      import("@kitland/ui/tools/encoding-tools"),
      import("@/hooks/useEncodingTextTransform"),
    ]);
    return {
      default: () => (
        <EncodingToolBySlug
          slug={slug as never}
          useTransform={useEncodingTextTransform}
          capabilities={capabilitiesForWebTool(slug)}
        />
      ),
    };
  };
}

/**
 * Every available registry slug must have a dynamic entry. The exhaustive
 * record makes omissions a type error while preserving one renderer chunk per
 * tool instead of pulling the full suite into ToolWorkspace's client island.
 */
const TOOL_RENDERER_LOADERS = Object.freeze({
  base64: async () => ({ default: (await import("./Base64Tool")).Base64Tool }),
  "json-diff": fromNamed(
    "json-diff",
    () => import("@kitland/ui/tools/JsonDiffTool"),
    "JsonDiffTool",
  ),
  "beautify-minify": async () => {
    const [{ BeautifyMinifyTool }, { useStructuredTextTransform }] = await Promise.all([
      import("@kitland/ui/tools/BeautifyMinifyTool"),
      import("@/hooks/useStructuredTextTransform"),
    ]);
    const useWebBeautifyMinify = (
      source: string,
      mode: "beautify" | "minify",
      indent: 2 | 4 | "tab",
      language: "auto" | "json" | "html" | "css" | "javascript" | "sql" | "xml",
    ) => {
      const transform = useMemo(
        () => ({ tool: "beautify-minify" as const, mode, indent, language }),
        [mode, indent, language],
      );
      return useStructuredTextTransform(transform, source);
    };
    return {
      default: () => (
        <BeautifyMinifyTool
          capabilities={capabilitiesForWebTool("beautify-minify")}
          useTransform={useWebBeautifyMinify}
        />
      ),
    };
  },
  "json-to-yaml": async () => ({
    default: (await import("./JsonToYamlTool")).JsonToYamlTool,
  }),
  "yaml-to-json": fromNamed(
    "yaml-to-json",
    () => import("@kitland/ui/tools/YamlToJsonTool"),
    "YamlToJsonTool",
  ),
  "json-formatter": async () => ({
    default: (await import("./JsonFormatterTool")).JsonFormatterTool,
  }),
  "json-to-csv": fromNamed(
    "json-to-csv",
    () => import("@kitland/ui/tools/JsonToCsvTool"),
    "JsonToCsvTool",
  ),
  "json-to-toml": fromNamed(
    "json-to-toml",
    () => import("@kitland/ui/tools/JsonToTomlTool"),
    "JsonToTomlTool",
  ),
  "xml-formatter": fromNamed(
    "xml-formatter",
    () => import("@kitland/ui/tools/XmlFormatterTool"),
    "XmlFormatterTool",
  ),
  "sql-formatter": fromNamed(
    "sql-formatter",
    () => import("@kitland/ui/tools/SqlFormatterTool"),
    "SqlFormatterTool",
  ),
  "markdown-preview": fromNamed(
    "markdown-preview",
    () => import("@kitland/ui/tools/MarkdownPreviewTool"),
    "MarkdownPreviewTool",
  ),
  "url-encode": fromEncoding("url-encode"),
  "uuid-id": fromNamed("uuid-id", () => import("@kitland/ui/tools/UuidIdTool"), "UuidIdTool"),
  "html-entities": fromEncoding("html-entities"),
  "hex-text": fromEncoding("hex-text"),
  "unicode-converter": fromEncoding("unicode-converter"),
  "binary-text": fromEncoding("binary-text"),
  "rot13-caesar": fromEncoding("rot13-caesar"),
  "sha-hash": fromNamed("sha-hash", () => import("@kitland/ui/tools/ShaHashTool"), "ShaHashTool"),
  "hmac-generator": fromNamed(
    "hmac-generator",
    () => import("@kitland/ui/tools/HmacGeneratorTool"),
    "HmacGeneratorTool",
  ),
  "aes-cipher": fromNamed(
    "aes-cipher",
    () => import("@kitland/ui/tools/AesCipherTool"),
    "AesCipherTool",
  ),
  "bcrypt-hash": fromNamed(
    "bcrypt-hash",
    () => import("@kitland/ui/tools/BcryptHashTool"),
    "BcryptHashTool",
  ),
  "jwt-decoder": fromNamed(
    "jwt-decoder",
    () => import("@kitland/ui/tools/JwtDecoderTool"),
    "JwtDecoderTool",
  ),
  "token-generator": fromNamed(
    "token-generator",
    () => import("@kitland/ui/tools/TokenGeneratorTool"),
    "TokenGeneratorTool",
  ),
  "rsa-key-pair": fromNamed(
    "rsa-key-pair",
    () => import("@kitland/ui/tools/RsaKeyPairTool"),
    "RsaKeyPairTool",
  ),
  "url-parser": fromNamed(
    "url-parser",
    () => import("@kitland/ui/tools/UrlParserTool"),
    "UrlParserTool",
  ),
  "http-status-codes": fromNamed(
    "http-status-codes",
    () => import("@kitland/ui/tools/HttpStatusCodesTool"),
    "HttpStatusCodesTool",
  ),
  "mime-types": fromNamed(
    "mime-types",
    () => import("@kitland/ui/tools/MimeTypesTool"),
    "MimeTypesTool",
  ),
  "user-agent-parser": fromNamed(
    "user-agent-parser",
    () => import("@kitland/ui/tools/UserAgentParserTool"),
    "UserAgentParserTool",
  ),
  "basic-auth-header": fromNamed(
    "basic-auth-header",
    () => import("@kitland/ui/tools/BasicAuthHeaderTool"),
    "BasicAuthHeaderTool",
  ),
  "curl-converter": fromNamed(
    "curl-converter",
    () => import("@kitland/ui/tools/CurlConverterTool"),
    "CurlConverterTool",
  ),
  "cron-parser": fromNamed(
    "cron-parser",
    () => import("@kitland/ui/tools/CronParserTool"),
    "CronParserTool",
  ),
  "ip-subnet-calculator": fromNamed(
    "ip-subnet-calculator",
    () => import("@kitland/ui/tools/IpSubnetCalculatorTool"),
    "IpSubnetCalculatorTool",
  ),
  "password-generator": fromNamed(
    "password-generator",
    () => import("@kitland/ui/tools/PasswordGeneratorTool"),
    "PasswordGeneratorTool",
  ),
  "nanoid-generator": fromNamed(
    "nanoid-generator",
    () => import("@kitland/ui/tools/NanoidGeneratorTool"),
    "NanoidGeneratorTool",
  ),
  "ulid-generator": fromNamed(
    "ulid-generator",
    () => import("@kitland/ui/tools/UlidGeneratorTool"),
    "UlidGeneratorTool",
  ),
  "objectid-generator": fromNamed(
    "objectid-generator",
    () => import("@kitland/ui/tools/ObjectIdGeneratorTool"),
    "ObjectIdGeneratorTool",
  ),
  "mock-data": fromNamed(
    "mock-data",
    () => import("@kitland/ui/tools/MockDataTool"),
    "MockDataTool",
  ),
  "qr-code": fromNamed("qr-code", () => import("@kitland/ui/tools/QrCodeTool"), "QrCodeTool"),
  "unix-timestamp": fromNamed(
    "unix-timestamp",
    () => import("@kitland/ui/tools/UnixTimestampTool"),
    "UnixTimestampTool",
  ),
  "case-converter": fromNamed(
    "case-converter",
    () => import("@kitland/ui/tools/CaseConverterTool"),
    "CaseConverterTool",
  ),
  "sort-lines": fromNamed(
    "sort-lines",
    () => import("@kitland/ui/tools/SortLinesTool"),
    "SortLinesTool",
  ),
  "dedupe-lines": fromNamed(
    "dedupe-lines",
    () => import("@kitland/ui/tools/DedupeLinesTool"),
    "DedupeLinesTool",
  ),
  "text-reverser": fromNamed(
    "text-reverser",
    () => import("@kitland/ui/tools/TextReverserTool"),
    "TextReverserTool",
  ),
  "text-stats": fromNamed(
    "text-stats",
    () => import("@kitland/ui/tools/TextStatsTool"),
    "TextStatsTool",
  ),
  "text-diff": fromNamed(
    "text-diff",
    () => import("@kitland/ui/tools/TextDiffTool"),
    "TextDiffTool",
  ),
  "regex-tester": async () => {
    const [{ RegexTesterTool }, { useRegexTester }] = await Promise.all([
      import("@kitland/ui/tools/RegexTesterTool"),
      import("@/hooks/useRegexTester"),
    ]);
    return {
      default: (props) => (
        <RegexTesterTool
          useTester={useRegexTester}
          capabilities={capabilitiesForWebTool("regex-tester")}
          {...props}
        />
      ),
    };
  },
  "lorem-ipsum": fromNamed(
    "lorem-ipsum",
    () => import("@kitland/ui/tools/LoremIpsumTool"),
    "LoremIpsumTool",
  ),
  "random-port": fromNamed(
    "random-port",
    () => import("@kitland/ui/tools/RandomPortTool"),
    "RandomPortTool",
  ),
  "random-number": fromNamed(
    "random-number",
    () => import("@kitland/ui/tools/RandomNumberTool"),
    "RandomNumberTool",
  ),
  "json-escape": fromNamed(
    "json-escape",
    () => import("@kitland/ui/tools/JsonEscapeTool"),
    "JsonEscapeTool",
  ),
  "morse-code": fromEncoding("morse-code"),
  "split-to-newlines": fromNamed(
    "split-to-newlines",
    () => import("@kitland/ui/tools/SplitToNewlinesTool"),
    "SplitToNewlinesTool",
  ),
  "join-lines": fromNamed(
    "join-lines",
    () => import("@kitland/ui/tools/JoinLinesTool"),
    "JoinLinesTool",
  ),
  "json-to-typescript": fromNamed(
    "json-to-typescript",
    () => import("@kitland/ui/tools/JsonToTypescriptTool"),
    "JsonToTypescriptTool",
  ),
  "json-to-js-const": fromNamed(
    "json-to-js-const",
    () => import("@kitland/ui/tools/JsonToJsConstTool"),
    "JsonToJsConstTool",
  ),
  "html-to-jsx": fromNamed(
    "html-to-jsx",
    () => import("@kitland/ui/tools/HtmlToJsxTool"),
    "HtmlToJsxTool",
  ),
  "number-base": fromNamed(
    "number-base",
    () => import("@kitland/ui/tools/NumberBaseTool"),
    "NumberBaseTool",
  ),
  temperature: fromNamed(
    "temperature",
    () => import("@kitland/ui/tools/TemperatureTool"),
    "TemperatureTool",
  ),
  "data-size": fromNamed(
    "data-size",
    () => import("@kitland/ui/tools/DataSizeTool"),
    "DataSizeTool",
  ),
  "color-converter": fromNamed(
    "color-converter",
    () => import("@kitland/ui/tools/ColorConverterTool"),
    "ColorConverterTool",
  ),
  "duration-formatter": fromNamed(
    "duration-formatter",
    () => import("@kitland/ui/tools/DurationFormatterTool"),
    "DurationFormatterTool",
  ),
  "timezone-converter": fromNamed(
    "timezone-converter",
    () => import("@kitland/ui/tools/TimezoneConverterTool"),
    "TimezoneConverterTool",
  ),
  "date-calculator": fromNamed(
    "date-calculator",
    () => import("@kitland/ui/tools/DateCalculatorTool"),
    "DateCalculatorTool",
  ),
  "age-calculator": fromNamed(
    "age-calculator",
    () => import("@kitland/ui/tools/AgeCalculatorTool"),
    "AgeCalculatorTool",
  ),
} satisfies Record<AvailableToolSlug, ToolRendererLoader>);

const rendererCache = new Map<AvailableToolSlug, ToolRenderer>();

assertRendererRegistryComplete();

export function getToolRenderer(slug: string): ToolRenderer | undefined {
  if (!isRegisteredToolSlug(slug)) return undefined;

  const cached = rendererCache.get(slug);
  if (cached) return cached;

  const renderer = lazy(TOOL_RENDERER_LOADERS[slug as keyof typeof TOOL_RENDERER_LOADERS]);
  rendererCache.set(slug, renderer);
  return renderer;
}

export function hasToolRenderer(slug: string): boolean {
  return isRegisteredToolSlug(slug);
}

export function listRegisteredToolRendererSlugs(): readonly AvailableToolSlug[] {
  return Object.keys(TOOL_RENDERER_LOADERS).filter(isWebAvailableToolSlug);
}

export function isRegisteredToolSlug(slug: string): slug is AvailableToolSlug {
  return isWebAvailableToolSlug(slug) && Object.hasOwn(TOOL_RENDERER_LOADERS, slug);
}

function assertRendererRegistryComplete(): void {
  const availableSlugs = listWebAvailableTools().map((tool) => tool.slug);
  const registeredSlugs = listRegisteredToolRendererSlugs();
  const complete =
    availableSlugs.length === registeredSlugs.length &&
    availableSlugs.every((slug) => registeredSlugs.includes(slug));

  if (!complete) {
    throw new Error(
      `Tool renderer registry does not match available registry tools: expected [${availableSlugs.join(
        ", ",
      )}], received [${registeredSlugs.join(", ")}].`,
    );
  }
}
