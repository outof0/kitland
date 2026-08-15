import { mkdir } from "node:fs/promises";

await mkdir(new URL("../artifacts/", import.meta.url), { recursive: true });
