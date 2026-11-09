import type { Metadata } from "next";
import { CheckoutForm } from "@/components/checkout/checkout-form";
import { getSettings } from "@/lib/db";
import { defaultSettings } from "@/lib/seed-data";

export const metadata: Metadata = {
  title: "Checkout",
  robots: { index: false, follow: false },
};

export default async function CheckoutPage() {
  const settings = await getSettings().catch(() => defaultSettings);

  return (
    <div className="shell py-10 sm:py-14">
      <p className="eyebrow">Secure checkout</p>
      <h1 className="mt-2 text-3xl sm:text-4xl">Confirm your order</h1>
      <p className="mt-2 max-w-xl text-sm text-charcoal/70">
        No account needed. Tell us where to send the groceries and we will confirm the order by phone or WhatsApp.
      </p>

      <div className="mt-8">
        <CheckoutForm
          deliveryEnabled={settings.delivery_enabled}
          pickupEnabled={settings.pickup_enabled}
          deliveryCharge={settings.delivery_charge}
          freeDeliveryThreshold={settings.free_delivery_threshold}
          minOrderAmount={settings.min_order_amount}
          storeAddress={settings.address}
          storePin={settings.pin_code}
        />
      </div>
    </div>
  );
}
