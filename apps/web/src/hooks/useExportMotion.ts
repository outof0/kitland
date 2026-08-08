import { useEffect, type RefObject } from "react";

const SECTION_NAMES = [
  "Navbar",
  "Hero · desktop",
  "Tool rail",
  "Stats Band",
  "Catalog",
  "Principles Band",
  "CTA Band",
  "Footer",
  // tablet / mobile export names
  "Tablet navbar",
  "Tablet hero",
  "Tablet tool rail",
  "Tablet proof stats",
  "Tablet catalog",
  "Tablet principles",
  "Tablet final CTA",
  "Tablet footer",
  "Mobile navbar",
  "Mobile hero",
  "Mobile tool rail",
  "Mobile proof stats",
  "Mobile catalog",
  "Mobile principles",
  "Mobile final CTA",
  "Mobile footer",
] as const;

/**
 * Progressive enhancement for Pencil-exported landings:
 * scroll reveals, live-dot pulse, workbench float, CTA glow breathe.
 */
export function useExportMotion(rootRef: RefObject<HTMLElement | null>): void {
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Live status dots
    const liveDots = root.querySelectorAll<HTMLElement>(
      '[data-pencil-name="Live dot"], [data-pencil-name="Local status"]',
    );
    for (const dot of liveDots) {
      if (dot.offsetWidth <= 12) {
        dot.classList.add("kit-live-dot");
      }
    }

    // Workbench float
    const windows = root.querySelectorAll<HTMLElement>(
      '[data-pencil-name="Workbench Window"], [data-pencil-name="Mobile workbench preview"]',
    );
    for (const win of windows) {
      win.classList.add("kit-float-soft");
    }

    // CTA glow ellipses
    const glows = root.querySelectorAll<HTMLElement>(
      '[data-pencil-name="CTA Glow Lime"], [data-pencil-name="CTA Glow Blue"]',
    );
    for (const glow of glows) {
      glow.classList.add("kit-glow-breathe");
    }

    if (reduced) {
      for (const name of SECTION_NAMES) {
        const el = root.querySelector(`[data-pencil-name="${name}"]`);
        el?.classList.add("is-visible");
      }
      return;
    }

    // Section reveals
    const sections: HTMLElement[] = [];
    for (const name of SECTION_NAMES) {
      const el = root.querySelector<HTMLElement>(`[data-pencil-name="${name}"]`);
      if (el) {
        // Navbar should appear immediately
        if (
          name.includes("navbar") ||
          name === "Navbar" ||
          name === "Mobile navbar" ||
          name === "Tablet navbar"
        ) {
          el.classList.add("kit-reveal", "is-visible");
          el.classList.add("sticky", "top-0", "z-50");
          // glass sticky without fighting export bg
          el.style.backdropFilter = "blur(10px)";
          continue;
        }
        el.classList.add("kit-reveal");
        sections.push(el);
      }
    }

    // Catalog cards stagger when catalog visible
    const catalog = root.querySelector<HTMLElement>(
      '[data-pencil-name="Catalog"], [data-pencil-name="Mobile catalog"], [data-pencil-name="Tablet catalog"]',
    );
    if (catalog) {
      const cards = catalog.querySelectorAll<HTMLElement>(
        '[data-pencil-name="JSON & Markup"], [data-pencil-name="JSON &amp; Markup"], [data-pencil-name="Encoding & Text"], [data-pencil-name="Encoding &amp; Text"], [data-pencil-name="Generators"], [data-pencil-name="Hash & Crypto"], [data-pencil-name="Hash &amp; Crypto"], [data-pencil-name="Text & Regex"], [data-pencil-name="Text &amp; Regex"], [data-pencil-name="Time & Network"], [data-pencil-name="Time &amp; Network"]',
      );
      cards.forEach((card, i) => {
        card.classList.add("kit-reveal");
        card.dataset.delay = String(Math.min(i + 1, 6));
      });
    }

    // Hero children stagger on first paint
    const hero = root.querySelector<HTMLElement>(
      '[data-pencil-name="Hero · desktop"], [data-pencil-name="Mobile hero"], [data-pencil-name="Tablet hero"]',
    );
    if (hero) {
      const message = hero.querySelector<HTMLElement>(
        '[data-pencil-name="Hero message"], [data-pencil-name="Mobile hero eyebrow"]',
      )?.parentElement;
      // Animate hero message blocks
      const heroKids = hero.querySelectorAll<HTMLElement>(":scope > *");
      heroKids.forEach((kid, i) => {
        kid.classList.add("kit-hero-enter", `kit-hero-enter-delay-${Math.min(i + 1, 5)}`);
      });
      void message;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const target = entry.target as HTMLElement;
          target.classList.add("is-visible");

          // When catalog section visible, reveal its cards
          if (
            target.getAttribute("data-pencil-name") === "Catalog" ||
            target.getAttribute("data-pencil-name") === "Mobile catalog" ||
            target.getAttribute("data-pencil-name") === "Tablet catalog"
          ) {
            target.querySelectorAll<HTMLElement>(".kit-reveal").forEach((n) => {
              n.classList.add("is-visible");
            });
          }

          observer.unobserve(target);
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 },
    );

    for (const section of sections) {
      observer.observe(section);
    }

    // Also observe catalog cards individually if not section-bound
    root.querySelectorAll<HTMLElement>('[data-delay]').forEach((el) => {
      if (!sections.includes(el)) {
        // cards revealed with catalog parent — skip individual unless outside
      }
    });

    return () => observer.disconnect();
  }, [rootRef]);
}
