"use server";
import { redirect } from "next/navigation";
import { signInCustomer, signOutCustomer } from "@/lib/customer-auth";

/** Server action for the login form */
export async function customerSignIn(formData: FormData) {
  "use server";
  const email = (formData.get("email") as string) ?? "";
  const password = (formData.get("password") as string) ?? "";
  const result = await signInCustomer(email, password);
  if (!result.ok) {
    const error = encodeURIComponent(result.error);
    redirect(`/login?error=${error}`);
  }
  redirect("/account");
}

/** Server action for signing out */
export async function customerSignOut() {
  "use server";
  await signOutCustomer();
  redirect("/login");
}
