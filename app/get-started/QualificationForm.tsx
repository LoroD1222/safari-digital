"use client";

import { FormEvent, KeyboardEvent, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BOOKING_SOURCE_OPTIONS,
  CHALLENGE_OPTIONS,
  EXPERIENCE_OPTIONS,
  MARKET_OPTIONS,
  PACKAGE_OPTIONS,
  SERVICE_OPTIONS,
  TIMELINE_OPTIONS,
  type PackageValue,
  type ServiceValue
} from "../../lib/inquiry-config";
import styles from "./get-started.module.css";

type FormState = {
  service: ServiceValue | "";
  companyName: string;
  websiteUrl: string;
  experiences: string[];
  bookingSources: string[];
  challenge: string;
  markets: string[];
  startTimeline: string;
  budgetRange: string;
  fullName: string;
  email: string;
  countryCode: string;
  whatsapp: string;
  additionalInformation: string;
  privacyConsent: boolean;
  companyFax: string;
};

const initialState: FormState = { service: "", companyName: "", websiteUrl: "", experiences: [], bookingSources: [], challenge: "", markets: [], startTimeline: "", budgetRange: "", fullName: "", email: "", countryCode: "+255", whatsapp: "", additionalInformation: "", privacyConsent: false, companyFax: "" };
const storageKey = "safari-digital-qualification-draft";

function track(name: string, parameters: Record<string, string | number> = {}) {
  if (typeof window === "undefined") return;
  const payload = { event: name, form_name: "lead_qualification", ...parameters };
  const analyticsWindow = window as typeof window & { gtag?: (...args: unknown[]) => void; dataLayer?: unknown[] };
  if (analyticsWindow.gtag) analyticsWindow.gtag("event", name, payload);
  else (analyticsWindow.dataLayer ||= []).push(payload);
}

function createTrackingToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export default function QualificationForm({ initialService, packageName, packageLabel }: { initialService: ServiceValue | null; packageName: PackageValue | null; packageLabel: string | null }) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormState>({ ...initialState, service: initialService || "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [startedAt] = useState(() => Date.now());
  const [idempotencyKey] = useState(() => crypto.randomUUID());
  const [trackingToken] = useState(() => createTrackingToken());
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const saved = sessionStorage.getItem(storageKey);
      if (saved) {
        try {
          const parsed = JSON.parse(saved) as Partial<FormState>;
          setForm((current) => ({ ...current, ...parsed, service: initialService || parsed.service || current.service }));
        } catch { sessionStorage.removeItem(storageKey); }
      }
      track("form_start", { form_step: 1 });
    });
    return () => cancelAnimationFrame(frame);
  }, [initialService]);

  useEffect(() => {
    sessionStorage.setItem(storageKey, JSON.stringify(form));
  }, [form]);

  useEffect(() => {
    const focusable = formRef.current?.querySelector<HTMLElement>("[data-autofocus]");
    focusable?.focus({ preventScroll: true });
  }, [step]);

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: "" }));
  };

  const toggle = (key: "experiences" | "bookingSources" | "markets", value: string) => {
    update(key, form[key].includes(value) ? form[key].filter((item) => item !== value) : [...form[key], value]);
  };

  const validateStep = (targetStep: number) => {
    const nextErrors: Record<string, string> = {};
    if (targetStep === 1 && !form.service) nextErrors.service = "Choose one service to continue.";
    if (targetStep === 2) {
      if (!form.companyName.trim()) nextErrors.companyName = "Enter your tourism company name.";
      if (form.websiteUrl.trim()) {
        try { new URL(form.websiteUrl.startsWith("http") ? form.websiteUrl : `https://${form.websiteUrl}`); }
        catch { nextErrors.websiteUrl = "Enter a valid website address."; }
      }
      if (!form.experiences.length) nextErrors.experiences = "Select at least one experience.";
      if (!form.bookingSources.length) nextErrors.bookingSources = "Select at least one booking source.";
    }
    if (targetStep === 3) {
      if (!form.challenge) nextErrors.challenge = "Select your biggest challenge.";
      if (!form.markets.length) nextErrors.markets = "Select at least one market.";
      if (!form.startTimeline) nextErrors.startTimeline = "Select when you plan to start.";
    }
    if (targetStep === 4) {
      if (!form.fullName.trim()) nextErrors.fullName = "Enter your full name.";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) nextErrors.email = "Enter a valid business email.";
      if (form.whatsapp.replace(/\D/g, "").length < 7) nextErrors.whatsapp = "Enter a valid WhatsApp number.";
      if (!form.privacyConsent) nextErrors.privacyConsent = "Please consent before submitting.";
    }
    setErrors(nextErrors);
    return !Object.keys(nextErrors).length;
  };

  const continueForm = () => {
    if (!validateStep(step)) return;
    track("form_step_complete", { completed_step: step });
    setStep((current) => Math.min(4, current + 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLFormElement>) => {
    if (event.key !== "Enter" || event.shiftKey || event.target instanceof HTMLTextAreaElement || event.target instanceof HTMLButtonElement) return;
    event.preventDefault();
    if (step < 4) continueForm();
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (submitting || !validateStep(4)) return;
    setSubmitting(true);
    setSubmitError("");
    const params = new URLSearchParams(window.location.search);
    const utm = Object.fromEntries(["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "gclid", "fbclid"].map((key) => [key, params.get(key) || ""]).filter(([, value]) => value));
    try {
      const response = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, whatsapp: `${form.countryCode}${form.whatsapp.replace(/^0+/, "")}`, packageName, idempotencyKey, trackingToken, startedAt, source: params.get("utm_source") || "website_get_started", utm, referrer: document.referrer, landingUrl: window.location.href })
      });
      const result = await response.json();
      if (!response.ok) {
        setErrors(result.fields || {});
        throw new Error(result.error || "Your inquiry could not be submitted.");
      }
      sessionStorage.removeItem(storageKey);
      sessionStorage.setItem("safari-digital-pending-lead", JSON.stringify({ token: result.trackingToken, eventId: result.leadEventId }));
      track("lead_submission_success", { service: form.service, package: packageName || "none" });
      router.push(`/thank-you?token=${encodeURIComponent(result.trackingToken)}`);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Something went wrong. Please try again.");
      setSubmitting(false);
    }
  };

  const progress = step * 25;
  const budget = useMemo(() => form.service === "marketing" ? { title: "Approximate monthly advertising spend", note: "This is separate from Safari Digital's management fee.", options: ["Under $500/month", "$500–$1,500/month", "$1,500–$3,000/month", "$3,000+/month", "I need advice"] } : form.service === "website" ? { title: "Approximate one-time website budget", note: "An estimate helps us recommend the right scope. Every operator is welcome.", options: ["Under $500", "$500–$1,500", "$1,500–$3,000", "$3,000+", "I need advice"] } : { title: "Approximate project budget", note: "Optional — choose advice if you're unsure.", options: ["Under $500", "$500–$1,500", "$1,500–$3,000", "$3,000+", "I need advice"] }, [form.service]);

  return <section className={styles.formShell}>
    <div className={styles.progressMeta}><span>Step {step} of 4</span><strong>{progress}% complete</strong></div>
    <div className={styles.progressTrack} aria-hidden="true"><span style={{ width: `${progress}%` }} /></div>
    {packageName && packageLabel && <div className={styles.packageNotice}><span>✓</span> You&apos;re interested in: <strong>{PACKAGE_OPTIONS[packageName].label}</strong></div>}
    <form ref={formRef} onSubmit={submit} onKeyDown={handleKeyDown} noValidate>
      {step === 1 && <fieldset><legend>How can we help your business?</legend><p className={styles.questionHelp}>Choose the option closest to your current priority.</p><div className={styles.cardGrid}>{SERVICE_OPTIONS.map((option, index) => <label className={`${styles.answerCard} ${form.service === option.value ? styles.selected : ""}`} key={option.value}><input data-autofocus={index === 0 ? true : undefined} type="radio" name="service" value={option.value} checked={form.service === option.value} onChange={() => update("service", option.value)} /><span className={styles.cardCheck}>✓</span><strong>{option.label}</strong></label>)}</div><ErrorText message={errors.service} /></fieldset>}

      {step === 2 && <fieldset><legend>Tell us about your company</legend><div className={styles.fieldGrid}><Field label="Tourism company name" required error={errors.companyName}><input data-autofocus value={form.companyName} onChange={(event) => update("companyName", event.target.value)} autoComplete="organization" /></Field><Field label="Current website URL" hint="Optional" error={errors.websiteUrl}><input value={form.websiteUrl} onChange={(event) => update("websiteUrl", event.target.value)} inputMode="url" placeholder="https://" autoComplete="url" /></Field></div><OptionGroup title="What experiences do you offer?" options={EXPERIENCE_OPTIONS} values={form.experiences} onToggle={(value) => toggle("experiences", value)} error={errors.experiences} /><OptionGroup title="Where do your bookings currently come from?" options={BOOKING_SOURCE_OPTIONS} values={form.bookingSources} onToggle={(value) => toggle("bookingSources", value)} error={errors.bookingSources} /></fieldset>}

      {step === 3 && <fieldset><legend>What would you like to improve?</legend><OptionGroup title="What's your biggest challenge right now?" options={CHALLENGE_OPTIONS} values={form.challenge ? [form.challenge] : []} onToggle={(value) => update("challenge", value)} error={errors.challenge} single /><OptionGroup title="Which international markets interest you?" options={MARKET_OPTIONS} values={form.markets} onToggle={(value) => toggle("markets", value)} error={errors.markets} /><OptionGroup title="When are you planning to start?" options={TIMELINE_OPTIONS} values={form.startTimeline ? [form.startTimeline] : []} onToggle={(value) => update("startTimeline", value)} error={errors.startTimeline} single /><OptionGroup title={budget.title} note={budget.note} options={budget.options} values={form.budgetRange ? [form.budgetRange] : []} onToggle={(value) => update("budgetRange", value)} single optional /></fieldset>}

      {step === 4 && <fieldset><legend>Where should we send your recommendation?</legend><div className={styles.fieldGrid}><Field label="Full name" required error={errors.fullName}><input data-autofocus value={form.fullName} onChange={(event) => update("fullName", event.target.value)} autoComplete="name" /></Field><Field label="Business email" required error={errors.email}><input type="email" value={form.email} onChange={(event) => update("email", event.target.value)} autoComplete="email" inputMode="email" /></Field></div><Field label="WhatsApp number" hint="Include country code" required error={errors.whatsapp}><div className={styles.phoneField}><select value={form.countryCode} onChange={(event) => update("countryCode", event.target.value)} aria-label="Country code"><option>+255</option><option>+254</option><option>+256</option><option>+250</option><option>+1</option><option>+44</option><option>+49</option><option>+971</option></select><input type="tel" value={form.whatsapp} onChange={(event) => update("whatsapp", event.target.value)} placeholder="746 401 433" autoComplete="tel-national" inputMode="tel" /></div></Field><Field label="Additional information" hint="Optional"><textarea rows={5} value={form.additionalInformation} onChange={(event) => update("additionalInformation", event.target.value)} placeholder="Tell us anything else that would help us prepare." /></Field><label className={styles.consent}><input type="checkbox" checked={form.privacyConsent} onChange={(event) => update("privacyConsent", event.target.checked)} /><span>I agree that Safari Digital may use this information to review my inquiry and contact me about the requested services.</span></label><ErrorText message={errors.privacyConsent} /><div className={styles.honeypot} aria-hidden="true"><label>Company fax<input tabIndex={-1} autoComplete="off" value={form.companyFax} onChange={(event) => update("companyFax", event.target.value)} /></label></div>{submitError && <div className={styles.submitError} role="alert">{submitError}</div>}</fieldset>}

      <div className={styles.actions}>{step > 1 && <button type="button" className={styles.back} onClick={() => setStep((current) => current - 1)}>← Back</button>}{step < 4 ? <button type="button" className={styles.continue} onClick={continueForm}>Continue <span>→</span></button> : <button type="submit" className={styles.continue} disabled={submitting}>{submitting ? "Saving your inquiry…" : "Request My Free Consultation"}<span>{submitting ? "" : "→"}</span></button>}</div>
    </form>
    <p className={styles.security}>Your details are securely submitted and never sold. Prefer to talk first? <a href="https://wa.me/255746401433?text=Hi%20Safari%20Digital%2C%20I%20would%20like%20advice%20before%20submitting%20the%20form." target="_blank" rel="noreferrer">Contact us on WhatsApp</a>.</p>
  </section>;
}

function ErrorText({ message }: { message?: string }) { return message ? <p className={styles.error} role="alert">{message}</p> : null; }

function Field({ label, hint, required, error, children }: { label: string; hint?: string; required?: boolean; error?: string; children: React.ReactNode }) {
  return <label className={styles.field}><span>{label} {required && <b>*</b>} {hint && <small>{hint}</small>}</span>{children}<ErrorText message={error} /></label>;
}

function OptionGroup({ title, note, options, values, onToggle, error, single = false, optional = false }: { title: string; note?: string; options: readonly string[]; values: string[]; onToggle: (value: string) => void; error?: string; single?: boolean; optional?: boolean }) {
  return <div className={styles.optionGroup}><h2>{title} {optional && <small>Optional</small>}</h2>{note && <p>{note}</p>}<div className={styles.pills}>{options.map((option) => <label className={values.includes(option) ? styles.pillSelected : ""} key={option}><input type={single ? "radio" : "checkbox"} name={single ? title : undefined} checked={values.includes(option)} onChange={() => onToggle(option)} /><span>{values.includes(option) ? "✓" : "+"}</span>{option}</label>)}</div><ErrorText message={error} /></div>;
}
