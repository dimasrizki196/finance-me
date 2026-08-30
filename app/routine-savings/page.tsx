// app/routine-savings/page.tsx
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import RoutineSavingsClient from "./RoutineSavingsClient";
import { AlertCircle, Wallet } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function RoutineSavingsPage(props: {
  searchParams: Promise<{ month?: string; year?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // 1. Baca filter bulan dari URL
  const searchParams = await props.searchParams;
  const now = new Date();
  const currentMonth = searchParams.month
    ? parseInt(searchParams.month)
    : now.getMonth() + 1;
  const currentYear = searchParams.year
    ? parseInt(searchParams.year)
    : now.getFullYear();

  // 2. Ambil Dompet Bersama
  const { data: wallets } = await supabase
    .from("wallets")
    .select("*")
    .eq("type", "joint");

  const jointWallet = wallets?.[0];

  if (!jointWallet) {
    return (
      <div className="p-4 sm:p-6 max-w-5xl mx-auto w-full animate-in fade-in duration-500">
        <Card className="border-rose-200 bg-rose-50/50 dark:bg-rose-950/20 rounded-2xl">
          <CardContent className="p-6 text-center space-y-3">
            <div className="p-3 bg-rose-100 dark:bg-rose-900/30 text-rose-600 rounded-full w-fit mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h2 className="font-bold text-base text-rose-800 dark:text-rose-300">
              Dompet Belum Dibuat
            </h2>
            <p className="text-xs sm:text-sm text-rose-700/80 dark:text-rose-400 max-w-md mx-auto">
              Dompet Tabungan Kita (joint) belum ditemukan di sistem. Silakan
              buat dompet bersama terlebih dahulu.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 3. Ambil ID Kategori Pemasukan
  const { data: categories } = await supabase
    .from("categories")
    .select("id")
    .ilike("name", "%Tabungan Kita%")
    .limit(1);

  const incomeCategoryId = categories?.[0]?.id;

  if (!incomeCategoryId) {
    return (
      <div className="p-4 sm:p-6 max-w-5xl mx-auto w-full animate-in fade-in duration-500">
        <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/20 rounded-2xl">
          <CardContent className="p-6 text-center space-y-3">
            <div className="p-3 bg-amber-100 dark:bg-amber-900/30 text-amber-600 rounded-full w-fit mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h2 className="font-bold text-base text-amber-800 dark:text-amber-300">
              Kategori Belum Dibuat
            </h2>
            <p className="text-xs sm:text-sm text-amber-700/80 dark:text-amber-400 max-w-md mx-auto">
              Kategori 'Tabungan Kita' tidak ditemukan di database. Silakan buat
              kategorinya terlebih dahulu.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 4. Ambil Transaksi Khusus Bulan yang Dipilih
  const lastDay = new Date(currentYear, currentMonth, 0).getDate();
  const startDate = `${currentYear}-${String(currentMonth).padStart(2, "0")}-01`;
  const endDate = `${currentYear}-${String(currentMonth).padStart(2, "0")}-${lastDay}`;

  const { data: transactions } = await supabase
    .from("transactions")
    .select("*")
    .eq("wallet_id", jointWallet.id)
    .gte("transaction_date", startDate)
    .lte("transaction_date", endDate);

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6 w-full animate-in fade-in duration-500">
      <RoutineSavingsClient
        wallet={jointWallet}
        incomeCategoryId={incomeCategoryId}
        transactions={transactions || []}
        currentMonth={currentMonth}
        currentYear={currentYear}
      />
    </div>
  );
}
