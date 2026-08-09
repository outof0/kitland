export type HttpStatus = {
  code: number;
  name: string;
  category: "Informational" | "Success" | "Redirection" | "Client Error" | "Server Error";
  description: string;
};
export const HTTP_STATUS_CODES: readonly HttpStatus[] = [
  {
    code: 100,
    name: "Continue",
    category: "Informational",
    description: "Request headers received; continue sending body.",
  },
  { code: 200, name: "OK", category: "Success", description: "Request succeeded." },
  { code: 201, name: "Created", category: "Success", description: "Resource created." },
  {
    code: 204,
    name: "No Content",
    category: "Success",
    description: "Succeeded without a response body.",
  },
  {
    code: 301,
    name: "Moved Permanently",
    category: "Redirection",
    description: "Permanent redirect.",
  },
  { code: 302, name: "Found", category: "Redirection", description: "Temporary redirect." },
  {
    code: 304,
    name: "Not Modified",
    category: "Redirection",
    description: "Use cached representation.",
  },
  { code: 400, name: "Bad Request", category: "Client Error", description: "Malformed request." },
  {
    code: 401,
    name: "Unauthorized",
    category: "Client Error",
    description: "Authentication required.",
  },
  {
    code: 403,
    name: "Forbidden",
    category: "Client Error",
    description: "Authenticated client lacks permission.",
  },
  { code: 404, name: "Not Found", category: "Client Error", description: "Resource not found." },
  {
    code: 405,
    name: "Method Not Allowed",
    category: "Client Error",
    description: "HTTP method is not supported.",
  },
  {
    code: 409,
    name: "Conflict",
    category: "Client Error",
    description: "Request conflicts with current state.",
  },
  {
    code: 422,
    name: "Unprocessable Content",
    category: "Client Error",
    description: "Semantically invalid content.",
  },
  {
    code: 429,
    name: "Too Many Requests",
    category: "Client Error",
    description: "Rate limit exceeded.",
  },
  {
    code: 500,
    name: "Internal Server Error",
    category: "Server Error",
    description: "Unexpected server error.",
  },
  {
    code: 501,
    name: "Not Implemented",
    category: "Server Error",
    description: "Server does not support capability.",
  },
  {
    code: 502,
    name: "Bad Gateway",
    category: "Server Error",
    description: "Invalid upstream response.",
  },
  {
    code: 503,
    name: "Service Unavailable",
    category: "Server Error",
    description: "Service temporarily unavailable.",
  },
  {
    code: 504,
    name: "Gateway Timeout",
    category: "Server Error",
    description: "Upstream did not respond in time.",
  },
];
export function findHttpStatuses(query: string): readonly HttpStatus[] {
  const q = query.trim().toLowerCase();
  return q
    ? HTTP_STATUS_CODES.filter((s) => `${s.code} ${s.name} ${s.category}`.toLowerCase().includes(q))
    : HTTP_STATUS_CODES;
}
