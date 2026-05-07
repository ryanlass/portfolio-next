"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { setMode } from "@/lib/setMode";
import { mapPath, type Mode } from "@/lib/mapPath";

const ONE_YEAR = 60 * 60 * 24 * 365;

function writeModeCookieClient(target: Mode) {
  if (typeof document === "undefined") return;
  document.cookie = `mode=${target}; path=/; max-age=${ONE_YEAR}; samesite=lax`;
}

function commitAndNavigate(event: React.MouseEvent<HTMLAnchorElement>, target: Mode, href: string) {
  // Default-click behaviors (new tab, modifier keys) should pass through.
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
  event.preventDefault();
  writeModeCookieClient(target);
  void setMode(target);
  // Hard navigation so middleware re-evaluates with the freshly-written cookie
  // and the RSC cache for the rewritten path can't serve stale content.
  if (typeof window !== "undefined") {
    window.location.href = href;
  }
}

export function ModeToggle({ variant, layout }: { variant: Mode; layout?: "panel" }) {
  // The variant prop is the mode of the layout we're rendered inside —
  // authoritative, because middleware can rewrite a Human URL to render
  // the Agent layout (and usePathname() would still report the Human URL).
  const active: Mode = variant;
  const pathname = usePathname() || "/";
  const humanHref = mapPath(pathname, "human");
  const agentHref = mapPath(pathname, "agent");

  if (layout === "panel") {
    return (
      <ul className="panel-list panel-modes-list">
        <li className={active === "human" ? "is-active" : ""}>
          {active === "human" ? (
            <span>Human</span>
          ) : (
            <Link href={humanHref} onClick={(e) => commitAndNavigate(e, "human", humanHref)}>
              Human
            </Link>
          )}
        </li>
        <li className={active === "agent" ? "is-active" : ""}>
          {active === "agent" ? (
            <span>Agent</span>
          ) : (
            <Link href={agentHref} onClick={(e) => commitAndNavigate(e, "agent", agentHref)}>
              Agent
            </Link>
          )}
        </li>
      </ul>
    );
  }

  if (variant === "agent") {
    return (
      <span>
        [{" "}
        <Link
          href={humanHref}
          onClick={(e) => commitAndNavigate(e, "human", humanHref)}
          className={active === "human" ? "active" : ""}
        >
          {active === "human" ? <strong>*Human*</strong> : "Human"}
        </Link>{" "}
        |{" "}
        <Link
          href={agentHref}
          onClick={(e) => commitAndNavigate(e, "agent", agentHref)}
          className={active === "agent" ? "active" : ""}
        >
          {active === "agent" ? <strong>*Agent*</strong> : "Agent"}
        </Link>{" "}
        ]
      </span>
    );
  }

  const otherTarget: Mode = active === "agent" ? "human" : "agent";
  const otherHref = otherTarget === "human" ? humanHref : agentHref;

  return (
    <Link
      href={otherHref}
      onClick={(e) => commitAndNavigate(e, otherTarget, otherHref)}
      aria-label={`Switch to ${otherTarget} mode`}
      style={{
        fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
        fontSize: 12,
        padding: "4px 8px",
        border: "1px solid currentColor",
        borderRadius: 999,
        textDecoration: "none",
        color: "inherit",
      }}
    >
      {active === "human" ? "→ Agent" : "← Human"}
    </Link>
  );
}
