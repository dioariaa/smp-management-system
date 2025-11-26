// src/services/guruService.js
import { supabase } from '../supabase/supabaseClient'

// ===============================
// Ambil info guru berdasarkan user_id
// ===============================
export async function fetchGuruInfo(userId) {
  if (!userId) return null

  const { data, error } = await supabase
    .from('gurus')
    .select('id, first_name, last_name, email, nip')
    .eq('user_id', userId)
    .maybeSingle()

  // PGRST116 = "The result contains 0 rows" → artinya belum ada profil guru
  if (error && error.code !== 'PGRST116') {
    console.error('fetchGuruInfo error:', error)
    throw new Error('Gagal mengambil data guru.')
  }

  // kalau null, biarkan caller yang putuskan mau tampilkan apa
  return data || null
}

// ===============================
// Ambil semua kelas yang diawalikan / diajar guru
// ===============================
export async function fetchGuruClasses(guruId) {
  if (!guruId) return []

  const { data, error } = await supabase
    .from('jadwal')
    .select(`
      id,
      kelas:kelas_id (
        id,
        nama
      )
    `)
    .eq('guru_id', guruId)

  if (error) {
    console.error('fetchGuruClasses error:', error)
    throw new Error('Gagal mengambil data kelas guru.')
  }

  const kelasMap = new Map()
  ;(data || []).forEach((row) => {
    if (row.kelas?.id) {
      kelasMap.set(row.kelas.id, row.kelas.nama || `Kelas ${row.kelas.id.slice(0, 4)}`)
    }
  })

  return Array.from(kelasMap.entries()).map(([id, nama]) => ({ id, nama }))
}

// ===============================
// Ambil Jadwal Mengajar
// ===============================
export async function fetchTeachingSchedule(guruId) {
  if (!guruId) return []

  const { data, error } = await supabase
    .from('jadwal')
    .select(`
      id,
      hari,
      jam_mulai,
      jam_selesai,
      mapel,
      ruangan,
      kelas:kelas_id ( id, nama )
    `)
    .eq('guru_id', guruId)
    .order('hari')
    .order('jam_mulai')

  if (error) {
    console.error('fetchTeachingSchedule error:', error)
    throw new Error('Gagal mengambil jadwal mengajar.')
  }

  return data || []
}

// ===============================
// Ambil daftar siswa dalam kelas tertentu
// ===============================
export async function fetchStudentsInClass(kelasId) {
  if (!kelasId) return []

  const { data, error } = await supabase
    .from('siswas')
    .select('id, first_name, last_name, nisn')
    .eq('kelas_id', kelasId)
    .order('first_name', { ascending: true })

  if (error) {
    console.error('fetchStudentsInClass error:', error)
    throw new Error('Gagal mengambil daftar siswa.')
  }

  return data || []
}

// ===============================
// Ambil absensi terbaru untuk dashboard guru
// ===============================
export async function fetchRecentAbsensi(guruId) {
  if (!guruId) return []

  try {
    const { data, error } = await supabase
      .from('attendance')
      .select(`
        id,
        date,
        status,
        kelas:kelas_id (
          id,
          nama
        )
      `)
      .eq('guru_id', guruId)
      .order('date', { ascending: false })
      .limit(5)

    if (error) {
      console.error('fetchRecentAbsensi error:', error)
      throw new Error('Gagal mengambil data absensi terbaru.')
    }

    return data || []
  } catch (err) {
    console.error('fetchRecentAbsensi fatal error:', err)
    return []
  }
}

// ===============================
// Simpan absen siswa
// ===============================
export async function saveAttendance(payload) {
  const { data, error } = await supabase.from('attendance').insert(payload)

  if (error) {
    console.error('saveAttendance error:', error)
    return { success: false, error }
  }

  return { success: true, data }
}

// ===============================
// Ambil nilai siswa berdasarkan guru
// ===============================
export async function fetchGradesForGuru(guruId) {
  if (!guruId) return []

  const { data, error } = await supabase
    .from('grades')
    .select(`
      id,
      nilai,
      mapel,
      siswa:siswa_id ( first_name, last_name )
    `)
    .eq('guru_id', guruId)

  if (error) {
    console.error('fetchGradesForGuru error:', error)
    throw new Error('Gagal mengambil data nilai.')
  }

  return data || []
}

// ===============================
// Simpan nilai siswa
// ===============================
export async function saveGrade(payload) {
  const { data, error } = await supabase.from('grades').insert(payload)

  if (error) {
    console.error('saveGrade error:', error)
    return { success: false, error }
  }

  return { success: true, data }
}

// ===============================
// Ambil daftar mapel yang diajar guru
// ===============================
export async function fetchGuruSubjects(guruId) {
  if (!guruId) return []

  const { data, error } = await supabase
    .from('jadwal')
    .select('mapel')
    .eq('guru_id', guruId)
    .group('mapel')

  if (error) {
    console.error('fetchGuruSubjects error:', error)
    throw new Error('Gagal mengambil daftar mata pelajaran guru.')
  }

  return data?.map((row) => row.mapel) || []
}
