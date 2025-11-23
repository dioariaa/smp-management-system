// src/services/adminSiswaService.js
import { supabase } from '../supabase/supabaseClient'

// ambil semua kelas (buat dropdown)
export const fetchClasses = async () => {
  const { data, error } = await supabase
    .from('classes')
    .select('id, nama')
    .order('nama', { ascending: true })

  if (error) {
    console.error('fetchClasses error:', error)
    throw error
  }

  return data || []
}

// ambil siswa + nama kelas
export const fetchSiswas = async () => {
  const { data, error } = await supabase
    .from('siswas')
    .select(`
      id,
      user_id,
      nisn,
      first_name,
      last_name,
      email,
      phone,
      status,
      kelas_id,
      kelas:kelas_id (
        id,
        nama
      )
    `)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('fetchSiswas error:', error)
    throw error
  }

  return data || []
}

export const createSiswa = async (payload) => {
  const { data, error } = await supabase
    .from('siswas')
    .insert(payload)
    .select()
    .single()

  if (error) {
    console.error('createSiswa error:', error)
    throw error
  }

  return data
}

export const updateSiswa = async (id, payload) => {
  const { data, error } = await supabase
    .from('siswas')
    .update(payload)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('updateSiswa error:', error)
    throw error
  }

  return data
}

export const deleteSiswa = async (id) => {
  const { error } = await supabase
    .from('siswas')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('deleteSiswa error:', error)
    throw error
  }
}
