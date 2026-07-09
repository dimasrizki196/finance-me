// app/investments/page.tsx
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
} from "lucide-react";
import InvestmentPopups from "@/components/InvestmentPopups";

export const dynamic = "force-dynamic";

export default async function InvestmentsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // 1. Ambil Dompet "Joint" (Tabungan Kita)
  const { data: wallets } = await supabase
    .from("wallets")
    .select("*")
    .eq("type", "joint")
    .limit(1);

  const activeWallet = wallets?.[0];

  // 2. Kalkulasi Portofolio (Hanya untuk dompet joint ini)
  const portfolio: Record<string, number> = {};
  let totalInvested = 0;

  if (activeWallet) {
    const { data: investTx } = await supabase
      .from("transactions")
      .select("amount, notes, categories!inner(name, type)")
      .eq("wallet_id", activeWallet.id)
      .not("notes", "is", null);

    investTx?.forEach((tx) => {
      const category: any = Array.isArray(tx.categories)
        ? tx.categories[0]
        : tx.categories;

      const catType = category?.type;
      const catName = category?.name;
      const amount = Number(tx.amount);
      const note = tx.notes ? tx.notes.trim().toLowerCase() : "";

      // Filter kategori investasi atau aksi portofolio
      if (
        catType === "investment" ||
        catName === "Update Portofolio" ||
        catName === "Pencairan RDN"
      ) {
        let rdnName = "";

        // Logika Super Ketat Anda
        if (note.includes("putri")) {
          rdnName = "RDN Putri";
        } else if (note.includes("dimas")) {
          rdnName = "RDN Dimas";
        } else if (note.includes("ajaib")) {
          rdnName = "RDN Ajaib";
        } else if (note.includes("reksa dana") || note.includes("reksadana")) {
          rdnName = "Reksa Dana";
        }

        if (rdnName !== "") {
          if (!portfolio[rdnName]) portfolio[rdnName] = 0;

          // Logika Matematika Akuntansi
          if (catName === "Pencairan RDN") {
            portfolio[rdnName] -= amount; // Tarik dana = Aset Berkurang
            totalInvested -= amount;
          } else {
            portfolio[rdnName] += amount; // Topup & Update = Aset Bertambah (bisa minus)
            totalInvested += amount;
          }
        }
      }
    });
  }

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

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-6 w-full animate-in fade-in duration-500">
      {/* HEADER NAVIGASI */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4">
        <div className="flex items-center gap-3">
          <Link href="/">
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 rounded-full shadow-sm hover:bg-zinc-100 dark:hover:bg-zinc-800"
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
              Distribusi Modal Investasi Bersama
            </p>
          </div>
        </div>

        {/* AREA TOMBOL AKSI */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Kita panggil Popups kita di sini, mengirimkan portfolio, type joint, dan wallet ID */}
          {activeWallet && Object.keys(portfolio).length > 0 && (
            <InvestmentPopups
              portfolio={portfolio}
              type="joint"
              walletId={activeWallet.id}
            />
          )}

          {/* TOMBOL TOPUP ASLI ANDA */}
          <Link href="/transactions?type=joint" className="flex-1 md:flex-none">
            <Button className="bg-purple-600 hover:bg-purple-700 text-white shadow-sm w-full">
              <PlusCircle className="w-4 h-4 mr-2" /> Topup RDN
            </Button>
          </Link>
        </div>
      </div>

      {/* KARTU TOTAL INVESTASI */}
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

      {/* DAFTAR AKUN RDN */}
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
                      <div className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-full h-2 mt-3 mb-1 overflow-hidden">
                        <div
                          className="bg-purple-500 h-full rounded-full transition-all duration-1000"
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
