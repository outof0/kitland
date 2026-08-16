import { SharedRegistryTool } from "@kitland/ui/registry";
import type { ToolComponentProps } from "../toolRegistry";
import { useVscodeRegexTester } from "../useRegexTester";

export default function SharedRegistryWrapper({ slug, initialInput }: ToolComponentProps) {
  return (
    <SharedRegistryTool
      slug={slug}
      {...(initialInput !== undefined ? { initialInput } : {})}
      capabilities={{ fileOpen: false, fileSave: false }}
      {...(slug === "regex-tester" ? { useTester: useVscodeRegexTester } : {})}
    />
  );
}
