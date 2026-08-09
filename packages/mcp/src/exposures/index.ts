import type { McpExposure } from "../contracts.ts";
import { kitlandBase64DecodeExposure, kitlandBase64EncodeExposure } from "./base64.ts";
import { CRYPTO_EXPOSURES } from "./crypto.ts";
import { DATETIME_UTILITY_EXPOSURES } from "./datetime-utility.ts";
import { ENCODING_EXPOSURES } from "./encoding.ts";
import { GENERATOR_EXPOSURES } from "./generators.ts";
import { JSON_MARKUP_EXPOSURES } from "./json-markup.ts";
import { TEXT_REGEX_EXPOSURES } from "./text-regex.ts";

export * from "./base64.ts";
export * from "./crypto.ts";
export * from "./datetime-utility.ts";
export * from "./encoding.ts";
export * from "./generators.ts";
export * from "./json-markup.ts";
export * from "./text-regex.ts";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const DEFAULT_EXPOSURES: ReadonlyArray<McpExposure<any, any>> = [
  kitlandBase64DecodeExposure,
  kitlandBase64EncodeExposure,
  ...ENCODING_EXPOSURES,
  ...JSON_MARKUP_EXPOSURES,
  ...CRYPTO_EXPOSURES,
  ...GENERATOR_EXPOSURES,
  ...TEXT_REGEX_EXPOSURES,
  ...DATETIME_UTILITY_EXPOSURES,
];
