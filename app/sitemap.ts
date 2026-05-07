import type { MetadataRoute } from "next";
import { getAllEntries } from "@/lib/content";
import { SITE_URL } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const work = await getAllEntries("work");

  const staticPaths = ["/", "/work", "/about", "/agent"];
  const dynamicPaths: string[] = [];

  for (const entry of work) {
    dynamicPaths.push(`/work/${entry.frontmatter.slug}`);
  }

  const now = new Date();
  return [...staticPaths, ...dynamicPaths].map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified: now,
  }));
}
