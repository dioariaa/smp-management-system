// src/services/guruAttendanceService.js
import { supabase } from '../supabase/supabaseClient'

// Ambil kelas (sekarang simple: semua kelas)
export const fetchGuruClasses = async () => {
  const { data, error } = await supabase
    .from('classes')
    .select('id, nama')
    .order('nama', { ascending: true })

  if (error) {
    console.error('fetchGuruClasses error:', error)
    throw error
  }

  return data || []
}

// Ambil siswa berdasarkan kelas
export const fetchStudentsByClass = async (kelasId) => {
  if (!kelasId) return []
  const { data, error } = await supabase
    .from('siswas')
    .select('id, first_name, last_name, nisn')
    .eq('kelas_id', kelasId)
    .order('first_name', { ascending: true })

  if (error) {
    console.error('fetchStudentsByClass error:', error)
    throw error
  }

  return data || []
}

// Ambil absensi yang sudah tercatat untuk kelas + tanggal
export const fetchAttendanceByClassAndDate = async (kelasId, date) => {
  if (!kelasId || !date) return []

  const { data, error } = await supabase
    .from('attendance')
    .select('id, siswa_id, status')
    .eq('kelas_id', kelasId)
    .eq('date', date)

  if (error) {
    console.error('fetchAttendanceByClassAndDate error:', error)
    throw error
  }

  return data || []
}

// Simpan absensi: satu per siswa (insert/update)
export const saveAttendanceForClass = async ({ userId, kelasId, date, items }) => {
  if (!userId || !kelasId || !date || !Array.isArray(items)) {
    throw new Error('Parameter absensi tidak lengkap')
  }

  // ambil guru_id dari user_id
  const { data: guruRow, error: guruError } = await supabase
    .from('gurus')
    .select('id')
    .eq('user_id', userId)
    .single()

  if (guruError || !guruRow) {
    console.error('saveAttendanceForClass guruError:', guruError)
    throw new Error('Data guru tidak ditemukan')
  }

  const guruId = guruRow.id

  // brute force: untuk setiap siswa, cek ada record → update, kalau tidak → insert
  for (const item of items) {
    if (!item.siswa_id || !item.status) continue

    const { data: existing, error: existingError } = await supabase
      .from('attendance')
      .select('id')
      .eq('siswa_id', item.siswa_id)
      .eq('date', date)
      .single()

    if (existingError && existingError.code !== 'PGRST116') {
      console.error('check existing attendance error:', existingError)
      continue
    }

    if (existing) {
      // update
      const { error: updateError } = await supabase
        .from('attendance')
        .update({
          status: item.status,
          kelas_id: kelasId,
          guru_id: guruId,
        })
        .eq('id', existing.id)

      if (updateError) {
        console.error('update attendance error:', updateError)
      }
    } else {
      // insert
      const { error: insertError } = await supabase
        .from('attendance')
        .insert({
          siswa_id: item.siswa_id,
          kelas_id: kelasId,
          guru_id: guruId,
          date,
          status: item.status,
        })

      if (insertError) {
        console.error('insert attendance error:', insertError)
      }
    }
  }
}
