// app/transactions/page.tsx
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
  ArrowDownRight,
  ArrowUpRight,
  Wallet,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Briefcase,
  PieChart,
  Layers,
  UserCircle2,
  ListOrdered,
} from "lucide-react";
import TransactionForm from "@/components/TransactionForm";
import InvestmentPopups from "@/components/InvestmentPopups";

export const dynamic = "force-dynamic";

export default async function TransactionsPage(props: {
  searchParams: Promise<{ type?: string; month?: string; year?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // 1. Parameter URL
  const searchParams = await props.searchParams;
  const walletType = searchParams.type === "joint" ? "joint" : "personal";
  const isPersonal = walletType === "personal";

  const now = new Date();
  const currentMonth = searchParams.month
    ? parseInt(searchParams.month)
    : now.getMonth() + 1;
  const currentYear = searchParams.year
    ? parseInt(searchParams.year)
    : now.getFullYear();

  // 2. Ambil Kategori & Dompet
  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .order("name", { ascending: true });
  const { data: wallets } = await supabase
    .from("wallets")
    .select("*")
    .eq("type", walletType)
    .filter(
      isPersonal ? "owner_id" : "type",
      "eq",
      isPersonal ? user.id : "joint",
    );
  const activeWallet = wallets?.[0];

  // 3. Waktu
  const lastDayOfMonth = new Date(currentYear, currentMonth, 0).getDate();
  const startDate = `${currentYear}-${String(currentMonth).padStart(2, "0")}-01`;
  const endDate = `${currentYear}-${String(currentMonth).padStart(2, "0")}-${lastDayOfMonth}`;

  // 4. Ambil Transaksi Bulan Ini (Untuk Riwayat Arus Kas)
  let transactions: any[] = [];
  if (activeWallet) {
    const { data } = await supabase
      .from("transactions")
      .select(
        `id, amount, transaction_date, notes, created_at, categories ( name, type )`,
      )
      .eq("wallet_id", activeWallet.id)
      .gte("transaction_date", startDate)
      .lte("transaction_date", endDate)
      .order("transaction_date", { ascending: false })
      .order("created_at", { ascending: false });
    transactions = data || [];
  }

  const income = transactions
    .filter((tx) => tx.categories?.type === "income")
    .reduce((sum, tx) => sum + Number(tx.amount), 0);
  const expense = transactions
    .filter((tx) => tx.categories?.type === "expense")
    .reduce((sum, tx) => sum + Number(tx.amount), 0);

  // 5. Ambil Investasi Pribadi (All Time) beserta Logika Profit & WD
  const personalPortfolio: Record<string, number> = {};
  let personalInvested = 0;

  if (isPersonal && activeWallet) {
    const { data: investTx } = await supabase
      .from("transactions")
      .select("amount, notes, categories ( name, type )")
      .eq("wallet_id", activeWallet.id)
      .not("notes", "is", null);

    investTx?.forEach((tx) => {
      const category: any = Array.isArray(tx.categories)
        ? tx.categories[0]
        : tx.categories;
      const catType = category?.type;
      const catName = category?.name;
      const amount = Number(tx.amount);
      const note = tx.notes ? tx.notes.trim() : "";

      // Hanya kalkulasi jika itu Investment, Update Portofolio, atau Pencairan
      if (
        catType === "investment" ||
        catName === "Update Portofolio" ||
        catName === "Pencairan RDN"
      ) {
        const rdnName =
          note === ""
            ? "Investasi Lainnya"
            : note
                .split(" ")
                .map(
                  (w: string) =>
                    w.charAt(0).toUpperCase() + w.slice(1).toLowerCase(),
                )
                .join(" ");

        if (!personalPortfolio[rdnName]) personalPortfolio[rdnName] = 0;

        // Logika Akuntansi
        if (catName === "Pencairan RDN") {
          personalPortfolio[rdnName] -= amount; // Tarik Dana = Aset Berkurang
          personalInvested -= amount;
        } else {
          personalPortfolio[rdnName] += amount; // Beli Saham & Update Profit/Loss = Aset Bertambah (bisa minus)
          personalInvested += amount;
        }
      }
    });
  }

  const formatRupiah = (angka: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(angka);

  const getIcon = (name: string) => {
    const lName = name.toLowerCase();
    if (lName.includes("ajaib") || lName.includes("stockbit"))
      return <Briefcase className="w-4 h-4" />;
    if (lName.includes("reksa") || lName.includes("bibit"))
      return <PieChart className="w-4 h-4" />;
    if (lName.includes("lainnya")) return <Layers className="w-4 h-4" />;
    return <UserCircle2 className="w-4 h-4" />;
  };

  const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
  const prevYear = currentMonth === 1 ? currentYear - 1 : currentYear;
  const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1;
  const nextYear = currentMonth === 12 ? currentYear + 1 : currentYear;
  const monthName = new Date(currentYear, currentMonth - 1).toLocaleString(
    "id-ID",
    { month: "long", year: "numeric" },
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-6xl mx-auto w-full animate-in fade-in duration-500">
      {/* 1. HEADER & FILTER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4">
        <div className="flex items-center gap-3">
          <Link href="/">
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 rounded-full shadow-sm hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
              {isPersonal ? "Uang Pribadi" : "Tabungan Kita"}
            </h1>
            <p className="text-sm text-muted-foreground flex items-center gap-1.5">
              <Wallet className="w-3.5 h-3.5" />
              {activeWallet ? activeWallet.name : "Dompet Tidak Ditemukan"}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between bg-white dark:bg-zinc-950 p-1.5 rounded-lg border shadow-sm w-full md:w-auto min-w-[250px]">
          <Link
            href={`?type=${walletType}&month=${prevMonth}&year=${prevYear}`}
          >
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ChevronLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div className="flex items-center gap-2 font-medium text-sm">
            <Calendar className="w-4 h-4 text-muted-foreground" /> {monthName}
          </div>
          <Link
            href={`?type=${walletType}&month=${nextMonth}&year=${nextYear}`}
          >
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ChevronRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>

      {/* 2. KARTU TOTAL DASHBOARD (DI ATAS) */}
      <div
        className={`grid grid-cols-1 sm:grid-cols-2 ${isPersonal ? "lg:grid-cols-3" : ""} gap-4`}
      >
        <Card className="bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-950/30 dark:to-zinc-950 border-emerald-100 dark:border-emerald-900/50 shadow-sm">
          <CardContent className="p-5 flex flex-col justify-center h-full">
            <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-2 mb-1">
              <ArrowDownRight className="w-4 h-4" /> Masuk Bulan Ini
            </p>
            <p className="text-2xl sm:text-3xl font-bold text-emerald-700 dark:text-emerald-500">
              {formatRupiah(income)}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-rose-50 to-white dark:from-rose-950/30 dark:to-zinc-950 border-rose-100 dark:border-rose-900/50 shadow-sm">
          <CardContent className="p-5 flex flex-col justify-center h-full">
            <p className="text-sm font-medium text-rose-600 dark:text-rose-400 flex items-center gap-2 mb-1">
              <ArrowUpRight className="w-4 h-4" /> Keluar Bulan Ini
            </p>
            <p className="text-2xl sm:text-3xl font-bold text-rose-700 dark:text-rose-500">
              {formatRupiah(expense)}
            </p>
          </CardContent>
        </Card>

        {isPersonal && (
          <Card className="bg-gradient-to-br from-teal-900 to-emerald-900 text-teal-50 border-none shadow-sm">
            <CardContent className="p-5 flex flex-col justify-center h-full">
              <p className="text-sm font-medium text-teal-200/80 flex items-center gap-2 mb-1">
                <Briefcase className="w-4 h-4" /> Total Aset Investasi
              </p>
              <p className="text-2xl sm:text-3xl font-bold tracking-tight">
                {formatRupiah(personalInvested)}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* 3. PANEL AKSI CEPAT (Tengah) */}
      <div className="flex flex-col sm:flex-row items-center gap-3 p-3 bg-zinc-50 dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm">
        <div className="w-full sm:w-auto">
          {activeWallet && (
            <TransactionForm
              walletId={activeWallet.id}
              walletName={activeWallet.name}
              categories={categories || []}
              triggerText={`+ Catat Kas Baru`}
            />
          )}
        </div>

        {isPersonal &&
          Object.keys(personalPortfolio).length > 0 &&
          activeWallet && (
            <div className="w-full sm:w-auto flex-1 flex">
              {/* INI KUNCI UTAMA: Kita mengirimkan activeWallet.id ke Popups */}
              <InvestmentPopups
                portfolio={personalPortfolio}
                type="personal"
                walletId={activeWallet.id}
              />
            </div>
          )}
      </div>

      {/* 4. RINCIAN PORTOFOLIO (Hanya jika Personal) */}
      {isPersonal && Object.keys(personalPortfolio).length > 0 && (
        <div className="pt-2">
          <h2 className="text-base font-semibold flex items-center gap-2 mb-3 text-muted-foreground">
            <Layers className="w-4 h-4" /> Sebaran Portofolio Saham
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {Object.entries(personalPortfolio)
              .sort(([, a], [, b]) => b - a)
              .map(([rdnName, amount]) => {
                const percentage =
                  personalInvested > 0
                    ? ((amount / personalInvested) * 100).toFixed(1)
                    : "0";
                return (
                  <Card
                    key={rdnName}
                    className="hover:shadow-md transition-all duration-300 border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-950/50"
                  >
                    <CardContent className="p-4 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-bold flex items-center gap-2">
                          {getIcon(rdnName)} {rdnName}
                        </p>
                        <p className="text-lg font-black text-foreground mt-1">
                          {formatRupiah(amount)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-medium text-teal-600 bg-teal-50 dark:bg-teal-900/30 px-2 py-1 rounded-full">
                          {percentage}%
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
          </div>
        </div>
      )}

      {/* 5. RIWAYAT TRANSAKSI (Paling Bawah) */}
      <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm mt-6">
        <CardHeader className="pb-3 border-b border-zinc-100 dark:border-zinc-800/50 bg-white dark:bg-zinc-950 rounded-t-xl">
          <CardTitle className="text-base flex items-center gap-2">
            <ListOrdered className="w-4 h-4 text-muted-foreground" /> Riwayat
            Transaksi
          </CardTitle>
          <CardDescription>
            Arus kas masuk dan keluar di bulan {monthName}
          </CardDescription>
        </CardHeader>

        <CardContent className="p-0">
          {transactions.length > 0 ? (
            <div className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
              {transactions.map((tx) => {
                const isIncome = tx.categories?.type === "income";

                return (
                  <div
                    key={tx.id}
                    className="p-4 sm:p-5 flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 sm:gap-4 overflow-hidden">
                      <div
                        className={`p-2.5 rounded-full shrink-0 ${isIncome ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400" : "bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400"}`}
                      >
                        {isIncome ? (
                          <ArrowDownRight className="w-5 h-5" />
                        ) : (
                          <ArrowUpRight className="w-5 h-5" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-sm sm:text-base truncate">
                          {tx.categories?.name}
                        </p>
                        <p className="text-xs sm:text-sm text-muted-foreground truncate">
                          {new Date(tx.transaction_date).toLocaleDateString(
                            "id-ID",
                            { day: "numeric", month: "short", year: "numeric" },
                          )}
                          {tx.notes && ` • ${tx.notes}`}
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0 pl-2">
                      <p
                        className={`font-bold text-base sm:text-lg tracking-tight ${isIncome ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}
                      >
                        {isIncome ? "+" : "-"}
                        {formatRupiah(Number(tx.amount))}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-10 text-center text-muted-foreground flex flex-col items-center justify-center">
              <div className="p-4 bg-zinc-100 dark:bg-zinc-900 rounded-full mb-4">
                <Wallet className="w-8 h-8 opacity-40" />
              </div>
              <p className="font-semibold text-lg text-foreground">Kosong</p>
              <p className="text-sm opacity-80 mt-1 max-w-xs">
                Belum ada transaksi di bulan {monthName}.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
