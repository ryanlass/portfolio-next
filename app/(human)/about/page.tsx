import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import { getAbout } from "@/lib/content";

export const metadata = { title: "About · Ryan Lasswell" };

export default async function AboutPage() {
  const entry = await getAbout();
  if (!entry) notFound();
  return (
    <article className="editorial">
      <MDXRemote source={entry.body} />
    </article>
  );
}
