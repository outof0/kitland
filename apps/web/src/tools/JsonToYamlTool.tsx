import { JsonToYamlTool as SharedJsonToYamlTool } from "@kitland/ui/tools/JsonToYamlTool";

export function JsonToYamlTool() {
  return (
    <SharedJsonToYamlTool
      onModeNavigate={(slug) => {
        window.history.replaceState(null, "", `/explore/${slug}`);
      }}
    />
  );
}
