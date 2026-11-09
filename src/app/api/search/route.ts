import { NextResponse } from "next/server";
import { listProducts } from "@/lib/db";

export const dynamic = "force-dynamic";

/** Lightweight product suggestions for the header search field. */
export async function GET(request: Request) {
  const term = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  if (term.length < 2) return NextResponse.json({ suggestions: [] });

  try {
    const { products } = await listProducts({ q: term, perPage: 6 });
    return NextResponse.json({
      suggestions: products.map((product) => ({
        id: product.id,
        name: product.name,
        slug: product.slug,
        price: product.price,
        unit: product.unit,
        category: product.category_name ?? "",
      })),
    });
  } catch {
    return NextResponse.json({ suggestions: [] });
  }
}
