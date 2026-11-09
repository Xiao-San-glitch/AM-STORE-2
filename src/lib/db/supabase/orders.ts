import type {
  CreateOrderInput,
  CustomerWithStats,
  DashboardStats,
  Order,
  OrderStatus,
} from "../../types";
import { createSupabaseServerClient } from "../../supabase/server";
import type { OrderQuery } from "../contract";

/* eslint-disable @typescript-eslint/no-explicit-any */

function mapOrder(row: any): Order {
  return {
    ...(row as Order),
    items: Array.isArray(row.order_items) ? row.order_items : [],
  };
}

const ORDER_SELECT = "*, order_items(*)";

export async function createOrder(input: CreateOrderInput): Promise<Order> {
  const supabase = await createSupabaseServerClient();

  // All pricing, stock checks, delivery charges and totals are computed inside
  // the `place_order` Postgres function — never from client-supplied prices.
  const { data, error } = await supabase.rpc("place_order", {
    payload: {
      customer_name: input.customer_name,
      phone: input.phone,
      email: input.email ?? null,
      address: input.address,
      locality: input.locality,
      pin_code: input.pin_code,
      notes: input.notes ?? null,
      fulfilment_method: input.fulfilment_method,
      payment_method: input.payment_method,
      idempotency_key: input.idempotency_key,
      items: input.items,
    },
  });

  if (error) throw new Error(error.message);

  const result = data as { order_id?: string; order_number?: string; public_token?: string; error?: string } | null;
  if (!result?.order_id) throw new Error(result?.error || "Order could not be placed.");

  // Return a minimal Order from the RPC response.
  // The API route only needs public_token and order_number.
  // We cannot re-fetch via getOrderById here because the anon key
  // doesn't have SELECT access on orders (admin-only RLS).
  return {
    id: result.order_id,
    order_number: result.order_number ?? "",
    public_token: result.public_token ?? "",
    customer_id: null,
    customer_name: input.customer_name,
    phone: input.phone,
    email: input.email ?? null,
    address: input.address,
    locality: input.locality,
    pin_code: input.pin_code,
    notes: input.notes ?? null,
    fulfilment_method: input.fulfilment_method as any,
    payment_method: input.payment_method as any,
    payment_status: "unpaid",
    order_status: "pending" as any,
    subtotal: 0,
    delivery_charge: 0,
    discount: 0,
    total: 0,
    created_at: new Date().toISOString(),
    items: [],
  };
}

export async function getOrderById(id: string): Promise<Order | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("orders").select(ORDER_SELECT).eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  return data ? mapOrder(data) : null;
}

export async function getOrderByToken(token: string): Promise<Order | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("get_order_by_token", { p_token: token });
  if (error) throw new Error(error.message);
  if (!data) return null;
  const payload = data as any;
  return mapOrder({ ...payload.order, order_items: payload.items ?? [] });
}

export async function listOrders(query: OrderQuery = {}) {
  const supabase = await createSupabaseServerClient();
  const perPage = Math.min(Math.max(query.perPage ?? 25, 1), 100);
  const page = Math.max(query.page ?? 1, 1);
  const from = (page - 1) * perPage;

  let request = supabase.from("orders").select(ORDER_SELECT, { count: "exact" });
  if (query.status && query.status !== "all") request = request.eq("order_status", query.status);
  if (query.q) {
    const term = query.q.replace(/[,()*%]/g, " ").trim();
    request = request.or(`order_number.ilike.%${term}%,customer_name.ilike.%${term}%,phone.ilike.%${term}%`);
  }
  if (query.from) request = request.gte("created_at", `${query.from}T00:00:00.000Z`);
  if (query.to) request = request.lte("created_at", `${query.to}T23:59:59.999Z`);

  const { data, error, count } = await request
    .order("created_at", { ascending: false })
    .range(from, from + perPage - 1);
  if (error) throw new Error(error.message);
  return { orders: (data ?? []).map(mapOrder), total: count ?? 0 };
}

export async function updateOrderStatus(id: string, status: OrderStatus): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("orders")
    .update({ order_status: status, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function listCustomers(q?: string): Promise<CustomerWithStats[]> {
  const supabase = await createSupabaseServerClient();
  let request = supabase.from("customer_order_stats").select("*").order("created_at", { ascending: false }).limit(200);
  if (q) {
    const term = q.replace(/[,()*%]/g, " ").trim();
    request = request.or(`name.ilike.%${term}%,phone.ilike.%${term}%`);
  }
  const { data, error } = await request;
  if (error) throw new Error(error.message);
  return (data ?? []) as CustomerWithStats[];
}

export async function listCustomerOrders(customerId: string): Promise<Order[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("orders")
    .select(ORDER_SELECT)
    .eq("customer_id", customerId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapOrder);
}

export async function dashboardStats(): Promise<DashboardStats> {
  const supabase = await createSupabaseServerClient();
  const today = new Date().toISOString().slice(0, 10);

  const count = async (build: (q: any) => any) => {
    const { count: value } = await build(supabase.from("orders").select("id", { count: "exact", head: true }));
    return value ?? 0;
  };

  const totalOrders = await count((q) => q);
  const todaysOrders = await count((q) => q.gte("created_at", `${today}T00:00:00.000Z`));
  const pendingOrders = await count((q) => q.eq("order_status", "pending"));

  const { count: totalProducts } = await supabase
    .from("products")
    .select("id", { count: "exact", head: true });

  const { data: lowStockRows } = await supabase
    .from("products")
    .select("id, name, stock_quantity, unit")
    .eq("active", true)
    .lte("stock_quantity", 5)
    .order("stock_quantity", { ascending: true })
    .limit(6);

  const { count: lowStock } = await supabase
    .from("products")
    .select("id", { count: "exact", head: true })
    .eq("active", true)
    .lte("stock_quantity", 5);

  const { data: salesRows } = await supabase.from("orders").select("total").neq("order_status", "cancelled");
  const totalSales = (salesRows ?? []).reduce((sum: number, row: any) => sum + Number(row.total ?? 0), 0);

  const { data: recent } = await supabase
    .from("orders")
    .select(ORDER_SELECT)
    .order("created_at", { ascending: false })
    .limit(6);

  return {
    total_orders: totalOrders,
    todays_orders: todaysOrders,
    pending_orders: pendingOrders,
    total_products: totalProducts ?? 0,
    low_stock_products: lowStock ?? 0,
    total_sales: totalSales,
    recent_orders: (recent ?? []).map(mapOrder),
    low_stock_list: (lowStockRows ?? []) as DashboardStats["low_stock_list"],
  };
}
