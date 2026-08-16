import type { HostRuntime, HostTransformSpec, ToolResult } from "@kitland/core";
import { getToolBySlug } from "@kitland/tools";
import { TextTransformEditor } from "../components/TextTransformEditor";
import { sampleFor, sampleSecondary, toolIconFor } from "../tool-meta";
import { ArrowRight, Wand2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { LOCAL_ONLY_CAPABILITIES, type ToolCapabilities } from "../capabilities";

export type GenericTransformToolProps = {
  readonly slug: string;
  /** Resolved by the host adapter so tool implementations stay out of the shared editor chunk. */
  readonly spec: HostTransformSpec;
  readonly getRuntime: () => HostRuntime | Promise<HostRuntime>;
  /**
   * Host-declared local powers (file open/save). Defaults to local-only; a
   * host may only pass file powers when its registry entry grants them.
   */
  readonly capabilities?: ToolCapabilities;
  /** Prefill from a host selection (VS Code editor). Empty when unused. */
  readonly initialInput?: string;
};

type EditorState = {
  result: ToolResult<string>;
  isProcessing: boolean;
};

const EMPTY: EditorState = { result: { ok: true, value: "" }, isProcessing: false };
const DEBOUNCE_MS = 120;

function slugIconComponent(slug: string) {
  const svg = toolIconFor(slug);
  return function SlugIcon({ className }: { className?: string }) {
    return (
      <span className={className} aria-hidden="true" dangerouslySetInnerHTML={{ __html: svg }} />
    );
  };
}

/**
 * Web-parity UI for every registry tool driven by a host transform spec.
 * Same TextTransformEditor the web app mounts; hosts resolve the spec and
 * supply the runtime. Diff tools (secondary input) render the A | Swap | B
 * layout the mount used to own.
 */
export function GenericTransformTool({
  slug,
  spec,
  getRuntime,
  capabilities = LOCAL_ONLY_CAPABILITIES,
  initialInput = "",
}: GenericTransformToolProps) {
  const registry = getToolBySlug(slug);
  const pattern =
    registry?.pattern ??
    (spec.allowEmptyInput ? "generate" : spec.secondaryInput ? "diff" : "transform");
  const isGenerate = pattern === "generate" || Boolean(spec.allowEmptyInput);
  const isInspect = pattern === "inspect";
  const isDiff = spec.secondaryInput !== undefined;

  const [operationId, setOperationId] = useState(
    spec.defaultOperationId ?? spec.operations[0]?.id ?? "",
  );
  const [optionId, setOptionId] = useState(spec.defaultOptionId ?? spec.options[0]?.id ?? "");
  const [source, setSource] = useState(() => initialInput || "");
  const [secondary, setSecondary] = useState("");

  const lastInitialInputRef = useRef(initialInput);
  useEffect(() => {
    if (
      initialInput !== undefined &&
      initialInput !== "" &&
      initialInput !== lastInitialInputRef.current
    ) {
      lastInitialInputRef.current = initialInput;
      setSource(initialInput);
    }
  }, [initialInput]);

  const [state, setState] = useState<EditorState>(EMPTY);
  const tokenRef = useRef(0);
  const runtimeRef = useRef<HostRuntime | null>(null);

  const currentOperation = useMemo(
    () => spec.operations.find((op) => op.id === operationId) ?? spec.operations[0],
    [operationId, spec],
  );

  const enabled = isGenerate
    ? true
    : isDiff
      ? source.trim().length > 0 && secondary.trim().length > 0
      : source.trim().length > 0;

  const runTransform = useCallback(
    async (token: number) => {
      try {
        runtimeRef.current ??= await Promise.resolve(getRuntime());
        const runtime = runtimeRef.current;
        const result = await spec.transform(
          secondary
            ? { operationId, optionId, input: source, secondaryInput: secondary }
            : { operationId, optionId, input: source },
          runtime,
        );
        if (token !== tokenRef.current) return;
        setState({ result, isProcessing: false });
      } catch (cause) {
        if (token !== tokenRef.current) return;
        setState({
          result: {
            ok: false,
            error: {
              code: "HOST_RUNTIME_FAILED",
              message: cause instanceof Error ? cause.message : "The local tool run failed.",
            },
          },
          isProcessing: false,
        });
      }
    },
    [getRuntime, operationId, optionId, source, secondary, spec],
  );

  // Live transform, exactly like the web tools: the hook always runs; in
  // manual mode (generate) the Run button only commits the latest live result.
  useEffect(() => {
    if (!enabled) {
      tokenRef.current++;
      setState(EMPTY);
      return;
    }
    const token = ++tokenRef.current;
    setState((prev) => ({ ...prev, isProcessing: true }));
    const timer = window.setTimeout(() => void runTransform(token), DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [enabled, runTransform]);

  const onSample = useCallback(() => {
    setOperationId(spec.defaultOperationId ?? spec.operations[0]?.id ?? "");
    setOptionId(spec.defaultOptionId ?? spec.options[0]?.id ?? "");
    setSource(sampleFor(slug, pattern, isDiff));
    if (isDiff) setSecondary(sampleSecondary(slug));
  }, [pattern, slug, spec, isDiff]);

  const onSwapSecondary = useCallback(() => {
    setSource(secondary);
    setSecondary(source);
    setState(EMPTY);
  }, [secondary, source]);

  const actionLabel =
    currentOperation?.actionLabel ?? currentOperation?.label ?? (isGenerate ? "Generate" : "Run");
  const Icon = slugIconComponent(slug);
  const secondaryLabel = spec.secondaryInput?.label ?? "Changed (B)";
  const secondaryMaxChars = spec.secondaryInput?.maxChars ?? spec.maxInputChars;

  return (
    <TextTransformEditor
      icon={Icon}
      title={registry?.shortName ?? slug}
      description={registry?.description ?? "Runs locally on this device."}
      inputLabel={isDiff ? "Original (A)" : "Input"}
      outputLabel={isInspect ? "Inspection" : "Result"}
      placeholder="Paste or type input structured text…"
      source={source}
      onSourceChange={setSource}
      onSample={onSample}
      maxInputChars={spec.maxInputChars}
      state={state}
      langTag={isInspect ? "INSPECT" : "TEXT"}
      actionLabel={actionLabel}
      actionIcon={isGenerate ? Wand2 : ArrowRight}
      outputExtension="txt"
      autoFormatDefault={!isGenerate}
      persistAutoPreference={!isGenerate}
      allowEmptyInput={isGenerate}
      showUpload={capabilities.fileOpen ?? false}
      showDownload={capabilities.fileSave ?? false}
      {...(isDiff
        ? {
            secondary,
            onSecondaryChange: setSecondary,
            secondaryLabel,
            secondaryPlaceholder: "Paste or type changed text…",
            secondaryMaxChars,
            onSwapSecondary,
            swapLabel: "Swap Original and Changed",
          }
        : {})}
      options={
        <div className="flex items-center gap-2 flex-wrap">
          {spec.operations.length > 1 ? (
            <SegControl
              items={spec.operations.map((op) => ({ id: op.id, label: op.label }))}
              activeId={operationId}
              onSelect={setOperationId}
            />
          ) : null}
          {spec.options.length > 1 ? (
            <SegControl items={[...spec.options]} activeId={optionId} onSelect={setOptionId} />
          ) : null}
        </div>
      }
    />
  );
}

function SegControl({
  items,
  activeId,
  onSelect,
}: {
  readonly items: readonly { id: string; label: string }[];
  readonly activeId: string;
  readonly onSelect: (id: string) => void;
}) {
  return (
    <div className="min-h-[32px] w-fit max-w-full flex items-center flex-wrap gap-[2px] p-[2px] bg-surface-low border border-outline rounded-[8px]">
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          className={`h-[26px] px-[10px] rounded-[6px] text-[12px] font-semibold transition-colors cursor-pointer whitespace-nowrap ${
            item.id === activeId ? "text-primary" : "text-on-muted hover:text-on-surface"
          }`}
          onClick={() => onSelect(item.id)}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
