import { Logo } from "@/components/Logo";
import {
  marketingButton,
  marketingCard,
  marketingLink,
  marketingNavLink,
} from "@/components/marketing/variants";
import { CATALOG_FAMILIES, PRINCIPLES } from "@/data/catalog";
import type { ToolFamilyId } from "@kitland/tools";
import { listWebAvailableTools, listWebTools } from "@/lib/release-scope";
import {
  ArrowRight,
  Blocks,
  Bot,
  Clipboard,
  Code2,
  Globe2,
  LockKeyhole,
  MonitorCog,
  Puzzle,
  UserRoundX,
  Zap,
} from "lucide-react";

const NAV_LINKS = [
  { href: "#surfaces", label: "Apps & MCP" },
  { href: "#available", label: "Available now" },
  { href: "#catalog", label: "Catalog" },
  { href: "#local-first", label: "Local-first" },
] as const;

const SURFACES = [
  {
    name: "Web",
    status: "Available",
    description:
      "The full catalog as isolated, browser-based workspaces. Open a tool and work — no install, no account.",
    icon: Globe2,
    install: "kitland.dev",
    href: "/explore",
    action: "Browse the web tools",
  },
  {
    name: "Browser extension",
    status: "Available",
    description:
      "Chrome, Edge, and Firefox popup workspaces driven by the same catalog and core. No payload network requests, ever.",
    icon: Puzzle,
    install: "Chrome · Edge · Firefox",
    href: "https://github.com/outof0/kitland/tree/HEAD/apps/browser-extension",
    action: "Install the extension",
  },
  {
    name: "VS Code",
    status: "Available",
    description:
      "Editor commands and local panels. Transform the active selection without leaving your editor.",
    icon: MonitorCog,
    install: "Kitland — Developer Tools",
    href: "https://github.com/outof0/kitland/tree/HEAD/apps/vscode-extension",
    action: "Get the extension",
  },
  {
    name: "MCP server",
    status: "Available",
    description:
      "Local stdio server for AI clients like Claude Desktop and Cursor. Runs Kitland utilities without a network round trip.",
    icon: Bot,
    install: "npx -y @kitland/mcp",
    href: "https://github.com/outof0/kitland/tree/HEAD/packages/mcp",
    action: "Connect via MCP",
  },
] as const;

const PRINCIPLE_ICONS = [Code2, Zap, Clipboard] as const;
const availableTools = listWebAvailableTools();
const featuredTools = availableTools.slice(0, 6);
const allTools = listWebTools();
const displayedFamilies = CATALOG_FAMILIES.map((family) => ({
  ...family,
  tools: allTools.filter((tool) => tool.family === family.id),
}));

export function LandingPage() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-marketing-canvas text-marketing-foreground">
      <a
        href="#main-content"
        className="sr-only fixed left-4 top-4 z-[60] rounded-md bg-marketing-accent px-4 py-3 font-semibold text-marketing-canvas focus:not-sr-only"
      >
        Skip to main content
      </a>

      <header className="sticky top-0 z-50 border-b border-marketing-border bg-marketing-canvas/92 backdrop-blur-xl">
        <nav
          className="mx-auto flex h-16 w-full max-w-[1440px] items-center justify-between px-5 sm:px-8 lg:h-[72px] lg:px-12"
          aria-label="Primary"
        >
          <a href="/" aria-label="Kitland home" className="shrink-0">
            <Logo variant="reverse" className="h-9 lg:h-10" />
          </a>

          <ul className="hidden items-center gap-8 md:flex">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <a href={link.href} className={marketingNavLink}>
                  {link.label}
                </a>
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-3">
            <a href="/explore" className={marketingButton({ tone: "primary", size: "compact" })}>
              <span className="sm:hidden">Explore</span>
              <span className="hidden sm:inline">Explore tools</span>
              <ArrowRight className="hidden size-4 sm:block" aria-hidden="true" />
            </a>
          </div>
        </nav>
      </header>

      <main id="main-content" tabIndex={-1}>
        <section
          className="relative isolate border-b border-marketing-divider px-5 py-12 sm:px-8 sm:py-16 lg:min-h-[680px] lg:px-12 lg:py-[72px]"
          aria-labelledby="hero-heading"
        >
          <div
            className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
            aria-hidden="true"
          >
            <div className="marketing-glow-pulse absolute left-[2%] top-[-18rem] size-[40rem] rounded-full bg-marketing-primary/14 blur-[130px]" />
            <div className="marketing-glow-pulse-delayed absolute bottom-[-20rem] right-[-5%] size-[36rem] rounded-full bg-marketing-accent/6 blur-[130px]" />
            <div className="bg-marketing-grid bg-[length:40px_40px] [mask-image:linear-gradient(to_bottom,black_0%,transparent_92%)] absolute inset-0 opacity-40" />
          </div>

          <div className="mx-auto grid w-full max-w-[1248px] items-center gap-12 lg:grid-cols-[548px_minmax(0,1fr)] lg:gap-16">
            <div className="marketing-hero-copy min-w-0">
              <p className="inline-flex items-center gap-2.5 rounded-md border border-marketing-border bg-marketing-surface px-3 py-2 font-mono text-[11px] font-semibold tracking-[0.08em] text-marketing-accent">
                <span className="size-2 rounded-full bg-marketing-accent" aria-hidden="true" />
                {allTools.length} LOCAL-FIRST TOOLS · MIT
              </p>

              <h1
                id="hero-heading"
                className="mt-6 flex flex-col items-start gap-1 font-display text-[clamp(3.125rem,6vw,4.625rem)] font-extrabold leading-[0.99] tracking-[-0.045em] text-white"
              >
                <span className="whitespace-nowrap">Tools out.</span>{" "}
                <span className="marketing-hero-highlight inline-block whitespace-nowrap rounded-[3px] bg-marketing-primary px-[0.16em] pb-[0.07em] text-marketing-on-primary">
                  Work on.
                </span>
              </h1>

              <p className="mt-6 max-w-[540px] text-lg leading-[1.55] text-marketing-text-secondary">
                Format JSON, decode tokens, generate IDs, inspect payloads — on the web, in Chrome
                or Firefox, inside VS Code, or straight from your AI client over MCP. No uploads,
                accounts, or context switching.
              </p>

              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <a href="#available" className={`${marketingButton({ tone: "primary" })} group`}>
                  Open the workbench
                  <ArrowRight
                    className="marketing-action-arrow size-4 transition-transform duration-150"
                    aria-hidden="true"
                  />
                </a>
                <a href="/explore" className={`${marketingButton({ tone: "secondary" })} group`}>
                  Browse {allTools.length} tools
                  <ArrowRight
                    className="marketing-action-arrow size-4 transition-transform duration-150"
                    aria-hidden="true"
                  />
                </a>
              </div>

              <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-3 text-xs font-medium text-marketing-text-muted">
                <li className="flex items-center gap-2">
                  <LockKeyhole className="size-3.5 text-marketing-accent" aria-hidden="true" />
                  Local by default
                </li>
                <li className="flex items-center gap-2">
                  <UserRoundX className="size-3.5 text-marketing-accent" aria-hidden="true" />
                  No sign-up
                </li>
                <li className="flex items-center gap-2">
                  <Code2 className="size-3.5 text-marketing-accent" aria-hidden="true" />
                  Open source
                </li>
              </ul>

              <p className="mt-9 font-mono text-[11px] font-semibold tracking-[0.14em] text-marketing-text-muted">
                RUNS ON
              </p>
              <ul className="mt-3 flex flex-wrap gap-2" aria-label="Kitland surfaces">
                {[
                  { label: "Web", icon: Globe2 },
                  { label: "Chrome", icon: Puzzle },
                  { label: "Firefox", icon: Puzzle },
                  { label: "VS Code", icon: MonitorCog },
                  { label: "MCP", icon: Bot },
                ].map((surface) => {
                  const Icon = surface.icon;
                  return (
                    <li
                      key={surface.label}
                      className="inline-flex items-center gap-2 rounded-full border border-marketing-border bg-marketing-surface px-3 py-1.5 text-xs font-semibold text-marketing-text-secondary"
                    >
                      <Icon className="size-3.5 text-marketing-accent" aria-hidden="true" />
                      {surface.label}
                    </li>
                  );
                })}
              </ul>
            </div>

            <figure className="marketing-workbench mx-auto w-full overflow-hidden rounded-xl border border-marketing-border-card bg-marketing-recessed shadow-marketing-preview">
              <div className="flex min-h-12 items-center justify-between gap-4 border-b border-marketing-border px-4">
                <div className="flex items-center gap-2" aria-hidden="true">
                  <span className="size-2 rounded-full bg-marketing-danger/80" />
                  <span className="size-2 rounded-full bg-marketing-warning/80" />
                  <span className="size-2 rounded-full bg-marketing-success/80" />
                </div>
                <span className="font-mono text-[11px] text-marketing-text-muted">
                  kitland / base64
                </span>
                <span className="rounded border border-marketing-success-border bg-marketing-success-bg px-2 py-1 font-mono text-[10px] font-semibold text-marketing-accent">
                  LOCAL
                </span>
              </div>

              <div className="grid gap-3 p-3 sm:grid-cols-[1fr_auto_1fr] sm:items-stretch sm:p-4">
                <div className="marketing-stage-input min-h-44 rounded-lg border border-marketing-border-recessed bg-marketing-canvas p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-mono text-[11px] font-semibold tracking-[0.1em] text-marketing-text-muted">
                      INPUT · UTF-8
                    </p>
                    <span className="font-mono text-[10px] text-marketing-text-faint">
                      18 chars
                    </span>
                  </div>
                  <code className="mt-9 block break-words font-mono text-sm leading-6 text-marketing-success">
                    Keep this local.
                  </code>
                  <span
                    className="mt-8 block h-px w-full bg-marketing-divider"
                    aria-hidden="true"
                  />
                </div>

                <div
                  className="marketing-stage-transform flex items-center justify-center"
                  aria-hidden="true"
                >
                  <span className="flex size-10 items-center justify-center rounded-lg border border-marketing-state-border-strong bg-marketing-primary-soft/60 shadow-marketing-primary">
                    <Zap className="size-[18px] text-marketing-primary-light" />
                  </span>
                </div>

                <div className="marketing-stage-output min-h-44 rounded-lg border border-marketing-border-recessed bg-marketing-canvas p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-mono text-[11px] font-semibold tracking-[0.1em] text-marketing-text-muted">
                      OUTPUT · BASE64
                    </p>
                    <span className="font-mono text-[10px] text-marketing-text-faint">
                      28 chars
                    </span>
                  </div>
                  <code className="mt-9 block break-all font-mono text-sm leading-6 text-marketing-success">
                    S2VlcCB0aGlzIGxvY2FsLg==
                  </code>
                  <span
                    className="mt-8 block h-px w-full bg-marketing-divider"
                    aria-hidden="true"
                  />
                </div>
              </div>

              <div className="grid gap-px border-t border-marketing-divider-strong bg-marketing-divider-strong sm:grid-cols-[1fr_auto]">
                <figcaption className="marketing-stage-success flex items-center gap-2 bg-marketing-panel px-4 py-3 text-xs font-medium text-marketing-text-strong">
                  <span className="size-2 rounded-full bg-marketing-success" aria-hidden="true" />
                  Converted locally · nothing uploaded
                </figcaption>
                <div className="flex items-center gap-3 bg-marketing-panel px-4 py-3 font-mono text-[10px] text-marketing-text-muted">
                  <span>UTF-8</span>
                  <span aria-hidden="true">→</span>
                  <span>BASE64</span>
                </div>
              </div>

              <ul
                className="grid grid-cols-2 gap-px border-t border-marketing-divider bg-marketing-divider sm:grid-cols-4"
                aria-label="More available tools"
              >
                {featuredTools.slice(0, 4).map((tool) => (
                  <li key={tool.id} className="bg-marketing-recessed px-3 py-3">
                    <span className="block truncate font-mono text-[10px] text-marketing-text-muted">
                      {tool.shortName}
                    </span>
                  </li>
                ))}
              </ul>
            </figure>
          </div>
        </section>

        <section
          className="border-b border-marketing-border bg-marketing-shell"
          aria-label="Product proof"
        >
          <dl className="marketing-reveal mx-auto grid w-full max-w-[1440px] grid-cols-2 lg:grid-cols-4">
            {[
              { value: allTools.length, label: "tools available" },
              { value: SURFACES.length, label: "host surfaces" },
              { value: 0, label: "payload uploads" },
              { value: 0, label: "accounts required" },
            ].map((metric, index) => (
              <div
                key={metric.label}
                className={`marketing-reveal-counter marketing-reveal-stagger-${index + 1} flex min-h-32 flex-col justify-center px-5 py-6 sm:px-8 lg:min-h-40 ${
                  index % 2 === 0 ? "border-r border-marketing-border" : ""
                } ${index < 2 ? "border-b border-marketing-border lg:border-b-0" : ""} ${
                  index > 0 ? "lg:border-l lg:border-marketing-border" : ""
                }`}
              >
                <dd className="font-display text-4xl font-extrabold tracking-[-0.04em] text-white sm:text-5xl">
                  {metric.value}
                </dd>
                <dt className="mt-2 font-mono text-[11px] font-semibold tracking-[0.08em] text-marketing-text-muted">
                  {metric.label.toUpperCase()}
                </dt>
              </div>
            ))}
          </dl>
        </section>

        <section
          id="surfaces"
          className="scroll-mt-20 bg-marketing-raised px-5 py-20 sm:px-8 lg:px-12 lg:py-24"
          aria-labelledby="surfaces-heading"
        >
          <div className="mx-auto w-full max-w-[1248px]">
            <div className="marketing-reveal grid gap-5 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
              <div>
                <p className="font-mono text-xs font-semibold tracking-[0.18em] text-marketing-primary-light">
                  EVERYWHERE YOU WORK
                </p>
                <h2
                  id="surfaces-heading"
                  className="mt-4 font-display text-4xl font-extrabold tracking-[-0.04em] text-white sm:text-5xl"
                >
                  Web, browser, editor, AI client.
                </h2>
              </div>
              <p className="max-w-2xl text-base leading-7 text-marketing-text-secondary lg:justify-self-end">
                One typed core, four native entry points — all available today. Every host runs the
                same deterministic transforms on your device; nothing leaves it.
              </p>
            </div>

            <ul className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {SURFACES.map((surface, index) => {
                const Icon = surface.icon;
                return (
                  <li
                    key={surface.name}
                    className={`marketing-reveal-card marketing-reveal-stagger-${index + 1} flex flex-col rounded-xl border border-marketing-border bg-marketing-canvas p-6 transition-[transform,box-shadow,border-color] duration-200 ease-out hover:border-marketing-border-hover hover:shadow-marketing-card motion-safe:hover:-translate-y-1`}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <span className="flex size-10 items-center justify-center rounded-lg border border-marketing-icon-border bg-marketing-panel transition-colors duration-200 group-hover:border-marketing-primary-light">
                        <Icon
                          className="size-[18px] text-marketing-primary-light"
                          aria-hidden="true"
                        />
                      </span>
                      <span className="font-mono text-xs font-semibold text-marketing-accent">
                        {surface.status.toUpperCase()}
                      </span>
                    </div>
                    <h3 className="mt-7 text-xl font-bold text-white">{surface.name}</h3>
                    <p className="mt-3 text-sm leading-6 text-marketing-text-secondary">
                      {surface.description}
                    </p>
                    <code className="mt-4 block truncate rounded border border-marketing-border bg-marketing-recessed px-2.5 py-1.5 font-mono text-[11px] text-marketing-text-muted">
                      {surface.install}
                    </code>
                    <a
                      href={surface.href}
                      className={`${marketingLink} group mt-auto inline-flex items-center gap-2 pt-6 text-sm font-semibold text-marketing-primary-light`}
                    >
                      {surface.action}
                      <ArrowRight
                        className="marketing-action-arrow size-4 transition-transform duration-150"
                        aria-hidden="true"
                      />
                    </a>
                  </li>
                );
              })}
            </ul>

            <div className="marketing-reveal mt-6 overflow-hidden rounded-xl border border-marketing-border bg-marketing-recessed">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-marketing-divider px-4 py-3">
                <p className="font-mono text-[11px] font-semibold tracking-[0.1em] text-marketing-text-muted">
                  MCP CLIENT CONFIG
                </p>
                <span className="rounded border border-marketing-success-border bg-marketing-success-bg px-2 py-1 font-mono text-[10px] font-semibold text-marketing-accent">
                  LOCAL · STDIO · NO TELEMETRY
                </span>
              </div>
              <pre className="overflow-x-auto px-4 py-4 font-mono text-xs leading-6 text-marketing-success">
                <code>{`{
  "mcpServers": {
    "kitland": {
      "command": "npx",
      "args": ["-y", "@kitland/mcp"]
    }
  }
}`}</code>
              </pre>
            </div>
          </div>
        </section>

        <section
          id="available"
          className="scroll-mt-20 bg-marketing-raised px-5 py-20 sm:px-8 lg:px-12 lg:py-28"
          aria-labelledby="available-heading"
        >
          <div className="mx-auto grid w-full max-w-[1248px] gap-10 lg:grid-cols-[0.72fr_1.28fr] lg:gap-16">
            <div className="marketing-reveal">
              <p className="font-mono text-xs font-semibold tracking-[0.18em] text-marketing-accent">
                AVAILABLE NOW
              </p>
              <h2
                id="available-heading"
                className="mt-4 font-display text-4xl font-extrabold tracking-[-0.04em] text-white sm:text-5xl"
              >
                Start with a tool that works today.
              </h2>
              <p className="mt-5 text-base leading-7 text-marketing-text-secondary sm:text-lg">
                {`Every one of the ${allTools.length} tools opens a working local editor on this site. The same typed contracts drive the browser extension, the VS Code extension, and the MCP server.`}
              </p>
              <a
                href="/explore"
                className={`${marketingLink} group mt-7 inline-flex items-center gap-2 font-semibold text-marketing-primary-light`}
              >
                Browse the full catalog
                <ArrowRight
                  className="marketing-action-arrow size-4 transition-transform duration-150"
                  aria-hidden="true"
                />
              </a>
            </div>

            <ul className="grid content-start gap-4 md:grid-cols-2">
              {featuredTools.map((tool, index) => (
                <li
                  key={tool.id}
                  className={`marketing-reveal-card marketing-reveal-stagger-${index + 1} ${marketingCard} flex min-h-64 flex-col p-6`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="rounded-full border border-marketing-success-border bg-marketing-success-bg px-2.5 py-1 font-mono text-xs font-semibold text-marketing-accent">
                      AVAILABLE NOW
                    </span>
                    <span className="font-mono text-xs text-marketing-text-muted">
                      {familyName(tool.family)}
                    </span>
                  </div>
                  <h3 className="mt-8 text-2xl font-bold tracking-tight text-white">{tool.name}</h3>
                  <p className="mt-3 text-sm leading-6 text-marketing-text-secondary">
                    {tool.description}
                  </p>
                  <a
                    href={`/explore/${tool.slug}`}
                    className={`${marketingButton({ tone: "secondary", size: "compact" })} group mt-auto self-start`}
                  >
                    Open tool
                    <ArrowRight
                      className="marketing-action-arrow size-4 transition-transform duration-150"
                      aria-hidden="true"
                    />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section
          id="catalog"
          className="scroll-mt-20 border-y border-marketing-border bg-marketing-canvas px-5 py-20 sm:px-8 lg:px-12 lg:py-28"
          aria-labelledby="catalog-heading"
        >
          <div className="mx-auto w-full max-w-[1248px]">
            <div className="marketing-reveal grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
              <div>
                <p className="font-mono text-xs font-semibold tracking-[0.18em] text-marketing-primary-light">
                  THE CATALOG · RELEASE ROADMAP
                </p>
                <h2
                  id="catalog-heading"
                  className="mt-4 font-display text-4xl font-extrabold tracking-[-0.04em] text-white sm:text-5xl lg:text-6xl"
                >
                  One workbench. Six focused families.
                </h2>
              </div>
              <p className="max-w-2xl text-base leading-7 text-marketing-text-secondary lg:justify-self-end lg:text-lg">
                {`All ${allTools.length} tools are live across six families — every one shipped from the same deterministic core, with explicit web, browser-extension, and VS Code contracts.`}
              </p>
            </div>

            <ul className="mt-12 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {displayedFamilies.map((family, index) => {
                const Icon = family.icon;
                const familyTools = family.tools;
                const familyAvailable = familyTools.filter((tool) => tool.status === "available");

                return (
                  <li
                    key={family.id}
                    className={`marketing-reveal-card marketing-reveal-stagger-${index + 1} ${marketingCard} flex min-h-80 flex-col p-6`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <span className="flex size-11 items-center justify-center rounded-lg border border-marketing-icon-border bg-marketing-panel">
                        <Icon className="size-5 text-marketing-text-primary" aria-hidden="true" />
                      </span>
                      <span className="font-mono text-xs font-semibold text-marketing-text-muted">
                        {family.index}
                      </span>
                    </div>
                    <p className="mt-7 truncate font-mono text-xs tracking-wide text-marketing-primary-light">
                      {family.motif}
                    </p>
                    <h3 className="mt-2 text-xl font-bold text-white">{family.name}</h3>
                    <p className="mt-3 text-sm leading-6 text-marketing-text-secondary">
                      {family.description}
                    </p>
                    <dl className="mt-6 flex gap-5 border-t border-marketing-border pt-4 text-xs">
                      <div>
                        <dt className="text-marketing-text-muted">Available</dt>
                        <dd className="mt-1 font-mono font-semibold text-marketing-accent">
                          {familyAvailable.length}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-marketing-text-muted">In registry</dt>
                        <dd className="mt-1 font-mono font-semibold text-white">
                          {familyTools.length}
                        </dd>
                      </div>
                    </dl>
                    <div className="mt-auto pt-6">
                      <p className="font-mono text-xs font-semibold tracking-wide text-marketing-text-muted">
                        EXAMPLES
                      </p>
                      <ul
                        className="mt-2 flex flex-wrap gap-2"
                        aria-label={`${family.name} target examples`}
                      >
                        {family.examples.map((toolName) => (
                          <li
                            key={toolName}
                            className="rounded border border-marketing-border-card bg-marketing-recessed px-2.5 py-1 text-xs text-marketing-text-quiet transition-colors duration-150 hover:border-marketing-border-hover hover:text-white"
                          >
                            {toolName}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>

        <section
          id="local-first"
          className="scroll-mt-20 bg-marketing-panel px-5 py-20 sm:px-8 lg:px-12 lg:py-28"
          aria-labelledby="local-first-heading"
        >
          <div className="mx-auto w-full max-w-[1248px]">
            <div className="marketing-reveal max-w-3xl">
              <p className="font-mono text-xs font-semibold tracking-[0.18em] text-marketing-accent">
                LOCAL-FIRST BY DESIGN
              </p>
              <h2
                id="local-first-heading"
                className="mt-4 font-display text-4xl font-extrabold tracking-[-0.04em] text-white sm:text-5xl lg:text-6xl"
              >
                Your payload does not need a round trip.
              </h2>
              <p className="mt-5 text-base leading-7 text-marketing-text-cool sm:text-lg">
                Available workspaces run their transformations on the current device. Each tool
                still documents its own limits and security boundary.
              </p>
            </div>

            <ol className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-marketing-border-indigo bg-marketing-border-indigo lg:grid-cols-3">
              {PRINCIPLES.map((principle, index) => {
                const Icon = PRINCIPLE_ICONS[index] ?? Code2;
                return (
                  <li
                    key={principle.index}
                    className={`marketing-reveal-card marketing-reveal-stagger-${index + 1} flex min-h-72 flex-col bg-marketing-panel-indigo p-6 lg:p-8 transition-[transform,background-color] duration-200 ease-out hover:bg-marketing-panel-deep motion-safe:hover:-translate-y-0.5`}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <span className="flex size-11 items-center justify-center rounded-lg border border-marketing-icon-border bg-marketing-panel-deep">
                        <Icon className="size-5 text-marketing-accent" aria-hidden="true" />
                      </span>
                      <span className="font-mono text-xs font-semibold text-marketing-primary-light">
                        {principle.index}
                      </span>
                    </div>
                    <h3 className="mt-auto pt-12 text-xl font-bold text-white">
                      {principle.title}
                    </h3>
                    <p className="mt-3 text-sm leading-6 text-marketing-text-cool">
                      {principle.description}
                    </p>
                    <span className="mt-5 self-start rounded border border-marketing-success-border bg-marketing-success-bg px-2 py-1 font-mono text-xs font-semibold text-marketing-accent">
                      {principle.chip}
                    </span>
                  </li>
                );
              })}
            </ol>

            <div className="marketing-reveal mt-6 flex flex-col gap-5 rounded-xl border border-marketing-state-border bg-marketing-panel-deep p-5 sm:flex-row sm:items-center sm:justify-between">
              <p className="max-w-3xl text-sm leading-6 text-marketing-text-cool">
                No Kitland API receives tool input. No analytics event should contain payload
                content. The repository remains available for inspection.
              </p>
              <a
                href="https://github.com/outof0/kitland"
                className={`${marketingButton({ tone: "secondary", size: "compact" })} group shrink-0`}
              >
                Inspect the code
                <ArrowRight
                  className="marketing-action-arrow size-4 transition-transform duration-150"
                  aria-hidden="true"
                />
              </a>
            </div>
          </div>
        </section>

        <section className="relative isolate overflow-hidden bg-marketing-panel px-5 py-20 text-center sm:px-8 lg:py-28">
          <div
            className="marketing-glow-pulse absolute inset-0 -z-10 bg-marketing-radial"
            aria-hidden="true"
          />
          <div className="marketing-reveal mx-auto max-w-4xl">
            <span className="inline-flex items-center gap-2 font-mono text-xs font-semibold tracking-[0.16em] text-marketing-accent">
              <Zap className="size-4 animate-pulse" aria-hidden="true" />
              READY WHEN THE TASK IS
            </span>
            <h2 className="mt-5 font-display text-5xl font-extrabold tracking-[-0.05em] text-white sm:text-6xl lg:text-7xl">
              Pick a tool. Finish the task. Keep the payload local.
            </h2>
            <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-marketing-text-soft sm:text-lg">
              {`All ${allTools.length} tools are live — on the web, in your browser, in your editor, and in your AI client.`}
            </p>
            <a
              href="/explore"
              className={`${marketingButton({ tone: "primary", size: "large" })} group mt-8`}
            >
              Explore the tools
              <ArrowRight
                className="marketing-action-arrow size-5 transition-transform duration-150"
                aria-hidden="true"
              />
            </a>
          </div>
        </section>
      </main>

      <footer className="border-t border-marketing-border bg-marketing-canvas px-5 py-12 sm:px-8 lg:px-12">
        <div className="mx-auto grid w-full max-w-[1248px] gap-10 md:grid-cols-[1fr_auto_auto] md:gap-16">
          <div>
            <Logo variant="reverse" />
            <p className="mt-4 max-w-sm text-sm leading-6 text-marketing-text-quiet">
              Focused developer tools that keep data close and workflows moving.
            </p>
            <span className="mt-5 inline-flex items-center gap-2 font-mono text-xs tracking-[0.1em] text-marketing-text-muted">
              <Blocks className="size-4 text-marketing-primary-light" aria-hidden="true" />
              OPEN SOURCE · MIT LICENSED
            </span>
          </div>

          <FooterLinks
            title="Product"
            links={[
              { href: "#available", label: "Available tools" },
              { href: "/explore", label: "Full catalog" },
              { href: "#surfaces", label: "Web · Extension · VS Code · MCP" },
              { href: "#local-first", label: "Local-first" },
            ]}
          />
          <FooterLinks
            title="Project"
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
        <div className="mx-auto mt-10 flex w-full max-w-[1248px] flex-col gap-3 border-t border-marketing-border pt-5 font-mono text-xs tracking-wide text-marketing-text-muted sm:flex-row sm:items-center sm:justify-between">
          <span>© 2026 Kitland</span>
          <span>LOCAL-FIRST · NO PAYLOAD TELEMETRY</span>
        </div>
      </footer>
    </div>
  );
}

function familyName(familyId: ToolFamilyId): string {
  return CATALOG_FAMILIES.find((family) => family.id === familyId)?.name ?? familyId;
}

function FooterLinks({
  title,
  links,
}: {
  title: string;
  links: readonly { href: string; label: string }[];
}) {
  return (
    <nav aria-label={title}>
      <p className="font-mono text-xs font-semibold tracking-[0.14em] text-marketing-text-muted">
        {title.toUpperCase()}
      </p>
      <ul className="mt-4 space-y-3">
        {links.map((link) => (
          <li key={link.href}>
            <a
              href={link.href}
              className={`${marketingLink} inline-flex min-h-11 items-center text-sm font-medium text-marketing-text-secondary`}
            >
              {link.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
