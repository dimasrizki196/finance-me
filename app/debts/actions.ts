// app/debts/actions.ts
"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function markAsPaid(formData: FormData) {
  const id = formData.get("id") as string;
  const supabase = await createClient();
  
  await supabase
    .from("debts")
    .update({ status: "paid" })
    .eq("id", id);
    
  revalidatePath("/debts"); // Refresh halaman otomatis
}