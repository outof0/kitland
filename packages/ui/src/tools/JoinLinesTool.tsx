import type { ToolCapabilities } from "../capabilities";
import { SplitToNewlinesTool, type SplitJoinMode } from "./SplitToNewlinesTool";

export type JoinLinesToolProps = {
  readonly initialInput?: string | undefined;
  readonly capabilities?: ToolCapabilities | undefined;
  readonly onModeNavigate?: ((slug: SplitJoinMode) => void) | undefined;
};

/** Join Lines shares the tested Split workflow while owning its public route and metadata. */
export function JoinLinesTool({
  initialInput,
  capabilities,
  onModeNavigate,
}: JoinLinesToolProps = {}) {
  return (
    <SplitToNewlinesTool
      initialMode="join-lines"
      initialInput={initialInput}
      capabilities={capabilities}
      onModeNavigate={onModeNavigate}
    />
  );
}
