import type { MetadataRoute } from "next";
import { listCategories, listProducts } from "@/lib/db";
import { siteUrl } from "@/lib/site-url";

// Generated per request so the production domain comes from the runtime
// environment instead of being baked in at build time.
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = siteUrl();
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${baseUrl}/`, changeFrequency: "daily", priority: 1 },
    { url: `${baseUrl}/shop`, changeFrequency: "daily", priority: 0.9 },
    { url: `${baseUrl}/categories`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${baseUrl}/about`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${baseUrl}/contact`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${baseUrl}/privacy`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${baseUrl}/terms`, changeFrequency: "yearly", priority: 0.2 },
  ];

  try {
    const [categories, catalogue] = await Promise.all([
      listCategories(),
      listProducts({ perPage: 500 }),
    ]);

    return [
      ...staticRoutes,
      ...categories.map((category) => ({
        url: `${baseUrl}/category/${category.slug}`,
        changeFrequency: "weekly" as const,
        priority: 0.7,
      })),
      ...catalogue.products.map((product) => ({
        url: `${baseUrl}/product/${product.slug}`,
        lastModified: product.updated_at ? new Date(product.updated_at) : undefined,
        changeFrequency: "weekly" as const,
        priority: 0.6,
      })),
    ];
  } catch {
    return staticRoutes;
  }
}
