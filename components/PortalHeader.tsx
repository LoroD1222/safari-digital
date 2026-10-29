import Image from "next/image";
import Link from "next/link";
import styles from "./PortalHeader.module.css";

const whatsapp = "https://wa.me/255746401433?text=Hi%20Safari%20Digital%2C%20I%20have%20a%20question.";

export default function PortalHeader({ compact = false }: { compact?: boolean }) {
  return <header className={`${styles.header} ${compact ? styles.compact : ""}`}>
    <Link href="/" aria-label="Safari Digital home"><Image src="/assets/safari-digital-light.svg" alt="Safari Digital" width={244} height={39} priority /></Link>
    <a href={whatsapp} target="_blank" rel="noreferrer">WhatsApp support <span>↗</span></a>
  </header>;
}
