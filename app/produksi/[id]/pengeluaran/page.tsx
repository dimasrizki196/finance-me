"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Wallet,
  PlusCircle,
  ShoppingBag,
  Receipt,
  Calendar,
  Briefcase,
  User,
  Filter,
  Package,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { addTransaction } from "../../produksi";
import { getPeriodDetail, getInventory } from "../actions";

const formatRupiah = (angka: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(angka || 0);

type ExpenseType = "belanja_stok" | "kebutuhan" | "operasional";

export default function PengeluaranPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const periodId = resolvedParams.id;

  const [period, setPeriod] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [inventoryList, setInventoryList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [type, setType] = useState<ExpenseType>("belanja_stok");
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [itemId, setItemId] = useState("");
  const [qtyBought, setQtyBought] = useState("");

  // Filter State
  const [filterType, setFilterType] = useState<"all" | ExpenseType>("all");

  useEffect(() => {
    loadData();
  }, [periodId]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [resDetail, invData] = await Promise.all([
        getPeriodDetail(periodId),
        getInventory(),
      ]);
      if (resDetail) {
        setPeriod(resDetail.period);
        setTransactions(resDetail.transactions || []);
      }
      setInventoryList(invData || []);
    } catch (err) {
      console.error("Gagal memuat data pengeluaran", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0)
      return alert("Masukkan nominal pengeluaran!");

    setIsSubmitting(true);
    try {
      const payload = {
        period_id: periodId,
        date,
        type,
        amount: Number(amount),
        notes,
        item_id: type === "belanja_stok" ? itemId : null,
        qty_bought: type === "belanja_stok" ? Number(qtyBought) : 0,
      };

      await addTransaction(JSON.stringify(payload));

      // Reset Form
      setAmount("");
      setNotes("");
      setItemId("");
      setQtyBought("");
      await loadData();
    } catch (err: any) {
      alert("Gagal menyimpan transaksi: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Kalkulasi Ringkasan Berdasarkan 3 Tipe
  const totalBelanjaStok = transactions
    .filter((t) => t.type === "belanja_stok")
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);

  const totalOperasional = transactions
    .filter((t) => t.type === "operasional")
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);

  const totalKebutuhan = transactions
    .filter((t) => t.type === "kebutuhan")
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);

  // --- TAMBAHKAN KALKULASI INI ---
  const totalPengeluaran = totalBelanjaStok + totalOperasional + totalKebutuhan;

  // Asumsi: period.omzet adalah total uang masuk/modal yang ada
  const totalPemasukan = period?.omzet || 0;
  const sisaKas = totalPemasukan - totalPengeluaran;

  // Filter Transaksi untuk Riwayat
  const filteredTransactions = transactions.filter((t) => {
    if (filterType === "all") return true;
    return t.type === filterType;
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Receipt className="w-10 h-10 text-emerald-600 animate-pulse" />
        <p className="animate-pulse text-zinc-500 font-medium">
          Memuat data pengeluaran...
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-6 sm:space-y-8 animate-in fade-in duration-500">
      {/* HEADER */}
      <div className="flex items-center justify-between pb-6 border-b border-zinc-200">
        <div className="flex items-center gap-3 sm:gap-4">
          <Link href="/produksi">
            <Button
              variant="outline"
              size="icon"
              className="h-10 w-10 sm:h-12 sm:w-12 rounded-full shrink-0 shadow-sm hover:bg-zinc-100"
            >
              <ArrowLeft className="w-5 h-5 text-zinc-600" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-zinc-900 tracking-tight">
              Pengeluaran & Kas Keluar
            </h1>
            <p className="text-xs sm:text-sm text-zinc-500 font-medium mt-0.5">
              Periode:{" "}
              <span className="font-bold text-zinc-800">{period?.name}</span>
            </p>
          </div>
        </div>
      </div>

      <Card className="p-6 bg-emerald-600 rounded-3xl text-white shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <p className="text-emerald-100 font-medium text-sm">
            Total Sisa Saldo / Kas Tersedia
          </p>
          <h2 className="text-3xl sm:text-4xl font-black mt-1">
            {formatRupiah(sisaKas)}
          </h2>
          <p className="text-emerald-200 text-xs mt-2">
            Dari Total Pemasukan:{" "}
            <span className="font-bold">{formatRupiah(totalPemasukan)}</span>
          </p>
        </div>
        <div className="p-3 bg-white/20 rounded-2xl">
          <Wallet className="w-8 h-8 text-white" />
        </div>
      </Card>

      {/* SUMMARY KARTU (3 TIPE) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Belanja Stok */}
        <Card className="p-5 border-amber-200 bg-amber-50/60 rounded-2xl flex items-start justify-between shadow-sm relative overflow-hidden">
          <div className="space-y-1 z-10">
            <p className="text-xs font-bold text-amber-800 uppercase tracking-wider">
              Belanja Stok (Modal)
            </p>
            <p className="text-2xl font-black text-amber-950">
              {formatRupiah(totalBelanjaStok)}
            </p>
            <p className="text-[11px] text-amber-700 font-medium pt-1">
              *Otomatis menambah stok gudang
            </p>
          </div>
          <div className="p-2.5 bg-amber-100/80 text-amber-700 rounded-xl">
            <ShoppingBag className="w-6 h-6" />
          </div>
        </Card>

        {/* Operasional Usaha */}
        <Card className="p-5 border-indigo-200 bg-indigo-50/60 rounded-2xl flex items-start justify-between shadow-sm relative overflow-hidden">
          <div className="space-y-1 z-10">
            <p className="text-xs font-bold text-indigo-800 uppercase tracking-wider">
              Operasional Usaha
            </p>
            <p className="text-2xl font-black text-indigo-950">
              {formatRupiah(totalOperasional)}
            </p>
            <p className="text-[11px] text-indigo-700 font-medium pt-1">
              *Biaya sewa, listrik, gaji, dll.
            </p>
          </div>
          <div className="p-2.5 bg-indigo-100/80 text-indigo-700 rounded-xl">
            <Briefcase className="w-6 h-6" />
          </div>
        </Card>

        {/* Kebutuhan Pribadi */}
        <Card className="p-5 border-rose-200 bg-rose-50/60 rounded-2xl flex items-start justify-between shadow-sm relative overflow-hidden">
          <div className="space-y-1 z-10">
            <p className="text-xs font-bold text-rose-800 uppercase tracking-wider">
              Kebutuhan Pribadi
            </p>
            <p className="text-2xl font-black text-rose-950">
              {formatRupiah(totalKebutuhan)}
            </p>
            <p className="text-[11px] text-rose-700 font-medium pt-1">
              *Pengeluaran non-usaha / prive
            </p>
          </div>
          <div className="p-2.5 bg-rose-100/80 text-rose-700 rounded-xl">
            <User className="w-6 h-6" />
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* FORM INPUT TRANSAKSI */}
        <Card className="lg:col-span-5 p-5 sm:p-6 rounded-3xl border-zinc-200 shadow-sm space-y-5 bg-white">
          <h2 className="text-lg font-bold text-zinc-900 flex items-center gap-2 border-b pb-3">
            <PlusCircle className="w-5 h-5 text-emerald-600" /> Catat
            Pengeluaran Baru
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="font-semibold text-zinc-700">
                Tanggal Transaksi
              </Label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="rounded-xl h-11 border-zinc-200 focus-visible:ring-emerald-500"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="font-semibold text-zinc-700">
                Tipe Pengeluaran
              </Label>
              <select
                value={type}
                onChange={(e: any) => setType(e.target.value)}
                className="w-full h-11 px-3 border border-zinc-200 rounded-xl bg-white text-sm font-semibold text-zinc-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="belanja_stok">
                  📦 Belanja Stok (Tambah Gudang)
                </option>
                <option value="operasional">
                  🏢 Operasional Usaha (Listrik, Gaji, dll)
                </option>
                <option value="kebutuhan">
                  👤 Kebutuhan Pribadi (Prive / Konsumsi)
                </option>
              </select>
            </div>

            {/* Jika Belanja Stok, Tampilkan Form Integrasi Gudang */}
            {type === "belanja_stok" && (
              <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-2xl space-y-3 animate-in fade-in duration-300">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
                  <Package className="w-4 h-4 text-amber-600" /> INTEGRASI STOK
                  GUDANG
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-amber-900 font-semibold">
                    Pilih Item Gudang
                  </Label>
                  <select
                    value={itemId}
                    onChange={(e) => setItemId(e.target.value)}
                    className="w-full h-10 px-3 border border-amber-200 rounded-xl bg-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="">-- Pilih Barang (Opsional) --</option>
                    {inventoryList.map((inv) => (
                      <option key={inv.id} value={inv.id}>
                        {inv.name} (Sisa: {inv.current_stock} {inv.unit})
                      </option>
                    ))}
                  </select>
                </div>

                {itemId && (
                  <div className="space-y-1.5 animate-in fade-in duration-200">
                    <Label className="text-xs text-amber-900 font-semibold">
                      Jumlah Stok Dibeli
                    </Label>
                    <Input
                      type="number"
                      placeholder="Cth: 10"
                      value={qtyBought}
                      onChange={(e) => setQtyBought(e.target.value)}
                      className="rounded-xl bg-white border-amber-200 focus-visible:ring-amber-500"
                    />
                  </div>
                )}
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="font-semibold text-zinc-700">
                Nominal Pengeluaran (Rp)
              </Label>
              <Input
                type="number"
                placeholder="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                className="rounded-xl h-11 font-bold text-lg text-zinc-900 border-zinc-200 focus-visible:ring-emerald-500"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="font-semibold text-zinc-700">
                Catatan / Keterangan
              </Label>
              <Input
                placeholder={
                  type === "belanja_stok"
                    ? "Cth: Beli Tepung Terigu 2 Sak"
                    : type === "operasional"
                      ? "Cth: Bayar Listrik Toko Bulan Ini"
                      : "Cth: Beli Makan Siang"
                }
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="rounded-xl h-11 border-zinc-200 focus-visible:ring-emerald-500"
              />
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-sm transition-all"
            >
              {isSubmitting ? "Menyimpan..." : "Simpan Pengeluaran"}
            </Button>
          </form>
        </Card>

        {/* TABEL / LIST RIWAYAT TRANSAKSI */}
        <Card className="lg:col-span-7 p-5 sm:p-6 rounded-3xl border-zinc-200 shadow-sm space-y-5 bg-white">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4">
            <h2 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
              <Receipt className="w-5 h-5 text-zinc-600" /> Riwayat Transaksi
            </h2>

            {/* FILTER PILLS */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              <Button
                type="button"
                variant={filterType === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterType("all")}
                className={`rounded-full text-xs font-semibold h-8 ${
                  filterType === "all"
                    ? "bg-zinc-900 text-white"
                    : "text-zinc-600 border-zinc-200 hover:bg-zinc-100"
                }`}
              >
                Semua
              </Button>
              <Button
                type="button"
                variant={filterType === "belanja_stok" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterType("belanja_stok")}
                className={`rounded-full text-xs font-semibold h-8 ${
                  filterType === "belanja_stok"
                    ? "bg-amber-600 text-white"
                    : "text-amber-800 border-amber-200 bg-amber-50 hover:bg-amber-100"
                }`}
              >
                Stok
              </Button>
              <Button
                type="button"
                variant={filterType === "operasional" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterType("operasional")}
                className={`rounded-full text-xs font-semibold h-8 ${
                  filterType === "operasional"
                    ? "bg-indigo-600 text-white"
                    : "text-indigo-800 border-indigo-200 bg-indigo-50 hover:bg-indigo-100"
                }`}
              >
                Operasional
              </Button>
              <Button
                type="button"
                variant={filterType === "kebutuhan" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterType("kebutuhan")}
                className={`rounded-full text-xs font-semibold h-8 ${
                  filterType === "kebutuhan"
                    ? "bg-rose-600 text-white"
                    : "text-rose-800 border-rose-200 bg-rose-50 hover:bg-rose-100"
                }`}
              >
                Kebutuhan
              </Button>
            </div>
          </div>

          {/* LIST ITEMS */}
          {filteredTransactions.length > 0 ? (
            <div className="divide-y divide-zinc-100 max-h-[520px] overflow-y-auto pr-1">
              {filteredTransactions.map((tx) => {
                // Tentukan Styling Badge Menurut Tipe
                let badgeStyle = "bg-zinc-100 text-zinc-700";
                let badgeLabel = "Lainnya";

                if (tx.type === "belanja_stok") {
                  badgeStyle =
                    "bg-amber-100 text-amber-800 border-amber-200/60";
                  badgeLabel = "Belanja Stok";
                } else if (tx.type === "operasional") {
                  badgeStyle =
                    "bg-indigo-100 text-indigo-800 border-indigo-200/60";
                  badgeLabel = "Operasional";
                } else if (tx.type === "kebutuhan") {
                  badgeStyle = "bg-rose-100 text-rose-800 border-rose-200/60";
                  badgeLabel = "Kebutuhan";
                }

                return (
                  <div
                    key={tx.id}
                    className="py-3.5 flex justify-between items-center text-sm hover:bg-zinc-50/80 px-2 rounded-xl transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md border ${badgeStyle}`}
                        >
                          {badgeLabel}
                        </span>
                        <span className="text-xs text-zinc-400 font-medium flex items-center gap-1">
                          <Calendar className="w-3 h-3" /> {tx.date}
                        </span>
                      </div>
                      <p className="font-bold text-zinc-900">
                        {tx.notes || "Tanpa Keterangan"}
                      </p>
                      {tx.prod_inventory?.name && (
                        <p className="text-xs text-amber-700 font-medium flex items-center gap-1">
                          <Package className="w-3 h-3" /> Item:{" "}
                          {tx.prod_inventory.name}
                        </p>
                      )}
                    </div>
                    <span className="font-black text-base text-rose-600 shrink-0">
                      -{formatRupiah(tx.amount)}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-10 border border-dashed rounded-2xl text-center text-zinc-400 text-sm bg-zinc-50/50">
              <Filter className="w-8 h-8 mx-auto mb-2 text-zinc-300" />
              Tidak ada riwayat pengeluaran untuk filter ini.
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
