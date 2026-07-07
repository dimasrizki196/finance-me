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

  // Siapa yang menalangi?
  const [payer, setPayer] = useState<"dimm" | "putt" | "joint">("dimm");

  // Mode Jumlah Pihak
  const [partyCount, setPartyCount] = useState<"2" | "3">("2");

  // Jika 2 pihak, siapa saja kombinasinya?
  const [pairSelected, setPairSelected] = useState<
    "dimm_putt" | "dimm_joint" | "putt_joint"
  >("dimm_putt");

  // Input untuk Nilai Persen (%)
  const [dimmPercent, setDimmPercent] = useState<number | "">("");
  const [puttPercent, setPuttPercent] = useState<number | "">("");
  const [jointPercent, setJointPercent] = useState<number | "">("");

  // Menentukan kotak mana yang tampil di layar
  const showDimm = partyCount === "3" || pairSelected.includes("dimm");
  const showPutt = partyCount === "3" || pairSelected.includes("putt");
  const showJoint = partyCount === "3" || pairSelected.includes("joint");

  // Jika kotak disembunyikan, nilainya dianggap 0
  const pctDimm = showDimm ? Number(dimmPercent) || 0 : 0;
  const pctPutt = showPutt ? Number(puttPercent) || 0 : 0;
  const pctJoint = showJoint ? Number(jointPercent) || 0 : 0;

  // --- LOGIKA KALKULATOR ---
  const numTotal = Number(totalAmount) || 0;
  const totalPercent = pctDimm + pctPutt + pctJoint;
  const isPercentValid = totalPercent === 100;

  // Hitung Rupiah
  const dPortion = (pctDimm / 100) * numTotal;
  const pPortion = (pctPutt / 100) * numTotal;
  const jPortion = (pctJoint / 100) * numTotal;

  // Kalkulasi Saldo
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
    if (id === "putt") return { name: "Putri", color: "text-rose-400" };
    if (id === "dimm") return { name: "Dimas", color: "text-blue-400" };
    return { name: "Tabungan Kita", color: "text-emerald-400" };
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-6 w-full animate-in fade-in duration-700">
      {/* HEADER */}
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
              Split Bill Cerdas
            </h1>
            <p className="text-sm text-muted-foreground flex items-center gap-1.5">
              <Calculator className="w-4 h-4" /> Mode Persentase Fleksibel
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        {/* KOLOM KIRI (Formulir) */}
        <div className="lg:col-span-7 space-y-6">
          <Card className="shadow-sm border-zinc-200 dark:border-zinc-800">
            <CardHeader className="bg-zinc-50 dark:bg-zinc-900/50 border-b pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Receipt className="w-5 h-5 text-indigo-500" /> Detail Transaksi
              </CardTitle>
              <CardDescription>
                Masukkan rincian dan pilih siapa saja yang ikut patungan.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              {/* Info Dasar */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                    Untuk Bayar Apa?
                  </label>
                  <div className="relative">
                    <Tag className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="text"
                      value={billName}
                      onChange={(e) => setBillName(e.target.value)}
                      className="pl-10 h-12 rounded-xl focus-visible:ring-indigo-500"
                      placeholder="Contoh: Makan Malam..."
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                    Total Tagihan (Rp)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
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
                      className="pl-10 h-12 text-lg font-bold rounded-xl focus-visible:ring-indigo-500"
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>

              {/* Siapa yang Menalangi */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                  Siapa yang menalangi? (Bayar duluan)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    type="button"
                    variant={payer === "dimm" ? "default" : "outline"}
                    className={cn(
                      "h-11 rounded-xl transition-all",
                      payer === "dimm" &&
                        "bg-blue-600 hover:bg-blue-700 text-white",
                    )}
                    onClick={() => setPayer("dimm")}
                  >
                    <Wallet className="w-4 h-4 mr-1.5" /> Dimas
                  </Button>
                  <Button
                    type="button"
                    variant={payer === "putt" ? "default" : "outline"}
                    className={cn(
                      "h-11 rounded-xl transition-all",
                      payer === "putt" &&
                        "bg-rose-600 hover:bg-rose-700 text-white",
                    )}
                    onClick={() => setPayer("putt")}
                  >
                    <Wallet className="w-4 h-4 mr-1.5" /> Putri
                  </Button>
                  <Button
                    type="button"
                    variant={payer === "joint" ? "default" : "outline"}
                    className={cn(
                      "h-11 rounded-xl transition-all",
                      payer === "joint" &&
                        "bg-emerald-600 hover:bg-emerald-700 text-white",
                    )}
                    onClick={() => setPayer("joint")}
                  >
                    <Building2 className="w-4 h-4 mr-1.5" /> Tabungan
                  </Button>
                </div>
              </div>

              <div className="border-t border-dashed border-zinc-200 dark:border-zinc-800 my-4"></div>

              {/* MODE 2 PIHAK ATAU 3 PIHAK */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300">
                    Mau dibagi ke berapa pihak?
                  </label>
                  <div className="grid grid-cols-2 gap-3 bg-zinc-100 dark:bg-zinc-900/50 p-1.5 rounded-xl">
                    <Button
                      type="button"
                      variant={partyCount === "2" ? "default" : "ghost"}
                      className={cn(
                        "h-10 rounded-lg font-bold",
                        partyCount === "2"
                          ? "bg-green-800 dark:bg-zinc-800 shadow-sm"
                          : "text-muted-foreground",
                      )}
                      onClick={() => setPartyCount("2")}
                    >
                      <Users className="w-4 h-4 mr-2" /> 2 Pihak Saja
                    </Button>
                    <Button
                      type="button"
                      variant={partyCount === "3" ? "default" : "ghost"}
                      className={cn(
                        "h-10 rounded-lg font-bold",
                        partyCount === "3"
                          ? "bg-green-800 dark:bg-zinc-800 shadow-sm"
                          : "text-muted-foreground",
                      )}
                      onClick={() => setPartyCount("3")}
                    >
                      <Users className="w-4 h-4 mr-2" /> 3 Pihak (Semua)
                    </Button>
                  </div>
                </div>

                {/* Sub-Pilihan JIKA 2 Pihak */}
                {partyCount === "2" && (
                  <div className="space-y-2 animate-in slide-in-from-top-2">
                    <label className="text-sm font-semibold text-zinc-600 dark:text-zinc-400">
                      Siapa 2 pihak yang ikut patungan?
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        className={cn(
                          "h-auto py-2.5 rounded-xl border-zinc-200 dark:border-zinc-800 flex flex-col items-center justify-center gap-1",
                          pairSelected === "dimm_putt" &&
                            "ring-2 ring-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20",
                        )}
                        onClick={() => setPairSelected("dimm_putt")}
                      >
                        <span className="text-sm font-bold">Dimas + Putri</span>
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        className={cn(
                          "h-auto py-2.5 rounded-xl border-zinc-200 dark:border-zinc-800 flex flex-col items-center justify-center gap-1",
                          pairSelected === "dimm_joint" &&
                            "ring-2 ring-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20",
                        )}
                        onClick={() => setPairSelected("dimm_joint")}
                      >
                        <span className="text-sm font-bold">
                          Dimas + Tabungan
                        </span>
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        className={cn(
                          "h-auto py-2.5 rounded-xl border-zinc-200 dark:border-zinc-800 flex flex-col items-center justify-center gap-1",
                          pairSelected === "putt_joint" &&
                            "ring-2 ring-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20",
                        )}
                        onClick={() => setPairSelected("putt_joint")}
                      >
                        <span className="text-sm font-bold">
                          Putri + Tabungan
                        </span>
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* KOTAK INPUT PERSENTASE (Otomatis menyesuaikan jumlah) */}
              <div className="p-4 bg-zinc-50 dark:bg-zinc-900/50 border rounded-xl space-y-4">
                <p className="text-sm font-bold flex items-center gap-1 text-zinc-600 dark:text-zinc-400">
                  <Percent className="w-4 h-4" /> Masukkan Alokasi Persen:
                </p>

                {/* Grid dinamis: jika 2 kotak akan lebih lebar, jika 3 kotak dibagi 3 */}
                <div
                  className={cn(
                    "grid gap-4",
                    partyCount === "2"
                      ? "grid-cols-2"
                      : "grid-cols-1 sm:grid-cols-3",
                  )}
                >
                  {/* Input Dimas */}
                  {showDimm && (
                    <div className="space-y-1.5 animate-in zoom-in-95">
                      <span className="text-xs font-semibold text-blue-500">
                        Porsi Dimas
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
                          className="pr-8 h-11 font-bold rounded-lg bg-white dark:bg-zinc-950"
                          placeholder="0"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 text-sm font-bold">
                          %
                        </span>
                      </div>
                      {numTotal > 0 && (
                        <p className="text-[11px] text-muted-foreground font-semibold mt-1">
                          {formatRupiah(dPortion)}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Input Putri */}
                  {showPutt && (
                    <div className="space-y-1.5 animate-in zoom-in-95">
                      <span className="text-xs font-semibold text-rose-500">
                        Porsi Putri
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
                          className="pr-8 h-11 font-bold rounded-lg bg-white dark:bg-zinc-950"
                          placeholder="0"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 text-sm font-bold">
                          %
                        </span>
                      </div>
                      {numTotal > 0 && (
                        <p className="text-[11px] text-muted-foreground font-semibold mt-1">
                          {formatRupiah(pPortion)}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Input Tabungan */}
                  {showJoint && (
                    <div className="space-y-1.5 animate-in zoom-in-95">
                      <span className="text-xs font-semibold text-emerald-500">
                        Porsi Tabungan
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
                          className="pr-8 h-11 font-bold rounded-lg bg-white dark:bg-zinc-950"
                          placeholder="0"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 text-sm font-bold">
                          %
                        </span>
                      </div>
                      {numTotal > 0 && (
                        <p className="text-[11px] text-muted-foreground font-semibold mt-1">
                          {formatRupiah(jPortion)}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Validasi */}
                <div
                  className={cn(
                    "mt-4 p-2.5 rounded-lg text-xs font-semibold flex items-center gap-2",
                    isPercentValid
                      ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20"
                      : "bg-amber-50 text-amber-600 dark:bg-amber-950/20",
                  )}
                >
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>
                    Total Alokasi:{" "}
                    <strong className="text-sm">{totalPercent}%</strong>{" "}
                    {isPercentValid ? " (Pas 100%)" : " (Wajib bernilai 100%)"}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* KOLOM KANAN (Hasil) */}
        <div className="lg:col-span-5 lg:sticky lg:top-6">
          <Card className="border-none shadow-xl bg-gradient-to-br from-zinc-900 to-zinc-950 text-white overflow-hidden relative">
            <CardHeader className="border-b border-white/10 pb-4">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-400" /> Hasil Kalkulasi
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 text-center min-h-[220px] flex flex-col justify-center space-y-6 relative z-10">
              {numTotal === 0 ? (
                <div className="text-zinc-400 text-sm space-y-1 py-6">
                  <Calculator className="w-10 h-10 mx-auto opacity-20 mb-3" />
                  <p>Menunggu pengisian nominal tagihan...</p>
                </div>
              ) : !isPercentValid ? (
                <div className="text-amber-400 text-sm space-y-2 p-4">
                  <p className="font-bold">Total Porsi Harus 100%</p>
                  <p className="text-xs text-zinc-400">
                    Atur angka persen di samping agar totalnya pas 100%.
                  </p>
                </div>
              ) : debtsToSave.length > 0 ? (
                <div className="space-y-4 w-full animate-in zoom-in-95">
                  <p className="text-xs text-zinc-300 font-medium uppercase tracking-wider text-left">
                    Kasbon yang akan dicatat:
                  </p>

                  <div className="space-y-2.5 text-left">
                    {debtsToSave.map((debt, index) => {
                      const borrower = getPartyInfo(debt.borrower);
                      const lender = getPartyInfo(debt.lender);
                      return (
                        <div
                          key={index}
                          className="bg-white/5 border border-white/10 p-3.5 rounded-xl flex items-center justify-between gap-2"
                        >
                          <p className="text-xs font-medium">
                            <span className={cn("font-bold", borrower.color)}>
                              {borrower.name}
                            </span>
                            <span className="text-zinc-400 mx-1">→</span>
                            <span className={cn("font-bold", lender.color)}>
                              {lender.name}
                            </span>
                          </p>
                          <p className="text-lg font-black">
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
                      className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-bold h-13 rounded-xl shadow-lg text-base transition-all hover:scale-[1.02]"
                    >
                      Catat ke Catatan Kasbon
                    </Button>
                  </form>
                </div>
              ) : (
                <div className="text-center py-6">
                  <div className="p-3 bg-emerald-500/20 rounded-full w-fit mx-auto mb-3">
                    <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                  </div>
                  <h3 className="font-bold text-emerald-400">
                    Selesai Tanpa Kasbon
                  </h3>
                  <p className="text-xs text-zinc-400 mt-1.5 px-4">
                    Beban 100% ditanggung sepenuhnya oleh pihak yang melakukan
                    pembayaran.
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
