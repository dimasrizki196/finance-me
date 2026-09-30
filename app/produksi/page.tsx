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
  ArrowUpCircle,
  TrendingUp,
  History,
  BookOpen,
  Warehouse,
  Edit2,
  Save,
  Loader2,
  Lock,
  Coins,
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
      const res = await getPeriodDetail(period.id);
      const trxs = await getPeriodTransactions(period.id);

      let totalModalStokHPP = 0; // HPP (Hanya untuk hitung Laba Bersih)
      let totalModalCash = 0;
      let totalOmzet = 0;

      // Data dari Buku Harian
      if (res && res.records) {
        res.records.forEach((rec: any) => {
          totalModalStokHPP += Number(rec.modal_stok || 0);
          totalModalCash += Number(rec.modal_cash || 0);
          totalOmzet += Number(rec.omset_malam || 0);
        });
      }

      let pengeluaranPribadi = 0;
      let pengeluaranOperasional = 0;
      let totalBelanjaStok = 0; // INI YANG AKAN KITA PAKAI UNTUK SISA MODAL

      // Data dari Transaksi / Kas Keluar
      if (trxs && Array.isArray(trxs)) {
        trxs.forEach((t: any) => {
          const type = (t.type || "").toLowerCase();
          if (type.includes("pribadi") || type.includes("kebutuhan")) {
            pengeluaranPribadi += Number(t.amount || 0);
          } else if (type.includes("operasional")) {
            pengeluaranOperasional += Number(t.amount || 0);
          } else if (type.includes("belanja_stok")) {
            totalBelanjaStok += Number(t.amount || 0);
          }
        });
      }

      // --- LOGIKA LABA RUGI P&L (Untuk dapat Nilai Laba Bersih) ---
      const totalPengeluaranHPP = totalModalStokHPP + totalModalCash;
      const labaBersih = totalOmzet - totalPengeluaranHPP;

      // Modal Masuk Harian (Omzet dikurangi Laba Bersih)
      const modalMasukHarian = totalOmzet - labaBersih;

      const modalAwal = Number(res?.period?.modal_awal || 0);
      const initialSettings = res?.period?.settings || {
        pct_modal: 25,
        pct_kebutuhan: 50,
        pct_tabungan: 25,
      };

      setAllocations(initialSettings);

      setSummaryData({
        modalAwal,
        totalBelanjaStok, // Transaksi Fisik Gudang
        totalModalCash, // Belanja Harian
        totalOmzet,
        modalMasukHarian,
        labaBersih,
        pengeluaranPribadi,
        pengeluaranOperasional,
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
      await createPeriod(
        newPeriod.name,
        newPeriod.startDate,
        newPeriod.endDate,
        Number(newPeriod.modalAwal) || 0,
      );
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
      `⚠️ PERINGATAN TUTUP BUKU\n\nApakah Anda yakin ingin menutup periode "${selectedPeriod.name}"?`,
    );

    if (!confirmClose) return;

    setIsClosing(true);
    try {
      await closePeriod(selectedPeriod.id);
      const updatedPeriods = await getAllPeriods();
      setPeriods(updatedPeriods);

      const remainingActive = updatedPeriods.find(
        (p: any) => p.status === "active",
      );
      if (remainingActive) setSelectedPeriod(remainingActive);
      else if (updatedPeriods.length > 0) setSelectedPeriod(updatedPeriods[0]);
      else setSelectedPeriod(null);

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
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
        <p className="text-zinc-500 font-medium text-sm">
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
              className="h-10 w-10 sm:h-12 sm:w-12 rounded-2xl shadow-sm hover:bg-zinc-100 border-zinc-200"
            >
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 text-zinc-600" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight text-foreground">
              Manajemen Usaha
            </h1>
            <p className="text-xs sm:text-sm font-medium text-muted-foreground mt-0.5 flex items-center gap-1.5">
              <Store className="w-3.5 h-3.5 text-orange-500" /> Kelola Siklus,
              Stok, dan Laba
            </p>
          </div>
        </div>
        <div className="w-full sm:w-auto">
          <Button
            onClick={() => setShowForm(!showForm)}
            className="w-full sm:w-auto bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl font-bold h-10 sm:h-11 px-5 active:scale-95 text-sm transition-all"
          >
            <PlusCircle className="w-4 h-4 mr-2" /> Buka Periode
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        {/* KIRI: DAFTAR PERIODE */}
        <div className="lg:col-span-5 space-y-6">
          {showForm && (
            <Card className="p-5 border-orange-200 bg-orange-50/50 shadow-md rounded-2xl animate-in slide-in-from-top-4">
              <h2 className="text-base font-bold mb-4 flex items-center gap-2">
                <Package className="w-5 h-5 text-orange-500" /> Mulai Siklus
                Baru
              </h2>
              <form onSubmit={handleCreatePeriod} className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">
                    Nama Periode / Batch
                  </Label>
                  <Input
                    placeholder="Cth: September - Oktober 2026"
                    value={newPeriod.name}
                    onChange={(e) =>
                      setNewPeriod({ ...newPeriod, name: e.target.value })
                    }
                    disabled={isSubmitting}
                    className="h-10 rounded-xl bg-white text-sm"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">
                    Modal Awal (Rp)
                  </Label>
                  <Input
                    type="number"
                    placeholder="Contoh: 5000000"
                    value={newPeriod.modalAwal}
                    onChange={(e) =>
                      setNewPeriod({ ...newPeriod, modalAwal: e.target.value })
                    }
                    disabled={isSubmitting}
                    className="h-10 rounded-xl bg-white text-sm"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">
                      Tanggal Mulai
                    </Label>
                    <Input
                      type="date"
                      value={newPeriod.startDate}
                      onChange={(e) =>
                        setNewPeriod({
                          ...newPeriod,
                          startDate: e.target.value,
                        })
                      }
                      disabled={isSubmitting}
                      className="h-10 rounded-xl bg-white text-xs"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">
                      Tanggal Akhir
                    </Label>
                    <Input
                      type="date"
                      value={newPeriod.endDate}
                      onChange={(e) =>
                        setNewPeriod({ ...newPeriod, endDate: e.target.value })
                      }
                      disabled={isSubmitting}
                      className="h-10 rounded-xl bg-white text-xs"
                      required
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 mt-2 pt-3 border-t border-orange-200">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowForm(false)}
                    className="h-9 rounded-xl text-xs"
                  >
                    Batal
                  </Button>
                  <Button
                    type="submit"
                    className="h-9 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold px-5 text-xs"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Menyimpan..." : "Simpan Siklus"}
                  </Button>
                </div>
              </form>
            </Card>
          )}

          <div className="space-y-3">
            <h2 className="text-sm font-bold flex items-center gap-2">
              <PlayCircle className="w-4 h-4 text-orange-500" /> Siklus Berjalan
              (Aktif)
            </h2>
            {activePeriods.length > 0 ? (
              <div className="grid grid-cols-1 gap-3">
                {activePeriods.map((period) => (
                  <Card
                    key={period.id}
                    onClick={() => handleSelectPeriod(period)}
                    className={`cursor-pointer transition-all p-4 rounded-2xl border-2 ${
                      selectedPeriod?.id === period.id
                        ? "border-orange-500 bg-orange-50"
                        : "border-zinc-200 hover:border-orange-300"
                    }`}
                  >
                    <div>
                      <span className="px-2 py-0.5 rounded bg-orange-100 text-orange-700 text-[10px] font-black uppercase mb-1.5 inline-block">
                        Aktif
                      </span>
                      <p className="font-bold text-base text-zinc-900">
                        {period.name}
                      </p>
                      <p className="text-[11px] text-zinc-500 mt-1 font-medium flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {formatDate(period.start_date)} s/d{" "}
                        {formatDate(period.end_date)}
                      </p>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="p-5 bg-zinc-50 border border-dashed rounded-xl text-center">
                <p className="text-xs text-zinc-500">Belum Ada Siklus Aktif</p>
              </div>
            )}
          </div>

          {closedPeriods.length > 0 && (
            <div className="space-y-3 pt-4 border-t border-zinc-100">
              <h2 className="text-sm font-bold flex items-center gap-2 text-zinc-600">
                <History className="w-4 h-4 text-zinc-400" /> Riwayat Tutup Buku
              </h2>
              <div className="grid grid-cols-1 gap-3">
                {closedPeriods.map((period) => (
                  <Card
                    key={period.id}
                    onClick={() => handleSelectPeriod(period)}
                    className={`cursor-pointer transition-all p-3.5 rounded-2xl border-2 ${
                      selectedPeriod?.id === period.id
                        ? "border-zinc-800 bg-zinc-100"
                        : "border-zinc-200"
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-bold text-sm text-zinc-700">
                          {period.name}
                        </p>
                        <p className="text-[11px] text-zinc-500 mt-0.5">
                          {formatDate(period.start_date)} s/d{" "}
                          {formatDate(period.end_date)}
                        </p>
                      </div>
                      <span className="text-[10px] bg-zinc-200 text-zinc-500 px-2 py-1 rounded-md uppercase font-bold">
                        Tutup
                      </span>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* KANAN: DASHBOARD MANAJEMEN */}
        <div className="lg:col-span-7 space-y-5 lg:pl-6 lg:border-l border-zinc-200">
          {selectedPeriod ? (
            <div className="space-y-5">
              <div className="flex items-center justify-between bg-zinc-900 text-white p-4 rounded-2xl shadow-sm">
                <div>
                  <span className="text-[10px] text-orange-400 font-bold uppercase tracking-widest">
                    Periode Terpilih
                  </span>
                  <h2 className="text-lg sm:text-xl font-black">
                    {selectedPeriod.name}
                  </h2>
                </div>
                {selectedPeriod.status === "active" ? (
                  <Button
                    onClick={handleClosePeriod}
                    disabled={isClosing}
                    variant="destructive"
                    size="sm"
                    className="bg-rose-600 hover:bg-rose-700 rounded-xl text-xs text-white h-9 px-3"
                  >
                    {isClosing ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Lock className="w-3.5 h-3.5 mr-1" />
                    )}{" "}
                    Tutup Buku
                  </Button>
                ) : (
                  <span className="text-xs bg-zinc-800 text-zinc-400 px-3 py-1 rounded-xl font-bold flex items-center gap-1">
                    <Lock className="w-3 h-3" /> Periode Ditutup
                  </span>
                )}
              </div>

              {/* NAVIGASI MENU */}
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
                    className="w-full border-amber-300 text-amber-800 bg-amber-50 hover:bg-amber-100 rounded-xl flex flex-col h-auto py-2.5 px-1 gap-1"
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
                    className="w-full border-emerald-300 text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-xl flex flex-col h-auto py-2.5 px-1 gap-1"
                  >
                    <Wallet className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span className="text-[10px] sm:text-xs font-medium">
                      Kas Keluar
                    </span>
                  </Button>
                </Link>
              </div>

              {isLoadingSummary ? (
                <div className="p-8 text-center bg-zinc-50 border border-zinc-100 rounded-2xl animate-pulse">
                  <p className="text-xs text-zinc-500 font-medium">
                    Menghitung kalkulasi keuangan...
                  </p>
                </div>
              ) : summaryData ? (
                (() => {
                  const modalAwal = summaryData.modalAwal || 0;
                  const totalBelanjaStok = summaryData.totalBelanjaStok || 0; // Transaksi Asli (Rp 686.610)
                  const modalHarian = summaryData.totalModalCash || 0;
                  const pengeluaranOperasional =
                    summaryData.pengeluaranOperasional || 0;
                  const modalMasukHarian = summaryData.modalMasukHarian || 0;

                  const omzet = summaryData.totalOmzet || 0;
                  const labaBersih = summaryData.labaBersih || 0;
                  const pengeluaranPribadi =
                    summaryData.pengeluaranPribadi || 0;

                  // 1. Sisa Modal Dasar (Murni Terintegrasi dengan Kas Keluar)
                  const sisaModalDasar =
                    modalAwal -
                    totalBelanjaStok -
                    modalHarian -
                    pengeluaranOperasional +
                    modalMasukHarian;

                  // 2. Alokasi Jatah Laba
                  const jatahModalSimpan =
                    labaBersih * (allocations.pct_modal / 100);
                  const jatahKebutuhanPribadi =
                    labaBersih * (allocations.pct_kebutuhan / 100);
                  const jatahTabungan =
                    labaBersih * (allocations.pct_tabungan / 100);

                  // 3. Realtime Pemakaian Modal Simpan
                  // Jika sisaModalDasar kurang dari Modal Awal, kita "pakai" Jatah Modal Simpan untuk menambalnya.
                  const kebutuhanReplenish = Math.max(
                    0,
                    modalAwal - sisaModalDasar,
                  );
                  const terpakaiModalSimpan = Math.min(
                    jatahModalSimpan,
                    kebutuhanReplenish,
                  );
                  const sisaModalSimpan =
                    jatahModalSimpan - terpakaiModalSimpan;

                  // 4. Sisa Modal Akhir
                  const sisaModalAkhir = sisaModalDasar + terpakaiModalSimpan;

                  // 5. Hitungan Sisa Kebutuhan Pribadi
                  const sisaKebutuhanPribadi =
                    jatahKebutuhanPribadi - pengeluaranPribadi;

                  // 6. Total Cash Fisik
                  // Rumus: Sisa Modal Akhir + Sisa Uang Pribadi + Sisa Uang Modal Simpan (jika ada) + Uang Tabungan
                  const sisaAlokasiLabaLainnya =
                    sisaKebutuhanPribadi + sisaModalSimpan + jatahTabungan;
                  const totalCashDipegang =
                    sisaModalAkhir + sisaAlokasiLabaLainnya;

                  return (
                    <div className="space-y-4">
                      {/* 1. TOTAL CASH DI PEGANG */}
                      <Card className="p-5 border-emerald-300 bg-emerald-600 shadow-md rounded-2xl text-white">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-emerald-100 text-xs font-bold uppercase tracking-widest mb-1">
                              Total Uang Cash Fisik
                            </p>
                            <h2 className="text-3xl sm:text-4xl font-black tracking-tight">
                              {formatRupiah(totalCashDipegang)}
                            </h2>
                          </div>
                          <div className="p-3 bg-emerald-500/50 rounded-xl">
                            <Coins className="w-8 h-8 text-white" />
                          </div>
                        </div>
                        <p className="text-[10px] text-emerald-100 mt-4 pt-2 border-t border-emerald-500/60 font-medium">
                          Modal Akhir ({formatRupiah(sisaModalAkhir)}) + Sisa
                          Alokasi Laba ({formatRupiah(sisaAlokasiLabaLainnya)})
                        </p>
                      </Card>

                      {/* 2. ALUR MODAL PUTAR (TERINTEGRASI) */}
                      <Card className="p-4 sm:p-5 border-zinc-200 shadow-xs rounded-2xl bg-white space-y-3">
                        <div className="flex items-center justify-between border-b border-zinc-100 pb-2.5">
                          <span className="text-xs font-bold text-zinc-800 uppercase tracking-wider flex items-center gap-1.5">
                            <Store className="w-4 h-4 text-orange-500" />{" "}
                            Sirkulasi Sisa Modal
                          </span>
                          <span className="text-[10px] font-black px-2 py-0.5 rounded bg-orange-100 text-orange-800">
                            Terintegrasi
                          </span>
                        </div>

                        <div className="space-y-2.5 text-xs sm:text-sm">
                          <div className="flex justify-between items-center text-zinc-600">
                            <span>Modal Awal Input</span>
                            <span className="font-bold text-zinc-800">
                              {formatRupiah(modalAwal)}
                            </span>
                          </div>
                          <div className="flex justify-between items-center text-zinc-600">
                            <span>- Belanja Stok (Gudang)</span>
                            <span className="font-bold text-rose-600">
                              -{formatRupiah(totalBelanjaStok)}
                            </span>
                          </div>
                          <div className="flex justify-between items-center text-zinc-600">
                            <span>- Modal Cash Harian</span>
                            <span className="font-bold text-rose-600">
                              -{formatRupiah(modalHarian)}
                            </span>
                          </div>
                          <div className="flex justify-between items-center text-zinc-600">
                            <span>- Operasional Usaha</span>
                            <span className="font-bold text-rose-600">
                              -{formatRupiah(pengeluaranOperasional)}
                            </span>
                          </div>

                          {/* SISA MODAL AWAL (Sama persis dengan halaman Kas Keluar) */}
                          <div className="flex justify-between items-center bg-zinc-50 p-2 rounded-lg border border-zinc-100 my-1.5">
                            <span className="text-[11px] font-bold text-zinc-700 uppercase">
                              Sisa Modal Awal
                            </span>
                            <span className="text-sm font-black text-zinc-900">
                              {formatRupiah(sisaModalDasar - modalMasukHarian)}
                            </span>
                          </div>

                          <div className="flex justify-between items-center text-zinc-600">
                            <span>+ Modal Masuk Harian (Dari Omzet)</span>
                            <span className="font-bold text-emerald-600">
                              +{formatRupiah(modalMasukHarian)}
                            </span>
                          </div>
                          <div className="flex justify-between items-center text-zinc-600">
                            <span>+ Alokasi Modal Simpan (Terpakai)</span>
                            <span className="font-bold text-blue-600">
                              +{formatRupiah(terpakaiModalSimpan)}
                            </span>
                          </div>
                        </div>

                        <div className="border-t border-dashed border-zinc-200 pt-3 mt-2">
                          <div className="flex justify-between items-center bg-zinc-100 p-3 rounded-xl border border-zinc-200">
                            <span className="text-xs font-black text-zinc-800">
                              Sisa Modal Akhir
                            </span>
                            <span className="text-base font-black text-zinc-900">
                              {formatRupiah(sisaModalAkhir)}
                            </span>
                          </div>
                        </div>
                      </Card>

                      {/* 3. KINERJA PENJUALAN & LABA */}
                      <Card className="p-4 sm:p-5 border-zinc-200 shadow-xs rounded-2xl bg-white space-y-3">
                        <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider block border-b border-zinc-100 pb-2">
                          Kinerja Penjualan & Laba
                        </span>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100">
                            <span className="text-[10px] text-emerald-700 font-bold uppercase flex items-center gap-1">
                              <ArrowUpCircle className="w-3.5 h-3.5" /> Omzet
                              Periode
                            </span>
                            <p className="text-base sm:text-lg font-black text-emerald-700 mt-0.5">
                              {formatRupiah(omzet)}
                            </p>
                          </div>
                          <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100">
                            <span className="text-[10px] text-blue-700 font-bold uppercase flex items-center gap-1">
                              <TrendingUp className="w-3.5 h-3.5" /> Laba Bersih
                            </span>
                            <p className="text-base sm:text-lg font-black text-blue-700 mt-0.5">
                              {formatRupiah(labaBersih)}
                            </p>
                          </div>
                        </div>
                      </Card>

                      {/* 4. ALOKASI DANA LABA BERSIH (REALTIME) */}
                      <Card className="p-4 sm:p-5 border-blue-200 bg-blue-50/30 shadow-xs rounded-2xl space-y-4">
                        <div className="flex items-center justify-between border-b border-blue-100 pb-2.5">
                          <h3 className="text-xs sm:text-sm font-bold text-blue-950 flex items-center gap-1.5">
                            <PieChart className="w-4 h-4 text-blue-600" />{" "}
                            Pembagian Alokasi Laba
                          </h3>
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={isSavingAlloc}
                            className="h-7 px-2.5 text-xs text-blue-700 font-bold hover:bg-blue-100 rounded-lg"
                            onClick={() => {
                              if (isEditingAlloc) handleSaveAllocations();
                              else setIsEditingAlloc(true);
                            }}
                          >
                            {isSavingAlloc ? (
                              "Memproses..."
                            ) : isEditingAlloc ? (
                              <>
                                <Save className="w-3.5 h-3.5 mr-1" /> Simpan
                              </>
                            ) : (
                              <>
                                <Edit2 className="w-3.5 h-3.5 mr-1" /> Ubah %
                              </>
                            )}
                          </Button>
                        </div>

                        {allocError && (
                          <div className="text-xs font-bold text-rose-600 bg-rose-50 p-2 rounded-lg border border-rose-200">
                            {allocError}
                          </div>
                        )}

                        <div className="space-y-3 text-xs sm:text-sm">
                          {/* Modal Simpan (Realtime Tracker) */}
                          <div className="bg-white p-3 rounded-xl border border-blue-100 shadow-2xs space-y-1">
                            <div className="flex justify-between items-center">
                              <span className="font-bold text-zinc-800">
                                Modal Simpan (Gudang)
                              </span>
                              <span
                                className={`font-black ${sisaModalSimpan === 0 ? "text-zinc-400" : "text-emerald-600"}`}
                              >
                                Sisa: {formatRupiah(sisaModalSimpan)}
                              </span>
                            </div>
                            <div className="flex justify-between items-center text-[11px] text-zinc-500 pt-1 border-t border-zinc-100">
                              <span>
                                Jatah ({allocations.pct_modal}%):{" "}
                                <b>{formatRupiah(jatahModalSimpan)}</b>
                              </span>
                              <span>
                                Terpakai:{" "}
                                <b className="text-blue-500">
                                  -{formatRupiah(terpakaiModalSimpan)}
                                </b>
                              </span>
                            </div>
                            {terpakaiModalSimpan > 0 && (
                              <p className="text-[9px] text-blue-600 font-medium italic">
                                *Uang terpakai langsung di-suntik ke Sisa Modal
                                Akhir.
                              </p>
                            )}
                          </div>

                          {/* Kebutuhan Pribadi (Realtime Tracker) */}
                          <div className="bg-white p-3 rounded-xl border border-blue-100 shadow-2xs space-y-1">
                            <div className="flex justify-between items-center">
                              <span className="font-bold text-zinc-800">
                                Kebutuhan Pribadi
                              </span>
                              <span
                                className={`font-black ${sisaKebutuhanPribadi < 0 ? "text-rose-600" : "text-emerald-600"}`}
                              >
                                Sisa: {formatRupiah(sisaKebutuhanPribadi)}
                              </span>
                            </div>
                            <div className="flex justify-between items-center text-[11px] text-zinc-500 pt-1 border-t border-zinc-100">
                              <span>
                                Jatah ({allocations.pct_kebutuhan}%):{" "}
                                <b>{formatRupiah(jatahKebutuhanPribadi)}</b>
                              </span>
                              <span>
                                Terpakai:{" "}
                                <b className="text-rose-600">
                                  -{formatRupiah(pengeluaranPribadi)}
                                </b>
                              </span>
                            </div>
                          </div>

                          {/* Tabungan */}
                          <div className="bg-white p-3 rounded-xl border border-blue-100 shadow-2xs">
                            <div className="flex justify-between items-center mb-0.5">
                              <span className="font-bold text-zinc-800">
                                Tabungan Finansial
                              </span>
                              <span className="font-black text-indigo-600">
                                {formatRupiah(jatahTabungan)}
                              </span>
                            </div>
                            <p className="text-[10px] text-zinc-500">
                              Jatah {allocations.pct_tabungan}% dari Laba
                              Bersih.
                            </p>
                          </div>
                        </div>

                        {/* FORM EDIT PERSENTASE */}
                        {isEditingAlloc && (
                          <div className="pt-3 border-t border-blue-200/80 grid grid-cols-3 gap-2">
                            <div>
                              <Label className="text-[10px] font-bold text-zinc-600">
                                Modal %
                              </Label>
                              <Input
                                type="number"
                                className="h-8 text-xs bg-white rounded-lg mt-0.5"
                                value={allocations.pct_modal}
                                onChange={(e) =>
                                  setAllocations({
                                    ...allocations,
                                    pct_modal: Number(e.target.value),
                                  })
                                }
                              />
                            </div>
                            <div>
                              <Label className="text-[10px] font-bold text-zinc-600">
                                Pribadi %
                              </Label>
                              <Input
                                type="number"
                                className="h-8 text-xs bg-white rounded-lg mt-0.5"
                                value={allocations.pct_kebutuhan}
                                onChange={(e) =>
                                  setAllocations({
                                    ...allocations,
                                    pct_kebutuhan: Number(e.target.value),
                                  })
                                }
                              />
                            </div>
                            <div>
                              <Label className="text-[10px] font-bold text-zinc-600">
                                Tabungan %
                              </Label>
                              <Input
                                type="number"
                                className="h-8 text-xs bg-white rounded-lg mt-0.5"
                                value={allocations.pct_tabungan}
                                onChange={(e) =>
                                  setAllocations({
                                    ...allocations,
                                    pct_tabungan: Number(e.target.value),
                                  })
                                }
                              />
                            </div>
                          </div>
                        )}
                      </Card>
                    </div>
                  );
                })()
              ) : null}
            </div>
          ) : (
            <div className="p-8 bg-zinc-50 border border-dashed border-zinc-200 rounded-2xl text-center my-8">
              <PieChart className="w-8 h-8 text-zinc-300 mx-auto mb-2" />
              <p className="text-xs sm:text-sm font-medium text-zinc-500">
                Pilih salah satu periode di panel kiri untuk menampilkan
                dashboard.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
