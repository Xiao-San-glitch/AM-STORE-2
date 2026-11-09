import type { Metadata } from "next";
import { CartView } from "@/components/cart/cart-view";
import { getSettings } from "@/lib/db";
import { defaultSettings } from "@/lib/seed-data";

export const metadata: Metadata = {
  title: "Your basket",
  robots: { index: false, follow: false },
};

export default async function CartPage() {
  const settings = await getSettings().catch(() => defaultSettings);

  return (
    <div className="shell py-10 sm:py-14">
      <p className="eyebrow">Almost there</p>
      <h1 className="mt-2 text-3xl sm:text-4xl">Your basket</h1>
      <p className="mt-2 max-w-lg text-sm text-charcoal/70">
        Review quantities before checkout. Prices and availability are confirmed once the store accepts your order.
      </p>

      <div className="mt-8">
        <CartView
          deliveryCharge={settings.delivery_charge}
          freeDeliveryThreshold={settings.free_delivery_threshold}
          minOrderAmount={settings.min_order_amount}
          deliveryEnabled={settings.delivery_enabled}
        />
      </div>
    </div>
  );
}
