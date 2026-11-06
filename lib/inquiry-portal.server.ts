import "server-only";
import type { ValidatedInquiry } from "./inquiries.server";

const endpoint = "https://safari-digital-portal.vercel.app/api/inquiries";
const formKey = process.env.PORTAL_INQUIRY_FORM_KEY || "sdf_-qsV4XCNLtUodlDXr0p1Rw1Z";

export async function sendPortalInquiry(data: ValidatedInquiry, cookies: { fbc?: string; fbp?: string }) {
  const message = [
    "Safari Digital website qualification form",
    `Company: ${data.companyName}`,
    data.websiteUrl && `Website: ${data.websiteUrl}`,
    data.packageLabel && `Package: ${data.packageLabel}`,
    data.experiences.length && `Experiences: ${data.experiences.join(", ")}`,
    data.bookingSources.length && `Current booking sources: ${data.bookingSources.join(", ")}`,
    `Biggest challenge: ${data.challenge}`,
    `Target markets: ${data.markets.join(", ")}`,
    `Project timeline: ${data.startTimeline}`,
    data.budgetRange && `Budget range: ${data.budgetRange}`,
    data.additionalInformation && `Additional information: ${data.additionalInformation}`
  ].filter(Boolean).join("\n");

  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    signal: AbortSignal.timeout(10000),
    body: JSON.stringify({
      key: formKey,
      name: data.fullName,
      email: data.email,
      phone: data.whatsapp,
      interested_in: data.packageLabel || data.service,
      message,
      utm_source: data.utm.utm_source,
      utm_medium: data.utm.utm_medium,
      utm_campaign: data.utm.utm_campaign,
      fbclid: data.utm.fbclid,
      fbc: cookies.fbc,
      fbp: cookies.fbp
    })
  });
  if (!response.ok) throw new Error(`Portal inquiry delivery failed (${response.status}).`);
}
