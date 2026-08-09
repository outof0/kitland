import {
  isAvailableToolSlug,
  listAvailableTools,
  type AvailableToolSlug,
} from "@kitland/tool-catalog";
import { lazy, type ComponentType, type LazyExoticComponent } from "react";

type ToolRendererModule = { readonly default: ComponentType };
type ToolRendererLoader = () => Promise<ToolRendererModule>;
export type ToolRenderer = LazyExoticComponent<ComponentType>;

/**
 * Every available catalog slug must have a dynamic entry. The exhaustive
 * record makes omissions a type error while preserving one renderer chunk per
 * tool instead of pulling the full suite into ToolWorkspace's client island.
 */
const TOOL_RENDERER_LOADERS = Object.freeze({
  base64: async () => ({ default: (await import("./Base64Tool")).Base64Tool }),
  "json-diff": async () => ({ default: (await import("./JsonDiffTool")).JsonDiffTool }),
  "beautify-minify": async () => ({
    default: (await import("./BeautifyMinifyTool")).BeautifyMinifyTool,
  }),
  "json-to-yaml": async () => ({ default: (await import("./JsonToYamlTool")).JsonToYamlTool }),
  "yaml-to-json": async () => ({ default: (await import("./YamlToJsonTool")).YamlToJsonTool }),
  "json-toolbox": async () => ({ default: (await import("./JsonToolboxTool")).JsonToolboxTool }),
  "json-to-csv": async () => ({ default: (await import("./JsonToCsvTool")).JsonToCsvTool }),
  "json-to-toml": async () => ({ default: (await import("./JsonToTomlTool")).JsonToTomlTool }),
  "xml-formatter": async () => ({ default: (await import("./XmlFormatterTool")).XmlFormatterTool }),
  "sql-formatter": async () => ({ default: (await import("./SqlFormatterTool")).SqlFormatterTool }),
  "markdown-preview": async () => ({
    default: (await import("./MarkdownPreviewTool")).MarkdownPreviewTool,
  }),
  "url-encode": async () => ({ default: (await import("./UrlEncodeTool")).UrlEncodeTool }),
  "uuid-id": async () => ({ default: (await import("./UuidIdTool")).UuidIdTool }),
  "html-entities": async () => ({
    default: (await import("./HtmlEntitiesTool")).HtmlEntitiesTool,
  }),
  "hex-text": async () => ({ default: (await import("./HexTextTool")).HexTextTool }),
  "unicode-converter": async () => ({
    default: (await import("./UnicodeConverterTool")).UnicodeConverterTool,
  }),
  "binary-text": async () => ({ default: (await import("./BinaryTextTool")).BinaryTextTool }),
  "rot13-caesar": async () => ({ default: (await import("./Rot13CaesarTool")).Rot13CaesarTool }),
  "sha-hash": async () => ({ default: (await import("./ShaHashTool")).ShaHashTool }),
  "hmac-generator": async () => ({
    default: (await import("./HmacGeneratorTool")).HmacGeneratorTool,
  }),
  "aes-cipher": async () => ({ default: (await import("./AesCipherTool")).AesCipherTool }),
  "bcrypt-hash": async () => ({ default: (await import("./BcryptHashTool")).BcryptHashTool }),
  "jwt-decoder": async () => ({ default: (await import("./JwtDecoderTool")).JwtDecoderTool }),
  "token-generator": async () => ({
    default: (await import("./TokenGeneratorTool")).TokenGeneratorTool,
  }),
  "rsa-key-pair": async () => ({ default: (await import("./RsaKeyPairTool")).RsaKeyPairTool }),
  "url-parser": async () => ({ default: (await import("./UrlParserTool")).UrlParserTool }),
  "http-status-codes": async () => ({
    default: (await import("./HttpStatusCodesTool")).HttpStatusCodesTool,
  }),
  "mime-types": async () => ({ default: (await import("./MimeTypesTool")).MimeTypesTool }),
  "user-agent-parser": async () => ({
    default: (await import("./UserAgentParserTool")).UserAgentParserTool,
  }),
  "basic-auth-header": async () => ({
    default: (await import("./BasicAuthHeaderTool")).BasicAuthHeaderTool,
  }),
  "curl-converter": async () => ({
    default: (await import("./CurlConverterTool")).CurlConverterTool,
  }),
  "cron-parser": async () => ({ default: (await import("./CronParserTool")).CronParserTool }),
  "ip-subnet-calculator": async () => ({
    default: (await import("./IpSubnetCalculatorTool")).IpSubnetCalculatorTool,
  }),
  "password-generator": async () => ({
    default: (await import("./PasswordGeneratorTool")).PasswordGeneratorTool,
  }),
  "nanoid-generator": async () => ({
    default: (await import("./NanoidGeneratorTool")).NanoidGeneratorTool,
  }),
  "case-converter": async () => ({
    default: (await import("./CaseConverterTool")).CaseConverterTool,
  }),
  "sort-lines": async () => ({ default: (await import("./SortLinesTool")).SortLinesTool }),
  "dedupe-lines": async () => ({ default: (await import("./DedupeLinesTool")).DedupeLinesTool }),
  "text-reverser": async () => ({
    default: (await import("./TextReverserTool")).TextReverserTool,
  }),
  "text-stats": async () => ({ default: (await import("./TextStatsTool")).TextStatsTool }),
  "text-diff": async () => ({ default: (await import("./TextDiffTool")).TextDiffTool }),
  "regex-tester": async () => ({ default: (await import("./RegexTesterTool")).RegexTesterTool }),
  "lorem-ipsum": async () => ({ default: (await import("./LoremIpsumTool")).LoremIpsumTool }),
  "random-port": async () => ({ default: (await import("./RandomPortTool")).RandomPortTool }),
  "random-number": async () => ({ default: (await import("./RandomNumberTool")).RandomNumberTool }),
  "json-escape": async () => ({ default: (await import("./JsonEscapeTool")).JsonEscapeTool }),
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

export function isRegisteredToolSlug(slug: string): slug is AvailableToolSlug {
  return isAvailableToolSlug(slug) && Object.hasOwn(TOOL_RENDERER_LOADERS, slug);
}

function assertRendererRegistryComplete(): void {
  const availableSlugs = listAvailableTools().map((tool) => tool.slug);
  const registeredSlugs = Object.keys(TOOL_RENDERER_LOADERS);
  const complete =
    availableSlugs.length === registeredSlugs.length &&
    availableSlugs.every((slug) => registeredSlugs.includes(slug));

  if (!complete) {
    throw new Error(
      `Tool renderer registry does not match available catalog tools: expected [${availableSlugs.join(
        ", ",
      )}], received [${registeredSlugs.join(", ")}].`,
    );
  }
}
