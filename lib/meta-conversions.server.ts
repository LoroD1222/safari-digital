import "server-only";
import { createHash } from "node:crypto";
import type { ValidatedInquiry } from "./inquiries.server";

type MetaLeadContext = {
  eventId: string;
  reference: string;
  clientIpAddress: string;
  clientUserAgent: string;
  fbp?: string;
  fbc?: string;
};

export type MetaEventResult = {
  status: "sent" | "failed" | "not_configured";
  attempts: number;
  error?: string;
};

const sha256 = (value: string) => createHash("sha256").update(value).digest("hex");

function metaConfig() {
  const pixelId = process.env.META_PIXEL_ID?.trim() || "";
  const accessToken = process.env.META_CONVERSIONS_API_ACCESS_TOKEN?.trim() || "";
  const graphVersion = process.env.META_GRAPH_API_VERSION?.trim() || "";
  if (!/^\d{5,30}$/.test(pixelId) || !accessToken || !/^v\d+\.\d+$/.test(graphVersion)) return null;
  return { pixelId, accessToken, graphVersion, testEventCode: process.env.META_TEST_EVENT_CODE?.trim() || "" };
}

export function isMetaConversionsConfigured() {
  return Boolean(metaConfig());
}

function safeBrowserId(value: string | undefined) {
  const candidate = value?.trim() || "";
  return candidate.startsWith("fb.") && candidate.length <= 250 ? candidate : undefined;
}

function safeSourceUrl(value: string | null) {
  const fallback = `${(process.env.SITE_URL || "https://www.safaridigital.co.tz").replace(/\/$/, "")}/get-started`;
  if (!value) return fallback;
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) ? url.toString() : fallback;
  } catch {
    return fallback;
  }
}

function getFbc(cookieValue: string | undefined, fbclid: string | undefined) {
  const cookie = safeBrowserId(cookieValue);
  if (cookie) return cookie;
  const clickId = fbclid?.trim();
  if (!clickId || clickId.length > 200 || !/^[A-Za-z0-9._-]+$/.test(clickId)) return undefined;
  return `fb.1.${Date.now()}.${clickId}`;
}

export async function sendMetaLead(data: ValidatedInquiry, context: MetaLeadContext): Promise<MetaEventResult> {
  const config = metaConfig();
  if (!config) return { status: "not_configured", attempts: 0 };

  const userData: Record<string, string | string[]> = {
    em: [sha256(data.email.trim().toLowerCase())],
    ph: [sha256(data.whatsapp.replace(/\D/g, ""))],
    external_id: [sha256(context.reference)]
  };
  if (context.clientIpAddress && context.clientIpAddress !== "unknown") userData.client_ip_address = context.clientIpAddress;
  if (context.clientUserAgent && context.clientUserAgent !== "unknown") userData.client_user_agent = context.clientUserAgent.slice(0, 500);
  const fbp = safeBrowserId(context.fbp);
  const fbc = getFbc(context.fbc, data.utm.fbclid);
  if (fbp) userData.fbp = fbp;
  if (fbc) userData.fbc = fbc;

  const body: Record<string, unknown> = {
    access_token: config.accessToken,
    data: [{
      event_name: "Lead",
      event_time: Math.floor(Date.now() / 1000),
      event_id: context.eventId,
      event_source_url: safeSourceUrl(data.landingUrl),
      action_source: "website",
      user_data: userData
    }]
  };
  if (config.testEventCode) body.test_event_code = config.testEventCode;

  const endpoint = `https://graph.facebook.com/${config.graphVersion}/${config.pixelId}/events`;
  let lastError = "Meta event delivery failed.";
  let attempts = 0;
  for (let attempt = 1; attempt <= 2; attempt += 1) {
    attempts = attempt;
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        cache: "no-store",
        signal: AbortSignal.timeout(5_000)
      });
      const responseText = (await response.text()).slice(0, 500);
      if (response.ok) {
        const result = JSON.parse(responseText) as { events_received?: number };
        if ((result.events_received || 0) > 0) return { status: "sent", attempts: attempt };
        lastError = "Meta accepted the request but did not confirm an event.";
        break;
      }
      lastError = `Meta event delivery failed (${response.status}): ${responseText}`;
      if (response.status < 500 && response.status !== 429) break;
    } catch (error) {
      lastError = error instanceof Error ? error.message : "Meta event delivery failed.";
    }
    if (attempt === 1) await new Promise((resolve) => setTimeout(resolve, 250));
  }
  return { status: "failed", attempts, error: lastError };
}
