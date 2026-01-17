import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

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
  // Resend API expects 'html' or 'react', not 'text', and not template unless using templates.
  let htmlContent = html;
  if (!htmlContent && text) {
    htmlContent = `<pre>${text}</pre>`;
  }

  console.log(resend);
  // Only pass the fields Resend expects for a basic email
  return resend.emails.send({
    from: "onboarding@resend.dev",
    to,
    subject,
    html: htmlContent || "",
  } as any);
}
