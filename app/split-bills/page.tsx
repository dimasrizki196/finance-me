// app/split-bills/page.tsx
"use client";

import { useState } from "react";
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
  Receipt,
  Users,
  Calculator,
  Wallet,
  Tag,
  Sparkles,
  Building2,
  Percent,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { saveMultipleDebts } from "./actions";

export default function SplitBillPage() {
  const [billName, setBillName] = useState("");
  const [totalAmount, setTotalAmount] = useState<number | "">("");
  const [payer, setPayer] = useState<"dimm" | "putt" | "joint">("dimm");
  const [partyCount, setPartyCount] = useState<"2" | "3">("2");
  const [pairSelected, setPairSelected] = useState<
    "dimm_putt" | "dimm_joint" | "putt_joint"
  >("dimm_putt");

  const [dimmPercent, setDimmPercent] = useState<number | "">("");
  const [puttPercent, setPuttPercent] = useState<number | "">("");
  const [jointPercent, setJointPercent] = useState<number | "">("");

  const showDimm = partyCount === "3" || pairSelected.includes("dimm");
  const showPutt = partyCount === "3" || pairSelected.includes("putt");
  const showJoint = partyCount === "3" || pairSelected.includes("joint");

  const pctDimm = showDimm ? Number(dimmPercent) || 0 : 0;
  const pctPutt = showPutt ? Number(puttPercent) || 0 : 0;
  const pctJoint = showJoint ? Number(jointPercent) || 0 : 0;

  const numTotal = Number(totalAmount) || 0;
  const totalPercent = pctDimm + pctPutt + pctJoint;
  const isPercentValid = totalPercent === 100;

  const dPortion = (pctDimm / 100) * numTotal;
  const pPortion = (pctPutt / 100) * numTotal;
  const jPortion = (pctJoint / 100) * numTotal;

  const balances = { dimm: 0, putt: 0, joint: 0 };
  balances[payer] += numTotal;
  balances.dimm -= dPortion;
  balances.putt -= pPortion;
  balances.joint -= jPortion;

  const debtsToSave: { borrower: string; lender: string; amount: number }[] =
    [];
  if (isPercentValid && numTotal > 0) {
    if (balances.dimm < -0.01)
      debtsToSave.push({
        borrower: "dimm",
        lender: payer,
        amount: Math.round(Math.abs(balances.dimm)),
      });
    if (balances.putt < -0.01)
      debtsToSave.push({
        borrower: "putt",
        lender: payer,
        amount: Math.round(Math.abs(balances.putt)),
      });
    if (balances.joint < -0.01)
      debtsToSave.push({
        borrower: "joint",
        lender: payer,
        amount: Math.round(Math.abs(balances.joint)),
      });
  }

  const formatRupiah = (angka: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(angka);
  };

  const getPartyInfo = (id: string) => {
    if (id === "putt") return { name: "Putri", color: "text-rose-500" };
    if (id === "dimm") return { name: "Dimas", color: "text-blue-500" };
    return { name: "Tabungan", color: "text-emerald-500" };
  };

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6 w-full animate-in fade-in duration-500">
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
              Split Bill
            </h1>
            <p className="text-xs sm:text-sm font-medium text-muted-foreground flex items-center gap-1.5">
              <Calculator className="w-3.5 h-3.5" /> Kalkulator Patungan
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* KOLOM KIRI (Formulir) */}
        <div className="lg:col-span-7 space-y-5">
          <Card className="shadow-sm border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden">
            <CardHeader className="bg-zinc-50 dark:bg-zinc-900/40 border-b border-zinc-100 dark:border-zinc-800 p-4 sm:p-5">
              <CardTitle className="text-lg flex items-center gap-2 font-bold">
                <Receipt className="w-5 h-5 text-indigo-500" /> Detail Transaksi
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-5 space-y-6">
              {/* Info Dasar */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-orange-500" /> Untuk Bayar
                    Apa?
                  </label>
                  <Input
                    type="text"
                    value={billName}
                    onChange={(e) => setBillName(e.target.value)}
                    className="h-11 rounded-xl bg-zinc-50 dark:bg-zinc-900/50 border-zinc-200 focus-visible:ring-indigo-500 text-sm font-semibold"
                    placeholder="Contoh: Makan Malam"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                    Total Tagihan
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 font-bold text-sm">
                      Rp
                    </span>
                    <Input
                      type="number"
                      value={totalAmount}
                      onChange={(e) =>
                        setTotalAmount(
                          e.target.value ? Number(e.target.value) : "",
                        )
                      }
                      className="pl-9 h-11 text-base font-bold rounded-xl bg-zinc-50 dark:bg-zinc-900/50 border-zinc-200 focus-visible:ring-indigo-500"
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>

              {/* Siapa yang Menalangi */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  Siapa yang menalangi?
                </label>
                <div className="grid grid-cols-3 gap-2 bg-zinc-50 dark:bg-zinc-900/50 p-1.5 rounded-xl border border-zinc-100 dark:border-zinc-800">
                  <Button
                    type="button"
                    variant={payer === "dimm" ? "default" : "ghost"}
                    className={cn(
                      "h-10 rounded-lg transition-all font-semibold text-sm",
                      payer === "dimm"
                        ? "bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                        : "text-muted-foreground",
                    )}
                    onClick={() => setPayer("dimm")}
                  >
                    <Wallet className="w-3.5 h-3.5 mr-1.5 hidden sm:block" />{" "}
                    Dimas
                  </Button>
                  <Button
                    type="button"
                    variant={payer === "putt" ? "default" : "ghost"}
                    className={cn(
                      "h-10 rounded-lg transition-all font-semibold text-sm",
                      payer === "putt"
                        ? "bg-rose-600 hover:bg-rose-700 text-white shadow-sm"
                        : "text-muted-foreground",
                    )}
                    onClick={() => setPayer("putt")}
                  >
                    <Wallet className="w-3.5 h-3.5 mr-1.5 hidden sm:block" />{" "}
                    Putri
                  </Button>
                  <Button
                    type="button"
                    variant={payer === "joint" ? "default" : "ghost"}
                    className={cn(
                      "h-10 rounded-lg transition-all font-semibold text-sm",
                      payer === "joint"
                        ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                        : "text-muted-foreground",
                    )}
                    onClick={() => setPayer("joint")}
                  >
                    <Building2 className="w-3.5 h-3.5 mr-1.5 hidden sm:block" />{" "}
                    Tabungan
                  </Button>
                </div>
              </div>

              <div className="border-t border-dashed border-zinc-200 dark:border-zinc-800"></div>

              {/* MODE BAGI PIHAK */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                    Dibagi ke berapa pihak?
                  </label>
                  <div className="grid grid-cols-2 gap-2 bg-zinc-50 dark:bg-zinc-900/50 p-1.5 rounded-xl border border-zinc-100 dark:border-zinc-800">
                    <Button
                      type="button"
                      variant={partyCount === "2" ? "default" : "ghost"}
                      className={cn(
                        "h-10 rounded-lg font-semibold text-sm",
                        partyCount === "2"
                          ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-sm"
                          : "text-muted-foreground",
                      )}
                      onClick={() => setPartyCount("2")}
                    >
                      <Users className="w-3.5 h-3.5 mr-1.5" /> 2 Pihak
                    </Button>
                    <Button
                      type="button"
                      variant={partyCount === "3" ? "default" : "ghost"}
                      className={cn(
                        "h-10 rounded-lg font-semibold text-sm",
                        partyCount === "3"
                          ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-sm"
                          : "text-muted-foreground",
                      )}
                      onClick={() => setPartyCount("3")}
                    >
                      <Users className="w-3.5 h-3.5 mr-1.5" /> 3 Pihak
                    </Button>
                  </div>
                </div>

                {partyCount === "2" && (
                  <div className="space-y-2 animate-in slide-in-from-top-2">
                    <label className="text-xs font-bold text-zinc-600 dark:text-zinc-400">
                      Pilih 2 pihak:
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        className={cn(
                          "h-11 rounded-xl border-zinc-200 text-xs font-bold",
                          pairSelected === "dimm_putt" &&
                            "ring-2 ring-indigo-500 bg-indigo-50/50 border-transparent",
                        )}
                        onClick={() => setPairSelected("dimm_putt")}
                      >
                        Dimas+Putri
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        className={cn(
                          "h-11 rounded-xl border-zinc-200 text-xs font-bold",
                          pairSelected === "dimm_joint" &&
                            "ring-2 ring-indigo-500 bg-indigo-50/50 border-transparent",
                        )}
                        onClick={() => setPairSelected("dimm_joint")}
                      >
                        Dimas+Tab
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        className={cn(
                          "h-11 rounded-xl border-zinc-200 text-xs font-bold",
                          pairSelected === "putt_joint" &&
                            "ring-2 ring-indigo-500 bg-indigo-50/50 border-transparent",
                        )}
                        onClick={() => setPairSelected("putt_joint")}
                      >
                        Putri+Tab
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* KOTAK INPUT PERSENTASE */}
              <div className="p-4 sm:p-5 bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-2xl space-y-4">
                <p className="text-xs font-bold flex items-center gap-1.5 text-zinc-700 dark:text-zinc-300">
                  <Percent className="w-4 h-4 text-indigo-500" /> Alokasi
                  Persen:
                </p>

                <div
                  className={cn(
                    "grid gap-3",
                    partyCount === "2" ? "grid-cols-2" : "grid-cols-3",
                  )}
                >
                  {showDimm && (
                    <div className="space-y-1.5">
                      <span className="text-xs font-bold text-blue-600">
                        Dimas
                      </span>
                      <div className="relative">
                        <Input
                          type="number"
                          value={dimmPercent}
                          onChange={(e) =>
                            setDimmPercent(
                              e.target.value ? Number(e.target.value) : "",
                            )
                          }
                          className="pr-8 h-11 text-base font-bold rounded-xl bg-white dark:bg-zinc-950"
                          placeholder="0"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 text-sm font-bold">
                          %
                        </span>
                      </div>
                      {numTotal > 0 && (
                        <p className="text-[10px] sm:text-xs text-muted-foreground font-bold px-1">
                          {formatRupiah(dPortion)}
                        </p>
                      )}
                    </div>
                  )}

                  {showPutt && (
                    <div className="space-y-1.5">
                      <span className="text-xs font-bold text-rose-600">
                        Putri
                      </span>
                      <div className="relative">
                        <Input
                          type="number"
                          value={puttPercent}
                          onChange={(e) =>
                            setPuttPercent(
                              e.target.value ? Number(e.target.value) : "",
                            )
                          }
                          className="pr-8 h-11 text-base font-bold rounded-xl bg-white dark:bg-zinc-950"
                          placeholder="0"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 text-sm font-bold">
                          %
                        </span>
                      </div>
                      {numTotal > 0 && (
                        <p className="text-[10px] sm:text-xs text-muted-foreground font-bold px-1">
                          {formatRupiah(pPortion)}
                        </p>
                      )}
                    </div>
                  )}

                  {showJoint && (
                    <div className="space-y-1.5">
                      <span className="text-xs font-bold text-emerald-600">
                        Tabungan
                      </span>
                      <div className="relative">
                        <Input
                          type="number"
                          value={jointPercent}
                          onChange={(e) =>
                            setJointPercent(
                              e.target.value ? Number(e.target.value) : "",
                            )
                          }
                          className="pr-8 h-11 text-base font-bold rounded-xl bg-white dark:bg-zinc-950"
                          placeholder="0"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 text-sm font-bold">
                          %
                        </span>
                      </div>
                      {numTotal > 0 && (
                        <p className="text-[10px] sm:text-xs text-muted-foreground font-bold px-1">
                          {formatRupiah(jPortion)}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <div
                  className={cn(
                    "p-2.5 rounded-xl text-xs font-bold flex items-center gap-2",
                    isPercentValid
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-amber-100 text-amber-700",
                  )}
                >
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>
                    Total: <strong className="text-sm">{totalPercent}%</strong>{" "}
                    {isPercentValid ? "(Pas 100%)" : "(Harus 100%)"}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* KOLOM KANAN (Hasil) */}
        <div className="lg:col-span-5 lg:sticky lg:top-6">
          <Card className="border-none shadow-xl bg-gradient-to-br from-zinc-900 to-zinc-950 text-white overflow-hidden rounded-2xl relative">
            <CardHeader className="border-b border-white/10 p-4 sm:p-5">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-400" /> Hasil Kalkulasi
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 sm:p-6 text-center min-h-[200px] flex flex-col justify-center space-y-5">
              {numTotal === 0 ? (
                <div className="text-zinc-500 text-sm space-y-2 py-4">
                  <Calculator className="w-10 h-10 mx-auto opacity-20 mb-2" />
                  <p>Menunggu pengisian nominal...</p>
                </div>
              ) : !isPercentValid ? (
                <div className="text-amber-400 space-y-2 py-4">
                  <p className="font-bold text-base">Total Porsi Harus 100%</p>
                  <p className="text-xs text-zinc-400 px-4">
                    Atur persentase agar tepat 100%.
                  </p>
                </div>
              ) : debtsToSave.length > 0 ? (
                <div className="space-y-4 w-full animate-in zoom-in-95">
                  <p className="text-[11px] text-zinc-400 font-bold uppercase tracking-widest text-left">
                    Rincian Kasbon:
                  </p>
                  <div className="space-y-2.5 text-left">
                    {debtsToSave.map((debt, index) => {
                      const borrower = getPartyInfo(debt.borrower);
                      const lender = getPartyInfo(debt.lender);
                      return (
                        <div
                          key={index}
                          className="bg-white/5 border border-white/10 p-3 rounded-xl flex items-center justify-between gap-3"
                        >
                          <p className="text-xs font-medium flex items-center gap-1.5">
                            <span className={cn("font-bold", borrower.color)}>
                              {borrower.name}
                            </span>
                            <span className="text-zinc-500">→</span>
                            <span className={cn("font-bold", lender.color)}>
                              {lender.name}
                            </span>
                          </p>
                          <p className="text-base font-black tracking-tight">
                            {formatRupiah(debt.amount)}
                          </p>
                        </div>
                      );
                    })}
                  </div>

                  <form action={saveMultipleDebts} className="pt-2">
                    <input type="hidden" name="description" value={billName} />
                    <input
                      type="hidden"
                      name="debts"
                      value={JSON.stringify(debtsToSave)}
                    />
                    <Button
                      type="submit"
                      className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-bold h-11 rounded-xl text-sm transition-all hover:scale-[1.02]"
                    >
                      Simpan ke Daftar Pinjaman
                    </Button>
                  </form>
                </div>
              ) : (
                <div className="text-center py-4">
                  <div className="p-3 bg-emerald-500/10 rounded-full w-fit mx-auto mb-3">
                    <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                  </div>
                  <h3 className="font-bold text-emerald-400">Tanpa Pinjaman</h3>
                  <p className="text-xs font-medium text-zinc-400 mt-1.5 px-4">
                    Beban ditanggung penuh oleh pembayar.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
