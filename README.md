# AM STORE — Longleng, Nagaland

A complete grocery storefront and back office for **AM STORE**, Main Market Road, Longleng, Nagaland 789625.

Customers browse the catalogue, add items to a persistent basket, check out with cash on delivery or store pickup,
and receive a shareable order receipt with a WhatsApp hand-off. Store staff manage products, stock, orders,
customers, categories and store settings from `/admin`.

> Sample prices and stock levels are indicative placeholders, and the product photography is openly licensed
> stock imagery (see [PHOTO-CREDITS.md](PHOTO-CREDITS.md)). Replace both with your own prices and pack shots
> from the admin dashboard before going live.

---

## Stack

| Layer      | Choice                                                        |
| ---------- | ------------------------------------------------------------- |
| Framework  | Next.js 15 (App Router, Server Actions), React 19, TypeScript |
| Styling    | Tailwind CSS v4 with a custom ink / gold / warm design system |
| Icons      | lucide-react                                                  |
| Validation | zod (order API)                                               |
| Database   | Supabase Postgres (production) **or** on-disk SQLite (local)  |
| Auth       | Supabase Auth (production) **or** signed admin cookie (local) |
| Storage    | Supabase Storage `product-images` bucket (production)         |

The application talks to a single data contract (`src/lib/db/contract.ts`). Two implementations satisfy it:

- `src/lib/db/supabase/*` — production, RLS-protected Postgres + `place_order` RPC.
- `src/lib/db/local/*` — development, a **real** SQLite database at `.data/am-store.db` that seeds itself on
  first request. Nothing is mocked; orders, stock decrements and settings persist across restarts.

Mode is chosen automatically: if `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are present the
Supabase implementation is used, otherwise the local database.

---

## Quick start (local, no accounts needed)

```bash
npm install
npm run dev
```

Open <http://localhost:3000>.

On the first request the local database is created and seeded with 6 categories and 39 products.

### Admin

<http://localhost:3000/admin> — credentials come from `.env.local`:

```
ADMIN_EMAIL=owner@amstore.in
ADMIN_PASSWORD=AmStore@2026
```

Change these (and `ADMIN_SESSION_SECRET`) before showing the app to anyone else. The local admin row is created
only when the database is first bootstrapped; delete `.data/am-store.db` to re-seed from scratch.

### Useful commands

| Command              | What it does                                                        |
| -------------------- | ------------------------------------------------------------------- |
| `npm run dev`        | Start the dev server                                                |
| `npm run build`      | Production build                                                    |
| `npm run start`      | Serve the production build                                          |
| `npm run typecheck`  | `tsc --noEmit`                                                      |
| `npm run images`     | Regenerate the SVG category / hero artwork in `public/products`       |
| `npm run photos`     | Fetch missing product photos from Openverse (CC-licensed)            |
| `npm run photos:apply` | Point the catalogue at downloaded photos and rewrite `PHOTO-CREDITS.md` |
| `npm run seed`       | Seed the Supabase catalogue (no-op guidance in local mode)          |
| `npm run create-admin` | Create a Supabase Auth admin and add them to `public.admins`      |

---

### Product photography

Every product ships with a real photo in `public/products`. They are sourced from openly licensed work through
the [Openverse](https://openverse.org) API and Wikimedia Commons, cropped to 1200 × 1200 JPEG; the required
attribution for the CC BY / CC BY-SA files is in [PHOTO-CREDITS.md](PHOTO-CREDITS.md). Keep that file if you keep
the photos, or replace each image from **Admin → Products** with your own pack shot (drop the credit entry when
you do).

The homepage hero uses `public/products/hero-groceries.jpg` (1600 × 1200) and the six aisle cards reuse product
photos of the same aisle, so the whole storefront is real photography with no placeholder artwork. Swap any of
them from **Admin → Settings** (hero) or **Admin → Categories** (aisle cards).

`npm run photos` only fetches products that have no photo yet, so it is safe to re-run; `node scripts/pick-photo.mjs`
renders candidate sheets when an automatic pick is wrong.

## Storefront

| Route              | Purpose                                                                 |
| ------------------ | ----------------------------------------------------------------------- |
| `/`                | Hero, category grid, best sellers, new arrivals, WhatsApp CTA            |
| `/shop`            | Search, category / price filters, sorting, pagination                   |
| `/categories`      | All categories with product counts                                      |
| `/category/[slug]` | One aisle with sorting and pagination                                   |
| `/product/[slug]`  | Gallery, pack-size variants, stock, quantity, add to cart, related items |
| `/cart`            | Persistent basket with quantity steppers and delivery estimate           |
| `/checkout`        | Delivery or pickup, contact details, order summary                      |
| `/order/[token]`   | Shareable receipt, status timeline, WhatsApp, issue report, call actions |
| `/about`, `/contact`, `/privacy`, `/terms` | Store information and policies                          |

Also generated: `/sitemap.xml`, `/robots.txt`, favicon, JSON-LD product markup and per-page metadata.

The basket lives in `localStorage`. Prices and totals are **always** recomputed server-side — the browser never
supplies a price that is trusted.

### WhatsApp support

Customers never need an account: the mobile number they type at checkout is how the shop reaches them on
WhatsApp. Every WhatsApp entry point is a plain `wa.me` link, so it works on phones and the desktop app with no
API keys, no Meta app and no message fees:

- **Floating “WhatsApp us” button** on every storefront page — a general question or a complaint.
- **Order receipt** (`/order/[token]`) — “Send on WhatsApp” forwards the whole order, and “Report an issue” opens a
  chat pre-filled with the order number, name, total and current status so the shop can look it up instantly.
- **Product page** — “Ask us on WhatsApp” pre-fills the product name for availability or pack-size questions.
- **Contact page and footer** — direct chat links.
- **Admin → Orders → [order] → Contact** — “Message customer” opens a chat with the customer’s own number for a
  reply or a status update.

All of these use the WhatsApp number in **Admin → Settings → WhatsApp**; change it there and every link follows.
Because the customer writes first, replies stay inside WhatsApp’s normal 24-hour service window.

The app does not send automated messages on its own. Pushing messages without the customer writing first would
need the Meta WhatsApp Cloud API (a verified business number, a Meta app, a permanent access token and an approved
message template per notification type) plus explicit opt-in at checkout.

## Admin

| Route                 | Purpose                                                        |
| --------------------- | -------------------------------------------------------------- |
| `/admin`              | KPIs: today's orders, pending, sales, low stock, recent orders  |
| `/admin/orders`       | Search and filter by status                                     |
| `/admin/orders/[id]`  | Items, customer, totals, status and payment update, WhatsApp     |
| `/admin/products`     | Search, filter, edit, delete                                    |
| `/admin/products/new` | Create a product with image upload and variants                 |
| `/admin/products/[id]`| Edit price, stock, variants, visibility                         |
| `/admin/categories`   | Create, edit, reorder, delete categories                        |
| `/admin/customers`    | Customers with order counts and lifetime value                  |
| `/admin/customers/[id]` | Order history for one customer                                |
| `/admin/settings`     | Store identity, contact, hero copy, delivery/payment rules, socials |

Product images are compressed in the browser, then uploaded through `POST /api/admin/upload`:

- Supabase mode → `product-images` bucket.
- Local mode → `public/uploads/` (git-ignored).

---

## Production setup (Supabase)

1. Create a Supabase project.
2. Run [`supabase/schema.sql`](supabase/schema.sql) in the SQL editor. It creates the tables, indexes, RLS
   policies, the `place_order` and `get_order_by_token` functions, the `customer_order_stats` view, the
   `product-images` bucket and its policies.
3. Create an admin user under **Authentication → Users**.
4. Add them to the allow-list (SQL editor):

   ```sql
   insert into public.admins (user_id, email, role)
   select id, email, 'admin' from auth.users where email = 'owner@example.com'
   on conflict (email) do update set user_id = excluded.user_id;
   ```

5. Fill in `.env.local` (or your host's environment):

   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   SUPABASE_SERVICE_ROLE_KEY=...        # only for seed / create-admin scripts
   NEXT_PUBLIC_SITE_URL=https://your-domain.example
   ```

6. Seed the catalogue:

   ```bash
   npm run seed
   ```

7. Build and deploy (`npm run build && npm run start`, Vercel, or any Node host). No other services are required.

### Security notes

- Every admin route and action re-checks the session (`requireAdmin` / `assertAdmin`); `/admin` is `noindex`.
- Admin reads and writes are additionally constrained by RLS in Supabase mode.
- `place_order` is `SECURITY DEFINER` and recomputes prices, stock, delivery charges and minimum-order rules
  inside Postgres, so a tampered request cannot change what is charged.
- Public order receipts are readable only with the unguessable `public_token`, never by order number or id.
- The service-role key is used only by local scripts and must never be exposed to the browser.

### Local-mode caveat

SQLite and `public/uploads` live on the machine running the app. That is ideal for a VPS (see
[Deploy to your own server](#deploy-to-your-own-server-vps--docker)) but serverless hosts have ephemeral
filesystems — use Supabase there.

---

## Deploy to your own server (VPS / Docker)

The repository ships a production `Dockerfile`, a `docker-compose.yml` with persistent volumes and an
`.env.production.example`. This runs the SQLite build unchanged: no Supabase account, no external services, and
everything (catalogue, orders, photos) stays on your server.

Requirements: a Linux server with Docker Engine 24+ and the compose plugin, about 1 GB RAM, and a domain if you
want HTTPS (admin sign-in requires HTTPS).

1. Copy the project to the server (rsync, scp or git) and enter the folder:

   ```bash
   rsync -av --exclude node_modules --exclude .next --exclude .cache --exclude .data ./ user@server:/srv/am-store/
   ssh user@server
   cd /srv/am-store
   ```

2. Create the production environment file and fill it in:

   ```bash
   cp .env.production.example .env.production
   openssl rand -hex 32        # paste into ADMIN_SESSION_SECRET
   nano .env.production        # set NEXT_PUBLIC_SITE_URL, ADMIN_EMAIL, ADMIN_PASSWORD
   ```

3. Build and start:

   ```bash
   docker compose up -d --build
   docker compose ps
   docker compose logs -f store
   ```

   The shop is then on `http://<server-ip>:3000`. On the first start the database is created and seeded with the
   39 products, 6 categories and store settings, and the admin account from `ADMIN_EMAIL` / `ADMIN_PASSWORD` is
   created. Subsequent starts reuse the volume and never reseed.

4. Put HTTPS in front. With [Caddy](https://caddyserver.com) on the host:

   ```
   store.example.com {
       reverse_proxy 127.0.0.1:3000
   }
   ```

   `caddy reload` and the certificate is issued automatically; then set `NEXT_PUBLIC_SITE_URL=https://store.example.com`.
   nginx works the same way (`proxy_pass http://127.0.0.1:3000;`).

5. Sign in at `https://store.example.com/admin` with the admin credentials.

### Day-to-day

| Task | Command |
| ---- | ------- |
| Deploy new code | `docker compose up -d --build` (volumes are preserved) |
| Logs | `docker compose logs -f store` |
| Restart | `docker compose restart store` |
| Stop / start | `docker compose stop store` / `docker compose start store` |
| Backup | `docker compose stop store && docker run --rm -v am-store_am-store-data:/data -v "$PWD":/backup alpine tar czf /backup/backup-$(date +%F).tar.gz -C /data . && docker compose start store` |
| Restore | stop, extract the archive into the volume with a throwaway container, start |

Back up at least daily: the volume holds every order and the uploaded photos. The database is
`am-store.db` (plus `-wal` / `-shm` files) inside the `am-store-data` volume; uploads are in `am-store-uploads`.

### Without Docker

Node 22.5 or newer is required (`node:sqlite`). On the server:

```bash
npm ci && npm run build
ADMIN_SESSION_SECRET=... ADMIN_EMAIL=... ADMIN_PASSWORD=... LOCAL_DB_PATH=/srv/am-store/.data/am-store.db npm start
```

Keep it alive with systemd or pm2, and make sure `.data` and `public/uploads` are on persistent storage. `next
build` emits a standalone bundle in `.next/standalone` that can be copied to a lean runtime image.

### Changing the admin login

The `ADMIN_EMAIL` / `ADMIN_PASSWORD` variables only create the admin when the database has no admin yet. To change
it later, update the row directly:

```bash
docker compose exec store node -e "const {DatabaseSync}=require('node:sqlite');const c=require('node:crypto');const db=new DatabaseSync('/app/.data/am-store.db');const salt=c.randomUUID().replace(/-/g,'');const hash=c.scryptSync(process.argv[1],salt,64).toString('hex');const sep=String.fromCharCode(36);db.prepare('UPDATE admins SET password_hash=?').run(['scrypt',salt,hash].join(sep));console.log('password updated');" 'NEW-PASSWORD'
```

(Existing sessions stay valid until they expire; change `ADMIN_SESSION_SECRET` to sign everyone out.)

### Limits of this setup

One server, one database file: it cannot be scaled across several machines, and downtime during a redeploy is a
second or two. For multiple app servers or managed backups, use the Supabase path instead — the app picks it up
automatically from the environment variables.

---

## Online payments

Cash on delivery and pay-at-store are fully implemented. `online_payment_enabled` plus the `RAZORPAY_*` keys in
`.env.example` are placeholders for a future Razorpay integration; while the toggle is off, `place_order` rejects
online payments and the storefront only offers the two working methods.

## Project layout

```
src/app/(storefront)/     public pages + storefront chrome
src/app/admin/            sign-in, server actions, (panel) management screens
src/app/api/              search, order creation, admin upload
src/components/           cart, checkout, product, layout, admin, UI
src/lib/db/               data contract + Supabase and local implementations
src/lib/                  auth, storage, WhatsApp links, formatting, seeded catalogue
public/products/          product photos, aisle-card photos and the hero (jpg)
supabase/schema.sql       production database definition
scripts/                  artwork generator, Supabase seed, admin creator
```
