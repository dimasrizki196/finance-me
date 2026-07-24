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
  const [categoryId, setCategoryId] = useState("");
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
      setCategoryId(""); // Reset form setelah sukses
    } catch (error) {
      alert("Gagal menyimpan transaksi. Silakan coba lagi.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const today = new Date().toISOString().split("T")[0];

  // Mengelompokkan kategori untuk dropdown yang lebih rapi
  const incomeCats = categories.filter((c) => c.type === "income");
  const expenseCats = categories.filter((c) => c.type === "expense");
  const investCats = categories.filter((c) => c.type === "investment");

  return (
    <>
      {/* 1. Tombol Pemicu di luar Dialog */}
      <Button
        variant={variant}
        className="w-full shadow-sm"
        onClick={() => setOpen(true)}
      >
        {triggerText}
      </Button>

      {/* 2. Modal Dialog-nya */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[425px] p-6">
          <DialogHeader className="pb-4 border-b border-zinc-100 dark:border-zinc-800">
            <DialogTitle className="flex items-center gap-2 text-xl">
              <PlusCircle className="w-5 h-5 text-primary" />
              Catat Transaksi
            </DialogTitle>
            <DialogDescription>
              Tambah riwayat arus kas untuk dompet <strong>{walletName}</strong>
              .
            </DialogDescription>
          </DialogHeader>

          <form action={handleSubmit} className="space-y-5 mt-4">
            {/* Input Nominal dengan Prefix Rp */}
            <div className="space-y-2">
              <Label htmlFor="amount" className="flex items-center gap-1.5">
                <Banknote className="w-4 h-4 text-emerald-600" />
                Nominal
              </Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <span className="text-zinc-500 font-semibold sm:text-sm">
                    Rp
                  </span>
                </div>
                <Input
                  id="amount"
                  name="amount"
                  type="number"
                  required
                  placeholder="0"
                  className="pl-9 h-12 text-lg font-bold bg-zinc-50 dark:bg-zinc-900 border-zinc-200 focus-visible:ring-emerald-500"
                />
              </div>
            </div>

            {/* Dropdown Kategori Berkelompok */}
            <div className="space-y-2">
              <Label htmlFor="category" className="flex items-center gap-1.5">
                <Tag className="w-4 h-4 text-blue-600" />
                Kategori
              </Label>
              {/* @ts-expect-error: Bug tipe React 19 */}
              <Select onValueChange={(value) => setCategoryId(value)} required>
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Pilih jenis kategori..." />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
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

            {/* Input Tanggal */}
            <div className="space-y-2">
              <Label
                htmlFor="transaction_date"
                className="flex items-center gap-1.5"
              >
                <CalendarDays className="w-4 h-4 text-orange-600" />
                Tanggal Transaksi
              </Label>
              <Input
                id="transaction_date"
                name="transaction_date"
                type="date"
                required
                defaultValue={today}
                className="h-11 cursor-pointer"
              />
            </div>

            {/* Input Catatan Tambahan */}
            <div className="space-y-2">
              <Label htmlFor="notes" className="flex items-center gap-1.5">
                <AlignLeft className="w-4 h-4 text-zinc-500" />
                Keterangan
              </Label>
              <Input
                id="notes"
                name="notes"
                placeholder="Misal: Beli makan siang, Topup RDN..."
                className="h-11"
              />
            </div>

            {/* Tombol Simpan dengan Animasi */}
            <div className="pt-2">
              <Button
                type="submit"
                className="w-full h-11 text-base font-semibold transition-all"
                disabled={isSubmitting || !categoryId}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
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
