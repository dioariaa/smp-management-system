import { supabase } from '../supabase/supabaseClient'

// ===============================
// Ambil info guru berdasarkan user_id
// ===============================
export async function fetchGuruInfo(userId) {
  const { data, error } = await supabase
    .from('gurus')
    .select('id, first_name, last_name, email, nip')
    .eq('user_id', userId)
    .single()

  if (error) console.error('fetchGuruInfo error:', error)
  return data
}


// ===============================
// Ambil semua kelas yang diawalikan atau diajar guru
// ===============================
export async function fetchGuruClasses(guruId) {
  const { data, error } = await supabase
    .from('kelas')
    .select('id, nama, wali_id')
    .or(`wali_id.eq.${guruId}`)

  if (error) console.error('fetchGuruClasses error:', error)
  return data || []
}


// ===============================
// Ambil Jadwal Mengajar
// ===============================
export async function fetchTeachingSchedule(guruId) {
  const { data, error } = await supabase
    .from('jadwal')
    .select(`
      id,
      hari,
      jam_mulai,
      jam_selesai,
      mapel,
      ruangan,
      kelas:kelas_id(nama)
    `)
    .eq('guru_id', guruId)
    .order('hari')
    .order('jam_mulai')

  if (error) console.error('fetchTeachingSchedule error:', error)
  return data || []
}


// ===============================
// Ambil daftar siswa dalam kelas tertentu
// ===============================
export async function fetchStudentsInClass(kelasId) {
  const { data, error } = await supabase
    .from('siswas')
    .select('id, first_name, last_name')
    .eq('kelas_id', kelasId)

  if (error) console.error('fetchStudentsInClass error:', error)
  return data || []
}


// ===============================
// Ambil absensi terbaru untuk dashboard guru
// ===============================
export async function fetchRecentAbsensi(guruId) {
  const { data, error } = await supabase
    .from('attendance')
    .select(`
      id,
      tanggal,
      status,
      kelas:kelas_id(nama)
    `)
    .eq('guru_id', guruId)
    .order('tanggal', { ascending: false })
    .limit(5)

  if (error) console.error('fetchRecentAbsensi error:', error)
  return data || []
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
  const { data, error } = await supabase
    .from('grades')
    .select(`
      id,
      nilai,
      siswa:siswa_id(first_name, last_name),
      mapel
    `)
    .eq('guru_id', guruId)

  if (error) console.error('fetchGradesForGuru error:', error)
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
  const { data, error } = await supabase
    .from('jadwal')
    .select('mapel')
    .eq('guru_id', guruId)
    .group('mapel')

  if (error) console.error('fetchGuruSubjects error:', error)
  return data?.map((row) => row.mapel) || []
}
