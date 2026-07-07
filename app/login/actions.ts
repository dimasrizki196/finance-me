// app/login/actions.ts
'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function login(formData: FormData) {
  const supabase = await createClient()
  
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    // Jika gagal login, arahkan ke halaman error atau kembali ke login (bisa dikembangkan nanti)
    redirect('/login?error=true')
  }

  // Jika berhasil, perbarui tampilan dan arahkan ke halaman utama (dashboard)
  revalidatePath('/', 'layout')
  redirect('/')
}