# Chrome Web Store Assets & Submission Guide

Bộ hình ảnh và tài liệu chuẩn bị cho việc submit **Kitland Tools** lên Chrome Web Store.

---

## 📁 Danh sách hình ảnh đã tạo (`apps/browser-extension/store-assets/`)

| Tên file                                                                                                                                            | Kích thước (px) | Mục đích trên Chrome Web Store                                         |
| :-------------------------------------------------------------------------------------------------------------------------------------------------- | :-------------- | :--------------------------------------------------------------------- |
| [`01-json-formatter-1280x800.png`](file:///Users/erik/workspace/lab/js/format/apps/browser-extension/store-assets/01-json-formatter-1280x800.png)   | 1280 × 800      | Screenshot 1: JSON Formatter & Validator, Tree Inspection, Dark Theme  |
| [`02-curl-converter-1280x800.png`](file:///Users/erik/workspace/lab/js/format/apps/browser-extension/store-assets/02-curl-converter-1280x800.png)   | 1280 × 800      | Screenshot 2: cURL Converter sang Fetch / JavaScript code              |
| [`03-jwt-decoder-1280x800.png`](file:///Users/erik/workspace/lab/js/format/apps/browser-extension/store-assets/03-jwt-decoder-1280x800.png)         | 1280 × 800      | Screenshot 3: JWT Header, Claims Payload & Signature Security Suite    |
| [`04-regex-tester-1280x800.png`](file:///Users/erik/workspace/lab/js/format/apps/browser-extension/store-assets/04-regex-tester-1280x800.png)       | 1280 × 800      | Screenshot 4: Regex Tester với realtime matches & capture groups       |
| [`05-command-palette-1280x800.png`](file:///Users/erik/workspace/lab/js/format/apps/browser-extension/store-assets/05-command-palette-1280x800.png) | 1280 × 800      | Screenshot 5: Quick Command Palette (`Ctrl+K`) tìm kiếm 65+ công cụ    |
| [`promo-small-440x280.png`](file:///Users/erik/workspace/lab/js/format/apps/browser-extension/store-assets/promo-small-440x280.png)                 | 440 × 280       | **Small Promo Tile**: Hiển thị trong kết quả tìm kiếm & danh mục store |
| [`promo-marquee-1400x560.png`](file:///Users/erik/workspace/lab/js/format/apps/browser-extension/store-assets/promo-marquee-1400x560.png)           | 1400 × 560      | **Marquee Promo Banner**: Banner quảng bá trang chủ Chrome Web Store   |
| [`icon-128.png`](file:///Users/erik/workspace/lab/js/format/apps/browser-extension/public/icons/icon-128.png)                                       | 128 × 128       | **Store Icon**: Icon chính của extension trên Web Store                |

---

## 📝 Thông tin điền Store Listing (Copy & Paste)

### 1. Store Metadata

- **Extension Name**: `Kitland Tools`
- **Short Name**: `Kitland`
- **Version**: `0.1.1`
- **Summary / Short description** (Tối đa 132 ký tự):
  > `Everyday developer tools in one place. 100% offline, zero tracking, no accounts, and no extension permissions required.`

### 2. Category

- **Category**: `Developer Tools` hoặc `Productivity`

### 3. Detailed Description (Mô tả chi tiết)

```markdown
Kitland is an open-source, local-first developer tool suite designed to speed up your everyday workflows directly in your browser.

⚡ ZERO PERMISSIONS & 100% OFFLINE PRIVACY
• No permissions or host_permissions requested.
• Zero network calls, telemetry, tracking, or remote code execution.
• All computations and transformations happen entirely in your local browser tab / web workers.
• Your sensitive data, tokens, and payloads never leave your machine.

🛠️ OVER 65+ INTEGRATED DEVELOPER TOOLS:
• Format & Validate: JSON Formatter, JSON Diff, Beautify/Minify, SQL Formatter, XML Formatter, Markdown Preview, JSON to YAML / TOML / CSV / TypeScript.
• Encoders & Decoders: Base64, URL Encode/Decode, HTML Entities, Hex, Binary, Unicode, Morse Code, ROT13.
• Crypto & Security: JWT Decoder, HMAC Generator, SHA Hashes (SHA-256, SHA-512), AES Cipher, Bcrypt Hash, RSA Key Pair Generator, Password Generator, Token & UUID / ULID / NanoID Generators.
• Web & Network: cURL to Fetch/Axios Converter, HTTP Status Codes Reference, MIME Types, IP Subnet Calculator, User-Agent Parser, Basic Auth Header Generator.
• Text & Utilities: Regex Tester with Live Matching, Text Diff, Sort & Dedupe Lines, Case Converter (camelCase, kebab-case, snake_case, etc.), Text Stats, Lorem Ipsum.
• Converters & Calculators: Unix Timestamp, Timezone Converter, Date/Age Calculator, Duration Formatter, Color Converter (HEX/RGB/HSL), Number Base, Data Size Units.

🚀 KEY FEATURES:
• Quick Command Palette: Press Ctrl+K (or Cmd+K) to instantly search and switch between any tool.
• Modern Dark / Light Mode with instant theme toggle.
• Fast, responsive, keyboard-friendly UI powered by CodeMirror.
• Lightweight: Dynamic loading ensures only the selected tool code is loaded into memory.

Open-source under MIT License.
Website: https://kitland.dev
GitHub: https://github.com/outof0/kitland
```

---

## 🛡️ Privacy Practices Declaration (Khai báo quyền riêng tư)

Khi điền mục **Privacy practices** trên Chrome Web Store Developer Dashboard:

1. **Privacy policy URL**:
   - URL chính thức: `https://kitland.dev/privacy`
   - URL dự phòng (GitHub): `https://github.com/outof0/kitland/blob/main/PRIVACY.md`
2. **Single Purpose**:
   - `Provide everyday offline developer utilities (formatting, encoding, cryptography, converters) directly in a local browser tab.`
3. **Permissions Justification**:
   - Extension không yêu cầu bất kỳ permission nào (`permissions: []`, `host_permissions: []`).
4. **Data Usage**:
   - Collects user data: **NO** (Không thu thập bất kỳ dữ liệu cá nhân hay payload nào).
   - Does not sell data: **Checked (Đánh dấu tích)**.
   - Does not use/transfer data for purposes unrelated to the item's core functionality: **Checked**.
   - Does not use/transfer data to determine creditworthiness or for lending purposes: **Checked**.

---

## 🔄 Cách tự động tạo lại ảnh bất kỳ lúc nào

Chạy lệnh sau tại thư mục root hoặc thư mục extension:

```bash
# Tạo lại toàn bộ screenshots và promo banners
pnpm --filter @kitland/browser-extension screenshots

# Đóng gói zip bản phát hành mới nhất
pnpm --filter @kitland/browser-extension package:chrome
```

File ZIP sau khi đóng gói sẽ nằm tại: `apps/browser-extension/artifacts/kitland-browser-extension-v0.1.1.zip`.
