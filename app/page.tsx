"use client";

import { useState } from "react";
import Image from "next/image";

const phone = "255746401433";
const wa = (message: string) => `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
const structuredData = {
  "@context": "https://schema.org",
  "@type": "ProfessionalService",
  name: "Safari Digital",
  url: "https://www.safaridigital.co.tz",
  telephone: "+255746401433",
  address: { "@type": "PostalAddress", addressLocality: "Dar es Salaam", addressCountry: "TZ" },
  areaServed: ["Tanzania", "Europe", "North America", "Middle East"],
  description: "Safari website design and Meta advertising for Tanzania tour operators."
};

const websitePackages = [
  { name: "Landing Page", slug: "landing-page", price: "$195", suffix: "one-time", intro: "A focused, fast page that turns attention into inquiries.", items: ["Single-page responsive website", "Tour or offer presentation", "WhatsApp and inquiry form", "Conversion-focused design", "Basic SEO", "Two revisions"] },
  { name: "Tour Operator Website", slug: "tour-operator-website", price: "$820", suffix: "one-time", popular: true, intro: "A complete safari website built for credibility and direct bookings.", items: ["Up to 6 main pages", "Up to 5 safari itineraries", "Mobile-responsive design", "Easy-to-use CMS", "Galleries and reviews", "Inquiry forms and WhatsApp", "SEO and speed optimization", "Meta Pixel and analytics setup", "Four revisions", "Website training"] },
  { name: "Advanced Website", slug: "advanced-website", price: "Custom", suffix: "pricing", intro: "A tailored platform for ambitious safari brands and complex operations.", items: ["Custom website design", "Advanced tour management", "Search, filtering & multilingual options", "Booking functionality", "CRM integrations", "Custom features and automations"] }
];

const marketingPackages = [
  { name: "Growth", slug: "growth", price: "$450", suffix: "/month", popular: true, intro: "Reach serious international safari travelers on Meta.", items: ["Facebook and Instagram Ads management", "International targeting strategy", "Campaign setup and optimization", "4 advertising creatives per month", "Ad copywriting", "Meta Pixel and conversion tracking", "Retargeting where applicable", "Monthly reporting"] },
  { name: "Scale", slug: "scale", price: "$750", suffix: "/month", intro: "Go further with smarter, cross-platform campaign testing.", items: ["Everything in Growth", "TikTok Ads management", "ChatGPT Ads where available and eligible", "8 advertising creatives per month total", "Advanced campaign testing", "Cross-platform optimization", "Landing page conversion recommendations", "Monthly strategy calls", "Detailed performance reports"] },
  { name: "Marketing Partner", slug: "marketing-partner", price: "Custom", suffix: "pricing", intro: "A strategic advertising partnership shaped around your growth goals.", items: ["Everything in Scale, plus customized services", "Multi-channel advertising", "Advanced advertising funnels", "CRM integrations", "WhatsApp and email automations", "Custom landing pages", "Advanced analytics", "Dedicated strategy and support"] }
];

const liveProjects = [
  { name: "Bathiel Expeditions", url: "https://bethleheli-website.vercel.app/", image: "/assets/bethleheli-project.png", description: "Kilimanjaro climbs and Tanzania journeys presented through a conversion-focused booking experience." },
  { name: "Chatama Safari", url: "https://www.chatamasafari.com/", image: "/assets/chatama-safari-project.png", description: "Tanzania safari experiences presented through a clear, direct enquiry journey." },
  { name: "BBM Safaris", url: "https://www.bbmsafaris.com/", image: "/assets/bbm-safaris-project.png", description: "Tailor-made Tanzania journeys across wildlife, Kilimanjaro and Zanzibar." },
  { name: "Golden Trips", url: "https://thegoldentrips.com/", image: "/assets/golden-trips-project.png", description: "Private Tanzania family safaris designed around every generation." },
  { name: "Serengeti Wild Tours", url: "https://www.serengetiwildtours.com/", image: "/assets/serengeti-wild-tours-project.png", description: "Private Tanzania safaris and Kilimanjaro climbs shaped around each traveler’s journey." }
];

const faq = [
  ["How quickly will I see results?", "Most agencies see new WhatsApp inquiries within 48 to 72 hours of ads going live."],
  ["I already have a Facebook page. Isn't that enough?", "A Facebook page is a social feed. A website is a trust machine. International travelers expect a professional website before they send money abroad."],
  ["What if I already get bookings through agents?", "Agents take 20–30% commission. Our system brings you direct bookings at full price — no middleman."],
  ["Do I manage the WhatsApp automation myself?", "No. We build it and run it. It handles standard questions and only brings you in when someone is ready to book."],
  ["Can I update my own packages and prices?", "Yes. It takes under 2 minutes and requires no technical knowledge."],
  ["Do you handle photography and video?", "Yes. We send a professional photographer and videographer to capture your safaris. Strong visuals are the single biggest factor in whether an international traveler trusts you."],
  ["What makes you different from a regular marketing agency?", "We work exclusively with tour operators in Tanzania. Every ad, every automation, every website is built for one goal — getting international travelers to book directly with you."]
];

function Brand({ light = false }: { light?: boolean }) { return <a className="brand" href="#top" aria-label="Safari Digital home"><Image src={light ? "/assets/safari-digital-light.svg" : "/assets/safari-digital-dark.svg"} alt="Safari Digital" width={244} height={39} priority={light} /></a>; }
function Button({ children, message = "", href, className = "" }: { children: React.ReactNode; message?: string; href?: string; className?: string }) { const external = !href; return <a className={`button ${className}`} href={href || wa(message)} target={external ? "_blank" : undefined} rel={external ? "noreferrer" : undefined}>{children} <span>→</span></a>; }

function StepIcon({ type }: { type: "target" | "website" | "automation" }) {
  if (type === "target") return <svg viewBox="0 0 64 64" aria-hidden="true"><path d="M11 11v34l10-10 9 18 7-4-9-18h14L11 11Z"/><circle cx="35" cy="30" r="4"/><path d="M39 8c9 2 16 9 17 18M40 17c5 1 9 5 10 10"/></svg>;
  if (type === "website") return <svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="29" cy="29" r="22"/><path d="M7 29h44M29 7c7 7 10 14 10 22s-3 15-10 22M29 7c-7 7-10 14-10 22s3 15 10 22M13 16h32M13 42h22M41 39l15 6-7 4-4 8-4-18Z"/></svg>;
  return <svg viewBox="0 0 64 64" aria-hidden="true"><path d="M24 8h16v8H24zM32 8V3M17 20h30a7 7 0 0 1 7 7v22a7 7 0 0 1-7 7H17a7 7 0 0 1-7-7V27a7 7 0 0 1 7-7Z"/><circle cx="23" cy="35" r="4"/><circle cx="41" cy="35" r="4"/><path d="M22 47h20M10 31H5v13h5M54 31h5v13h-5"/></svg>;
}

function ValueIcon({ type }: { type: "innovation" | "integrity" | "excellence" }) {
  if (type === "innovation") return <svg viewBox="0 0 96 96" aria-hidden="true"><path d="M42 20a28 28 0 1 0 0 56"/><path d="m25 18 5 7-7 7-8-4-5 10 8 4v10l-8 4 5 10 8-4 7 7-5 7 10 5 4-8"/><path d="M46 13v70M46 31h15l8-8M46 45h23l9-9M46 59h17l8 8M46 72h12l9 9"/><circle cx="72" cy="20" r="4"/><circle cx="81" cy="33" r="4"/><circle cx="74" cy="70" r="4"/><circle cx="70" cy="84" r="4"/></svg>;
  if (type === "integrity") return <svg viewBox="0 0 96 96" aria-hidden="true"><path d="M48 11c7 7 14 8 22 9v17c0 10-8 19-22 25-14-6-22-15-22-25V20c8-1 15-2 22-9Z"/><path d="m38 35 7 7 14-15"/><path d="m25 48-9-4-8 25 13 4 6-19 13 6 8 8c4 4 9-1 6-5l-8-9 8 7c5 4 10-2 6-6l-7-7"/><path d="m69 48 11-4 8 25-13 4-6-19-10 5"/><path d="m25 67 8 8c3 3 7 0 6-3 3 5 9 1 7-3 4 5 9 0 6-4"/></svg>;
  return <svg viewBox="0 0 96 96" aria-hidden="true"><path d="M48 9 58 14l11-1 4 10 9 7-4 11 2 11-10 6-5 10-11-1-6 6-7-6-11 1-5-10-10-6 2-11-4-11 9-7 4-10 11 1L48 9Z"/><circle cx="48" cy="38" r="18"/><path d="m48 25 4 8 9 1-6 6 2 9-9-4-9 4 2-9-6-6 9-1 4-8ZM31 62l-4 25 21-12 21 12-4-25"/></svg>;
}

function PriceCard({ item, kind }: { item: typeof websitePackages[number]; kind: "website" | "marketing" }) {
  return <article className={`price-card ${item.popular ? "is-popular" : ""}`}>
    {item.popular && <div className="popular">{kind === "website" ? "Most Popular" : "Recommended"}</div>}
    <h3>{item.name}</h3><div className="price">{item.price}<small> {item.suffix}</small></div>
    <p className="card-intro">{item.intro}</p>
    <ul>{item.items.map((entry) => <li key={entry}><span>✓</span>{entry}</li>)}</ul>
    <Button href={`/get-started?service=${kind}&package=${item.slug}`}>Choose {item.name}</Button>
  </article>;
}

export default function Home() {
  const [menu, setMenu] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  return <main id="top">
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
    <header className="nav"><Brand light /><button className="menu" onClick={() => setMenu(!menu)} aria-expanded={menu} aria-label="Toggle navigation">☰</button><nav className={menu ? "open" : ""}><a href="#services">Services</a><a href="#website-packages">Websites</a><a href="#marketing-packages">Marketing</a><a href="#projects">Projects</a><Button href="/get-started">Let&apos;s talk</Button></nav><a className="nav-phone" href={wa("Hi Safari Digital, I would like to discuss your services.")}>+255 746 401 433</a></header>

    <section className="hero section-dark">
      <div className="hero-copy"><p className="eyebrow">Marketing agency based in <span>🇹🇿 Tanzania</span></p><h1>International travelers are searching for safaris right now... <em>Are they finding you?</em></h1><p className="lead">Travelers in Europe, the US, and the Gulf are booking Tanzania safaris right now — spending $5,000–$15,000 per trip. We put your agency in front of them before they find your competitor.</p><Button href="/get-started?service=bookings">Get international bookings</Button></div>
      <div className="hero-art"><Image src="/assets/hero-booking-dashboard.webp" alt="Safari operator booking dashboard with Google Ads, Facebook, Instagram, WhatsApp and Gmail channels" width={1200} height={1101} priority sizes="(max-width: 900px) 100vw, 48vw" /></div>
    </section>

    <section className="truth section-light"><p className="eyebrow">The hard truth about selling tours in Tanzania in 2026</p><h2>International travelers judge your company by your website. If it doesn&apos;t impress them in 5 seconds, they book with your competitor.</h2><p className="intro">Before a traveler sends you a single dollar, they Google you. They look at your website. They read your reviews. And they decide in seconds whether you&apos;re trustworthy enough to handle their dream holiday.</p><p className="losses-title">Most Tanzanian tour agencies are losing that decision every week:</p><div className="problems"><div>✕ <span>Your website looks outdated — so travelers from London or Berlin click back and book with whoever looks more professional.</span></div><div>✕ <span>You&apos;re relying on brokers who take 20–30% commission because international clients can&apos;t find you directly.</span></div><div>✕ <span>Inquiries go cold because there&apos;s no follow-up system — the traveler moves on and books elsewhere.</span></div><div>✕ <span>A traveler messages you at midnight their time. You reply 8 hours later. They&apos;re already gone.</span></div></div></section>

    <section className="story section-light"><div className="map-art"><Image src="/assets/tanzania-search.webp" alt="Map of Tanzania filled with safari, wildlife and Zanzibar travel photography" width={1200} height={1113} sizes="(max-width: 900px) 100vw, 44vw" /></div><div><p><strong><em>Picture this:</em></strong> A couple in Amsterdam has €9,000 saved for their dream Tanzania safari. They spend one evening researching operators online. They find two companies with similar routes. One has a stunning website — fast, beautiful, with real reviews and a WhatsApp reply within the hour.</p><p><em>The other is slow, has blurry photos, and takes two days to respond. The deposit goes to the first company before the second one even replies. <strong>That first company could be you.</strong></em></p><strong className="mint">Don&apos;t worry, we can help!</strong></div></section>

    <section id="services" className="steps section-light"><p className="eyebrow">Our 3-step process</p><h2>3 Step Process To Fill Your Booking Calendar With International Clients</h2><div className="step-grid"><article><div className="step-icon"><StepIcon type="target" /></div><h3>Find Travelers Ready to Book</h3><p>Targeted ads on Facebook and Instagram reaching serious travelers in Europe, America, and the Gulf.</p></article><article><div className="step-icon"><StepIcon type="website" /></div><h3>Your Website Does the Selling</h3><p>Stunning itineraries, photos, and reviews that turn curious visitors into confirmed bookings.</p></article><article><div className="step-icon"><StepIcon type="automation" /></div><h3>Automation Closes the Gaps</h3><p>Every inquiry gets followed up automatically via WhatsApp — while you focus on the safari.</p></article></div></section>

    <section className="feature website-feature section-dark"><div><p className="eyebrow">Your website is the reason a traveler books with you — or doesn&apos;t.</p><h2>A Website That Wins International Bookings</h2><div className="feature-copy"><p>International travelers won&apos;t book what they can&apos;t trust online. A professional website isn&apos;t a nice-to-have — it&apos;s the cost of competing in this market.</p><p>We build mobile-first safari websites that load fast anywhere in the world — stunning, credible, and built to make international travelers reach out.</p><p>Built to showcase your packages with high-res photo galleries, day-by-day itineraries, and a “Request Your Custom Safari” button on every page.</p><p>Every page guides the visitor toward one action — contacting you directly, not searching for another operator.</p></div><Button href="/get-started?service=website">Get direct international bookings</Button></div><div className="device-art"><Image src="/assets/safari-website-mockup.webp" alt="Responsive Safari Expert tour operator website shown on a laptop and mobile phone" width={1200} height={1035} sizes="(max-width: 900px) 100vw, 48vw" /></div></section>

    <section className="feature reverse section-light"><div className="automation-art"><Image src="/assets/whatsapp-automation.webp" alt="WhatsApp follow-up automation for a Tanzania safari inquiry" width={1200} height={1308} sizes="(max-width: 900px) 100vw, 46vw" /></div><div><p className="eyebrow">WhatsApp &amp; email automation</p><h2><em>Automation</em> That Follows Up So You Never Lose a Lead Again</h2><div className="feature-copy"><p>Most bookings don&apos;t happen on first contact. A traveler inquires, life gets busy, they forget — and three weeks later they book with whoever followed up.</p><p>The moment someone inquires — at any hour, in any timezone — they get an instant, warm WhatsApp reply that answers their questions and makes them feel looked after.</p><p>If they don&apos;t book immediately, the system follows up automatically over the coming days with itineraries, guest reviews, and gentle availability reminders — keeping your tours top of mind.</p><p>You only step in when the conversation is serious. The system does the rest.</p></div><Button href="/get-started?service=automation">Get direct international bookings</Button></div></section>

    <section className="feature ads section-dark"><div><p className="eyebrow">Facebook &amp; Instagram Ads</p><h2>Ads That Put You in Front of Travelers Who Are Ready to Book</h2><div className="feature-copy"><p>Stop waiting for the right traveler to stumble across you. We go and find them — in Europe, America, and the Arab world.</p><p>We run precision-targeted campaigns on Facebook and Instagram that reach the exact type of traveler you want.</p><p>We target by travel intent, income level, and destination interest — so your ad budget is focused on people who are genuinely planning a Tanzania trip, not just scrolling.</p><p>Travelers who visit your website but don&apos;t inquire yet can be retargeted across Facebook and Instagram with your tours and reviews — until they come back and reach out.</p></div><Button href="/get-started?service=marketing">Get international bookings</Button></div><div className="ads-art"><Image src="/assets/meta-ads-safari.webp" alt="Digital advertising channels connecting international travelers to a Tanzania safari" width={1200} height={1379} sizes="(max-width: 900px) 100vw, 48vw" /></div></section>

    <section id="website-packages" className="pricing section-light"><p className="eyebrow">Website development</p><h2>Safari websites built to win trust</h2><p className="intro">One-time website investment. Hosting, domain registration and third-party services are separate.</p><div className="pricing-grid">{websitePackages.map((item) => <PriceCard key={item.name} item={item} kind="website" />)}</div></section>
    <section id="marketing-packages" className="pricing section-light marketing"><p className="eyebrow">Digital marketing</p><h2>Fill your calendar with better-fit inquiries</h2><p className="intro">Monthly campaign management. Advertising budgets and platform charges are separate.</p><div className="pricing-grid">{marketingPackages.map((item) => <PriceCard key={item.name} item={item} kind="marketing" />)}</div></section>

    <section id="projects" className="projects section-light">
      <p className="eyebrow">Selected website projects</p>
      <h2>Safari Websites That Turn Interest Into Bookings</h2>
      <p className="intro">A polished online experience gives international travelers the confidence to enquire directly.</p>
      <div className="project-list">{liveProjects.map((project) => <article className="project-card project-card-live" key={project.url}><div className="project-visual project-screenshot"><Image src={project.image} alt={`${project.name} website homepage`} width={1440} height={1000} sizes="(max-width: 900px) 100vw, 55vw" /></div><div className="project-details"><p className="project-type">Tour operator website</p><h3>{project.name}</h3><p>{project.description}</p><div className="project-tags"><span>Responsive design</span><span>Direct enquiries</span><span>Live project</span></div><a className="project-link" href={project.url} target="_blank" rel="noreferrer">View live website <span>↗</span></a></div></article>)}</div>
      <Button href="/get-started?service=website">Start your website project</Button>
    </section>

    <section className="global section-light" aria-label="International reach">
      <div>
        <p className="eyebrow">Built for international reach</p>
        <h2>Your safari business, presented to the world.</h2>
        <p>Fast pages, clear offers, accurate tracking and campaigns designed around the international travelers you want to reach.</p>
        <Button href="/get-started?service=complete">Get international bookings</Button>
      </div>
      <Image src="/assets/global-reach.webp" alt="Global network centered on Europe and Africa" width={1200} height={765} sizes="(max-width: 900px) 100vw, 55vw" />
    </section>

    <section id="faq" className="faq section-dark"><p className="eyebrow">Still not sure?</p><h2>Frequently Asked Questions</h2><div className="faq-list">{faq.map(([question, answer], index) => <article key={question}><button onClick={() => setOpenFaq(openFaq === index ? null : index)} aria-expanded={openFaq === index}>{question}<span>{openFaq === index ? "−" : "+"}</span></button>{openFaq === index && <p>{answer}</p>}</article>)}</div><p className="contact-line">If you have additional questions you can contact us on <a href={wa("Hi Safari Digital, I have a question about your services.")}>+255 746 401 433</a></p><Button href="/get-started?service=bookings">Get more international bookings</Button></section>
    <section className="values-strip section-dark"><article><div className="value-icon"><ValueIcon type="innovation" /></div><h3>Innovation</h3><p>Smart systems built for the Tanzanian travel market.</p></article><article><div className="value-icon"><ValueIcon type="integrity" /></div><h3>Integrity</h3><p>Real leads, honest reporting, transparent results.</p></article><article><div className="value-icon"><ValueIcon type="excellence" /></div><h3>Excellence</h3><p>Online presences that make your agency look world-class from Dar es Salaam to Düsseldorf.</p></article></section>
    <footer><div className="footer-top"><Brand /><div className="footer-column"><h3>Services</h3><a href="#services">About us</a><a href="#services">Our team</a><a href="#services">Our location</a><a href="#services">Our partners</a></div><div className="footer-column"><h3>Packages</h3><a href={wa("Hi Safari Digital, I would like to contact you.")}>Contact us</a><a href="#faq">Support</a><a href="#marketing-packages">Marketing packages</a></div><div className="footer-column"><h3>Legal</h3><span>Terms of use</span><span>Privacy policy</span><span>Warranty</span></div></div><p className="copyright">Copyright {new Date().getFullYear()}. Safari Digital Ltd. Dar es Salaam, Tanzania. All Rights Reserved.</p></footer>
  </main>;
}
