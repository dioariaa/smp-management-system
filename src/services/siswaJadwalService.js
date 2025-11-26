// src/services/siswaJadwalService.js
import { supabase } from '../supabase/supabaseClient'

export const fetchSiswaSchedule = async (userId) => {
  if (!userId) return []

  // cari kelas_id dari siswa
  const { data: siswa, error: siswaError } = await supabase
    .from('siswas')
    .select('kelas_id')
    .eq('user_id', userId)
    .maybeSingle() // <--- anti 406

  if (siswaError && siswaError.code !== 'PGRST116') {
    console.error('fetchSiswaSchedule siswaError:', siswaError)
    throw new Error('Gagal mengambil data siswa')
  }

  if (!siswa) {
    throw new Error('Data siswa tidak ditemukan')
  }

  const kelasId = siswa.kelas_id
  if (!kelasId) return [] // siswa belum punya kelas → jadwal kosong

  const { data, error } = await supabase
    .from('jadwal')
    .select(`
      id,
      hari,
      jam_mulai,
      jam_selesai,
      mapel,
      ruangan,
      guru:guru_id (
        first_name,
        last_name
      )
    `)
    .eq('kelas_id', kelasId)
    .order('hari', { ascending: true })
    .order('jam_mulai', { ascending: true })

  if (error) {
    console.error('fetchSiswaSchedule error:', error)
    throw new Error('Gagal mengambil jadwal siswa')
  }

  return data || []
}
