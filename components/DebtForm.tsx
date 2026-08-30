// components/DebtForm.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button"; 
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Plus, HandCoins, AlignLeft, Banknote } from "lucide-react";
import { createDebt } from "@/app/debts/actions";

export default function DebtForm({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(formData: FormData) {
    if (!type) {
      alert("Silakan pilih skema pinjaman terlebih dahulu.");
      return;
    }
    setIsSubmitting(true);
    formData.append("type", type);

    try {
      const result = await createDebt(formData);
      if (result?.success === false) {
        alert("Gagal menyimpan: " + result.message);
      } else {
        setOpen(false);
        setType(""); 
      }
    } catch (error) {
      alert("Terjadi kesalahan sistem saat menyimpan pinjaman.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      {/* TOMBOL PEMICU */}
      <Button
        onClick={() => setOpen(true)}
        className={`bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md transition-all active:scale-95 ${className}`}
      >
        <Plus className="w-5 h-5 mr-1.5" />
        Catat Pinjaman
      </Button>

      {/* MODAL DIALOG (Ditambahkan w-[95vw] agar rapi di Mobile) */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="w-[95vw] sm:max-w-[425px] p-5 sm:p-6 rounded-3xl overflow-hidden">
          <DialogHeader className="pb-4 border-b border-zinc-100 dark:border-zinc-800 text-left">
            <DialogTitle className="flex items-center gap-2 text-xl font-bold">
              <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 rounded-lg">
                <HandCoins className="w-5 h-5" />
              </div>
              Catat Pinjaman
            </DialogTitle>
            <DialogDescription className="pt-2">
              Pilih siapa yang meminjam dan dari mana sumber dananya.
            </DialogDescription>
          </DialogHeader>

          <form action={handleSubmit} className="space-y-5 mt-4 w-full">
            
            <div className="space-y-2 w-full">
              <Label htmlFor="type" className="flex items-center gap-1.5 font-semibold text-zinc-700 dark:text-zinc-300">
                <HandCoins className="w-4 h-4 text-blue-500" /> Skema Pinjaman
              </Label>
              {/* @ts-expect-error: Bug tipe React 19 */}
              <Select onValueChange={(value) => setType(value)} required>
                {/* Ditambahkan w-full agar tidak menciut */}
                <SelectTrigger className="w-full h-12 bg-zinc-50 dark:bg-zinc-900/50 rounded-xl">
                  <SelectValue placeholder="Pilih arah pinjaman..." />
                </SelectTrigger>
                <SelectContent className="w-full max-h-[300px]">
                  <SelectGroup>
                    <SelectLabel className="text-zinc-400">Antar Individu</SelectLabel>
                    {/* Teks diubah menjadi plain text agar SelectValue terbaca normal */}
                    <SelectItem value="dimm_owes_putt">Dimas pinjam uang Putri</SelectItem>
                    <SelectItem value="putt_owes_dimm">Putri pinjam uang Dimas</SelectItem>
                  </SelectGroup>
                  <SelectGroup>
                    <SelectLabel className="text-zinc-400 mt-2">Pinjam ke Tabungan</SelectLabel>
                    <SelectItem value="dimm_owes_tabungan">Dimas pakai Tabungan Kita</SelectItem>
                    <SelectItem value="putt_owes_tabungan">Putri pakai Tabungan Kita</SelectItem>
                  </SelectGroup>
                  <SelectGroup>
                    <SelectLabel className="text-zinc-400 mt-2">Nalangin Tabungan</SelectLabel>
                    <SelectItem value="tabungan_owes_dimm">Tabungan Kita pakai uang Dimas</SelectItem>
                    <SelectItem value="tabungan_owes_putt">Tabungan Kita pakai uang Putri</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 w-full">
              <Label htmlFor="amount" className="flex items-center gap-1.5 font-semibold text-zinc-700 dark:text-zinc-300">
                <Banknote className="w-4 h-4 text-emerald-500" /> Nominal (Rp)
              </Label>
              <div className="relative w-full">
                <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                  <span className="text-zinc-500 font-bold">Rp</span>
                </div>
                <Input
                  id="amount"
                  name="amount"
                  type="number"
                  required
                  placeholder="0"
                  className="w-full pl-11 h-14 text-xl font-black bg-zinc-50 dark:bg-zinc-900/50 border-zinc-200 rounded-xl focus-visible:ring-indigo-500"
                />
              </div>
            </div>

            <div className="space-y-2 w-full">
              <Label htmlFor="description" className="flex items-center gap-1.5 font-semibold text-zinc-700 dark:text-zinc-300">
                <AlignLeft className="w-4 h-4 text-orange-500" /> Keterangan
              </Label>
              <Input
                id="description"
                name="description"
                required
                placeholder="Misal: Nalangin tiket bioskop"
                className="w-full h-12 bg-zinc-50 dark:bg-zinc-900/50 rounded-xl"
              />
            </div>

            <div className="pt-4 w-full">
              <Button
                type="submit"
                className="w-full h-12 text-base font-bold rounded-xl transition-all bg-indigo-600 hover:bg-indigo-700"
                disabled={isSubmitting || !type}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  "Simpan Catatan"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}