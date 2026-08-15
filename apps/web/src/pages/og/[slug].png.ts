import type { APIRoute, GetStaticPaths } from "astro";
import { listTools } from "@kitland/tools";
import { generateOgImage, type OgImageOptions } from "@/lib/og-generator";

export const getStaticPaths: GetStaticPaths = () => {
  const tools = listTools().filter((t) => t.status === "available");
  const toolPaths = tools.map((tool) => ({
    params: { slug: tool.slug },
    props: {
      title: tool.name,
      description: tool.description,
      family: tool.family,
    },
  }));

  return [
    {
      params: { slug: "index" },
      props: {
        title: "Kitland",
        description:
          "Local-first developer tools for formatting, encoding, and inspecting data on Web, Extension, VS Code, and MCP.",
        family: "developer-tools",
        badge: "TOOLS OUT. WORK ON.",
      },
    },
    {
      params: { slug: "explore" },
      props: {
        title: "Explore Developer Tools",
        description: "64 local-first utilities that run in your browser with zero payload uploads.",
        family: "developer-tools",
        badge: "CATALOG · 64 TOOLS",
      },
    },
    ...toolPaths,
  ];
};

export const GET: APIRoute = async ({ props }) => {
  const pngBuffer = await generateOgImage(props as unknown as OgImageOptions);
  return new Response(pngBuffer as BodyInit, {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
};
