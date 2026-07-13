import { runExpressApp } from "@/server/adapter";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const app = require("@/server/app");

async function handler(request) {
  const url = new URL(request.url);
  const urlPath = url.pathname.replace(/^\/api/, "") + url.search;

  return runExpressApp(app, request, urlPath || "/");
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
