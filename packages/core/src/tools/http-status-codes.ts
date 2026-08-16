export type HttpStatusCategory =
  | "Informational"
  | "Success"
  | "Redirection"
  | "Client Error"
  | "Server Error";

export type HttpStatus = {
  code: number;
  name: string;
  category: HttpStatusCategory;
  description: string;
  detail: string;
  spec: string;
  cacheable: boolean | "conditionally";
  hasResponseBody: boolean | "optional" | "none";
  commonHeaders?: readonly string[];
};

export const HTTP_STATUS_CODES: readonly HttpStatus[] = [
  // 1xx Informational
  {
    code: 100,
    name: "Continue",
    category: "Informational",
    description: "Request headers received; client can continue sending body.",
    detail:
      "Tells the client that the initial part of the request has been received and has not yet been rejected by the server. The client should continue by sending the remainder of the request or, if the request has already been finished, ignore this response.",
    spec: "RFC 9110 §15.2.1",
    cacheable: false,
    hasResponseBody: "none",
  },
  {
    code: 101,
    name: "Switching Protocols",
    category: "Informational",
    description: "Server agrees to switch protocols requested in Upgrade header.",
    detail:
      "Sent in response to an Upgrade request header from the client and indicates the protocol the server is switching to (e.g., HTTP to WebSocket).",
    spec: "RFC 9110 §15.2.2",
    cacheable: false,
    hasResponseBody: "none",
    commonHeaders: ["Upgrade", "Connection"],
  },
  {
    code: 102,
    name: "Processing",
    category: "Informational",
    description: "Server has accepted the full request but has not yet completed it.",
    detail:
      "Used in WebDAV environments to inform the client that the server has accepted the complete request, but has not yet completed the processing (preventing the client from timing out).",
    spec: "RFC 2518 §10.1",
    cacheable: false,
    hasResponseBody: "none",
  },
  {
    code: 103,
    name: "Early Hints",
    category: "Informational",
    description: "Used to return response headers before the final HTTP message.",
    detail:
      "Allows the server to send preliminary response headers (such as Link headers with preload or preconnect directives) while the server prepares the final response.",
    spec: "RFC 8297 §2",
    cacheable: false,
    hasResponseBody: "none",
    commonHeaders: ["Link"],
  },

  // 2xx Success
  {
    code: 200,
    name: "OK",
    category: "Success",
    description: "The request has succeeded.",
    detail:
      "Standard response for successful HTTP requests. The actual meaning depends on the HTTP method: GET yields the target resource representation; POST yields the action outcome representation; PUT/DELETE yields completion status.",
    spec: "RFC 9110 §15.3.1",
    cacheable: true,
    hasResponseBody: true,
    commonHeaders: ["Content-Type", "Content-Length", "ETag", "Cache-Control"],
  },
  {
    code: 201,
    name: "Created",
    category: "Success",
    description: "The request has succeeded and a new resource has been created.",
    detail:
      "The primary resource created by the request has been provisioned. The server typically provides a Location header pointing to the URI of the newly created resource.",
    spec: "RFC 9110 §15.3.2",
    cacheable: false,
    hasResponseBody: "optional",
    commonHeaders: ["Location", "Content-Type", "ETag"],
  },
  {
    code: 202,
    name: "Accepted",
    category: "Success",
    description: "The request has been accepted for processing, but processing is not complete.",
    detail:
      "The request has been accepted for asynchronous or batch processing. The server does not guarantee eventual success; it only acknowledges that processing has started. Often accompanied by a status monitor URL.",
    spec: "RFC 9110 §15.3.3",
    cacheable: false,
    hasResponseBody: "optional",
    commonHeaders: ["Location", "Retry-After"],
  },
  {
    code: 203,
    name: "Non-Authoritative Information",
    category: "Success",
    description: "The payload was modified by a transforming proxy.",
    detail:
      "Indicates that the response was returned by a proxy/intermediary that transformed the 200 OK payload from the origin server.",
    spec: "RFC 9110 §15.3.4",
    cacheable: true,
    hasResponseBody: true,
    commonHeaders: ["Content-Type", "Date"],
  },
  {
    code: 204,
    name: "No Content",
    category: "Success",
    description: "The request has succeeded without a response body.",
    detail:
      "The server successfully fulfilled the request and does not need to return an entity-body. Commonly used for DELETE or PUT requests when no representation is returned to save bandwidth.",
    spec: "RFC 9110 §15.3.5",
    cacheable: "conditionally",
    hasResponseBody: "none",
    commonHeaders: ["Cache-Control", "Date", "ETag"],
  },
  {
    code: 205,
    name: "Reset Content",
    category: "Success",
    description: "The server fulfilled the request and asks the client to reset its document view.",
    detail:
      "Tells the client to reset the document view (for example, clearing an HTML form) which caused the request to be sent.",
    spec: "RFC 9110 §15.3.6",
    cacheable: false,
    hasResponseBody: "none",
  },
  {
    code: 206,
    name: "Partial Content",
    category: "Success",
    description: "The server is delivering only part of the resource requested in Range header.",
    detail:
      "Used in response to a Range request header to deliver byte ranges of a large file (e.g. video streaming, resumed downloads, or chunked file transfers).",
    spec: "RFC 9110 §15.3.7",
    cacheable: true,
    hasResponseBody: true,
    commonHeaders: ["Content-Range", "Content-Type", "ETag"],
  },
  {
    code: 207,
    name: "Multi-Status",
    category: "Success",
    description: "An XML response body contains multiple separate response codes.",
    detail:
      "WebDAV status code indicating that the response message body is an XML document describing multiple independent operations and status codes (e.g. PROPFIND).",
    spec: "RFC 4918 §11.1",
    cacheable: false,
    hasResponseBody: true,
    commonHeaders: ["Content-Type"],
  },
  {
    code: 208,
    name: "Already Reported",
    category: "Success",
    description: "The members of a WebDAV binding have already been enumerated.",
    detail:
      "Used inside a <DAV:propstat> response element to avoid repeatedly enumerating the internal members of multiple bindings to the same collection.",
    spec: "RFC 5842 §7.1",
    cacheable: false,
    hasResponseBody: true,
  },
  {
    code: 226,
    name: "IM Used",
    category: "Success",
    description:
      "The server fulfilled a GET request and response is a representation of one or more instance-manipulations.",
    detail:
      "Used in HTTP Delta Encoding (RFC 3229). The server has fulfilled a GET request for the resource, and the response is a representation of the result of one or more instance-manipulations applied to the current instance.",
    spec: "RFC 3229 §10.4.1",
    cacheable: true,
    hasResponseBody: true,
    commonHeaders: ["Delta-Base", "IM"],
  },

  // 3xx Redirection
  {
    code: 300,
    name: "Multiple Choices",
    category: "Redirection",
    description: "The target resource has more than one representation available.",
    detail:
      "The request has more than one possible response. The client or user agent should choose one of them (e.g. format negotiation or language alternatives).",
    spec: "RFC 9110 §15.4.1",
    cacheable: true,
    hasResponseBody: true,
    commonHeaders: ["Location", "Content-Type"],
  },
  {
    code: 301,
    name: "Moved Permanently",
    category: "Redirection",
    description: "The target resource has been assigned a new permanent URI.",
    detail:
      "The requested resource has definitively moved to the URI given by the Location header. Future references should use the new URI. Search engines transfer SEO equity to the new target.",
    spec: "RFC 9110 §15.4.2",
    cacheable: true,
    hasResponseBody: "optional",
    commonHeaders: ["Location", "Cache-Control"],
  },
  {
    code: 302,
    name: "Found",
    category: "Redirection",
    description: "The target resource resides temporarily under a different URI.",
    detail:
      "Temporary redirect. The client should continue to use the original URI for future requests. Historical user agents may rewrite POST to GET.",
    spec: "RFC 9110 §15.4.3",
    cacheable: false,
    hasResponseBody: "optional",
    commonHeaders: ["Location"],
  },
  {
    code: 303,
    name: "See Other",
    category: "Redirection",
    description:
      "The server directs the client to get the resource at another URI with a GET request.",
    detail:
      "Directs the client to another URI using the GET method (POST-Redirect-GET pattern). Used to prevent duplicate form submissions upon browser refresh.",
    spec: "RFC 9110 §15.4.4",
    cacheable: false,
    hasResponseBody: "optional",
    commonHeaders: ["Location"],
  },
  {
    code: 304,
    name: "Not Modified",
    category: "Redirection",
    description:
      "The resource has not been modified since the version specified by the conditional headers.",
    detail:
      "Informs the client that the cached copy is still valid (conditional GET with If-None-Match or If-Modified-Since). No response body is transmitted, saving bandwidth.",
    spec: "RFC 9110 §15.4.5",
    cacheable: true,
    hasResponseBody: "none",
    commonHeaders: ["ETag", "Cache-Control", "Expires", "Last-Modified"],
  },
  {
    code: 305,
    name: "Use Proxy",
    category: "Redirection",
    description: "The requested resource must be accessed through the proxy given by Location.",
    detail: "Deprecated due to security concerns regarding in-band proxy configuration.",
    spec: "RFC 9110 §15.4.6",
    cacheable: false,
    hasResponseBody: "optional",
    commonHeaders: ["Location"],
  },
  {
    code: 307,
    name: "Temporary Redirect",
    category: "Redirection",
    description: "The target resource resides temporarily at another URI; method must not change.",
    detail:
      "Temporary redirect that strictly guarantees the HTTP method and request body will not be altered on the subsequent request (unlike 302 where POST was often changed to GET).",
    spec: "RFC 9110 §15.4.8",
    cacheable: false,
    hasResponseBody: "optional",
    commonHeaders: ["Location"],
  },
  {
    code: 308,
    name: "Permanent Redirect",
    category: "Redirection",
    description:
      "The target resource has permanently moved to another URI; method must not change.",
    detail:
      "Permanent redirect that strictly guarantees the HTTP method and request body will not be changed on the follow-up request (unlike 301).",
    spec: "RFC 9110 §15.4.9",
    cacheable: true,
    hasResponseBody: "optional",
    commonHeaders: ["Location"],
  },

  // 4xx Client Error
  {
    code: 400,
    name: "Bad Request",
    category: "Client Error",
    description:
      "The server cannot process the request due to client error (malformed syntax, invalid JSON, etc.).",
    detail:
      "The server cannot or will not process the request due to perceived client error (e.g. malformed request syntax, invalid routing, deceptive request framing, or size limit breach).",
    spec: "RFC 9110 §15.5.1",
    cacheable: false,
    hasResponseBody: true,
    commonHeaders: ["Content-Type"],
  },
  {
    code: 401,
    name: "Unauthorized",
    category: "Client Error",
    description: "Authentication is required and has failed or has not yet been provided.",
    detail:
      "Indicates that the request has not been applied because it lacks valid authentication credentials for the target resource. Must include a WWW-Authenticate header field.",
    spec: "RFC 9110 §15.5.2",
    cacheable: false,
    hasResponseBody: true,
    commonHeaders: ["WWW-Authenticate", "Content-Type"],
  },
  {
    code: 402,
    name: "Payment Required",
    category: "Client Error",
    description:
      "Reserved for digital payment schemes; often used for quota or subscription paywalls.",
    detail:
      "Reserved for future use by HTTP/1.1 specifications, but frequently used in modern APIs to indicate quota depletion, subscription requirements, or billing issues.",
    spec: "RFC 9110 §15.5.3",
    cacheable: false,
    hasResponseBody: true,
    commonHeaders: ["Content-Type"],
  },
  {
    code: 403,
    name: "Forbidden",
    category: "Client Error",
    description: "The server understands the request but refuses to authorize it.",
    detail:
      "Unlike 401 Unauthorized, re-authenticating will make no difference because the client's identity is recognized but lacks necessary permissions (e.g. insufficient role, IP blocking, or CORS denial).",
    spec: "RFC 9110 §15.5.4",
    cacheable: false,
    hasResponseBody: true,
    commonHeaders: ["Content-Type"],
  },
  {
    code: 404,
    name: "Not Found",
    category: "Client Error",
    description: "The origin server did not find a current representation for the target resource.",
    detail:
      "The server cannot find the requested resource. Links that lead to a 404 are often called broken or dead links. Also used to mask the existence of an unauthorized private resource.",
    spec: "RFC 9110 §15.5.5",
    cacheable: true,
    hasResponseBody: true,
    commonHeaders: ["Content-Type", "Cache-Control"],
  },
  {
    code: 405,
    name: "Method Not Allowed",
    category: "Client Error",
    description: "The HTTP method used is not supported for the target resource.",
    detail:
      "The method specified in the request line is recognized by the server but not supported by the target resource. The server must return an Allow header containing a list of valid methods.",
    spec: "RFC 9110 §15.5.6",
    cacheable: true,
    hasResponseBody: true,
    commonHeaders: ["Allow", "Content-Type"],
  },
  {
    code: 406,
    name: "Not Acceptable",
    category: "Client Error",
    description: "The target resource cannot produce a representation matching the Accept headers.",
    detail:
      "The target resource does not have a current representation that would be acceptable to the user agent, according to the proactive negotiation headers (Accept, Accept-Charset, Accept-Encoding, Accept-Language).",
    spec: "RFC 9110 §15.5.7",
    cacheable: false,
    hasResponseBody: true,
    commonHeaders: ["Content-Type"],
  },
  {
    code: 407,
    name: "Proxy Authentication Required",
    category: "Client Error",
    description: "Client must first authenticate itself with the intermediate proxy.",
    detail:
      "Similar to 401 Unauthorized, but authentication must be performed through an intermediary proxy. The proxy must send a Proxy-Authenticate header containing the challenge.",
    spec: "RFC 9110 §15.5.8",
    cacheable: false,
    hasResponseBody: true,
    commonHeaders: ["Proxy-Authenticate"],
  },
  {
    code: 408,
    name: "Request Timeout",
    category: "Client Error",
    description: "The server timed out waiting for the client request to complete.",
    detail:
      "The server did not receive a complete request message within the time that it was prepared to wait. The client may repeat the request without modifications at any later time.",
    spec: "RFC 9110 §15.5.9",
    cacheable: false,
    hasResponseBody: true,
    commonHeaders: ["Connection"],
  },
  {
    code: 409,
    name: "Conflict",
    category: "Client Error",
    description: "The request conflicts with the current state of the target resource.",
    detail:
      "Indicates that the request could not be processed because of conflict in the current state of the resource, such as an edit conflict between multiple concurrent updates or duplicate unique keys.",
    spec: "RFC 9110 §15.5.10",
    cacheable: false,
    hasResponseBody: true,
    commonHeaders: ["Content-Type"],
  },
  {
    code: 410,
    name: "Gone",
    category: "Client Error",
    description: "The target resource is no longer available and no forwarding address is known.",
    detail:
      "The resource requested is no longer available and will not be available again. Unlike 404, this status tells search engine crawlers and caches to permanently purge the resource representation.",
    spec: "RFC 9110 §15.5.11",
    cacheable: true,
    hasResponseBody: true,
    commonHeaders: ["Content-Type", "Cache-Control"],
  },
  {
    code: 411,
    name: "Length Required",
    category: "Client Error",
    description: "The server refuses to accept the request without a defined Content-Length.",
    detail:
      "The server requires a Content-Length header field to be specified in the request before it will process the request body.",
    spec: "RFC 9110 §15.5.12",
    cacheable: false,
    hasResponseBody: true,
  },
  {
    code: 412,
    name: "Precondition Failed",
    category: "Client Error",
    description: "One or more conditions given in request headers evaluated to false.",
    detail:
      "One or more conditions in the request header fields (such as If-Match, If-Unmodified-Since, or If-None-Match) evaluated to false when tested on the server.",
    spec: "RFC 9110 §15.5.13",
    cacheable: false,
    hasResponseBody: true,
  },
  {
    code: 413,
    name: "Payload Too Large",
    category: "Client Error",
    description: "The request body is larger than the limits defined by the server.",
    detail:
      "The server refuses to process the request because the payload is larger than what the server is willing or able to process (e.g. file upload size limit exceeded).",
    spec: "RFC 9110 §15.5.14",
    cacheable: false,
    hasResponseBody: true,
    commonHeaders: ["Retry-After", "Connection"],
  },
  {
    code: 414,
    name: "URI Too Long",
    category: "Client Error",
    description: "The URI provided was too long for the server to process.",
    detail:
      "The server is refusing to service the request because the request-target URI length exceeds the maximum buffer the server is configured to allow.",
    spec: "RFC 9110 §15.5.15",
    cacheable: true,
    hasResponseBody: true,
  },
  {
    code: 415,
    name: "Unsupported Media Type",
    category: "Client Error",
    description: "The payload format is in an unsupported format for the requested method.",
    detail:
      "The origin server is refusing to service the request because the payload has a media format not supported by the method on the target resource (e.g. sending XML to a JSON endpoint).",
    spec: "RFC 9110 §15.5.16",
    cacheable: false,
    hasResponseBody: true,
    commonHeaders: ["Accept", "Accept-Encoding"],
  },
  {
    code: 416,
    name: "Range Not Satisfiable",
    category: "Client Error",
    description: "The ranges specified in the Range header cannot be satisfied.",
    detail:
      "None of the ranges in the request's Range header field overlap the current extent of the selected resource. Should include a Content-Range header indicating the resource size.",
    spec: "RFC 9110 §15.5.17",
    cacheable: false,
    hasResponseBody: true,
    commonHeaders: ["Content-Range"],
  },
  {
    code: 417,
    name: "Expectation Failed",
    category: "Client Error",
    description: "The expectation given in the Expect request header could not be met.",
    detail:
      "The expectation given in the Expect request-header field (e.g., 100-continue) could not be met by at least one of the inbound servers.",
    spec: "RFC 9110 §15.5.18",
    cacheable: false,
    hasResponseBody: true,
  },
  {
    code: 418,
    name: "I'm a teapot",
    category: "Client Error",
    description: "The server refuses to brew coffee because it is, permanently, a teapot.",
    detail:
      "Defined in RFC 2324 (Hyper Text Coffee Pot Control Protocol) as an April Fools' joke in 1998, but standardized by RFC 9110 and widely implemented by web servers and frameworks as an Easter egg.",
    spec: "RFC 2324 §2.3.2 / RFC 9110",
    cacheable: false,
    hasResponseBody: true,
  },
  {
    code: 421,
    name: "Misdirected Request",
    category: "Client Error",
    description: "The request was directed at a server that is not able to produce a response.",
    detail:
      "The request was directed at a server that is not able to produce a response (for example because of connection reuse across multiple domain certificates in HTTP/2 or HTTP/3).",
    spec: "RFC 9110 §15.5.20",
    cacheable: false,
    hasResponseBody: true,
  },
  {
    code: 422,
    name: "Unprocessable Content",
    category: "Client Error",
    description:
      "The request was well-formed but contains semantic errors (e.g., validation failure).",
    detail:
      "The server understands the content type and syntax of the request entity, but was unable to process the contained instructions due to semantic validation errors (standard for REST API validation errors).",
    spec: "RFC 9110 §15.5.21",
    cacheable: false,
    hasResponseBody: true,
    commonHeaders: ["Content-Type"],
  },
  {
    code: 423,
    name: "Locked",
    category: "Client Error",
    description: "The source or destination resource is locked (WebDAV).",
    detail:
      "WebDAV status code indicating the source or destination resource of a method is currently locked from modification.",
    spec: "RFC 4918 §11.3",
    cacheable: false,
    hasResponseBody: true,
  },
  {
    code: 424,
    name: "Failed Dependency",
    category: "Client Error",
    description: "The request failed because it depended on another request that failed (WebDAV).",
    detail:
      "WebDAV status code indicating the method could not be performed because the requested action depended on another action and that action failed.",
    spec: "RFC 4918 §11.4",
    cacheable: false,
    hasResponseBody: true,
  },
  {
    code: 425,
    name: "Too Early",
    category: "Client Error",
    description: "The server is unwilling to risk processing a request that might be replayed.",
    detail:
      "Indicates that the server is unwilling to risk processing a request that might be replayed (e.g. in TLS early data / 0-RTT handshakes).",
    spec: "RFC 8470 §5.2",
    cacheable: false,
    hasResponseBody: true,
    commonHeaders: ["Early-Data"],
  },
  {
    code: 426,
    name: "Upgrade Required",
    category: "Client Error",
    description: "The server refuses to perform the request using the current protocol.",
    detail:
      "The server refuses to perform the request using the current protocol, but might be willing to do so after the client upgrades to a different protocol specified in the Upgrade header.",
    spec: "RFC 9110 §15.5.22",
    cacheable: false,
    hasResponseBody: true,
    commonHeaders: ["Upgrade", "Connection"],
  },
  {
    code: 428,
    name: "Precondition Required",
    category: "Client Error",
    description: "The origin server requires the request to be conditional.",
    detail:
      "Designed to prevent the 'lost update' problem, where a client GETs a resource's state, modifies it, and PUTs it back to the server, while a third party has modified the state on the server in the meantime.",
    spec: "RFC 6585 §3",
    cacheable: false,
    hasResponseBody: true,
    commonHeaders: ["Content-Type"],
  },
  {
    code: 429,
    name: "Too Many Requests",
    category: "Client Error",
    description: "The user has sent too many requests in a given amount of time (rate limited).",
    detail:
      "Indicates rate limiting by the server. The response representations SHOULD explain the condition and MAY include a Retry-After header indicating how long to wait before making a new request.",
    spec: "RFC 6585 §4",
    cacheable: false,
    hasResponseBody: true,
    commonHeaders: [
      "Retry-After",
      "X-RateLimit-Limit",
      "X-RateLimit-Remaining",
      "X-RateLimit-Reset",
    ],
  },
  {
    code: 431,
    name: "Request Header Fields Too Large",
    category: "Client Error",
    description:
      "The server is unwilling to process the request because header fields are too large.",
    detail:
      "The server is unwilling to process the request because its header fields (either an individual header or all headers collectively) are larger than configured limits. Common with large cookie headers.",
    spec: "RFC 6585 §5",
    cacheable: false,
    hasResponseBody: true,
  },
  {
    code: 451,
    name: "Unavailable For Legal Reasons",
    category: "Client Error",
    description:
      "The resource is blocked as a consequence of a legal demand or government censorship.",
    detail:
      "A reference to Ray Bradbury's novel Fahrenheit 451. Indicates that access to the resource is blocked due to legal demands (e.g. copyright notices, court orders, or state censorship).",
    spec: "RFC 7725 §3",
    cacheable: true,
    hasResponseBody: true,
    commonHeaders: ["Link", "Content-Type"],
  },

  // 5xx Server Error
  {
    code: 500,
    name: "Internal Server Error",
    category: "Server Error",
    description:
      "The server encountered an unexpected condition that prevented it from fulfilling the request.",
    detail:
      "A generic catch-all error message returned when an unexpected condition was encountered and no more specific 5xx message is suitable.",
    spec: "RFC 9110 §15.6.1",
    cacheable: false,
    hasResponseBody: true,
    commonHeaders: ["Content-Type"],
  },
  {
    code: 501,
    name: "Not Implemented",
    category: "Server Error",
    description: "The server does not support the functionality required to fulfill the request.",
    detail:
      "The server does not recognize the request method and is not capable of supporting it for any resource (e.g. an unknown HTTP verb).",
    spec: "RFC 9110 §15.6.2",
    cacheable: true,
    hasResponseBody: true,
  },
  {
    code: 502,
    name: "Bad Gateway",
    category: "Server Error",
    description:
      "The server, while acting as a gateway or proxy, received an invalid response from the upstream server.",
    detail:
      "The server was acting as a gateway or proxy (e.g., Nginx, Envoy, Cloudflare) and received an invalid or corrupt response from the inbound upstream application server.",
    spec: "RFC 9110 §15.6.3",
    cacheable: false,
    hasResponseBody: true,
    commonHeaders: ["Content-Type"],
  },
  {
    code: 503,
    name: "Service Unavailable",
    category: "Server Error",
    description:
      "The server is currently unable to handle the request due to temporary overloading or maintenance.",
    detail:
      "The server is currently unable to handle the request due to a temporary overload or scheduled maintenance. A Retry-After header may specify the expected duration of the downtime.",
    spec: "RFC 9110 §15.6.4",
    cacheable: false,
    hasResponseBody: true,
    commonHeaders: ["Retry-After", "Content-Type"],
  },
  {
    code: 504,
    name: "Gateway Timeout",
    category: "Server Error",
    description:
      "The server, while acting as a gateway or proxy, did not receive a timely response from upstream.",
    detail:
      "The server was acting as a gateway or proxy and did not receive a timely response from the upstream server (e.g. backend application, database, or API) that it needed to access to complete the request.",
    spec: "RFC 9110 §15.6.5",
    cacheable: false,
    hasResponseBody: true,
    commonHeaders: ["Content-Type"],
  },
  {
    code: 505,
    name: "HTTP Version Not Supported",
    category: "Server Error",
    description:
      "The server does not support the HTTP protocol version that was used in the request.",
    detail:
      "The server does not support, or refuses to support, the major version of HTTP that was used in the request message.",
    spec: "RFC 9110 §15.6.6",
    cacheable: false,
    hasResponseBody: true,
  },
  {
    code: 506,
    name: "Variant Also Negotiates",
    category: "Server Error",
    description: "Transparent content negotiation for the request results in a circular reference.",
    detail:
      "Indicates that the server has an internal configuration error: the chosen variant resource is configured to engage in transparent content negotiation itself, creating an infinite loop.",
    spec: "RFC 2295 §8.1",
    cacheable: false,
    hasResponseBody: true,
  },
  {
    code: 507,
    name: "Insufficient Storage",
    category: "Server Error",
    description:
      "The server is unable to store the representation needed to complete the request (WebDAV).",
    detail:
      "WebDAV status code indicating the method could not be performed on the resource because the server is unable to store the representation needed to successfully complete the request.",
    spec: "RFC 4918 §11.5",
    cacheable: false,
    hasResponseBody: true,
  },
  {
    code: 508,
    name: "Loop Detected",
    category: "Server Error",
    description:
      "The server terminated an operation because it encountered an infinite loop (WebDAV).",
    detail:
      "WebDAV status code indicating the server terminated an operation because it encountered an infinite loop while processing 'Depth: infinity'.",
    spec: "RFC 5842 §7.2",
    cacheable: false,
    hasResponseBody: true,
  },
  {
    code: 510,
    name: "Not Extended",
    category: "Server Error",
    description: "Further extensions to the request are required for the server to fulfill it.",
    detail:
      "A policy for accessing the resource has not been met in the request. The server should send back all the information necessary for the client to issue an extended request.",
    spec: "RFC 2774 §7",
    cacheable: false,
    hasResponseBody: true,
  },
  {
    code: 511,
    name: "Network Authentication Required",
    category: "Server Error",
    description:
      "The client needs to authenticate to gain network access (e.g. Wi-Fi captive portal).",
    detail:
      "Indicates that the client needs to authenticate to gain network access (such as agreeing to terms of service on a public Wi-Fi captive portal).",
    spec: "RFC 6585 §6",
    cacheable: false,
    hasResponseBody: true,
    commonHeaders: ["Location", "Content-Type"],
  },
];

export function getHttpStatus(code: number): HttpStatus | undefined {
  return HTTP_STATUS_CODES.find((s) => s.code === code);
}

export function findHttpStatuses(query: string): readonly HttpStatus[] {
  const q = query.trim().toLowerCase();
  if (!q) return HTTP_STATUS_CODES;

  return HTTP_STATUS_CODES.filter((s) => {
    const haystack = [
      String(s.code),
      s.name,
      s.category,
      s.spec,
      s.description,
      s.detail,
      ...(s.commonHeaders ?? []),
    ]
      .join(" ")
      .toLowerCase();

    return haystack.includes(q);
  });
}

export function generateHttpWireResponse(status: HttpStatus, dateOverride?: string): string {
  const dateStr = dateOverride ?? new Date().toUTCString();
  const headers = [
    `HTTP/1.1 ${status.code} ${status.name}`,
    `Date: ${dateStr}`,
    "Server: kitland/1.0",
    "Content-Type: application/json; charset=utf-8",
  ];

  if (status.commonHeaders?.includes("Location")) {
    headers.push("Location: https://example.com/resource/123");
  }
  if (status.commonHeaders?.includes("Retry-After")) {
    headers.push("Retry-After: 60");
  }
  if (status.commonHeaders?.includes("WWW-Authenticate")) {
    headers.push('WWW-Authenticate: Bearer realm="api", error="invalid_token"');
  }
  if (status.commonHeaders?.includes("Allow")) {
    headers.push("Allow: GET, POST, HEAD, OPTIONS");
  }
  if (status.commonHeaders?.includes("ETag")) {
    headers.push('ETag: W/"1a2b3c4d5e"');
  }

  if (status.hasResponseBody === "none") {
    return headers.join("\r\n");
  }

  const isError = status.category === "Client Error" || status.category === "Server Error";
  const body = isError
    ? JSON.stringify(
        {
          statusCode: status.code,
          error: status.name,
          message: status.description,
        },
        null,
        2,
      )
    : JSON.stringify(
        {
          statusCode: status.code,
          message: status.description,
          data: {},
        },
        null,
        2,
      );

  return `${headers.join("\r\n")}\r\nContent-Length: ${body.length}\r\n\r\n${body}`;
}

export function generateClientFetchSnippet(status: HttpStatus): string {
  const isError = status.category === "Client Error" || status.category === "Server Error";
  if (status.code === 204) {
    return `// JavaScript Fetch Client (204 No Content)
const response = await fetch('/api/resource/123', {
  method: 'DELETE',
});

if (response.status === 204) {
  console.log('Resource deleted successfully (no content returned).');
}`;
  }

  if (isError) {
    return `// JavaScript Fetch Client (${status.code} ${status.name})
try {
  const response = await fetch('/api/resource');

  if (response.status === ${status.code}) {
    const errorData = await response.json();
    console.error('${status.name} (${status.code}):', errorData.message);
  }
} catch (err) {
  console.error('Network request failed:', err);
}`;
  }

  return `// JavaScript Fetch Client (${status.code} ${status.name})
const response = await fetch('/api/resource');

if (response.status === ${status.code}) {
  const payload = await response.json();
  console.log('Success (${status.code}):', payload);
}`;
}

export function generateServerExpressSnippet(status: HttpStatus): string {
  const isError = status.category === "Client Error" || status.category === "Server Error";
  if (status.hasResponseBody === "none") {
    return `// Express / Node.js (${status.code} ${status.name})
app.delete('/api/resource/:id', (req, res) => {
  // Return ${status.code} ${status.name} without body
  return res.status(${status.code}).end();
});`;
  }

  if (isError) {
    return `// Express / Node.js (${status.code} ${status.name})
app.get('/api/resource/:id', (req, res) => {
  return res.status(${status.code}).json({
    statusCode: ${status.code},
    error: ${JSON.stringify(status.name)},
    message: ${JSON.stringify(status.description)},
  });
});`;
  }

  return `// Express / Node.js (${status.code} ${status.name})
app.get('/api/resource/:id', (req, res) => {
  return res.status(${status.code}).json({
    statusCode: ${status.code},
    message: ${JSON.stringify(status.description)},
    data: { id: req.params.id },
  });
});`;
}

