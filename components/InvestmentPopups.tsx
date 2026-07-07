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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  TrendingUp,
  ArrowDownToLine,
  Sparkles,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function InvestmentPopups({
  portfolio,
  type,
}: {
  portfolio: Record<string, number>;
  type: "joint" | "personal";
}) {
  const [selectedRdnUpdate, setSelectedRdnUpdate] = useState(
    Object.keys(portfolio)[0] || "",
  );
  const [newBalance, setNewBalance] = useState<number | "">("");

  const formatRupiah = (angka: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(angka);

  // Kalkulasi Profit Realtime
  const currentBalance = portfolio[selectedRdnUpdate] || 0;
  const numNewBalance = Number(newBalance) || 0;
  const difference = newBalance !== "" ? numNewBalance - currentBalance : 0;
  const isProfit = difference > 0;

  const colorTheme = type === "joint" ? "purple" : "teal";

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* POP-UP 1: KALKULATOR PROFIT */}
      <Dialog>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "flex-1 md:flex-none",
              type === "joint"
                ? "border-purple-200 text-purple-700 hover:bg-purple-50"
                : "border-teal-200 text-teal-700 hover:bg-teal-50",
            )}
          >
            <TrendingUp className="w-4 h-4 mr-2" /> Kalkulator Profit
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className={`w-5 h-5 text-${colorTheme}-600`} />{" "}
              Kalkulator Portofolio
            </DialogTitle>
            <DialogDescription>
              Cek keuntungan RDN Anda tanpa merusak catatan kas asli.
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
                    {name} (Modal: {formatRupiah(portfolio[name])})
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

            {/* Penjelasan Logika Mengapa Tidak Bisa Simpan Otomatis */}
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 flex items-start gap-2 mt-4">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700 leading-relaxed">
                <strong>Penting:</strong> Karena Anda menggunakan sistem
                "Catatan" (bukan Dompet RDN fisik), aplikasi tidak dapat
                mengubah saldo ini secara otomatis agar Cash Anda tidak bocor.
                Gunakan tombol Topup jika ingin menyesuaikan modal manual.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* POP-UP 2: TARIK DANA */}
      <Dialog>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "flex-1 md:flex-none border-emerald-200 text-emerald-700 hover:bg-emerald-50",
            )}
          >
            <ArrowDownToLine className="w-4 h-4 mr-2" /> Tarik Dana
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowDownToLine className="w-5 h-5 text-emerald-600" /> Tarik
              Tunai dari Saham
            </DialogTitle>
            <DialogDescription>
              Simulasi pencairan aset investasi Anda ke rekening.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold">
                Tarik dari RDN Mana?
              </label>
              <select className="flex h-11 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm outline-none cursor-pointer">
                {Object.keys(portfolio).map((name) => (
                  <option key={name} value={name}>
                    {name}
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
                className="h-12 text-lg font-bold"
                placeholder="0"
              />
            </div>
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 flex items-start gap-2 mt-4">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700 leading-relaxed">
                Sama seperti update profit, lakukan penarikan melalui form
                "Catat Transaksi" manual ke rekening Bank Anda sebagai
                "Pemasukan".
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
