// components/InvestmentPopups.tsx
"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button, buttonVariants } from "@/components/ui/button"; // <-- IMPORT BUTTON VARIANTS
import { Input } from "@/components/ui/input";
import { TrendingUp, ArrowDownToLine, Sparkles, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

import { saveProfitLoss, withdrawRdn } from "@/app/actions";

export default function InvestmentPopups({
  portfolio,
  type,
  walletId,
}: {
  portfolio: Record<string, number>;
  type: "joint" | "personal";
  walletId: string;
}) {
  const [selectedRdnUpdate, setSelectedRdnUpdate] = useState(
    Object.keys(portfolio)[0] || "",
  );
  const [newBalance, setNewBalance] = useState<number | "">("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [isUpdateOpen, setIsUpdateOpen] = useState(false);

  const [selectedRdnWd, setSelectedRdnWd] = useState(
    Object.keys(portfolio)[0] || "",
  );
  const [wdAmount, setWdAmount] = useState<number | "">("");
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [isWdOpen, setIsWdOpen] = useState(false);

  const formatRupiah = (angka: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(angka);

  const currentBalance = portfolio[selectedRdnUpdate] || 0;
  const numNewBalance = Number(newBalance) || 0;
  const difference = newBalance !== "" ? numNewBalance - currentBalance : 0;
  const isProfit = difference > 0;

  const colorTheme = type === "joint" ? "purple" : "teal";

  const handleUpdateProfit = async () => {
    if (difference === 0 || !walletId) return;
    setIsUpdating(true);
    try {
      await saveProfitLoss(walletId, selectedRdnUpdate, difference);
      setIsUpdateOpen(false);
      setNewBalance("");
    } catch (error) {
      console.error(error);
      alert("Gagal mengupdate portofolio.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleWithdraw = async () => {
    if (Number(wdAmount) <= 0 || !walletId) return;
    setIsWithdrawing(true);
    try {
      await withdrawRdn(walletId, selectedRdnWd, Number(wdAmount));
      setIsWdOpen(false);
      setWdAmount("");
    } catch (error) {
      console.error(error);
      alert("Gagal melakukan penarikan.");
    } finally {
      setIsWithdrawing(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* ================================================== */}
      {/* POP-UP 1: KALKULATOR PROFIT                        */}
      {/* ================================================== */}
      <Dialog open={isUpdateOpen} onOpenChange={setIsUpdateOpen}>
        {/* MENGGUNAKAN BUTTON VARIANTS LANGSUNG DI TRIGGER */}
        <DialogTrigger
          className={cn(
            buttonVariants({ variant: "outline" }),
            "flex-1 md:flex-none",
            type === "joint"
              ? "border-purple-200 text-purple-700 hover:bg-purple-50"
              : "border-teal-200 text-teal-700 hover:bg-teal-50",
          )}
        >
          <TrendingUp className="w-4 h-4 mr-2" /> Kalkulator Profit
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className={`w-5 h-5 text-${colorTheme}-600`} /> Update
              Portofolio Saham
            </DialogTitle>
            <DialogDescription>
              Catat keuntungan/kerugian untuk menjaga akurasi aset Anda.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold">Pilih Portofolio</label>
              <select
                className="flex h-11 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm outline-none cursor-pointer"
                value={selectedRdnUpdate}
                onChange={(e) => setSelectedRdnUpdate(e.target.value)}
              >
                {Object.keys(portfolio).map((name) => (
                  <option key={name} value={name}>
                    {name} (Modal saat ini: {formatRupiah(portfolio[name])})
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold">
                Saldo Saat Ini di Aplikasi (Rp)
              </label>
              <Input
                type="number"
                value={newBalance}
                onChange={(e) =>
                  setNewBalance(e.target.value ? Number(e.target.value) : "")
                }
                className="h-12 text-lg font-bold"
                placeholder="0"
              />
            </div>

            {newBalance !== "" && difference !== 0 && (
              <div
                className={cn(
                  "p-3 rounded-lg border",
                  isProfit
                    ? "bg-emerald-50 border-emerald-200"
                    : "bg-rose-50 border-rose-200",
                )}
              >
                <p
                  className={cn(
                    "text-xs font-bold",
                    isProfit ? "text-emerald-700" : "text-rose-700",
                  )}
                >
                  {isProfit ? "🎉 Wow, Profit!" : "📉 Sedang Loss"}
                </p>
                <p
                  className={cn(
                    "text-lg font-black",
                    isProfit ? "text-emerald-600" : "text-rose-600",
                  )}
                >
                  {isProfit ? "+" : "-"}
                  {formatRupiah(Math.abs(difference))}
                </p>
              </div>
            )}

            <Button
              onClick={handleUpdateProfit}
              disabled={difference === 0 || isUpdating}
              className={`w-full text-white h-11 ${
                type === "joint"
                  ? "bg-purple-600 hover:bg-purple-700"
                  : "bg-teal-600 hover:bg-teal-700"
              }`}
            >
              {isUpdating ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                "Simpan Pembaruan"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ================================================== */}
      {/* POP-UP 2: TARIK DANA                               */}
      {/* ================================================== */}
      <Dialog open={isWdOpen} onOpenChange={setIsWdOpen}>
        {/* MENGGUNAKAN BUTTON VARIANTS LANGSUNG DI TRIGGER */}
        <DialogTrigger
          className={cn(
            buttonVariants({ variant: "outline" }),
            "flex-1 md:flex-none border-emerald-200 text-emerald-700 hover:bg-emerald-50",
          )}
        >
          <ArrowDownToLine className="w-4 h-4 mr-2" /> Tarik Dana
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowDownToLine className="w-5 h-5 text-emerald-600" /> Tarik
              Tunai ke Kas
            </DialogTitle>
            <DialogDescription>
              Cairkan aset investasi Anda. Uang ini akan masuk sebagai Pemasukan
              di Kas utama.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold">
                Cairkan dari RDN Mana?
              </label>
              <select
                className="flex h-11 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm outline-none cursor-pointer"
                value={selectedRdnWd}
                onChange={(e) => setSelectedRdnWd(e.target.value)}
              >
                {Object.keys(portfolio).map((name) => (
                  <option key={name} value={name}>
                    {name} (Maks: {formatRupiah(portfolio[name])})
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold">
                Nominal Ditarik (Rp)
              </label>
              <Input
                type="number"
                value={wdAmount}
                onChange={(e) =>
                  setWdAmount(e.target.value ? Number(e.target.value) : "")
                }
                className="h-12 text-lg font-bold"
                placeholder="0"
              />
            </div>

            <Button
              onClick={handleWithdraw}
              disabled={!wdAmount || Number(wdAmount) <= 0 || isWithdrawing}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-11"
            >
              {isWithdrawing ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                "Konfirmasi Tarik Dana"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
