// components/DashboardTabs.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Wallet,
  HandCoins,
  TrendingUp,
  Users,
  HeartHandshake,
  BarChart3,
  CalendarClock,
  Coins,
  ChevronLeft,
  ChevronRight,
  PiggyBank,
  Briefcase,
  Plus,
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
  const [isMounted, setIsMounted] = useState(false);

  const [infaqDate, setInfaqDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  useEffect(() => {
    setIsMounted(true);
    const savedTab = localStorage.getItem("dashboardActiveTab");
    if (savedTab === "pribadi" || savedTab === "bersama") {
      setActiveTab(savedTab);
    }
  }, []);

  const handleTabChange = (tab: "pribadi" | "bersama") => {
    setActiveTab(tab);
    localStorage.setItem("dashboardActiveTab", tab);
  };

  const formatRupiah = (angka: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(angka);
  };

  const handlePrevMonth = () =>
    setInfaqDate(
      new Date(infaqDate.getFullYear(), infaqDate.getMonth() - 1, 1),
    );
  const handleNextMonth = () =>
    setInfaqDate(
      new Date(infaqDate.getFullYear(), infaqDate.getMonth() + 1, 1),
    );

  const monthName = infaqDate.toLocaleString("id-ID", {
    month: "long",
    year: "numeric",
  });
  const yearStr = infaqDate.getFullYear().toString();
  const monthStr = String(infaqDate.getMonth() + 1).padStart(2, "0");
  const currentMonthKey = `${yearStr}-${monthStr}`;

  const monthlyIncome =
    personalTransactions
      ?.filter((tx) => {
        const isIncomeType = tx.categories?.type === "income";
        const isCurrentMonth = tx.transaction_date?.startsWith(currentMonthKey);
        const isNotWD = tx.categories?.name !== "Pencairan RDN";
        return isIncomeType && isCurrentMonth && isNotWD;
      })
      .reduce((acc, tx) => acc + Number(tx.amount), 0) || 0;

  const infaqAmount = monthlyIncome * 0.03;

  if (!isMounted) return null;

  return (
    <div className="space-y-4 sm:space-y-6 w-full animate-in fade-in duration-500">
      {/* 1. KARTU SEBAGAI TOMBOL TABS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* TAB PRIBADI */}
        <div
          onClick={() => handleTabChange("pribadi")}
          className={cn(
            "cursor-pointer transition-all duration-300 rounded-3xl flex flex-col h-full overflow-hidden relative",
            activeTab === "pribadi"
              ? "ring-[3px] ring-indigo-500/40 scale-[1.02] shadow-xl shadow-indigo-900/10"
              : "opacity-80 hover:opacity-100 hover:scale-[1.01]",
          )}
        >
          <Card className="w-full h-full bg-gradient-to-br from-zinc-900 to-zinc-950 text-zinc-50 border-none flex flex-col justify-between rounded-3xl relative overflow-hidden">
            <div className="absolute top-0 right-0 -mr-4 -mt-4 opacity-10 pointer-events-none">
              <Wallet className="w-24 h-24 sm:w-32 sm:h-32" />
            </div>
            <CardHeader className="p-4 sm:p-5 pb-1 sm:pb-2 relative z-10">
              <CardTitle className="text-[10px] sm:text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
                <Wallet className="w-3.5 h-3.5 text-indigo-400" /> Uang Pribadi
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-5 pt-0 relative z-10">
              <p className="text-3xl sm:text-4xl font-black tracking-tighter mt-1">
                {formatRupiah(totalPersonal)}
              </p>
              <div className="flex flex-wrap items-center gap-2 mt-3 text-[10px] sm:text-[11px] font-bold">
                <div className="flex items-center gap-1 bg-white/10 backdrop-blur-sm px-2.5 py-1 rounded-lg border border-white/5">
                  <Coins className="w-3.5 h-3.5 text-emerald-400" />
                  Tunai: {formatRupiah(personalCash)}
                </div>
                <div className="flex items-center gap-1 bg-white/10 backdrop-blur-sm px-2.5 py-1 rounded-lg border border-white/5">
                  <Briefcase className="w-3.5 h-3.5 text-indigo-400" />
                  Saham: {formatRupiah(personalRDN)}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* TAB BERSAMA */}
        <div
          onClick={() => handleTabChange("bersama")}
          className={cn(
            "cursor-pointer transition-all duration-300 rounded-3xl flex flex-col h-full overflow-hidden relative",
            activeTab === "bersama"
              ? "ring-[3px] ring-emerald-500/40 scale-[1.02] shadow-xl shadow-emerald-900/10"
              : "opacity-80 hover:opacity-100 hover:scale-[1.01]",
          )}
        >
          <Card className="w-full h-full bg-gradient-to-br from-white to-zinc-100 dark:from-zinc-900 dark:to-zinc-950 border border-zinc-200 dark:border-zinc-800 text-foreground flex flex-col justify-between rounded-3xl relative overflow-hidden">
            <div className="absolute top-0 right-0 -mr-4 -mt-4 opacity-[0.03] dark:opacity-10 pointer-events-none">
              <PiggyBank className="w-24 h-24 sm:w-32 sm:h-32" />
            </div>
            <CardHeader className="p-4 sm:p-5 pb-1 sm:pb-2 relative z-10">
              <CardTitle className="text-[10px] sm:text-xs font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-emerald-500" /> Tabungan Kita
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-5 pt-0 relative z-10">
              <p className="text-3xl sm:text-4xl font-black tracking-tighter mt-1">
                {formatRupiah(totalJoint)}
              </p>
              <div className="flex flex-wrap items-center gap-2 mt-3 text-[10px] sm:text-[11px] font-bold">
                <div className="flex items-center gap-1 bg-zinc-200/50 dark:bg-zinc-800/50 px-2.5 py-1 rounded-lg border border-zinc-200 dark:border-zinc-800">
                  <Coins className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-500" />
                  Tunai: {formatRupiah(jointCash)}
                </div>
                <div className="flex items-center gap-1 bg-zinc-200/50 dark:bg-zinc-800/50 px-2.5 py-1 rounded-lg border border-zinc-200 dark:border-zinc-800">
                  <TrendingUp className="w-3.5 h-3.5 text-purple-600 dark:text-purple-500" />
                  Saham: {formatRupiah(jointRDN)}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 2. AREA KONTEN BAWAH */}
      <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
        {activeTab === "pribadi" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-2 px-1">
              <h2 className="text-base sm:text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
                Menu Uang Pribadi
              </h2>
            </div>

            {/* TOMBOL CATAT TRANSAKSI (Gaya Baru: Dashed Outline) */}
            <Link
              href="/transactions?type=personal"
              className="block w-full group"
            >
              <div className="flex items-center justify-center gap-3 p-3.5 sm:p-4 bg-indigo-50/50 dark:bg-indigo-950/20 border-2 border-dashed border-indigo-200 dark:border-indigo-800/60 rounded-2xl hover:bg-indigo-50 dark:hover:bg-indigo-900/40 transition-all cursor-pointer">
                <div className="bg-indigo-600 text-white p-1.5 rounded-full shadow-sm group-hover:scale-110 transition-transform">
                  <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <span className="font-bold text-sm sm:text-base text-indigo-700 dark:text-indigo-400">
                  Catat Transaksi Pribadi
                </span>
              </div>
            </Link>

            {/* KARTU INFAQ */}
            <Card className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20 border border-emerald-100 dark:border-emerald-900/40 shadow-sm relative overflow-hidden rounded-2xl">
              <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <div className="p-2.5 bg-emerald-200/50 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400 rounded-xl">
                    <HeartHandshake className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm sm:text-base text-emerald-900 dark:text-emerald-300">
                      Kewajiban Infaq (3%)
                    </h3>
                    <div className="flex items-center gap-1.5 mt-1 bg-white/70 dark:bg-black/30 rounded-lg border border-emerald-200 dark:border-emerald-800/50 px-1.5 py-0.5 w-fit shadow-sm">
                      <button
                        onClick={handlePrevMonth}
                        className="text-emerald-600 hover:text-emerald-800 dark:hover:text-emerald-400 p-0.5 transition-colors"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-[11px] sm:text-xs font-bold text-emerald-800 dark:text-emerald-400 min-w-[85px] text-center">
                        {monthName}
                      </span>
                      <button
                        onClick={handleNextMonth}
                        className="text-emerald-600 hover:text-emerald-800 dark:hover:text-emerald-400 p-0.5 transition-colors"
                      >
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
                <div className="text-center sm:text-right w-full sm:w-auto bg-white/60 dark:bg-black/30 px-4 py-2.5 rounded-xl border border-emerald-100 dark:border-emerald-800/40 shadow-sm">
                  <p className="text-xl sm:text-2xl font-black tracking-tighter text-emerald-700 dark:text-emerald-500">
                    {formatRupiah(infaqAmount)}
                  </p>
                  <p className="text-[10px] sm:text-[11px] text-emerald-700/70 dark:text-emerald-400/70 font-bold mt-0.5 uppercase tracking-wider">
                    Pemasukan Bersih
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* GRID MENU BAWAH */}
            <div className="grid grid-cols-3 gap-3">
              <Link
                href="/analytics?type=personal"
                className="block group h-full"
              >
                <Card className="h-full transition-all hover:border-indigo-500/50 dark:hover:bg-zinc-900/50 shadow-sm rounded-2xl border-zinc-200 dark:border-zinc-800">
                  <CardContent className="p-3.5 sm:p-4 flex flex-col items-center justify-center text-center space-y-2 h-full">
                    <div className="p-2.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded-xl group-hover:scale-110 transition-transform">
                      <BarChart3 className="w-4 h-4" />
                    </div>
                    <p className="font-bold text-[10px] sm:text-[11px] uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                      Visualisasi
                    </p>
                  </CardContent>
                </Card>
              </Link>
              <Link href="/debts" className="block group h-full">
                <Card className="h-full transition-all hover:border-amber-500/50 dark:hover:bg-zinc-900/50 shadow-sm rounded-2xl border-zinc-200 dark:border-zinc-800">
                  <CardContent className="p-3.5 sm:p-4 flex flex-col items-center justify-center text-center space-y-2 h-full">
                    <div className="p-2.5 bg-amber-50 dark:bg-amber-900/30 text-amber-600 rounded-xl group-hover:scale-110 transition-transform">
                      <HandCoins className="w-4 h-4" />
                    </div>
                    <p className="font-bold text-[10px] sm:text-[11px] uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                      Pinjam-Meminjam
                    </p>
                  </CardContent>
                </Card>
              </Link>
              <Link href="/split-bills" className="block group h-full">
                <Card className="h-full transition-all hover:border-rose-500/50 dark:hover:bg-zinc-900/50 shadow-sm rounded-2xl border-zinc-200 dark:border-zinc-800">
                  <CardContent className="p-3.5 sm:p-4 flex flex-col items-center justify-center text-center space-y-2 h-full">
                    <div className="p-2.5 bg-rose-50 dark:bg-rose-900/30 text-rose-600 rounded-xl group-hover:scale-110 transition-transform">
                      <Users className="w-4 h-4" />
                    </div>
                    <p className="font-bold text-[10px] sm:text-[11px] uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                      Split Bill
                    </p>
                  </CardContent>
                </Card>
              </Link>
            </div>
          </div>
        )}

        {activeTab === "bersama" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-2 px-1">
              <h2 className="text-base sm:text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
                Menu Tabungan Kita
              </h2>
            </div>

            {/* TOMBOL CATAT TRANSAKSI BERSAMA (Gaya Baru: Dashed Outline) */}
            <Link
              href="/transactions?type=joint"
              className="block w-full group"
            >
              <div className="flex items-center justify-center gap-3 p-3.5 sm:p-4 bg-emerald-50/50 dark:bg-emerald-950/20 border-2 border-dashed border-emerald-200 dark:border-emerald-800/60 rounded-2xl hover:bg-emerald-50 dark:hover:bg-emerald-900/40 transition-all cursor-pointer">
                <div className="bg-emerald-600 text-white p-1.5 rounded-full shadow-sm group-hover:scale-110 transition-transform">
                  <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <span className="font-bold text-sm sm:text-base text-emerald-700 dark:text-emerald-400">
                  Catat Transaksi Bersama
                </span>
              </div>
            </Link>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <Link href="/analytics?type=joint" className="block group h-full">
                <Card className="h-full transition-all hover:border-indigo-500/50 dark:hover:bg-zinc-900/50 shadow-sm rounded-2xl border-zinc-200 dark:border-zinc-800">
                  <CardContent className="p-3.5 sm:p-4 flex flex-col items-center justify-center text-center space-y-2 h-full">
                    <div className="p-2.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded-xl group-hover:scale-110 transition-transform">
                      <BarChart3 className="w-4 h-4" />
                    </div>
                    <div className="space-y-0.5">
                      <p className="font-bold text-[10px] sm:text-[11px] uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                        Visualisasi
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
              <Link href="/investments" className="block group h-full">
                <Card className="h-full transition-all hover:border-purple-500/50 dark:hover:bg-zinc-900/50 shadow-sm rounded-2xl border-zinc-200 dark:border-zinc-800">
                  <CardContent className="p-3.5 sm:p-4 flex flex-col items-center justify-center text-center space-y-2 h-full">
                    <div className="p-2.5 bg-purple-50 dark:bg-purple-900/30 text-purple-600 rounded-xl group-hover:scale-110 transition-transform">
                      <TrendingUp className="w-4 h-4" />
                    </div>
                    <div className="space-y-0.5">
                      <p className="font-bold text-[10px] sm:text-[11px] uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                        Aset Saham
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
              <Link
                href="/routine-savings"
                className="block group h-full col-span-2 sm:col-span-1"
              >
                <Card className="h-full transition-all hover:border-blue-500/50 bg-blue-50/50 dark:bg-blue-950/10 shadow-sm border-blue-100 dark:border-blue-900/50 rounded-2xl">
                  <CardContent className="p-3.5 sm:p-4 flex flex-col items-center justify-center text-center space-y-2 h-full">
                    <div className="p-2.5 bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-xl group-hover:scale-110 transition-transform shadow-sm">
                      <CalendarClock className="w-4 h-4" />
                    </div>
                    <div className="space-y-0.5">
                      <p className="font-bold text-[10px] sm:text-[11px] uppercase tracking-wider text-blue-800 dark:text-blue-300">
                        Tabung Rutin
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
