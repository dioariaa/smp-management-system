import { supabase } from '../../supabase/supabaseClient'

/**
 * Role-based attendance fetch:
 * - Admin → semua siswa
 * - Guru  → kelas yang dia ajar
 * - Siswa → hanya diri sendiri
 * - Ortu  → anaknya
 */

export const getAttendance = async ({ role, userId, date }) => {
  let query = supabase
    .from('attendance')
    .select(`
      id, status, date,
      siswa:siswa_id(first_name, last_name, nisn),
      kelas:kelas_id(nama)
    `)

  // filter by date (opsional, default today)
  if (date) {
    query = query.eq('date', date)
  }

  switch (role) {
    case 'guru':
      // Guru hanya boleh lihat siswa yang dia ajar
      query = query.eq('guru_id', userId)
      break

    case 'siswa':
      query = query.eq('siswa_id', userId)
      break

    case 'ortu':
      const { data: relation } = await supabase
        .from('ortu')
        .select('siswa_id')
        .eq('user_id', userId)
        .single()

      if (!relation) return []
      query = query.eq('siswa_id', relation.siswa_id)
      break

    case 'admin':
    default:
      break // full access
  }

  const { data, error } = await query.order('created_at', { ascending: false })

  if (error) {
    console.error('getAttendance error:', error)
    return []
  }

  return data || []
}


/**
 * Create/update attendance for a student per day.
 * Only guru AND admin can modify.
 */
export const saveAttendance = async ({ role, payload }) => {
  if (!['admin', 'guru'].includes(role)) {
    throw new Error('You do not have permission to modify attendance.')
  }

  const { data, error } = await supabase
    .from('attendance')
    .upsert(payload)
    .select()

  if (error) throw error
  return data
}
