-- ============================================================================
-- AM STORE — Supabase schema
-- ----------------------------------------------------------------------------
-- Run this once in the Supabase SQL editor (or `supabase db push`).
--
-- It creates:
--   * catalogue tables (categories, products, product_variants)
--   * store settings (single row, id = 1)
--   * customers, orders, order_items
--   * admins (allow-list tied to Supabase Auth users)
--   * Row Level Security: public can browse active products and read settings,
--     only admins can read orders/customers or change anything
--   * place_order(payload jsonb)  — server-side pricing, stock and totals
--   * get_order_by_token(p_token text) — public order receipt by secret token
--   * customer_order_stats view
--   * product-images storage bucket + policies
--
-- After running it:
--   1. Create an admin user in Authentication → Users.
--   2. Insert that user into public.admins (see bottom of the file).
--   3. Set NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY.
-- ============================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Catalogue
-- ---------------------------------------------------------------------------

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  image_url text,
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  category_id uuid not null references public.categories (id) on delete restrict,
  brand text,
  sku text,
  image_url text,
  additional_images jsonb not null default '[]'::jsonb,
  price numeric(10, 2) not null default 0 check (price >= 0),
  original_price numeric(10, 2) check (original_price is null or original_price >= 0),
  stock_quantity integer not null default 0 check (stock_quantity >= 0),
  unit text not null default '1 pc',
  featured boolean not null default false,
  best_seller boolean not null default false,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists products_category_idx on public.products (category_id);
create index if not exists products_active_idx on public.products (active);

create table if not exists public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  variant_name text not null,
  price numeric(10, 2) not null default 0 check (price >= 0),
  original_price numeric(10, 2),
  stock_quantity integer not null default 0 check (stock_quantity >= 0),
  sku text,
  created_at timestamptz not null default now()
);

create index if not exists product_variants_product_idx on public.product_variants (product_id);

-- ---------------------------------------------------------------------------
-- Store settings (single row)
-- ---------------------------------------------------------------------------

create table if not exists public.store_settings (
  id integer primary key default 1 check (id = 1),
  store_name text not null default 'AM STORE',
  logo_url text,
  tagline text not null default '',
  address text not null default '',
  pin_code text not null default '',
  phone text not null default '',
  whatsapp text not null default '',
  email text,
  delivery_charge numeric(10, 2) not null default 40,
  free_delivery_threshold numeric(10, 2) not null default 799,
  min_order_amount numeric(10, 2) not null default 199,
  opening_hours text not null default '',
  announcement text not null default '',
  hero_heading text not null default '',
  hero_subheading text not null default '',
  hero_image text,
  social_instagram text,
  social_facebook text,
  social_whatsapp text,
  delivery_enabled boolean not null default true,
  pickup_enabled boolean not null default true,
  cod_enabled boolean not null default true,
  online_payment_enabled boolean not null default false,
  delivery_areas text not null default '',
  updated_at timestamptz not null default now()
);

insert into public.store_settings (id) values (1) on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Customers and orders
-- ---------------------------------------------------------------------------

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  name text not null default '',
  phone text not null unique,
  email text,
  address text,
  locality text,
  created_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  public_token uuid not null unique default gen_random_uuid(),
  idempotency_key text unique,
  customer_id uuid references public.customers (id) on delete set null,
  customer_name text not null,
  phone text not null,
  email text,
  address text not null default '',
  locality text not null default '',
  pin_code text not null default '',
  notes text,
  fulfilment_method text not null check (fulfilment_method in ('delivery', 'pickup')),
  payment_method text not null check (payment_method in ('cod', 'pickup', 'online')),
  payment_status text not null default 'unpaid',
  order_status text not null default 'pending'
    check (order_status in ('pending', 'confirmed', 'processing', 'ready_for_pickup', 'out_for_delivery', 'delivered', 'cancelled')),
  subtotal numeric(10, 2) not null default 0,
  delivery_charge numeric(10, 2) not null default 0,
  discount numeric(10, 2) not null default 0,
  total numeric(10, 2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists orders_created_idx on public.orders (created_at desc);
create index if not exists orders_status_idx on public.orders (order_status);
create index if not exists orders_customer_idx on public.orders (customer_id);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  product_id uuid references public.products (id) on delete set null,
  product_name text not null,
  product_image text,
  variant_name text,
  unit text,
  quantity integer not null check (quantity > 0),
  unit_price numeric(10, 2) not null,
  total_price numeric(10, 2) not null,
  created_at timestamptz not null default now()
);

create index if not exists order_items_order_idx on public.order_items (order_id);

-- ---------------------------------------------------------------------------
-- Admins (Supabase Auth allow-list)
-- ---------------------------------------------------------------------------

create table if not exists public.admins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete cascade,
  email text not null unique,
  role text not null default 'admin',
  created_at timestamptz not null default now()
);

create unique index if not exists admins_user_idx on public.admins (user_id);

-- ---------------------------------------------------------------------------
-- updated_at trigger
-- ---------------------------------------------------------------------------

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists products_touch on public.products;
create trigger products_touch before update on public.products
  for each row execute function public.touch_updated_at();

drop trigger if exists orders_touch on public.orders;
create trigger orders_touch before update on public.orders
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Helper: is the current request an admin?
-- SECURITY DEFINER so it can read public.admins regardless of RLS.
-- ---------------------------------------------------------------------------

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admins a
    where a.user_id = auth.uid()
       or lower(a.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_variants enable row level security;
alter table public.store_settings enable row level security;
alter table public.customers enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.admins enable row level security;

-- Public catalogue reads -----------------------------------------------------
drop policy if exists "categories public read" on public.categories;
create policy "categories public read" on public.categories
  for select using (active or public.is_admin());

drop policy if exists "categories admin write" on public.categories;
create policy "categories admin write" on public.categories
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "products public read" on public.products;
create policy "products public read" on public.products
  for select using (active or public.is_admin());

drop policy if exists "products admin write" on public.products;
create policy "products admin write" on public.products
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "variants public read" on public.product_variants;
create policy "variants public read" on public.product_variants
  for select using (
    public.is_admin()
    or exists (select 1 from public.products p where p.id = product_id and p.active)
  );

drop policy if exists "variants admin write" on public.product_variants;
create policy "variants admin write" on public.product_variants
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "settings public read" on public.store_settings;
create policy "settings public read" on public.store_settings
  for select using (true);

drop policy if exists "settings admin write" on public.store_settings;
create policy "settings admin write" on public.store_settings
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Private operational data ---------------------------------------------------
drop policy if exists "customers admin read" on public.customers;
create policy "customers admin read" on public.customers
  for select to authenticated using (public.is_admin());

drop policy if exists "orders admin read" on public.orders;
create policy "orders admin read" on public.orders
  for select to authenticated using (public.is_admin());

drop policy if exists "orders admin update" on public.orders;
create policy "orders admin update" on public.orders
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "order items admin read" on public.order_items;
create policy "order items admin read" on public.order_items
  for select to authenticated using (public.is_admin());

drop policy if exists "admins read own row" on public.admins;
create policy "admins read own row" on public.admins
  for select to authenticated
  using (
    user_id = auth.uid()
    or lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
    or public.is_admin()
  );

-- ---------------------------------------------------------------------------
-- Customer statistics view (RLS of the caller is applied)
-- ---------------------------------------------------------------------------

create or replace view public.customer_order_stats
with (security_invoker = true) as
select
  c.id,
  c.name,
  c.phone,
  c.email,
  c.address,
  c.locality,
  c.created_at,
  count(o.id)::integer as order_count,
  coalesce(
    sum(case when o.order_status <> 'cancelled' then o.total else 0 end),
    0
  )::numeric(12, 2) as total_spent,
  max(o.created_at) as last_order_at
from public.customers c
left join public.orders o on o.customer_id = c.id
group by c.id, c.name, c.phone, c.email, c.address, c.locality, c.created_at;

-- ---------------------------------------------------------------------------
-- place_order — authoritative pricing, stock and totals
-- ---------------------------------------------------------------------------

create or replace function public.place_order(payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_settings public.store_settings;
  v_item jsonb;
  v_product public.products;
  v_variant public.product_variants;
  v_qty integer;
  v_unit_price numeric(10, 2);
  v_subtotal numeric(10, 2) := 0;
  v_delivery numeric(10, 2) := 0;
  v_total numeric(10, 2);
  v_customer_id uuid;
  v_order_id uuid := gen_random_uuid();
  v_number text;
  v_token uuid := gen_random_uuid();
  v_existing public.orders;
  v_fulfilment text := payload ->> 'fulfilment_method';
  v_payment text := payload ->> 'payment_method';
  v_attempt integer := 0;
begin
  -- Idempotency: a repeated submit returns the original order.
  select * into v_existing
  from public.orders
  where idempotency_key = payload ->> 'idempotency_key';

  if found then
    return jsonb_build_object(
      'order_id', v_existing.id,
      'order_number', v_existing.order_number,
      'public_token', v_existing.public_token
    );
  end if;

  select * into v_settings from public.store_settings where id = 1;

  if v_fulfilment is null or v_fulfilment not in ('delivery', 'pickup') then
    raise exception 'Choose a fulfilment method.';
  end if;
  if v_payment is null or v_payment not in ('cod', 'pickup', 'online') then
    raise exception 'Choose a payment method.';
  end if;
  if coalesce(jsonb_array_length(payload -> 'items'), 0) = 0 then
    raise exception 'Your basket is empty.';
  end if;

  if v_fulfilment = 'delivery' and not coalesce(v_settings.delivery_enabled, true) then
    raise exception 'Home delivery is currently unavailable.';
  end if;
  if v_fulfilment = 'pickup' and not coalesce(v_settings.pickup_enabled, true) then
    raise exception 'Store pickup is currently unavailable.';
  end if;
  if v_payment = 'cod' and not coalesce(v_settings.cod_enabled, true) then
    raise exception 'Cash on delivery is currently unavailable.';
  end if;
  if v_payment = 'online' and not coalesce(v_settings.online_payment_enabled, false) then
    raise exception 'Online payment is not enabled yet.';
  end if;
  if v_fulfilment = 'pickup' and v_payment = 'cod' then
    raise exception 'Please choose pay at store for pickup orders.';
  end if;

  -- Price the basket from the database, never from the client.
  for v_item in select * from jsonb_array_elements(payload -> 'items') loop
    v_qty := greatest(1, least(99, coalesce((v_item ->> 'quantity')::integer, 1)));

    select * into v_product
    from public.products
    where id = (v_item ->> 'product_id')::uuid and active
    for update;

    if not found then
      raise exception 'One of the items is no longer available.';
    end if;

    if v_item ->> 'variant_id' is not null then
      select * into v_variant
      from public.product_variants
      where id = (v_item ->> 'variant_id')::uuid and product_id = v_product.id
      for update;

      if not found then
        raise exception 'A selected pack size is no longer available for %.', v_product.name;
      end if;
      if v_variant.stock_quantity < v_qty then
        raise exception 'Only % left of % (%).', v_variant.stock_quantity, v_product.name, v_variant.variant_name;
      end if;
      v_unit_price := v_variant.price;
    else
      if v_product.stock_quantity < v_qty then
        raise exception 'Only % left of %.', v_product.stock_quantity, v_product.name;
      end if;
      v_unit_price := v_product.price;
    end if;

    v_subtotal := v_subtotal + round(v_unit_price * v_qty, 2);
  end loop;

  if v_subtotal < coalesce(v_settings.min_order_amount, 0) then
    raise exception 'Minimum order value is ₹%.', v_settings.min_order_amount;
  end if;

  if v_fulfilment = 'delivery' and v_subtotal < coalesce(v_settings.free_delivery_threshold, 0) then
    v_delivery := coalesce(v_settings.delivery_charge, 0);
  end if;

  v_total := v_subtotal + v_delivery;

  -- Unique, human-readable order number.
  loop
    v_attempt := v_attempt + 1;
    v_number := 'AM-' || to_char(now(), 'YYYYMMDD') || '-' ||
      lpad((floor(random() * 9000) + 1000)::text, 4, '0');
    exit when not exists (select 1 from public.orders where order_number = v_number);
    if v_attempt > 20 then
      raise exception 'Could not allocate an order number. Please try again.';
    end if;
  end loop;

  insert into public.customers (name, phone, email, address, locality)
  values (
    coalesce(payload ->> 'customer_name', ''),
    payload ->> 'phone',
    nullif(payload ->> 'email', ''),
    nullif(payload ->> 'address', ''),
    nullif(payload ->> 'locality', '')
  )
  on conflict (phone) do update
    set name = excluded.name,
        email = coalesce(excluded.email, public.customers.email),
        address = coalesce(excluded.address, public.customers.address),
        locality = coalesce(excluded.locality, public.customers.locality)
  returning id into v_customer_id;

  insert into public.orders (
    id, order_number, public_token, idempotency_key, customer_id, customer_name, phone, email,
    address, locality, pin_code, notes, fulfilment_method, payment_method, payment_status,
    order_status, subtotal, delivery_charge, discount, total
  ) values (
    v_order_id, v_number, v_token, payload ->> 'idempotency_key', v_customer_id,
    coalesce(payload ->> 'customer_name', ''), payload ->> 'phone', nullif(payload ->> 'email', ''),
    coalesce(payload ->> 'address', ''), coalesce(payload ->> 'locality', ''),
    coalesce(payload ->> 'pin_code', ''), nullif(payload ->> 'notes', ''),
    v_fulfilment, v_payment, case when v_payment = 'online' then 'pending' else 'unpaid' end,
    'pending', v_subtotal, v_delivery, 0, v_total
  );

  -- Write the lines and decrement stock atomically.
  for v_item in select * from jsonb_array_elements(payload -> 'items') loop
    v_qty := greatest(1, least(99, coalesce((v_item ->> 'quantity')::integer, 1)));

    select * into v_product from public.products where id = (v_item ->> 'product_id')::uuid;

    if v_item ->> 'variant_id' is not null then
      select * into v_variant from public.product_variants
      where id = (v_item ->> 'variant_id')::uuid for update;

      update public.product_variants
      set stock_quantity = stock_quantity - v_qty
      where id = v_variant.id and stock_quantity >= v_qty;

      if not found then
        raise exception 'Stock for % (%) changed while placing the order. Please review your basket.',
          v_product.name, v_variant.variant_name;
      end if;

      v_unit_price := v_variant.price;

      insert into public.order_items (
        order_id, product_id, product_name, product_image, variant_name, unit, quantity, unit_price, total_price
      ) values (
        v_order_id, v_product.id, v_product.name, coalesce(v_product.image_url, v_variant.variant_name),
        v_variant.variant_name, v_variant.variant_name, v_qty, v_unit_price, round(v_unit_price * v_qty, 2)
      );
    else
      update public.products
      set stock_quantity = stock_quantity - v_qty
      where id = v_product.id and stock_quantity >= v_qty;

      if not found then
        raise exception 'Stock for % changed while placing the order. Please review your basket.', v_product.name;
      end if;

      v_unit_price := v_product.price;

      insert into public.order_items (
        order_id, product_id, product_name, product_image, variant_name, unit, quantity, unit_price, total_price
      ) values (
        v_order_id, v_product.id, v_product.name, v_product.image_url,
        null, v_product.unit, v_qty, v_unit_price, round(v_unit_price * v_qty, 2)
      );
    end if;
  end loop;

  return jsonb_build_object(
    'order_id', v_order_id,
    'order_number', v_number,
    'public_token', v_token
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- get_order_by_token — public receipt, scoped to one secret token
-- ---------------------------------------------------------------------------

create or replace function public.get_order_by_token(p_token text)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'order', to_jsonb(o),
    'items', coalesce(
      (
        select jsonb_agg(to_jsonb(i) order by i.created_at)
        from public.order_items i
        where i.order_id = o.id
      ),
      '[]'::jsonb
    )
  )
  from public.orders o
  where o.public_token::text = p_token
  limit 1;
$$;

-- ---------------------------------------------------------------------------
-- Privileges
-- ---------------------------------------------------------------------------

grant usage on schema public to anon, authenticated;

grant select on public.categories, public.products, public.product_variants, public.store_settings
  to anon, authenticated;

grant select, insert, update, delete on
  public.categories, public.products, public.product_variants, public.store_settings,
  public.customers, public.orders, public.order_items, public.admins
  to authenticated;

grant select on public.customer_order_stats to authenticated;

grant execute on function public.place_order(jsonb) to anon, authenticated;
grant execute on function public.get_order_by_token(text) to anon, authenticated;
grant execute on function public.is_admin() to anon, authenticated;

alter default privileges in schema public grant select on tables to anon;

-- ---------------------------------------------------------------------------
-- Storage: product images
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-images',
  'product-images',
  true,
  6291456,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "product images public read" on storage.objects;
create policy "product images public read" on storage.objects
  for select using (bucket_id = 'product-images');

drop policy if exists "product images admin write" on storage.objects;
create policy "product images admin write" on storage.objects
  for all to authenticated
  using (bucket_id = 'product-images' and public.is_admin())
  with check (bucket_id = 'product-images' and public.is_admin());

-- ---------------------------------------------------------------------------
-- Make yourself an admin
-- ---------------------------------------------------------------------------
-- 1. Authentication → Users → "Add user" (email + password).
-- 2. Replace the values below and run:
--
--   insert into public.admins (user_id, email, role)
--   select id, email, 'admin'
--   from auth.users
--   where email = 'owner@example.com'
--   on conflict (email) do update set user_id = excluded.user_id;
