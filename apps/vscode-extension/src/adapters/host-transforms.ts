import { getHostTransformSpec, HOST_TRANSFORM_SLUGS } from "@kitland/core";
import { getToolBySlug } from "@kitland/tools";
import { PROTOCOL_MAX_TEXT_CHARS } from "../constants";
import { getVscodeHostRuntime } from "../host-runtime";
import type { TextTransformAdapter } from "../toolAdapter";

function createAdapter(slug: string): TextTransformAdapter {
  const registryTool = getToolBySlug(slug);
  if (!registryTool) throw new Error(`Missing registry definition for host transform "${slug}".`);
  const spec = getHostTransformSpec(slug);
  if (!spec) throw new Error(`Missing host transform spec for "${slug}".`);

  const maxInputChars = Math.min(Math.max(spec.maxInputChars, 1), PROTOCOL_MAX_TEXT_CHARS);
  const maxOutputChars = Math.min(
    Math.max(maxInputChars * 4, maxInputChars, 64_000),
    PROTOCOL_MAX_TEXT_CHARS,
  );

  let runtimePromise: ReturnType<typeof getVscodeHostRuntime> | undefined;

  return {
    registryTool,
    descriptor: {
      id: registryTool.id,
      title: registryTool.shortName,
      description: registryTool.description,
      renderer: {
        kind: "text-transform",
        operations: spec.operations,
        options: spec.options,
        optionLabel: spec.optionLabel,
        defaultOperationId: spec.defaultOperationId,
        defaultOptionId: spec.defaultOptionId,
      },
    },
    maxOutputChars,
    maxSelectionChars: maxInputChars,
    selectionCommands: [],
    inputLimit() {
      return maxInputChars;
    },
    async transform(request) {
      runtimePromise ??= getVscodeHostRuntime();
      const runtime = await runtimePromise;
      return spec.transform(
        {
          operationId: request.operationId,
          optionId: request.optionId,
          input: request.input,
          ...(request.secondaryInput !== undefined
            ? { secondaryInput: request.secondaryInput }
            : {}),
        },
        runtime,
      );
    },
  };
}

export const hostTransformAdapters: readonly TextTransformAdapter[] =
  HOST_TRANSFORM_SLUGS.map(createAdapter);
