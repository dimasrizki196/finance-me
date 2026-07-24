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
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, PlusCircle, HandCoins, AlignLeft, Banknote } from "lucide-react";
import { createDebt } from "@/app/debts/actions";

export default function DebtForm() {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(formData: FormData) {
    if (!type) {
      alert("Silakan pilih arah pinjaman terlebih dahulu.");
      return;
    }

    setIsSubmitting(true);
    formData.append("type", type);

    try {
      await createDebt(formData);
      setOpen(false);
      setType(""); 
    } catch (error) {
      alert("Gagal mencatat kasbon. Silakan coba lagi.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm w-full sm:w-auto"
      >
        <PlusCircle className="w-4 h-4 mr-2" />
        Catat Kasbon Baru
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[425px] p-6">
          <DialogHeader className="pb-4 border-b border-zinc-100 dark:border-zinc-800">
            <DialogTitle className="flex items-center gap-2 text-xl">
              <HandCoins className="w-5 h-5 text-indigo-600" />
              Catat Pinjaman Baru
            </DialogTitle>
            <DialogDescription>
              Catat siapa yang nalangin atau pinjam uang agar tidak lupa.
            </DialogDescription>
          </DialogHeader>

          <form action={handleSubmit} className="space-y-5 mt-4">
            {/* Arah Pinjaman */}
            <div className="space-y-2">
              <Label htmlFor="type" className="flex items-center gap-1.5">
                <HandCoins className="w-4 h-4 text-blue-600" />
                Siapa yang Pinjam?
              </Label>
              {/* @ts-expect-error: Bug tipe React 19 */}
              <Select onValueChange={(value) => setType(value)} required>
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Pilih skema pinjaman..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dimm_owes_putt">
                    <span className="font-semibold text-blue-600">Dimas</span> pinjam uang Putri
                  </SelectItem>
                  <SelectItem value="putt_owes_dimm">
                    <span className="font-semibold text-rose-600">Putri</span> pinjam uang Dimas
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Input Nominal */}
            <div className="space-y-2">
              <Label htmlFor="amount" className="flex items-center gap-1.5">
                <Banknote className="w-4 h-4 text-emerald-600" />
                Nominal (Rp)
              </Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <span className="text-zinc-500 font-semibold sm:text-sm">Rp</span>
                </div>
                <Input
                  id="amount"
                  name="amount"
                  type="number"
                  required
                  placeholder="0"
                  className="pl-9 h-12 text-lg font-bold bg-zinc-50 dark:bg-zinc-900 border-zinc-200 focus-visible:ring-indigo-500"
                />
              </div>
            </div>

            {/* Input Catatan */}
            <div className="space-y-2">
              <Label htmlFor="description" className="flex items-center gap-1.5">
                <AlignLeft className="w-4 h-4 text-zinc-500" />
                Untuk Keperluan Apa?
              </Label>
              <Input
                id="description"
                name="description"
                required
                placeholder="Misal: Nalangin tiket bioskop"
                className="h-11"
              />
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                className="w-full h-11 text-base font-semibold transition-all bg-indigo-600 hover:bg-indigo-700"
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