import type { Metadata } from "next";
import { Clock, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { ContactForm } from "@/components/contact/contact-form";
import { getSettings } from "@/lib/db";
import { defaultSettings } from "@/lib/seed-data";
import { buildWhatsAppContactUrl } from "@/lib/whatsapp";
import { formatPhone } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Call, WhatsApp or visit AM STORE in Longleng, Nagaland for grocery orders, delivery questions and stock enquiries.",
};

export default async function ContactPage() {
  const settings = await getSettings().catch(() => defaultSettings);
  const whatsappUrl = buildWhatsAppContactUrl(
    settings,
    `Hello ${settings.store_name}, I would like to ask about an order.`,
  );

  return (
    <div className="shell py-10 sm:py-14">
      <p className="eyebrow">Contact</p>
      <h1 className="mt-2 text-3xl sm:text-4xl">Talk to the counter</h1>
      <p className="mt-2 max-w-xl text-sm text-charcoal/70">
        Questions about stock, delivery timing or an order you already placed? Call the store, or send a message on
        WhatsApp and we will reply during opening hours.
      </p>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_1fr] lg:items-start">
        <div className="space-y-4">
          <div className="rounded-2xl border border-line bg-white p-5">
            <h2 className="text-lg">Store details</h2>
            <ul className="mt-4 space-y-4 text-sm">
              <li className="flex gap-3">
                <MapPin className="mt-0.5 size-4 shrink-0 text-gold-deep" />
                <div>
                  <p className="font-medium text-ink">Address</p>
                  <p className="mt-0.5 text-charcoal/70">
                    {settings.address}
                    <br />
                    Longleng, Nagaland — {settings.pin_code}
                  </p>
                </div>
              </li>
              <li className="flex gap-3">
                <Phone className="mt-0.5 size-4 shrink-0 text-gold-deep" />
                <div>
                  <p className="font-medium text-ink">Phone</p>
                  <a
                    href={`tel:${settings.phone.replace(/\s/g, "")}`}
                    className="mt-0.5 block text-charcoal/70 transition hover:text-gold-deep"
                  >
                    {formatPhone(settings.phone)}
                  </a>
                </div>
              </li>
              <li className="flex gap-3">
                <MessageCircle className="mt-0.5 size-4 shrink-0 text-gold-deep" />
                <div>
                  <p className="font-medium text-ink">WhatsApp</p>
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-0.5 block text-charcoal/70 transition hover:text-gold-deep"
                  >
                    {formatPhone(settings.whatsapp)}
                  </a>
                </div>
              </li>
              {settings.email ? (
                <li className="flex gap-3">
                  <Mail className="mt-0.5 size-4 shrink-0 text-gold-deep" />
                  <div>
                    <p className="font-medium text-ink">Email</p>
                    <a
                      href={`mailto:${settings.email}`}
                      className="mt-0.5 block break-all text-charcoal/70 transition hover:text-gold-deep"
                    >
                      {settings.email}
                    </a>
                  </div>
                </li>
              ) : null}
              <li className="flex gap-3">
                <Clock className="mt-0.5 size-4 shrink-0 text-gold-deep" />
                <div>
                  <p className="font-medium text-ink">Opening hours</p>
                  <p className="mt-0.5 text-charcoal/70">{settings.opening_hours}</p>
                </div>
              </li>
            </ul>

            <div className="mt-5 flex flex-col gap-2 sm:flex-row">
              <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="btn btn-gold flex-1">
                <MessageCircle className="size-4" /> WhatsApp us
              </a>
              <a
                href={`tel:${settings.phone.replace(/\s/g, "")}`}
                className="btn btn-outline flex-1"
              >
                <Phone className="size-4" /> Call store
              </a>
            </div>
          </div>

          <div className="rounded-2xl border border-line bg-warm p-5">
            <h2 className="text-base">Delivery area</h2>
            <p className="mt-2 text-xs leading-relaxed text-charcoal/70">
              {settings.delivery_areas}
            </p>
            <p className="mt-2 text-xs text-muted">
              Delivery is free on orders above ₹{settings.free_delivery_threshold}; otherwise ₹
              {settings.delivery_charge} is added at checkout.
            </p>
          </div>
        </div>

        <ContactForm settings={settings} />
      </div>
    </div>
  );
}
