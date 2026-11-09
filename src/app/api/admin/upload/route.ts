import { NextResponse } from "next/server";
import { assertAdmin } from "@/lib/auth";
import { uploadProductImage } from "@/lib/storage";

export const dynamic = "force-dynamic";

/** Authenticated image upload for the admin product form. */
export async function POST(request: Request) {
  try {
    await assertAdmin();
  } catch {
    return NextResponse.json({ error: "Not authorised." }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file received." }, { status: 400 });
    }
    const url = await uploadProductImage(file);
    return NextResponse.json({ url });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload failed." },
      { status: 400 },
    );
  }
}
