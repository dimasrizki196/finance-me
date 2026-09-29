"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Warehouse,
  PlusCircle,
  Edit3,
  Check,
  Package,
  X,
  PackageOpen,
  DollarSign,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  getInventory,
  addInventoryItem,
  updateInventoryStock,
} from "../actions";

const formatRupiah = (angka: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(angka || 0);

export default function GudangPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const periodId = resolvedParams.id;

  const [inventory, setInventory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Form Tambah Barang
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [unit, setUnit] = useState("kg");
  const [initialStock, setInitialStock] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit Stok Quick Mode
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editStockValue, setEditStockValue] = useState("");

  useEffect(() => {
    loadInventory();
  }, []);

  const loadInventory = async () => {
    setIsLoading(true);
    try {
      const data = await getInventory();
      setInventory(data || []);
    } catch (err) {
      console.error("Gagal memuat inventaris gudang", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      await addInventoryItem(name, unit, Number(initialStock) || 0);
      setName("");
      setUnit("kg");
      setInitialStock("");
      setShowForm(false);
      await loadInventory();
    } catch (err: any) {
      alert("Gagal menambah barang: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveStock = async (id: string) => {
    try {
      await updateInventoryStock(id, Number(editStockValue));
      setEditingId(null);
      await loadInventory();
    } catch (err: any) {
      alert("Gagal mengupdate stok: " + err.message);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Warehouse className="w-10 h-10 text-amber-500 animate-pulse" />
        <p className="animate-pulse text-zinc-500 font-medium">
          Memuat data gudang...
        </p>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 w-full animate-in fade-in duration-700">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-zinc-200">
        <div className="flex items-start sm:items-center gap-3 sm:gap-4">
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
              Gudang & Inventaris
            </h1>
            <p className="text-xs sm:text-sm text-zinc-500 font-medium mt-0.5">
              Kelola stok bahan baku dan pantau ketersediaan
            </p>
          </div>
        </div>

        <Button
          onClick={() => setShowForm(!showForm)}
          className="w-full sm:w-auto bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold h-11 px-5 shadow-sm transition-all"
        >
          {showForm ? (
            <>
              <X className="w-5 h-5 mr-2" /> Batal Tambah
            </>
          ) : (
            <>
              <PlusCircle className="w-5 h-5 mr-2" /> Tambah Barang
            </>
          )}
        </Button>
      </div>

      {/* FORM TAMBAH BARANG */}
      {showForm && (
        <Card className="p-5 sm:p-6 border-amber-200 bg-amber-50/60 rounded-2xl sm:rounded-3xl shadow-sm animate-in slide-in-from-top-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
            <Warehouse className="w-32 h-32" />
          </div>

          <div className="relative z-10">
            <h2 className="text-lg font-bold text-amber-900 flex items-center gap-2 mb-4">
              <Package className="w-5 h-5 text-amber-600" /> Registrasi Barang
              Baru
            </h2>
            <form
              onSubmit={handleAddItem}
              className="grid grid-cols-1 sm:grid-cols-12 gap-4 sm:gap-5"
            >
              <div className="space-y-1.5 sm:col-span-5">
                <Label className="text-amber-900/80 font-semibold">
                  Nama Barang
                </Label>
                <Input
                  placeholder="Cth: Tepung Terigu, Gula"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="bg-white/80 focus:bg-white rounded-xl border-amber-200 focus-visible:ring-amber-500 h-11"
                />
              </div>
              <div className="space-y-1.5 sm:col-span-3">
                <Label className="text-amber-900/80 font-semibold">
                  Satuan
                </Label>
                <Input
                  placeholder="Cth: kg, pcs, liter"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  required
                  className="bg-white/80 focus:bg-white rounded-xl border-amber-200 focus-visible:ring-amber-500 h-11"
                />
              </div>
              <div className="space-y-1.5 sm:col-span-4">
                <Label className="text-amber-900/80 font-semibold">
                  Stok Awal
                </Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={initialStock}
                  onChange={(e) => setInitialStock(e.target.value)}
                  className="bg-white/80 focus:bg-white rounded-xl border-amber-200 focus-visible:ring-amber-500 h-11"
                />
              </div>

              <div className="sm:col-span-12 flex justify-end gap-3 mt-2 sm:mt-0 pt-2 border-t sm:border-t-0 border-amber-200/50">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowForm(false)}
                  className="rounded-xl font-semibold text-amber-800 hover:text-amber-900 hover:bg-amber-100 h-11 px-5"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold h-11 px-6 shadow-sm"
                >
                  {isSubmitting ? "Menyimpan..." : "Simpan ke Gudang"}
                </Button>
              </div>
            </form>
          </div>
        </Card>
      )}

      {/* DAFTAR BARANG GUDANG */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold flex items-center gap-2 text-zinc-800">
            <Warehouse className="w-5 h-5 text-amber-500" /> Sisa Stok Saat Ini
          </h2>
          <span className="text-sm font-medium text-zinc-500 bg-zinc-100 px-3 py-1 rounded-full">
            Total {inventory.length} Item
          </span>
        </div>

        {inventory.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
            {inventory.map((item) => (
              <Card
                key={item.id}
                className="group p-5 border-zinc-200/80 hover:border-amber-300 hover:shadow-md transition-all duration-300 rounded-2xl flex flex-col justify-between space-y-4 bg-white"
              >
                {/* Bagian Atas: Info Barang */}
                <div className="flex justify-between items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <h3
                      className="font-bold text-zinc-900 text-base lg:text-lg truncate"
                      title={item.name}
                    >
                      {item.name}
                    </h3>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-zinc-100 text-zinc-600 mt-1.5">
                      Satuan: {item.unit}
                    </span>
                  </div>
                  <div className="p-2.5 bg-amber-50 rounded-xl text-amber-600 group-hover:bg-amber-100 transition-colors shrink-0">
                    <Package className="w-5 h-5" />
                  </div>
                </div>

                <div className="space-y-3">
                  {/* Harga Modal Badge */}
                  <div className="flex items-center gap-2 text-xs bg-emerald-50/50 p-2 rounded-lg border border-emerald-100/50">
                    <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-zinc-600">Modal:</span>
                    <span className="font-bold text-emerald-700">
                      {formatRupiah(item.price_per_unit)}
                    </span>
                  </div>

                  {/* Bagian Bawah: Stok & Aksi */}
                  <div className="pt-3 border-t border-zinc-100 flex justify-between items-end">
                    {/* Mode Edit vs View */}
                    {editingId === item.id ? (
                      <div className="flex flex-col gap-1.5 w-full">
                        <Label className="text-[10px] uppercase font-bold text-zinc-400">
                          Update Stok
                        </Label>
                        <div className="flex items-center gap-2 w-full">
                          <Input
                            type="number"
                            value={editStockValue}
                            onChange={(e) => setEditStockValue(e.target.value)}
                            className="h-9 flex-1 text-sm rounded-lg focus-visible:ring-amber-500"
                            autoFocus
                          />
                          <div className="flex gap-1">
                            <Button
                              size="icon"
                              className="h-9 w-9 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-sm"
                              onClick={() => handleSaveStock(item.id)}
                            >
                              <Check className="w-4 h-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="outline"
                              className="h-9 w-9 rounded-lg border-zinc-200 text-zinc-500 hover:bg-zinc-100"
                              onClick={() => setEditingId(null)}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div>
                          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-0.5">
                            Stok Tersedia
                          </p>
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-2xl font-black text-zinc-900 tracking-tight">
                              {item.current_stock}
                            </span>
                            <span className="text-sm font-medium text-zinc-500">
                              {item.unit}
                            </span>
                          </div>
                        </div>

                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-zinc-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                          onClick={() => {
                            setEditingId(item.id);
                            setEditStockValue(String(item.current_stock));
                          }}
                        >
                          <Edit3 className="w-4 h-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-10 sm:p-16 border-2 border-dashed border-zinc-200 rounded-3xl bg-zinc-50/50">
            <div className="w-16 h-16 bg-zinc-100 text-zinc-400 rounded-full flex items-center justify-center mb-4">
              <PackageOpen className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-zinc-700 mb-1">
              Gudang Masih Kosong
            </h3>
            <p className="text-zinc-500 text-sm text-center max-w-sm mb-5">
              Belum ada data barang atau bahan baku yang terdaftar di sistem.
            </p>
            <Button
              onClick={() => setShowForm(true)}
              variant="outline"
              className="rounded-xl border-zinc-300 font-semibold"
            >
              <PlusCircle className="w-4 h-4 mr-2" /> Registrasi Barang Pertama
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
