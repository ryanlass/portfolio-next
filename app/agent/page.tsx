import type { Metadata } from "next";
import { MDXRemote } from "next-mdx-remote/rsc";
import { getAllEntries } from "@/lib/content";
import { agentMdxComponentsNested } from "@/components/agent/agentMdxComponents";
import { AgentFooter } from "@/components/agent/AgentFooter";
import { creativeWorkJsonLd, jsonLdScript, personJsonLd } from "@/lib/jsonld";
import { SITE_TAGLINE, SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Ryan Lasswell · Agent",
  description: SITE_TAGLINE,
  alternates: { canonical: `${SITE_URL}/agent` },
};

const SHORT_URL = "lass.is";
const CONTACT_EMAIL = "hello@ryanlass.co";
const BOOKING_URL = "https://cal.com/ryanlass";
const X_HANDLE = "@lassandfriends";

const SUMMARY = `Ryan Lasswell is a designer, director and builder creating digital products, brands and systems for AI-native companies. His service offering includes product design, design engineering, interaction design, design systems, creative direction and brand identity.`;

const BACKGROUND = `Over 15 years of professional experience in the design field. Worked in NYC for a decade with agencies, startups and in-house product teams. Design journey began at the University of Colorado at Boulder where Ryan earned a Bachelor's of Architecture, where he fell in love with design principles. This education naturally led into the digital realm where he self-taught himself UX and web design. From there, he has honed his visual craft, systems thinking and technical knowledge. He's now looking to take the next step into something where he can continue to progress as a creative.`;

const PRINCIPLES = `This education naturally led into the digital realm where he self-taught himself UX and web design. From there, he has honed his visual craft, systems thinking and technical knowledge. He's now looking to take the next step into something where he can continue to progress as a creative.`;

const PROCESS = `This education naturally led into the digital realm where he self-taught himself UX and web design. From there, he has honed his visual craft, systems thinking and technical knowledge. He's now looking to take the next step into something where he can continue to progress as a creative.`;

const SERVICES = [
  "Product Design",
  "Design Engineering",
  "Interaction Design",
  "Design Systems",
  "Creative Direction",
  "Brand Identity",
];

const STACK = [
  "Claude",
  "Codex",
  "Ghostty",
  "Conductor",
  "Figma",
  "Paper",
  "Framer",
  "Unicorn",
  "Spline",
  "Midjourney",
  "Flora",
  "Granola",
  "Obsidian",
];

const SOCIALS = [
  { handle: "@ryanlass", on: "Github" },
  { handle: "@lassandfriends", on: "X" },
  { handle: "in/ryanlass", on: "Linkedin" },
  { handle: "@lass", on: "Farcaster" },
  { handle: "@ryanlass", on: "Telegram" },
];

const EXPERIENCE = [
  "Founder @ Lass & Friends",
  "Founding Product Designer @ Serotonin",
  "Lead Product Designer @ Unqork",
  "Digital Design Lead @ Red Antler",
  "Senior Product Designer @ Amelia.ai",
  "Product Designer @ Savant",
  "Interaction Designer @ Ogilvy",
  "Digital Designer @ HUSH",
  "Designer @ Briefly",
  "Design Intern @ Giantnerd",
  "Architecture @ University of Colorado",
];

const isPlaceholder = (text: string) => /placeholder copy/i.test(text);

const WORK_ORDER = ["sero", "unqork", "google", "coinbase", "lass-fm", "space-time"];

export default async function AgentHome() {
  const allWork = await getAllEntries("work");
  const filtered = allWork.filter(
    (entry) => !isPlaceholder(entry.frontmatter.summary) && !isPlaceholder(entry.body),
  );
  const work = [...filtered].sort((a, b) => {
    const ai = WORK_ORDER.indexOf(a.frontmatter.slug);
    const bi = WORK_ORDER.indexOf(b.frontmatter.slug);
    if (ai === -1 && bi === -1) return b.frontmatter.year - a.frontmatter.year;
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });

  return (
    <article className="agent-stack">
      <h1 className="sr-only">Ryan Lasswell</h1>
      <section className="agent-section">
        <h2 className="section-label">Contact</h2>
        <ul className="section-body section-list">
          <li>
            Web: <a href={`https://${SHORT_URL}`}>{SHORT_URL}</a>
          </li>
          <li>
            Email: <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
          </li>
          <li>
            Booking: <a href={BOOKING_URL}>{BOOKING_URL.replace(/^https?:\/\//, "")}</a>
          </li>
          <li>
            X: <a href={`https://x.com/${X_HANDLE.replace(/^@/, "")}`}>{X_HANDLE}</a>
          </li>
        </ul>
      </section>

      <section className="agent-section">
        <h2 className="section-label">Machine-readable</h2>
        <ul className="section-body section-list">
          <li>
            llms.txt: <a href="/llms.txt">{SHORT_URL}/llms.txt</a>
          </li>
          <li>
            llms-full.txt: <a href="/llms-full.txt">{SHORT_URL}/llms-full.txt</a>
          </li>
        </ul>
      </section>

      <section className="agent-section">
        <h2 className="section-label">Summary</h2>
        <p className="section-body">{SUMMARY}</p>
      </section>

      <section className="agent-section agent-section--ruled">
        <h2 className="section-label">Experience</h2>
        <ul className="section-body section-list">
          {EXPERIENCE.map((e) => (
            <li key={e}>{e}</li>
          ))}
        </ul>
      </section>

      <section className="agent-section agent-section--ruled" id="work">
        <div className="section-body work-stack">
          {work.map((entry) => (
            <article key={entry.frontmatter.slug} className="work-entry" id={entry.frontmatter.slug}>
              <h3 className="work-title">
                {entry.frontmatter.title}{" "}
                <span className="work-meta">
                  {`(${entry.frontmatter.year})  ·  ${entry.frontmatter.role}`}
                </span>
              </h3>
              <div className="work-body">
                <MDXRemote source={entry.body} components={agentMdxComponentsNested} />
              </div>
              <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: jsonLdScript(creativeWorkJsonLd(entry.frontmatter)) }}
              />
            </article>
          ))}
        </div>
      </section>

      <section className="agent-section agent-section--ruled">
        <h2 className="section-label">Services</h2>
        <ul className="section-body section-list">
          {SERVICES.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
      </section>

      <section className="agent-section agent-section--ruled">
        <h2 className="section-label">Stack</h2>
        <ul className="section-body section-list">
          {STACK.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
      </section>

      <section className="agent-section agent-section--ruled">
        <h2 className="section-label">Socials</h2>
        <ul className="section-body section-list">
          {SOCIALS.map((s) => (
            <li key={s.on}>
              {s.handle} on {s.on}
            </li>
          ))}
        </ul>
      </section>

      <section className="agent-section agent-section--ruled">
        <h2 className="section-label">Background</h2>
        <p className="section-body">{BACKGROUND}</p>
      </section>

      <section className="agent-section agent-section--ruled">
        <h2 className="section-label">Principles</h2>
        <p className="section-body">{PRINCIPLES}</p>
      </section>

      <section className="agent-section agent-section--ruled">
        <h2 className="section-label">Process</h2>
        <p className="section-body">{PROCESS}</p>
      </section>


      <AgentFooter pathname="/agent" />

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(personJsonLd()) }} />
    </article>
  );
}
