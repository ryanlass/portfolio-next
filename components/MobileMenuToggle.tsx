"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { setMode } from "@/lib/setMode";
import { mapPath } from "@/lib/mapPath";

const ONE_YEAR = 60 * 60 * 24 * 365;

function writeAgentCookie() {
  if (typeof document === "undefined") return;
  document.cookie = `mode=agent; path=/; max-age=${ONE_YEAR}; samesite=lax`;
}

export function MobileMenuToggle() {
  const pathname = usePathname() || "/";
  const agentHref = mapPath(pathname, "agent");

  const onClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
    event.preventDefault();
    writeAgentCookie();
    void setMode("agent");
    if (typeof window !== "undefined") {
      window.location.href = agentHref;
    }
  };

  return (
    <Link className="mobile-toggle" href={agentHref} onClick={onClick} aria-label="Switch to agent mode">
      <span className="label">Agent</span>
    </Link>
  );
}
