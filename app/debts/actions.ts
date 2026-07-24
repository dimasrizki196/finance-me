// app/debts/actions.ts
"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// (Biarkan fungsi markAsPaid Anda yang sudah ada di sini)
export async function markAsPaid(formData: FormData) {
  const id = formData.get("id") as string;
  const supabase = await createClient();

  await supabase.from("debts").update({ status: "paid" }).eq("id", id);

  revalidatePath("/debts");
}

// === TAMBAHAN BARU: FUNGSI MEMBUAT KASBON ===
export async function createDebt(formData: FormData) {
  const supabase = await createClient();

  const description = formData.get("description") as string;
  const amount = Number(formData.get("amount"));
  const type = formData.get("type") as string;

  let borrower = "";
  let lender = "";

  // Menentukan siapa yang pinjam dan siapa yang meminjami
  if (type === "dimm_owes_putt") {
    borrower = "dimm";
    lender = "putt";
  } else if (type === "putt_owes_dimm") {
    borrower = "putt";
    lender = "dimm";
  }

  const { error } = await supabase.from("debts").insert({
    description,
    amount,
    borrower,
    lender,
    status: "pending",
  });

  if (error) {
    console.error("Gagal mencatat kasbon:", error);
    throw new Error("Gagal mencatat kasbon");
  }

  revalidatePath("/debts");
}
