import { EncodingToolBySlug } from "@kitland/ui/tools/encoding-tools";
import type { ToolComponentProps } from "../toolRegistry";

export default function EncodingWrapper({ slug, initialInput }: ToolComponentProps) {
  return (
    <EncodingToolBySlug
      slug={slug}
      {...(initialInput !== undefined ? { initialInput } : {})}
      capabilities={{ fileOpen: false, fileSave: false }}
    />
  );
}
