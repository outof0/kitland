import type { ToolResult } from "@kitland/core";
import type { CatalogTool } from "@kitland/tool-catalog";

export type ToolChoice = {
  id: string;
  label: string;
};

export type ToolOperation = ToolChoice & {
  actionLabel: string;
};

/**
 * The first renderer contract. Future tool families add a new discriminant and
 * renderer bundle without changing adapter execution or catalog discovery.
 */
export type TextTransformRenderer = {
  kind: "text-transform";
  operations: readonly ToolOperation[];
  options: readonly ToolChoice[];
  optionLabel: string;
  defaultOperationId: string;
  defaultOptionId: string;
};

export type ToolDescriptor = {
  id: string;
  title: string;
  description: string;
  renderer: TextTransformRenderer;
};

export type TextTransformRequest = {
  operationId: string;
  optionId: string;
  input: string;
};

export type SelectionCommand = {
  commandId: string;
  operationId: string;
  optionId: string;
};

export interface ToolAdapter {
  /** Canonical product identity and host-capability contract. */
  readonly catalogTool: CatalogTool;
  readonly descriptor: ToolDescriptor;
  readonly maxOutputChars: number;
  readonly maxSelectionChars: number;
  readonly selectionCommands: readonly SelectionCommand[];
  inputLimit(operationId: string): number | undefined;
  transform(request: TextTransformRequest): ToolResult<string>;
}
