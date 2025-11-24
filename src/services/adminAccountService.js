// src/services/adminAccountService.js
import { supabase } from '../supabase/supabaseClient'

export const adminCreateGuruAccount = async ({ nip, email, password }) => {
  // 1. cari guru by NIP
  const { data: guru, error: guruError } = await supabase
    .from('gurus')
    .select('id, user_id')
    .eq('nip', nip)
    .single()

  if (guruError || !guru) {
    throw new Error('Guru dengan NIP tersebut tidak ditemukan.')
  }

  if (guru.user_id) {
    throw new Error('Guru ini sudah punya akun.')
  }

  // 2. buat akun auth
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: email.trim().toLowerCase(),
    password
  })

  if (authError) {
    console.error('auth.signUp error:', authError)
    throw new Error(authError.message || 'Gagal membuat akun auth untuk guru')
  }

  if (!authData.user) {
    throw new Error('Gagal membuat akun pengguna (user kosong).')
  }

  const authUserId = authData.user.id

  // 3. insert ke tabel users dengan role guru
  const { error: userError } = await supabase
    .from('users')
    .insert({
      id: authUserId,
      email: email.trim().toLowerCase(),
      role: 'guru',
      status: 'active'
    })

  if (userError) {
    console.error('insert users error:', userError)
    throw new Error('Gagal menyimpan data akun guru di tabel users.')
  }

  // 4. update tabel gurus: sambungkan user_id + email
  const { error: guruUpdateError } = await supabase
    .from('gurus')
    .update({
      user_id: authUserId,
      email: email.trim().toLowerCase()
    })
    .eq('id', guru.id)

  if (guruUpdateError) {
    console.error('update gurus error:', guruUpdateError)
    throw new Error('Gagal menghubungkan akun guru dengan profil gurunya.')
  }

  return { success: true }
}
