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
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createTransaction } from "@/app/actions";

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
    setIsSubmitting(true);

    formData.append("category_id", categoryId);
    formData.append("wallet_id", walletId);

    try {
      await createTransaction(formData);
      setOpen(false);
      setCategoryId("");
    } catch (error) {
      alert("Gagal menyimpan transaksi.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const today = new Date().toISOString().split("T")[0];

  return (
    <>
      {/* 1. Tombol Pemicu di luar Dialog */}
      <Button
        variant={variant}
        className="w-full"
        onClick={() => setOpen(true)}
      >
        {triggerText}
      </Button>

      {/* 2. Modal Dialog-nya */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Catat Transaksi</DialogTitle>
            <DialogDescription>
              Dompet: <strong>{walletName}</strong>
            </DialogDescription>
          </DialogHeader>

          <form action={handleSubmit} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Nominal (Rp)</Label>
              <Input
                id="amount"
                name="amount"
                type="number"
                required
                placeholder="Contoh: 50000"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Kategori</Label>
              {/* @ts-expect-error: Bug tipe React 19 */}
              <Select onValueChange={(value) => setCategoryId(value)} required>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih kategori" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name} (
                      {cat.type === "income"
                        ? "Masuk"
                        : cat.type === "expense"
                          ? "Keluar"
                          : cat.type}
                      )
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="transaction_date">Tanggal</Label>
              <Input
                id="transaction_date"
                name="transaction_date"
                type="date"
                required
                defaultValue={today}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Catatan Tambahan</Label>
              <Input
                id="notes"
                name="notes"
                placeholder="Misal: Beli makan siang"
              />
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Menyimpan..." : "Simpan Transaksi"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
