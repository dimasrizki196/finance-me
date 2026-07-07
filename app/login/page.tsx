// app/login/page.tsx
"use client";

import { useState } from "react";
import { login } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Eye, EyeOff, Lock, Mail, Wallet } from "lucide-react";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);

  return (
    // Tambahan 'overscroll-none' mencegah efek pantulan/tarik di HP
    <div
      className="flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-emerald-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950 overflow-hidden relative z-0 overscroll-none"
      style={{
        width: "100vw",
        // MENGGUNAKAN `dvh` (Dynamic Viewport Height) ALIH-ALIH `vh`
        height: "calc(100dvh - 64px)",
        marginLeft: "calc(50% - 50vw)",
      }}
    >
      {/* Ornamen Latar Belakang */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Tambahan: max-h-[calc(100dvh-80px)] dan overflow-y-auto 
          Agar jika keyboard HP muncul, formnya tetap bisa dilihat/digeser perlahan di dalam kotak */}
      <Card className="w-full max-w-md max-h-[calc(100dvh-80px)] overflow-y-auto shadow-xl border-zinc-200/50 dark:border-zinc-800/50 backdrop-blur-sm bg-white/90 dark:bg-zinc-950/90 z-10 rounded-2xl mx-4 my-auto scrollbar-hide">
        <CardHeader className="text-center pb-6 pt-8 shrink-0">
          {/* Logo Wallet */}
          <div className="mx-auto flex h-16 w-16 items-center justify-center bg-zinc-100 dark:bg-zinc-800/50 rounded-full mb-3">
            <Wallet className="w-8 h-8 text-primary" />
          </div>

          <CardTitle className="text-2xl font-bold tracking-tight">
            Keuangan Kita
          </CardTitle>
          <CardDescription className="text-sm font-medium mt-1">
            Selamat datang kembali! Silakan masuk ke akun Anda.
          </CardDescription>
        </CardHeader>

        <CardContent className="pb-8 shrink-0">
          <form action={login} className="flex flex-col gap-5">
            {/* Input Email */}
            <div className="flex flex-col gap-2">
              <label
                htmlFor="email"
                className="text-sm font-semibold text-zinc-700 dark:text-zinc-300"
              >
                Email
              </label>
              <div className="relative group">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400 group-focus-within:text-primary transition-colors" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="nama@email.com"
                  className="pl-11 h-12 rounded-xl bg-zinc-50/50 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 focus-visible:ring-primary text-base sm:text-sm"
                  required
                />
              </div>
            </div>

            {/* Input Password */}
            <div className="flex flex-col gap-2">
              <label
                htmlFor="password"
                className="text-sm font-semibold text-zinc-700 dark:text-zinc-300"
              >
                Password
              </label>
              <div className="relative group">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400 group-focus-within:text-primary transition-colors" />
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="pl-11 pr-12 h-12 rounded-xl bg-zinc-50/50 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 focus-visible:ring-primary text-base sm:text-sm"
                  required
                />

                {/* Tombol Mata */}
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors p-1"
                  aria-label={
                    showPassword ? "Sembunyikan password" : "Tampilkan password"
                  }
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Tombol Login */}
            <Button
              type="submit"
              className="w-full h-12 rounded-xl text-base font-bold shadow-md hover:shadow-lg transition-all mt-4 bg-primary text-primary-foreground"
            >
              Masuk ke Dashboard
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
