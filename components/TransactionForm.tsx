// components/TransactionForm.tsx
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
import { createTransaction } from "@/app/actions";
import {
  Loader2,
  Banknote,
  Tag,
  CalendarDays,
  AlignLeft,
  PlusCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function TransactionForm({
  walletId,
  walletName,
  categories,
  triggerText,
  variant = "default",
}: {
  walletId: string;
  walletName: string;
  categories: any[];
  triggerText: string;
  variant?: "default" | "secondary" | "outline";
}) {
  const [open, setOpen] = useState(false);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(formData: FormData) {
    if (!categoryId) {
      alert("Silakan pilih kategori terlebih dahulu.");
      return;
    }

    setIsSubmitting(true);
    formData.append("category_id", categoryId);
    formData.append("wallet_id", walletId);

    try {
      await createTransaction(formData);
      setOpen(false);
      setCategoryId("");
    } catch (error) {
      alert("Gagal menyimpan transaksi. Silakan coba lagi.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const today = new Date().toISOString().split("T")[0];
  const incomeCats = categories.filter((c) => c.type === "income");
  const expenseCats = categories.filter((c) => c.type === "expense");
  const investCats = categories.filter((c) => c.type === "investment");

  // SOLUSI BUG: Kita cari nama kategori aslinya untuk dipaksa tampil di UI
  const selectedCategoryName = categories.find(
    (c) => c.id === categoryId,
  )?.name;

  return (
    <>
      <Button
        variant={variant}
        className={cn(
          "w-full h-11 rounded-xl font-bold shadow-sm transition-all active:scale-95",
        )}
        onClick={() => setOpen(true)}
      >
        <PlusCircle className="w-5 h-5 mr-1.5" />
        {triggerText.replace("+ ", "")}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="w-[95vw] sm:max-w-[425px] p-5 sm:p-6 rounded-3xl overflow-hidden">
          <DialogHeader className="pb-4 border-b border-zinc-100 dark:border-zinc-800 text-left">
            <DialogTitle className="flex items-center gap-2 text-xl font-bold">
              <div className="p-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg">
                <PlusCircle className="w-5 h-5" />
              </div>
              Catat Transaksi
            </DialogTitle>
            <DialogDescription className="pt-2">
              Tambah riwayat arus kas untuk dompet <strong>{walletName}</strong>
              .
            </DialogDescription>
          </DialogHeader>

          <form action={handleSubmit} className="space-y-5 mt-4 w-full">
            <div className="space-y-2 w-full">
              <Label
                htmlFor="amount"
                className="flex items-center gap-1.5 font-semibold text-zinc-700 dark:text-zinc-300"
              >
                <Banknote className="w-4 h-4 text-emerald-600" /> Nominal
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
                  className="w-full pl-11 h-14 text-xl font-black bg-zinc-50 dark:bg-zinc-900/50 border-zinc-200 rounded-xl focus-visible:ring-zinc-500"
                />
              </div>
            </div>

            <div className="space-y-2 w-full">
              <Label
                htmlFor="category"
                className="flex items-center gap-1.5 font-semibold text-zinc-700 dark:text-zinc-300"
              >
                <Tag className="w-4 h-4 text-blue-600" /> Kategori
              </Label>
              <Select value={categoryId} onValueChange={setCategoryId} required>
                <SelectTrigger className="w-full h-12 bg-zinc-50 dark:bg-zinc-900/50 rounded-xl">
                  <SelectValue placeholder="Pilih jenis kategori...">
                    {selectedCategoryName || "Pilih jenis kategori..."}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="w-full max-h-[300px]">
                  {incomeCats.length > 0 && (
                    <SelectGroup>
                      <SelectLabel className="text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30">
                        Pemasukan
                      </SelectLabel>
                      {incomeCats.map((cat) => (
                        <SelectItem
                          key={cat.id}
                          value={cat.id}
                          className="ml-2"
                        >
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  )}
                  {expenseCats.length > 0 && (
                    <SelectGroup>
                      <SelectLabel className="text-rose-600 bg-rose-50 dark:bg-rose-900/30 mt-1">
                        Pengeluaran
                      </SelectLabel>
                      {expenseCats.map((cat) => (
                        <SelectItem
                          key={cat.id}
                          value={cat.id}
                          className="ml-2"
                        >
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  )}
                  {investCats.length > 0 && (
                    <SelectGroup>
                      <SelectLabel className="text-purple-600 bg-purple-50 dark:bg-purple-900/30 mt-1">
                        Investasi / Aset
                      </SelectLabel>
                      {investCats.map((cat) => (
                        <SelectItem
                          key={cat.id}
                          value={cat.id}
                          className="ml-2"
                        >
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 w-full">
              <Label
                htmlFor="transaction_date"
                className="flex items-center gap-1.5 font-semibold text-zinc-700 dark:text-zinc-300"
              >
                <CalendarDays className="w-4 h-4 text-orange-600" /> Tanggal
                Transaksi
              </Label>
              <Input
                id="transaction_date"
                name="transaction_date"
                type="date"
                required
                defaultValue={today}
                className="w-full h-12 bg-zinc-50 dark:bg-zinc-900/50 rounded-xl cursor-pointer"
              />
            </div>

            <div className="space-y-2 w-full">
              <Label
                htmlFor="notes"
                className="flex items-center gap-1.5 font-semibold text-zinc-700 dark:text-zinc-300"
              >
                <AlignLeft className="w-4 h-4 text-zinc-500" /> Keterangan
              </Label>
              <Input
                id="notes"
                name="notes"
                placeholder="Misal: Beli makan siang, Topup RDN..."
                className="w-full h-12 bg-zinc-50 dark:bg-zinc-900/50 rounded-xl"
              />
            </div>

            <div className="pt-4 w-full">
              <Button
                type="submit"
                className="w-full h-12 text-base font-bold rounded-xl transition-all"
                disabled={isSubmitting || !categoryId}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />{" "}
                    Menyimpan...
                  </>
                ) : (
                  "Simpan Transaksi"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
