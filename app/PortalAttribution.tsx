"use client";

import { useEffect } from "react";

export const PORTAL_ATTRIBUTION_STORAGE_KEY = "safari-digital-portal-attribution";
export const PORTAL_ATTRIBUTION_FIELDS = ["utm_source", "utm_medium", "utm_campaign", "fbclid"] as const;

export type PortalAttribution = Partial<Record<(typeof PORTAL_ATTRIBUTION_FIELDS)[number], string>>;

export function getPortalAttribution(): PortalAttribution {
  if (typeof window === "undefined") return {};
  const current = Object.fromEntries(PORTAL_ATTRIBUTION_FIELDS.map((field) => [field, new URLSearchParams(window.location.search).get(field)]).filter(([, value]) => Boolean(value))) as PortalAttribution;
  try {
    const saved = JSON.parse(sessionStorage.getItem(PORTAL_ATTRIBUTION_STORAGE_KEY) || "{}") as Record<string, unknown>;
    const stored = Object.fromEntries(PORTAL_ATTRIBUTION_FIELDS.map((field) => [field, saved[field]]).filter(([, value]) => typeof value === "string" && value.length > 0));
    return { ...stored, ...current };
  } catch {
    sessionStorage.removeItem(PORTAL_ATTRIBUTION_STORAGE_KEY);
    return {};
  }
}

export default function PortalAttribution() {
  useEffect(() => {
    const attribution = getPortalAttribution();
    if (Object.keys(attribution).length) sessionStorage.setItem(PORTAL_ATTRIBUTION_STORAGE_KEY, JSON.stringify(attribution));
  }, []);

  return null;
}
