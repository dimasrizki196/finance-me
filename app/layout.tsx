// app/layout.tsx
import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Wallet, LogOut } from "lucide-react"; // Tambahkan ikon LogOut
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Dompet Kita",
  description: "Aplikasi pencatatan keuangan pribadi dan bersama",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

// Ubah fungsi layout menjadi async agar bisa mengecek database
export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Cek apakah user sedang login
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Fungsi Logout terpusat
  async function signOut() {
    "use server";
    const supabase = await createClient();
    await supabase.auth.signOut();
    redirect("/login");
  }

  return (
    <html
      lang="id"
      className={cn(
        "h-full antialiased",
        geistSans.variable,
        geistMono.variable,
        jetbrainsMono.variable,
        "font-mono",
      )}
    >
      <body className="min-h-screen bg-background text-foreground flex flex-col">
        {/* HEADER APLIKASI */}
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container flex h-14 max-w-6xl mx-auto items-center justify-between px-4 sm:px-6">
            <Link
              href="/"
              className="flex items-center gap-2 font-bold tracking-tight transition-opacity hover:opacity-80"
            >
              <div className="p-1.5 bg-primary text-primary-foreground rounded-md">
                <Wallet className="w-4 h-4" />
              </div>
              <span className="text-lg">Dompet Kita</span>
            </Link>

            {/* Tombol Logout HANYA muncul jika user sudah login */}
            <div className="flex items-center gap-2">
              {user && (
                <form action={signOut}>
                  <Button
                    variant="ghost"
                    size="sm"
                    type="submit"
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <LogOut className="w-4 h-4 sm:mr-2" />
                    <span className="hidden sm:inline">Keluar</span>
                  </Button>
                </form>
              )}
            </div>
          </div>
        </header>

        {/* AREA KONTEN UTAMA */}
        <main className="flex-1 flex flex-col w-full max-w-6xl mx-auto pb-16 sm:pb-0">
          {children}
        </main>
      </body>
    </html>
  );
}
