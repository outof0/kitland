# Privacy Policy for Kitland

**Last updated**: August 25, 2026

Kitland ("we", "our", or "Kitland") is an open-source, local-first developer tool suite available across Web, Browser Extension, VS Code Extension, and MCP Server.

We believe your code, tokens, data payloads, and developer secrets belong exclusively to you. This Privacy Policy outlines our strict privacy-first architecture and explains how we protect your privacy.

---

## 1. Zero Payload Collection & Storage

- **No Payload Logging**: Kitland does not collect, record, log, transmit, or store any text, code, JSON payloads, API keys, hashes, tokens, or files you input into any tool.
- **No User Accounts**: Kitland does not require accounts, logins, email addresses, or user profiles.
- **No In-App Tracking SDKs**: Kitland does not embed third-party behavioral tracking libraries (such as Mixpanel, Hotjar, or session recorders) inside the tool application.

---

## 2. 100% Client-Side & Local Execution

- All transformations, formatters, cryptographic algorithms, regex testers, and data converters run entirely client-side inside your browser tab or local Web Workers.
- No payload network requests are dispatched during tool execution.
- Tools operate completely offline without requiring an active internet connection.

---

## 3. Browser Extension & Permissions Boundary

The Kitland Browser Extension operates under a strict zero-permission model:

- **No Permissions Requested**: Declares `permissions: []` and `host_permissions: []` in `manifest.json`.
- **No Website Access**: Does not inject content scripts or access web pages you browse.
- **No Background Network Activity**: Contains no background tracking service workers or remote code loading.
- **Store-Level Metrics**: Aggregated usage statistics (e.g. total installs, active extension users, crash reports) are provided anonymously by the Chrome Web Store Developer Console at the platform level without any telemetry code embedded in the extension itself.

---

## 4. Web Sharing & Link State

When using the Web application:

- **No Server-Side State**: Kitland does not store shared links or data payloads on any backend server.
- **Fragment-Only State**: If you explicitly generate a share link, the state is encoded entirely in the URL hash/fragment (`#`), which is never sent to the web server in HTTP request headers.

---

## 5. Third-Party Hosting & Platform Telemetry

- **Static Hosting**: The web application is hosted via Cloudflare Pages. Standard, privacy-preserving edge access logs (IP addresses and browser user-agent headers for basic routing and DDoS protection) may be processed by the CDN provider in accordance with their privacy standards. No tool payloads or user inputs are ever visible to or processed by the hosting provider.
- **No Data Selling**: We do not sell, rent, monetize, or trade any user information to third parties.

---

## 6. Open Source Transparency

Kitland is open source under the MIT License. You can inspect, audit, or self-host our entire codebase at:

- **GitHub**: [https://github.com/outof0/kitland](https://github.com/outof0/kitland)

---

## 7. Contact & Inquiries

If you have any questions, suggestions, or concerns regarding this Privacy Policy, please contact us:

- **Email**: [hello.outof0@gmail.com](mailto:hello.outof0@gmail.com)
- **GitHub Issues**: [https://github.com/outof0/kitland/issues](https://github.com/outof0/kitland/issues)
