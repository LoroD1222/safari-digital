import type { Metadata } from "next";
import { isAdminAuthenticated, isAdminConfigured } from "../../lib/admin-auth.server";
import { listAdminInquiries, isPersistenceConfigured, type InquiryRecord } from "../../lib/inquiries.server";
import { INQUIRY_STATUSES, PACKAGE_OPTIONS, SERVICE_OPTIONS, STATUS_DETAILS, getServiceLabel } from "../../lib/inquiry-config";
import styles from "./admin.module.css";

export const metadata: Metadata = { title: "Inquiry Admin | Safari Digital", robots: { index: false, follow: false, noarchive: true } };
export const dynamic = "force-dynamic";

export default async function AdminPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const configured = isAdminConfigured() && isPersistenceConfigured();
  const authenticated = configured && await isAdminAuthenticated();
  if (!configured) return <main className={styles.login}><div><p>Safari Digital admin</p><h1>Configuration required</h1><span>Set the Supabase and admin authentication environment variables before using this protected dashboard.</span></div></main>;
  if (!authenticated) return <main className={styles.login}><form action="/api/admin/session" method="post"><p>Protected area</p><h1>Inquiry Admin</h1><label>Admin password<input type="password" name="password" autoComplete="current-password" autoFocus required /></label>{params.error && <span className={styles.error}>The password was not accepted.</span>}<button type="submit">Sign in securely</button></form></main>;

  let inquiries: InquiryRecord[] = [];
  let loadError = "";
  try { inquiries = await listAdminInquiries(); } catch (error) { console.error("Admin inquiries failed", error); loadError = "Inquiries could not be loaded."; }
  const serviceFilter = typeof params.service === "string" ? params.service : "";
  const packageFilter = typeof params.package === "string" ? params.package : "";
  const filtered = inquiries.filter((inquiry) => (!serviceFilter || inquiry.service === serviceFilter) && (!packageFilter || inquiry.package_name === packageFilter));

  return <main className={styles.page}>
    <header><div><p>Safari Digital</p><h1>Inquiry Dashboard</h1></div><form action="/api/admin/session" method="post"><input type="hidden" name="action" value="logout" /><button>Sign out</button></form></header>
    <section className={styles.summary}><div><span>Incoming inquiries</span><strong>{inquiries.length}</strong></div>{INQUIRY_STATUSES.map((status) => <div key={status}><span>{STATUS_DETAILS[status].title}</span><strong>{inquiries.filter((inquiry) => inquiry.status === status).length}</strong></div>)}</section>
    <form className={styles.filters} method="get"><label>Service<select name="service" defaultValue={serviceFilter}><option value="">All services</option>{SERVICE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label><label>Package<select name="package" defaultValue={packageFilter}><option value="">All packages</option>{Object.entries(PACKAGE_OPTIONS).map(([value, option]) => <option value={value} key={value}>{option.label}</option>)}</select></label><button>Apply filters</button><a href="/admin">Reset</a></form>
    {params.updated && <div className={styles.notice}>Inquiry status was updated.</div>}{params.error === "update" && <div className={styles.error}>The inquiry could not be updated.</div>}{loadError && <div className={styles.error}>{loadError}</div>}
    <section className={styles.list}>{filtered.length ? filtered.map((inquiry) => <InquiryCard inquiry={inquiry} key={inquiry.id} />) : <p className={styles.empty}>No inquiries match these filters.</p>}</section>
  </main>;
}

function InquiryCard({ inquiry }: { inquiry: InquiryRecord }) {
  const history = [...(inquiry.inquiry_status_history || [])].sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));
  const notes = [...(inquiry.inquiry_notes || [])].sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));
  return <details className={styles.card}><summary><div><span>{inquiry.reference}</span><h2>{inquiry.company_name}</h2><p>{inquiry.full_name} · {inquiry.email}</p></div><div className={styles.status}>{STATUS_DETAILS[inquiry.status]?.title || inquiry.status}<small>{new Date(inquiry.created_at).toLocaleDateString("en-GB", { timeZone: "Africa/Dar_es_Salaam" })}</small></div></summary><div className={styles.details}><div className={styles.answers}><Info label="WhatsApp" value={inquiry.whatsapp} /><Info label="Website" value={inquiry.website_url} /><Info label="Service" value={`${getServiceLabel(inquiry.service)}${inquiry.package_label ? ` — ${inquiry.package_label}` : ""}`} /><Info label="Experiences" value={inquiry.experiences?.join(", ")} /><Info label="Booking sources" value={inquiry.booking_sources?.join(", ")} /><Info label="Biggest challenge" value={inquiry.challenge} /><Info label="Markets" value={inquiry.markets?.join(", ")} /><Info label="Timeline" value={inquiry.start_timeline} /><Info label="Budget" value={inquiry.budget_range} /><Info label="Additional information" value={inquiry.additional_information} /><Info label="Source" value={`${inquiry.source}${Object.keys(inquiry.utm || {}).length ? ` · ${JSON.stringify(inquiry.utm)}` : ""}`} /></div><form className={styles.update} action={`/api/admin/inquiries/${inquiry.id}`} method="post"><h3>Update progress</h3><label>Status<select name="status" defaultValue={inquiry.status}>{INQUIRY_STATUSES.map((status) => <option value={status} key={status}>{STATUS_DETAILS[status].title}</option>)}</select></label><label>Internal note<textarea name="note" rows={4} maxLength={2000} placeholder="Optional note — never shown to the client" /></label><button>Save update</button></form><div className={styles.history}><div><h3>Status history</h3>{history.map((entry) => <p key={String(entry.id)}><strong>{STATUS_DETAILS[String(entry.to_status) as keyof typeof STATUS_DETAILS]?.title || String(entry.to_status)}</strong><span>{new Date(String(entry.created_at)).toLocaleString("en-GB", { timeZone: "Africa/Dar_es_Salaam" })}</span></p>)}</div><div><h3>Internal notes</h3>{notes.length ? notes.map((note) => <p key={String(note.id)}>{String(note.note)}<span>{new Date(String(note.created_at)).toLocaleString("en-GB", { timeZone: "Africa/Dar_es_Salaam" })}</span></p>) : <p>No internal notes yet.</p>}</div></div></div></details>;
}

function Info({ label, value }: { label: string; value?: string | null }) { return <div><span>{label}</span><p>{value || "—"}</p></div>; }
