// Minimal static dev server — no dependencies, just Node's built-ins.
// Run:  node dev-server.mjs           (serves on http://localhost:3000)
//       node dev-server.mjs 8080      (custom port)
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize, sep } from "node:path";

const root = process.cwd();
const port = Number(process.argv[2]) || 3000;

const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".mjs": "application/javascript; charset=utf-8",
  ".jsx": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".ico": "image/x-icon",
  ".webp": "image/webp",
  ".ttf": "font/ttf",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".pdf": "application/pdf",
  ".map": "application/json; charset=utf-8",
};

const server = createServer(async (req, res) => {
  try {
    let urlPath = decodeURIComponent(new URL(req.url, "http://x").pathname);
    if (urlPath.endsWith("/")) urlPath += "index.html";

    // Resolve and prevent path traversal outside root.
    const filePath = normalize(join(root, urlPath));
    if (!filePath.startsWith(root + sep) && filePath !== root) {
      res.writeHead(403).end("Forbidden");
      return;
    }

    const info = await stat(filePath);
    const target = info.isDirectory() ? join(filePath, "index.html") : filePath;
    const body = await readFile(target);
    const type = types[extname(target).toLowerCase()] || "application/octet-stream";
    res.writeHead(200, { "Content-Type": type, "Cache-Control": "no-cache" });
    res.end(body);
  } catch {
    // SPA fallback: a clean route like /sign-in (no file extension) has no file
    // on disk — serve the app shell so the client router can take over. Real
    // missing assets (with an extension) still 404. Mirrors the 404.html trick
    // GitHub Pages uses in production.
    try {
      const urlPath = decodeURIComponent(new URL(req.url, "http://x").pathname);
      if (!extname(urlPath)) {
        const body = await readFile(join(root, "index.html"));
        res.writeHead(200, { "Content-Type": types[".html"], "Cache-Control": "no-cache" });
        res.end(body);
        return;
      }
    } catch { /* fall through to 404 */ }
    res.writeHead(404, { "Content-Type": "text/plain" }).end("404 Not Found");
  }
});

server.listen(port, () => {
  console.log(`Veridian dev server running:`);
  console.log(`  App:     http://localhost:${port}/`);
  console.log(`  Previews: http://localhost:${port}/preview/`);
  console.log(`Serving ${root}`);
  console.log(`Press Ctrl+C to stop.`);
});
