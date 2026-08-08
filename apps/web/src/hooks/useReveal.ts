import { useEffect, useRef, type RefObject } from "react";

type UseRevealOptions = {
  rootMargin?: string;
  threshold?: number;
  once?: boolean;
};

/**
 * Adds `is-visible` when the element enters the viewport.
 * Respects prefers-reduced-motion by showing immediately.
 */
export function useReveal<T extends HTMLElement = HTMLElement>(
  options: UseRevealOptions = {},
): RefObject<T | null> {
  const { rootMargin = "0px 0px -8% 0px", threshold = 0.12, once = true } =
    options;
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      el.classList.add("is-visible");
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            if (once) observer.unobserve(entry.target);
          } else if (!once) {
            entry.target.classList.remove("is-visible");
          }
        }
      },
      { rootMargin, threshold },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [once, rootMargin, threshold]);

  return ref;
}

/**
 * Observes all matching descendants under a root and toggles `is-visible`.
 * Used for Pencil export trees that we don't want to hand-wrap.
 */
export function useRevealSelector(
  rootRef: RefObject<HTMLElement | null>,
  selector: string,
  options: UseRevealOptions = {},
): void {
  const { rootMargin = "0px 0px -6% 0px", threshold = 0.1, once = true } =
    options;

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const nodes = Array.from(root.querySelectorAll<HTMLElement>(selector));
    if (nodes.length === 0) return;

    if (reduced) {
      for (const node of nodes) node.classList.add("is-visible");
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            if (once) observer.unobserve(entry.target);
          }
        }
      },
      { rootMargin, threshold },
    );

    for (const node of nodes) {
      node.classList.add("kit-reveal");
      observer.observe(node);
    }

    return () => observer.disconnect();
  }, [once, rootMargin, rootRef, selector, threshold]);
}
