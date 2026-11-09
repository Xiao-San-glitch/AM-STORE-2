import { randomUUID } from "node:crypto";
import type {
  CreateOrderInput,
  CustomerWithStats,
  DashboardStats,
  FulfilmentMethod,
  Order,
  OrderItem,
  OrderStatus,
  PaymentMethod,
} from "../../types";
import { fromPaise, normalisePhone, toPaise } from "../../utils";
import { getDb, readSettings } from "./client";
import type { OrderQuery } from "../contract";

type OrderRow = {
  id: string;
  order_number: string;
  public_token: string;
  customer_id: string | null;
  customer_name: string;
  phone: string;
  email: string | null;
  address: string;
  locality: string;
  pin_code: string;
  notes: string | null;
  fulfilment_method: string;
  payment_method: string;
  payment_status: string;
  order_status: string;
  subtotal: number;
  delivery_charge: number;
  discount: number;
  total: number;
  created_at: string;
};

type ItemRow = {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name: string;
  product_image: string | null;
  variant_name: string | null;
  unit: string | null;
  quantity: number;
  unit_price: number;
  total_price: number;
};

function mapItem(row: ItemRow): OrderItem {
  return { ...row };
}

function mapOrder(row: OrderRow, items: OrderItem[]): Order {
  return {
    ...row,
    fulfilment_method: row.fulfilment_method as FulfilmentMethod,
    payment_method: row.payment_method as PaymentMethod,
    order_status: row.order_status as OrderStatus,
    items,
  };
}

function itemsFor(orderIds: string[]): Map<string, OrderItem[]> {
  const map = new Map<string, OrderItem[]>();
  if (orderIds.length === 0) return map;
  const placeholders = orderIds.map(() => "?").join(",");
  const rows = getDb()
    .prepare(`SELECT * FROM order_items WHERE order_id IN (${placeholders})`)
    .all(...orderIds) as unknown as ItemRow[];
  for (const row of rows) {
    const list = map.get(row.order_id) ?? [];
    list.push(mapItem(row));
    map.set(row.order_id, list);
  }
  return map;
}

export function getOrderById(id: string): Order | null {
  const row = getDb().prepare("SELECT * FROM orders WHERE id = ?").get(id) as OrderRow | undefined;
  if (!row) return null;
  return mapOrder(row, itemsFor([row.id]).get(row.id) ?? []);
}

export function getOrderByToken(token: string): Order | null {
  const row = getDb().prepare("SELECT * FROM orders WHERE public_token = ?").get(token) as OrderRow | undefined;
  if (!row) return null;
  return mapOrder(row, itemsFor([row.id]).get(row.id) ?? []);
}

function nextOrderNumber(): string {
  const db = getDb();
  const stamp = new Date().toISOString().slice(2, 10).replace(/-/g, "");
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const candidate = `AM-${stamp}-${Math.floor(1000 + Math.random() * 9000)}`;
    const exists = db.prepare("SELECT id FROM orders WHERE order_number = ?").get(candidate);
    if (!exists) return candidate;
  }
  return `AM-${stamp}-${Date.now().toString().slice(-5)}`;
}

type Line = {
  productId: string;
  variantId: string | null;
  name: string;
  image: string | null;
  variantName: string | null;
  unit: string;
  quantity: number;
  unitPrice: number;
  total: number;
};

export function createOrder(input: CreateOrderInput): Order {
  const db = getDb();
  const settings = readSettings();

  const duplicate = db.prepare("SELECT id FROM orders WHERE idempotency_key = ?").get(input.idempotency_key) as
    | { id: string }
    | undefined;
  if (duplicate) {
    const existing = getOrderById(duplicate.id);
    if (existing) return existing;
  }

  if (!input.items?.length) throw new Error("Your cart is empty.");
  if (input.items.length > 50) throw new Error("Too many items in one order.");
  if (input.fulfilment_method === "delivery" && !settings.delivery_enabled) {
    throw new Error("Home delivery is currently unavailable. Please choose store pickup.");
  }
  if (input.fulfilment_method === "pickup" && !settings.pickup_enabled) {
    throw new Error("Store pickup is currently unavailable. Please choose delivery.");
  }
  if (input.payment_method === "cod" && !settings.cod_enabled) {
    throw new Error("Cash on delivery is currently unavailable.");
  }
  if (input.payment_method === "online") {
    throw new Error("Online payment is not enabled yet. Please choose cash on delivery or pay at store.");
  }

  const phone = normalisePhone(input.phone);
  if (!phone) throw new Error("Enter a valid 10-digit Indian mobile number.");
  if (!/^\d{6}$/.test(input.pin_code)) throw new Error("Enter a valid 6-digit PIN code.");

  const lines: Line[] = [];
  let subtotalPaise = 0;

  for (const item of input.items) {
    const quantity = Math.trunc(Number(item.quantity));
    if (!Number.isFinite(quantity) || quantity <= 0) throw new Error("Invalid quantity in cart.");
    if (quantity > 99) throw new Error("Maximum quantity per item is 99.");

    const product = db
      .prepare("SELECT * FROM products WHERE id = ? AND active = 1")
      .get(item.product_id) as
      | { id: string; name: string; image_url: string | null; price: number; stock_quantity: number; unit: string }
      | undefined;
    if (!product) throw new Error("One of the products in your cart is no longer available.");

    let unitPrice = product.price;
    let unit = product.unit;
    let stock = product.stock_quantity;
    let variantId: string | null = null;
    let variantName: string | null = null;

    if (item.variant_id) {
      const variant = db
        .prepare("SELECT * FROM product_variants WHERE id = ? AND product_id = ?")
        .get(item.variant_id, item.product_id) as
        | { id: string; variant_name: string; price: number; stock_quantity: number }
        | undefined;
      if (!variant) throw new Error(`A pack size for ${product.name} is no longer available.`);
      variantId = variant.id;
      variantName = variant.variant_name;
      unitPrice = variant.price;
      unit = variant.variant_name;
      stock = variant.stock_quantity;
    }

    if (stock < quantity) {
      throw new Error(
        stock <= 0
          ? `${product.name} (${unit}) is out of stock.`
          : `Only ${stock} left of ${product.name} (${unit}).`,
      );
    }

    const lineTotalPaise = toPaise(unitPrice) * quantity;
    subtotalPaise += lineTotalPaise;
    lines.push({
      productId: product.id,
      variantId,
      name: product.name,
      image: product.image_url,
      variantName,
      unit,
      quantity,
      unitPrice,
      total: fromPaise(lineTotalPaise),
    });
  }

  const subtotal = fromPaise(subtotalPaise);
  if (subtotal < settings.min_order_amount) {
    throw new Error(`Minimum order value is ₹${settings.min_order_amount}.`);
  }
  if (input.fulfilment_method === "pickup" && input.payment_method === "cod") {
    throw new Error("Please choose 'Pay at store' for pickup orders.");
  }

  const deliveryCharge =
    input.fulfilment_method === "pickup"
      ? 0
      : subtotal >= settings.free_delivery_threshold
        ? 0
        : settings.delivery_charge;
  const total = fromPaise(subtotalPaise + toPaise(deliveryCharge));
  const now = new Date().toISOString();
  const orderId = randomUUID();
  const orderNumber = nextOrderNumber();
  const publicToken = randomUUID();

  db.exec("BEGIN IMMEDIATE");
  try {
    const existingCustomer = db.prepare("SELECT id FROM customers WHERE phone = ?").get(phone) as
      | { id: string }
      | undefined;
    let customerId = existingCustomer?.id;
    if (customerId) {
      db.prepare("UPDATE customers SET name = ?, email = ?, address = ?, locality = ? WHERE id = ?").run(
        input.customer_name.trim(),
        input.email?.trim() || null,
        input.address.trim(),
        input.locality.trim(),
        customerId,
      );
    } else {
      customerId = randomUUID();
      db.prepare(
        "INSERT INTO customers (id, name, phone, email, address, locality, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
      ).run(
        customerId,
        input.customer_name.trim(),
        phone,
        input.email?.trim() || null,
        input.address.trim(),
        input.locality.trim(),
        now,
      );
    }

    db.prepare(
      `INSERT INTO orders (id, order_number, public_token, idempotency_key, customer_id, customer_name, phone,
        email, address, locality, pin_code, notes, fulfilment_method, payment_method, payment_status,
        order_status, subtotal, delivery_charge, discount, total, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, 0, ?, ?, ?)`,
    ).run(
      orderId,
      orderNumber,
      publicToken,
      input.idempotency_key,
      customerId,
      input.customer_name.trim(),
      phone,
      input.email?.trim() || null,
      input.address.trim(),
      input.locality.trim(),
      input.pin_code,
      input.notes?.trim() || null,
      input.fulfilment_method,
      input.payment_method,
      "unpaid",
      subtotal,
      deliveryCharge,
      total,
      now,
      now,
    );

    const insertItem = db.prepare(
      `INSERT INTO order_items (id, order_id, product_id, product_name, product_image, variant_name, unit,
        quantity, unit_price, total_price) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    );

    for (const line of lines) {
      insertItem.run(
        randomUUID(),
        orderId,
        line.productId,
        line.name,
        line.image,
        line.variantName,
        line.unit,
        line.quantity,
        line.unitPrice,
        line.total,
      );

      const result = line.variantId
        ? db
            .prepare("UPDATE product_variants SET stock_quantity = stock_quantity - ? WHERE id = ? AND stock_quantity >= ?")
            .run(line.quantity, line.variantId, line.quantity)
        : db
            .prepare("UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ? AND stock_quantity >= ?")
            .run(line.quantity, line.productId, line.quantity);

      if (Number(result.changes) === 0) {
        throw new Error(`${line.name} (${line.unit}) just went out of stock. Please update your cart.`);
      }
    }

    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }

  return getOrderById(orderId)!;
}

export function listOrders(query: OrderQuery = {}) {
  const db = getDb();
  const where: string[] = [];
  const params: (string | number)[] = [];

  if (query.status && query.status !== "all") {
    where.push("order_status = ?");
    params.push(query.status);
  }
  if (query.q) {
    where.push("(order_number LIKE ? OR customer_name LIKE ? OR phone LIKE ?)");
    const like = `%${query.q.trim()}%`;
    params.push(like, like, like);
  }
  if (query.from) {
    where.push("created_at >= ?");
    params.push(`${query.from}T00:00:00.000Z`);
  }
  if (query.to) {
    where.push("created_at <= ?");
    params.push(`${query.to}T23:59:59.999Z`);
  }

  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const perPage = Math.min(Math.max(query.perPage ?? 25, 1), 100);
  const page = Math.max(query.page ?? 1, 1);
  const total = (db.prepare(`SELECT COUNT(*) AS count FROM orders ${whereSql}`).get(...params) as { count: number })
    .count;
  const rows = db
    .prepare(`SELECT * FROM orders ${whereSql} ORDER BY created_at DESC LIMIT ? OFFSET ?`)
    .all(...params, perPage, (page - 1) * perPage) as unknown as OrderRow[];
  const items = itemsFor(rows.map((row) => row.id));
  return { orders: rows.map((row) => mapOrder(row, items.get(row.id) ?? [])), total };
}

export function updateOrderStatus(id: string, status: OrderStatus, paymentStatus?: string) {
  const db = getDb();
  const result = paymentStatus
    ? db.prepare("UPDATE orders SET order_status = ?, payment_status = ?, updated_at = ? WHERE id = ?").run(
        status,
        paymentStatus,
        new Date().toISOString(),
        id,
      )
    : db.prepare("UPDATE orders SET order_status = ?, updated_at = ? WHERE id = ?").run(
        status,
        new Date().toISOString(),
        id,
      );
  if (Number(result.changes) === 0) throw new Error("Order not found");
}

export function listCustomers(q?: string): CustomerWithStats[] {
  const db = getDb();
  const params: string[] = [];
  let whereSql = "";
  if (q) {
    whereSql = "WHERE c.name LIKE ? OR c.phone LIKE ?";
    params.push(`%${q}%`, `%${q}%`);
  }
  const rows = db
    .prepare(
      `SELECT c.id, c.name, c.phone, c.email, c.address, c.locality, c.created_at,
        COUNT(o.id) AS order_count,
        COALESCE(SUM(CASE WHEN o.order_status <> 'cancelled' THEN o.total ELSE 0 END), 0) AS total_spent,
        MAX(o.created_at) AS last_order_at
       FROM customers c LEFT JOIN orders o ON o.customer_id = c.id
       ${whereSql}
       GROUP BY c.id ORDER BY c.created_at DESC LIMIT 200`,
    )
    .all(...params) as unknown as CustomerWithStats[];
  return rows;
}

export function listCustomerOrders(customerId: string): Order[] {
  const db = getDb();
  const rows = db
    .prepare("SELECT * FROM orders WHERE customer_id = ? ORDER BY created_at DESC")
    .all(customerId) as unknown as OrderRow[];
  const items = itemsFor(rows.map((row) => row.id));
  return rows.map((row) => mapOrder(row, items.get(row.id) ?? []));
}

export function dashboardStats(): DashboardStats {
  const db = getDb();
  const today = new Date().toISOString().slice(0, 10);
  const one = (sql: string, ...params: (string | number)[]) =>
    Number((db.prepare(sql).get(...params) as { value: number | null }).value ?? 0);

  const totalOrders = one("SELECT COUNT(*) AS value FROM orders");
  const todaysOrders = one("SELECT COUNT(*) AS value FROM orders WHERE substr(created_at, 1, 10) = ?", today);
  const pendingOrders = one("SELECT COUNT(*) AS value FROM orders WHERE order_status = 'pending'");
  const totalProducts = one("SELECT COUNT(*) AS value FROM products");
  const lowStock = one("SELECT COUNT(*) AS value FROM products WHERE active = 1 AND stock_quantity <= 5");
  const totalSales = one("SELECT COALESCE(SUM(total), 0) AS value FROM orders WHERE order_status <> 'cancelled'");

  const recentRows = db
    .prepare("SELECT * FROM orders ORDER BY created_at DESC LIMIT 6")
    .all() as unknown as OrderRow[];
  const recentItems = itemsFor(recentRows.map((row) => row.id));

  const lowStockRows = db
    .prepare(
      "SELECT id, name, stock_quantity, unit FROM products WHERE active = 1 AND stock_quantity <= 5 ORDER BY stock_quantity ASC LIMIT 6",
    )
    .all() as unknown as { id: string; name: string; stock_quantity: number; unit: string }[];

  return {
    total_orders: totalOrders,
    todays_orders: todaysOrders,
    pending_orders: pendingOrders,
    total_products: totalProducts,
    low_stock_products: lowStock,
    total_sales: totalSales,
    recent_orders: recentRows.map((row) => mapOrder(row, recentItems.get(row.id) ?? [])),
    low_stock_list: lowStockRows,
  };
}

export function listOrdersByAccount(customerId: string): Order[] {
  const db = getDb();
  const rows = db
    .prepare("SELECT * FROM orders WHERE customer_account_id = ? ORDER BY created_at DESC")
    .all(customerId) as unknown as OrderRow[];
  const items = itemsFor(rows.map((row) => row.id));
  return rows.map((row) => mapOrder(row, items.get(row.id) ?? []));
}

