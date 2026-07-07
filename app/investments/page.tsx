// app/investments/page.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client"; // Diubah menjadi client agar Pop-up bisa jalan
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  Wallet,
  Building2,
  LineChart,
  PlusCircle,
  Briefcase,
  UserCircle2,
  Layers,
  PieChart,
  TrendingUp,
  ArrowDownToLine,
  Sparkles,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function InvestmentsPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);

  // State untuk menyimpan data asli Anda
  const [portfolio, setPortfolio] = useState<Record<string, number>>({});
  const [totalInvested, setTotalInvested] = useState(0);

  // State untuk Pop-Up Update Profit
  const [selectedRdnUpdate, setSelectedRdnUpdate] = useState("RDN Dimas");
  const [newBalance, setNewBalance] = useState<number | "">("");

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        window.location.href = "/login";
        return;
      }

      // 1. Ambil transaksi (DITAMBAH FILTER "JOINT" AGAR PRIBADI TIDAK KECAMPUR!)
      const { data: transactions } = await supabase
        .from("transactions")
        .select("amount, notes, categories!inner(type), wallets!inner(type)")
        .eq("categories.type", "investment")
        .eq("wallets.type", "joint"); // <-- INI FIX-NYA

      // 2. Kelompokkan secara ketat berdasarkan Akun RDN (LOGIKA ASLI ANDA)
      const tempPortfolio: Record<string, number> = {};
      let tempTotalInvested = 0;

      transactions?.forEach((tx) => {
        const amount = Number(tx.amount);
        const note = tx.notes ? tx.notes.toLowerCase() : "";

        let rdnName = "";

        // LOGIKA SUPER KETAT ASLI ANDA
        if (note.includes("putri")) {
          rdnName = "RDN Putri";
        } else if (note.includes("dimas")) {
          rdnName = "RDN Dimas";
        } else if (note.includes("ajaib")) {
          rdnName = "RDN Ajaib";
        } else if (note.includes("reksa dana")) {
          rdnName = "Reksa Dana";
        }

        if (rdnName !== "") {
          if (!tempPortfolio[rdnName]) {
            tempPortfolio[rdnName] = 0;
          }
          tempPortfolio[rdnName] += amount;
          tempTotalInvested += amount;
        }
      });

      setPortfolio(tempPortfolio);
      setTotalInvested(tempTotalInvested);

      // Set Default Pop-up ke RDN pertama yang ditemukan
      const availableRdns = Object.keys(tempPortfolio);
      if (availableRdns.length > 0) setSelectedRdnUpdate(availableRdns[0]);

      setLoading(false);
    }

    fetchData();
  }, []);

  const formatRupiah = (angka: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(angka);
  };

  const getIcon = (name: string) => {
    if (name.includes("Ajaib")) return <Briefcase className="w-4 h-4" />;
    if (name.includes("Reksa")) return <PieChart className="w-4 h-4" />;
    if (name.includes("Lainnya")) return <Layers className="w-4 h-4" />;
    return <UserCircle2 className="w-4 h-4" />;
  };

  // Kalkulasi Profit Realtime (Hanya untuk tampilan Pop-Up)
  const currentBalance = portfolio[selectedRdnUpdate] || 0;
  const numNewBalance = Number(newBalance) || 0;
  const difference = newBalance !== "" ? numNewBalance - currentBalance : 0;
  const isProfit = difference > 0;

  // Jika masih loading
  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-6 w-full animate-in fade-in duration-500">
      {/* HEADER NAVIGASI */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4">
        <div className="flex items-center gap-3">
          <Link href="/">
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 rounded-full"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
              Saldo RDN Kita
            </h1>
            <p className="text-sm text-muted-foreground flex items-center gap-1.5">
              <Wallet className="w-3.5 h-3.5" />
              Distribusi Modal Investasi
            </p>
          </div>
        </div>

        {/* AREA TOMBOL AKSI (TERMASUK POP-UP) */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* POP-UP 1: UPDATE PROFIT */}
          <Dialog>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                className="flex-1 md:flex-none border-purple-200 text-purple-700 hover:bg-purple-50"
              >
                <TrendingUp className="w-4 h-4 mr-2" /> Update Profit
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-600" /> Update Nilai
                  Portofolio
                </DialogTitle>
                <DialogDescription>
                  Masukkan saldo terbaru untuk mencatat keuntungan/kerugian.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold">
                    Pilih Akun RDN
                  </label>
                  <select
                    className="flex h-11 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm outline-none cursor-pointer"
                    value={selectedRdnUpdate}
                    onChange={(e) => setSelectedRdnUpdate(e.target.value)}
                  >
                    {Object.keys(portfolio).map((name) => (
                      <option key={name} value={name}>
                        {name} (Saldo saat ini: {formatRupiah(portfolio[name])})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold">
                    Saldo Saat Ini (Rp)
                  </label>
                  <Input
                    type="number"
                    value={newBalance}
                    onChange={(e) =>
                      setNewBalance(
                        e.target.value ? Number(e.target.value) : "",
                      )
                    }
                    className="h-12 text-lg font-bold"
                    placeholder="0"
                  />
                </div>
                {/* Indikator Profit Realtime */}
                {newBalance !== "" && difference !== 0 && (
                  <div
                    className={cn(
                      "p-3 rounded-lg border",
                      isProfit
                        ? "bg-emerald-50 border-emerald-200"
                        : "bg-rose-50 border-rose-200",
                    )}
                  >
                    <p
                      className={cn(
                        "text-xs font-bold",
                        isProfit ? "text-emerald-700" : "text-rose-700",
                      )}
                    >
                      {isProfit ? "🎉 Profit!" : "📉 Loss"}
                    </p>
                    <p
                      className={cn(
                        "text-lg font-black",
                        isProfit ? "text-emerald-600" : "text-rose-600",
                      )}
                    >
                      {isProfit ? "+" : "-"}
                      {formatRupiah(Math.abs(difference))}
                    </p>
                  </div>
                )}
                <Button
                  onClick={() =>
                    alert("Fitur Update Database segera disiapkan!")
                  }
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white h-11"
                >
                  Simpan Penyesuaian
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* POP-UP 2: TARIK DANA */}
          <Dialog>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                className="flex-1 md:flex-none border-emerald-200 text-emerald-700 hover:bg-emerald-50"
              >
                <ArrowDownToLine className="w-4 h-4 mr-2" /> Tarik Dana
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <ArrowDownToLine className="w-5 h-5 text-emerald-600" /> Tarik
                  Tunai dari Saham
                </DialogTitle>
                <DialogDescription>
                  Pindahkan saldo RDN ke rekening bank biasa Anda.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold">
                    Tarik dari RDN Mana?
                  </label>
                  <select className="flex h-11 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm outline-none cursor-pointer">
                    {Object.keys(portfolio).map((name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold">
                    Nominal Ditarik (Rp)
                  </label>
                  <Input
                    type="number"
                    className="h-12 text-lg font-bold"
                    placeholder="0"
                  />
                </div>
                <Button
                  onClick={() =>
                    alert("Fitur Tarik Dana ke Database segera disiapkan!")
                  }
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-11"
                >
                  Proses Penarikan
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* TOMBOL ASLI ANDA */}
          <Link href="/transactions?type=joint" className="flex-1 md:flex-none">
            <Button className="bg-purple-600 hover:bg-purple-700 text-white shadow-sm w-full">
              <PlusCircle className="w-4 h-4 mr-2" /> Topup RDN
            </Button>
          </Link>
        </div>
      </div>

      {/* KARTU TOTAL INVESTASI (KODE ASLI ANDA) */}
      <Card className="bg-gradient-to-br from-purple-900 to-indigo-900 text-purple-50 border-none shadow-lg">
        <CardContent className="p-6 md:p-8 flex flex-col items-center justify-center text-center">
          <div className="p-3 bg-white/10 rounded-full mb-4">
            <LineChart className="w-8 h-8 text-purple-200" />
          </div>
          <p className="text-sm md:text-base font-medium text-purple-200/80 mb-2 uppercase tracking-widest">
            Total Uang di Sekuritas
          </p>
          <p className="text-4xl md:text-6xl font-bold tracking-tight">
            {formatRupiah(totalInvested)}
          </p>
        </CardContent>
      </Card>

      {/* DAFTAR AKUN RDN (KODE ASLI ANDA) */}
      <div className="pt-4">
        <h2 className="text-lg font-semibold tracking-tight mb-4 flex items-center gap-2">
          <Building2 className="w-5 h-5 text-muted-foreground" /> Rincian per
          Akun RDN
        </h2>

        {Object.keys(portfolio).length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(portfolio)
              .sort(([, a], [, b]) => b - a)
              .map(([rdnName, amount]) => {
                const percentage =
                  totalInvested > 0
                    ? ((amount / totalInvested) * 100).toFixed(1)
                    : "0";

                return (
                  <Card
                    key={rdnName}
                    className="hover:shadow-md transition-all duration-300 border-zinc-200 dark:border-zinc-800"
                  >
                    <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                      <CardTitle className="text-lg font-bold">
                        {rdnName}
                      </CardTitle>
                      <div className="p-2 bg-purple-100 dark:bg-purple-900/30 text-purple-600 rounded-lg">
                        {getIcon(rdnName)}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold text-foreground mb-1">
                        {formatRupiah(amount)}
                      </p>
                      <div className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-full h-2 mt-3 mb-1">
                        <div
                          className="bg-purple-500 h-2 rounded-full transition-all duration-1000"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-muted-foreground text-right font-medium">
                        {percentage}% dari total modal
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
          </div>
        ) : (
          <div className="text-center p-12 bg-zinc-50 dark:bg-zinc-900/50 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800">
            <Briefcase className="w-12 h-12 text-zinc-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-1">Belum Ada Data RDN</h3>
            <p className="text-sm text-muted-foreground">
              Catat modal investasi Anda dan pastikan menulis "RDN Putri", "RDN
              Dimas", "RDN Ajaib", atau "Reksa Dana" di bagian catatan.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
