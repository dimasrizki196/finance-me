// app/routine-savings/RoutineSavingsClient.tsx
"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft,
  CalendarClock,
  Target,
  Check,
  ChevronLeft,
  ChevronRight,
  UserCircle2,
  Users2,
  PiggyBank,
  Loader2,
} from "lucide-react";
import { createTransaction } from "@/app/actions";
import { cn } from "@/lib/utils";

interface RoutineSavingsClientProps {
  wallet: any;
  incomeCategoryId: string;
  transactions: any[];
  currentMonth: number;
  currentYear: number;
}

export default function RoutineSavingsClient({
  wallet,
  incomeCategoryId,
  transactions,
  currentMonth,
  currentYear,
}: RoutineSavingsClientProps) {
  const [nominal, setNominal] = useState<number>(5000);
  const [isPending, startTransition] = useTransition();
  const [loadingState, setLoadingState] = useState<string | null>(null);

  const lastDayOfMonth = new Date(currentYear, currentMonth, 0).getDate();
  const routineDays = [3, 6, 9, 12, 15, 18, 21, 24, 27, 30].filter(
    (day) => day <= lastDayOfMonth,
  );

  const formatRupiah = (angka: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(angka);
  };

  const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
  const prevYear = currentMonth === 1 ? currentYear - 1 : currentYear;
  const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1;
  const nextYear = currentMonth === 12 ? currentYear + 1 : currentYear;
  const monthName = new Date(currentYear, currentMonth - 1).toLocaleString(
    "id-ID",
    { month: "long", year: "numeric" },
  );

  const isPaidByPerson = (day: number, person: "dimm" | "putt") => {
    return transactions.some(
      (tx) =>
        tx.notes === `Tabungan Rutin Hari Ke-${day} (${person})` ||
        tx.notes === `Tabungan Rutin Hari Ke-${day} (Pihak ${person})`,
    );
  };

  const paidTransactions = transactions.filter((tx) =>
    tx.notes?.startsWith("Tabungan Rutin Hari Ke-"),
  );
  const totalSavedAmount = paidTransactions.reduce(
    (acc, tx) => acc + Number(tx.amount),
    0,
  );
  const projectedTotal = routineDays.length * nominal * 2;

  const handleSave = async (day: number, person: "dimm" | "putt") => {
    setLoadingState(`${day}-${person}`);

    const formData = new FormData();
    formData.append("amount", nominal.toString());
    formData.append("category_id", incomeCategoryId);
    formData.append("wallet_id", wallet.id);

    const dateStr = `${currentYear}-${String(currentMonth).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    formData.append("transaction_date", dateStr);
    formData.append("notes", `Tabungan Rutin Hari Ke-${day} (${person})`);

    startTransition(async () => {
      try {
        await createTransaction(formData);
      } catch (e) {
        alert("Gagal mencatat tabungan.");
      } finally {
        setLoadingState(null);
      }
    });
  };

  return (
    <div className="space-y-6 w-full">
      {/* HEADER COMPACT */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-100 dark:border-zinc-800">
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
              Tabungan Rutin
            </h1>
            <p className="text-xs sm:text-sm font-medium text-muted-foreground flex items-center gap-1.5">
              <CalendarClock className="w-3.5 h-3.5" /> Sistem Ganda Pasangan
            </p>
          </div>
        </div>

        {/* NAVIGASI WAKTU */}
        <div className="flex items-center justify-between bg-zinc-50 dark:bg-zinc-900/50 p-1.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm w-full sm:w-auto min-w-[260px]">
          <Link href={`?month=${prevMonth}&year=${prevYear}`}>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-xl hover:bg-white dark:hover:bg-zinc-800"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div className="flex items-center gap-2 font-bold text-sm text-indigo-600 dark:text-indigo-400">
            <CalendarClock className="w-4 h-4" /> {monthName}
          </div>
          <Link href={`?month=${nextMonth}&year=${nextYear}`}>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-xl hover:bg-white dark:hover:bg-zinc-800"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>

      {/* KARTU PENGATURAN & RINGKASAN */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
        <Card className="md:col-span-5 shadow-sm border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden h-full bg-zinc-50 dark:bg-zinc-900/40">
          <CardHeader className="p-5 pb-2">
            <CardTitle className="text-sm flex items-center gap-2 font-bold">
              <Target className="w-4 h-4 text-orange-500" /> Target Per Orang
            </CardTitle>
            <CardDescription className="text-xs font-medium">
              Nominal setoran per 3 hari.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-5 pt-2">
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 font-bold text-sm">
                Rp
              </span>
              <Input
                type="number"
                value={nominal}
                onChange={(e) => setNominal(Number(e.target.value))}
                className="pl-11 pr-4 text-xl font-black h-14 rounded-2xl bg-white dark:bg-zinc-950 border-zinc-200 focus-visible:ring-indigo-500 shadow-sm"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-7 bg-gradient-to-br from-indigo-500 to-indigo-700 text-white border-none shadow-xl shadow-indigo-500/20 rounded-3xl relative overflow-hidden h-full">
          <div className="absolute top-0 right-0 -mr-4 -mt-4 opacity-20">
            <PiggyBank className="w-24 h-24" />
          </div>
          <CardHeader className="p-6 pb-2 relative z-10">
            <CardTitle className="text-xs font-bold uppercase tracking-widest text-indigo-100">
              Terkumpul Bulan Ini
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 pt-0 relative z-10">
            <p className="text-4xl sm:text-5xl font-black tracking-tighter">
              {formatRupiah(totalSavedAmount)}
            </p>
            <div className="mt-3 flex items-center gap-2">
              <div className="h-1.5 flex-1 bg-white/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white rounded-full transition-all duration-1000"
                  style={{
                    width: `${Math.min((totalSavedAmount / projectedTotal) * 100, 100)}%`,
                  }}
                />
              </div>
              <p className="text-xs font-bold text-indigo-100 whitespace-nowrap">
                Dari {formatRupiah(projectedTotal)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* GRID JADWAL */}
      <div className="pt-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 px-1">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Check className="w-5 h-5 text-emerald-500" /> Checklist Setoran
          </h2>
          <div className="flex gap-3 text-xs font-bold text-zinc-500">
            <span className="flex items-center gap-1.5 px-2 py-1 bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 rounded-lg">
              <UserCircle2 className="w-3.5 h-3.5" /> Dimas
            </span>
            <span className="flex items-center gap-1.5 px-2 py-1 bg-rose-50 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400 rounded-lg">
              <Users2 className="w-3.5 h-3.5" /> Putri
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {routineDays.map((day) => {
            const isP1Paid = isPaidByPerson(day, "dimm");
            const isP2Paid = isPaidByPerson(day, "putt");
            const isAllPaid = isP1Paid && isP2Paid;

            return (
              <Card
                key={day}
                className={cn(
                  "overflow-hidden transition-all duration-300 rounded-2xl border",
                  isAllPaid
                    ? "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/50 shadow-none"
                    : "bg-white dark:bg-zinc-950 shadow-sm border-zinc-200 dark:border-zinc-800",
                )}
              >
                <CardHeader className="py-2.5 px-4 bg-zinc-50/50 dark:bg-zinc-900/20 border-b border-zinc-100 dark:border-zinc-800 flex flex-row items-center justify-between">
                  <p className="text-[11px] text-zinc-500 font-bold uppercase tracking-wider">
                    Hari Ke-{day}
                  </p>
                  <p className="font-black text-foreground">Tgl {day}</p>
                </CardHeader>

                <CardContent className="p-3.5 space-y-2.5">
                  {/* BARIS DIMAS */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded-md">
                      Dimm
                    </span>
                    {isP1Paid ? (
                      <div className="flex items-center gap-1 text-xs font-bold text-emerald-600">
                        <Check className="w-4 h-4" /> Lunas
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => handleSave(day, "dimm")}
                        disabled={loadingState === `${day}-dimm` || isPending}
                        className="h-8 text-xs font-bold px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-transform active:scale-95"
                      >
                        {loadingState === `${day}-dimm` ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          "Setor"
                        )}
                      </Button>
                    )}
                  </div>

                  {/* BARIS PUTRI */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/30 px-2 py-1 rounded-md">
                      Putt
                    </span>
                    {isP2Paid ? (
                      <div className="flex items-center gap-1 text-xs font-bold text-emerald-600">
                        <Check className="w-4 h-4" /> Lunas
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => handleSave(day, "putt")}
                        disabled={loadingState === `${day}-putt` || isPending}
                        className="h-8 text-xs font-bold px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white transition-transform active:scale-95"
                      >
                        {loadingState === `${day}-putt` ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          "Setor"
                        )}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
