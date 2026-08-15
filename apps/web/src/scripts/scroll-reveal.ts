function initScrollReveal() {
  const prefersReduced =
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const elements = document.querySelectorAll<HTMLElement>(
    "[data-reveal], .marketing-reveal, .marketing-reveal-card, .marketing-reveal-counter",
  );

  if (prefersReduced) {
    elements.forEach((el) => el.setAttribute("data-revealed", "true"));
    return;
  }

  if (!("IntersectionObserver" in window)) {
    elements.forEach((el) => el.setAttribute("data-revealed", "true"));
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
    {
      threshold: 0.1,
      rootMargin: "0px 0px -40px 0px",
    },
  );

  elements.forEach((el) => {
    // If element is already in viewport on page load, reveal immediately
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      el.setAttribute("data-revealed", "true");
    } else {
      observer.observe(el);
    }
  });
}

document.addEventListener("astro:page-load", initScrollReveal);
if (document.readyState !== "loading") {
  initScrollReveal();
} else {
  document.addEventListener("DOMContentLoaded", initScrollReveal);
}
