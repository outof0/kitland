import { err, ok, type ToolResult } from "../result";
export const URL_PARSER_MAX_INPUT_CHARS = 100_000;
export type ParsedUrl = {
  href: string;
  origin: string;
  protocol: string;
  host: string;
  hostname: string;
  port: string;
  pathname: string;
  search: string;
  hash: string;
  params: readonly { name: string; value: string }[];
};
export function parseUrl(input: string): ToolResult<ParsedUrl> {
  if (input.length > URL_PARSER_MAX_INPUT_CHARS)
    return err("INPUT_TOO_LARGE", "URL exceeds the allowed size.");
  try {
    const u = new URL(input);
    return ok({
      href: u.href,
      origin: u.origin,
      protocol: u.protocol,
      host: u.host,
      hostname: u.hostname,
      port: u.port,
      pathname: u.pathname,
      search: u.search,
      hash: u.hash,
      params: Array.from(u.searchParams, ([name, value]) => ({ name, value })),
    });
  } catch {
    return err(
      "INVALID_URL",
      "Enter an absolute URL including its protocol, for example https://kitland.dev/.",
    );
  }
}
