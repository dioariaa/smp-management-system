// src/services/adminKelasService.js
import { supabase } from '../supabase/supabaseClient'

export const fetchClasses = async () => {
  const { data, error } = await supabase
    .from('classes')
    .select(`
      id,
      nama,
      wali_guru_id,
      wali:wali_guru_id ( id, first_name, last_name, nip )
    `)
    .order('nama', { ascending: true })

  if (error) {
    console.error('fetchClasses error:', error)
    throw error
  }

  return data || []
}

export const fetchGurusForDropdown = async () => {
  const { data, error } = await supabase
    .from('gurus')
    .select('id, first_name, last_name, nip')
    .order('first_name', { ascending: true })

  if (error) {
    console.error('fetchGurusForDropdown error:', error)
    throw error
  }

  return data || []
}

export const createClass = async (payload) => {
  const { data, error } = await supabase
    .from('classes')
    .insert(payload)
    .select()
    .single()

  if (error) {
    console.error('createClass error:', error)
    throw error
  }

  return data
}

export const updateClass = async (id, payload) => {
  const { data, error } = await supabase
    .from('classes')
    .update(payload)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('updateClass error:', error)
    throw error
  }

  return data
}

export const deleteClass = async (id) => {
  const { error } = await supabase
    .from('classes')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('deleteClass error:', error)
    throw error
  }
}
