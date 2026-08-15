import { ToolWorkspace } from "@/components/tools/ToolWorkspace";

type ToolWorkspaceIslandProps = {
  slug: string;
};

/** Keeps the interactive tool workspace isolated from Astro page rendering. */
export function ToolWorkspaceIsland({ slug }: ToolWorkspaceIslandProps) {
  return <ToolWorkspace slug={slug} />;
}
