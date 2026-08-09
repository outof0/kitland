import type { ToolResult } from "./result";
import type { HostRuntime } from "./host-runtime";

export type HostTransformRequest = {
  readonly operationId: string;
  readonly optionId: string;
  readonly input: string;
  readonly secondaryInput?: string;
};

export type HostTransformSpec = {
  readonly slug: string;
  readonly maxInputChars: number;
  readonly operations: readonly { id: string; label: string; actionLabel: string }[];
  readonly options: readonly { id: string; label: string }[];
  readonly optionLabel: string;
  readonly defaultOperationId: string;
  readonly defaultOptionId: string;
  readonly secondaryInput?: { readonly label: string; readonly maxChars?: number };
  readonly allowEmptyInput?: boolean;
  readonly transform: (
    request: HostTransformRequest,
    runtime: HostRuntime,
  ) => ToolResult<string> | Promise<ToolResult<string>>;
};
