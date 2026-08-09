import { usePersistentState } from "@/hooks/usePersistentState";
import { STORAGE_KEYS } from "@/lib/storage";
import { useCallback } from "react";

/** Start empty so the active tool is not duplicated in a fresh sidebar. */
const DEFAULT_FAVORITES: readonly string[] = [];

export function useFavorites() {
  const [favorites, setFavorites] = usePersistentState(STORAGE_KEYS.favorites, [
    ...DEFAULT_FAVORITES,
  ]);

  const isFavorite = useCallback((slug: string) => favorites.includes(slug), [favorites]);

  const toggleFavorite = useCallback(
    (slug: string) => {
      setFavorites((prev) =>
        prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug],
      );
    },
    [setFavorites],
  );

  const addFavorite = useCallback(
    (slug: string) => {
      setFavorites((prev) => (prev.includes(slug) ? prev : [...prev, slug]));
    },
    [setFavorites],
  );

  const removeFavorite = useCallback(
    (slug: string) => {
      setFavorites((prev) => prev.filter((s) => s !== slug));
    },
    [setFavorites],
  );

  return {
    favorites,
    isFavorite,
    toggleFavorite,
    addFavorite,
    removeFavorite,
  };
}
