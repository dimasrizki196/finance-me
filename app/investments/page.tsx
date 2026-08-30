// app/investments/page.tsx
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Wallet,
  Building2,
  LineChart,
  Briefcase,
  UserCircle2,
  Layers,
  PieChart,
  ListOrdered,
  TrendingUp,
  TrendingDown,
  ArrowDownToLine,
  Clock,
  PlusCircle,
} from "lucide-react";
import InvestmentPopups from "@/components/InvestmentPopups";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function InvestmentsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: wallets } = await supabase
    .from("wallets")
    .select("*")
    .eq("type", "joint")
    .limit(1);
  const activeWallet = wallets?.[0];

  const { data: investCat } = await supabase
    .from("categories")
    .select("id")
    .eq("type", "investment")
    .limit(1);
  const investCategoryId = investCat?.[0]?.id;

  const portfolio: Record<string, number> = {};
  let totalInvested = 0;
  let investHistory: any[] = [];

  if (activeWallet) {
    const { data: historyData } = await supabase
      .from("transactions")
      .select(
        "id, amount, notes, transaction_date, categories!inner(name, type)",
      )
      .eq("wallet_id", activeWallet.id)
      .order("transaction_date", { ascending: false })
      .order("created_at", { ascending: false });

    // Filter Khusus Transaksi Saham
    investHistory =
      historyData?.filter((tx) => {
        const cat = Array.isArray(tx.categories)
          ? tx.categories[0]
          : tx.categories;
        return (
          cat?.type === "investment" ||
          cat?.name === "Update Portofolio" ||
          cat?.name === "Pencairan RDN"
        );
      }) || [];

    // Kalkulasi Portofolio
    investHistory.forEach((tx) => {
      const cat = Array.isArray(tx.categories)
        ? tx.categories[0]
        : tx.categories;
      const amount = Number(tx.amount);
      const note = tx.notes ? tx.notes.trim().toLowerCase() : "";

      let rdnName = "";
      if (note.includes("putri")) rdnName = "RDN Putri";
      else if (note.includes("dimas")) rdnName = "RDN Dimas";
      else if (note.includes("ajaib")) rdnName = "RDN Ajaib";
      else if (note.includes("reksa dana") || note.includes("reksadana"))
        rdnName = "Reksa Dana";
      else if (tx.notes && tx.notes.trim() !== "") rdnName = tx.notes;

      if (rdnName !== "") {
        if (!portfolio[rdnName]) portfolio[rdnName] = 0;
        if (cat?.name === "Pencairan RDN") {
          portfolio[rdnName] -= amount;
          totalInvested -= amount;
        } else {
          portfolio[rdnName] += amount;
          totalInvested += amount;
        }
      }
    });
  }

  // PENGELOMPOKAN RIWAYAT BERDASARKAN BULAN
  const groupedHistory: Record<string, any[]> = {};
  investHistory.forEach((tx) => {
    const date = new Date(tx.transaction_date);
    const monthYear = date.toLocaleString("id-ID", {
      month: "long",
      year: "numeric",
    });
    if (!groupedHistory[monthYear]) groupedHistory[monthYear] = [];
    groupedHistory[monthYear].push(tx);
  });

  const formatRupiah = (angka: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(angka);

  const getIcon = (name: string) => {
    if (name.includes("Ajaib")) return <Briefcase className="w-5 h-5" />;
    if (name.includes("Reksa")) return <PieChart className="w-5 h-5" />;
    if (name.includes("Lainnya")) return <Layers className="w-5 h-5" />;
    return <UserCircle2 className="w-5 h-5" />;
  };

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6 w-full animate-in fade-in duration-500">
      {/* HEADER COMPACT */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-zinc-100 dark:border-zinc-800">
        <div className="flex items-center gap-3">
          <Link href="/">
            <Button
              variant="outline"
              size="icon"
              className="h-10 w-10 rounded-full shadow-sm hover:bg-zinc-100 dark:hover:bg-zinc-800 border-zinc-200"
            >
              <ArrowLeft className="w-4 h-4 text-zinc-600 dark:text-zinc-300" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              Saldo RDN Kita
            </h1>
            <p className="text-xs sm:text-sm font-medium text-muted-foreground flex items-center gap-1.5">
              <Wallet className="w-3.5 h-3.5" /> Distribusi Modal Investasi
            </p>
          </div>
        </div>

        {/* 3 TOMBOL AKSI PINTAR DITAMPILKAN DI SINI */}
        <div className="w-full md:w-auto">
          {activeWallet && (
            <InvestmentPopups
              portfolio={portfolio}
              type="joint"
              walletId={activeWallet.id}
              investCategoryId={investCategoryId}
            />
          )}
        </div>
      </div>

      {/* KARTU TOTAL INVESTASI */}
      <Card className="bg-gradient-to-br from-indigo-700 to-purple-800 text-white border-none shadow-xl shadow-purple-900/20 rounded-3xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-8 -mt-8 opacity-10 pointer-events-none">
          <LineChart className="w-48 h-48" />
        </div>
        <CardContent className="p-6 sm:p-8 flex flex-col items-center justify-center text-center relative z-10">
          <p className="text-xs font-bold text-purple-200 uppercase tracking-widest mb-1">
            Total Uang di Sekuritas
          </p>
          <p className="text-4xl sm:text-5xl font-black tracking-tighter mt-1">
            {formatRupiah(totalInvested)}
          </p>
        </CardContent>
      </Card>

      {/* DAFTAR AKUN RDN */}
      <div className="pt-2">
        <h2 className="text-lg font-bold tracking-tight mb-4 flex items-center gap-2 text-foreground">
          <Building2 className="w-5 h-5 text-purple-500" /> Rincian per Akun RDN
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
                    className="hover:border-purple-500/50 transition-colors border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-sm"
                  >
                    <CardContent className="p-5">
                      <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-purple-50 dark:bg-purple-900/30 text-purple-600 rounded-xl">
                          {getIcon(rdnName)}
                        </div>
                        <p className="text-[11px] font-bold text-purple-700 bg-purple-100 dark:bg-purple-900/40 dark:text-purple-300 px-2.5 py-1 rounded-lg">
                          {percentage}%
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-muted-foreground mb-0.5">
                          {rdnName}
                        </p>
                        <p className="text-2xl font-black text-foreground">
                          {formatRupiah(amount)}
                        </p>
                      </div>
                      <div className="w-full bg-zinc-100 dark:bg-zinc-800/50 rounded-full h-1.5 mt-4 overflow-hidden">
                        <div
                          className="bg-purple-500 h-full rounded-full transition-all duration-1000"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
          </div>
        ) : (
          <div className="text-center p-10 bg-zinc-50 dark:bg-zinc-900/30 rounded-3xl border border-dashed border-zinc-200 flex flex-col items-center justify-center">
            <Briefcase className="w-8 h-8 text-zinc-400 mb-3" />
            <h3 className="font-bold text-lg">Belum Ada Data RDN</h3>
            <p className="text-xs font-medium text-muted-foreground mt-1">
              Silakan klik "Top Up" untuk menambahkan investasi.
            </p>
          </div>
        )}
      </div>

      {/* RIWAYAT TRANSAKSI SAHAM (DIKELOMPOKKAN PER BULAN) */}
      <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm rounded-3xl mt-8 overflow-hidden bg-zinc-50/50 dark:bg-zinc-900/20">
        <CardHeader className="pb-5 border-b border-zinc-100 dark:border-zinc-800/50 bg-white dark:bg-zinc-900/40">
          <CardTitle className="text-xl flex items-center gap-2">
            <ListOrdered className="w-5 h-5 text-purple-500" /> Riwayat Saham
          </CardTitle>
          <CardDescription>
            Catatan Topup, Profit, Loss, dan Penarikan
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 sm:p-2">
          {Object.keys(groupedHistory).length > 0 ? (
            <div className="space-y-6 p-4 sm:p-5">
              {Object.entries(groupedHistory).map(([month, txs]) => (
                <div key={month}>
                  {/* JUDUL BULAN */}
                  <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-3 pl-2">
                    {month}
                  </p>

                  {/* KARTU TRANSAKSI DALAM BULAN TERSEBUT */}
                  <div className="bg-white dark:bg-zinc-950 rounded-2xl border border-zinc-100 dark:border-zinc-800/60 overflow-hidden divide-y divide-zinc-100 dark:divide-zinc-800/60 shadow-sm">
                    {txs.map((tx) => {
                      const cat = Array.isArray(tx.categories)
                        ? tx.categories[0]
                        : tx.categories;
                      const amountNum = Number(tx.amount);

                      // LOGIKA ABSOLUT AGAR TIDAK ADA MINUS GANDA (-Rp -50.000)
                      const displayAmount = Math.abs(amountNum);

                      let displayTitle = cat?.name;
                      let Icon = TrendingUp;
                      let bgStyle =
                        "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400";
                      let operator = "+";

                      // 1. Logika untuk "Pencairan RDN"
                      if (cat?.name === "Pencairan RDN") {
                        displayTitle = "Tarik Dana";
                        Icon = ArrowDownToLine;
                        bgStyle =
                          "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400";
                        operator = "-";
                      }
                      // 2. Logika Khusus "Update Portofolio" (Sama dengan transaksi)
                      else if (cat?.name === "Update Portofolio") {
                        const isProfit = amountNum >= 0;
                        displayTitle = isProfit ? "Profit Saham" : "Loss Saham";
                        Icon = isProfit ? TrendingUp : TrendingDown;
                        bgStyle = isProfit
                          ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
                          : "bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400";
                        operator = isProfit ? "+" : "-";
                      }
                      // 3. Logika untuk "Top Up" (Semua tipe investment sisanya)
                      else if (cat?.type === "investment") {
                        displayTitle = "Topup Saham";
                        Icon = PlusCircle;
                        bgStyle =
                          "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400";
                        operator = "+";
                      }

                      return (
                        <div
                          key={tx.id}
                          className="p-4 sm:p-5 flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-zinc-900/40 transition-colors"
                        >
                          <div className="flex items-center gap-3 sm:gap-4 overflow-hidden">
                            <div
                              className={`p-2.5 rounded-xl shrink-0 ${bgStyle}`}
                            >
                              <Icon className="w-5 h-5" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-sm sm:text-base truncate text-foreground">
                                {displayTitle}
                              </p>
                              <p className="text-[11px] sm:text-xs font-medium text-muted-foreground truncate flex items-center gap-1.5 mt-1">
                                <Clock className="w-3 h-3" />
                                {new Date(
                                  tx.transaction_date,
                                ).toLocaleDateString("id-ID", {
                                  day: "numeric",
                                  month: "short",
                                })}
                                {tx.notes && (
                                  <span className="text-zinc-300 dark:text-zinc-600">
                                    •
                                  </span>
                                )}
                                {tx.notes && (
                                  <span className="font-bold text-zinc-600 dark:text-zinc-400">
                                    {tx.notes}
                                  </span>
                                )}
                              </p>
                            </div>
                          </div>
                          <div className="text-right shrink-0 pl-3">
                            {/* Mencetak nominal absolut dengan operator sesuai logika */}
                            <p
                              className={cn(
                                "font-black text-base sm:text-lg tracking-tight",
                                bgStyle.split(" ")[1],
                              )}
                            >
                              {operator}
                              {formatRupiah(displayAmount)}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center text-muted-foreground">
              Belum ada riwayat aktivitas saham.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
