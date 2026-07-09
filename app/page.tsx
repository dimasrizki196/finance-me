// app/page.tsx
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import DashboardTabs from "@/components/DashboardTabs";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const userName = user.email?.split("@")[0] || "Pengguna";

  const { data: wallets } = await supabase
    .from("wallets")
    .select("*")
    .or(`owner_id.eq.${user.id},type.eq.joint`);

  // Ditambahkan transaction_date dan name untuk fitur Infaq dan Filter
  const { data: transactions } = await supabase
    .from("transactions")
    .select("amount, wallet_id, transaction_date, categories(name, type)");

  // Variabel Uang Pribadi
  let totalPersonal = 0;
  let personalCash = 0;
  let personalRDN = 0;
  const personalTransactions: any[] = []; // Array khusus untuk kalkulator Infaq

  // Variabel Tabungan Kita
  let totalJoint = 0;
  let jointCash = 0;
  let jointRDN = 0;

  transactions?.forEach((tx) => {
    // @ts-expect-error: Peringatan relasi
    const catType = tx.categories?.type; // 'income', 'expense', atau 'investment'
    // @ts-expect-error: Peringatan relasi
    const catName = tx.categories?.name;

    const amount = Number(tx.amount);
    const wallet = wallets?.find((w) => w.id === tx.wallet_id);

    if (wallet) {
      // Cek apakah wallet ini adalah wallet fisik RDN (jika Anda masih punya sisa data lama)
      const isLegacyRdnWallet =
        wallet.name.toLowerCase().includes("rdn") ||
        wallet.name.toLowerCase().includes("saham");

      // ------------------------------------
      // LOGIKA UNTUK UANG PRIBADI
      // ------------------------------------
      if (wallet.type === "personal") {
        personalTransactions.push(tx); // Simpan transaksi untuk halaman Tabs (Infaq)

        if (isLegacyRdnWallet) {
          // Fallback untuk data lama (jika ada dompet khusus bernama RDN)
          if (catType === "income") personalRDN += amount;
          else if (catType === "expense" || catType === "investment")
            personalRDN -= amount;
        } else {
          // SISTEM BARU: 1 Dompet Terpusat
          if (catName === "Pencairan RDN") {
            personalCash += amount; // Uang masuk ke dompet fisik
            personalRDN -= amount; // Aset saham berkurang
          } else if (catName === "Update Portofolio") {
            personalRDN += amount; // Cash tidak berubah, hanya nilai saham yang naik/turun
          } else if (catType === "investment") {
            personalCash -= amount; // Topup saham: uang fisik berkurang
            personalRDN += amount; // Aset saham bertambah
          } else if (catType === "income") {
            personalCash += amount; // Pemasukan biasa
          } else if (catType === "expense") {
            personalCash -= amount; // Pengeluaran biasa
          }
        }
      }

      // ------------------------------------
      // LOGIKA UNTUK TABUNGAN KITA (BERSAMA)
      // ------------------------------------
      else if (wallet.type === "joint") {
        if (isLegacyRdnWallet) {
          // Fallback untuk data lama
          if (catType === "income") jointRDN += amount;
          else if (catType === "expense" || catType === "investment")
            jointRDN -= amount;
        } else {
          // SISTEM BARU: 1 Dompet Terpusat
          if (catName === "Pencairan RDN") {
            jointCash += amount;
            jointRDN -= amount;
          } else if (catName === "Update Portofolio") {
            jointRDN += amount;
          } else if (catType === "investment") {
            jointCash -= amount;
            jointRDN += amount;
          } else if (catType === "income") {
            jointCash += amount;
          } else if (catType === "expense") {
            jointCash -= amount;
          }
        }
      }
    }
  });

  // Total Kekayaan = Cash di tangan + Saldo Saham
  totalPersonal = personalCash + personalRDN;
  totalJoint = jointCash + jointRDN;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 w-full">
      {/* HEADER */}
      <div className="space-y-1 mt-2">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
          Halo, {userName}! 👋
        </h1>
        <p className="text-sm text-muted-foreground">
          Pusat kendali keuangan Anda dan pasangan.
        </p>
      </div>

      {/* MEMANGGIL KOMPONEN TABS */}
      <DashboardTabs
        totalPersonal={totalPersonal}
        totalJoint={totalJoint}
        jointCash={jointCash}
        jointRDN={jointRDN}
        personalCash={personalCash}
        personalRDN={personalRDN}
        personalTransactions={personalTransactions}
      />
    </div>
  );
}
