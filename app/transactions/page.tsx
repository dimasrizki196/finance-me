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
  TrendingUp,
  TrendingDown,
  Clock,
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
    .filter((tx) => {
      const cat = Array.isArray(tx.categories)
        ? tx.categories[0]
        : tx.categories;
      return cat?.type === "income";
    })
    .reduce((sum, tx) => sum + Number(tx.amount), 0);

  const expense = transactions
    .filter((tx) => {
      const cat = Array.isArray(tx.categories)
        ? tx.categories[0]
        : tx.categories;
      return cat?.type === "expense";
    })
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

      // 1. Ubah catatan ke huruf kecil semua untuk mendeteksi kata kunci
      const noteLower = tx.notes ? tx.notes.trim().toLowerCase() : "";
      let rdnName = "Investasi Lainnya";

      // 2. Logika pengelompokan ketat (kebal typo/huruf besar-kecil)
      if (noteLower.includes("putri")) {
        rdnName = "RDN Putri";
      } else if (noteLower.includes("dimas")) {
        rdnName = "RDN Dimas";
      } else if (
        noteLower.includes("ajaib") ||
        noteLower.includes("stockbit")
      ) {
        rdnName = "RDN Ajaib";
      } else if (noteLower.includes("reksa") || noteLower.includes("bibit")) {
        rdnName = "Reksa Dana";
      } else if (tx.notes && tx.notes.trim() !== "") {
        // Jika tidak masuk kategori di atas, rapikan teksnya dan paksa "Rdn" jadi "RDN"
        rdnName = tx.notes
          .trim()
          .split(" ")
          .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
          .join(" ")
          .replace("Rdn", "RDN");
      }

      // 3. Kalkulasi ke portofolio
      if (
        catType === "investment" ||
        catName === "Update Portofolio" ||
        catName === "Pencairan RDN"
      ) {
        if (!personalPortfolio[rdnName]) personalPortfolio[rdnName] = 0;

        if (catName === "Pencairan RDN") {
          personalPortfolio[rdnName] -= amount;
          personalInvested -= amount;
        } else {
          personalPortfolio[rdnName] += amount;
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
      return <Briefcase className="w-5 h-5" />;
    if (lName.includes("reksa") || lName.includes("bibit"))
      return <PieChart className="w-5 h-5" />;
    if (lName.includes("lainnya")) return <Layers className="w-5 h-5" />;
    return <UserCircle2 className="w-5 h-5" />;
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
    <div className="p-4 sm:p-6 lg:p-10 max-w-7xl mx-auto space-y-8 w-full animate-in fade-in duration-500">
      {/* 1. HEADER & FILTER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-zinc-100 dark:border-zinc-800 pb-6">
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button
              variant="outline"
              size="icon"
              className="h-12 w-12 rounded-full shadow-sm hover:bg-zinc-100 dark:hover:bg-zinc-800 border-zinc-200"
            >
              <ArrowLeft className="w-5 h-5 text-zinc-600 dark:text-zinc-300" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-black tracking-tight text-foreground">
              {isPersonal ? "Uang Pribadi" : "Tabungan Kita"}
            </h1>
            <p className="text-sm font-medium text-muted-foreground mt-1 flex items-center gap-1.5">
              <Wallet className="w-4 h-4" />
              {activeWallet ? activeWallet.name : "Dompet Tidak Ditemukan"}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between bg-zinc-50 dark:bg-zinc-900/50 p-2 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm w-full md:w-auto min-w-[280px]">
          <Link
            href={`?type=${walletType}&month=${prevMonth}&year=${prevYear}`}
          >
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-xl hover:bg-white dark:hover:bg-zinc-800"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="flex items-center gap-2 font-bold text-sm">
            <Calendar className="w-4 h-4 text-indigo-500" /> {monthName}
          </div>
          <Link
            href={`?type=${walletType}&month=${nextMonth}&year=${nextYear}`}
          >
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-xl hover:bg-white dark:hover:bg-zinc-800"
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
          </Link>
        </div>
      </div>

      {/* 2. KARTU TOTAL DASHBOARD (DI ATAS) */}
      <div
        className={`grid grid-cols-1 sm:grid-cols-2 ${isPersonal ? "lg:grid-cols-3" : ""} gap-5`}
      >
        <Card className="bg-gradient-to-br from-emerald-500 to-emerald-700 text-white border-none shadow-xl shadow-emerald-500/20 rounded-3xl relative overflow-hidden">
          <div className="absolute top-0 right-0 -mr-6 -mt-6 opacity-20">
            <ArrowDownRight className="w-32 h-32" />
          </div>
          <CardContent className="p-6 sm:p-8 relative z-10">
            <p className="text-emerald-100 font-bold text-xs mb-2 uppercase tracking-widest">
              Masuk Bulan Ini
            </p>
            <p className="text-3xl sm:text-4xl font-black tracking-tighter">
              {formatRupiah(income)}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-rose-500 to-rose-700 text-white border-none shadow-xl shadow-rose-500/20 rounded-3xl relative overflow-hidden">
          <div className="absolute top-0 right-0 -mr-6 -mt-6 opacity-20">
            <ArrowUpRight className="w-32 h-32" />
          </div>
          <CardContent className="p-6 sm:p-8 relative z-10">
            <p className="text-rose-100 font-bold text-xs mb-2 uppercase tracking-widest">
              Keluar Bulan Ini
            </p>
            <p className="text-3xl sm:text-4xl font-black tracking-tighter">
              {formatRupiah(expense)}
            </p>
          </CardContent>
        </Card>

        {isPersonal && (
          <Card className="bg-gradient-to-br from-indigo-800 to-indigo-950 text-indigo-50 border-none shadow-xl shadow-indigo-900/20 rounded-3xl relative overflow-hidden">
            <div className="absolute top-0 right-0 -mr-6 -mt-6 opacity-10">
              <Briefcase className="w-32 h-32" />
            </div>
            <CardContent className="p-6 sm:p-8 relative z-10">
              <p className="text-indigo-300 font-bold text-xs mb-2 uppercase tracking-widest">
                Aset Investasi
              </p>
              <p className="text-3xl sm:text-4xl font-black tracking-tighter">
                {formatRupiah(personalInvested)}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* 3. PANEL AKSI CEPAT */}
      <div className="flex flex-col sm:flex-row items-center gap-4 p-4 bg-zinc-50 dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-sm">
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
        <div className="pt-4">
          <h2 className="text-xl font-bold flex items-center gap-2 mb-4 text-foreground">
            <Layers className="w-6 h-6 text-indigo-500" /> Sebaran Portofolio
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
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
                    className="hover:border-indigo-500/50 transition-colors border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-sm"
                  >
                    <CardContent className="p-5">
                      <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded-xl">
                          {getIcon(rdnName)}
                        </div>
                        <p className="text-xs font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1.5 rounded-lg">
                          {percentage}%
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-muted-foreground mb-1">
                          {rdnName}
                        </p>
                        <p className="text-2xl font-black text-foreground">
                          {formatRupiah(amount)}
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
      <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm rounded-3xl mt-8 overflow-hidden">
        <CardHeader className="pb-5 border-b border-zinc-100 dark:border-zinc-800/50 bg-zinc-50 dark:bg-zinc-900/30">
          <CardTitle className="text-xl flex items-center gap-2">
            <ListOrdered className="w-5 h-5 text-indigo-500" /> Riwayat
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
                const category: any = Array.isArray(tx.categories)
                  ? tx.categories[0]
                  : tx.categories;
                const catType = category?.type;
                const catName = category?.name;
                const amountNum = Number(tx.amount);

                // FIX BUG VIEW: Penentuan warna & icon berdasarkan logika mutasi kas riil
                let isPositive = catType === "income";
                let Icon = isPositive ? ArrowDownRight : ArrowUpRight;
                let bgStyle = isPositive
                  ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600"
                  : "bg-rose-100 dark:bg-rose-900/30 text-rose-600";

                // Khusus "Update Portofolio", bisa untung (+) atau rugi (-)
                if (catName === "Update Portofolio") {
                  isPositive = amountNum >= 0;
                  Icon = isPositive ? TrendingUp : TrendingDown;
                  bgStyle = isPositive
                    ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600"
                    : "bg-rose-100 dark:bg-rose-900/30 text-rose-600";
                }

                // Kita absolut-kan angkanya agar tidak ada "-Rp -50.000"
                const displayAmount = Math.abs(amountNum);

                return (
                  <div
                    key={tx.id}
                    className="p-5 sm:p-6 flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-zinc-900/40 transition-colors"
                  >
                    <div className="flex items-center gap-4 overflow-hidden">
                      <div className={`p-3 rounded-2xl shrink-0 ${bgStyle}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-base sm:text-lg truncate text-foreground">
                          {catName}
                        </p>
                        <p className="text-xs sm:text-sm font-medium text-muted-foreground truncate flex items-center gap-1.5 mt-0.5">
                          <Clock className="w-3.5 h-3.5" />
                          {new Date(tx.transaction_date).toLocaleDateString(
                            "id-ID",
                            { day: "numeric", month: "short", year: "numeric" },
                          )}
                          {tx.notes && (
                            <span className="text-zinc-300 dark:text-zinc-600 hidden sm:inline">
                              •
                            </span>
                          )}
                          {tx.notes && (
                            <span className="truncate">{tx.notes}</span>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0 pl-4">
                      <p
                        className={`font-black text-lg sm:text-xl tracking-tight ${isPositive ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-500"}`}
                      >
                        {isPositive ? "+" : "-"}
                        {formatRupiah(displayAmount)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-12 text-center text-muted-foreground flex flex-col items-center justify-center">
              <div className="p-5 bg-zinc-100 dark:bg-zinc-900 rounded-full mb-4 text-zinc-400">
                <Wallet className="w-10 h-10" />
              </div>
              <p className="font-bold text-xl text-foreground">Kosong</p>
              <p className="text-sm font-medium mt-1 max-w-xs">
                Belum ada transaksi di bulan {monthName}.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
