import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms & conditions",
  description: "The terms that apply when you order groceries from AM STORE in Longleng, Nagaland.",
};

const SECTIONS = [
  {
    title: "Orders",
    body: [
      "Placing an order through this site sends your basket to the store for confirmation. An order is confirmed only after store staff check stock and accept it; you will be contacted on the number you provide.",
      "If an item is unavailable we will offer a substitute of equal or greater value or remove it from the bill. You are never charged for an item you did not receive.",
    ],
  },
  {
    title: "Prices and availability",
    body: [
      "Prices are shown in Indian Rupees and include applicable taxes. Prices and pack sizes may change with supplier rates; the price confirmed by the store at the time of packing applies.",
      "Product photographs are representative. Packaging may change between batches from the same brand.",
    ],
  },
  {
    title: "Delivery and pickup",
    body: [
      "Delivery is available within the areas listed on the contact page. Delivery charges, free-delivery thresholds and minimum order values are shown at checkout before you place the order.",
      "Pickup orders are held at the store counter during opening hours. Please collect within two days; after that we may return perishable items to stock.",
    ],
  },
  {
    title: "Payment",
    body: [
      "Orders are paid in cash on delivery or at the store for pickup orders. No card details are collected by this website.",
      "If you do not accept a delivery, the store may decline future cash-on-delivery orders from the same number.",
    ],
  },
  {
    title: "Returns and replacements",
    body: [
      "Check your items on delivery. Damaged, leaking, expired or incorrect items can be returned to the delivery person or the counter for replacement or a refund.",
      "For hygiene reasons, opened food and personal-care products cannot be returned unless they are faulty.",
    ],
  },
  {
    title: "Using this website",
    body: [
      "Please provide accurate contact and address details. We may cancel an order if we cannot reach you or verify the delivery address.",
      "Product names and logos belong to their respective brands. Store text and imagery may not be reused without permission.",
    ],
  },
];

export default function TermsPage() {
  return (
    <div className="shell max-w-3xl py-10 sm:py-14">
      <p className="eyebrow">Legal</p>
      <h1 className="mt-2 text-3xl sm:text-4xl">Terms &amp; conditions</h1>
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
      </div>
    </div>
  );
}
