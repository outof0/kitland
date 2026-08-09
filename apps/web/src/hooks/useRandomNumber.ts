import { generateRandomNumbers, type RandomNumberOptions } from "@kitland/core";
import { secureRandomUint32 } from "@/hooks/useSecureRandom";
import { useCallback, useState } from "react";

export function useRandomNumber() {
  const [output, setOutput] = useState<readonly number[]>([]);
  const [error, setError] = useState<string | null>(null);
  const generate = useCallback((options: RandomNumberOptions) => {
    const result = generateRandomNumbers(options, secureRandomUint32);
    if (!result.ok) {
      setError(result.error.message);
      return;
    }
    setOutput(result.value.values);
    setError(null);
  }, []);
  return { output, error, generate };
}
