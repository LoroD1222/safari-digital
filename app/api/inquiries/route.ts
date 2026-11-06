import { NextRequest } from "next/server";
import { createInquiry, hashIp, isPersistenceConfigured, rateLimitExceeded, updateMetaEvent, updateNotification, validateInquiryInput } from "../../../lib/inquiries.server";
import { isNotificationConfigured, notifySafariDigital } from "../../../lib/inquiry-email.server";
import { sendMetaLead } from "../../../lib/meta-conversions.server";
import { sendPortalInquiry } from "../../../lib/inquiry-portal.server";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  if (!isPersistenceConfigured()) return Response.json({ error: "Inquiry service is not configured yet." }, { status: 503 });
  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > 30_000) return Response.json({ error: "Submission is too large." }, { status: 413 });
  if (request.headers.get("sec-fetch-site") === "cross-site") return Response.json({ error: "Cross-site submissions are not accepted." }, { status: 403 });

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid submission." }, { status: 400 });
  }

  if (typeof body.companyFax === "string" && body.companyFax.trim()) return Response.json({ error: "Submission rejected." }, { status: 400 });
  const startedAt = Number(body.startedAt || 0);
  if (!startedAt || Date.now() - startedAt < 1000) return Response.json({ error: "Please take a moment to complete the form." }, { status: 400 });

  const validation = validateInquiryInput(body);
  if (!validation.data) return Response.json({ error: "Please correct the highlighted fields.", fields: validation.errors }, { status: 422 });

  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
  const ipHash = hashIp(forwarded);
  try {
    if (await rateLimitExceeded(ipHash)) return Response.json({ error: "Too many inquiries were submitted from this connection. Please try again later." }, { status: 429 });
    const saved = await createInquiry(validation.data, ipHash, request.headers.get("user-agent") || "unknown");
    if (saved.created) {
      const [notificationResult, metaEventResult, portalResult] = await Promise.allSettled([
        notifySafariDigital(validation.data, saved.reference, validation.data.trackingToken),
        sendMetaLead(validation.data, {
          eventId: saved.analyticsEventId,
          reference: saved.reference,
          clientIpAddress: forwarded,
          clientUserAgent: request.headers.get("user-agent") || "unknown",
          fbp: request.cookies.get("_fbp")?.value,
          fbc: request.cookies.get("_fbc")?.value
        }),
        sendPortalInquiry(validation.data, {
          fbc: request.cookies.get("_fbc")?.value,
          fbp: request.cookies.get("_fbp")?.value
        })
      ]);
      if (portalResult.status === "rejected") console.error("Portal inquiry delivery failed", portalResult.reason);
      if (notificationResult.status === "rejected") console.error("Inquiry notification failed", notificationResult.reason);
      if (metaEventResult.status === "rejected") console.error("Meta lead delivery failed", metaEventResult.reason);
      const updates = await Promise.allSettled([
        notificationResult.status === "fulfilled" ? updateNotification(saved.id, notificationResult.value.status, "error" in notificationResult.value ? notificationResult.value.error : undefined) : Promise.resolve(),
        metaEventResult.status === "fulfilled" ? updateMetaEvent(saved.id, metaEventResult.value.status, metaEventResult.value.attempts, metaEventResult.value.error) : Promise.resolve()
      ]);
      for (const update of updates) if (update.status === "rejected") console.error("Inquiry delivery status update failed", update.reason);
    }
    return Response.json({ reference: saved.reference, trackingToken: validation.data.trackingToken, leadEventId: saved.analyticsEventId, notificationConfigured: isNotificationConfigured() }, { status: saved.created ? 201 : 200 });
  } catch (error) {
    console.error("Inquiry submission failed", error);
    return Response.json({ error: "We could not securely save your inquiry. Please try again or contact us on WhatsApp." }, { status: 500 });
  }
}
