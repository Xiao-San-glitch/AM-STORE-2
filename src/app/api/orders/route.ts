import { NextResponse } from "next/server";
import { z } from "zod";
import { createOrder } from "@/lib/db";
import { normalisePhone } from "@/lib/utils";

export const dynamic = "force-dynamic";

const itemSchema = z.object({
  product_id: z.string().min(1),
  variant_id: z.string().min(1).nullable().optional(),
  quantity: z.number().int().min(1).max(99),
});

const orderSchema = z.object({
  customer_name: z.string().trim().min(2, "Enter your full name").max(80),
  phone: z.string().trim().min(6),
  email: z.string().trim().email("Enter a valid email address").max(160).optional().nullable().or(z.literal("")),
  address: z.string().trim().max(300).optional().default(""),
  locality: z.string().trim().max(120).optional().default(""),
  pin_code: z.string().trim().max(10).optional().default(""),
  notes: z.string().trim().max(500).optional().nullable(),
  fulfilment_method: z.enum(["delivery", "pickup"]),
  payment_method: z.enum(["cod", "pickup", "online"]),
  idempotency_key: z.string().trim().min(8).max(100),
  items: z.array(itemSchema).min(1, "Your basket is empty").max(40),
});

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = orderSchema.safeParse(payload);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    return NextResponse.json(
      { error: firstIssue?.message ?? "Please check the details you entered." },
      { status: 422 },
    );
  }

  const input = parsed.data;
  const phone = normalisePhone(input.phone);
  if (!phone) {
    return NextResponse.json({ error: "Enter a valid 10-digit Indian mobile number." }, { status: 422 });
  }

  if (input.fulfilment_method === "delivery") {
    if (input.address.length < 6) {
      return NextResponse.json({ error: "Enter a delivery address." }, { status: 422 });
    }
    if (input.locality.length < 2) {
      return NextResponse.json({ error: "Enter your locality or ward." }, { status: 422 });
    }
    if (!/^\d{6}$/.test(input.pin_code)) {
      return NextResponse.json({ error: "Enter a valid 6-digit PIN code." }, { status: 422 });
    }
  }

  try {
    const order = await createOrder({
      customer_name: input.customer_name,
      phone,
      email: input.email ? input.email : null,
      address: input.fulfilment_method === "pickup" ? "Store pickup" : input.address,
      locality: input.fulfilment_method === "pickup" ? "AM STORE, Longleng" : input.locality,
      pin_code: input.fulfilment_method === "pickup" ? "789625" : input.pin_code,
      notes: input.notes ?? null,
      fulfilment_method: input.fulfilment_method,
      payment_method: input.payment_method,
      idempotency_key: input.idempotency_key,
      items: input.items,
    });

    return NextResponse.json({ token: order.public_token, order_number: order.order_number }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "We could not place your order.";
    return NextResponse.json({ error: message }, { status: 409 });
  }
}
