import type { ToolCapabilities } from "../capabilities";
import { JsonToYamlTool } from "./JsonToYamlTool";

export type YamlToJsonToolProps = {
  readonly initialInput?: string;
  readonly capabilities?: ToolCapabilities;
};

/** Safe YAML to JSON tool. */
export function YamlToJsonTool({ initialInput, capabilities }: YamlToJsonToolProps = {}) {
  return (
    <JsonToYamlTool
      initialMode="yaml-to-json"
      initialInput={initialInput}
      capabilities={capabilities}
    />
  );
}
