import type { Metadata } from "next";
import PortalHeader from "../../components/PortalHeader";
import { getValidatedSelection } from "../../lib/inquiry-config";
import QualificationForm from "./QualificationForm";
import styles from "./get-started.module.css";

export const metadata: Metadata = {
  title: "Get Started | Safari Digital",
  description: "Tell Safari Digital about your tourism business and discover the right website, advertising, or automation solution.",
  alternates: { canonical: "/get-started" }
};

export default async function GetStartedPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const selection = getValidatedSelection(params.service, params.package);
  return <main className={styles.page}>
    <PortalHeader />
    <section className={styles.intro}>
      <p>Free strategy consultation</p>
      <h1>Let&apos;s Grow Your Tourism Business</h1>
      <span>Tell us a little about your agency and we&apos;ll help you find the right solution.</span>
    </section>
    <QualificationForm initialService={selection.service} packageName={selection.packageName} packageLabel={selection.packageLabel} />
  </main>;
}
