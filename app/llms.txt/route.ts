import { getAllEntries } from "@/lib/content";
import { SITE_NAME, SITE_TAGLINE, SITE_URL } from "@/lib/site";

export const dynamic = "force-static";

const isPlaceholder = (text: string) => /placeholder copy/i.test(text);

export async function GET() {
  const allWork = await getAllEntries("work");
  const work = allWork.filter(
    (entry) => !isPlaceholder(entry.frontmatter.summary) && !isPlaceholder(entry.body),
  );

  const lines: string[] = [];
  lines.push(`# ${SITE_NAME}`);
  lines.push("");
  lines.push(`> ${SITE_TAGLINE}`);
  lines.push("");
  lines.push(`Full content: ${SITE_URL}/llms-full.txt`);
  lines.push("");

  if (work.length) {
    lines.push("## Work");
    for (const entry of work) {
      const url = `${SITE_URL}/agent#${entry.frontmatter.slug}`;
      lines.push(`- [${entry.frontmatter.title}](${url}): ${entry.frontmatter.summary}`);
    }
    lines.push("");
  }

  lines.push("## About");
  lines.push(`- [About](${SITE_URL}/agent#about): ${SITE_TAGLINE}`);
  lines.push("");

  return new Response(lines.join("\n"), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
