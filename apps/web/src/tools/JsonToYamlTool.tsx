import { JsonToYamlTool as SharedJsonToYamlTool } from "@kitland/ui/tools/JsonToYamlTool";
import { dispatchToolModeNavigation } from "@/lib/tool-mode-navigation";

export function JsonToYamlTool() {
  return (
    <SharedJsonToYamlTool
      onModeNavigate={(slug) => {
        dispatchToolModeNavigation(slug);
      }}
    />
  );
}
