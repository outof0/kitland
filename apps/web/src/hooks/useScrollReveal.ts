import { useCallback, useEffect, useRef } from "react";

/**
 * Lightweight scroll-reveal via IntersectionObserver.
 *
 * Returns a `ref` callback — attach it to any element that should animate in
 * when it enters the viewport.  The hook sets `data-revealed="true"` once the
 * element crosses the visibility threshold, letting CSS handle the transition.
 *
 * Multiple elements can share the same hook instance; each element is tracked
 * independently.
 *
 * The hook is a no-op when `prefers-reduced-motion: reduce` is active: elements
 * receive `data-revealed="true"` immediately so content is never hidden.
 */
export function useScrollReveal(options?: { threshold?: number; rootMargin?: string }) {
  const threshold = options?.threshold ?? 0.15;
  const rootMargin = options?.rootMargin ?? "0px 0px -40px 0px";
  const observerRef = useRef<IntersectionObserver | null>(null);
  const elementsRef = useRef<Set<Element>>(new Set());

  useEffect(() => {
    /* Respect reduced-motion: reveal everything immediately. */
    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReduced) {
      elementsRef.current.forEach((el) => el.setAttribute("data-revealed", "true"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.setAttribute("data-revealed", "true");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold, rootMargin },
    );

    observerRef.current = observer;

    /* Observe any elements already registered before the effect ran. */
    elementsRef.current.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [threshold, rootMargin]);

  /**
   * Ref callback — safe to pass as `ref={revealRef}` on any element.
   * Handles mount (node !== null) and unmount (node === null).
   */
  const revealRef = useCallback((node: HTMLElement | null) => {
    if (node) {
      elementsRef.current.add(node);
      /* If the observer already exists, start watching immediately. */
      observerRef.current?.observe(node);
    }
  }, []);

  return revealRef;
}
