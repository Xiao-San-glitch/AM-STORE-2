import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy policy",
  description: "How AM STORE collects, uses and protects the information you share when placing a grocery order.",
};

const SECTIONS = [
  {
    title: "What we collect",
    body: [
      "When you place an order we collect your name, mobile number, and — for delivery — your address, locality and PIN code. An email address and order notes are optional.",
      "We do not create customer accounts, and we do not ask for card, UPI or net-banking details. Payments are made in cash on delivery or at the store counter.",
    ],
  },
  {
    title: "Why we use it",
    body: [
      "Your details are used only to pack, confirm, deliver or hand over your order, and to contact you if something is unavailable or needs substituting.",
      "Order records are kept so the store can handle repeat orders, resolve disputes and report basic sales totals.",
    ],
  },
  {
    title: "Who can see it",
    body: [
      "Only store staff who need the information to fulfil your order can see it.",
      "We do not sell, rent or trade customer information. We do not send marketing messages unless you ask us to.",
      "If you choose to send your order summary through WhatsApp, that message is handled under WhatsApp's own privacy terms.",
    ],
  },
  {
    title: "Your choices",
    body: [
      "You can ask us to correct or delete the contact details we hold for you by calling or messaging the store.",
      "You can also ask us not to contact you on WhatsApp and to use a phone call instead.",
    ],
  },
  {
    title: "Cookies and local storage",
    body: [
      "Your basket is stored in your own browser so it survives a refresh. We use no advertising or tracking cookies on this site.",
      "Administrator sign-in uses a secure, http-only session cookie that expires after twelve hours.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <div className="shell max-w-3xl py-10 sm:py-14">
      <p className="eyebrow">Legal</p>
      <h1 className="mt-2 text-3xl sm:text-4xl">Privacy policy</h1>
      <p className="mt-2 text-sm text-muted">Last updated: 8 November 2026</p>

      <div className="mt-8 space-y-8">
        {SECTIONS.map((section) => (
          <section key={section.title}>
            <h2 className="text-xl">{section.title}</h2>
            {section.body.map((paragraph) => (
              <p key={paragraph} className="mt-2.5 text-sm leading-relaxed text-charcoal/75">
                {paragraph}
              </p>
            ))}
          </section>
        ))}

        <section className="rounded-2xl border border-line bg-white p-5">
          <h2 className="text-base">Questions about your data?</h2>
          <p className="mt-2 text-sm leading-relaxed text-charcoal/75">
            Contact AM STORE, Longleng, Nagaland — the phone and WhatsApp numbers on the contact page reach the store
            counter directly.
          </p>
        </section>
      </div>
    </div>
  );
}
