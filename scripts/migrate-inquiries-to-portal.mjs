#!/usr/bin/env node

const portalEndpoint = "https://safari-digital-portal.vercel.app/api/inquiries";
const portalKey = process.env.PORTAL_INQUIRY_FORM_KEY || "sdf_-qsV4XCNLtUodlDXr0p1Rw1Z";
const supabaseUrl = process.env.SUPABASE_URL?.replace(/\/$/, "");
const supabaseKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
const execute = process.argv.includes("--execute");

if (!supabaseUrl || !supabaseKey) {
  console.error("SUPABASE_URL and SUPABASE_SECRET_KEY (or SUPABASE_SERVICE_ROLE_KEY) must be set.");
  process.exit(1);
}

const sourceHeaders = { apikey: supabaseKey, ...(supabaseKey.startsWith("sb_secret_") ? {} : { Authorization: `Bearer ${supabaseKey}` }) };
const clean = (value) => typeof value === "string" ? value.trim() : "";
const values = (value) => Array.isArray(value) ? value.filter((item) => typeof item === "string" && item.trim()).join(", ") : "";

function portalPayload(inquiry) {
  const utm = inquiry.utm && typeof inquiry.utm === "object" && !Array.isArray(inquiry.utm) ? inquiry.utm : {};
  const interestedIn = [clean(inquiry.service), clean(inquiry.package_label) || clean(inquiry.package_name)].filter(Boolean).join(" — ");
  const message = [
    "Imported Safari Digital inquiry",
    `Original reference: ${clean(inquiry.reference) || inquiry.id}`,
    clean(inquiry.company_name) && `Company: ${clean(inquiry.company_name)}`,
    clean(inquiry.website_url) && `Website: ${clean(inquiry.website_url)}`,
    interestedIn && `Interested in: ${interestedIn}`,
    values(inquiry.experiences) && `Experiences: ${values(inquiry.experiences)}`,
    values(inquiry.booking_sources) && `Current booking sources: ${values(inquiry.booking_sources)}`,
    clean(inquiry.challenge) && `Biggest challenge: ${clean(inquiry.challenge)}`,
    values(inquiry.markets) && `Target markets: ${values(inquiry.markets)}`,
    clean(inquiry.start_timeline) && `Project timeline: ${clean(inquiry.start_timeline)}`,
    clean(inquiry.budget_range) && `Budget range: ${clean(inquiry.budget_range)}`,
    clean(inquiry.additional_information) && `Additional information: ${clean(inquiry.additional_information)}`,
    clean(inquiry.created_at) && `Original submission date: ${clean(inquiry.created_at)}`,
    clean(inquiry.status) && `Original status: ${clean(inquiry.status)}`
  ].filter(Boolean).join("\n").slice(0, 6000);

  return {
    key: portalKey,
    name: clean(inquiry.full_name) || clean(inquiry.company_name) || "Safari Digital inquiry",
    email: clean(inquiry.email) || undefined,
    phone: clean(inquiry.whatsapp) || undefined,
    interested_in: interestedIn || undefined,
    message,
    utm_source: clean(utm.utm_source) || undefined,
    utm_medium: clean(utm.utm_medium) || undefined,
    utm_campaign: clean(utm.utm_campaign) || undefined,
    fbclid: clean(utm.fbclid) || undefined
  };
}

async function readPage(offset) {
  const query = new URLSearchParams({
    select: "id,reference,full_name,email,whatsapp,company_name,website_url,service,package_name,package_label,experiences,booking_sources,challenge,markets,start_timeline,budget_range,additional_information,source,utm,status,created_at",
    order: "created_at.asc",
    limit: "1000",
    offset: String(offset)
  });
  const response = await fetch(`${supabaseUrl}/rest/v1/inquiries?${query}`, { headers: sourceHeaders });
  if (!response.ok) throw new Error(`Supabase read failed (${response.status}).`);
  return response.json();
}

async function send(inquiry) {
  const response = await fetch(portalEndpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(portalPayload(inquiry)) });
  if (!response.ok) throw new Error(`Portal rejected the inquiry (${response.status}).`);
}

let offset = 0;
let discovered = 0;
let migrated = 0;
let skipped = 0;

do {
  const inquiries = await readPage(offset);
  discovered += inquiries.length;
  for (const inquiry of inquiries) {
    const payload = portalPayload(inquiry);
    if (!payload.email && !payload.phone) {
      skipped += 1;
      console.warn(`Skipped ${inquiry.id}: no email or phone number.`);
      continue;
    }
    if (execute) await send(inquiry);
    migrated += 1;
  }
  offset += inquiries.length;
  if (inquiries.length < 1000) break;
} while (true);

console.log(`${execute ? "Migrated" : "Would migrate"} ${migrated} of ${discovered} inquiries${skipped ? `; skipped ${skipped} without contact details` : ""}.`);
if (!execute) console.log("Review the count, then run again with --execute to send the inquiries to the portal.");
