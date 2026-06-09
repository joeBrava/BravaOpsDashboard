import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Inter } from "next/font/google";
import "./globals.css";
import { getCurrentUser } from "@/lib/auth-session";
import { CurrentUserProvider } from "@/components/current-user-provider";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-jakarta",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Biz Bricks Ops — Pipeline",
  description: "Sales pipeline visibility for the Brava Brands team.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Resolve the signed-in user once on the server (stub when AUTH_DISABLED) and
  // share it with client components (e.g. the sidebar profile slot) via context.
  const user = await getCurrentUser();

  return (
    <html lang="en" className={`${jakarta.variable} ${inter.variable}`}>
      <body className="font-body antialiased">
        <CurrentUserProvider user={user}>{children}</CurrentUserProvider>
      </body>
    </html>
  );
}
