import { generateLoremIpsum, type LoremIpsumOptions } from "@kitland/core";
import { useCallback, useState } from "react";

export function useLoremIpsum() {
  const [output, setOutput] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const generate = useCallback((options: LoremIpsumOptions) => {
    const result = generateLoremIpsum(options);
    if (!result.ok) {
      setError(result.error.message);
      return;
    }
    setOutput(result.value);
    setError(null);
  }, []);
  return { output, error, generate };
}
