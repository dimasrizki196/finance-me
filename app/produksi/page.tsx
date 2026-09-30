"use client";

import { useEffect, useState } from "react";
import {
  Store,
  PlusCircle,
  ArrowLeft,
  Calendar,
  PlayCircle,
  Package,
  PieChart,
  Wallet,
  ArrowDownCircle,
  ArrowUpCircle,
  History,
  BookOpen,
  Warehouse,
  Edit2,
  Save,
  Loader2,
  Lock,
} from "lucide-react";
import Link from "next/link";

// 1. Import fungsi dasar
import {
  getAllPeriods,
  createPeriod,
  updatePeriodSettings,
  getPeriodTransactions,
  closePeriod,
} from "./produksi";

// 2. Import fungsi detail
import { getPeriodDetail } from "./[id]/actions";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const formatRupiah = (angka: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(angka || 0);

export default function ProduksiPage() {
  const [periods, setPeriods] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // State Form Buka Periode
  const [showForm, setShowForm] = useState(false);
  const [newPeriod, setNewPeriod] = useState({
    name: "",
    modalAwal: "",
    startDate: "",
    endDate: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // State Dashboard
  const [selectedPeriod, setSelectedPeriod] = useState<any>(null);
  const [summaryData, setSummaryData] = useState<any>(null);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);

  // State Alokasi Dinamis (Default: 25, 50, 25)
  const [isEditingAlloc, setIsEditingAlloc] = useState(false);
  const [allocations, setAllocations] = useState({
    pct_modal: 25,
    pct_kebutuhan: 50,
    pct_tabungan: 25,
  });
  const [allocError, setAllocError] = useState("");
  const [isSavingAlloc, setIsSavingAlloc] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await getAllPeriods();
      setPeriods(data);

      if (data.length > 0) {
        handleSelectPeriod(data[0]);
      }
    } catch (error) {
      console.error("Gagal memuat data", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectPeriod = async (period: any) => {
    setSelectedPeriod(period);
    setIsLoadingSummary(true);
    setIsEditingAlloc(false);
    try {
      // 1. Ambil detail buku harian
      const res = await getPeriodDetail(period.id);
      // 2. Ambil semua kas keluar
      const trxs = await getPeriodTransactions(period.id);

      let totalModalStok = 0;
      let totalOmzet = 0;
      let totalPengeluaranEkstra = 0;

      // Hitung Omzet dan Pengeluaran Harian dari Buku Harian
      if (res && res.records) {
        res.records.forEach((rec: any) => {
          totalModalStok += Number(rec.modal_pagi || 0);
          totalOmzet += Number(rec.omset_malam || 0);

          if (rec.detail_harian && Array.isArray(rec.detail_harian)) {
            rec.detail_harian.forEach((item: any) => {
              totalPengeluaranEkstra += Number(item.price || 0);
            });
          }
        });
      }

      let pengeluaranPribadi = 0;
      let pengeluaranOperasional = 0;

      // Hitung Kebutuhan Pribadi & Operasional dari Kas Keluar (prod_transactions)
      if (trxs && Array.isArray(trxs)) {
        trxs.forEach((t: any) => {
          const type = (t.type || "").toLowerCase();
          // Klasifikasi berdasarkan tipe transaksi
          if (type.includes("pribadi") || type.includes("kebutuhan")) {
            pengeluaranPribadi += Number(t.amount || 0);
          } else if (type.includes("operasional")) {
            pengeluaranOperasional += Number(t.amount || 0);
          }
        });
      }

      // 1. Total Pengeluaran Modal (Stok HPP + Belanja Ekstra Harian)
      const totalPengeluaranModal = totalModalStok + totalPengeluaranEkstra;

      // 2. Laba Bersih
      const labaBersih = totalOmzet - totalPengeluaranModal;

      const modalAwal = Number(res?.period?.modal_awal || 0);

      // 3. Uang Cash Akhir
      const uangCashAkhir =
        modalAwal + labaBersih - pengeluaranPribadi - pengeluaranOperasional;

      // .

      // Terapkan default 25, 50, 25 jika belum ada setting di database
      const initialSettings = res?.period?.settings || {
        pct_modal: 25,
        pct_kebutuhan: 50,
        pct_tabungan: 25,
      };

      setAllocations(initialSettings);

      setSummaryData({
        modalAwal,
        totalOmzet,
        totalPengeluaranModal,
        labaBersih,
        pengeluaranPribadi,
        pengeluaranOperasional,
        uangCashAkhir,
      });
    } catch (error) {
      console.error("Gagal memuat ringkasan", error);
    } finally {
      setIsLoadingSummary(false);
    }
  };

  const handleCreatePeriod = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPeriod.name || !newPeriod.startDate || !newPeriod.endDate) return;

    setIsSubmitting(true);
    try {
      // Tambahkan Number(newPeriod.modalAwal) ke dalam pemanggilan fungsi
      await createPeriod(
        newPeriod.name,
        newPeriod.startDate,
        newPeriod.endDate,
        Number(newPeriod.modalAwal) || 0,
      );
      // Kosongkan form kembali
      setNewPeriod({ name: "", startDate: "", endDate: "", modalAwal: "" });
      setShowForm(false);
      await loadData();
    } catch (error) {
      alert("Gagal membuat periode");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveAllocations = async () => {
    const total =
      Number(allocations.pct_modal) +
      Number(allocations.pct_kebutuhan) +
      Number(allocations.pct_tabungan);

    if (total !== 100) {
      setAllocError(`Total harus 100% (Saat ini: ${total}%)`);
      return;
    }

    setAllocError("");
    setIsSavingAlloc(true);

    try {
      await updatePeriodSettings(selectedPeriod.id, allocations);
      setIsEditingAlloc(false);
    } catch (error) {
      console.error(error);
      setAllocError("Gagal menyimpan ke database");
    } finally {
      setIsSavingAlloc(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const handleClosePeriod = async () => {
    if (!selectedPeriod) return;

    const confirmClose = window.confirm(
      `⚠️ PERINGATAN TUTUP BUKU\n\nApakah Anda yakin ingin menutup periode "${selectedPeriod.name}"?\n\nSetelah ditutup:\n• Periode ini akan berstatus "Closed".\n• Akan berpindah ke Riwayat Periode.`,
    );

    if (!confirmClose) return;

    setIsClosing(true);
    try {
      await closePeriod(selectedPeriod.id);

      // Reload seluruh data dari Supabase
      const updatedPeriods = await getAllPeriods();
      // Atau jika kamu memakai fungsi loadData() lokal:
      // await loadData();

      // Cari periode aktif lain yang tersisa (jika ada) untuk dijadikan selectedPeriod
      const remainingActive = updatedPeriods.find(
        (p: any) => p.status === "active",
      );
      if (remainingActive) {
        setSelectedPeriod(remainingActive);
      } else if (updatedPeriods.length > 0) {
        setSelectedPeriod(updatedPeriods[0]);
      } else {
        setSelectedPeriod(null);
      }

      alert(`Periode "${selectedPeriod.name}" berhasil ditutup.`);
    } catch (error) {
      console.error("Gagal menutup periode:", error);
      alert("Gagal menutup periode. Silakan coba lagi.");
    } finally {
      setIsClosing(false);
    }
  };

  const activePeriods = periods.filter((p) => p.status === "active");
  const closedPeriods = periods.filter((p) => p.status === "closed");

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="animate-pulse text-zinc-500 font-medium text-sm">
          Memuat data usaha...
        </p>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 w-full animate-in fade-in duration-700">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-100 dark:border-zinc-800">
        <div className="flex items-center gap-3 sm:gap-4">
          <Link href="/">
            <Button
              variant="outline"
              size="icon"
              className="h-10 w-10 sm:h-12 sm:w-12 rounded-full shadow-sm hover:bg-zinc-100 dark:hover:bg-zinc-800 border-zinc-200"
            >
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 text-zinc-600 dark:text-zinc-300" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight text-foreground">
              Manajemen Usaha
            </h1>
            <p className="text-xs sm:text-sm font-medium text-muted-foreground mt-0.5 flex items-center gap-1.5">
              <Store className="w-3.5 h-3.5" /> Kelola Siklus, Stok, dan Laba
            </p>
          </div>
        </div>
        <div className="w-full sm:w-auto">
          <Button
            onClick={() => setShowForm(!showForm)}
            className="w-full sm:w-auto bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl font-bold h-10 sm:h-11 px-5 active:scale-95 text-sm"
          >
            <PlusCircle className="w-4 h-4 mr-2" /> Buka Periode
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        {/* KIRI: DAFTAR PERIODE */}
        <div className="lg:col-span-7 space-y-6">
          {showForm && (
            <Card className="p-5 sm:p-6 border-orange-200 bg-orange-50/50 shadow-sm rounded-2xl animate-in slide-in-from-top-4">
              <h2 className="text-lg sm:text-xl font-bold mb-4 flex items-center gap-2">
                <Package className="w-5 h-5 text-orange-500" /> Mulai Siklus
                Baru
              </h2>
              <form
                onSubmit={handleCreatePeriod}
                className="grid grid-cols-1 md:grid-cols-2 gap-4"
              >
                <div className="space-y-1.5 md:col-span-2">
                  <Label className="text-xs sm:text-sm">
                    Nama Periode / Batch
                  </Label>
                  <Input
                    placeholder="Cth: September - Oktober 2026"
                    value={newPeriod.name}
                    onChange={(e) =>
                      setNewPeriod({ ...newPeriod, name: e.target.value })
                    }
                    disabled={isSubmitting}
                    className="h-10 sm:h-11 rounded-xl bg-white text-sm"
                    required
                  />
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <Label className="text-xs sm:text-sm">Modal Awal (Rp)</Label>
                  <Input
                    type="number"
                    placeholder="Contoh: 5000000 (tanpa titik)"
                    value={newPeriod.modalAwal}
                    onChange={(e) =>
                      setNewPeriod({ ...newPeriod, modalAwal: e.target.value })
                    }
                    disabled={isSubmitting}
                    className="h-10 sm:h-11 rounded-xl bg-white text-sm"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs sm:text-sm">Tanggal Mulai</Label>
                  <Input
                    type="date"
                    value={newPeriod.startDate}
                    onChange={(e) =>
                      setNewPeriod({ ...newPeriod, startDate: e.target.value })
                    }
                    disabled={isSubmitting}
                    className="h-10 sm:h-11 rounded-xl bg-white text-sm"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs sm:text-sm">Tanggal Akhir</Label>
                  <Input
                    type="date"
                    value={newPeriod.endDate}
                    onChange={(e) =>
                      setNewPeriod({ ...newPeriod, endDate: e.target.value })
                    }
                    disabled={isSubmitting}
                    className="h-10 sm:h-11 rounded-xl bg-white text-sm"
                    required
                  />
                </div>
                <div className="md:col-span-2 flex justify-end gap-2 mt-2 pt-4 border-t border-orange-200/50">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowForm(false)}
                    className="h-9 sm:h-10 rounded-xl text-xs sm:text-sm"
                  >
                    Batal
                  </Button>
                  <Button
                    type="submit"
                    className="h-9 sm:h-10 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold px-6 shadow-md text-xs sm:text-sm"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Menyimpan..." : "Simpan Periode"}
                  </Button>
                </div>
              </form>
            </Card>
          )}

          <div className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold flex items-center gap-2">
              <PlayCircle className="w-4 h-4 text-orange-500" /> Siklus Berjalan
              (Aktif)
            </h2>
            {activePeriods.length > 0 ? (
              <div className="grid grid-cols-1 gap-3">
                {activePeriods.map((period) => (
                  <Card
                    key={period.id}
                    onClick={() => handleSelectPeriod(period)}
                    className={`cursor-pointer transition-all hover:shadow-md p-4 rounded-xl border-2 ${
                      selectedPeriod?.id === period.id
                        ? "border-orange-500 bg-orange-50 dark:bg-orange-900/10"
                        : "border-zinc-200 hover:border-orange-300"
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="px-2 py-0.5 rounded bg-orange-100 text-orange-700 text-[10px] font-black uppercase mb-1.5 inline-block">
                          Aktif
                        </span>
                        <p className="font-bold text-base sm:text-lg text-zinc-900">
                          {period.name}
                        </p>
                        <p className="text-[11px] sm:text-xs text-zinc-500 mt-1 font-medium">
                          <Calendar className="inline w-3 h-3 mr-1" />
                          {formatDate(period.start_date)} s/d{" "}
                          {formatDate(period.end_date)}
                        </p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="p-5 bg-zinc-50 border border-dashed rounded-xl text-center">
                <p className="text-xs sm:text-sm text-zinc-500">
                  Belum Ada Siklus Aktif
                </p>
              </div>
            )}
          </div>

          {closedPeriods.length > 0 && (
            <div className="space-y-3 pt-2">
              <h2 className="text-base sm:text-lg font-bold flex items-center gap-2">
                <History className="w-4 h-4 text-zinc-500" /> Riwayat Tutup Buku
              </h2>
              <div className="grid grid-cols-1 gap-3">
                {closedPeriods.map((period) => (
                  <Card
                    key={period.id}
                    onClick={() => handleSelectPeriod(period)}
                    className={`cursor-pointer transition-all hover:shadow-md p-3 sm:p-4 rounded-xl border-2 ${
                      selectedPeriod?.id === period.id
                        ? "border-zinc-800 bg-zinc-100"
                        : "border-zinc-200"
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-bold text-sm sm:text-base text-zinc-700">
                          {period.name}
                        </p>
                        <p className="text-[11px] sm:text-xs text-zinc-500 mt-0.5">
                          {formatDate(period.start_date)} s/d{" "}
                          {formatDate(period.end_date)}
                        </p>
                      </div>
                      <span className="text-[10px] bg-zinc-200 text-zinc-500 px-2 py-1 rounded uppercase font-bold">
                        Tutup
                      </span>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* KANAN: DASHBOARD */}
        <div className="lg:col-span-5 space-y-5 lg:pl-6 lg:border-l border-zinc-200 h-full">
          {selectedPeriod ? (
            <div className="sticky top-6 space-y-5">
              <div>
                <h2 className="text-lg sm:text-xl font-black text-foreground">
                  {selectedPeriod.name}
                </h2>
                <p className="text-xs sm:text-sm text-zinc-500">
                  Dashboard Ringkasan
                </p>
              </div>

              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                <Link
                  href={`/produksi/${selectedPeriod.id}`}
                  className="w-full"
                >
                  <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm flex flex-col h-auto py-2.5 px-1 gap-1">
                    <BookOpen className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span className="text-[10px] sm:text-xs font-medium">
                      Buku Harian
                    </span>
                  </Button>
                </Link>
                <Link
                  href={`/produksi/${selectedPeriod.id}/gudang`}
                  className="w-full"
                >
                  <Button
                    variant="outline"
                    className="w-full border-amber-500 text-amber-700 hover:bg-amber-50 rounded-xl flex flex-col h-auto py-2.5 px-1 gap-1"
                  >
                    <Warehouse className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span className="text-[10px] sm:text-xs font-medium">
                      Gudang Stok
                    </span>
                  </Button>
                </Link>
                <Link
                  href={`/produksi/${selectedPeriod.id}/pengeluaran`}
                  className="w-full"
                >
                  <Button
                    variant="outline"
                    className="w-full border-emerald-500 text-emerald-700 hover:bg-emerald-50 rounded-xl flex flex-col h-auto py-2.5 px-1 gap-1"
                  >
                    <Wallet className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span className="text-[10px] sm:text-xs font-medium">
                      Kas Keluar
                    </span>
                  </Button>
                </Link>
              </div>

              {/* KONTROL STATUS PERIODE (TUTUP BUKU / BADGE CLOSED) */}
              {selectedPeriod.status === "active" ? (
                <Button
                  onClick={handleClosePeriod}
                  disabled={isClosing}
                  variant="destructive"
                  className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold h-11 rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 text-xs sm:text-sm active:scale-[0.98]"
                >
                  {isClosing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Memproses Tutup Buku...</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      <span>Tutup Buku / Periode Ini</span>
                    </>
                  )}
                </Button>
              ) : (
                /* Tampilan Opsional jika periode yang sedang dipilih sudah Closed */
                <div className="w-full py-2.5 px-4 bg-zinc-100 border border-zinc-200 rounded-xl flex items-center justify-center gap-2 text-zinc-500 text-xs sm:text-sm font-medium">
                  <Lock className="w-4 h-4 text-zinc-400" />
                  <span>Periode Ini Telah Ditutup (Selesai)</span>
                </div>
              )}

              {isLoadingSummary ? (
                <div className="p-6 text-center bg-zinc-50 rounded-2xl animate-pulse">
                  <p className="text-xs sm:text-sm text-zinc-500 font-medium">
                    Menghitung kalkulasi...
                  </p>
                </div>
              ) : summaryData ? (
                <div className="space-y-4">
                  {/* KARTU 1: ALUR KAS & LABA */}
                  <Card className="p-4 border-zinc-200 shadow-sm rounded-2xl bg-white space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                        Status Modal Awal
                      </span>
                      {summaryData.uangCashAkhir >= summaryData.modalAwal ? (
                        <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-black flex items-center gap-1">
                          ✓ Sudah Balik Modal
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-black flex items-center gap-1">
                          ⏳ Belum Balik Modal
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1 border-t border-zinc-100">
                      <div>
                        <p className="text-[11px] text-zinc-500 font-medium">
                          Modal Awal
                        </p>
                        <p className="text-sm font-bold text-zinc-800">
                          {formatRupiah(summaryData.modalAwal)}
                        </p>
                      </div>
                      <div>
                        <p className="text-[11px] text-zinc-500 font-medium">
                          {summaryData.uangCashAkhir >= summaryData.modalAwal
                            ? "Surplus / Keuntungan"
                            : "Kurang Modal (Target)"}
                        </p>
                        <p
                          className={`text-sm font-bold ${
                            summaryData.uangCashAkhir >= summaryData.modalAwal
                              ? "text-emerald-600"
                              : "text-amber-600"
                          }`}
                        >
                          {formatRupiah(
                            Math.abs(
                              summaryData.uangCashAkhir - summaryData.modalAwal,
                            ),
                          )}
                        </p>
                      </div>
                    </div>
                  </Card>
                  <Card className="p-4 sm:p-5 border-zinc-200 shadow-sm rounded-2xl space-y-3 sm:space-y-4">
                    {/* 1. Omzet */}
                    <div className="flex justify-between items-center border-b border-zinc-100 pb-2.5">
                      <span className="text-xs sm:text-sm font-semibold text-zinc-500 flex items-center gap-1.5">
                        <ArrowUpCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-500" />{" "}
                        Omzet Periode
                      </span>
                      <span className="text-sm sm:text-base font-black text-emerald-600">
                        {formatRupiah(summaryData.totalOmzet)}
                      </span>
                    </div>

                    {/* 2. Pengeluaran Modal (Stok & Ekstra) */}
                    <div className="flex justify-between items-center border-b border-zinc-100 pb-2.5">
                      <span className="text-xs sm:text-sm font-semibold text-zinc-500 flex items-center gap-1.5">
                        <ArrowDownCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-500" />{" "}
                        Pengeluaran Modal
                      </span>
                      <span className="text-sm sm:text-base font-black text-red-600">
                        -{formatRupiah(summaryData.totalPengeluaranModal)}
                      </span>
                    </div>

                    {/* 3. Laba Bersih */}
                    <div className="flex justify-between items-center border-b border-zinc-100 pb-2.5 pt-1">
                      <span className="text-sm sm:text-base font-bold text-zinc-700">
                        Laba Bersih
                      </span>
                      <span className="text-lg sm:text-xl font-black text-blue-600">
                        {formatRupiah(summaryData.labaBersih)}
                      </span>
                    </div>

                    {/* 4. Pengeluaran Pribadi */}
                    <div className="flex justify-between items-center border-b border-zinc-100 pb-2.5">
                      <span className="text-xs sm:text-sm font-semibold text-zinc-500 flex items-center gap-1.5 ml-2">
                        <Wallet className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-orange-500" />{" "}
                        Kebutuhan Pribadi
                      </span>
                      <span className="text-sm sm:text-base font-black text-orange-600">
                        -{formatRupiah(summaryData.pengeluaranPribadi)}
                      </span>
                    </div>

                    {/* 5. Pengeluaran Operasional */}
                    <div className="flex justify-between items-center border-b border-zinc-100 pb-2.5">
                      <span className="text-xs sm:text-sm font-semibold text-zinc-500 flex items-center gap-1.5 ml-2">
                        <Store className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-orange-500" />{" "}
                        Operasional Usaha
                      </span>
                      <span className="text-sm sm:text-base font-black text-orange-600">
                        -{formatRupiah(summaryData.pengeluaranOperasional)}
                      </span>
                    </div>

                    {/* 6. Total Cash */}
                    <div className="pt-2">
                      <div className="flex justify-between items-center bg-emerald-50 p-3 sm:p-4 rounded-xl border border-emerald-100">
                        <span className="text-sm sm:text-base font-bold text-emerald-800">
                          Total Cash Dipegang
                        </span>
                        <span className="text-lg sm:text-2xl font-black text-emerald-700">
                          {formatRupiah(summaryData.uangCashAkhir)}
                        </span>
                      </div>
                    </div>
                  </Card>

                  {/* KARTU 2: ALOKASI LABA */}
                  <Card className="p-4 sm:p-5 border-zinc-200 shadow-sm rounded-2xl bg-blue-50/50 transition-all">
                    <div className="flex items-center justify-between mb-3 sm:mb-4">
                      <h3 className="text-xs sm:text-sm font-bold text-zinc-700 flex items-center gap-1.5">
                        <PieChart className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-500" />{" "}
                        Alokasi Laba Bersih
                      </h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={isSavingAlloc}
                        className="h-7 sm:h-8 px-2 text-xs text-zinc-500 hover:text-blue-600"
                        onClick={() => {
                          if (isEditingAlloc) {
                            handleSaveAllocations();
                          } else {
                            setIsEditingAlloc(true);
                          }
                        }}
                      >
                        {isSavingAlloc ? (
                          <span className="animate-pulse">Menyimpan...</span>
                        ) : isEditingAlloc ? (
                          <>
                            <Save className="w-3.5 h-3.5 mr-1" /> Simpan
                          </>
                        ) : (
                          <>
                            <Edit2 className="w-3.5 h-3.5 mr-1" /> Ubah Persen
                          </>
                        )}
                      </Button>
                    </div>

                    {allocError && (
                      <div className="mb-3 text-[10px] sm:text-xs font-medium text-red-600 bg-red-50 p-2 rounded-lg border border-red-100">
                        {allocError}
                      </div>
                    )}

                    <div className="space-y-3 sm:space-y-4">
                      {/* Modal Stok */}
                      <div className="flex justify-between items-center text-xs sm:text-sm">
                        <div>
                          <p className="font-bold text-zinc-800">
                            Kembali ke Gudang
                          </p>
                          {isEditingAlloc ? (
                            <div className="flex items-center mt-0.5">
                              <Input
                                type="number"
                                className="h-6 w-14 sm:w-16 text-[10px] sm:text-xs px-1.5 py-0"
                                value={allocations.pct_modal}
                                onChange={(e) =>
                                  setAllocations({
                                    ...allocations,
                                    pct_modal: Number(e.target.value),
                                  })
                                }
                              />
                              <span className="ml-1 text-[10px] sm:text-xs text-zinc-500">
                                %
                              </span>
                            </div>
                          ) : (
                            <p className="text-[9px] sm:text-[10px] text-zinc-500">
                              {allocations.pct_modal}% dari Laba
                            </p>
                          )}
                        </div>
                        <span className="font-black">
                          {formatRupiah(
                            summaryData.labaBersih *
                              (allocations.pct_modal / 100),
                          )}
                        </span>
                      </div>

                      {/* Kebutuhan */}
                      <div className="flex justify-between items-center text-xs sm:text-sm">
                        <div>
                          <p className="font-bold text-zinc-800">
                            Kebutuhan Pribadi
                          </p>
                          {isEditingAlloc ? (
                            <div className="flex items-center mt-0.5">
                              <Input
                                type="number"
                                className="h-6 w-14 sm:w-16 text-[10px] sm:text-xs px-1.5 py-0"
                                value={allocations.pct_kebutuhan}
                                onChange={(e) =>
                                  setAllocations({
                                    ...allocations,
                                    pct_kebutuhan: Number(e.target.value),
                                  })
                                }
                              />
                              <span className="ml-1 text-[10px] sm:text-xs text-zinc-500">
                                %
                              </span>
                            </div>
                          ) : (
                            <p className="text-[9px] sm:text-[10px] text-zinc-500">
                              {allocations.pct_kebutuhan}% dari Laba
                            </p>
                          )}
                        </div>
                        <span className="font-black">
                          {formatRupiah(
                            summaryData.labaBersih *
                              (allocations.pct_kebutuhan / 100),
                          )}
                        </span>
                      </div>

                      {/* Tabungan */}
                      <div className="flex justify-between items-center text-xs sm:text-sm">
                        <div>
                          <p className="font-bold text-zinc-800">
                            Tabungan Finansial
                          </p>
                          {isEditingAlloc ? (
                            <div className="flex items-center mt-0.5">
                              <Input
                                type="number"
                                className="h-6 w-14 sm:w-16 text-[10px] sm:text-xs px-1.5 py-0"
                                value={allocations.pct_tabungan}
                                onChange={(e) =>
                                  setAllocations({
                                    ...allocations,
                                    pct_tabungan: Number(e.target.value),
                                  })
                                }
                              />
                              <span className="ml-1 text-[10px] sm:text-xs text-zinc-500">
                                %
                              </span>
                            </div>
                          ) : (
                            <p className="text-[9px] sm:text-[10px] text-zinc-500">
                              {allocations.pct_tabungan}% dari Laba
                            </p>
                          )}
                        </div>
                        <span className="font-black">
                          {formatRupiah(
                            summaryData.labaBersih *
                              (allocations.pct_tabungan / 100),
                          )}
                        </span>
                      </div>
                    </div>
                  </Card>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="p-6 bg-zinc-50 border border-dashed rounded-2xl text-center mt-10">
              <PieChart className="w-6 h-6 sm:w-8 sm:h-8 text-zinc-300 mx-auto mb-2 sm:mb-3" />
              <p className="text-xs sm:text-sm font-medium text-muted-foreground">
                Pilih salah satu periode di sebelah kiri
                <br className="hidden sm:block" /> untuk melihat dashboard.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
