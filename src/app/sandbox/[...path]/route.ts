import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { gameSandboxes } from "@/db/schema";
import { eq } from "drizzle-orm";

export const runtime = "nodejs";

const SKIP_HEADER = "X-Daytona-Skip-Preview-Warning";

async function resolveSandboxUrl(slug: string): Promise<string | null> {
  const rows = await db
    .select()
    .from(gameSandboxes)
    .where(eq(gameSandboxes.gameSlug, slug))
    .limit(1);
  return rows[0]?.previewUrl ?? null;
}

async function proxyRequest(
  request: NextRequest,
  slug: string,
  baseUrl: string,
  subpath: string,
) {
  const target = new URL(subpath || "/", baseUrl);
  request.nextUrl.searchParams.forEach((v, k) => target.searchParams.set(k, v));

  const headers: Record<string, string> = {
    [SKIP_HEADER]: "true",
  };
  const accept = request.headers.get("accept");
  if (accept) headers["Accept"] = accept;
  const referer = request.headers.get("referer");
  if (referer) headers["Referer"] = baseUrl;

  const res = await fetch(target.toString(), {
    method: request.method,
    headers,
    redirect: "follow",
  });

  const contentType = res.headers.get("content-type") ?? "";
  const respHeaders = new Headers();

  for (const key of [
    "content-type",
    "cache-control",
    "etag",
    "last-modified",
  ]) {
    const val = res.headers.get(key);
    if (val) respHeaders.set(key, val);
  }
  // Allow embedding in iframe
  respHeaders.set("access-control-allow-origin", "*");

  // For HTML: rewrite absolute paths to go through our proxy
  if (contentType.includes("text/html")) {
    let html = await res.text();
    // Rewrite absolute paths like /@vite/client, /src/main.tsx
    // to /sandbox/slug/@vite/client, /sandbox/slug/src/main.tsx
    const prefix = `/sandbox/${slug}`;
    html = html.replace(
      /(?:src|href)="(\/[^"]*?)"/g,
      (match, path) => match.replace(path, `${prefix}${path}`),
    );
    // Also rewrite import paths in inline scripts
    html = html.replace(
      /from "(\/[^"]*?)"/g,
      (match, path) => match.replace(path, `${prefix}${path}`),
    );
    return new Response(html, { status: res.status, headers: respHeaders });
  }

  // For JS: rewrite import paths
  if (
    contentType.includes("javascript") ||
    contentType.includes("typescript") ||
    subpath.endsWith(".tsx") ||
    subpath.endsWith(".ts") ||
    subpath.endsWith(".jsx") ||
    subpath.endsWith(".js")
  ) {
    let js = await res.text();
    const prefix = `/sandbox/${slug}`;
    // Rewrite bare absolute imports: from "/src/..." or from "/@..."
    js = js.replace(
      /from\s+"(\/[^"]+)"/g,
      (_, path) => `from "${prefix}${path}"`,
    );
    js = js.replace(
      /from\s+'(\/[^']+)'/g,
      (_, path) => `from '${prefix}${path}'`,
    );
    // Rewrite dynamic import() calls with absolute paths
    js = js.replace(
      /import\(\s*"(\/[^"]+)"\s*\)/g,
      (_, path) => `import("${prefix}${path}")`,
    );
    js = js.replace(
      /import\(\s*'(\/[^']+)'\s*\)/g,
      (_, path) => `import('${prefix}${path}')`,
    );
    // Rewrite bare side-effect imports: import "/src/index.css"
    js = js.replace(
      /import\s+"(\/[^"]+)"/g,
      (_, path) => `import "${prefix}${path}"`,
    );
    js = js.replace(
      /import\s+'(\/[^']+)'/g,
      (_, path) => `import '${prefix}${path}'`,
    );
    // Rewrite new URL("/...", import.meta.url)
    js = js.replace(
      /new\s+URL\(\s*"(\/[^"]+)"/g,
      (_, path) => `new URL("${prefix}${path}"`,
    );
    respHeaders.set("content-type", "application/javascript; charset=utf-8");
    return new Response(js, { status: res.status, headers: respHeaders });
  }

  return new Response(res.body, { status: res.status, headers: respHeaders });
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  const [slug, ...rest] = path;

  const baseUrl = await resolveSandboxUrl(slug);
  if (!baseUrl) {
    return new Response("Sandbox not found", { status: 404 });
  }

  return proxyRequest(request, slug, baseUrl, rest.join("/"));
}
