// src/lib/mail.ts
import nodemailer from "nodemailer";

const host = process.env.SMTP_HOST!;
const port = Number(process.env.SMTP_PORT || 587);
const user = process.env.SMTP_USER!;
const pass = process.env.SMTP_PASS!;
const from = process.env.MAIL_FROM!;

export const transporter = nodemailer.createTransport({
  host,
  port,
  secure: port === 465, // 465 = SSL, 587 = STARTTLS
  auth: { user, pass },
});

export async function sendMail({
  to,
  subject,
  text,
  html,
}: {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}) {
  if (!to) throw new Error("Missing recipient 'to'");
  if (!subject) throw new Error("Missing 'subject'");
  if (!text && !html) throw new Error("Provide 'text' or 'html'");

  const info = await transporter.sendMail({
    from,
    to,
    subject,
    text,
    html,
  });

  return info; // nodemailer info object (messageId, response, etc.)
}
