// app/split-bills/actions.ts
"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function saveMultipleDebts(formData: FormData) {
  const description = formData.get("description") as string;
  const debtsJson = formData.get("debts") as string;

  // Ubah teks JSON kembali menjadi array objek
  const debtsData = JSON.parse(debtsJson);

  // Jika tidak ada judul, beri nama default
  const finalDescription =
    description.trim() === "" ? "Split Bill Kasbon" : description;

  const supabase = await createClient();

  // Siapkan data untuk dimasukkan ke tabel
  const insertData = debtsData.map((d: any) => ({
    borrower: d.borrower,
    lender: d.lender,
    amount: d.amount,
    description: finalDescription,
    status: "pending",
  }));

  // Masukkan semua hutang sekaligus
  if (insertData.length > 0) {
    await supabase.from("debts").insert(insertData);
  }

  // Arahkan ke halaman Catatan Kasbon
  redirect("/debts");
}
