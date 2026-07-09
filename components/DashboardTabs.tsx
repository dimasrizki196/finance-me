// components/DashboardTabs.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Wallet,
  HandCoins,
  TrendingUp,
  Users,
  HeartHandshake,
  PlusCircle,
  BarChart3,
  CalendarClock,
  Coins,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface DashboardTabsProps {
  totalPersonal: number;
  totalJoint: number;
  jointCash: number;
  jointRDN: number;
  personalCash: number;
  personalRDN: number;
  personalTransactions: any[];
}

export default function DashboardTabs({
  totalPersonal,
  totalJoint,
  jointCash,
  jointRDN,
  personalCash,
  personalRDN,
  personalTransactions,
}: DashboardTabsProps) {
  const [activeTab, setActiveTab] = useState<"pribadi" | "bersama">("pribadi");

  // State untuk navigasi bulan Infaq
  const [infaqDate, setInfaqDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const formatRupiah = (angka: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(angka);
  };

  const handlePrevMonth = () => {
    setInfaqDate(
      new Date(infaqDate.getFullYear(), infaqDate.getMonth() - 1, 1),
    );
  };
  const handleNextMonth = () => {
    setInfaqDate(
      new Date(infaqDate.getFullYear(), infaqDate.getMonth() + 1, 1),
    );
  };

  const monthName = infaqDate.toLocaleString("id-ID", {
    month: "long",
    year: "numeric",
  });
  const yearStr = infaqDate.getFullYear().toString();
  const monthStr = String(infaqDate.getMonth() + 1).padStart(2, "0");
  const currentMonthKey = `${yearStr}-${monthStr}`;

  // ==========================================================
  // PERBAIKAN LOGIKA INFAQ:
  // Hindari menghitung "Pencairan RDN" sebagai Pemasukan Infaq
  // ==========================================================
  const monthlyIncome =
    personalTransactions
      ?.filter((tx) => {
        const isIncomeType = tx.categories?.type === "income";
        const isCurrentMonth = tx.transaction_date?.startsWith(currentMonthKey);
        const isNotWD = tx.categories?.name !== "Pencairan RDN"; // PENTING: Mengecualikan Tarik Dana

        return isIncomeType && isCurrentMonth && isNotWD;
      })
      .reduce((acc, tx) => acc + Number(tx.amount), 0) || 0;

  const infaqAmount = monthlyIncome * 0.03;

  return (
    <div className="space-y-8 w-full">
      {/* 1. KARTU SEBAGAI TOMBOL TABS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        <div
          onClick={() => setActiveTab("pribadi")}
          className={cn(
            "cursor-pointer transition-all duration-300 rounded-xl flex flex-col h-full",
            activeTab === "pribadi"
              ? "ring-4 ring-primary/40 scale-[1.02] shadow-lg"
              : "opacity-75 hover:opacity-100 scale-100 hover:scale-[1.01]",
          )}
        >
          <Card className="w-full h-full bg-gradient-to-br from-zinc-900 to-zinc-800 text-zinc-50 border-none flex flex-col justify-between">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-zinc-300 flex items-center gap-2">
                <Wallet className="w-4 h-4" /> Total Uang Pribadi
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl sm:text-5xl font-bold mt-2">
                {formatRupiah(totalPersonal)}
              </p>
              <div className="flex flex-wrap items-center gap-4 mt-4 text-xs sm:text-sm font-semibold">
                <div className="flex items-center gap-1.5 text-zinc-300 bg-zinc-800/80 px-2.5 py-1 rounded-md">
                  <Coins className="w-3.5 h-3.5 text-emerald-400" />
                  Cash: {formatRupiah(personalCash)}
                </div>
                <div className="flex items-center gap-1.5 text-zinc-300 bg-zinc-800/80 px-2.5 py-1 rounded-md">
                  <TrendingUp className="w-3.5 h-3.5 text-purple-400" />
                  RDN: {formatRupiah(personalRDN)}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div
          onClick={() => setActiveTab("bersama")}
          className={cn(
            "cursor-pointer transition-all duration-300 rounded-xl flex flex-col h-full",
            activeTab === "bersama"
              ? "ring-4 ring-primary/40 scale-[1.02] shadow-lg"
              : "opacity-75 hover:opacity-100 scale-100 hover:scale-[1.01]",
          )}
        >
          <Card className="w-full h-full bg-gradient-to-br from-white to-zinc-50 dark:from-zinc-950 dark:to-zinc-900 border border-zinc-200 dark:border-zinc-800 text-foreground flex flex-col justify-between">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-zinc-500 flex items-center gap-2">
                <Users className="w-4 h-4" /> Total Tabungan Kita
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl sm:text-5xl font-bold mt-2">
                {formatRupiah(totalJoint)}
              </p>
              <div className="flex flex-wrap items-center gap-4 mt-4 text-xs sm:text-sm font-semibold">
                <div className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800/50 px-2.5 py-1 rounded-md">
                  <Coins className="w-3.5 h-3.5 text-emerald-500" />
                  Cash: {formatRupiah(jointCash)}
                </div>
                <div className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800/50 px-2.5 py-1 rounded-md">
                  <TrendingUp className="w-3.5 h-3.5 text-purple-500" />
                  RDN: {formatRupiah(jointRDN)}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 2. AREA KONTEN BAWAH */}
      <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
        {activeTab === "pribadi" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <h2 className="text-xl font-semibold tracking-tight">
                Menu Uang Pribadi
              </h2>
            </div>

            <Link href="/transactions?type=personal" className="block w-full">
              <Card className="bg-primary text-primary-foreground transition-transform hover:scale-[1.01] cursor-pointer flex items-center justify-center p-4 shadow-md border-none">
                <PlusCircle className="w-5 h-5 mr-2 opacity-90" />
                <h3 className="font-bold">Catat Transaksi Pribadi</h3>
              </Card>
            </Link>

            <Card className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 border border-emerald-100 dark:border-emerald-900/50 shadow-sm relative overflow-hidden">
              <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <div className="p-2.5 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 rounded-full">
                    <HeartHandshake className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-emerald-800 dark:text-emerald-300">
                      Kewajiban Infaq (3%)
                    </h3>
                    <div className="flex items-center gap-2 mt-1.5 bg-white/60 dark:bg-black/20 rounded-md border border-emerald-200 dark:border-emerald-800/50 px-2 py-0.5 w-fit">
                      <button
                        onClick={handlePrevMonth}
                        className="text-emerald-600 hover:text-emerald-800 dark:hover:text-emerald-400 p-0.5"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 min-w-[90px] text-center">
                        {monthName}
                      </span>
                      <button
                        onClick={handleNextMonth}
                        className="text-emerald-600 hover:text-emerald-800 dark:hover:text-emerald-400 p-0.5"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
                <div className="text-center sm:text-right w-full sm:w-auto bg-white/40 dark:bg-black/20 p-3 rounded-lg border border-emerald-100 dark:border-emerald-800/30">
                  <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-500">
                    {formatRupiah(infaqAmount)}
                  </p>
                  <p className="text-[10px] sm:text-xs text-emerald-600/80 dark:text-emerald-400/80 font-medium mt-0.5">
                    Dari Pemasukan Bersih: {formatRupiah(monthlyIncome)}
                  </p>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-3 gap-3 sm:gap-4">
              <Link
                href="/analytics?type=personal"
                className="block group h-full"
              >
                <Card className="h-full transition-all hover:bg-zinc-50 dark:hover:bg-zinc-900 shadow-sm">
                  <CardContent className="p-4 flex flex-col items-center justify-center text-center space-y-2 h-full">
                    <div className="p-2.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 rounded-full mb-1">
                      <BarChart3 className="w-5 h-5" />
                    </div>
                    <p className="font-semibold text-sm">Visualisasi</p>
                  </CardContent>
                </Card>
              </Link>
              <Link href="/debts" className="block group h-full">
                <Card className="h-full transition-all hover:bg-zinc-50 dark:hover:bg-zinc-900 shadow-sm">
                  <CardContent className="p-4 flex flex-col items-center justify-center text-center space-y-2 h-full">
                    <div className="p-2.5 bg-amber-100 dark:bg-amber-900/30 text-amber-600 rounded-full mb-1">
                      <HandCoins className="w-5 h-5" />
                    </div>
                    <p className="font-semibold text-sm">Pinjam-Meminjam</p>
                  </CardContent>
                </Card>
              </Link>
              <Link href="/split-bills" className="block group h-full">
                <Card className="h-full transition-all hover:bg-zinc-50 dark:hover:bg-zinc-900 shadow-sm">
                  <CardContent className="p-4 flex flex-col items-center justify-center text-center space-y-2 h-full">
                    <div className="p-2.5 bg-rose-100 dark:bg-rose-900/30 text-rose-600 rounded-full mb-1">
                      <Users className="w-5 h-5" />
                    </div>
                    <p className="font-semibold text-sm">Split Bill</p>
                  </CardContent>
                </Card>
              </Link>
            </div>
          </div>
        )}

        {activeTab === "bersama" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b pb-2">
              <h2 className="text-xl font-semibold tracking-tight">
                Menu Tabungan Kita
              </h2>
            </div>
            <Link href="/transactions?type=joint" className="block w-full">
              <Card className="bg-zinc-900 dark:bg-zinc-100 text-zinc-50 dark:text-zinc-900 transition-transform hover:scale-[1.01] cursor-pointer flex items-center justify-center p-4 shadow-md border-none">
                <PlusCircle className="w-5 h-5 mr-2 opacity-90" />
                <h3 className="font-bold">Catat Uang Bersama</h3>
              </Card>
            </Link>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
              <Link href="/analytics?type=joint" className="block group h-full">
                <Card className="h-full transition-all hover:bg-zinc-50 dark:hover:bg-zinc-900 shadow-sm">
                  <CardContent className="p-4 sm:p-5 flex flex-col items-center justify-center text-center space-y-2 h-full">
                    <div className="p-2.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 rounded-full mb-1">
                      <BarChart3 className="w-5 h-5" />
                    </div>
                    <div className="space-y-0.5">
                      <p className="font-semibold text-sm sm:text-base">
                        Visualisasi
                      </p>
                      <p className="text-[10px] sm:text-xs text-muted-foreground leading-tight">
                        Grafik Laporan
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
              <Link href="/investments" className="block group h-full">
                <Card className="h-full transition-all hover:bg-zinc-50 dark:hover:bg-zinc-900 shadow-sm">
                  <CardContent className="p-4 sm:p-5 flex flex-col items-center justify-center text-center space-y-2 h-full">
                    <div className="p-2.5 bg-purple-100 dark:bg-purple-900/30 text-purple-600 rounded-full mb-1">
                      <TrendingUp className="w-5 h-5" />
                    </div>
                    <div className="space-y-0.5">
                      <p className="font-semibold text-sm sm:text-base">
                        Saham
                      </p>
                      <p className="text-[10px] sm:text-xs text-muted-foreground leading-tight">
                        Aset Bersama
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
              <Link href="/routine-savings" className="block group h-full">
                <Card className="h-full transition-all hover:bg-zinc-50 dark:hover:bg-zinc-900 shadow-sm border-blue-200 dark:border-blue-900">
                  <CardContent className="p-4 sm:p-5 flex flex-col items-center justify-center text-center space-y-2 h-full">
                    <div className="p-2.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-full mb-1">
                      <CalendarClock className="w-5 h-5" />
                    </div>
                    <div className="space-y-0.5">
                      <p className="font-semibold text-sm sm:text-base">
                        Tabung Rutin
                      </p>
                      <p className="text-[10px] sm:text-xs text-muted-foreground leading-tight">
                        Jadwal 3 Hari Sekali
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
