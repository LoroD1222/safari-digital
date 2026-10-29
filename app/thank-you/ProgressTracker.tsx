"use client";

import { useEffect, useState } from "react";
import { INQUIRY_STATUSES, STATUS_DETAILS, isStatus, type InquiryStatus } from "../../lib/inquiry-config";
import styles from "./thank-you.module.css";

declare global { interface Window { fbq?: (...args: unknown[]) => void; dataLayer?: unknown[]; } }

export default function ProgressTracker({ token, initialStatus, initialUpdatedAt, reference }: { token: string; initialStatus: InquiryStatus; initialUpdatedAt: string; reference: string }) {
  const [status, setStatus] = useState(initialStatus);
  const [updatedAt, setUpdatedAt] = useState(initialUpdatedAt);
  const currentIndex = INQUIRY_STATUSES.indexOf(status);

  useEffect(() => {
    const pendingRaw = sessionStorage.getItem("safari-digital-pending-lead");
    if (pendingRaw) {
      try {
        const pending = JSON.parse(pendingRaw) as { token?: string; eventId?: string };
        if (pending.token === token && pending.eventId) {
          const marker = `safari-digital-lead-${pending.eventId}`;
          let attempts = 0;
          const fire = () => {
            attempts += 1;
            if (localStorage.getItem(marker)) return sessionStorage.removeItem("safari-digital-pending-lead");
            if (typeof window.fbq === "function") {
              window.fbq("track", "Lead", {}, { eventID: pending.eventId });
              localStorage.setItem(marker, "1");
              sessionStorage.removeItem("safari-digital-pending-lead");
            } else if (attempts < 8) window.setTimeout(fire, 750);
          };
          fire();
        }
      } catch { sessionStorage.removeItem("safari-digital-pending-lead"); }
    }
  }, [token]);

  useEffect(() => {
    let active = true;
    const refresh = async () => {
      try {
        const response = await fetch(`/api/inquiries/status?token=${encodeURIComponent(token)}`, { cache: "no-store" });
        if (!response.ok) return;
        const result = await response.json();
        if (active && isStatus(result.status)) {
          setStatus(result.status);
          setUpdatedAt(result.updatedAt);
        }
      } catch { /* The last verified status remains visible. */ }
    };
    refresh();
    const interval = window.setInterval(refresh, 30_000);
    return () => { active = false; window.clearInterval(interval); };
  }, [token]);

  const progress = STATUS_DETAILS[status].progress;
  return <section className={styles.tracker} aria-live="polite">
    <div className={styles.trackerHead}><div><p>Project progress</p><h2>{progress}% complete</h2></div><div><span>Current stage</span><strong>{STATUS_DETAILS[status].title}</strong></div></div>
    <div className={styles.bar} aria-label={`${progress}% complete`}><span style={{ width: `${progress}%` }} /></div>
    <ol className={styles.timeline}>{INQUIRY_STATUSES.map((stage, index) => {
      const complete = index <= currentIndex;
      const current = index === currentIndex;
      return <li className={`${complete ? styles.complete : ""} ${current ? styles.current : ""}`} key={stage}><div className={styles.circle}>{complete ? "✓" : index + 1}</div><div><span>Stage {index + 1}</span><h3>{STATUS_DETAILS[stage].title}</h3><p>{STATUS_DETAILS[stage].description}</p></div></li>;
    })}</ol>
    <footer><span>Reference: {reference}</span><span>Last updated: {new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Dar_es_Salaam" }).format(new Date(updatedAt))}</span></footer>
  </section>;
}
