export type Mode = "human" | "agent";

const AGENT_PREFIX = "/agent";

export function isAgentPath(pathname: string): boolean {
  return pathname === AGENT_PREFIX || pathname.startsWith(`${AGENT_PREFIX}/`);
}

export function currentMode(pathname: string): Mode {
  return isAgentPath(pathname) ? "agent" : "human";
}

// Map a human path to its anchor on the unified /agent page.
function humanToAgentAnchor(pathname: string): string {
  if (pathname === "/" || pathname === "") return AGENT_PREFIX;
  if (pathname === "/about") return `${AGENT_PREFIX}#about`;
  if (pathname === "/work") return `${AGENT_PREFIX}#work`;
  const workMatch = pathname.match(/^\/work\/([^/]+)\/?$/);
  if (workMatch) return `${AGENT_PREFIX}#${workMatch[1]}`;
  return AGENT_PREFIX;
}

export function mapPath(pathname: string, target: Mode): string {
  const normalized = pathname || "/";

  if (target === "agent") {
    if (isAgentPath(normalized)) return normalized;
    return humanToAgentAnchor(normalized);
  }

  // Agent → human. Single-page agent collapses to "/" since usePathname()
  // doesn't include the hash; humans switching back land on the home page.
  if (!isAgentPath(normalized)) return normalized;
  return "/";
}
