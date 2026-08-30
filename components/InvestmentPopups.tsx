// components/InvestmentPopups.tsx
"use client";

import { useState, useTransition } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Loader2,
  TrendingUp,
  TrendingDown,
  ArrowDownToLine,
  PlusCircle,
  Banknote,
  Briefcase,
  CalendarDays,
  Wallet,
  Plus,
  AlignLeft,
  Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";
import { saveProfitLoss, withdrawRdn, createTransaction } from "@/app/actions";

export default function InvestmentPopups({
  portfolio,
  type,
  walletId,
  investCategoryId,
}: {
  portfolio: Record<string, number>;
  type: "joint" | "personal";
  walletId: string;
  investCategoryId?: string;
}) {
  const [actionType, setActionType] = useState<"topup" | "tarik" | "profit" | "loss" | null>(null);
  const [isPending, startTransition] = useTransition();

  const [amount, setAmount] = useState<number | "">("");
  const [selectedRdn, setSelectedRdn] = useState("");
  const [topupRdnName, setTopupRdnName] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);

  // State Update Profit
  const [selectedRdnUpdate, setSelectedRdnUpdate] = useState(Object.keys(portfolio)[0] || "");
  const [newBalance, setNewBalance] = useState<number | "">("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [isUpdateOpen, setIsUpdateOpen] = useState(false);

  // State Tarik Dana
  const [selectedRdnWd, setSelectedRdnWd] = useState(Object.keys(portfolio)[0] || "");
  const [wdAmount, setWdAmount] = useState<number | "">("");
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [isWdOpen, setIsWdOpen] = useState(false);

  // State Topup
  const [topupRdn, setTopupRdn] = useState("");
  const [topupAmount, setTopupAmount] = useState<number | "">("");
  const [isTopupOpen, setIsTopupOpen] = useState(false);

  const formatRupiah = (angka: number) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(angka);

  const today = new Date().toISOString().split("T")[0];
  const colorTheme = type === "joint" ? "purple" : "indigo";

  // Hitung Profit
  const currentBalance = portfolio[selectedRdnUpdate] || 0;
  const numNewBalance = Number(newBalance) || 0;
  const difference = newBalance !== "" ? numNewBalance - currentBalance : 0;
  const isProfit = difference >= 0;

  // Cek Batas Tarik Dana
  const maxWdAmount = portfolio[selectedRdnWd] || 0;
  const isWdExceeds = Number(wdAmount) > maxWdAmount;

  const handleUpdateProfit = async () => {
    if (difference === 0 || !walletId) return;
    setIsUpdating(true);
    try {
      await saveProfitLoss(walletId, selectedRdnUpdate, difference);
      setIsUpdateOpen(false);
      setNewBalance("");
    } catch (error) {
      alert("Gagal mengupdate portofolio.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleWithdraw = async () => {
    if (Number(wdAmount) <= 0 || isWdExceeds || !walletId) return;
    setIsWithdrawing(true);
    try {
      await withdrawRdn(walletId, selectedRdnWd, Number(wdAmount));
      setIsWdOpen(false);
      setWdAmount("");
    } catch (error) {
      alert("Gagal melakukan penarikan.");
    } finally {
      setIsWithdrawing(false);
    }
  };

  const handleTopup = async (formData: FormData) => {
    if (!topupRdn || Number(topupAmount) <= 0 || !investCategoryId || !walletId) return;
    
    formData.append("amount", topupAmount.toString());
    formData.append("category_id", investCategoryId);
    formData.append("wallet_id", walletId);
    formData.append("notes", topupRdn);

    startTransition(async () => {
      try {
        await createTransaction(formData);
        setIsTopupOpen(false);
        setTopupAmount("");
        setTopupRdn("");
      } catch (e) {
        alert("Gagal melakukan Topup.");
      }
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
      
      {/* 0. TOPUP SAHAM */}
      {investCategoryId && (
        <Dialog open={isTopupOpen} onOpenChange={setIsTopupOpen}>
          <DialogTrigger
            className={cn(
              "flex-1 md:flex-none flex items-center justify-center gap-2 h-11 px-4 border-2 border-dashed rounded-xl transition-all cursor-pointer group outline-none",
              type === "joint" 
                ? "bg-purple-50/50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-800/60 hover:bg-purple-50 dark:hover:bg-purple-900/40"
                : "bg-indigo-50/50 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-800/60 hover:bg-indigo-50 dark:hover:bg-indigo-900/40"
            )}
          >
            <div className={cn("text-white p-1 rounded-full shadow-sm group-hover:scale-110 transition-transform", type === "joint" ? "bg-purple-600" : "bg-indigo-600")}>
              <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
            <span className={cn("font-bold text-sm", type === "joint" ? "text-purple-700 dark:text-purple-400" : "text-indigo-700 dark:text-indigo-400")}>
              Top Up
            </span>
          </DialogTrigger>
          <DialogContent className="w-[95vw] sm:max-w-[425px] p-5 sm:p-6 rounded-3xl overflow-hidden">
            <DialogHeader className="pb-4 border-b border-zinc-100 dark:border-zinc-800 text-left">
              <DialogTitle className="flex items-center gap-2 text-xl font-bold">
                <div className={`p-2 bg-${colorTheme}-100 dark:bg-${colorTheme}-900/30 text-${colorTheme}-600 rounded-lg`}>
                  <Briefcase className="w-5 h-5" />
                </div>
                Topup Saham
              </DialogTitle>
              <DialogDescription className="pt-2">Tambahkan modal investasi baru.</DialogDescription>
            </DialogHeader>

            <form action={handleTopup} className="space-y-5 mt-4 w-full">
              <div className="space-y-2 w-full">
                <Label className="flex items-center gap-1.5 font-semibold text-zinc-700 dark:text-zinc-300">
                  <Banknote className="w-4 h-4 text-emerald-500" /> Nominal Topup (Rp)
                </Label>
                <div className="relative w-full">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                    <span className="text-zinc-500 font-bold">Rp</span>
                  </div>
                  <Input type="number" value={topupAmount} onChange={(e) => setTopupAmount(e.target.value ? Number(e.target.value) : "")} className="w-full pl-11 h-14 text-xl font-black bg-zinc-50 dark:bg-zinc-900/50 border-zinc-200 rounded-xl focus-visible:ring-indigo-500" placeholder="0" required />
                </div>
              </div>

              <div className="space-y-2 w-full">
                <Label className="flex items-center gap-1.5 font-semibold text-zinc-700 dark:text-zinc-300">
                  <AlignLeft className="w-4 h-4 text-orange-500" /> Nama RDN / Sekuritas
                </Label>
                <Input value={topupRdn} onChange={(e) => setTopupRdn(e.target.value)} className="w-full h-12 font-bold bg-zinc-50 dark:bg-zinc-900/50 border-zinc-200 rounded-xl" placeholder="Misal: RDN Ajaib, RDN Dimas..." required />
              </div>

              <div className="space-y-2 w-full">
                <Label className="flex items-center gap-1.5 font-semibold text-zinc-700 dark:text-zinc-300">
                  <CalendarDays className="w-4 h-4 text-zinc-500" /> Tanggal
                </Label>
                <Input name="transaction_date" type="date" defaultValue={today} required className="w-full h-12 bg-zinc-50 dark:bg-zinc-900/50 rounded-xl" />
              </div>

              <div className="pt-2 w-full">
                <Button type="submit" disabled={isPending || !topupAmount} className={cn("w-full h-12 text-base font-bold rounded-xl transition-all text-white", type === "joint" ? "bg-purple-600 hover:bg-purple-700" : "bg-indigo-600 hover:bg-indigo-700")}>
                  {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : "Simpan Topup"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* 1. KALKULATOR PROFIT / LOSS */}
      <Dialog open={isUpdateOpen} onOpenChange={setIsUpdateOpen}>
        <DialogTrigger
          className={cn(
            buttonVariants({ variant: "outline" }),
            "flex-1 md:flex-none h-11 rounded-xl font-bold shadow-sm transition-transform active:scale-95",
            type === "joint" ? "border-purple-200 text-purple-700 bg-purple-50 hover:bg-purple-100 dark:bg-purple-900/20" : "border-indigo-200 text-indigo-700 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/20"
          )}
        >
          <TrendingUp className="w-5 h-5 mr-1.5" /> Profit / Loss
        </DialogTrigger>
        <DialogContent className="w-[95vw] sm:max-w-[425px] p-5 sm:p-6 rounded-3xl overflow-hidden">
          <DialogHeader className="pb-4 border-b border-zinc-100 dark:border-zinc-800 text-left">
            <DialogTitle className="flex items-center gap-2 text-xl font-bold">
              <div className={`p-2 bg-${colorTheme}-100 dark:bg-${colorTheme}-900/30 text-${colorTheme}-600 rounded-lg`}>
                <Sparkles className="w-5 h-5" />
              </div>
              Update Portofolio
            </DialogTitle>
            <DialogDescription className="pt-2">Catat keuntungan/kerugian aset Anda.</DialogDescription>
          </DialogHeader>

          <div className="space-y-5 mt-4 w-full">
            <div className="space-y-2 w-full">
              <Label className="font-semibold text-zinc-700 dark:text-zinc-300">Pilih Portofolio</Label>
              <select
                className="w-full h-12 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 rounded-xl px-3 font-medium outline-none focus:ring-2 cursor-pointer"
                value={selectedRdnUpdate}
                onChange={(e) => setSelectedRdnUpdate(e.target.value)}
              >
                <option value="" disabled>Pilih RDN...</option>
                {Object.keys(portfolio).map((name) => (
                  <option key={name} value={name}>{name} (Modal: {formatRupiah(portfolio[name])})</option>
                ))}
              </select>
            </div>
            <div className="space-y-2 w-full">
              <Label className="font-semibold text-zinc-700 dark:text-zinc-300">Saldo Saat Ini di Aplikasi</Label>
              <div className="relative w-full">
                <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                  <span className="text-zinc-500 font-bold">Rp</span>
                </div>
                <Input type="number" value={newBalance} onChange={(e) => setNewBalance(e.target.value ? Number(e.target.value) : "")} className="w-full pl-11 h-14 text-xl font-black bg-zinc-50 dark:bg-zinc-900/50 border-zinc-200 rounded-xl" placeholder="0" />
              </div>
            </div>

            {newBalance !== "" && difference !== 0 && (
              <div className={cn("p-4 rounded-2xl border", isProfit ? "bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20" : "bg-rose-50 border-rose-200 dark:bg-rose-900/20")}>
                <p className={cn("text-xs font-bold uppercase tracking-widest", isProfit ? "text-emerald-700" : "text-rose-700")}>
                  {isProfit ? "🎉 Sedang Profit" : "📉 Sedang Loss"}
                </p>
                <p className={cn("text-2xl font-black mt-1", isProfit ? "text-emerald-600" : "text-rose-600")}>
                  {isProfit ? "+" : "-"}{formatRupiah(Math.abs(difference))}
                </p>
              </div>
            )}

            <div className="pt-2 w-full">
              <Button onClick={handleUpdateProfit} disabled={difference === 0 || isUpdating || !selectedRdnUpdate} className={cn("w-full h-12 text-base font-bold rounded-xl transition-all text-white", type === "joint" ? "bg-purple-600 hover:bg-purple-700" : "bg-indigo-600 hover:bg-indigo-700")}>
                {isUpdating ? <Loader2 className="w-5 h-5 animate-spin" /> : "Simpan Pembaruan"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 2. TARIK DANA */}
      <Dialog open={isWdOpen} onOpenChange={setIsWdOpen}>
        <DialogTrigger
          className={cn(
            buttonVariants({ variant: "outline" }),
            "flex-1 md:flex-none h-11 rounded-xl font-bold shadow-sm transition-transform active:scale-95 border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-900/20"
          )}
        >
          <ArrowDownToLine className="w-5 h-5 mr-1.5" /> Tarik Dana
        </DialogTrigger>
        <DialogContent className="w-[95vw] sm:max-w-[425px] p-5 sm:p-6 rounded-3xl overflow-hidden">
          <DialogHeader className="pb-4 border-b border-zinc-100 dark:border-zinc-800 text-left">
            <DialogTitle className="flex items-center gap-2 text-xl font-bold">
              <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-lg">
                <ArrowDownToLine className="w-5 h-5" />
              </div>
              Tarik Tunai
            </DialogTitle>
            <DialogDescription className="pt-2">Cairkan aset investasi ke Kas utama.</DialogDescription>
          </DialogHeader>

          <div className="space-y-5 mt-4 w-full">
            <div className="space-y-2 w-full">
              <Label className="font-semibold text-zinc-700 dark:text-zinc-300">Cairkan dari mana?</Label>
              <select
                className="w-full h-12 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 rounded-xl px-3 font-medium outline-none focus:ring-2 cursor-pointer"
                value={selectedRdnWd}
                onChange={(e) => setSelectedRdnWd(e.target.value)}
              >
                <option value="" disabled>Pilih RDN...</option>
                {Object.keys(portfolio).map((name) => (
                  <option key={name} value={name}>{name} (Maks: {formatRupiah(portfolio[name])})</option>
                ))}
              </select>
            </div>

            <div className="space-y-2 w-full">
              <Label className="font-semibold text-zinc-700 dark:text-zinc-300">Nominal Ditarik</Label>
              <div className="relative w-full">
                <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                  <span className="text-zinc-500 font-bold">Rp</span>
                </div>
                <Input type="number" value={wdAmount} onChange={(e) => setWdAmount(e.target.value ? Number(e.target.value) : "")} className={cn("w-full pl-11 h-14 text-xl font-black bg-zinc-50 border-zinc-200 rounded-xl", isWdExceeds && "border-rose-500 text-rose-600")} placeholder="0" />
              </div>
              {isWdExceeds && <p className="text-xs font-bold text-rose-500 mt-1.5">Maksimal penarikan: {formatRupiah(maxWdAmount)}.</p>}
            </div>

            <div className="pt-4 w-full">
              <Button onClick={handleWithdraw} disabled={!wdAmount || Number(wdAmount) <= 0 || isWdExceeds || isWithdrawing || !selectedRdnWd} className={cn("w-full h-12 text-base font-bold rounded-xl text-white", isWdExceeds ? "bg-zinc-300 dark:bg-zinc-800" : "bg-emerald-600 hover:bg-emerald-700")}>
                {isWithdrawing ? <Loader2 className="w-5 h-5 animate-spin" /> : "Konfirmasi Tarik Dana"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}