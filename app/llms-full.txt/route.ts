import { getAbout, getAllEntries } from "@/lib/content";
import { SITE_NAME, SITE_TAGLINE, SITE_URL } from "@/lib/site";

export const dynamic = "force-static";

const SERVICES = [
  "Product Design",
  "Design Engineering",
  "Interaction Design",
  "Design Systems",
  "Agentic Design",
  "Creative Direction",
  "Brand Identity",
];

const CONTACT_EMAIL = "hello@ryanlass.co";

export async function GET() {
  const work = await getAllEntries("work");
  const about = await getAbout();

  const lines: string[] = [];

  lines.push("---");
  lines.push("name: Ryan Lasswell");
  lines.push("role: Designer. Director. Builder.");
  lines.push(`summary: ${SITE_TAGLINE}`);
  lines.push(`url: ${SITE_URL}`);
  lines.push(`email: ${CONTACT_EMAIL}`);
  lines.push("---");
  lines.push("");

  lines.push(`# ${SITE_NAME}`);
  lines.push("");
  lines.push(`> ${SITE_TAGLINE}`);
  lines.push("");

  lines.push("## Services");
  lines.push("");
  for (const s of SERVICES) lines.push(`- ${s}`);
  lines.push("");

  lines.push("## Contact");
  lines.push("");
  lines.push(`- Schedule call: ${CONTACT_EMAIL}`);
  lines.push("");

  if (about) {
    lines.push("## About");
    lines.push("");
    lines.push(`> ${about.frontmatter.summary}`);
    lines.push("");
    lines.push(about.body);
    lines.push("");
  }

  lines.push("## Work");
  lines.push("");
  for (const entry of work) {
    const fm = entry.frontmatter;
    lines.push(`### ${fm.title}`);
    lines.push("");
    lines.push("```yaml");
    lines.push(`title: ${fm.title}`);
    lines.push(`slug: ${fm.slug}`);
    lines.push(`year: ${fm.year}`);
    lines.push(`role: ${fm.role}`);
    lines.push(`client: ${fm.client}`);
    lines.push("```");
    lines.push("");
    lines.push(`> ${fm.summary}`);
    lines.push("");
    lines.push(entry.body);
    lines.push("");
  }

  return new Response(lines.join("\n"), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
