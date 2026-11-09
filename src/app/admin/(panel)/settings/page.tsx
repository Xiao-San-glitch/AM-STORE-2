import type { Metadata } from "next";
import { CheckCircle2 } from "lucide-react";
import { saveSettings } from "@/app/admin/actions";
import { dbMode, getSettings } from "@/lib/db";
import { defaultSettings } from "@/lib/seed-data";

export const metadata: Metadata = { title: "Store settings" };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function AdminSettingsPage({ searchParams }: Props) {
  const params = await searchParams;
  const saved = (Array.isArray(params.saved) ? params.saved[0] : params.saved) === "1";
  const error = Array.isArray(params.error) ? params.error[0] : params.error;

  const [settings, mode] = await Promise.all([
    getSettings().catch(() => defaultSettings),
    dbMode().catch(() => "local" as const),
  ]);

  return (
    <div>
      <div>
        <p className="eyebrow">Configuration</p>
        <h1 className="mt-2 text-2xl sm:text-3xl">Store settings</h1>
        <p className="mt-1.5 text-sm text-muted">
          These values drive the storefront header, footer, delivery charges and checkout rules.
        </p>
      </div>

      {saved ? (
        <p className="mt-4 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm text-emerald-800">
          <CheckCircle2 className="size-4" /> Settings saved and the storefront has been updated.
        </p>
      ) : null}
      {error ? (
        <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm text-rose-800">{error}</p>
      ) : null}

      <p className="mt-4 rounded-xl border border-line bg-white px-4 py-2.5 text-xs text-muted">
        Storage: <span className="font-semibold text-charcoal">{mode === "supabase" ? "Supabase" : "local SQLite"}</span>
        {mode === "local"
          ? " — data lives in .data/am-store.db on this machine. Set Supabase environment variables to switch."
          : " — changes are written to your Supabase project."}
      </p>

      <form action={saveSettings} className="mt-5 space-y-4">
        <section className="rounded-2xl border border-line bg-white p-5">
          <h2 className="text-base">Store identity</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="store_name" className="label">
                Store name
              </label>
              <input id="store_name" name="store_name" defaultValue={settings.store_name} className="input" />
            </div>
            <div>
              <label htmlFor="logo_url" className="label">
                Logo URL
              </label>
              <input
                id="logo_url"
                name="logo_url"
                defaultValue={settings.logo_url ?? ""}
                className="input"
                placeholder="Leave blank for the text logo"
              />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="tagline" className="label">
                Tagline
              </label>
              <input id="tagline" name="tagline" defaultValue={settings.tagline} className="input" />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="announcement" className="label">
                Announcement bar
              </label>
              <input id="announcement" name="announcement" defaultValue={settings.announcement} className="input" />
              <p className="mt-1 text-[0.6875rem] text-muted">Shown in the thin strip above the header.</p>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-line bg-white p-5">
          <h2 className="text-base">Contact &amp; location</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="phone" className="label">
                Phone
              </label>
              <input id="phone" name="phone" defaultValue={settings.phone} className="input" />
            </div>
            <div>
              <label htmlFor="whatsapp" className="label">
                WhatsApp number
              </label>
              <input id="whatsapp" name="whatsapp" defaultValue={settings.whatsapp} className="input" />
              <p className="mt-1 text-[0.6875rem] text-muted">Include the country code, e.g. 919876543210.</p>
            </div>
            <div>
              <label htmlFor="email" className="label">
                Email
              </label>
              <input id="email" name="email" type="email" defaultValue={settings.email ?? ""} className="input" />
            </div>
            <div>
              <label htmlFor="opening_hours" className="label">
                Opening hours
              </label>
              <input id="opening_hours" name="opening_hours" defaultValue={settings.opening_hours} className="input" />
            </div>
            <div>
              <label htmlFor="address" className="label">
                Street address
              </label>
              <input id="address" name="address" defaultValue={settings.address} className="input" />
            </div>
            <div>
              <label htmlFor="pin_code" className="label">
                PIN code
              </label>
              <input id="pin_code" name="pin_code" defaultValue={settings.pin_code} className="input" />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="delivery_areas" className="label">
                Delivery areas
              </label>
              <textarea
                id="delivery_areas"
                name="delivery_areas"
                rows={2}
                defaultValue={settings.delivery_areas}
                className="textarea"
              />
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-line bg-white p-5">
          <h2 className="text-base">Homepage hero</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="hero_heading" className="label">
                Heading
              </label>
              <input id="hero_heading" name="hero_heading" defaultValue={settings.hero_heading} className="input" />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="hero_subheading" className="label">
                Subheading
              </label>
              <textarea
                id="hero_subheading"
                name="hero_subheading"
                rows={2}
                defaultValue={settings.hero_subheading}
                className="textarea"
              />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="hero_image" className="label">
                Hero image URL
              </label>
              <input
                id="hero_image"
                name="hero_image"
                defaultValue={settings.hero_image ?? ""}
                className="input"
                placeholder="/products/hero-groceries.jpg"
              />
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-line bg-white p-5">
          <h2 className="text-base">Delivery &amp; payment rules</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <div>
              <label htmlFor="delivery_charge" className="label">
                Delivery charge ₹
              </label>
              <input
                id="delivery_charge"
                name="delivery_charge"
                type="number"
                min={0}
                step="0.01"
                defaultValue={settings.delivery_charge}
                className="input"
              />
            </div>
            <div>
              <label htmlFor="free_delivery_threshold" className="label">
                Free delivery over ₹
              </label>
              <input
                id="free_delivery_threshold"
                name="free_delivery_threshold"
                type="number"
                min={0}
                step="0.01"
                defaultValue={settings.free_delivery_threshold}
                className="input"
              />
            </div>
            <div>
              <label htmlFor="min_order_amount" className="label">
                Minimum order ₹
              </label>
              <input
                id="min_order_amount"
                name="min_order_amount"
                type="number"
                min={0}
                step="0.01"
                defaultValue={settings.min_order_amount}
                className="input"
              />
            </div>
          </div>

          <div className="mt-4 grid gap-2.5 rounded-xl bg-warm p-4 text-sm sm:grid-cols-2">
            <label className="flex cursor-pointer items-center gap-2.5">
              <input
                type="checkbox"
                name="delivery_enabled"
                defaultChecked={settings.delivery_enabled}
                className="size-4 accent-[#D4AF37]"
              />
              Offer home delivery
            </label>
            <label className="flex cursor-pointer items-center gap-2.5">
              <input
                type="checkbox"
                name="pickup_enabled"
                defaultChecked={settings.pickup_enabled}
                className="size-4 accent-[#D4AF37]"
              />
              Offer store pickup
            </label>
            <label className="flex cursor-pointer items-center gap-2.5">
              <input
                type="checkbox"
                name="cod_enabled"
                defaultChecked={settings.cod_enabled}
                className="size-4 accent-[#D4AF37]"
              />
              Cash on delivery
            </label>
            <label className="flex cursor-pointer items-center gap-2.5">
              <input
                type="checkbox"
                name="online_payment_enabled"
                defaultChecked={settings.online_payment_enabled}
                className="size-4 accent-[#D4AF37]"
              />
              Online payment (Razorpay — optional)
            </label>
          </div>
        </section>

        <section className="rounded-2xl border border-line bg-white p-5">
          <h2 className="text-base">Social links</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <div>
              <label htmlFor="social_instagram" className="label">
                Instagram URL
              </label>
              <input
                id="social_instagram"
                name="social_instagram"
                defaultValue={settings.social_instagram ?? ""}
                className="input"
                placeholder="https://instagram.com/…"
              />
            </div>
            <div>
              <label htmlFor="social_facebook" className="label">
                Facebook URL
              </label>
              <input
                id="social_facebook"
                name="social_facebook"
                defaultValue={settings.social_facebook ?? ""}
                className="input"
                placeholder="https://facebook.com/…"
              />
            </div>
            <div>
              <label htmlFor="social_whatsapp" className="label">
                WhatsApp link number
              </label>
              <input
                id="social_whatsapp"
                name="social_whatsapp"
                defaultValue={settings.social_whatsapp ?? ""}
                className="input"
                placeholder="919876543210"
              />
            </div>
          </div>
        </section>

        <div className="flex justify-end">
          <button type="submit" className="btn btn-dark">
            Save settings
          </button>
        </div>
      </form>
    </div>
  );
}
