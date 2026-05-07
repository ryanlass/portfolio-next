import { Link } from "next-view-transitions";
import { getAllEntries } from "@/lib/content";

export const metadata = { title: "Work  ·  Ryan Lasswell" };

export default async function WorkIndex() {
  const entries = await getAllEntries("work");
  return (
    <article className="editorial">
      <h1>Work</h1>
      <p className="meta">Selected projects, most recent first.</p>
      <ul className="editorial-list">
        {entries.map((entry) => (
          <li key={entry.frontmatter.slug}>
            <Link href={`/work/${entry.frontmatter.slug}`}>{entry.frontmatter.title}</Link>
            <span className="row-meta">
              {entry.frontmatter.client}  ·  {entry.frontmatter.year}
            </span>
          </li>
        ))}
      </ul>
    </article>
  );
}
