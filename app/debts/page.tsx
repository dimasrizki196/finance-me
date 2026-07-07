// app/debts/page.tsx
import { redirect } from "next/navigation";
import Link from "next/link";
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
  HandCoins,
  CheckCircle2,
  CircleDashed,
  ArrowRight,
  Clock,
  Wallet,
} from "lucide-react";
import { markAsPaid } from "./actions";

export const dynamic = "force-dynamic";

export default async function DebtsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Ambil data hutang dari database
  const { data: debts } = await supabase
    .from("debts")
    .select("*")
    .order("created_at", { ascending: false });

  const pendingDebts = debts?.filter((d) => d.status === "pending") || [];
  const paidDebts = debts?.filter((d) => d.status === "paid") || [];

  // Kalkulasi total yang belum lunas
  let puttOwesDimm = 0;
  let dimmOwesPutt = 0;

  pendingDebts.forEach((d) => {
    if (d.borrower === "putt" && d.lender === "dimm")
      puttOwesDimm += Number(d.amount);
    if (d.borrower === "dimm" && d.lender === "putt")
      dimmOwesPutt += Number(d.amount);
  });

  const formatRupiah = (angka: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(angka);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-6 w-full animate-in fade-in duration-700">
      {/* HEADER NAVIGASI */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
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
              Catatan Kasbon
            </h1>
            <p className="text-sm text-muted-foreground flex items-center gap-1.5">
              <HandCoins className="w-4 h-4" /> Manajemen Pinjaman Kita
            </p>
          </div>
        </div>
      </div>

      {/* GRID UTAMA (2 Kolom di Desktop, 1 Kolom di Mobile) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        {/* KIRI: RINGKASAN & TAGIHAN AKTIF (Porsi Lebih Besar) */}
        <div className="lg:col-span-8 space-y-6">
          {/* KARTU RINGKASAN (Side-by-side) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Kartu Hutang Putri */}
            <Card className="bg-gradient-to-br from-rose-500 to-rose-700 text-white border-none shadow-md hover:shadow-lg transition-shadow relative overflow-hidden">
              <div className="absolute top-0 right-0 -mr-4 -mt-4 opacity-20">
                <Wallet className="w-24 h-24" />
              </div>
              <CardContent className="p-5 sm:p-6 relative z-10">
                <p className="text-rose-100 font-medium text-sm mb-1 uppercase tracking-wider">
                  Putri Pinjam ke Dimas
                </p>
                <p className="text-3xl sm:text-4xl font-black tracking-tight">
                  {formatRupiah(puttOwesDimm)}
                </p>
              </CardContent>
            </Card>

            {/* Kartu Hutang Dimas */}
            <Card className="bg-gradient-to-br from-blue-500 to-blue-700 text-white border-none shadow-md hover:shadow-lg transition-shadow relative overflow-hidden">
              <div className="absolute top-0 right-0 -mr-4 -mt-4 opacity-20">
                <Wallet className="w-24 h-24" />
              </div>
              <CardContent className="p-5 sm:p-6 relative z-10">
                <p className="text-blue-100 font-medium text-sm mb-1 uppercase tracking-wider">
                  Dimas Pinjam ke Putri
                </p>
                <p className="text-3xl sm:text-4xl font-black tracking-tight">
                  {formatRupiah(dimmOwesPutt)}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* DAFTAR BELUM LUNAS */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold flex items-center gap-2 text-foreground">
              <CircleDashed className="w-5 h-5 text-amber-500" /> Tagihan Aktif
            </h2>

            {pendingDebts.length > 0 ? (
              <div className="grid grid-cols-1 gap-3 sm:gap-4">
                {pendingDebts.map((debt) => (
                  <Card
                    key={debt.id}
                    className="shadow-sm border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all overflow-hidden group"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-5 gap-4">
                      {/* Info Hutang */}
                      <div className="space-y-1">
                        <p className="font-bold text-base sm:text-lg text-foreground">
                          {debt.description}
                        </p>
                        <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground font-medium">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />{" "}
                            {formatDate(debt.created_at)}
                          </span>
                          <span>•</span>
                          <div className="flex items-center gap-1.5 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-md">
                            <span
                              className={
                                debt.borrower === "putt"
                                  ? "text-rose-500 font-bold"
                                  : "text-blue-500 font-bold"
                              }
                            >
                              {debt.borrower === "putt" ? "Putri" : "Dimas"}
                            </span>
                            <ArrowRight className="w-3.5 h-3.5 text-zinc-400" />
                            <span
                              className={
                                debt.lender === "putt"
                                  ? "text-rose-500 font-bold"
                                  : "text-blue-500 font-bold"
                              }
                            >
                              {debt.lender === "putt" ? "Putri" : "Dimas"}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Nominal & Tombol */}
                      <div className="flex items-center justify-between sm:justify-end gap-5 border-t sm:border-t-0 pt-4 sm:pt-0 border-zinc-100 dark:border-zinc-800">
                        <p className="text-xl sm:text-2xl font-black">
                          {formatRupiah(Number(debt.amount))}
                        </p>
                        <form action={markAsPaid}>
                          <input type="hidden" name="id" value={debt.id} />
                          <Button
                            type="submit"
                            className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl shadow-sm h-10 px-4 transition-transform active:scale-95"
                          >
                            <CheckCircle2 className="w-4 h-4 sm:mr-2" />
                            <span className="hidden sm:inline">
                              Tandai Lunas
                            </span>
                          </Button>
                        </form>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-8 bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 text-center space-y-3">
                <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-full">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground">
                    Hore! Semuanya Lunas.
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Tidak ada kasbon yang menggantung di antara kalian berdua
                    saat ini.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* KANAN: RIWAYAT SUDAH LUNAS (Sidebar di Desktop) */}
        <div className="lg:col-span-4 space-y-4 pt-4 lg:pt-0 lg:pl-6 lg:border-l border-zinc-200 dark:border-zinc-800 h-full">
          <h2 className="text-lg font-bold flex items-center gap-2 text-foreground">
            <CheckCircle2 className="w-5 h-5 text-emerald-500" /> Riwayat Lunas
          </h2>

          {paidDebts.length > 0 ? (
            <div className="space-y-3 opacity-80 hover:opacity-100 transition-opacity">
              {paidDebts.map((debt) => (
                <div
                  key={debt.id}
                  className="flex flex-col p-3.5 bg-zinc-50 dark:bg-zinc-900/50 rounded-xl border border-zinc-100 dark:border-zinc-800/80"
                >
                  <div className="flex justify-between items-start mb-1">
                    <p className="text-sm font-semibold line-through text-zinc-500 decoration-zinc-400">
                      {debt.description}
                    </p>
                    <p className="text-sm font-bold text-zinc-400">
                      {formatRupiah(Number(debt.amount))}
                    </p>
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <p className="text-[10px] sm:text-xs font-medium text-zinc-400 bg-white dark:bg-zinc-950 px-2 py-0.5 rounded border border-zinc-200 dark:border-zinc-800">
                      Lunas: {formatDate(debt.created_at)}
                    </p>
                    <div className="flex items-center gap-1 text-[10px] font-bold">
                      <span
                        className={
                          debt.borrower === "putt"
                            ? "text-rose-400"
                            : "text-blue-400"
                        }
                      >
                        {debt.borrower === "putt" ? "P" : "D"}
                      </span>
                      <ArrowRight className="w-2.5 h-2.5 text-zinc-300" />
                      <span
                        className={
                          debt.lender === "putt"
                            ? "text-rose-400"
                            : "text-blue-400"
                        }
                      >
                        {debt.lender === "putt" ? "P" : "D"}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center p-6 bg-zinc-50 dark:bg-zinc-900/50 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800">
              <p className="text-sm text-muted-foreground">
                Belum ada riwayat pinjaman yang dilunasi.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
