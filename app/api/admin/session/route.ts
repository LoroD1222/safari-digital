import { NextRequest, NextResponse } from "next/server";
import { clearAdminSession, createAdminSession, verifyAdminPassword } from "../../../../lib/admin-auth.server";

export async function POST(request: NextRequest) {
  const form = await request.formData();
  if (form.get("action") === "logout") {
    await clearAdminSession();
    return NextResponse.redirect(new URL("/admin", request.url), 303);
  }
  const password = String(form.get("password") || "");
  if (!verifyAdminPassword(password)) return NextResponse.redirect(new URL("/admin?error=invalid", request.url), 303);
  await createAdminSession();
  return NextResponse.redirect(new URL("/admin", request.url), 303);
}
