// app/investments/actions.ts
"use server";

import { createClient } from "@/lib/supabase/server";

// Mengambil daftar dompet RDN dan Dompet Biasa
export async function getInvestmentData() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: wallets } = await supabase
    .from("wallets")
    .select("*")
    .or(`owner_id.eq.${user.id},type.eq.joint`);

  const { data: transactions } = await supabase
    .from("transactions")
    .select("amount, wallet_id, categories(type)");

  const rdnWallets: any[] = [];
  const normalWallets: any[] = [];

  wallets?.forEach(w => {
    const isRdn = w.name.toLowerCase().includes("rdn") || w.name.toLowerCase().includes("saham");
    
    // Kalkulasi saldo saat ini
    let balance = 0;
    transactions?.forEach(tx => {
      if (tx.wallet_id === w.id) {
        // @ts-expect-error relasi
        const type = tx.categories?.type;
        if (type === 'income') balance += Number(tx.amount);
        else if (type === 'expense' || type === 'investment') balance -= Number(tx.amount);
      }
    });

    if (isRdn) rdnWallets.push({ ...w, balance });
    else normalWallets.push({ ...w, balance });
  });

  return { rdnWallets, normalWallets };
}

// Fitur A: Update Profit / Loss
export async function updatePortfolio(walletId: string, diff: number) {
  if (diff === 0) return;
  
  const supabase = await createClient();
  const txType = diff > 0 ? "income" : "expense"; // Positif = Profit, Negatif = Loss
  
  // Cari kategori income/expense yang ada di database untuk menempelkan transaksinya
  const { data: categories } = await supabase.from("categories").select("id").eq("type", txType).limit(1);
  const categoryId = categories?.[0]?.id;

  if (categoryId) {
    await supabase.from("transactions").insert({
      wallet_id: walletId,
      amount: Math.abs(diff),
      category_id: categoryId,
      transaction_date: new Date().toISOString()
    });
  }
}

// Fitur B: Tarik Dana (Withdrawal)
export async function withdrawFunds(rdnId: string, destId: string, amount: number) {
  if (!rdnId || !destId || amount <= 0) return;
  const supabase = await createClient();

  // Cari kategori pengeluaran dan pemasukan
  const { data: expCats } = await supabase.from("categories").select("id").eq("type", "expense").limit(1);
  const { data: incCats } = await supabase.from("categories").select("id").eq("type", "income").limit(1);

  if (expCats?.[0]?.id && incCats?.[0]?.id) {
    // 1. Uang keluar dari RDN (Expense)
    await supabase.from("transactions").insert({
      wallet_id: rdnId,
      amount: amount,
      category_id: expCats[0].id,
      transaction_date: new Date().toISOString()
    });

    // 2. Uang masuk ke Rekening Tujuan (Income)
    await supabase.from("transactions").insert({
      wallet_id: destId,
      amount: amount,
      category_id: incCats[0].id,
      transaction_date: new Date().toISOString()
    });
  }
}