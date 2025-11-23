// src/services/adminGuruService.js
import { supabase } from '../supabase/supabaseClient'

export const fetchGurus = async () => {
  const { data, error } = await supabase
    .from('gurus')
    .select('id, user_id, nip, first_name, last_name, email, phone, status')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('fetchGurus error:', error)
    throw error
  }

  return data || []
}

export const createGuru = async (payload) => {
  // Di sini kita cuma buat profile gurunya.
  // Pembuatan akun auth+users bisa lo sambungin nanti kalau mau.
  const { data, error } = await supabase
    .from('gurus')
    .insert(payload)
    .select()
    .single()

  if (error) {
    console.error('createGuru error:', error)
    throw error
  }

  return data
}

export const updateGuru = async (id, payload) => {
  const { data, error } = await supabase
    .from('gurus')
    .update(payload)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('updateGuru error:', error)
    throw error
  }

  return data
}

export const deleteGuru = async (id) => {
  const { error } = await supabase
    .from('gurus')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('deleteGuru error:', error)
    throw error
  }
}
