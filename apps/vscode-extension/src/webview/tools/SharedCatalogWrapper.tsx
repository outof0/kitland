import { SharedCatalogTool } from "@kitland/ui/catalog";
import type { ToolComponentProps } from "../toolRegistry";
import { useVscodeRegexTester } from "../useRegexTester";

export default function SharedCatalogWrapper({ slug, initialInput }: ToolComponentProps) {
  return (
    <SharedCatalogTool
      slug={slug}
      {...(initialInput !== undefined ? { initialInput } : {})}
      capabilities={{ fileOpen: false, fileSave: false }}
      {...(slug === "regex-tester" ? { useTester: useVscodeRegexTester } : {})}
    />
  );
}
