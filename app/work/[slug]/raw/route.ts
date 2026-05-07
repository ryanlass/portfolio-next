import { promises as fs } from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";
import { getAllSlugs } from "@/lib/content";

export const dynamic = "force-static";

export async function generateStaticParams() {
  const slugs = await getAllSlugs("work");
  return slugs.map((slug) => ({ slug }));
}

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const filePath = path.join(process.cwd(), "content", "work", `${slug}.mdx`);

  try {
    const source = await fs.readFile(filePath, "utf8");
    return new Response(source, {
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    throw error;
  }
}
