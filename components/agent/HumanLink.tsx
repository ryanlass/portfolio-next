"use client";

import Link from "next/link";
import { setMode } from "@/lib/setMode";

const ONE_YEAR = 60 * 60 * 24 * 365;

function commit(event: React.MouseEvent<HTMLAnchorElement>) {
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
  event.preventDefault();
  if (typeof document !== "undefined") {
    document.cookie = `mode=human; path=/; max-age=${ONE_YEAR}; samesite=lax`;
  }
  void setMode("human");
  if (typeof window !== "undefined") {
    window.location.href = "/";
  }
}

export function HumanLink() {
  return (
    <Link href="/" onClick={commit} className="agent-human-link">
      Human
    </Link>
  );
}
