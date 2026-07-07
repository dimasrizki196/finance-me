// app/routine-savings/page.tsx
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import RoutineSavingsClient from "./RoutineSavingsClient";

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
      <div className="p-8 text-center text-red-500">
        Error: Dompet Tabungan Kita (joint) belum dibuat. Silakan buat dompet
        bersama terlebih dahulu.
      </div>
    );
  }

  // 3. Ambil ID Kategori Pemasukan
  const { data: categories } = await supabase
    .from("categories")
    .select("id")
    .ilike("name", "%Tabungan Kita%") // Mencari nama yang mengandung kata "Tabungan Kita"
    .limit(1);

  const incomeCategoryId = categories?.[0]?.id;

  if (!incomeCategoryId) {
    return (
      <div className="p-8 text-center text-red-500">
        Error: Kategori 'Tabungan Kita' tidak ditemukan. Silakan buat
        kategorinya dulu di database.
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
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto w-full">
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
