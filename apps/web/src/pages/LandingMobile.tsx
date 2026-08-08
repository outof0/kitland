import { Logo } from "@/components/Logo";
import { Reveal } from "@/components/Reveal";
import { PRINCIPLES, STATS } from "@/data/catalog";
import {
  ArrowRight,
  Braces,
  Check,
  Code2,
  Hash,
  KeyRound,
  LockKeyhole,
  Menu,
  Search,
  X,
  Zap,
} from "lucide-react";
import { useEffect, useId, useState } from "react";

const NAV_LINKS = [
  { href: "#tools", label: "Tools" },
  { href: "#categories", label: "Categories" },
  { href: "#principles", label: "Principles" },
  { href: "#changelog", label: "Changelog" },
] as const;

const RAIL = ["JSON", "BASE64", "UUID", "JWT"] as const;

const MOBILE_CATALOG = [
  {
    index: "01",
    name: "JSON & markup",
    description: "Format, convert, type, and diff structured data.",
    icon: Braces,
  },
  {
    index: "02",
    name: "Encoding & text",
    description: "Move between Base64, URL, hex, and Unicode.",
    icon: Code2,
  },
  {
    index: "03",
    name: "Generators",
    description: "Create UUIDs, passwords, tokens, and mock data.",
    icon: Hash,
  },
  {
    index: "04",
    name: "Hash & crypto",
    description: "Hash, verify, sign, and encrypt locally.",
    icon: LockKeyhole,
  },
  {
    index: "05",
    name: "Text & regex",
    description: "Measure, sort, diff, and test patterns.",
    icon: Search,
  },
  {
    index: "06",
    name: "Time & network",
    description: "Parse timestamps, cron, timezones, and IPs.",
    icon: KeyRound,
  },
] as const;

export function LandingMobile() {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuId = useId();

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  const closeMenu = () => setMenuOpen(false);

  return (
    <div className="w-full min-w-0 bg-[#0B0C10] text-[#EDEFF3]">
      {/* Navbar — design: h~64, px-20 */}
      <header className="sticky top-0 z-50 border-b border-[#2A2E38] bg-[#0B0C10]/90 backdrop-blur-md">
        <nav
          className="flex h-16 w-full items-center justify-between px-5"
          aria-label="Primary"
        >
          <a href="/" className="min-w-0 shrink" aria-label="Kitland home">
            <Logo variant="reverse" className="h-9 w-auto max-w-[120px]" />
          </a>
          <div className="flex shrink-0 items-center gap-2">
            <a
              href="#workbench"
              className="kit-btn kit-btn-primary rounded-[5px] bg-[#2563EB] px-3 py-2.5 text-[13px] font-semibold text-white"
            >
              Open
            </a>
            <button
              type="button"
              className="kit-btn flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-[5px] border border-[#2A2E38] bg-[#15171C] text-[#EDEFF3] transition-colors hover:border-[#3A3F4B] hover:bg-[#1a1d24]"
              aria-expanded={menuOpen}
              aria-controls={menuId}
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              onClick={() => setMenuOpen((v) => !v)}
            >
              {menuOpen ? (
                <X className="size-[18px]" strokeWidth={2} aria-hidden />
              ) : (
                <Menu className="size-[18px]" strokeWidth={2} aria-hidden />
              )}
            </button>
          </div>
        </nav>

        {/* Hamburger panel */}
        {menuOpen ? (
          <div
            id={menuId}
            className="kit-menu-panel border-t border-[#2A2E38] bg-[#0B0C10] px-5 py-4"
            role="dialog"
            aria-label="Mobile navigation"
          >
            <ul className="flex flex-col gap-1">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="block rounded-md px-3 py-3 text-[15px] font-medium text-[#9AA3B2] transition-colors hover:bg-[#15171C] hover:text-[#EDEFF3]"
                    onClick={closeMenu}
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
            <a
              href="#workbench"
              className="kit-btn kit-btn-primary mt-3 flex h-[48px] items-center justify-center gap-2 rounded-md bg-[#2563EB] text-[15px] font-semibold text-white"
              onClick={closeMenu}
            >
              Open the workbench
              <ArrowRight className="size-4" aria-hidden />
            </a>
          </div>
        ) : null}
      </header>

      <main>
        {/* Hero — p-[48px_20px_56px_20px] gap-22 */}
        <section
          className="flex w-full flex-col gap-[22px] bg-[#0B0C10] px-5 pb-14 pt-12"
          aria-labelledby="mobile-hero-heading"
        >
          <div className="kit-hero-enter kit-hero-enter-delay-1 inline-flex w-fit items-center gap-[9px] rounded border border-[#2A2E38] bg-[#15171C] px-[9px] py-[7px]">
            <span
              className="kit-live-dot h-[7px] w-[7px] shrink-0 rounded-full bg-[#BEF264]"
              aria-hidden
            />
            <span className="font-mono text-[10px] font-semibold tracking-[0.4px] text-[#BEF264]">
              60+ LOCAL-FIRST DEV TOOLS · MIT
            </span>
          </div>

          <h1
            id="mobile-hero-heading"
            className="kit-hero-enter kit-hero-enter-delay-2 font-display text-[50px] font-extrabold leading-[0.98] tracking-[-1.6px] text-[#EDEFF3]"
          >
            <span className="block">Tools out.</span>
            <span className="mt-1 inline-block rounded-[3px] bg-[#2563EB] px-[10px] pb-[5px] pt-0.5 text-white">
              Work on.
            </span>
          </h1>

          <p className="kit-hero-enter kit-hero-enter-delay-3 text-[17px] leading-[26px] text-[#9AA3B2]">
            Format JSON, decode tokens, generate IDs, and move on — without
            uploads, accounts, or context switching.
          </p>

          <div className="flex w-full flex-col gap-2.5">
            <a
              href="#workbench"
              className="flex h-[50px] w-full items-center justify-center gap-2.5 rounded-md bg-[#2563EB] text-[15px] font-semibold text-white"
            >
              Open the workbench
              <ArrowRight className="size-4" aria-hidden />
            </a>
            <a
              href="#categories"
              className="kit-btn flex h-12 w-full items-center justify-center gap-2 rounded-md border border-[#3A3F4B] bg-[#15171C] text-sm font-semibold text-[#EDEFF3] hover:border-[#4b5160]"
            >
              <Search className="size-4 text-[#9AA3B2]" aria-hidden />
              Browse 60+ tools
            </a>
          </div>

          <ul className="kit-hero-enter kit-hero-enter-delay-5 flex w-full items-center justify-between gap-2">
            {["Local", "No sign-up", "Open source"].map((label) => (
              <li
                key={label}
                className="flex items-center gap-1.5 text-[11px] font-medium text-[#7C8596]"
              >
                <Check
                  className="size-[13px] shrink-0 text-[#BEF264]"
                  strokeWidth={2.5}
                  aria-hidden
                />
                {label}
              </li>
            ))}
          </ul>

          {/* Compact workbench preview */}
          <div className="kit-hero-enter kit-hero-enter-delay-5 kit-float w-full overflow-hidden rounded-md border border-[#3A3F4B] bg-[#101216] shadow-[0_20px_50px_-24px_rgba(37,99,235,0.35)]">
            <div className="flex items-center justify-between border-b border-[#2A2E38] px-3 py-2">
              <span className="font-mono text-[11px] text-[#9AA3B2]">
                kitland.dev · workbench
              </span>
              <span className="rounded border border-[#2A2E38] bg-[#15171C] px-1.5 py-0.5 font-mono text-[10px] text-[#7C8596]">
                ⌘K
              </span>
            </div>
            <div className="flex flex-col gap-2.5 p-3.5">
              <div>
                <p className="mb-1.5 font-mono text-[10px] font-semibold tracking-wide text-[#7C8596]">
                  INPUT · payload.json
                </p>
                <pre className="overflow-x-auto rounded border border-[#2A2E38] bg-[#0B0C10] p-2.5 font-mono text-[11px] leading-relaxed text-[#9AA3B2]">
                  <code>{`{ "name": "Kitland", "tools": 60 }`}</code>
                </pre>
              </div>
              <div className="flex items-center justify-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-full border border-[#2A2E38] bg-[#1E3A8A]/30">
                  <Zap className="size-4 text-[#60A5FA]" aria-hidden />
                </div>
                <span className="font-mono text-[10px] text-[#7C8596]">
                  JSON → TYPESCRIPT
                </span>
              </div>
              <div>
                <p className="mb-1.5 font-mono text-[10px] font-semibold tracking-wide text-[#7C8596]">
                  OUTPUT · types.ts
                </p>
                <pre className="overflow-x-auto rounded border border-[#2A2E38] bg-[#0B0C10] p-2.5 font-mono text-[11px] leading-relaxed text-[#9AA3B2]">
                  <code>{`interface Kitland {\n  name: string\n  tools: number\n}`}</code>
                </pre>
              </div>
            </div>
            <div className="flex items-center gap-1.5 border-t border-[#1E293B] bg-[#0F172A] px-3 py-2.5">
              <LockKeyhole
                className="size-3.5 shrink-0 text-[#BEF264]"
                aria-hidden
              />
              <p className="text-[11px] font-medium text-[#CBD5E1]">
                Converted locally · nothing uploaded
              </p>
            </div>
          </div>
        </section>

        {/* Tool rail — px-16, chips */}
        <Reveal
          as="section"
          className="flex h-[55px] w-full items-center gap-1 border-y border-[#2A2E38] bg-[#0B0C10] px-4"
        >
          <div
            id="tools"
            className="flex h-full w-full items-center gap-1"
            aria-label="Popular tools"
          >
            {RAIL.map((item) => (
              <a
                key={item}
                href="#workbench"
                className="kit-btn flex flex-1 items-center justify-center rounded-[3px] bg-[#15171C] px-1 py-[7px] font-mono text-[11px] font-semibold tracking-wide text-[#BEF264] hover:bg-[#1a1d24]"
              >
                {item}
              </a>
            ))}
          </div>
        </Reveal>

        {/* Stats — 2×2 */}
        <Reveal
          as="section"
          className="w-full border-b border-[#2A2E38] bg-[#0B0C10]"
        >
          <div className="grid grid-cols-2" aria-label="Product proof stats">
            {STATS.map((stat, i) => (
              <div
                key={stat.label}
                className={`flex flex-col items-center justify-center gap-1 px-3 py-8 text-center ${
                  i % 2 === 0 ? "border-r border-[#2A2E38]" : ""
                } ${i < 2 ? "border-b border-[#2A2E38]" : ""}`}
              >
                <p className="font-display text-[36px] font-extrabold tracking-tight text-[#EDEFF3]">
                  {stat.value}
                </p>
                <p className="font-mono text-[11px] font-semibold tracking-[1px] text-[#9AA3B2]">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </Reveal>

        {/* Catalog — p-[64px_20px] gap-28 */}
        <Reveal
          as="section"
          className="flex w-full flex-col gap-7 bg-[#111318] px-5 py-16"
        >
          <div id="categories" aria-labelledby="mobile-catalog-heading">
          <header className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[11px] font-semibold tracking-[2px] text-[#60A5FA]">
                THE WORKBENCH
              </span>
              <span className="h-0.5 w-[22px] bg-[#60A5FA]" aria-hidden />
            </div>
            <h2
              id="mobile-catalog-heading"
              className="font-display text-[28px] font-extrabold leading-tight tracking-[-0.5px] text-[#EDEFF3]"
            >
              One place for the fiddly work
            </h2>
            <p className="text-[15px] leading-relaxed text-[#9AA3B2]">
              Choose a family, open a focused tool, copy the result, and return
              to your code.
            </p>
          </header>

          <ul className="w-full border-t border-[#2A2E38]">
            {MOBILE_CATALOG.map((item) => {
              const Icon = item.icon;
              return (
                <li
                  key={item.index}
                  className="kit-card border-b border-[#2A2E38] py-5"
                >
                  <a href="#workbench" className="flex flex-col gap-2">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <span className="font-mono text-[11px] font-semibold text-[#60A5FA]">
                          {item.index}
                        </span>
                        <Icon
                          className="size-4 text-[#60A5FA]"
                          strokeWidth={2}
                          aria-hidden
                        />
                        <span className="text-[15px] font-semibold text-[#EDEFF3]">
                          {item.name}
                        </span>
                      </div>
                      <ArrowRight
                        className="size-4 shrink-0 text-[#7C8596] transition-transform group-hover:translate-x-0.5"
                        aria-hidden
                      />
                    </div>
                    <p className="text-[13px] leading-relaxed text-[#9AA3B2]">
                      {item.description}
                    </p>
                  </a>
                </li>
              );
            })}
          </ul>

          <a
            href="#workbench"
            className="kit-btn flex h-12 w-full items-center justify-center rounded-md border border-[#3A3F4B] bg-[#15171C] text-sm font-semibold text-[#EDEFF3] hover:border-[#4b5160]"
          >
            View all 60+ tools
          </a>
          </div>
        </Reveal>

        {/* Principles — p-[64px_20px] */}
        <Reveal
          as="section"
          className="flex w-full flex-col gap-[30px] bg-[#0F172A] px-5 py-16"
        >
          <div id="principles" aria-labelledby="mobile-principles-heading">
          <header className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[11px] font-semibold tracking-[2px] text-[#BEF264]">
                // WORKBENCH RULES
              </span>
            </div>
            <h2
              id="mobile-principles-heading"
              className="font-display text-[28px] font-extrabold leading-tight tracking-[-0.5px] text-white"
            >
              Built like the tools you actually keep
            </h2>
            <p className="text-[15px] leading-relaxed text-[#94A3B8]">
              One job per tool. One clear result. Nothing between you and the
              work.
            </p>
          </header>

          <ul className="w-full border-t border-[#1E293B]">
            {PRINCIPLES.map((p) => (
              <li
                key={p.index}
                className="flex flex-col gap-2.5 border-b border-[#1E293B] py-5"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-[11px] font-semibold text-[#BEF264]">
                      {p.chip}
                    </span>
                  </div>
                </div>
                <h3 className="text-base font-semibold text-white">{p.title}</h3>
                <p className="text-[13px] leading-5 text-[#94A3B8]">
                  {p.description}
                </p>
              </li>
            ))}
          </ul>
          </div>
        </Reveal>

        {/* Final CTA — p-[72px_20px] */}
        <Reveal
          as="section"
          variant="scale"
          className="flex w-full flex-col items-center gap-[22px] bg-[#0B0C10] px-5 py-[72px] text-center"
        >
          <div id="workbench" aria-labelledby="mobile-cta-heading">
          <p className="font-mono text-[10px] font-semibold tracking-[1.5px] text-[#60A5FA]">
            // READY WHEN YOU ARE
          </p>
          <h2
            id="mobile-cta-heading"
            className="mt-1 flex flex-col items-center gap-1.5 font-display text-[40px] font-extrabold tracking-[-1px]"
          >
            <span className="text-[#EDEFF3]">One tab.</span>
            <span className="inline-block rounded-[3px] bg-[#2563EB] px-[9px] pb-[5px] pt-0.5 text-white">
              60+ tools. →
            </span>
          </h2>
          <p className="mx-auto mt-[22px] max-w-[320px] text-[15px] leading-relaxed text-[#9AA3B2]">
            Free, open source, and ready without an account.
          </p>
          <a
            href="#workbench"
            className="kit-btn kit-btn-primary mt-[22px] flex h-[52px] w-full items-center justify-center gap-2.5 rounded-md bg-[#2563EB] text-[15px] font-semibold text-white shadow-[0_10px_28px_-10px_#2563EB66]"
          >
            Open the workbench
            <ArrowRight className="size-4" aria-hidden />
          </a>
          <p className="mt-[22px] font-mono text-xs text-[#7C8596]">
            kitland.dev · MIT · local-first
          </p>
          </div>
        </Reveal>
      </main>

      {/* Footer — p-[36px_20px_20px] */}
      <Reveal
        as="footer"
        className="flex w-full flex-col gap-7 border-t border-[#2A2E38] bg-[#111318] px-5 pb-5 pt-9"
      >
        <div id="changelog">
        <div className="flex flex-col gap-2.5">
          <Logo variant="reverse" />
          <p className="text-[13px] text-[#9AA3B2]">
            Everyday developer tools, in one place.
          </p>
        </div>

        <div className="flex gap-9">
          <nav aria-label="Product">
            <p className="mb-2.5 font-mono text-[10px] font-semibold tracking-[1.5px] text-[#7C8596]">
              PRODUCT
            </p>
            <ul className="flex flex-col gap-2.5">
              <li>
                <a
                  href="#tools"
                  className="kit-link text-[13px] font-medium text-[#9AA3B2]"
                >
                  All tools
                </a>
              </li>
              <li>
                <a
                  href="#categories"
                  className="kit-link text-[13px] font-medium text-[#9AA3B2]"
                >
                  Categories
                </a>
              </li>
              <li>
                <a
                  href="#principles"
                  className="kit-link text-[13px] font-medium text-[#9AA3B2]"
                >
                  Principles
                </a>
              </li>
            </ul>
          </nav>
          <nav aria-label="Project">
            <p className="mb-2.5 font-mono text-[10px] font-semibold tracking-[1.5px] text-[#7C8596]">
              PROJECT
            </p>
            <ul className="flex flex-col gap-2.5">
              <li>
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="kit-link text-[13px] font-medium text-[#9AA3B2]"
                >
                  GitHub
                </a>
              </li>
              <li>
                <a
                  href="#changelog"
                  className="kit-link text-[13px] font-medium text-[#9AA3B2]"
                >
                  Changelog
                </a>
              </li>
              <li>
                <a
                  href="#license"
                  id="license"
                  className="kit-link text-[13px] font-medium text-[#9AA3B2]"
                >
                  MIT license
                </a>
              </li>
            </ul>
          </nav>
        </div>

        <div className="flex items-center justify-between border-t border-[#2A2E38] pt-4">
          <p className="font-mono text-[11px] text-[#7C8596]">© 2026 Kitland</p>
        </div>
        </div>
      </Reveal>
    </div>
  );
}

