"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// 1. Ambil Semua Periode
export async function getAllPeriods() {
  const supabase = createClient();
  
  const { data: { user } } = await (await supabase).auth.getUser();
  if (!user) return [];

  const { data, error } = await (await supabase)
    .from("prod_periods")
    .select("*")
    .eq("user_id", user.id)
    .order("start_date", { ascending: false }); // Urutkan dari yang terbaru

  if (error) {
    console.error("Error get all periods:", error);
    return [];
  }
  
  return data || [];
}

// 2. Buka Periode Baru (dengan Start Date & End Date)
export async function createPeriod(name: string, startDate: string, endDate: string) {
  const supabase = createClient();
  const { data: { user } } = await (await supabase).auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { error } = await (await supabase)
    .from("prod_periods")
    .insert([
      {
        user_id: user.id,
        name,
        start_date: startDate,
        end_date: endDate, // Tanggal akhir ditambahkan
        status: "active",
        settings: { pct_modal: 25, pct_kebutuhan: 50, pct_tabungan: 25 },
      },
    ]);

  if (error) {
    console.error("Error create period:", error);
    throw new Error("Gagal membuat periode baru");
  }

  revalidatePath("/produksi");
}

export async function addTransaction(payloadStr: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const payload = JSON.parse(payloadStr);
  const { period_id, date, type, amount, notes, item_id, qty_bought } = payload;

  // 1. Simpan Transaksi Ke Database (Sekarang history pasti tersimpan!)
  const { error } = await supabase.from("prod_transactions").insert([{
    period_id,
    user_id: user.id,
    date,
    type,
    amount: Number(amount) || 0,
    notes,
    item_id: item_id || null, // Relasi ke Gudang
    qty_bought: Number(qty_bought) || 0
  }]);

  if (error) throw new Error(error.message);

  // 2. Jika tipe transaksi adalah 'belanja_stok', TAMBAH STOK & UPDATE HARGA RATA-RATA
  if (type === "belanja_stok" && item_id && qty_bought) {
    const { data: item } = await supabase
      .from("prod_inventory")
      .select("current_stock, price_per_unit")
      .eq("id", item_id)
      .single();

    if (item) {
      const oldStock = Number(item.current_stock) || 0;
      const oldPrice = Number(item.price_per_unit) || 0;
      const addedQty = Number(qty_bought);
      const addedCost = Number(amount); // Uang yang dikeluarkan (misal 135000)

      const newStock = oldStock + addedQty;
      
      // Rumus Moving Average: 
      // ((Stok Lama * Harga Lama) + Biaya Beli Baru) / Stok Baru
      let newPricePerUnit = oldPrice;
      if (newStock > 0) {
        const totalOldValue = oldStock * oldPrice;
        newPricePerUnit = (totalOldValue + addedCost) / newStock;
      }

      await supabase
        .from("prod_inventory")
        .update({ 
          current_stock: newStock,
          price_per_unit: Math.round(newPricePerUnit) // Dibulatkan agar rapi
        })
        .eq("id", item_id);
    }
  }

  revalidatePath(`/produksi/${period_id}`);
}

// Tambahkan di file app/produksi/produksi.ts
export async function updatePeriodSettings(periodId: string, settings: any) {
  const supabase = await createClient(); // pastikan createClient sudah di-import di file ini
  
  const { error } = await supabase
    .from("prod_periods") // sesuaikan dengan nama tabel periode Anda jika berbeda
    .update({ settings })
    .eq("id", periodId);

  if (error) throw new Error(error.message);
}

// Tambahkan di bagian bawah file app/produksi/produksi.ts
export async function getPeriodTransactions(periodId: string) {
  const supabase = await createClient(); 
  
  const { data, error } = await supabase
    .from("prod_transactions")
    .select("*")
    .eq("period_id", periodId);

  if (error) {
    console.error("Gagal menarik transaksi:", error);
    return [];
  }
  return data || [];
}

// Fungsi untuk Tutup Periode
export async function closePeriod(periodId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data, error } = await supabase
    .from("prod_periods")
    .update({ 
      status: "closed" 
    })
    .eq("id", periodId)
    .eq("user_id", user.id) // Memastikan hanya pemilik yang bisa menutup
    .select();

  if (error) {
    console.error("Error closing period:", error);
    throw new Error("Gagal menutup periode produksi");
  }

  // Refresh cache Next.js agar UI langsung memperbarui status periode
  revalidatePath("/produksi");

  return { success: true, data };
}