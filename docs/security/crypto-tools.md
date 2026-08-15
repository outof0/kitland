# Local cryptography tools (KIT-0012)

Threat-model summary for web crypto tools. All tools are **local-only**: no
network, no default secret persistence, no telemetry of payloads.

| Tool              | Inputs                     | Secrets                | Primitive                   | Limits              | Failure behavior                     |
| ----------------- | -------------------------- | ---------------------- | --------------------------- | ------------------- | ------------------------------------ |
| SHA Hash          | UTF-8 text                 | none                   | SHA-256 via host Web Crypto | input size cap      | typed oversize/invalid               |
| HMAC Generator    | message + secret           | secret stays in memory | HMAC-SHA-256 via host       | secret/message caps | secret required; oversize            |
| Bcrypt Hash       | password                   | password ephemeral     | bcrypt                      | cost + length caps  | verify mismatch / invalid hash       |
| AES Cipher        | plaintext/ciphertext + key | key/nonce local        | AES-GCM                     | payload caps        | auth failure on bad tag              |
| JWT Decoder       | token                      | none (decode only)     | base64url parse             | size caps           | malformed segments; **not verified** |
| Token Generator   | length options             | generated token        | CSPRNG                      | length caps         | entropy unavailable                  |
| RSA Key Pair      | size options               | private key ephemeral  | Web Crypto RSA-OAEP         | size options        | generation failure                   |
| Basic Auth Header | user/password              | credentials ephemeral  | Base64 encode               | length caps         | empty/invalid; not encryption        |

Review before promoting hosts beyond web.
