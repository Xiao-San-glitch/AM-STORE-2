import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { default: "Store admin", template: "%s · AM STORE admin" },
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/** Chrome-free wrapper — sign-in and the signed-in panel provide their own shell. */
export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-warm">{children}</div>;
}
