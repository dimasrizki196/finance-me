"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Sunrise,
  Moon,
  TrendingUp,
  CalendarDays,
  Plus,
  Trash2,
  Calculator,
  PieChart,
  History,
  CheckCircle2,
  Save,
  Edit,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  getPeriodDetail,
  saveProduksi,
  savePenjualan,
  deleteDailyRecord,
  getInventory,
} from "./actions";

const formatRupiah = (angka: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(angka || 0);

export default function PeriodDetailPage() {
  const params = useParams();
  const periodId = params.id as string;

  const [data, setData] = useState<{ period: any; records: any[] } | null>(
    null,
  );
  const [inventoryDB, setInventoryDB] = useState<any[]>([]); // Menyimpan stok dari DB
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmittingProduksi, setIsSubmittingProduksi] = useState(false);
  const [isSubmittingPenjualan, setIsSubmittingPenjualan] = useState(false);

  const [activeRecordId, setActiveRecordId] = useState<string | null>(null);
  const [tanggalInput, setTanggalInput] = useState("");

  const [stokInputs, setStokInputs] = useState([{ itemId: "", qty: "" }]);
  const [harianInputs, setHarianInputs] = useState([{ name: "", price: "" }]);
  const [produksiPcs, setProduksiPcs] = useState("");
  const [salesInputs, setSalesInputs] = useState([{ qty: "", price: "" }]);

  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    setTanggalInput(today);
    loadAllData(today);
  }, [periodId]);

  const loadAllData = async (dateToSelect?: string) => {
    setIsLoading(true);
    // Jalankan ambil data secara paralel agar lebih cepat
    const [result, inventory] = await Promise.all([
      getPeriodDetail(periodId),
      getInventory(),
    ]);

    setInventoryDB(inventory);
    if (result) {
      setData(result);
      if (dateToSelect) checkExistingRecord(dateToSelect, result.records);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (data?.records) checkExistingRecord(tanggalInput, data.records);
  }, [tanggalInput]);

  const checkExistingRecord = (date: string, records: any[]) => {
    const existing = records.find((r) => r.date === date);
    if (existing) {
      setActiveRecordId(existing.id);
      setStokInputs(
        existing.detail_stok?.length
          ? existing.detail_stok
          : [{ itemId: "", qty: "" }],
      );
      setHarianInputs(
        existing.detail_harian?.length
          ? existing.detail_harian
          : [{ name: "", price: "" }],
      );
      setProduksiPcs(existing.produksi_pcs?.toString() || "");
      setSalesInputs(
        existing.detail_penjualan?.length
          ? existing.detail_penjualan
          : [{ qty: "", price: "" }],
      );
    } else {
      setActiveRecordId(null);
      setStokInputs([{ itemId: "", qty: "" }]);
      setHarianInputs([{ name: "", price: "" }]);
      setProduksiPcs("");
      setSalesInputs([{ qty: "", price: "" }]);
    }
  };

  const kalkulasi = useMemo(() => {
    const totalStok = stokInputs.reduce((sum, item) => {
      const inventory = inventoryDB.find((i) => i.id === item.itemId);
      const qty = Number(item.qty) || 0;
      return sum + (inventory ? inventory.price_per_unit * qty : 0);
    }, 0);

    const totalHarian = harianInputs.reduce(
      (sum, item) => sum + (Number(item.price) || 0),
      0,
    );
    const totalModalPagi = totalStok + totalHarian;
    const hpp =
      Number(produksiPcs) > 0 ? totalModalPagi / Number(produksiPcs) : 0;

    const totalOmset = salesInputs.reduce(
      (sum, item) => sum + (Number(item.qty) || 0) * (Number(item.price) || 0),
      0,
    );
    const labaKotor = totalOmset - totalModalPagi;
    const labaBersih = labaKotor > 0 ? labaKotor : 0;

    return {
      totalStok,
      totalHarian,
      totalModalPagi,
      hpp,
      totalOmset,
      labaKotor,
      labaBersih,
      alokasiSimpan: labaBersih * 0.25,
      alokasiKebutuhan: labaBersih * 0.5,
      alokasiTabungan: labaBersih * 0.25,
    };
  }, [stokInputs, harianInputs, produksiPcs, salesInputs, inventoryDB]);

  const updateField = (
    setter: any,
    index: number,
    field: string,
    value: string,
  ) => {
    setter((prev: any) => {
      const newArr = [...prev];
      newArr[index][field] = value;
      return newArr;
    });
  };
  const addField = (setter: any, defaultObj: any) =>
    setter((prev: any) => [...prev, defaultObj]);
  const removeField = (setter: any, index: number) =>
    setter((prev: any) => prev.filter((_: any, i: number) => i !== index));

  const handleSimpanProduksi = async () => {
    setIsSubmittingProduksi(true);
    try {
      const payload = {
        id: activeRecordId,
        date: tanggalInput,
        modal_pagi: kalkulasi.totalModalPagi,
        detail_stok: stokInputs,
        detail_harian: harianInputs,
        produksi_pcs: produksiPcs,
      };
      await saveProduksi(periodId, JSON.stringify(payload));
      alert("Data Produksi & Stok Gudang Berhasil Diperbarui!");
      await loadAllData(tanggalInput);
    } catch (error) {
      alert("Gagal menyimpan produksi.");
    } finally {
      setIsSubmittingProduksi(false);
    }
  };

  const handleSimpanPenjualan = async () => {
    if (!activeRecordId) return alert("Simpan Data Produksi terlebih dahulu!");
    setIsSubmittingPenjualan(true);
    try {
      const totalTerjualPcs = salesInputs.reduce(
        (sum, item) => sum + (Number(item.qty) || 0),
        0,
      );
      const payload = {
        id: activeRecordId,
        omset_malam: kalkulasi.totalOmset,
        terjual_pcs: totalTerjualPcs,
        laba_bersih: kalkulasi.labaBersih,
        detail_penjualan: salesInputs,
      };
      await savePenjualan(periodId, JSON.stringify(payload));
      alert("Data Penjualan Berhasil Disimpan!");
      await loadAllData(tanggalInput);
    } catch (error) {
      alert("Gagal menyimpan penjualan.");
    } finally {
      setIsSubmittingPenjualan(false);
    }
  };

  const handleDelete = async (recordId: string) => {
    if (
      confirm(
        "Hapus catatan hari ini? Stok yang terpakai akan otomatis dikembalikan ke Gudang.",
      )
    ) {
      await deleteDailyRecord(recordId);
      loadAllData(tanggalInput);
    }
  };

  if (isLoading)
    return (
      <div className="flex justify-center min-h-screen p-10">
        <p className="animate-pulse">Memuat data...</p>
      </div>
    );
  if (!data?.period)
    return (
      <div className="p-10 text-center font-bold">Periode tidak ditemukan.</div>
    );

  return (
    <div className="p-4 sm:p-6 lg:p-10 max-w-7xl mx-auto space-y-8 w-full pb-20">
      {/* 1. HEADER (Sama seperti sebelumnya) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-zinc-100">
        <div className="flex items-center gap-4">
          <Link href="/produksi">
            <Button
              variant="outline"
              size="icon"
              className="h-12 w-12 rounded-full shadow-sm"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-black">{data.period.name}</h1>
            <p className="text-sm font-medium text-zinc-500 mt-1 flex items-center gap-1.5">
              <CalendarDays className="w-4 h-4" />
              {new Date(data.period.start_date).toLocaleDateString(
                "id-ID",
              )} -{" "}
              {data.period.end_date
                ? new Date(data.period.end_date).toLocaleDateString("id-ID")
                : "Sekarang"}
            </p>
          </div>
        </div>
      </div>

      {/* 3. AREA PENCATATAN & KALKULATOR */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start pt-4 border-t">
        <div className="lg:col-span-7 space-y-6">
          <div className="flex items-center gap-4 bg-zinc-50 p-4 rounded-2xl border">
            <Label className="font-bold">Tanggal Data:</Label>
            <Input
              type="date"
              value={tanggalInput}
              onChange={(e) => setTanggalInput(e.target.value)}
              className="max-w-[160px]"
            />
          </div>

          <Card className="p-6 border-zinc-200 shadow-sm rounded-3xl space-y-6">
            <div className="flex justify-between items-center border-b pb-4">
              <h2 className="text-xl font-black flex items-center gap-2 text-blue-600">
                <Sunrise className="w-6 h-6" /> 1. Produksi Pagi
              </h2>
              <Button
                onClick={handleSimpanProduksi}
                disabled={isSubmittingProduksi}
                className="bg-blue-600 text-white rounded-xl"
              >
                <Save className="w-4 h-4 mr-2" />{" "}
                {activeRecordId ? "Update Produksi" : "Simpan Produksi"}
              </Button>
            </div>

            <div className="space-y-4">
              <Label className="font-bold text-zinc-700">
                A. Bahan Baku (Potong Stok Modal Gudang)
              </Label>
              {stokInputs.map((input, idx) => (
                <div key={idx} className="flex flex-col sm:flex-row gap-3">
                  <select
                    className="flex-1 h-10 rounded-xl border px-3 text-sm bg-white"
                    value={input.itemId}
                    onChange={(e) =>
                      updateField(setStokInputs, idx, "itemId", e.target.value)
                    }
                  >
                    <option value="">-- Pilih Bahan Baku dari Gudang --</option>
                    {inventoryDB.map((inv) => (
                      <option key={inv.id} value={inv.id}>
                        {inv.name} (Sisa: {inv.current_stock} {inv.unit} | Rp{" "}
                        {inv.price_per_unit}/{inv.unit})
                      </option>
                    ))}
                  </select>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder="Qty Terpakai"
                      className="w-28 h-10"
                      value={input.qty}
                      onChange={(e) =>
                        updateField(setStokInputs, idx, "qty", e.target.value)
                      }
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => removeField(setStokInputs, idx)}
                      className="text-red-500"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => addField(setStokInputs, { itemId: "", qty: "" })}
                className="text-blue-600"
              >
                <Plus className="w-4 h-4 mr-1" /> Tambah Bahan Baku
              </Button>
            </div>

            {/* Form Belanja Harian & Kalkulator HPP sama persis seperti sebelumnya */}
            <div className="space-y-4 pt-4 border-t border-dashed">
              <Label className="font-bold text-zinc-700">
                B. Belanja Harian (Langsung Habis)
              </Label>
              {harianInputs.map((input, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  <Input
                    placeholder="Nama Pengeluaran"
                    className="flex-1 h-10"
                    value={input.name}
                    onChange={(e) =>
                      updateField(setHarianInputs, idx, "name", e.target.value)
                    }
                  />
                  <Input
                    type="number"
                    placeholder="Rp"
                    className="w-32 h-10"
                    value={input.price}
                    onChange={(e) =>
                      updateField(setHarianInputs, idx, "price", e.target.value)
                    }
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => removeField(setHarianInputs, idx)}
                    className="h-10 w-10 text-red-500"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() =>
                  addField(setHarianInputs, { name: "", price: "" })
                }
                className="text-xs text-blue-600"
              >
                <Plus className="w-4 h-4 mr-1" /> Tambah Belanja Harian
              </Button>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 items-center bg-blue-50 p-4 rounded-xl mt-4">
              <Input
                type="number"
                placeholder="Hasil Jadi (Pcs)"
                className="flex-1 h-12 font-bold"
                value={produksiPcs}
                onChange={(e) => setProduksiPcs(e.target.value)}
              />
              <div className="text-right w-full sm:w-1/2">
                <p className="text-[10px] text-zinc-500 font-black uppercase">
                  HPP Modal / Pcs
                </p>
                <p className="text-xl font-black text-blue-700">
                  {formatRupiah(kalkulasi.hpp)}
                </p>
              </div>
            </div>
          </Card>

          {/* ... (SESI 2: PENJUALAN MALAM tidak berubah) ... */}
          <Card className="p-6 border-zinc-200 shadow-sm rounded-3xl space-y-6">
            <div className="flex justify-between items-center border-b pb-4">
              <h2 className="text-xl font-black flex items-center gap-2 text-indigo-600">
                <Moon className="w-6 h-6" /> 2. Penjualan Malam
              </h2>
              <Button
                onClick={handleSimpanPenjualan}
                disabled={isSubmittingPenjualan || !activeRecordId}
                className={`${activeRecordId ? "bg-indigo-600 text-white" : "bg-zinc-300 text-zinc-500"}`}
              >
                <Save className="w-4 h-4 mr-2" /> Simpan Penjualan
              </Button>
            </div>

            <div
              className={`space-y-4 ${!activeRecordId ? "opacity-50 pointer-events-none" : ""}`}
            >
              <Label className="font-bold text-zinc-700">
                Rincian Barang Terjual
              </Label>
              {salesInputs.map((input, idx) => (
                <div key={idx} className="flex gap-3 items-center">
                  <Input
                    type="number"
                    placeholder="Qty"
                    className="w-20 h-10 font-bold text-center"
                    value={input.qty}
                    onChange={(e) =>
                      updateField(setSalesInputs, idx, "qty", e.target.value)
                    }
                  />
                  <span className="text-sm font-black text-zinc-400">X</span>
                  <Input
                    type="number"
                    placeholder="Harga Jual / Pcs"
                    className="flex-1 h-10"
                    value={input.price}
                    onChange={(e) =>
                      updateField(setSalesInputs, idx, "price", e.target.value)
                    }
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => removeField(setSalesInputs, idx)}
                    className="text-red-500"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => addField(setSalesInputs, { qty: "", price: "" })}
                className="text-indigo-600"
              >
                <Plus className="w-4 h-4 mr-1" /> Tambah Data Terjual
              </Button>
            </div>
          </Card>
        </div>

        {/* ... (BAGIAN KANAN: KALKULATOR tidak berubah) ... */}
        <div className="lg:col-span-5 relative h-full">
          <div className="sticky top-24 space-y-4">
            <Card className="p-6 bg-zinc-950 text-white shadow-2xl rounded-3xl border-none">
              <h3 className="text-lg font-black flex items-center gap-2 text-zinc-100 mb-6 border-b border-zinc-800 pb-4">
                <Calculator className="w-5 h-5 text-emerald-400" /> Ringkasan
                Otomatis
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-400">Modal Pagi</span>
                  <span className="font-bold text-red-400">
                    -{formatRupiah(kalkulasi.totalModalPagi)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-400">Omset Malam</span>
                  <span className="font-bold text-emerald-400">
                    +{formatRupiah(kalkulasi.totalOmset)}
                  </span>
                </div>
                <div className="flex justify-between items-center border-t border-zinc-800 pt-4">
                  <span className="text-zinc-300 font-bold">Laba Bersih</span>
                  <span
                    className={`text-xl font-black ${kalkulasi.labaKotor >= 0 ? "text-emerald-500" : "text-red-500"}`}
                  >
                    {formatRupiah(kalkulasi.labaKotor)}
                  </span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* 4. RIWAYAT PENCATATAN TETAP SAMA NAMUN DISAMBUNG DENGAN TOMBOL DELETE YANG BARU */}
      <div className="pt-10 mt-10 border-t">
        <h2 className="text-2xl font-black mb-6">Riwayat Pencatatan</h2>
        {data.records.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {data.records.map((record) => (
              <Card
                key={record.id}
                className="shadow-sm border-zinc-200 rounded-2xl overflow-hidden p-5"
              >
                <div className="flex justify-between items-center border-b pb-4 mb-4">
                  <span className="font-bold text-sm">
                    {new Date(record.date).toLocaleDateString("id-ID")}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] font-bold text-zinc-500">MODAL</p>
                    <p className="font-black">
                      {formatRupiah(record.modal_pagi)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-zinc-500">OMSET</p>
                    <p className="font-black">
                      {formatRupiah(record.omset_malam)}
                    </p>
                  </div>
                </div>
                <div className="mt-4 pt-3 flex gap-2 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setTanggalInput(record.date);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    className="flex-1 text-blue-600"
                  >
                    <Edit className="w-3 h-3 mr-1" /> Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleDelete(record.id)}
                    className="text-red-600"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center border-dashed border-2 rounded-3xl">
            <p>Belum Ada Riwayat</p>
          </div>
        )}
      </div>
    </div>
  );
}
