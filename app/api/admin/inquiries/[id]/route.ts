import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "../../../../../lib/admin-auth.server";
import { updateInquiryAdmin } from "../../../../../lib/inquiries.server";

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  if (!await isAdminAuthenticated()) return NextResponse.redirect(new URL("/admin?error=auth", request.url), 303);
  const { id } = await context.params;
  const form = await request.formData();
  try {
    await updateInquiryAdmin(id, String(form.get("status") || ""), String(form.get("note") || ""));
    return NextResponse.redirect(new URL("/admin?updated=1", request.url), 303);
  } catch (error) {
    console.error("Admin inquiry update failed", error);
    return NextResponse.redirect(new URL("/admin?error=update", request.url), 303);
  }
}
