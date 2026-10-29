import "server-only";
import { createHash, randomBytes, randomUUID } from "node:crypto";
import {
  BOOKING_SOURCE_OPTIONS,
  CHALLENGE_OPTIONS,
  EXPERIENCE_OPTIONS,
  getValidatedSelection,
  INQUIRY_STATUSES,
  isStatus,
  MARKET_OPTIONS,
  TIMELINE_OPTIONS,
  type InquiryStatus
} from "./inquiry-config";

type JsonRecord = Record<string, unknown>;

export type ValidatedInquiry = {
  service: string;
  packageName: string | null;
  packageLabel: string | null;
  companyName: string;
  websiteUrl: string | null;
  experiences: string[];
  bookingSources: string[];
  challenge: string;
  markets: string[];
  startTimeline: string;
  budgetType: "monthly_ad_spend" | "website_budget" | "project_budget";
  budgetRange: string | null;
  fullName: string;
  email: string;
  whatsapp: string;
  additionalInformation: string | null;
  privacyConsent: true;
  idempotencyKey: string;
  trackingToken: string;
  source: string;
  referrer: string | null;
  landingUrl: string | null;
  utm: Record<string, string>;
};

export type InquiryRecord = {
  id: string;
  reference: string;
  status: InquiryStatus;
  analytics_event_id: string;
  company_name: string;
  full_name: string;
  email: string;
  whatsapp: string;
  website_url: string | null;
  service: string;
  package_name: string | null;
  package_label: string | null;
  experiences: string[];
  booking_sources: string[];
  challenge: string;
  markets: string[];
  start_timeline: string;
  budget_type: string;
  budget_range: string | null;
  additional_information: string | null;
  source: string;
  utm: Record<string, string>;
  referrer: string | null;
  created_at: string;
  status_updated_at: string;
  notification_status: string;
  inquiry_status_history?: Array<Record<string, unknown>>;
  inquiry_notes?: Array<Record<string, unknown>>;
};

const text = (value: unknown, max: number) => typeof value === "string" ? value.replace(/[\u0000-\u001f\u007f]/g, " ").trim().slice(0, max) : "";
const allowedArray = (value: unknown, options: readonly string[]) => Array.isArray(value) ? [...new Set(value.filter((entry): entry is string => typeof entry === "string" && options.includes(entry)))].slice(0, options.length) : [];
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeUrl(value: unknown) {
  const candidate = text(value, 300);
  if (!candidate) return null;
  try {
    const url = new URL(candidate.startsWith("http") ? candidate : `https://${candidate}`);
    return ["http:", "https:"].includes(url.protocol) ? url.toString() : null;
  } catch {
    return null;
  }
}

function safeUtm(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const allowed = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "gclid", "fbclid"];
  return Object.fromEntries(allowed.map((key) => [key, text((value as JsonRecord)[key], 160)]).filter(([, entry]) => Boolean(entry)));
}

export function validateInquiryInput(input: unknown): { data?: ValidatedInquiry; errors: Record<string, string> } {
  const body = input && typeof input === "object" && !Array.isArray(input) ? input as JsonRecord : {};
  const errors: Record<string, string> = {};
  const selection = getValidatedSelection(body.service, body.packageName);
  const companyName = text(body.companyName, 140);
  const websiteInput = text(body.websiteUrl, 300);
  const websiteUrl = normalizeUrl(websiteInput);
  const experiences = allowedArray(body.experiences, EXPERIENCE_OPTIONS);
  const bookingSources = allowedArray(body.bookingSources, BOOKING_SOURCE_OPTIONS);
  const challenge = text(body.challenge, 120);
  const markets = allowedArray(body.markets, MARKET_OPTIONS);
  const startTimeline = text(body.startTimeline, 80);
  const fullName = text(body.fullName, 120);
  const email = text(body.email, 180).toLowerCase();
  const whatsapp = text(body.whatsapp, 40);
  const phoneDigits = whatsapp.replace(/\D/g, "");
  const idempotencyKey = text(body.idempotencyKey, 80);
  const trackingToken = text(body.trackingToken, 160);

  if (!selection.service) errors.service = "Select how Safari Digital can help.";
  if (!companyName) errors.companyName = "Enter your tourism company name.";
  if (websiteInput && !websiteUrl) errors.websiteUrl = "Enter a valid website address.";
  if (!experiences.length) errors.experiences = "Select at least one experience.";
  if (!bookingSources.length) errors.bookingSources = "Select at least one booking source.";
  if (!CHALLENGE_OPTIONS.includes(challenge as typeof CHALLENGE_OPTIONS[number])) errors.challenge = "Select your biggest challenge.";
  if (!markets.length) errors.markets = "Select at least one market.";
  if (!TIMELINE_OPTIONS.includes(startTimeline as typeof TIMELINE_OPTIONS[number])) errors.startTimeline = "Select when you plan to start.";
  if (!fullName) errors.fullName = "Enter your full name.";
  if (!emailPattern.test(email)) errors.email = "Enter a valid business email.";
  if (phoneDigits.length < 7 || phoneDigits.length > 18) errors.whatsapp = "Enter a WhatsApp number including country code.";
  if (body.privacyConsent !== true) errors.privacyConsent = "Privacy consent is required.";
  if (!/^[0-9a-f-]{36}$/i.test(idempotencyKey)) errors.form = "Refresh the page and try again.";
  if (!/^[A-Za-z0-9_-]{40,160}$/.test(trackingToken)) errors.form = "Refresh the page and try again.";

  if (Object.keys(errors).length || !selection.service) return { errors };
  const budgetType = selection.service === "marketing" ? "monthly_ad_spend" : selection.service === "website" ? "website_budget" : "project_budget";
  return {
    errors,
    data: {
      service: selection.service,
      packageName: selection.packageName,
      packageLabel: selection.packageLabel,
      companyName,
      websiteUrl,
      experiences,
      bookingSources,
      challenge,
      markets,
      startTimeline,
      budgetType,
      budgetRange: text(body.budgetRange, 100) || null,
      fullName,
      email,
      whatsapp,
      additionalInformation: text(body.additionalInformation, 3000) || null,
      privacyConsent: true,
      idempotencyKey,
      trackingToken,
      source: text(body.source, 120) || "website_get_started",
      referrer: text(body.referrer, 500) || null,
      landingUrl: text(body.landingUrl, 500) || null,
      utm: safeUtm(body.utm)
    }
  };
}

function config() {
  const url = process.env.SUPABASE_URL?.replace(/\/$/, "");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Inquiry persistence is not configured.");
  return { url, key };
}

async function supabase(path: string, init: RequestInit = {}) {
  const { url, key } = config();
  const response = await fetch(`${url}/rest/v1/${path}`, {
    ...init,
    cache: "no-store",
    headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json", Prefer: "return=representation", ...init.headers }
  });
  const body = await response.text();
  if (!response.ok) throw new Error(`Persistence error (${response.status}): ${body.slice(0, 300)}`);
  return body ? JSON.parse(body) : null;
}

export const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");
export const isPersistenceConfigured = () => Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);

export async function rateLimitExceeded(ipHash: string) {
  const since = encodeURIComponent(new Date(Date.now() - 60 * 60 * 1000).toISOString());
  const rows = await supabase(`inquiries?source_ip_hash=eq.${ipHash}&created_at=gte.${since}&select=id&limit=5`);
  return Array.isArray(rows) && rows.length >= 5;
}

export function hashIp(ip: string) {
  const salt = process.env.RATE_LIMIT_SALT || process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex");
}

export async function createInquiry(data: ValidatedInquiry, ipHash: string, userAgent: string) {
  const reference = `SD-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${randomBytes(3).toString("hex").toUpperCase()}`;
  const analyticsEventId = randomUUID();
  const payload = {
    reference,
    tracking_token_hash: hashToken(data.trackingToken),
    idempotency_key: data.idempotencyKey,
    analytics_event_id: analyticsEventId,
    status: "inquiry_received",
    service: data.service,
    package_name: data.packageName,
    package_label: data.packageLabel,
    company_name: data.companyName,
    website_url: data.websiteUrl,
    experiences: data.experiences,
    booking_sources: data.bookingSources,
    challenge: data.challenge,
    markets: data.markets,
    start_timeline: data.startTimeline,
    budget_type: data.budgetType,
    budget_range: data.budgetRange,
    full_name: data.fullName,
    email: data.email,
    whatsapp: data.whatsapp,
    additional_information: data.additionalInformation,
    privacy_consent_at: new Date().toISOString(),
    source: data.source,
    utm: data.utm,
    referrer: data.referrer,
    landing_url: data.landingUrl,
    source_ip_hash: ipHash,
    user_agent: userAgent.slice(0, 500)
  };

  try {
    const rows = await supabase("rpc/create_safari_inquiry", { method: "POST", body: JSON.stringify({ payload }) });
    const row = Array.isArray(rows) ? rows[0] : rows;
    return { created: true, id: row.id as string, reference: row.reference as string, analyticsEventId: row.analytics_event_id as string };
  } catch (error) {
    const existing = await supabase(`inquiries?idempotency_key=eq.${encodeURIComponent(data.idempotencyKey)}&tracking_token_hash=eq.${hashToken(data.trackingToken)}&select=id,reference,analytics_event_id&limit=1`);
    if (Array.isArray(existing) && existing[0]) return { created: false, id: existing[0].id as string, reference: existing[0].reference as string, analyticsEventId: existing[0].analytics_event_id as string };
    throw error;
  }
}

export async function updateNotification(id: string, status: string, error?: string) {
  await supabase(`inquiries?id=eq.${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify({ notification_status: status, notification_attempts: status === "not_configured" ? 0 : status === "sent" ? 1 : 2, last_notification_error: error?.slice(0, 500) || null }) });
}

export async function getInquiryByTrackingToken(token: string) {
  if (!/^[A-Za-z0-9_-]{40,160}$/.test(token)) return null;
  const rows = await supabase(`inquiries?tracking_token_hash=eq.${hashToken(token)}&select=reference,company_name,status,status_updated_at,created_at&limit=1`);
  return Array.isArray(rows) ? rows[0] ?? null : null;
}

export async function listAdminInquiries() {
  const rows = await supabase("inquiries?select=*,inquiry_status_history(*),inquiry_notes(*)&order=created_at.desc&limit=100");
  return (Array.isArray(rows) ? rows : []) as InquiryRecord[];
}

export async function updateInquiryAdmin(id: string, status: string, note: string) {
  if (!/^[0-9a-f-]{36}$/i.test(id) || !isStatus(status)) throw new Error("Invalid inquiry update.");
  await supabase("rpc/update_safari_inquiry", { method: "POST", body: JSON.stringify({ p_inquiry_id: id, p_status: status, p_note: note.slice(0, 2000) || null, p_actor: "Safari Digital admin" }) });
}

export function isValidStatusSequence(status: string): status is InquiryStatus {
  return (INQUIRY_STATUSES as readonly string[]).includes(status);
}
