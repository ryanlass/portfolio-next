import { notFound } from "next/navigation";
import { Link } from "next-view-transitions";
import { MDXRemote } from "next-mdx-remote/rsc";
import { getAllSlugs, getEntry } from "@/lib/content";

export async function generateStaticParams() {
  const slugs = await getAllSlugs("work");
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const entry = await getEntry("work", slug);
  if (!entry) return {};
  return {
    title: `${entry.frontmatter.title}  ·  Ryan Lasswell`,
    description: entry.frontmatter.summary,
  };
}

export default async function WorkDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const entry = await getEntry("work", slug);
  if (!entry) notFound();

  return (
    <article className="editorial">
      <h1>{entry.frontmatter.title}</h1>
      <p className="meta">
        {entry.frontmatter.role}  ·  {entry.frontmatter.client}  ·  {entry.frontmatter.year}
      </p>
      <MDXRemote source={entry.body} />
      <p style={{ marginTop: 48 }}>
        <Link href="/work">← All work</Link>
      </p>
    </article>
  );
}
