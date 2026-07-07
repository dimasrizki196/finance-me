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
} from "lucide-react";
import { createTransaction } from "@/app/actions";

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

  // Navigasi Waktu
  const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
  const prevYear = currentMonth === 1 ? currentYear - 1 : currentYear;
  const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1;
  const nextYear = currentMonth === 12 ? currentYear + 1 : currentYear;
  const monthName = new Date(currentYear, currentMonth - 1).toLocaleString(
    "id-ID",
    { month: "long", year: "numeric" },
  );

  // Pengecekan Ceklis (Membaca catatan dari database)
  const isPaidByPerson = (day: number, person: "dimm" | "putt") => {
    return transactions.some(
      (tx) =>
        tx.notes === `Tabungan Rutin Hari Ke-${day} (${person})` ||
        tx.notes === `Tabungan Rutin Hari Ke-${day} (Pihak ${person})`,
    );
  };

  // Kalkulasi Progres
  const paidTransactions = transactions.filter((tx) =>
    tx.notes?.startsWith("Tabungan Rutin Hari Ke-"),
  );
  const totalSavedAmount = paidTransactions.reduce(
    (acc, tx) => acc + Number(tx.amount),
    0,
  );
  const projectedTotal = routineDays.length * nominal * 2; // Dikali 2 karena 2 orang menyetor

  const handleSave = async (day: number, person: "dimm" | "putt") => {
    setLoadingState(`${day}-${person}`);

    const formData = new FormData();
    formData.append("amount", nominal.toString());
    formData.append("category_id", incomeCategoryId);
    formData.append("wallet_id", wallet.id);

    const dateStr = `${currentYear}-${String(currentMonth).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    formData.append("transaction_date", dateStr);

    // Trik membedakan setoran
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
      {/* HEADER & NAVIGASI BULAN */}
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
              Tabungan Rutin
            </h1>
            <p className="text-sm text-muted-foreground flex items-center gap-1.5">
              <CalendarClock className="w-3.5 h-3.5" />
              Sistem Ganda (Anda & Pasangan)
            </p>
          </div>
        </div>

        {/* Pemilih Bulan */}
        <div className="flex items-center justify-between bg-white dark:bg-zinc-950 p-1.5 rounded-lg border shadow-sm w-full md:w-auto min-w-[250px]">
          <Link href={`?month=${prevMonth}&year=${prevYear}`}>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ChevronLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div className="flex items-center gap-2 font-medium text-sm">
            <CalendarClock className="w-4 h-4 text-muted-foreground" />
            {monthName}
          </div>
          <Link href={`?month=${nextMonth}&year=${nextYear}`}>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ChevronRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>

      {/* KARTU PENGATURAN & RINGKASAN */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-white dark:bg-zinc-950 shadow-sm border-zinc-200 dark:border-zinc-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="w-4 h-4 text-primary" /> Target Per Orang (Per
              3 Hari)
            </CardTitle>
            <CardDescription>
              Nominal yang disetor masing-masing pihak.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
                Rp
              </span>
              <Input
                type="number"
                value={nominal}
                onChange={(e) => setNominal(Number(e.target.value))}
                className="pl-9 text-lg font-bold h-12 rounded-xl"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/30 dark:to-zinc-950 border-blue-100 dark:border-blue-900/50 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-600 dark:text-blue-400">
              Total Gabungan Bulan Ini
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-blue-700 dark:text-blue-500">
              {formatRupiah(totalSavedAmount)}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Dari estimasi target: {formatRupiah(projectedTotal)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* GRID JADWAL 10 HARI (Ceklis Ganda) */}
      <div className="pt-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold tracking-tight">
            Checklist Setoran
          </h2>
          <div className="flex gap-4 text-xs font-medium text-muted-foreground">
            <span className="flex items-center gap-1">
              <UserCircle2 className="w-4 h-4" /> Dimm
            </span>
            <span className="flex items-center gap-1">
              <Users2 className="w-4 h-4" /> Putt
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {routineDays.map((day) => {
            const isP1Paid = isPaidByPerson(day, "dimm");
            const isP2Paid = isPaidByPerson(day, "putt");

            // Kartu menyala hijau sepenuhnya jika keduanya sudah membayar
            const isAllPaid = isP1Paid && isP2Paid;

            return (
              <Card
                key={day}
                className={`overflow-hidden transition-all duration-300 ${isAllPaid ? "bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/50" : "bg-white dark:bg-zinc-950 shadow-sm"}`}
              >
                <CardHeader className="py-3 bg-zinc-50 dark:bg-zinc-900/50 border-b text-center">
                  <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
                    Hari Ke-{day}
                  </p>
                  <p className="font-bold text-foreground">Tgl {day}</p>
                </CardHeader>

                <CardContent className="p-3 space-y-2">
                  {/* BARIS PORSI 1 (ANDA) */}
                  <div className="flex items-center justify-between bg-zinc-50 dark:bg-zinc-900/30 p-2 rounded-md">
                    <span className="text-xs font-medium text-muted-foreground">
                      Dimm
                    </span>
                    {isPaidByPerson(day, "dimm") ? (
                      <Check className="w-5 h-5 text-emerald-500" />
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => handleSave(day, "dimm")}
                        disabled={loadingState === `${day}-dimm`}
                        className="h-7 text-[10px] px-3 bg-blue-600 rounded-full"
                      >
                        Setor
                      </Button>
                    )}
                  </div>

                  {/* BARIS PORSI 2 (PASANGAN) */}
                  <div className="flex items-center justify-between bg-zinc-50 dark:bg-zinc-900/30 p-2 rounded-md">
                    <span className="text-xs font-medium text-muted-foreground">
                      Putt
                    </span>
                    {isPaidByPerson(day, "putt") ? (
                      <Check className="w-5 h-5 text-emerald-500" />
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => handleSave(day, "putt")}
                        disabled={loadingState === `${day}-putt`}
                        className="h-7 text-[10px] px-3 bg-indigo-600 rounded-full"
                      >
                        Setor
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
