import type { Frontmatter } from "./content";
import { SITE_NAME, SITE_TAGLINE, SITE_URL } from "./site";

export function personJsonLd(): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: SITE_NAME,
    url: SITE_URL,
    description: SITE_TAGLINE,
    jobTitle: "Designer & Builder",
    sameAs: [],
  };
}

export function creativeWorkJsonLd(frontmatter: Frontmatter): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: frontmatter.title,
    headline: frontmatter.title,
    abstract: frontmatter.summary,
    creator: { "@type": "Person", name: SITE_NAME, url: SITE_URL },
    dateCreated: String(frontmatter.year),
    url: `${SITE_URL}/agent#${frontmatter.slug}`,
    keywords: frontmatter.tags.join(", "),
    publisher: frontmatter.client,
  };
}

export function jsonLdScript(data: Record<string, unknown>): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
