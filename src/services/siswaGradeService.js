// src/services/siswaGradeService.js
import { supabase } from '../supabase/supabaseClient'

// Ambil semua nilai milik siswa berdasarkan auth user
export const fetchSiswaGrades = async (userId) => {
  if (!userId) return { siswaId: null, grades: [] }

  // Cari siswa_id dari user_id
  const { data: siswa, error: siswaError } = await supabase
    .from('siswas')
    .select('id')
    .eq('user_id', userId)
    .single()

  if (siswaError || !siswa) {
    console.error('fetchSiswaGrades siswaError:', siswaError)
    throw new Error('Data siswa tidak ditemukan')
  }

  const siswaId = siswa.id

  // Ambil nilai + info guru
  const { data, error } = await supabase
    .from('grades')
    .select(`
      id,
      mapel,
      nilai,
      tanggal,
      guru:guru_id ( first_name, last_name )
    `)
    .eq('siswa_id', siswaId)
    .order('tanggal', { ascending: false })

  if (error) {
    console.error('fetchSiswaGrades error:', error)
    throw error
  }

  return {
    siswaId,
    grades: data || [],
  }
}
