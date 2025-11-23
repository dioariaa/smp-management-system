// src/services/siswaAttendanceService.js
import { supabase } from '../supabase/supabaseClient'

// Ambil semua absensi siswa per bulan
export const fetchSiswaAttendanceByMonth = async (userId, year, month) => {
  if (!userId || !year || !month) return { siswaId: null, records: [] }

  // Cari siswa_id dari user_id
  const { data: siswa, error: siswaError } = await supabase
    .from('siswas')
    .select('id')
    .eq('user_id', userId)
    .single()

  if (siswaError || !siswa) {
    console.error('fetchSiswaAttendanceByMonth siswaError:', siswaError)
    throw new Error('Data siswa tidak ditemukan')
  }

  const siswaId = siswa.id

  // Range tanggal bulan tsb
  const start = new Date(year, month - 1, 1)
  const end = new Date(year, month, 0) // last day of month

  const startStr = start.toISOString().slice(0, 10)
  const endStr = end.toISOString().slice(0, 10)

  const { data, error } = await supabase
    .from('attendance')
    .select('id, date, status')
    .eq('siswa_id', siswaId)
    .gte('date', startStr)
    .lte('date', endStr)
    .order('date', { ascending: true })

  if (error) {
    console.error('fetchSiswaAttendanceByMonth error:', error)
    throw error
  }

  return {
    siswaId,
    records: data || [],
  }
}
