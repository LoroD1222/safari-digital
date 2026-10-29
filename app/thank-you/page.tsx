import type { Metadata } from "next";
import Link from "next/link";
import PortalHeader from "../../components/PortalHeader";
import { getInquiryByTrackingToken, isPersistenceConfigured } from "../../lib/inquiries.server";
import { isStatus } from "../../lib/inquiry-config";
import ProgressTracker from "./ProgressTracker";
import styles from "./thank-you.module.css";

export const metadata: Metadata = {
  title: "Inquiry Status | Safari Digital",
  description: "Securely view the status of your Safari Digital inquiry.",
  robots: { index: false, follow: false, noarchive: true }
};

export const dynamic = "force-dynamic";

export default async function ThankYouPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const token = typeof params.token === "string" ? params.token : "";
  let inquiry: Awaited<ReturnType<typeof getInquiryByTrackingToken>> = null;
  if (token && isPersistenceConfigured()) {
    try { inquiry = await getInquiryByTrackingToken(token); } catch (error) { console.error("Thank-you inquiry lookup failed", error); }
  }

  if (!inquiry || !isStatus(inquiry.status)) return <main className={styles.page}><PortalHeader /><section className={styles.unverified}><p>Secure inquiry tracking</p><h1>We couldn&apos;t verify this inquiry</h1><span>A successful confirmation is only available after your inquiry has been securely saved. Please return to the form or contact us for help.</span><div><Link href="/get-started">Return to the form</Link><a href="https://wa.me/255746401433?text=Hi%20Safari%20Digital%2C%20I%20need%20help%20with%20my%20inquiry." target="_blank" rel="noreferrer">Contact us on WhatsApp</a></div></section></main>;

  return <main className={styles.page}>
    <PortalHeader />
    <section className={styles.hero}>
      <div className={styles.successIcon}>✓</div>
      <p>Inquiry reference: <strong>{inquiry.reference}</strong></p>
      <h1>Your Inquiry Has Been Received!</h1>
      <span>Thank you for reaching out to Safari Digital. We&apos;re excited to learn more about <strong>{inquiry.company_name}</strong>.</span>
    </section>
    <ProgressTracker token={token} initialStatus={inquiry.status} initialUpdatedAt={inquiry.status_updated_at} reference={inquiry.reference} />
    <section className={styles.next}>
      <div><p>What happens next?</p><h2>We&apos;ll review your business before the consultation.</h2><span>Our team will study your goals and requirements, then contact you using the details you provided. Keep your inquiry reference handy if you contact us first.</span></div>
      <div className={styles.actions}><a className={styles.whatsapp} href="https://wa.me/255746401433?text=Hi%20Safari%20Digital%2C%20I%20recently%20submitted%20an%20inquiry." target="_blank" rel="noreferrer">Contact Us on WhatsApp ↗</a><Link href="/">Back to Homepage</Link></div>
    </section>
  </main>;
}
