import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getBackendOrigin(): string {
  return (
    process.env.ADMIN_BACKEND_ORIGIN ||
    process.env.BACKEND_ORIGIN ||
    process.env.ORDONSOOQ_BACKEND_ORIGIN ||
    process.env.NEXT_PUBLIC_BACKEND_ORIGIN ||
    "http://localhost:3001"
  ).replace(/\/$/, "");
}

function buildUpstreamUrl(req: Request, pathSegments: string[]): string {
  const backendOrigin = getBackendOrigin();
  const url = new URL(req.url);

  // Our frontend calls /api/<path>. The backend expects /api/<path> too.
  const upstream = new URL(`${backendOrigin}/api/${pathSegments.join("/")}`);
  upstream.search = url.search;
  return upstream.toString();
}

async function proxy(req: Request, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  const upstreamUrl = buildUpstreamUrl(req, path);

  // Forward most headers (especially Cookie), but avoid sending hop-by-hop headers.
  const outgoingHeaders = new Headers(req.headers);
  outgoingHeaders.delete("host");

  const method = req.method.toUpperCase();
  const hasBody = !(method === "GET" || method === "HEAD");

  const upstreamResp = await fetch(upstreamUrl, {
    method,
    headers: outgoingHeaders,
    body: hasBody ? await req.arrayBuffer() : undefined,
    redirect: "manual",
  });

  const resHeaders = new Headers();

  // Copy headers except ones Next/Vercel manage.
  upstreamResp.headers.forEach((value, key) => {
    const lower = key.toLowerCase();
    if (lower === "content-encoding" || lower === "transfer-encoding" || lower === "connection") return;
    if (lower === "set-cookie") return; // handled separately
    resHeaders.set(key, value);
  });

  // Preserve Set-Cookie properly (can be multiple).
  const getSetCookie = (upstreamResp.headers as any).getSetCookie as undefined | (() => string[]);
  const setCookies = typeof getSetCookie === "function" ? getSetCookie.call(upstreamResp.headers) : [];
  if (setCookies.length > 0) {
    for (const cookie of setCookies) {
      resHeaders.append("set-cookie", cookie);
    }
  } else {
    const single = upstreamResp.headers.get("set-cookie");
    if (single) {
      resHeaders.set("set-cookie", single);
    }
  }

  return new NextResponse(upstreamResp.body, {
    status: upstreamResp.status,
    headers: resHeaders,
  });
}

export function GET(req: Request, ctx: any) {
  return proxy(req, ctx);
}
export function POST(req: Request, ctx: any) {
  return proxy(req, ctx);
}
export function PUT(req: Request, ctx: any) {
  return proxy(req, ctx);
}
export function PATCH(req: Request, ctx: any) {
  return proxy(req, ctx);
}
export function DELETE(req: Request, ctx: any) {
  return proxy(req, ctx);
}
export function OPTIONS(req: Request, ctx: any) {
  return proxy(req, ctx);
}
