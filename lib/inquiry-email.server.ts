import "server-only";
import { getServiceLabel } from "./inquiry-config";
import type { ValidatedInquiry } from "./inquiries.server";

const escapeHtml = (value: string | null | undefined) => (value || "—").replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character] || character);
const row = (label: string, value: string | null | undefined) => `<tr><th align="left" style="padding:8px 14px 8px 0;color:#44645a;vertical-align:top">${escapeHtml(label)}</th><td style="padding:8px 0;color:#073c2e">${escapeHtml(value)}</td></tr>`;

async function sendEmail(to: string, subject: string, html: string, idempotencyKey: string) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  if (!apiKey || !from) throw new Error("Resend is not configured.");
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json", "Idempotency-Key": `safari-digital-${idempotencyKey}` },
    body: JSON.stringify({ from, to: [to], subject, html })
  });
  if (!response.ok) throw new Error(`Email delivery failed (${response.status}): ${(await response.text()).slice(0, 200)}`);
}

export function isNotificationConfigured() {
  return Boolean(process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL && process.env.SAFARI_DIGITAL_INQUIRY_EMAIL);
}

export async function notifySafariDigital(data: ValidatedInquiry, reference: string, trackingToken: string) {
  const recipient = process.env.SAFARI_DIGITAL_INQUIRY_EMAIL;
  if (!recipient || !isNotificationConfigured()) return { status: "not_configured" as const };
  const service = data.packageLabel ? `${getServiceLabel(data.service)} — ${data.packageLabel}` : getServiceLabel(data.service);
  const subject = `New Safari Digital Inquiry — ${data.companyName}`;
  const html = `<div style="font-family:Arial,sans-serif;max-width:720px;margin:auto;color:#073c2e"><h1 style="color:#083d30">New Safari Digital Inquiry</h1><table style="border-collapse:collapse;width:100%">${row("Inquiry reference", reference)}${row("Company", data.companyName)}${row("Contact person", data.fullName)}${row("Email", data.email)}${row("WhatsApp", data.whatsapp)}${row("Website", data.websiteUrl)}${row("Requested service", service)}${row("Experiences", data.experiences.join(", "))}${row("Current booking sources", data.bookingSources.join(", "))}${row("Business challenge", data.challenge)}${row("Budget range", data.budgetRange)}${row("Preferred markets", data.markets.join(", "))}${row("Timeline", data.startTimeline)}${row("Additional notes", data.additionalInformation)}${row("Submission date", new Date().toLocaleString("en-GB", { timeZone: "Africa/Dar_es_Salaam", dateStyle: "long", timeStyle: "short" }))}${row("Source", data.source)}${row("UTM data", Object.entries(data.utm).map(([key, value]) => `${key}: ${value}`).join(" | ") || "—")}</table></div>`;

  let lastError: unknown;
  let delivered = false;
  for (let attempt = 0; attempt < 2 && !delivered; attempt += 1) {
    try {
      await sendEmail(recipient, subject, html, `${reference}-admin`);
      delivered = true;
    } catch (error) {
      lastError = error;
      if (attempt === 0) await new Promise((resolve) => setTimeout(resolve, 250));
    }
  }
  if (!delivered) return { status: "failed" as const, error: lastError instanceof Error ? lastError.message : "Unknown notification error" };

  if (process.env.SEND_CUSTOMER_CONFIRMATION === "true") {
    try {
      const siteUrl = (process.env.SITE_URL || "https://www.safaridigital.co.tz").replace(/\/$/, "");
      const statusUrl = `${siteUrl}/thank-you?token=${encodeURIComponent(trackingToken)}`;
      await sendEmail(data.email, `Your Safari Digital inquiry — ${reference}`, `<div style="font-family:Arial,sans-serif;max-width:640px;margin:auto;color:#073c2e"><h1>We received your inquiry</h1><p>Thank you, ${escapeHtml(data.fullName)}. Your inquiry reference is <strong>${escapeHtml(reference)}</strong>.</p><p>We will review your tourism business and contact you about the next step.</p><p><a href="${statusUrl}" style="display:inline-block;padding:14px 20px;background:#167152;color:#fff;text-decoration:none;border-radius:6px">View inquiry progress</a></p></div>`, `${reference}-customer`);
    } catch (error) {
      console.error("Customer confirmation email failed", error);
    }
  }
  return { status: "sent" as const };
}
