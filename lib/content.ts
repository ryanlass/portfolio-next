import { promises as fs } from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { z } from "zod";

const FrontmatterSchema = z.object({
  title: z.string(),
  slug: z.string(),
  year: z.number().int(),
  client: z.string(),
  role: z.string(),
  summary: z.string(),
  tags: z.array(z.string()).default([]),
  hero: z.string().optional(),
});

export type Frontmatter = z.infer<typeof FrontmatterSchema>;

export type ContentType = "work";

export type ContentEntry = {
  frontmatter: Frontmatter;
  body: string;
  source: string;
  type: ContentType | "about";
};

const CONTENT_DIR = path.join(process.cwd(), "content");

async function readMdxFile(filePath: string): Promise<{ frontmatter: Frontmatter; body: string; source: string }> {
  const source = await fs.readFile(filePath, "utf8");
  const { data, content } = matter(source);
  const frontmatter = FrontmatterSchema.parse(data);
  return { frontmatter, body: content.trim(), source };
}

async function listMdxFiles(dir: string): Promise<string[]> {
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    return entries
      .filter((entry) => entry.isFile() && entry.name.endsWith(".mdx"))
      .map((entry) => path.join(dir, entry.name));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }
}

export async function getAllEntries(type: ContentType): Promise<ContentEntry[]> {
  const dir = path.join(CONTENT_DIR, type);
  const files = await listMdxFiles(dir);
  const entries = await Promise.all(
    files.map(async (file) => {
      const parsed = await readMdxFile(file);
      return { ...parsed, type } satisfies ContentEntry;
    }),
  );
  return entries.sort((a, b) => b.frontmatter.year - a.frontmatter.year);
}

export async function getEntry(type: ContentType, slug: string): Promise<ContentEntry | null> {
  const filePath = path.join(CONTENT_DIR, type, `${slug}.mdx`);
  try {
    const parsed = await readMdxFile(filePath);
    if (parsed.frontmatter.slug !== slug) {
      throw new Error(`Frontmatter slug "${parsed.frontmatter.slug}" does not match filename "${slug}.mdx"`);
    }
    return { ...parsed, type } satisfies ContentEntry;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw error;
  }
}

export async function getAbout(): Promise<ContentEntry | null> {
  const filePath = path.join(CONTENT_DIR, "about.mdx");
  try {
    const parsed = await readMdxFile(filePath);
    return { ...parsed, type: "about" } satisfies ContentEntry;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw error;
  }
}

export async function getAllSlugs(type: ContentType): Promise<string[]> {
  const entries = await getAllEntries(type);
  return entries.map((entry) => entry.frontmatter.slug);
}
