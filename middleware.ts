import { NextResponse, type NextRequest } from "next/server";

const AGENT_UA_REGEX =
  /(GPTBot|ClaudeBot|Anthropic-AI|PerplexityBot|cohere-ai|Bytespider|Google-Extended|CCBot|OAI-SearchBot|ChatGPT-User)/i;

function isAgentPath(pathname: string): boolean {
  return pathname === "/agent" || pathname.startsWith("/agent/");
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const cookie = request.cookies.get("mode")?.value;

  if (cookie === "agent" && !isAgentPath(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/agent";
    return NextResponse.rewrite(url);
  }

  if (cookie === "human" && isAgentPath(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.rewrite(url);
  }

  if (!cookie) {
    const ua = request.headers.get("user-agent") || "";
    if (AGENT_UA_REGEX.test(ua) && !isAgentPath(pathname)) {
      const url = request.nextUrl.clone();
      url.pathname = "/agent";
      return NextResponse.rewrite(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/about",
    "/work/:path*",
    "/agent",
    "/agent/:path*",
  ],
};
