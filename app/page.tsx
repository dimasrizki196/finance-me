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

  const { data: transactions } = await supabase
    .from("transactions")
    .select("amount, wallet_id, transaction_date, categories(name, type)");

  let totalPersonal = 0;
  let personalCash = 0;
  let personalRDN = 0;
  const personalTransactions: any[] = [];

  let totalJoint = 0;
  let jointCash = 0;
  let jointRDN = 0;

  transactions?.forEach((tx) => {
    // @ts-expect-error: Peringatan relasi
    const catType = tx.categories?.type;
    // @ts-expect-error: Peringatan relasi
    const catName = tx.categories?.name;

    const amount = Number(tx.amount);
    const wallet = wallets?.find((w) => w.id === tx.wallet_id);

    if (wallet) {
      const isLegacyRdnWallet =
        wallet.name.toLowerCase().includes("rdn") ||
        wallet.name.toLowerCase().includes("saham");

      if (wallet.type === "personal") {
        personalTransactions.push(tx);

        if (isLegacyRdnWallet) {
          if (catType === "income") personalRDN += amount;
          else if (catType === "expense" || catType === "investment")
            personalRDN -= amount;
        } else {
          if (catName === "Pencairan RDN") {
            personalCash += amount;
            personalRDN -= amount;
          } else if (catName === "Update Portofolio") {
            personalRDN += amount;
          } else if (catType === "investment") {
            personalCash -= amount;
            personalRDN += amount;
          } else if (catType === "income") {
            personalCash += amount;
          } else if (catType === "expense") {
            personalCash -= amount;
          }
        }
      } else if (wallet.type === "joint") {
        if (isLegacyRdnWallet) {
          if (catType === "income") jointRDN += amount;
          else if (catType === "expense" || catType === "investment")
            jointRDN -= amount;
        } else {
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

  totalPersonal = personalCash + personalRDN;
  totalJoint = jointCash + jointRDN;

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6 w-full animate-in fade-in duration-500">
      {/* HEADER COMPACT */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-100 dark:border-zinc-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
            Halo, {userName}! 👋
          </h1>
          <p className="text-sm font-medium text-muted-foreground mt-1">
            Pusat kendali keuangan Anda dan pasangan.
          </p>
        </div>
      </div>

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
