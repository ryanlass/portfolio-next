import type { Metadata } from "next";
import { headers } from "next/headers";
import { AsciiTextReveal } from "@/components/AsciiTextReveal";
import { AgentShell } from "@/components/AgentShell";
import { MarkAnimation } from "@/components/MarkAnimation";
import { ThemeToggle } from "@/components/ThemeToggle";
import { HumanLink } from "@/components/agent/HumanLink";

const AGENT_SCOPE_SELECTORS = ["pre", "h1", "h2", "h3", "h4", "blockquote", "p", "li", ".section-label", ".section-body"];

const AGENT_UA_REGEX =
  /(GPTBot|ClaudeBot|Anthropic-AI|PerplexityBot|cohere-ai|Bytespider|Google-Extended|CCBot|OAI-SearchBot|ChatGPT-User|Googlebot|bingbot|DuckDuckBot|YandexBot|Applebot|facebookexternalhit|Twitterbot|Slackbot|LinkedInBot|Discordbot|headless|HeadlessChrome)/i;

export const metadata: Metadata = {
  title: "Ryan Lasswell · Agent",
  robots: { index: true, follow: true },
};

async function isAgentUserAgent(): Promise<boolean> {
  const h = await headers();
  const ua = h.get("user-agent") || "";
  return AGENT_UA_REGEX.test(ua);
}

export default async function AgentLayout({ children }: { children: React.ReactNode }) {
  const isBot = await isAgentUserAgent();

  return (
    <AgentShell>
      <link rel="alternate" type="text/plain" title="llms.txt" href="/llms.txt" />
      <link rel="alternate" type="text/markdown" title="llms-full.txt" href="/llms-full.txt" />
      <header className="site-header">
        <MarkAnimation />
        <div className="header-actions">
          <HumanLink />
          <ThemeToggle />
        </div>
      </header>
      <AsciiTextReveal selectors={AGENT_SCOPE_SELECTORS} disabled={isBot} hover={false}>
        {children}
      </AsciiTextReveal>
    </AgentShell>
  );
}
