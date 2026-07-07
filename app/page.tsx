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

  // Ditambahkan transaction_date dan name untuk fitur Infaq
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
    const type = tx.categories?.type; // 'income', 'expense', atau 'investment'
    const amount = Number(tx.amount);
    const wallet = wallets?.find((w) => w.id === tx.wallet_id);

    if (wallet) {
      const isRdn =
        wallet.name.toLowerCase().includes("rdn") ||
        wallet.name.toLowerCase().includes("saham");

      // ------------------------------------
      // LOGIKA UNTUK UANG PRIBADI
      // ------------------------------------
      if (wallet.type === "personal") {
        personalTransactions.push(tx); // Simpan transaksi untuk halaman Tabs

        if (type === "income") {
          totalPersonal += amount;
          if (isRdn) personalRDN += amount;
          else personalCash += amount;
        } else if (type === "expense") {
          totalPersonal -= amount;
          if (isRdn) personalRDN -= amount;
          else personalCash -= amount;
        } else if (type === "investment") {
          // Total Uang Pribadi tetap, tapi cash berkurang dan RDN bertambah
          if (!isRdn) {
            personalCash -= amount;
            personalRDN += amount;
          }
        }
      }

      // ------------------------------------
      // LOGIKA UNTUK TABUNGAN KITA (BERSAMA)
      // ------------------------------------
      else if (wallet.type === "joint") {
        if (type === "income") {
          totalJoint += amount;
          if (isRdn) jointRDN += amount;
          else jointCash += amount;
        } else if (type === "expense") {
          totalJoint -= amount;
          if (isRdn) jointRDN -= amount;
          else jointCash -= amount;
        } else if (type === "investment") {
          // Total Tabungan Kita tetap, tapi cash berkurang dan RDN bertambah
          if (!isRdn) {
            jointCash -= amount;
            jointRDN += amount;
          }
        }
      }
    }
  });

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
