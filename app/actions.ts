// app/actions.ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createTransaction(formData: FormData) {
  const supabase = await createClient()
  
  // Ambil data dari form
  const wallet_id = formData.get('wallet_id') as string
  const category_id = formData.get('category_id') as string
  const amount = parseFloat(formData.get('amount') as string)
  const transaction_date = formData.get('transaction_date') as string
  const notes = formData.get('notes') as string

  // Masukkan ke database Supabase
  const { error } = await supabase
    .from('transactions')
    .insert([
      {
        wallet_id,
        category_id,
        amount,
        transaction_date,
        notes,
      }
    ])

  if (error) {
    console.error("Gagal mencatat transaksi:", error)
    throw new Error('Gagal mencatat transaksi')
  }

  // Refresh halaman agar saldo dan daftar transaksi langsung terupdate
  revalidatePath('/')
}