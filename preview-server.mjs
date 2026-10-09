import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const projectDir = fileURLToPath(new URL(".", import.meta.url));
const distDir = resolve(projectDir, "dist");
const shopOrigin = "https://shop-rose-kappa.vercel.app";
const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
};

async function readRequestBody(request, limit = 1024 * 1024) {
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > limit) throw new Error("Request too large");
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

async function proxyShopRequest(request, response, pathname, search) {
  try {
    const headers = new Headers();
    const contentType = request.headers["content-type"];
    const authorization = request.headers.authorization;
    if (contentType) headers.set("content-type", contentType);
    if (authorization) headers.set("authorization", authorization);
    const body = ["GET", "HEAD"].includes(request.method || "GET") ? undefined : await readRequestBody(request);
    const upstream = await fetch(`${shopOrigin}${pathname}${search}`, {
      method: request.method,
      headers,
      body: body?.length ? body : undefined,
      redirect: "manual",
    });
    const responseHeaders = {};
    for (const name of ["content-type", "cache-control", "etag", "last-modified", "location"]) {
      const value = upstream.headers.get(name);
      if (value) responseHeaders[name] = value;
    }
    response.writeHead(upstream.status, responseHeaders);
    if (request.method === "HEAD") response.end();
    else response.end(Buffer.from(await upstream.arrayBuffer()));
  } catch (error) {
    response.writeHead(502, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" });
    response.end(JSON.stringify({ error: error instanceof Error ? error.message : "Shop preview proxy failed." }));
  }
}

async function serveStatic(request, response, pathname) {
  let decoded;
  try {
    decoded = decodeURIComponent(pathname);
  } catch {
    response.writeHead(400);
    response.end("Bad path");
    return;
  }
  const requested = resolve(distDir, `.${decoded}`);
  if (requested !== distDir && !requested.startsWith(`${distDir}${sep}`)) {
    response.writeHead(403);
    response.end("Forbidden");
    return;
  }

  let file = requested;
  try {
    const info = await stat(file);
    if (info.isDirectory()) file = resolve(file, "index.html");
  } catch {
    // Expo Router uses client-side navigation; unresolved paths fall back to the app shell.
    file = resolve(distDir, "index.html");
  }

  try {
    const contents = await readFile(file);
    response.writeHead(200, {
      "content-type": mimeTypes[extname(file).toLowerCase()] || "application/octet-stream",
      "cache-control": file.endsWith("index.html") ? "no-store" : "public, max-age=3600",
      "x-content-type-options": "nosniff",
    });
    if (request.method === "HEAD") response.end();
    else response.end(contents);
  } catch {
    response.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    response.end("Preview asset not found. Re-export the app for web first.");
  }
}

const server = createServer(async (request, response) => {
  const url = new URL(request.url || "/", `http://${request.headers.host || "localhost"}`);
  if (url.pathname === "/api/orders" && request.method === "POST") {
    response.writeHead(403, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" });
    response.end(JSON.stringify({ error: "Checkout is disabled in this visual preview; no live order was created." }));
    return;
  }
  if (url.pathname === "/api/cart" && request.method === "GET") {
    response.writeHead(200, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" });
    response.end(JSON.stringify({ items: [], persisted: true, shared: false, ownerMismatch: false }));
    return;
  }
  if (url.pathname === "/api/cart" && request.method === "POST") {
    response.writeHead(200, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" });
    response.end(JSON.stringify({ ok: true, persisted: false, shared: false }));
    return;
  }
  if (url.pathname === "/api/products" || url.pathname.startsWith("/products/")) {
    await proxyShopRequest(request, response, url.pathname, url.search);
    return;
  }
  await serveStatic(request, response, url.pathname);
});

const port = Number(process.env.PORT || 4173);
server.listen(port, "0.0.0.0", () => {
  console.log(`Morrow Goods visual preview ready on 0.0.0.0:${port}`);
});
