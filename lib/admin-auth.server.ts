import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

const COOKIE_NAME = "sd_admin_session";
const EIGHT_HOURS = 60 * 60 * 8;

function safeEqual(left: string, right: string) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

function secret() {
  return process.env.ADMIN_SESSION_SECRET || "";
}

function sign(value: string) {
  return createHmac("sha256", secret()).update(value).digest("base64url");
}

export function isAdminConfigured() {
  return Boolean(process.env.ADMIN_PASSWORD && process.env.ADMIN_SESSION_SECRET && process.env.ADMIN_SESSION_SECRET.length >= 32);
}

export function verifyAdminPassword(password: string) {
  const configured = process.env.ADMIN_PASSWORD || "";
  return isAdminConfigured() && safeEqual(password, configured);
}

export async function createAdminSession() {
  const expires = Math.floor(Date.now() / 1000) + EIGHT_HOURS;
  const value = `${expires}.${sign(String(expires))}`;
  (await cookies()).set(COOKIE_NAME, value, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", path: "/", maxAge: EIGHT_HOURS, priority: "high" });
}

export async function clearAdminSession() {
  (await cookies()).delete(COOKIE_NAME);
}

export async function isAdminAuthenticated() {
  if (!isAdminConfigured()) return false;
  const value = (await cookies()).get(COOKIE_NAME)?.value || "";
  const [expires, signature] = value.split(".");
  if (!expires || !signature || Number(expires) < Math.floor(Date.now() / 1000)) return false;
  return safeEqual(signature, sign(expires));
}
