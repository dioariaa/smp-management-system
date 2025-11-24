// src/services/adminGuruService.js
import { supabase } from '../supabase/supabaseClient'

export const fetchGurus = async () => {
  const { data, error } = await supabase
    .from('gurus')
    .select('id, user_id, nip, first_name, last_name, email, phone, status, mapel')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('fetchGurus error:', error)
    throw error
  }

  return data || []
}

export const createGuru = async (payload) => {
  // payload harus sudah mengandung:
  // nip, first_name, last_name, email, phone, status, mapel
  const { data, error } = await supabase
    .from('gurus')
    .insert({
      nip: payload.nip,
      first_name: payload.first_name,
      last_name: payload.last_name,
      email: payload.email,
      phone: payload.phone,
      status: payload.status,
      mapel: payload.mapel,       // <--- penting
    })
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
    .update({
      nip: payload.nip,
      first_name: payload.first_name,
      last_name: payload.last_name,
      email: payload.email,
      phone: payload.phone,
      status: payload.status,
      mapel: payload.mapel,       // <--- penting
    })
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
