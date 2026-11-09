/**
 * Public base URL of the shop, without a trailing slash.
 *
 * `SITE_URL` is read at runtime, so one Docker image works for any domain.
 * `NEXT_PUBLIC_SITE_URL` is kept as a fallback because Next inlines
 * `NEXT_PUBLIC_*` values at build time, which would otherwise bake a
 * placeholder domain into the sitemap and metadata.
 */
export function siteUrl() {
  const raw = process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  return raw.replace(/\/$/, "");
}
