export type CrawlRuleKind = "allow" | "disallow";

export type CrawlRule = {
  kind: CrawlRuleKind;
  pattern: string;
};

export type CrawlGroup = {
  agents: readonly string[];
  rules: readonly CrawlRule[];
};

export type CrawlDecision = "allow" | "disallow";

const CANONICAL_ORIGIN = "https://kitland.dev";

export function parseRobots(source: string): CrawlGroup[] {
  const groups: CrawlGroup[] = [];
  let agents: string[] = [];
  let rules: CrawlRule[] = [];

  const flush = () => {
    if (agents.length === 0) return;
    groups.push({ agents, rules });
    agents = [];
    rules = [];
  };

  for (const rawLine of source.split(/\r?\n/)) {
    const line = rawLine.replace(/#.*$/, "").trim();
    if (line.length === 0) continue;
    const separator = line.indexOf(":");
    if (separator < 0) continue;
    const field = line.slice(0, separator).trim().toLowerCase();
    const value = line.slice(separator + 1).trim();
    if (field === "user-agent") {
      if (rules.length > 0) flush();
      agents.push(value);
      continue;
    }
    if ((field === "allow" || field === "disallow") && agents.length > 0 && value.length > 0) {
      rules.push({ kind: field, pattern: value });
    }
  }

  flush();
  return groups;
}

function agentSpecificity(agent: string, product: string): number | null {
  if (agent === "*") return 0;
  const token = agent.toLowerCase();
  if (product.toLowerCase().includes(token)) return token.length;
  return null;
}

function patternRegExp(pattern: string): RegExp {
  let source = "^";
  for (let index = 0; index < pattern.length; index += 1) {
    const char = pattern.charAt(index);
    if (char === "*") {
      source += ".*";
      continue;
    }
    if (char === "$" && index === pattern.length - 1) {
      source += "$";
      continue;
    }
    source += char.replace(/[.+?^${}()|[\]\\]/g, "\\$&");
  }
  if (!pattern.endsWith("$")) source += ".*";
  return new RegExp(source);
}

function decidePath(rules: readonly CrawlRule[], path: string): CrawlDecision {
  let winner: CrawlRule | null = null;
  for (const rule of rules) {
    if (!patternRegExp(rule.pattern).test(path)) continue;
    if (
      winner === null ||
      rule.pattern.length > winner.pattern.length ||
      (rule.pattern.length === winner.pattern.length &&
        rule.kind === "allow" &&
        winner.kind === "disallow")
    ) {
      winner = rule;
    }
  }
  return winner?.kind ?? "allow";
}

export function crawlDecision(
  groups: readonly CrawlGroup[],
  product: string,
  path: string,
): CrawlDecision {
  let best = -1;
  const matched: CrawlRule[] = [];
  for (const group of groups) {
    let groupBest = -1;
    for (const agent of group.agents) {
      const score = agentSpecificity(agent, product);
      if (score !== null && score > groupBest) groupBest = score;
    }
    if (groupBest < 0 || groupBest < best) continue;
    if (groupBest > best) {
      best = groupBest;
      matched.length = 0;
    }
    matched.push(...group.rules);
  }
  return decidePath(matched, path);
}

export function markdownLinkHrefs(markdown: string): string[] {
  const withoutFences = markdown.replace(/```[\s\S]*?```/g, "");
  const withoutInlineCode = withoutFences.replace(/`[^`\n]*`/g, "");
  const hrefs: string[] = [];
  for (const match of withoutInlineCode.matchAll(/\[[^\]]*\]\(([^)\s]+)\)/g)) {
    const href = match[1];
    if (href) hrefs.push(href);
  }
  for (const match of withoutInlineCode.matchAll(/<(https?:\/\/[^>\s]+)>/g)) {
    const href = match[1];
    if (href) hrefs.push(href);
  }
  return hrefs;
}

export function linksCanonicalHome(markdown: string): boolean {
  return markdownLinkHrefs(markdown).some((href) => {
    try {
      const url = new URL(href);
      return (
        url.origin === CANONICAL_ORIGIN &&
        url.pathname === "/" &&
        url.search === "" &&
        url.hash === ""
      );
    } catch {
      return false;
    }
  });
}
