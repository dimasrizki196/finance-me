// app/debts/page.tsx
import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  CheckCircle2,
  CircleDashed,
  ArrowRight,
  Clock,
  Wallet,
  Receipt,
  History,
} from "lucide-react";
import { markAsPaid } from "./actions";
import DebtForm from "@/components/DebtForm";

export const dynamic = "force-dynamic";

export default async function DebtsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: debts } = await supabase
    .from("debts")
    .select("*")
    .order("created_at", { ascending: false });

  const pendingDebts = debts?.filter((d) => d.status === "pending") || [];
  const paidDebts = debts?.filter((d) => d.status === "paid") || [];

  let puttOwesDimm = 0;
  let dimmOwesPutt = 0;
  let puttOwesTab = 0;
  let dimmOwesTab = 0;
  let tabOwesPutt = 0;
  let tabOwesDimm = 0;

  pendingDebts.forEach((d) => {
    if (d.borrower === "putt" && d.lender === "dimm")
      puttOwesDimm += Number(d.amount);
    else if (d.borrower === "dimm" && d.lender === "putt")
      dimmOwesPutt += Number(d.amount);
    else if (d.borrower === "putt" && d.lender === "tabungan")
      puttOwesTab += Number(d.amount);
    else if (d.borrower === "dimm" && d.lender === "tabungan")
      dimmOwesTab += Number(d.amount);
    else if (d.borrower === "tabungan" && d.lender === "putt")
      tabOwesPutt += Number(d.amount);
    else if (d.borrower === "tabungan" && d.lender === "dimm")
      tabOwesDimm += Number(d.amount);
  });

  const summaries = [
    {
      title: "Putri Pinjam ke Dimas",
      amount: puttOwesDimm,
      bg: "from-rose-500 to-rose-600",
      shadow: "shadow-rose-500/20",
    },
    {
      title: "Dimas Pinjam ke Putri",
      amount: dimmOwesPutt,
      bg: "from-blue-500 to-blue-600",
      shadow: "shadow-blue-500/20",
    },
    {
      title: "Putri Pakai Tabungan Kita",
      amount: puttOwesTab,
      bg: "from-fuchsia-500 to-purple-600",
      shadow: "shadow-purple-500/20",
    },
    {
      title: "Dimas Pakai Tabungan Kita",
      amount: dimmOwesTab,
      bg: "from-cyan-500 to-blue-600",
      shadow: "shadow-cyan-500/20",
    },
    {
      title: "Tabungan Pakai Uang Putri",
      amount: tabOwesPutt,
      bg: "from-emerald-500 to-teal-600",
      shadow: "shadow-emerald-500/20",
    },
    {
      title: "Tabungan Pakai Uang Dimas",
      amount: tabOwesDimm,
      bg: "from-teal-600 to-emerald-700",
      shadow: "shadow-teal-500/20",
    },
  ].filter((s) => s.amount > 0);

  const formatRupiah = (angka: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(angka);
  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  const getEntityStyling = (entity: string) => {
    if (entity === "putt")
      return {
        name: "Putri",
        color: "text-rose-600 bg-rose-100 dark:bg-rose-900/40",
      };
    if (entity === "dimm")
      return {
        name: "Dimas",
        color: "text-blue-600 bg-blue-100 dark:bg-blue-900/40",
      };
    return {
      name: "Tabungan",
      color: "text-emerald-600 bg-emerald-100 dark:bg-emerald-900/40",
    };
  };

  return (
    <div className="p-4 sm:p-6 lg:p-10 max-w-7xl mx-auto space-y-8 w-full animate-in fade-in duration-700">
      {/* HEADER YANG LEBIH BESAR & BERSIH */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-zinc-100 dark:border-zinc-800">
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button
              variant="outline"
              size="icon"
              className="h-12 w-12 rounded-full shadow-sm hover:bg-zinc-100 dark:hover:bg-zinc-800 border-zinc-200"
            >
              <ArrowLeft className="w-5 h-5 text-zinc-600 dark:text-zinc-300" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-black tracking-tight text-foreground">
              Pinjam Meminjam
            </h1>
            <p className="text-sm font-medium text-muted-foreground mt-1 flex items-center gap-1.5">
              <Receipt className="w-4 h-4" /> Manajemen Hutang & Talangan
            </p>
          </div>
        </div>

        {/* TOMBOL UTAMA DI KANAN ATAS (Pasti Muncul) */}
        <div className="w-full sm:w-auto">
          <DebtForm className="w-full sm:w-auto h-12 px-6" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* KIRI: KARTU RINGKASAN & DAFTAR AKTIF */}
        <div className="lg:col-span-8 space-y-8">
          {/* KARTU RINGKASAN DINAMIS */}
          {summaries.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {summaries.map((summary, idx) => (
                <Card
                  key={idx}
                  className={`bg-gradient-to-br ${summary.bg} text-white border-none shadow-xl ${summary.shadow} rounded-3xl relative overflow-hidden transition-transform hover:scale-[1.02]`}
                >
                  <div className="absolute top-0 right-0 -mr-6 -mt-6 opacity-20">
                    <Wallet className="w-32 h-32" />
                  </div>
                  <CardContent className="p-6 sm:p-8 relative z-10">
                    <p className="text-white/90 font-bold text-xs mb-2 uppercase tracking-widest">
                      {summary.title}
                    </p>
                    <p className="text-4xl sm:text-5xl font-black tracking-tighter">
                      {formatRupiah(summary.amount)}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="p-8 bg-zinc-50 dark:bg-zinc-900/30 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl flex flex-col items-center justify-center text-center gap-4 min-h-[200px]">
              <div className="p-4 bg-white dark:bg-zinc-900 shadow-sm rounded-full text-zinc-400">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h3 className="font-bold text-xl text-foreground">
                  Semuanya Lunas!
                </h3>
                <p className="text-sm font-medium text-muted-foreground mt-1">
                  Tidak ada saldo pinjaman yang aktif saat ini.
                </p>
              </div>
            </div>
          )}

          {/* DAFTAR BELUM LUNAS */}
          {pendingDebts.length > 0 && (
            <div className="space-y-5">
              <h2 className="text-xl font-bold flex items-center gap-2 text-foreground">
                <CircleDashed className="w-6 h-6 text-amber-500" /> Tagihan
                Belum Lunas
              </h2>

              <div className="grid grid-cols-1 gap-4">
                {pendingDebts.map((debt) => {
                  const borrower = getEntityStyling(debt.borrower);
                  const lender = getEntityStyling(debt.lender);
                  return (
                    <Card
                      key={debt.id}
                      className="shadow-sm border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden hover:border-indigo-500/50 transition-colors"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 sm:p-6 gap-5">
                        <div className="space-y-3">
                          <p className="font-black text-lg sm:text-xl text-foreground leading-tight">
                            {debt.description}
                          </p>
                          <div className="flex flex-wrap items-center gap-3 text-sm font-semibold">
                            <span className="flex items-center gap-1.5 text-zinc-500">
                              <Clock className="w-4 h-4" />{" "}
                              {formatDate(debt.created_at)}
                            </span>
                            <div className="w-1.5 h-1.5 rounded-full bg-zinc-300 dark:bg-zinc-700 hidden sm:block"></div>
                            <div className="flex items-center gap-2">
                              <span
                                className={`px-2.5 py-1 rounded-md ${borrower.color}`}
                              >
                                {borrower.name}
                              </span>
                              <ArrowRight className="w-4 h-4 text-zinc-400" />
                              <span
                                className={`px-2.5 py-1 rounded-md ${lender.color}`}
                              >
                                {lender.name}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col sm:items-end gap-3 border-t sm:border-t-0 pt-4 sm:pt-0 border-zinc-100 dark:border-zinc-800">
                          <p className="text-2xl sm:text-3xl font-black">
                            {formatRupiah(Number(debt.amount))}
                          </p>
                          <form
                            action={markAsPaid}
                            className="w-full sm:w-auto"
                          >
                            <input type="hidden" name="id" value={debt.id} />
                            <Button
                              type="submit"
                              className="w-full sm:w-auto bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-xl font-bold h-11 px-5 transition-transform active:scale-95"
                            >
                              <CheckCircle2 className="w-5 h-5 mr-2" />
                              Tandai Lunas
                            </Button>
                          </form>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* KANAN: RIWAYAT SUDAH LUNAS */}
        <div className="lg:col-span-4 space-y-5 lg:pl-8 lg:border-l border-zinc-100 dark:border-zinc-800 h-full">
          <h2 className="text-xl font-bold flex items-center gap-2 text-foreground">
            <History className="w-6 h-6 text-emerald-500" /> Riwayat Lunas
          </h2>

          {paidDebts.length > 0 ? (
            <div className="space-y-3">
              {paidDebts.map((debt) => {
                const borrower = getEntityStyling(debt.borrower);
                const lender = getEntityStyling(debt.lender);
                return (
                  <div
                    key={debt.id}
                    className="flex flex-col p-4 bg-zinc-50 dark:bg-zinc-900/40 rounded-2xl border border-zinc-100 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <p className="text-sm font-bold line-through text-zinc-500 dark:text-zinc-400">
                        {debt.description}
                      </p>
                      <p className="text-sm font-black text-zinc-400 dark:text-zinc-500">
                        {formatRupiah(Number(debt.amount))}
                      </p>
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <p className="text-[11px] font-semibold text-zinc-400 bg-white dark:bg-zinc-950 px-2.5 py-1 rounded-md shadow-sm border border-zinc-100 dark:border-zinc-800">
                        {formatDate(debt.created_at)}
                      </p>
                      <div className="flex items-center gap-1.5 text-[11px] font-bold">
                        <span
                          className={`px-2 py-0.5 rounded-md bg-white dark:bg-zinc-950 shadow-sm ${borrower.color.split(" ")[0]}`}
                        >
                          {borrower.name.substring(0, 3)}
                        </span>
                        <ArrowRight className="w-3 h-3 text-zinc-300" />
                        <span
                          className={`px-2 py-0.5 rounded-md bg-white dark:bg-zinc-950 shadow-sm ${lender.color.split(" ")[0]}`}
                        >
                          {lender.name.substring(0, 3)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-6 bg-zinc-50 dark:bg-zinc-900/30 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 text-center">
              <p className="text-sm font-medium text-muted-foreground">
                Belum ada riwayat pinjaman.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
