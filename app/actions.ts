// app/actions.ts
"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// =========================================================================
// 1. KODE ASLI ANDA: Membuat Transaksi Umum (Form Pengeluaran/Pemasukan)
// =========================================================================
export async function createTransaction(formData: FormData) {
  const supabase = await createClient();

  const wallet_id = formData.get("wallet_id") as string;
  const category_id = formData.get("category_id") as string;
  const amount = parseFloat(formData.get("amount") as string);
  const transaction_date = formData.get("transaction_date") as string;
  const notes = formData.get("notes") as string;

  const { error } = await supabase.from("transactions").insert([
    {
      wallet_id,
      category_id,
      amount,
      transaction_date,
      notes,
    },
  ]);

  if (error) {
    console.error("Gagal mencatat transaksi:", error);
    throw new Error("Gagal mencatat transaksi");
  }

  // Refresh halaman agar data langsung terupdate
  revalidatePath("/");
  revalidatePath("/transactions");
}

// =========================================================================
// 2. FITUR TAMBAHAN: Update Nilai Portofolio Saham (Profit / Loss)
// =========================================================================
export async function saveProfitLoss(
  walletId: string,
  rdnName: string,
  difference: number,
) {
  const supabase = await createClient();

  // Cari kategori "Update Portofolio", jika belum ada otomatis dibuatkan
  let { data: cat } = await supabase
    .from("categories")
    .select("id")
    .eq("name", "Update Portofolio")
    .maybeSingle();

  if (!cat) {
    const { data: newCat, error: catError } = await supabase
      .from("categories")
      .insert({ name: "Update Portofolio", type: "investment" })
      .select("id")
      .single();

    if (catError) throw new Error("Gagal membuat kategori otomatis");
    cat = newCat;
  }

  // Simpan selisih ke tabel transaksi. Nilai minus otomatis mengurangi portofolio.
  const { error } = await supabase.from("transactions").insert({
    wallet_id: walletId,
    category_id: cat?.id,
    amount: difference,
    notes: rdnName,
    transaction_date: new Date().toISOString(),
  });

  if (error) {
    console.error("Gagal menyimpan penyesuaian:", error);
    throw new Error("Gagal menyimpan penyesuaian");
  }

  revalidatePath("/");
  revalidatePath("/transactions");
  return { success: true };
}

// =========================================================================
// 3. FITUR TAMBAHAN: Proses Tarik Dana Tunai (Withdrawal RDN)
// =========================================================================
export async function withdrawRdn(
  walletId: string,
  rdnName: string,
  amount: number,
) {
  const supabase = await createClient();

  // Cari kategori "Pencairan RDN", jika belum ada otomatis dibuatkan
  let { data: cat } = await supabase
    .from("categories")
    .select("id")
    .eq("name", "Pencairan RDN")
    .maybeSingle();

  if (!cat) {
    const { data: newCat, error: catError } = await supabase
      .from("categories")
      .insert({ name: "Pencairan RDN", type: "income" })
      .select("id")
      .single();

    if (catError) throw new Error("Gagal membuat kategori otomatis");
    cat = newCat;
  }

  // Masukkan sebagai transaksi positif (Pemasukan riil ke Kas dompet utama)
  const { error } = await supabase.from("transactions").insert({
    wallet_id: walletId,
    category_id: cat?.id,
    amount: amount,
    notes: rdnName,
    transaction_date: new Date().toISOString(),
  });

  if (error) {
    console.error("Gagal memproses penarikan dana:", error);
    throw new Error("Gagal memproses penarikan dana");
  }

  revalidatePath("/");
  revalidatePath("/transactions");
  return { success: true };
}
