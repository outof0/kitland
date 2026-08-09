import { generateRandomPorts, type RandomPortOptions } from "@kitland/core";
import { secureRandomUint32 } from "@/hooks/useSecureRandom";
import { useCallback, useState } from "react";

export function useRandomPort() {
  const [output, setOutput] = useState<readonly number[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [generatedOptions, setGeneratedOptions] = useState<{
    min: number;
    max: number;
    protocol: "tcp" | "udp";
  } | null>(null);
  const generate = useCallback((options: RandomPortOptions) => {
    const result = generateRandomPorts(options, secureRandomUint32);
    if (!result.ok) {
      setError(result.error.message);
      return;
    }
    setOutput(result.value.ports);
    setGeneratedOptions({
      min: result.value.min,
      max: result.value.max,
      protocol: result.value.protocol,
    });
    setError(null);
  }, []);
  return { output, error, generate, generatedOptions };
}
