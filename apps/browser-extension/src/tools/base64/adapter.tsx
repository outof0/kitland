import { FULL_CAPABILITIES } from "@kitland/ui";
import { Base64Tool } from "@kitland/ui/tools/Base64Tool";
import { useWorkerBase64Transform } from "./useWorkerBase64Transform";

/** Shared Base64 UI plus the packaged worker. No share link. */
export default function Base64ExtensionTool() {
  return <Base64Tool useTransform={useWorkerBase64Transform} capabilities={FULL_CAPABILITIES} />;
}
