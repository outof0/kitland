import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const dir = join(dirname(fileURLToPath(import.meta.url)), "../src/tools");

const files = {
  PasswordGeneratorTool: "PasswordGeneratorTool",
  NanoidGeneratorTool: "NanoidGeneratorTool",
  UlidGeneratorTool: "UlidGeneratorTool",
  ObjectIdGeneratorTool: "ObjectIdGeneratorTool",
  LoremIpsumTool: "LoremIpsumTool",
  MockDataTool: "MockDataTool",
  RandomPortTool: "RandomPortTool",
  RandomNumberTool: "RandomNumberTool",
  HttpStatusCodesTool: "HttpStatusCodesTool",
  AgeCalculatorTool: "AgeCalculatorTool",
  AesCipherTool: "AesCipherTool",
  BasicAuthHeaderTool: "BasicAuthHeaderTool",
  BcryptHashTool: "BcryptHashTool",
  CaseConverterTool: "CaseConverterTool",
  ColorConverterTool: "ColorConverterTool",
  CronParserTool: "CronParserTool",
  DataSizeTool: "DataSizeTool",
  DateCalculatorTool: "DateCalculatorTool",
  DedupeLinesTool: "DedupeLinesTool",
  DurationFormatterTool: "DurationFormatterTool",
  HmacGeneratorTool: "HmacGeneratorTool",
  HtmlToJsxTool: "HtmlToJsxTool",
  IpSubnetCalculatorTool: "IpSubnetCalculatorTool",
  JsonEscapeTool: "JsonEscapeTool",
  JsonToCsvTool: "JsonToCsvTool",
  JsonToJsConstTool: "JsonToJsConstTool",
  JsonToTomlTool: "JsonToTomlTool",
  JsonToTypescriptTool: "JsonToTypescriptTool",
  JwtDecoderTool: "JwtDecoderTool",
  MarkdownPreviewTool: "MarkdownPreviewTool",
  MimeTypesTool: "MimeTypesTool",
  NumberBaseTool: "NumberBaseTool",
  QrCodeTool: "QrCodeTool",
  RegexTesterTool: "RegexTesterTool",
  RsaKeyPairTool: "RsaKeyPairTool",
  ShaHashTool: "ShaHashTool",
  SortLinesTool: "SortLinesTool",
  SplitToNewlinesTool: "SplitToNewlinesTool",
  SqlFormatterTool: "SqlFormatterTool",
  TemperatureTool: "TemperatureTool",
  TextDiffTool: "TextDiffTool",
  TextReverserTool: "TextReverserTool",
  TextStatsTool: "TextStatsTool",
  TimezoneConverterTool: "TimezoneConverterTool",
  TokenGeneratorTool: "TokenGeneratorTool",
  UnixTimestampTool: "UnixTimestampTool",
  UrlParserTool: "UrlParserTool",
  UserAgentParserTool: "UserAgentParserTool",
  UuidIdTool: "UuidIdTool",
  XmlFormatterTool: "XmlFormatterTool",
};

for (const [file, name] of Object.entries(files)) {
  writeFileSync(join(dir, `${file}.tsx`), `export { ${name} } from "@kitland/ui/tools/${file}";\n`);
}

writeFileSync(
  join(dir, "JsonToYamlTool.tsx"),
  `import { JsonToYamlTool as SharedJsonToYamlTool } from "@kitland/ui/tools/JsonToYamlTool";

export function JsonToYamlTool() {
  return (
    <SharedJsonToYamlTool
      onModeNavigate={(slug) => {
        window.history.replaceState(null, "", \`/explore/\${slug}\`);
      }}
    />
  );
}
`,
);

writeFileSync(
  join(dir, "YamlToJsonTool.tsx"),
  `export { YamlToJsonTool } from "@kitland/ui/tools/YamlToJsonTool";\n`,
);

console.log("rewrote web re-exports");
