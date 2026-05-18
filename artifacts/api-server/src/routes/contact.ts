import { Router, type IRouter, type RequestHandler } from "express";
import { z } from "zod";
import { Resend } from "resend";
import rateLimit from "express-rate-limit";
import { db, contactSubmissionsTable } from "@workspace/db";
import { allowedOrigins } from "../lib/allowed-origins";

const router: IRouter = Router();

const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests. Please try again later." },
});

const enforceOrigin: RequestHandler = (req, res, next) => {
  const origin = req.headers["origin"];
  if (origin === undefined || !allowedOrigins.has(origin)) {
    req.log.warn(
      { origin: origin ?? "(absent)" },
      "Contact submission rejected — missing or disallowed origin",
    );
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  next();
};

const ContactBody = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email().max(320),
  message: z.string().min(1).max(5000),
  website: z.string().optional(),
});

router.post("/contact", enforceOrigin, contactLimiter, async (req, res) => {
  const parsed = ContactBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  if (parsed.data.website) {
    req.log.warn("Honeypot triggered — discarding submission");
    res.status(200).json({ ok: true });
    return;
  }

  const name: string    = parsed.data.name;
  const email: string   = parsed.data.email;
  const message: string = parsed.data.message;

  try {
    await db.insert(contactSubmissionsTable).values({ name, email, message });
    req.log.info({ email }, "Contact submission saved to DB");
  } catch (err) {
    req.log.error({ err }, "Failed to save contact submission to DB");
    res.status(500).json({ error: "Failed to save submission" });
    return;
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    req.log.warn("RESEND_API_KEY is not set — submission saved but email not sent");
    res.status(200).json({ ok: true });
    return;
  }

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from: "Bert Bello Dossier <onboarding@resend.dev>",
    to: "humberto.bello@protonmail.com",
    replyTo: [email],
    subject: `New message from ${name} via humberto-bello.com`,
    text: `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`,
    html: `<p><strong>Name:</strong> ${escHtml(name)}</p><p><strong>Email:</strong> ${escHtml(email)}</p><hr/><p style="white-space:pre-wrap">${escHtml(message)}</p>`,
  });

  if (error) {
    req.log.error({ err: error }, "Resend error — submission already saved to DB");
  }

  res.status(200).json({ ok: true });
});

function escHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export default router;
