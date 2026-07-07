// app/analytics/page.tsx
import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  PieChart as PieChartIcon,
  TrendingUp,
  TrendingDown,
  Wallet,
  Activity,
  LineChart as LineChartIcon,
  Calendar,
} from "lucide-react";
import AnalyticsChart from "./AnalyticsChart";
import ExpensePieChart from "./ExpensePieChart";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage(props: {
  searchParams: Promise<{ type?: string; year?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const searchParams = await props.searchParams;
  const walletType = searchParams.type === "joint" ? "joint" : "personal";
  const title =
    walletType === "joint" ? "Laporan Tabungan Kita" : "Laporan Uang Pribadi";

  // Deteksi Tahun yang dipilih (Default: Tahun saat ini)
  const currentYear = new Date().getFullYear().toString();
  const selectedYear = searchParams.year || currentYear;

  const { data: wallets } = await supabase
    .from("wallets")
    .select("id")
    .eq("type", walletType);
  const walletIds = wallets?.map((w) => w.id) || [];

  // Ambil SEMUA transaksi dompet ini untuk mengekstrak daftar tahun yang tersedia
  const { data: allTransactions } = await supabase
    .from("transactions")
    .select("amount, transaction_date, categories(name, type)")
    .in(
      "wallet_id",
      walletIds.length > 0
        ? walletIds
        : ["00000000-0000-0000-0000-000000000000"],
    );

  // Cari tahun apa saja yang ada di database
  const yearsSet = new Set<string>();
  allTransactions?.forEach((tx) =>
    yearsSet.add(tx.transaction_date.substring(0, 4)),
  );
  const availableYears = Array.from(yearsSet).sort().reverse();
  if (!availableYears.includes(selectedYear)) availableYears.push(selectedYear); // Pastikan tahun terpilih selalu ada di tombol

  // 1. Siapkan 12 Bulan Kosong untuk Tahun Terpilih
  const monthlyData: Record<string, { income: number; expense: number }> = {};
  for (let i = 1; i <= 12; i++) {
    const monthKey = `${selectedYear}-${String(i).padStart(2, "0")}`;
    monthlyData[monthKey] = { income: 0, expense: 0 };
  }

  const categoryExpense: Record<string, number> = {};
  let totalIncome = 0;
  let totalExpense = 0;

  // 2. Filter transaksi HANYA untuk tahun yang dipilih
  const filteredTransactions = allTransactions?.filter((tx) =>
    tx.transaction_date.startsWith(selectedYear),
  );

  filteredTransactions?.forEach((tx) => {
    // @ts-expect-error relasi
    const catType = tx.categories?.type;
    // @ts-expect-error relasi
    const catName = tx.categories?.name || "Lainnya";
    const amount = Number(tx.amount);
    const monthKey = tx.transaction_date.substring(0, 7);

    if (monthlyData[monthKey]) {
      if (catType === "income") {
        monthlyData[monthKey].income += amount;
        totalIncome += amount;
      } else if (catType === "expense") {
        monthlyData[monthKey].expense += amount;
        totalExpense += amount;
        if (!categoryExpense[catName]) categoryExpense[catName] = 0;
        categoryExpense[catName] += amount;
      }
    }
  });

  const avgIncome = totalIncome / 12;
  const avgExpense = totalExpense / 12;

  const formatRupiah = (angka: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(angka);
  };

  const formatMonthName = (dateStr: string) => {
    const [year, month] = dateStr.split("-");
    const date = new Date(Number(year), Number(month) - 1);
    return date.toLocaleString("id-ID", { month: "short" }); // Hanya tampilkan bulan (Jan, Feb) karena tahun sudah difilter
  };

  // 🌟 DATA UNTUK GRAFIK GARIS (12 Bulan Penuh)
  const chartData = Object.keys(monthlyData)
    .sort()
    .map((monthKey) => {
      const inc = monthlyData[monthKey].income;
      const exp = monthlyData[monthKey].expense;
      return {
        name: formatMonthName(monthKey),
        Pemasukan: inc,
        Pengeluaran: exp,
        "Rata-rata": (inc + exp) / 2, // Garis Tengah
      };
    });

  // 🌟 DATA UNTUK GRAFIK PIE KATEGORI
  const pieData = Object.entries(categoryExpense)
    .sort(([, a], [, b]) => b - a)
    .map(([name, value]) => ({ name, value }));

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-6 w-full">
      {/* HEADER NAVIGASI */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4">
        <div className="flex items-center gap-3">
          <Link href="/">
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 rounded-full"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
              {title}
            </h1>
            <p className="text-sm text-muted-foreground flex items-center gap-1.5">
              <Wallet className="w-3.5 h-3.5" /> Analisis Arus Kas Anda
            </p>
          </div>
        </div>

        {/* TOMBOL FILTER TAHUN */}
        <div className="flex items-center gap-2 bg-zinc-50 dark:bg-zinc-900/50 p-1.5 rounded-lg border">
          <Calendar className="w-4 h-4 text-muted-foreground ml-2" />
          <div className="flex gap-1 ml-2">
            {availableYears.map((year) => (
              <Link key={year} href={`?type=${walletType}&year=${year}`}>
                <Button
                  variant={selectedYear === year ? "default" : "ghost"}
                  size="sm"
                  className={`h-7 px-3 text-xs ${selectedYear === year ? "bg-primary text-primary-foreground" : ""}`}
                >
                  {year}
                </Button>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* RINGKASAN TOTAL TAHUNAN */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/50 relative overflow-hidden">
          <CardContent className="p-4 sm:p-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium mb-1">
                Total Pemasukan ({selectedYear})
              </p>
              <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-500">
                {formatRupiah(totalIncome)}
              </p>
              <p className="text-xs text-emerald-600/70 dark:text-emerald-400/70 mt-2 font-medium flex items-center gap-1">
                <Activity className="w-3 h-3" /> Rata-rata:{" "}
                {formatRupiah(avgIncome)} / bln
              </p>
            </div>
            <div className="p-3 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 rounded-full">
              <TrendingUp className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-rose-50/50 dark:bg-rose-950/20 border-rose-100 dark:border-rose-900/50 relative overflow-hidden">
          <CardContent className="p-4 sm:p-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-rose-600 dark:text-rose-400 font-medium mb-1">
                Total Pengeluaran ({selectedYear})
              </p>
              <p className="text-2xl font-bold text-rose-700 dark:text-rose-500">
                {formatRupiah(totalExpense)}
              </p>
              <p className="text-xs text-rose-600/70 dark:text-rose-400/70 mt-2 font-medium flex items-center gap-1">
                <Activity className="w-3 h-3" /> Rata-rata:{" "}
                {formatRupiah(avgExpense)} / bln
              </p>
            </div>
            <div className="p-3 bg-rose-100 dark:bg-rose-900/50 text-rose-600 rounded-full">
              <TrendingDown className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* GRAFIK GARIS */}
        <Card className="shadow-sm border-zinc-200 dark:border-zinc-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <LineChartIcon className="w-5 h-5 text-indigo-500" /> Tren Arus
              Kas Bulanan
            </CardTitle>
            <CardDescription>
              Pemasukan, Pengeluaran & Rata-rata ({selectedYear}).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AnalyticsChart data={chartData} />
          </CardContent>
        </Card>

        {/* GRAFIK PIE */}
        <Card className="shadow-sm border-zinc-200 dark:border-zinc-800">
          <CardHeader className="pb-4">
            <CardTitle className="text-base flex items-center gap-2">
              <PieChartIcon className="w-5 h-5 text-amber-500" /> Rincian
              Pengeluaran
            </CardTitle>
            <CardDescription>
              Berdasarkan kategori tahun {selectedYear}.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {pieData.length > 0 ? (
              <ExpensePieChart data={pieData} />
            ) : (
              <div className="h-[350px] flex flex-col items-center justify-center text-center text-sm text-muted-foreground mt-4">
                <PieChartIcon className="w-10 h-10 text-zinc-300 mb-3" />
                Belum ada pengeluaran tercatat di tahun {selectedYear}.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
