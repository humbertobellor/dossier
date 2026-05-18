import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dist = path.join(__dirname, "dist", "public");
const port = Number(process.env.PORT ?? 23561);

const app = express();

app.use((_req, res, next) => {
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
  res.setHeader(
    "Strict-Transport-Security",
    "max-age=63072000; includeSubDomains; preload",
  );
  res.setHeader(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "font-src 'self'",
      "img-src 'self' data: https:",
      "connect-src 'self'",
      "frame-ancestors 'self'",
    ].join("; "),
  );
  next();
});

const IMMUTABLE = { maxAge: "1y", immutable: true };

app.use("/assets", express.static(path.join(dist, "assets"), IMMUTABLE));
app.use("/fonts", express.static(path.join(dist, "fonts"), IMMUTABLE));

app.use(
  express.static(dist, {
    etag: false,
    setHeaders(res, filePath) {
      if (filePath.endsWith(".html")) {
        res.setHeader("Cache-Control", "no-store");
      }
    },
  }),
);

app.get("*", (_req, res) => {
  res.setHeader("Cache-Control", "no-store");
  res.sendFile(path.join(dist, "index.html"));
});

app.listen(port, "0.0.0.0");
