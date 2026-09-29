"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// --- 0. GET INVENTORY (Untuk Dropdown) ---
export async function getInventory() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("prod_inventory")
    .select("*")
    .order("name");
  if (error) return [];
  return data;
}
// --- 1. GET DETAIL PERIODE, RECORD & TRANSAKSI PENGELUARAN ---
export async function getPeriodDetail(periodId: string) {
  const supabase = await createClient();

  // A. Ambil Info Periode
  const { data: period, error: periodError } = await supabase
    .from("prod_periods")
    .select("*")
    .eq("id", periodId)
    .single();
  if (periodError) return null;

  // B. Ambil Catatan Produksi Harian
  const { data: records } = await supabase
    .from("prod_daily_records")
    .select("*")
    .eq("period_id", periodId)
    .order("date", { ascending: false });

  // C. Ambil Riwayat Transaksi Pengeluaran (Belanja Stok & Kebutuhan)
  const { data: transactions } = await supabase
    .from("prod_transactions")
    .select("*, prod_inventory(name)")
    .eq("period_id", periodId)
    .order("date", { ascending: false });

  const formattedRecords = (records || []).map((r) => {
    let detail_stok = [];
    let detail_harian = [];

    if (r.rincian_bahan) {
      const bahan =
        typeof r.rincian_bahan === "string"
          ? JSON.parse(r.rincian_bahan)
          : r.rincian_bahan;
      detail_stok = bahan.detail_stok || [];
      detail_harian = bahan.detail_harian || [];
    }
    const detail_penjualan =
      typeof r.rincian_penjualan === "string"
        ? JSON.parse(r.rincian_penjualan)
        : r.rincian_penjualan || [];

    return {
      ...r,
      modal_pagi: Number(r.modal_stok || 0) + Number(r.modal_cash || 0),
      omset_malam: Number(r.omzet || 0),
      detail_stok,
      detail_harian,
      detail_penjualan,
    };
  });

  return {
    period,
    records: formattedRecords,
    transactions: transactions || [],
  };
}

// --- 2. SIMPAN / UPDATE PRODUKSI PAGI (DENGAN POTONG STOK) ---
export async function saveProduksi(periodId: string, payloadStr: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const payload = JSON.parse(payloadStr);
  const { id, date, modal_pagi, detail_stok, detail_harian, produksi_pcs } =
    payload;
  const rincianBahanData = { detail_stok, detail_harian };

  // 2A. LOGIKA KALKULASI SELISIH STOK
  const stockDiff: Record<string, number> = {};

  // Jika ini UPDATE (id ada), kita kembalikan dulu stok lama ke gudang
  if (id) {
    const { data: oldRec } = await supabase
      .from("prod_daily_records")
      .select("rincian_bahan")
      .eq("id", id)
      .single();
    if (oldRec && oldRec.rincian_bahan) {
      const bahanLama =
        typeof oldRec.rincian_bahan === "string"
          ? JSON.parse(oldRec.rincian_bahan)
          : oldRec.rincian_bahan;
      const stokLama = bahanLama.detail_stok || [];
      stokLama.forEach((item: any) => {
        if (item.itemId)
          stockDiff[item.itemId] =
            (stockDiff[item.itemId] || 0) + Number(item.qty || 0);
      });
    }
  }

  // Kurangi dengan pemakaian stok yang baru
  detail_stok.forEach((item: any) => {
    if (item.itemId)
      stockDiff[item.itemId] =
        (stockDiff[item.itemId] || 0) - Number(item.qty || 0);
  });

  // Terapkan selisih ke tabel prod_inventory (Gudang)
  const itemIdsToUpdate = Object.keys(stockDiff);
  if (itemIdsToUpdate.length > 0) {
    const { data: inventoryData } = await supabase
      .from("prod_inventory")
      .select("id, current_stock")
      .in("id", itemIdsToUpdate);
    if (inventoryData) {
      for (const inv of inventoryData) {
        const diff = stockDiff[inv.id] || 0;
        if (diff !== 0) {
          const newStock = Number(inv.current_stock) + diff;
          await supabase
            .from("prod_inventory")
            .update({ current_stock: newStock })
            .eq("id", inv.id);
        }
      }
    }
  }

  // 2B. SIMPAN DATA KE DATABASE PRODUKSI
  if (id) {
    const { error } = await supabase
      .from("prod_daily_records")
      .update({
        modal_stok: modal_pagi,
        rincian_bahan: rincianBahanData,
        produksi_pcs: Number(produksi_pcs) || 0,
      })
      .eq("id", id);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase.from("prod_daily_records").insert([
      {
        period_id: periodId,
        user_id: user.id,
        date,
        modal_stok: modal_pagi,
        modal_cash: 0,
        rincian_bahan: rincianBahanData,
        produksi_pcs: Number(produksi_pcs) || 0,
        omzet: 0,
        laba_bersih: 0,
      },
    ]);
    if (error) throw new Error(error.message);
  }

  revalidatePath(`/produksi/${periodId}`);
}

// --- 3. SIMPAN / UPDATE PENJUALAN MALAM ---
export async function savePenjualan(periodId: string, payloadStr: string) {
  const supabase = await createClient();
  const payload = JSON.parse(payloadStr);
  const { id, omset_malam, terjual_pcs, laba_bersih, detail_penjualan } =
    payload;
  if (!id) throw new Error("ID Record tidak ditemukan.");

  const { error } = await supabase
    .from("prod_daily_records")
    .update({
      omzet: omset_malam,
      terjual_pcs: Number(terjual_pcs) || 0,
      laba_bersih,
      rincian_penjualan: detail_penjualan,
    })
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath(`/produksi/${periodId}`);
}

// --- 4. HAPUS CATATAN (DENGAN PENGEMBALIAN STOK) ---
export async function deleteDailyRecord(recordId: string) {
  const supabase = await createClient();

  const { data: record } = await supabase
    .from("prod_daily_records")
    .select("period_id, rincian_bahan")
    .eq("id", recordId)
    .single();

  if (record && record.rincian_bahan) {
    // Kembalikan stok ke gudang jika catatan harian dihapus
    const bahan =
      typeof record.rincian_bahan === "string"
        ? JSON.parse(record.rincian_bahan)
        : record.rincian_bahan;
    const stokHapus = bahan.detail_stok || [];

    if (stokHapus.length > 0) {
      const ids = stokHapus.map((i: any) => i.itemId);
      const { data: inventoryData } = await supabase
        .from("prod_inventory")
        .select("id, current_stock")
        .in("id", ids);

      if (inventoryData) {
        for (const inv of inventoryData) {
          const deletedItem = stokHapus.find((i: any) => i.itemId === inv.id);
          if (deletedItem) {
            await supabase
              .from("prod_inventory")
              .update({
                current_stock:
                  Number(inv.current_stock) + Number(deletedItem.qty || 0),
              })
              .eq("id", inv.id);
          }
        }
      }
    }
  }

  const { error } = await supabase
    .from("prod_daily_records")
    .delete()
    .eq("id", recordId);
  if (error) throw new Error(error.message);
  if (record) revalidatePath(`/produksi/${record.period_id}`);
}

// --- ACTIONS GUDANG STOK ---
export async function addInventoryItem(name: string, unit: string, initialStock: number) {
  const supabase = await createClient();

  // 1. Ambil User ID yang sedang login
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  // 2. Sertakan user_id saat insert ke Supabase
  const { error } = await supabase.from("prod_inventory").insert([
    {
      user_id: user.id, // <--- TAMBAHKAN USER ID DI SINI
      name,
      unit,
      current_stock: Number(initialStock) || 0,
    },
  ]);

  if (error) throw new Error(error.message);
  revalidatePath("/produksi");
}

export async function updateInventoryStock(id: string, newStock: number) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("prod_inventory")
    .update({ current_stock: Number(newStock) })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/produksi");
}