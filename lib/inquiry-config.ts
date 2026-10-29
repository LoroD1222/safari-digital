export const SERVICE_OPTIONS = [
  { value: "bookings", label: "Get more international bookings" },
  { value: "website", label: "Website design or redesign" },
  { value: "marketing", label: "Facebook & Instagram advertising" },
  { value: "automation", label: "Inquiry and WhatsApp automation" },
  { value: "complete", label: "Complete digital marketing solution" },
  { value: "advice", label: "I need advice" }
] as const;

export const PACKAGE_OPTIONS = {
  "landing-page": { label: "Landing Page", service: "website" },
  "tour-operator-website": { label: "Tour Operator Website", service: "website" },
  "advanced-website": { label: "Advanced Website", service: "website" },
  growth: { label: "Growth", service: "marketing" },
  scale: { label: "Scale", service: "marketing" },
  "marketing-partner": { label: "Marketing Partner", service: "marketing" }
} as const;

export const EXPERIENCE_OPTIONS = ["Safaris", "Kilimanjaro", "Zanzibar", "Other"] as const;
export const BOOKING_SOURCE_OPTIONS = ["Travel agents", "SafariBookings", "Website", "Social media", "Referrals", "Other"] as const;
export const CHALLENGE_OPTIONS = ["Not enough international inquiries", "Too dependent on travel agents", "Outdated website", "Low conversion from inquiries to bookings", "Too much manual follow-up", "Other"] as const;
export const MARKET_OPTIONS = ["USA", "UK", "Europe", "Middle East", "Other", "Not sure"] as const;
export const TIMELINE_OPTIONS = ["Immediately", "Within 1 month", "Within 3 months", "Just exploring"] as const;
export const INQUIRY_STATUSES = ["inquiry_received", "under_review", "consultation", "proposal", "onboarding"] as const;

export type ServiceValue = typeof SERVICE_OPTIONS[number]["value"];
export type PackageValue = keyof typeof PACKAGE_OPTIONS;
export type InquiryStatus = typeof INQUIRY_STATUSES[number];

export const STATUS_DETAILS: Record<InquiryStatus, { title: string; description: string; progress: number }> = {
  inquiry_received: { title: "Inquiry Received", description: "Your application was submitted successfully.", progress: 20 },
  under_review: { title: "Agency Review", description: "We review your tourism business, goals, and requirements.", progress: 40 },
  consultation: { title: "Strategy Consultation", description: "We discuss your priorities and recommend the best approach.", progress: 60 },
  proposal: { title: "Proposal & Agreement", description: "We prepare a tailored proposal and confirm the project scope.", progress: 80 },
  onboarding: { title: "Project Onboarding", description: "We collect the essentials and get your project started.", progress: 100 }
};

export function isService(value: unknown): value is ServiceValue {
  return typeof value === "string" && SERVICE_OPTIONS.some((option) => option.value === value);
}

export function isPackage(value: unknown): value is PackageValue {
  return typeof value === "string" && value in PACKAGE_OPTIONS;
}

export function isStatus(value: unknown): value is InquiryStatus {
  return typeof value === "string" && (INQUIRY_STATUSES as readonly string[]).includes(value);
}

export function getValidatedSelection(service: unknown, packageName: unknown) {
  if (isPackage(packageName)) {
    const selected = PACKAGE_OPTIONS[packageName];
    return { service: selected.service as ServiceValue, packageName, packageLabel: selected.label };
  }
  return { service: isService(service) ? service : null, packageName: null, packageLabel: null };
}

export function getServiceLabel(service: string) {
  return SERVICE_OPTIONS.find((option) => option.value === service)?.label ?? service;
}
