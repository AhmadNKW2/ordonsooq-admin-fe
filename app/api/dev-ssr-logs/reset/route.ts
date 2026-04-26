import { NextResponse } from "next/server";
import {
  isSsrApiDevLoggingEnabled,
  resetSsrApiLogs,
} from "../../../src/lib/dev/ssr-api-request-logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function readResetReason(req: Request): Promise<string> {
  const contentType = req.headers.get("content-type") ?? "";

  try {
    if (contentType.includes("application/json")) {
      const payload = await req.json();
      if (typeof payload?.reason === "string" && payload.reason.trim()) {
        return payload.reason;
      }
    } else {
      const text = await req.text();
      if (text.trim()) {
        return text.trim();
      }
    }
  } catch {
    return "client-reset";
  }

  return "client-reset";
}

export async function POST(req: Request) {
  if (!isSsrApiDevLoggingEnabled()) {
    return NextResponse.json({ ok: false }, { status: 404 });
  }

  const reason = await readResetReason(req);
  await resetSsrApiLogs(reason);

  return NextResponse.json({ ok: true, reason });
}