import { NextRequest } from "next/server";
import { getInquiryByTrackingToken, isPersistenceConfigured } from "../../../../lib/inquiries.server";
import { STATUS_DETAILS, isStatus } from "../../../../lib/inquiry-config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  if (!isPersistenceConfigured()) return Response.json({ error: "Status service is not configured." }, { status: 503 });
  const token = request.nextUrl.searchParams.get("token") || "";
  try {
    const inquiry = await getInquiryByTrackingToken(token);
    const status = inquiry?.status;
    if (!inquiry || !isStatus(status)) return Response.json({ error: "Inquiry not found." }, { status: 404 });
    return Response.json({ reference: inquiry.reference, companyName: inquiry.company_name, status, progress: STATUS_DETAILS[status].progress, updatedAt: inquiry.status_updated_at }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    console.error("Status lookup failed", error);
    return Response.json({ error: "Status is temporarily unavailable." }, { status: 503 });
  }
}
