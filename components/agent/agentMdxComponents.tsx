import type { ReactNode } from "react";
import type { MDXRemoteProps } from "next-mdx-remote/rsc";
import { SITE_URL } from "@/lib/site";

const isAbsolute = (href: string) => /^https?:\/\//i.test(href) || href.startsWith("mailto:");

function AgentLink({ href, children }: { href?: string; children?: ReactNode }) {
  if (!href) return <>{children}</>;
  const fullUrl = isAbsolute(href) ? href : `${SITE_URL}${href.startsWith("/") ? href : `/${href}`}`;
  const visible = typeof children === "string" ? children : children;
  return (
    <>
      {visible} (<a href={fullUrl} style={{ color: "inherit", textDecoration: "underline" }}>{fullUrl}</a>)
    </>
  );
}

function AgentImage({ alt, src }: { alt?: string; src?: string }) {
  void src;
  return <span>[Image: {alt || "image"}]</span>;
}

export const agentMdxComponents: MDXRemoteProps["components"] = {
  a: AgentLink,
  img: AgentImage,
};

// Demote heading levels by one for content embedded inside another section.
// Keeps semantic hierarchy correct on the unified /agent page where work and
// about MDX bodies render under their own h2 section heading.
export const agentMdxComponentsNested: MDXRemoteProps["components"] = {
  ...agentMdxComponents,
  h1: ({ children, ...props }) => <h2 {...props}>{children}</h2>,
  h2: ({ children, ...props }) => <h3 {...props}>{children}</h3>,
  h3: ({ children, ...props }) => <h4 {...props}>{children}</h4>,
  h4: ({ children, ...props }) => <h5 {...props}>{children}</h5>,
};
