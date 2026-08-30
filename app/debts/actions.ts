// app/debts/actions.ts
"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function markAsPaid(formData: FormData) {
  const id = formData.get("id") as string;
  const supabase = await createClient();

  await supabase.from("debts").update({ status: "paid" }).eq("id", id);
  revalidatePath("/debts");
}

export async function createDebt(formData: FormData) {
  const supabase = await createClient();

  const description = formData.get("description") as string;
  const amount = Number(formData.get("amount"));
  const type = formData.get("type") as string; 

  let borrower = "";
  let lender = "";

  // 6 Kombinasi arah pinjaman
  switch (type) {
    case "dimm_owes_putt": borrower = "dimm"; lender = "putt"; break;
    case "putt_owes_dimm": borrower = "putt"; lender = "dimm"; break;
    case "dimm_owes_tabungan": borrower = "dimm"; lender = "tabungan"; break;
    case "putt_owes_tabungan": borrower = "putt"; lender = "tabungan"; break;
    case "tabungan_owes_dimm": borrower = "tabungan"; lender = "dimm"; break;
    case "tabungan_owes_putt": borrower = "tabungan"; lender = "putt"; break;
    default: throw new Error("Tipe pinjaman tidak valid");
  }

  const { error } = await supabase.from("debts").insert({
    description,
    amount,
    borrower,
    lender,
    status: "pending",
  });

  if (error) {
    console.error("Gagal mencatat pinjaman:", error);
    return { success: false, message: error.message };
  }

  revalidatePath("/debts");
  return { success: true };
}