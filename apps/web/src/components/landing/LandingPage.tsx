import { Logo } from "@/components/Logo";
import {
  marketingButton,
  marketingCard,
  marketingLink,
  marketingNavLink,
} from "@/components/marketing/variants";
import { CATALOG_FAMILIES, PRINCIPLES, STATS } from "@/data/catalog";
import {
  ArrowRight,
  Blocks,
  Check,
  ExternalLink,
  Globe2,
  LockKeyhole,
  Menu,
  MonitorCog,
  Puzzle,
  Sparkles,
  X,
  Zap,
} from "lucide-react";

const NAV_LINKS = [
  { href: "#catalog", label: "Catalog" },
  { href: "#surfaces", label: "Surfaces" },
  { href: "#principles", label: "Principles" },
  { href: "#about", label: "About" },
] as const;

const WORKFLOWS = ["FORMAT", "CONVERT", "GENERATE", "INSPECT", "COMPARE", "VALIDATE"] as const;

const SURFACES = [
  {
    name: "Web",
    status: "Foundation",
    description: "A static, searchable tool catalog with isolated interactive workspaces.",
    icon: Globe2,
    accent: "text-marketing-accent",
    dot: "bg-marketing-accent",
  },
  {
    name: "Browser extension",
    status: "Foundation",
    description: "A permission-free Manifest V3 shell with a catalog-driven renderer registry.",
    icon: Puzzle,
    accent: "text-marketing-primary-light",
    dot: "bg-marketing-primary-light",
  },
  {
    name: "VS Code",
    status: "Foundation",
    description: "Editor commands and secure local panels resolved from the same tool catalog.",
    icon: MonitorCog,
    accent: "text-marketing-text-violet",
    dot: "bg-marketing-text-violet",
  },
] as const;

export function LandingPage() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-marketing-canvas text-marketing-foreground">
      <header className="sticky top-0 z-50 border-b border-marketing-border bg-marketing-canvas/92 backdrop-blur-xl">
        <nav
          className="mx-auto flex h-16 w-full max-w-[1440px] items-center justify-between px-5 sm:px-8 lg:h-[72px] lg:px-12"
          aria-label="Primary"
        >
          <a href="/" aria-label="Kitland home" className="shrink-0">
            <Logo variant="reverse" className="h-9 lg:h-10" />
          </a>

          <ul className="hidden items-center gap-7 md:flex lg:gap-9">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <a href={link.href} className={marketingNavLink}>
                  {link.label}
                </a>
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-2.5">
            <a href="/explore" className={marketingButton({ tone: "primary", size: "compact" })}>
              Explore tools
              <ArrowRight className="hidden size-4 sm:block" aria-hidden="true" />
            </a>

            <details className="group relative md:hidden">
              <summary
                className="flex size-10 cursor-pointer list-none items-center justify-center rounded-md border border-marketing-border bg-marketing-surface text-marketing-foreground marker:content-none"
                aria-label="Toggle navigation"
              >
                <Menu className="size-[18px] group-open:hidden" aria-hidden="true" />
                <X className="hidden size-[18px] group-open:block" aria-hidden="true" />
              </summary>
              <div className="animate-marketing-enter-fast absolute right-0 top-[50px] w-[min(19rem,calc(100vw-2.5rem))] rounded-lg border border-marketing-border bg-marketing-raised p-2 shadow-2xl">
                <ul>
                  {NAV_LINKS.map((link) => (
                    <li key={link.href}>
                      <a
                        href={link.href}
                        className="block rounded-md px-3 py-3 text-sm font-medium text-marketing-text-menu hover:bg-marketing-surface-hover hover:text-white"
                      >
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </details>
          </div>
        </nav>
      </header>

      <main>
        <section
          className="relative isolate border-b border-marketing-divider px-5 py-16 sm:px-8 sm:py-20 lg:px-12 lg:py-24 xl:py-28"
          aria-labelledby="hero-heading"
        >
          <div
            className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
            aria-hidden="true"
          >
            <div className="absolute left-[8%] top-[-15rem] size-[34rem] rounded-full bg-marketing-primary/12 blur-[110px]" />
            <div className="absolute bottom-[-18rem] right-[2%] size-[30rem] rounded-full bg-marketing-accent/6 blur-[110px]" />
            <div className="bg-marketing-grid bg-[length:40px_40px] [mask-image:linear-gradient(to_bottom,black_0%,transparent_88%)] absolute inset-0 opacity-30" />
          </div>

          <div className="mx-auto grid w-full max-w-[1248px] items-center gap-14 lg:grid-cols-[1.04fr_0.96fr] lg:gap-16 xl:gap-24">
            <div className="min-w-0">
              <div className="animate-marketing-enter delay-75 inline-flex items-center gap-2.5 rounded-md border border-marketing-border-subtle bg-marketing-surface/90 px-3 py-2">
                <span
                  className="animate-marketing-pulse size-2 rounded-full bg-marketing-accent"
                  aria-hidden="true"
                />
                <span className="font-mono text-[10px] font-semibold tracking-[0.12em] text-marketing-accent sm:text-xs">
                  64 TOOLS · LOCAL-FIRST · BUILDING IN PUBLIC
                </span>
              </div>

              <h1
                id="hero-heading"
                className="animate-marketing-enter delay-100 mt-7 font-display text-[clamp(3.2rem,8vw,7.3rem)] font-extrabold leading-[0.9] tracking-[-0.055em]"
              >
                <span className="block">Tools out.</span>
                <span className="mt-2 inline-block rounded-[5px] bg-marketing-primary px-[0.12em] pb-[0.1em] text-white">
                  Work on.
                </span>
              </h1>

              <p className="animate-marketing-enter delay-150 mt-7 max-w-[660px] text-lg leading-8 text-marketing-text-secondary sm:text-xl lg:text-[22px]">
                Format JSON, decode tokens, generate IDs, inspect payloads, and move on — without
                accounts, payload uploads, or context switching.
              </p>

              <div className="animate-marketing-enter delay-200 mt-8 flex flex-col gap-3 sm:flex-row">
                <a href="/explore" className={marketingButton({ tone: "primary" })}>
                  Explore the catalog
                  <ArrowRight className="size-4" aria-hidden="true" />
                </a>
                <a href="#principles" className={marketingButton({ tone: "secondary" })}>
                  <LockKeyhole className="size-4 text-marketing-accent" aria-hidden="true" />
                  How local-first works
                </a>
              </div>

              <ul className="animate-marketing-enter delay-300 mt-7 flex flex-wrap gap-x-6 gap-y-3 text-xs font-medium text-marketing-text-quiet sm:text-sm">
                {["64-tool release target", "No sign-up", "MIT licensed"].map((label) => (
                  <li key={label} className="flex items-center gap-2">
                    <Check
                      className="size-4 text-marketing-accent"
                      strokeWidth={2.5}
                      aria-hidden="true"
                    />
                    {label}
                  </li>
                ))}
              </ul>
            </div>

            <div
              className="animate-marketing-enter delay-200 animate-marketing-float mx-auto w-full max-w-[620px] overflow-hidden rounded-xl border border-marketing-border-card bg-marketing-recessed shadow-marketing-preview"
              aria-hidden="true"
            >
              <div className="flex h-12 items-center justify-between border-b border-marketing-border px-4">
                <div className="flex items-center gap-2">
                  <span className="size-2 rounded-full bg-marketing-danger/80" />
                  <span className="size-2 rounded-full bg-marketing-warning/80" />
                  <span className="size-2 rounded-full bg-marketing-accent/80" />
                </div>
                <span className="font-mono text-[10px] tracking-wide text-marketing-text-muted sm:text-xs">
                  kitland / command palette
                </span>
                <span className="rounded border border-marketing-border px-1.5 py-0.5 font-mono text-[10px] text-marketing-text-muted">
                  local
                </span>
              </div>

              <div className="grid gap-3 p-3 sm:grid-cols-[1fr_auto_1fr] sm:items-stretch sm:p-4">
                <div className="rounded-lg border border-marketing-border-recessed bg-marketing-canvas p-4">
                  <p className="font-mono text-[10px] font-semibold tracking-[0.12em] text-marketing-text-muted">
                    INPUT · JSON
                  </p>
                  <code className="mt-7 block whitespace-pre-wrap font-mono text-sm leading-6 text-marketing-success">
                    {'{\n  "tool": "kitland",\n  "ready": true\n}'}
                  </code>
                </div>

                <div className="flex items-center justify-center">
                  <span className="flex size-10 items-center justify-center rounded-lg border border-marketing-state-border-strong bg-marketing-primary-soft/50">
                    <Zap className="size-[18px] text-marketing-primary-light" aria-hidden="true" />
                  </span>
                </div>

                <div className="rounded-lg border border-marketing-border-recessed bg-marketing-canvas p-4">
                  <p className="font-mono text-[10px] font-semibold tracking-[0.12em] text-marketing-text-muted">
                    OUTPUT · TYPESCRIPT
                  </p>
                  <code className="mt-7 block whitespace-pre-wrap font-mono text-sm leading-6 text-marketing-success">
                    {"type Tool = {\n  tool: string;\n  ready: boolean;\n};"}
                  </code>
                </div>
              </div>

              <div className="flex items-center justify-between gap-4 border-t border-marketing-divider-strong bg-marketing-panel px-4 py-3">
                <span className="flex items-center gap-2 text-xs font-medium text-marketing-text-strong">
                  <LockKeyhole className="size-4 text-marketing-accent" aria-hidden="true" />
                  Processed locally
                </span>
                <span className="font-mono text-[10px] tracking-wide text-marketing-text-muted">
                  ZERO REQUESTS
                </span>
              </div>
            </div>
          </div>
        </section>

        <section
          className="border-b border-marketing-border bg-marketing-shell"
          aria-label="Supported workflows"
        >
          <ul className="mx-auto flex min-h-16 w-full max-w-[1248px] flex-wrap items-center justify-center gap-x-6 gap-y-3 px-5 py-4 sm:justify-between sm:px-8 lg:px-0">
            {WORKFLOWS.map((item, index) => (
              <li key={item} className="flex items-center gap-6">
                <span className="font-mono text-[11px] font-semibold tracking-[0.2em] text-marketing-accent sm:text-xs">
                  {item}
                </span>
                {index < WORKFLOWS.length - 1 ? (
                  <span
                    className="hidden size-1.5 rotate-45 bg-marketing-primary sm:block"
                    aria-hidden="true"
                  />
                ) : null}
              </li>
            ))}
          </ul>
        </section>

        <section
          className="border-b border-marketing-border bg-marketing-canvas"
          aria-label="Product proof"
        >
          <dl className="mx-auto grid max-w-[1440px] grid-cols-2 lg:grid-cols-4">
            {STATS.map((stat, index) => (
              <div
                key={stat.label}
                className={`flex min-h-36 flex-col items-center justify-center px-4 py-7 text-center lg:min-h-44 ${
                  index % 2 === 0 ? "border-r border-marketing-border" : ""
                } ${index < 2 ? "border-b border-marketing-border lg:border-b-0" : ""} ${
                  index > 0 ? "lg:border-l lg:border-marketing-border" : ""
                }`}
              >
                <dd className="font-display text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
                  {stat.value}
                </dd>
                <dt className="mt-2 font-mono text-[10px] font-semibold tracking-[0.14em] text-marketing-text-quiet sm:text-xs">
                  {stat.label}
                </dt>
              </div>
            ))}
          </dl>
        </section>

        <section
          id="catalog"
          className="scroll-mt-20 bg-marketing-raised px-5 py-20 sm:px-8 lg:px-12 lg:py-28"
        >
          <div className="mx-auto w-full max-w-[1248px]">
            <div className="max-w-3xl">
              <p className="font-mono text-xs font-semibold tracking-[0.2em] text-marketing-primary-light">
                PRODUCT CATALOG
              </p>
              <h2 className="mt-4 font-display text-4xl font-extrabold tracking-[-0.035em] text-white sm:text-5xl lg:text-6xl">
                Sixty-four focused tools. One system.
              </h2>
              <p className="mt-5 max-w-2xl text-base leading-7 text-marketing-text-secondary sm:text-lg">
                Six workflow families share the same shell, quality gates, privacy boundary, and
                platform contracts. A reference implementation proves the system; it does not define
                the product center.
              </p>
            </div>

            <ul className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {CATALOG_FAMILIES.map((family) => {
                const Icon = family.icon;
                return (
                  <li key={family.id} className={`${marketingCard} flex min-h-72 flex-col p-6`}>
                    <div className="flex items-start justify-between gap-4">
                      <span className="flex size-11 items-center justify-center rounded-lg border border-marketing-icon-border bg-marketing-panel">
                        <Icon className="size-5 text-marketing-text-primary" aria-hidden="true" />
                      </span>
                      <span className="font-mono text-xs font-semibold text-marketing-text-faint">
                        {family.index}
                      </span>
                    </div>
                    <p className="mt-7 truncate font-mono text-[10px] tracking-wide text-marketing-primary-light">
                      {family.motif}
                    </p>
                    <h3 className="mt-2 text-xl font-bold text-white">{family.name}</h3>
                    <p className="mt-3 text-sm leading-6 text-marketing-text-secondary">
                      {family.description}
                    </p>
                    <ul
                      className="mt-auto flex flex-wrap gap-2 pt-6"
                      aria-label={`${family.name} examples`}
                    >
                      {family.examples.map((toolName) => (
                        <li
                          key={toolName}
                          className="rounded border border-marketing-border-card bg-marketing-recessed px-2.5 py-1 font-mono text-[10px] text-marketing-text-quiet"
                        >
                          {toolName}
                        </li>
                      ))}
                    </ul>
                  </li>
                );
              })}
            </ul>

            <div className="mt-8 flex flex-col items-start justify-between gap-5 rounded-xl border border-marketing-border bg-marketing-recessed p-5 sm:flex-row sm:items-center">
              <p className="max-w-3xl text-sm leading-6 text-marketing-text-secondary">
                The repository stays pre-release until every catalog entry passes its core, UI,
                accessibility, security, and packaging gates.
              </p>
              <a
                href="/explore"
                className={`${marketingButton({ tone: "secondary", size: "compact" })} shrink-0`}
              >
                View catalog status
                <ArrowRight className="size-4" aria-hidden="true" />
              </a>
            </div>
          </div>
        </section>

        <section
          id="surfaces"
          className="scroll-mt-20 border-y border-marketing-border-blue bg-marketing-panel px-5 py-20 sm:px-8 lg:px-12 lg:py-28"
          aria-labelledby="surfaces-heading"
        >
          <div className="mx-auto w-full max-w-[1248px]">
            <div className="grid gap-6 lg:grid-cols-[0.75fr_1.25fr] lg:items-end">
              <div>
                <p className="font-mono text-xs font-semibold tracking-[0.2em] text-marketing-accent">
                  PRODUCT FOUNDATION
                </p>
                <h2
                  id="surfaces-heading"
                  className="mt-4 font-display text-4xl font-extrabold tracking-[-0.035em] text-white sm:text-5xl"
                >
                  One engine. Three surfaces.
                </h2>
              </div>
              <p className="max-w-2xl text-base leading-7 text-marketing-text-cool lg:justify-self-end lg:text-lg">
                UI adapts to the host, while conversion rules, limits, errors, and test vectors stay
                shared. “Foundation” means implemented in the repository, not yet
                marketplace-published.
              </p>
            </div>

            <ul className="mt-10 grid gap-4 lg:grid-cols-3">
              {SURFACES.map((surface) => {
                const Icon = surface.icon;
                return (
                  <li
                    key={surface.name}
                    className="rounded-xl border border-marketing-border-indigo bg-marketing-panel-indigo p-6"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <span className="flex size-11 items-center justify-center rounded-lg border border-marketing-icon-border bg-marketing-panel-deep">
                        <Icon className={`size-5 ${surface.accent}`} aria-hidden="true" />
                      </span>
                      <span className="flex items-center gap-2 font-mono text-[10px] font-semibold tracking-[0.12em] text-marketing-text-soft">
                        <span
                          className={`size-1.5 rounded-full ${surface.dot}`}
                          aria-hidden="true"
                        />
                        {surface.status.toUpperCase()}
                      </span>
                    </div>
                    <h3 className="mt-8 text-xl font-bold text-white">{surface.name}</h3>
                    <p className="mt-3 text-sm leading-6 text-marketing-text-cool">
                      {surface.description}
                    </p>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>

        <section
          id="principles"
          className="scroll-mt-20 bg-marketing-canvas px-5 py-20 sm:px-8 lg:px-12 lg:py-28"
          aria-labelledby="principles-heading"
        >
          <div className="mx-auto w-full max-w-[1248px]">
            <div className="max-w-3xl">
              <p className="font-mono text-xs font-semibold tracking-[0.2em] text-marketing-accent">
                // WORKBENCH RULES
              </p>
              <h2
                id="principles-heading"
                className="mt-4 font-display text-4xl font-extrabold tracking-[-0.035em] text-white sm:text-5xl lg:text-6xl"
              >
                Built like the tools you keep
              </h2>
              <p className="mt-5 text-base leading-7 text-marketing-text-secondary sm:text-lg">
                One job per tool. One clear result. No artificial waiting between intent and output.
              </p>
            </div>

            <ol className="mt-12 grid gap-px overflow-hidden rounded-xl border border-marketing-border bg-marketing-border lg:grid-cols-3">
              {PRINCIPLES.map((principle) => (
                <li
                  key={principle.index}
                  className="flex min-h-64 flex-col bg-marketing-raised p-6 lg:p-8"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-semibold text-marketing-primary-light">
                      {principle.index}
                    </span>
                    <span className="rounded border border-marketing-success-border bg-marketing-success-bg px-2 py-1 font-mono text-[10px] font-semibold text-marketing-accent">
                      {principle.chip}
                    </span>
                  </div>
                  <h3 className="mt-auto pt-12 text-xl font-bold text-white">{principle.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-marketing-text-secondary">
                    {principle.description}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="relative isolate overflow-hidden border-y border-marketing-divider-blue bg-marketing-panel px-5 py-20 text-center sm:px-8 lg:py-28">
          <div className="absolute inset-0 -z-10 bg-marketing-radial" aria-hidden="true" />
          <div className="mx-auto max-w-3xl">
            <span className="inline-flex items-center gap-2 font-mono text-xs font-semibold tracking-[0.18em] text-marketing-primary-light">
              <Sparkles className="size-4" aria-hidden="true" />
              RELEASE AS ONE SUITE
            </span>
            <h2 className="mt-5 font-display text-5xl font-extrabold tracking-[-0.045em] text-white sm:text-6xl lg:text-7xl">
              Sixty-four tools. <span className="text-marketing-primary-light">No filler.</span>
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-marketing-text-soft sm:text-lg">
              Kitland remains pre-release until the complete catalog meets the same product and
              engineering bar.
            </p>
            <a
              href="/explore"
              className={`${marketingButton({ tone: "primary", size: "large" })} mt-8`}
            >
              Explore catalog status
              <ArrowRight className="size-5" aria-hidden="true" />
            </a>
          </div>
        </section>
      </main>

      <footer id="about" className="scroll-mt-20 bg-marketing-canvas px-5 py-12 sm:px-8 lg:px-12">
        <div className="mx-auto grid w-full max-w-[1248px] gap-10 md:grid-cols-[1fr_auto_auto] md:gap-16">
          <div>
            <Logo variant="reverse" />
            <p className="mt-4 max-w-sm text-sm leading-6 text-marketing-text-quiet">
              Focused developer tools that keep your data close and your workflow moving.
            </p>
            <span className="mt-5 inline-flex items-center gap-2 font-mono text-[10px] tracking-[0.12em] text-marketing-text-muted">
              <Blocks className="size-4 text-marketing-primary-light" aria-hidden="true" />
              WEB · BROWSER · VS CODE
            </span>
          </div>

          <FooterLinks
            title="Product"
            links={[
              { href: "/explore", label: "Tool catalog" },
              { href: "#surfaces", label: "Surfaces" },
              { href: "#principles", label: "Principles" },
            ]}
          />
          <FooterLinks
            title="Project"
            external
            links={[
              { href: "https://github.com/outof0/kitland", label: "GitHub" },
              {
                href: "https://github.com/outof0/kitland/blob/HEAD/CHANGELOG.md",
                label: "Changelog",
              },
              { href: "https://github.com/outof0/kitland/blob/HEAD/LICENSE", label: "MIT license" },
            ]}
          />
        </div>
        <div className="mx-auto mt-10 flex w-full max-w-[1248px] flex-col gap-3 border-t border-marketing-border pt-5 font-mono text-[10px] tracking-wide text-marketing-text-faint sm:flex-row sm:items-center sm:justify-between">
          <span>© 2026 Kitland</span>
          <span>LOCAL-FIRST · NO TELEMETRY</span>
        </div>
      </footer>
    </div>
  );
}

function FooterLinks({
  title,
  links,
  external = false,
}: {
  title: string;
  links: readonly { href: string; label: string }[];
  external?: boolean;
}) {
  return (
    <nav aria-label={title}>
      <p className="font-mono text-[10px] font-semibold tracking-[0.16em] text-marketing-text-faint">
        {title.toUpperCase()}
      </p>
      <ul className="mt-4 space-y-3">
        {links.map((link) => (
          <li key={link.href}>
            <a
              href={link.href}
              className={`${marketingLink} inline-flex items-center gap-1.5 text-sm font-medium text-marketing-text-secondary`}
              target={external ? "_blank" : undefined}
              rel={external ? "noopener noreferrer" : undefined}
            >
              {link.label}
              {external ? <ExternalLink className="size-3" aria-hidden="true" /> : null}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
